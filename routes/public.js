const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const config = require('../config');

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
    metaDescription: 'Small-batch, cruelty-free botanical skincare. Shop dermatologist-backed cleansers, serums and moisturizers made fresh monthly.',
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
  const catLabel = category && category !== 'all' ? category.charAt(0).toUpperCase() + category.slice(1) : 'All products';
  res.render('shop', {
    title: (category && category !== 'all' ? catLabel + ' — Shop' : 'Shop') + ' — Petalé',
    metaDescription: `Browse ${catLabel.toLowerCase()} from Petalé — small-batch botanical skincare, formulated and tested on real skin.`,
    products,
    categories,
    activeCategory: category,
    searchQuery: q
  });
});

// ---------- PRODUCT DETAIL ----------
router.get('/product/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).render('404', {
      title: 'Product not found — Petalé',
      metaDescription: "This product doesn't exist or may have been removed."
    });
  }
  const related = db.getAllProducts().filter(p => p.id !== product.id && p.category === product.category).slice(0, 3);
  res.render('product', {
    title: product.name + ' — Petalé',
    metaDescription: (product.description || `${product.name} — shop it at Petalé.`).slice(0, 160),
    product,
    related
  });
});

// ---------- ABOUT ----------
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About — Petalé',
    metaDescription: 'Petalé started as a two-person kitchen experiment. Learn how we formulate small-batch, honestly-labeled skincare.'
  });
});

// ---------- CONTACT ----------
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact — Petalé',
    metaDescription: 'Get in touch with Petalé — questions about ingredients, an order, or a wholesale inquiry.',
    sent: false,
    errors: null,
    values: {}
  });
});
router.post('/contact', (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim();
  const message = (req.body.message || '').trim();
  const errors = {};

  if (!name) errors.name = 'Please enter your name.';
  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "That email address doesn't look right.";
  }
  if (!message) errors.message = "Don't forget to write your message.";

  if (Object.keys(errors).length) {
    return res.status(400).render('contact', {
      title: 'Contact — Petalé',
      metaDescription: 'Get in touch with Petalé — questions about ingredients, an order, or a wholesale inquiry.',
      sent: false,
      errors,
      values: { name, email, message }
    });
  }

  // No email backend wired up yet -- just acknowledge the submission.
  res.render('contact', {
    title: 'Contact — Petalé',
    metaDescription: 'Get in touch with Petalé — questions about ingredients, an order, or a wholesale inquiry.',
    sent: true,
    errors: null,
    values: {}
  });
});

// ---------- PRIVACY POLICY ----------
router.get('/privacy-policy', (req, res) => {
  res.render('privacy-policy', {
    title: 'Privacy Policy — Petalé',
    metaDescription: 'How Petalé collects, uses and protects your personal information.'
  });
});

// ---------- TERMS & CONDITIONS ----------
router.get('/terms', (req, res) => {
  res.render('terms', {
    title: 'Terms & Conditions — Petalé',
    metaDescription: 'Petalé\'s terms of sale, including our no-refund policy and payment terms.'
  });
});

// ---------- CART ----------
router.get('/cart', (req, res) => {
  const { items, total } = getCartDetails(req.session);
  res.render('cart', {
    title: 'Your bag — Petalé',
    metaDescription: 'Review the items in your Petalé bag before checking out.',
    items,
    total,
    emptyCheckoutAttempt: req.query.empty === '1'
  });
});

// JSON snapshot of the cart, used to populate the slide-out drawer
router.get('/cart/data', (req, res) => {
  const { items, total } = getCartDetails(req.session);
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  res.json({ ok: true, items, total, cartCount });
});

const MAX_QTY_PER_ITEM = 99;

// The cart buttons call these routes with fetch() and get JSON back. If one is
// ever submitted as a plain form (JavaScript off), send the visitor back to the
// cart page instead of showing raw JSON.
function wantsJson(req) {
  return req.xhr || (req.headers.accept || '').includes('application/json');
}

function cartResponse(req, res) {
  const { items, total } = getCartDetails(req.session);
  const cartCount = items.reduce((s, i) => s + i.qty, 0);
  if (wantsJson(req)) return res.json({ ok: true, items, total, cartCount });
  return res.redirect('/cart');
}

router.post('/cart/add/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const qty = Math.max(1, parseInt(req.body && req.body.qty, 10) || 1);
  req.session.cart = req.session.cart || {};
  req.session.cart[product.id] = Math.min(MAX_QTY_PER_ITEM, (req.session.cart[product.id] || 0) + qty);
  cartResponse(req, res);
});

