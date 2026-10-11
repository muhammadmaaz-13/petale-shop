// Simple file-based "database" for products and orders.
// On Vercel the deploy filesystem is read-only, so writable copies live in /tmp.
const fs = require('fs');
const path = require('path');

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const SEED_PRODUCTS = path.join(__dirname, '..', 'data', 'products.json');
const SEED_ORDERS = path.join(__dirname, '..', 'data', 'orders.json');
const DB_PATH = isServerless ? path.join('/tmp', 'petale-products.json') : SEED_PRODUCTS;
const ORDERS_PATH = isServerless ? path.join('/tmp', 'petale-orders.json') : SEED_ORDERS;

function ensureWritableFile(targetPath, seedPath, fallback) {
  if (!isServerless) return;
  if (fs.existsSync(targetPath)) return;
  try {
    const seed = fs.existsSync(seedPath)
      ? fs.readFileSync(seedPath, 'utf-8')
      : fallback;
    fs.writeFileSync(targetPath, seed, 'utf-8');
  } catch (err) {
    // Leave read path to fall back to seed.
  }
}

function readJson(targetPath, seedPath, fallback) {
  try {
    ensureWritableFile(targetPath, seedPath, fallback);
    const source = fs.existsSync(targetPath) ? targetPath : seedPath;
    const raw = fs.readFileSync(source, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return JSON.parse(fallback);
  }
}

function writeJson(targetPath, data) {
  try {
    ensureWritableFile(targetPath, targetPath, JSON.stringify(data, null, 2));
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist data (filesystem may be read-only):', err.message);
  }
}

function readAll() {
  return readJson(DB_PATH, SEED_PRODUCTS, '[]');
}

function writeAll(products) {
  writeJson(DB_PATH, products);
}

function getAllProducts() {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

function getFeaturedProducts(limit = 6) {
  const all = readAll();
  const featured = all.filter(p => p.featured);
  const pool = featured.length ? featured : all;
  return pool.slice(0, limit);
}

function getProductById(id) {
  return readAll().find(p => p.id === id);
}

function getProductsByCategory(category) {
  const all = readAll();
  if (!category || category === 'all') return all;
  return all.filter(p => p.category === category);
}

function getCategories() {
  const all = readAll();
  return [...new Set(all.map(p => p.category).filter(Boolean))];
}

function createProduct(data) {
  const products = readAll();
  const id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const product = {
    id,
    name: data.name || 'Untitled product',
    tag: data.tag || '',
    category: data.category || 'uncategorized',
    price: parseFloat(data.price) || 0,
    stock: parseInt(data.stock, 10) || 0,
    description: data.description || '',
    image: data.image || '',
    image2: data.image2 || '',
    accentColor: data.accentColor || '#F2A6C6',
    featured: !!data.featured,
    onSale: !!data.onSale,
    compareAtPrice: data.compareAtPrice ? parseFloat(data.compareAtPrice) : null,
    rating: data.rating !== undefined && data.rating !== '' ? parseFloat(data.rating) : 4.8,
    reviewCount: data.reviewCount !== undefined && data.reviewCount !== '' ? parseInt(data.reviewCount, 10) : 0,
    isDemo: false,
    createdAt: Date.now()
  };
  products.push(product);
  writeAll(products);
  return product;
}

function updateProduct(id, data) {
  const products = readAll();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const existing = products[idx];
  const updated = {
    ...existing,
    name: data.name ?? existing.name,
    tag: data.tag ?? existing.tag,
    category: data.category ?? existing.category,
    price: data.price !== undefined ? parseFloat(data.price) : existing.price,
    stock: data.stock !== undefined ? parseInt(data.stock, 10) : existing.stock,
    description: data.description ?? existing.description,
    image: data.image || existing.image,
    image2: data.image2 || existing.image2 || '',
    accentColor: data.accentColor ?? existing.accentColor,
    featured: data.featured !== undefined ? !!data.featured : existing.featured,
    onSale: data.onSale !== undefined ? !!data.onSale : existing.onSale,
    compareAtPrice: data.compareAtPrice !== undefined
      ? (data.compareAtPrice ? parseFloat(data.compareAtPrice) : null)
      : existing.compareAtPrice,
    rating: data.rating !== undefined && data.rating !== '' ? parseFloat(data.rating) : existing.rating,
    reviewCount: data.reviewCount !== undefined && data.reviewCount !== '' ? parseInt(data.reviewCount, 10) : existing.reviewCount,
    isDemo: false
  };
  products[idx] = updated;
  writeAll(products);
  return updated;
}

function deleteProduct(id) {
  const products = readAll();
  const filtered = products.filter(p => p.id !== id);
  writeAll(filtered);
  return filtered.length !== products.length;
}

// ---------------- ORDERS ----------------
function readOrders() {
  return readJson(ORDERS_PATH, SEED_ORDERS, '[]');
}

function writeOrders(orders) {
  writeJson(ORDERS_PATH, orders);
}

function getAllOrders() {
  return readOrders().sort((a, b) => b.createdAt - a.createdAt);
}

function getOrderById(id) {
  return readOrders().find(o => o.id === id);
}

function getOrderCounts() {
  const orders = readOrders();
  return {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    fulfilled: orders.filter(o => o.status === 'fulfilled').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };
}

function createOrder(data) {
  const orders = readOrders();
  const id = 'PTL-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  const order = {
    id,
    createdAt: Date.now(),
    status: 'pending', // pending -> fulfilled | cancelled
    paymentMethod: data.paymentMethod || 'cod',
    customer: {
      fullName: data.fullName || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      province: data.province || ''
    },
    items: data.items || [], // [{ productId, name, price, qty, lineTotal }]
    total: data.total || 0
  };
  orders.push(order);
  writeOrders(orders);
  return order;
}

function updateOrderStatus(id, status) {
  const orders = readOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  orders[idx].status = status;
  writeOrders(orders);
  return orders[idx];
}

module.exports = {
  getAllProducts,
  getFeaturedProducts,
  getProductById,
  getProductsByCategory,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  getOrderById,
  getOrderCounts,
  createOrder,
  updateOrderStatus
};
