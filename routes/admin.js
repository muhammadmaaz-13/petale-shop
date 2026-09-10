const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const db = require('../utils/db');

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadDir = isServerless
  ? path.join('/tmp', 'petale-uploads')
  : path.join(__dirname, '..', 'public', 'uploads');

try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (err) {
  console.error('Could not create upload directory:', err.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeName = 'prod_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp|gif/i.test(path.extname(file.originalname));
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  }
});

function requireAdmin(req, res, next) {
  if (req.session.admin) return next();
  return res.redirect('/admin/login');
}

function uploadedPublicPath(filename) {
  // On Vercel, /tmp files are not publicly served; store a data URL path only for local.
  // Local uploads live under /public/uploads and are served by Express/static hosting.
  return '/uploads/' + filename;
}

// Serve serverless uploads from /tmp when requested
if (isServerless) {
  router.get('/uploads/:file', (req, res) => {
    const filePath = path.join(uploadDir, path.basename(req.params.file));
    if (!fs.existsSync(filePath)) return res.status(404).end();
    return res.sendFile(filePath);
  });
}

// ---------- LOGIN ----------
router.get('/login', (req, res) => {
  if (req.session.admin) return res.redirect('/admin/dashboard');
  res.render('admin/login', { title: 'Admin login — Petalé', error: null, layout: false });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === config.admin.username && password === config.admin.password) {
    req.session.admin = true;
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { title: 'Admin login — Petalé', error: 'Incorrect username or password.' });
});

router.get('/logout', (req, res) => {
  req.session.admin = false;
  res.redirect('/admin/login');
});

// ---------- DASHBOARD ----------
router.get('/dashboard', requireAdmin, (req, res) => {
  const products = db.getAllProducts();
  res.render('admin/dashboard', {
    title: 'Dashboard — Petalé admin',
    products,
    saved: req.query.saved || null
  });
});

// ---------- NEW PRODUCT ----------
router.get('/products/new', requireAdmin, (req, res) => {
  res.render('admin/product-form', {
    title: 'Add product — Petalé admin',
    product: null,
    error: null
  });
});

const uploadFields = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'image2', maxCount: 1 }]);

router.post('/products/new', requireAdmin, uploadFields, (req, res) => {
  const data = { ...req.body, featured: req.body.featured === 'on', onSale: req.body.onSale === 'on' };
  if (req.files && req.files.image) {
    data.image = isServerless
      ? '/admin/uploads/' + req.files.image[0].filename
      : uploadedPublicPath(req.files.image[0].filename);
  }
  if (req.files && req.files.image2) {
    data.image2 = isServerless
      ? '/admin/uploads/' + req.files.image2[0].filename
      : uploadedPublicPath(req.files.image2[0].filename);
  }
  db.createProduct(data);
  res.redirect('/admin/dashboard?saved=created');
});

// ---------- EDIT PRODUCT ----------
router.get('/products/:id/edit', requireAdmin, (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.redirect('/admin/dashboard');
  res.render('admin/product-form', {
    title: 'Edit product — Petalé admin',
    product,
    error: null
  });
});

router.post('/products/:id/edit', requireAdmin, uploadFields, (req, res) => {
  const data = { ...req.body, featured: req.body.featured === 'on', onSale: req.body.onSale === 'on' };
  if (req.files && req.files.image) {
    data.image = isServerless
      ? '/admin/uploads/' + req.files.image[0].filename
      : uploadedPublicPath(req.files.image[0].filename);
  }
  if (req.files && req.files.image2) {
    data.image2 = isServerless
      ? '/admin/uploads/' + req.files.image2[0].filename
      : uploadedPublicPath(req.files.image2[0].filename);
  }
  db.updateProduct(req.params.id, data);
  res.redirect('/admin/dashboard?saved=updated');
});

// ---------- DELETE PRODUCT ----------
router.post('/products/:id/delete', requireAdmin, (req, res) => {
  db.deleteProduct(req.params.id);
  res.redirect('/admin/dashboard?saved=deleted');
});

module.exports = router;
