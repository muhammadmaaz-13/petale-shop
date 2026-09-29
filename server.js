const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config');

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const db = require('./utils/db');

const app = express();

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 6, // 6 hours
    secure: config.isProd,
    sameSite: 'lax'
  }
}));

// Make cart count, admin status, categories and site config available in every view
app.use((req, res, next) => {
  const cart = req.session.cart || {};
  res.locals.cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  res.locals.isAdmin = !!(req.session.admin);
  res.locals.currentPath = req.path;
  res.locals.allCategories = db.getCategories();
  res.locals.siteConfig = {
    announcements: config.announcements,
    freeShippingThreshold: config.freeShippingThreshold,
    chatLink: config.chatLink,
    phone: config.phone,
    contactEmail: config.contactEmail,
    paymentMethods: config.paymentMethods
  };
  // Sensible fallback so any page that forgets to set its own <meta description>
  // still ships with one, rather than a blank/duplicate tag.
  res.locals.metaDescription = config.defaultMetaDescription;
  next();
});

app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page not found — Petalé',
    metaDescription: "The page you're looking for doesn't exist or may have moved."
  });
});

// ---------- 500 / unexpected errors ----------
// Any error thrown or passed to next(err) in a route ends up here instead of
// crashing the process or leaking a raw stack trace to the visitor.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).render('500', {
    title: 'Something went wrong — Petalé',
    metaDescription: 'An unexpected error occurred.'
  });
});

// Local / traditional Node hosts listen; Vercel imports the app as a serverless handler.
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Petalé running at http://localhost:${config.port}`);
    console.log(`Admin panel at   http://localhost:${config.port}/admin/login`);
  });
}

module.exports = app;
