// Prefer environment variables in production (Vercel / GitHub deploy).
const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

module.exports = {
  isProd,
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'petale2026'
  },
  sessionSecret: process.env.SESSION_SECRET || 'petale-secret-change-me',
  port: process.env.PORT || 3000,

  // Public site URL — used to build robots.txt / sitemap.xml / canonical links.
  siteUrl: process.env.SITE_URL || 'https://petale-shop.vercel.app',

  // Rotating messages in the top announcement bar
  announcements: [
    '✨ 20% off your first order — code GLOW20',
    '🚚 Free shipping on orders over $50',
    '🌸 Small-batch, cruelty-free, made fresh monthly'
  ],

  // Used for the free-shipping progress bar in the cart drawer
  freeShippingThreshold: 50,

  // Floating "chat with us" bubble — point this at whatever you actually use
  // (WhatsApp link, Instagram DM, mailto:, or leave it pointing at /contact)
  chatLink: '/contact',

  // Click-to-call phone number. Displayed formatted, dialed via the "tel" value.
  phone: {
    display: '+1 (555) 123-4567',
    tel: '+15551234567'
  },

  contactEmail: 'hello@petale.example',

  // Only Cash on Delivery is offered for now. To add another method later,
  // add an entry here AND handle it in the checkout route in routes/public.js.
  paymentMethods: {
    cod: { enabled: true, label: 'Cash on Delivery (COD)' }
  },

  // Default meta description used when a page doesn't set its own.
  defaultMetaDescription: 'Petalé — small-batch, cruelty-free botanical skincare. Shop cleansers, serums and moisturizers formulated for skin that changes with the seasons.'
};
