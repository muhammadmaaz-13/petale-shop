const express = require('express');
const router = express.Router();
const db = require('../utils/db');

function getCartDetails(session) {
  const cart = session.cart || {};
  const items = Object.entries(cart).map(([id, qty]) => {
    const product = db.getProductById(id);
    if (!product) return null;
    return { product, qty, lineTotal: +(product.price * qty).toFixed(2) };
  }).filter(Boolean);
  const total = +items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);
  return { items, total };
}

// ---------- HOME ----------
router.get('/', (req, res) => {
  const featured = db.getFeaturedProducts(6);
  res.render('index', {
    title: 'Petalé — Skincare that blooms with you',
    featured
  });
});

// ---------- SHOP ----------
router.get('/shop', (req, res) => {
  const category = req.query.category || 'all';
  const q = (req.query.q || '').trim().toLowerCase();
  let products = db.getProductsByCategory(category);
  if (q) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }
  const categories = db.getCategories();
  res.render('shop', {
    title: 'Shop — Petalé',
    products,
    categories,
    activeCategory: category,
    searchQuery: q
  });
});

// ---------- PRODUCT DETAIL ----------
router.get('/product/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.status(404).render('404', { title: 'Product not found' });
  const related = db.getAllProducts().filter(p => p.id !== product.id && p.category === product.category).slice(0, 3);
  res.render('product', {
    title: product.name + ' — Petalé',
    product,
    related
  });
});

// ---------- ABOUT ----------
router.get('/about', (req, res) => {
  res.render('about', { title: 'About — Petalé' });
});

// ---------- CONTACT ----------
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact — Petalé', sent: false });
});
router.post('/contact', (req, res) => {
  // No email backend wired up yet -- just acknowledge the submission.
  res.render('contact', { title: 'Contact — Petalé', sent: true });
});

// ---------- CART ----------
router.get('/cart', (req, res) => {
  const { items, total } = getCartDetails(req.session);
  res.render('cart', { title: 'Your bag — Petalé', items, total });
});

// JSON snapshot of the cart, used to populate the slide-out drawer
router.get('/cart/data', (req, res) => {
  const { items, total } = getCartDetails(req.session);
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  res.json({ ok: true, items, total, cartCount });
});

router.post('/cart/add/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const qty = Math.max(1, parseInt(req.body && req.body.qty, 10) || 1);
  req.session.cart = req.session.cart || {};
  req.session.cart[product.id] = (req.session.cart[product.id] || 0) + qty;
  const { items, total } = getCartDetails(req.session);
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  res.json({ ok: true, items, total, cartCount });
});

router.post('/cart/update/:id', (req, res) => {
  const delta = parseInt(req.body.delta, 10) || 0;
  req.session.cart = req.session.cart || {};
  const current = req.session.cart[req.params.id] || 0;
  const next = current + delta;
  if (next <= 0) {
    delete req.session.cart[req.params.id];
  } else {
    req.session.cart[req.params.id] = next;
  }
  const { items, total } = getCartDetails(req.session);
  const cartCount = Object.values(req.session.cart).reduce((s, q) => s + q, 0);
  res.json({ ok: true, items, total, cartCount });
});

router.post('/cart/remove/:id', (req, res) => {
  req.session.cart = req.session.cart || {};
  delete req.session.cart[req.params.id];
  const { items, total } = getCartDetails(req.session);
  const cartCount = Object.values(req.session.cart).reduce((s, q) => s + q, 0);
  res.json({ ok: true, items, total, cartCount });
});

router.post('/checkout', (req, res) => {
  // Demo only -- no payment processor connected.
  req.session.cart = {};
  res.render('checkout-success', { title: 'Order received — Petalé' });
});

module.exports = router;