router.post('/cart/update/:id', (req, res) => {
  const delta = parseInt(req.body.delta, 10) || 0;
  req.session.cart = req.session.cart || {};
  const current = req.session.cart[req.params.id] || 0;
  if (current > 0) {
    // Plus/minus never removes an item: the minimum is 1 (use Remove for that).
    const next = Math.min(MAX_QTY_PER_ITEM, Math.max(1, current + delta));
    req.session.cart[req.params.id] = next;
  }
  cartResponse(req, res);
});

router.post('/cart/remove/:id', (req, res) => {
  req.session.cart = req.session.cart || {};
  delete req.session.cart[req.params.id];
  cartResponse(req, res);
});

// ---------- CHECKOUT ----------
router.get('/checkout', (req, res) => {
  const { items, total } = getCartDetails(req.session);
  if (items.length === 0) {
    return res.redirect('/cart?empty=1');
  }
  res.render('checkout', {
    title: 'Checkout — Petalé',
    metaDescription: 'Complete your Petalé order. Cash on Delivery available now.',
    items,
    total,
    paymentMethods: config.paymentMethods,
    errors: null,
    values: {}
  });
});

router.post('/checkout', (req, res) => {
  const { items, total } = getCartDetails(req.session);
  if (items.length === 0) {
    return res.redirect('/cart?empty=1');
  }

  const fullName = (req.body.fullName || '').trim();
  const email = (req.body.email || '').trim();
  const phone = (req.body.phone || '').trim();
  const address = (req.body.address || '').trim();
  const city = (req.body.city || '').trim();
  const province = (req.body.province || '').trim();
  const paymentMethod = (req.body.paymentMethod || '').trim();

  const validProvinces = ['Khyber Pakhtunkhwa (KPK)', 'Sindh', 'Punjab', 'Balochistan'];

  const errors = {};
  if (!fullName) errors.fullName = 'Please enter the full name for delivery.';
  if (!email) {
    errors.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "That email address doesn't look right.";
  }
  if (!phone) {
    errors.phone = 'Please enter a phone number so we can reach you about delivery.';
  } else if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    errors.phone = "That phone number doesn't look right.";
  }
  if (!address) errors.address = 'Please enter a delivery address.';
  if (!city) errors.city = 'Please enter a city.';
  if (!province) {
    errors.province = 'Please select a province.';
  } else if (!validProvinces.includes(province)) {
    errors.province = 'Please choose a valid province from the list.';
  }

  if (!paymentMethod) {
    errors.paymentMethod = 'Please select a payment method.';
  } else {
    const method = config.paymentMethods[paymentMethod];
    if (!method || !method.enabled) {
      errors.paymentMethod = 'That payment method is not available yet — please choose Cash on Delivery.';
    }
  }

  if (Object.keys(errors).length) {
    return res.status(400).render('checkout', {
      title: 'Checkout — Petalé',
      metaDescription: 'Complete your Petalé order. Cash on Delivery available now.',
      items,
      total,
      paymentMethods: config.paymentMethods,
      errors,
      values: { fullName, email, phone, address, city, province, paymentMethod }
    });
  }

  // Cash on Delivery is the only live method, so nothing is charged online —
  // the order is saved here so it shows up in the admin dashboard, and the
  // customer pays the courier in cash on delivery.
  const order = db.createOrder({
    fullName,
    email,
    phone,
    address,
    city,
    province,
    paymentMethod,
    total,
    items: items.map(i => ({
      productId: i.product.id,
      name: i.product.name,
      price: i.product.price,
      qty: i.qty,
      lineTotal: i.lineTotal
    }))
  });
  req.session.cart = {};
  res.render('checkout-success', {
    title: 'Order received — Petalé',
    metaDescription: 'Your Petalé order has been received.',
    orderId: order.id,
    total,
    fullName
  });
});

// ---------- ROBOTS.TXT ----------
router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Disallow: /admin',
      'Disallow: /cart',
      'Disallow: /checkout',
      '',
      `Sitemap: ${config.siteUrl}/sitemap.xml`
    ].join('\n')
  );
});

// ---------- SITEMAP.XML ----------
router.get('/sitemap.xml', (req, res) => {
  const staticPaths = ['/', '/shop', '/about', '/contact', '/privacy-policy', '/terms'];
  const products = db.getAllProducts();

  const urls = [
    ...staticPaths.map(p => ({ loc: `${config.siteUrl}${p}`, priority: p === '/' ? '1.0' : '0.7' })),
    ...products.map(p => ({
      loc: `${config.siteUrl}/product/${p.id}`,
      priority: '0.6',
      lastmod: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : undefined
    }))
  ];

  const body = urls.map(u => {
    return [
      '  <url>',
      `    <loc>${u.loc}</loc>`,
      u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : null,
      `    <priority>${u.priority}</priority>`,
      '  </url>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`
  );
});

module.exports = router;
