// Simple file-based "database" for products.
// On Vercel the deploy filesystem is read-only, so writable copies live in /tmp.
const fs = require('fs');
const path = require('path');

const SEED_PATH = path.join(__dirname, '..', 'data', 'products.json');
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DB_PATH = isServerless
  ? path.join('/tmp', 'petale-products.json')
  : SEED_PATH;

function ensureWritableDb() {
  if (!isServerless) return;
  if (fs.existsSync(DB_PATH)) return;
  try {
    const seed = fs.existsSync(SEED_PATH)
      ? fs.readFileSync(SEED_PATH, 'utf-8')
      : '[]';
    fs.writeFileSync(DB_PATH, seed, 'utf-8');
  } catch (err) {
    // Leave read path to fall back to seed.
  }
}

function readAll() {
  try {
    ensureWritableDb();
    const source = fs.existsSync(DB_PATH) ? DB_PATH : SEED_PATH;
    const raw = fs.readFileSync(source, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeAll(products) {
  try {
    ensureWritableDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist products (filesystem may be read-only):', err.message);
  }
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

module.exports = {
  getAllProducts,
  getFeaturedProducts,
  getProductById,
  getProductsByCategory,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct
};
