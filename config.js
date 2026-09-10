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
  chatLink: '/contact'
};
