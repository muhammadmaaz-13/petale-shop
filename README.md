# Petalé — Skincare Shop

A multi-page skincare storefront with a built-in admin dashboard (mini CRM) for managing products — including image uploads — without touching any code.

## What's inside

- **Multi-page site**: Home, Shop (with category filters + search), Product detail pages, About, Contact, Cart, Checkout confirmation.
- **Dynamic product data**: products live in `data/products.json` and are rendered on every page.
- **Admin dashboard** at `/admin/login`: add, edit, and delete products — name, price, sale pricing, star rating, review count, stock, category, and up to two photos (a main image plus an optional "hover" image shown on product cards).
- **Announcement bar**, **"Shop By" mega-menu**, **search overlay**, and a **slide-out cart drawer** with a free-shipping progress bar — the drawer opens automatically whenever something's added to the bag.
- **Reviews/ratings section** on the homepage with a star breakdown.
- **Floating "chat with us" bubble** — point `chatLink` in `config.js` at whatever you actually use (WhatsApp, Instagram, email, or just `/contact`).
- Pink & white theme, animations (floating petals, scroll reveals, hover effects, flying "add to cart" dot, ingredient marquee, testimonial carousel) carried through from the original design.

## Running it locally

You'll need [Node.js](https://nodejs.org) installed (version 18 or newer is fine).

```bash
cd petale-shop
npm install
npm start
```

Then open:
- **Storefront:** http://localhost:3000
- **Admin dashboard:** http://localhost:3000/admin/login

### Default admin login
```
Username: admin
Password: petale2026
```
Change these in `config.js` before you put the site online anywhere public. `config.js` is also where you set the announcement bar messages, free-shipping threshold, and the chat bubble's link.

## Adding your real products

1. Go to `/admin/login` and log in.
2. Click **+ Add product**.
3. Fill in the name, description, category, price, stock, and upload a photo (or just pick an accent color if you don't have a photo yet — a nice placeholder is shown instead).
4. Check "Show on homepage as a featured product" if you want it in the homepage bestsellers section.
5. Save — it appears on the Shop page and its own product page right away.

The two "Sample product" entries (Rose Quartz Cleanser, Hyaluronic Dew Serum) are just placeholders so the site isn't empty, using free-license stock photos from Pexels (linked directly, no attribution required for commercial use). Swap them for your own product photography via the admin dashboard whenever you're ready — just edit the product and upload a new image.

## Project structure

```
petale-shop/
├── server.js              # App entry point
├── config.js              # Admin username/password, session secret
├── data/
│   └── products.json      # Your product database (plain JSON file)
├── routes/
│   ├── public.js           # Home, shop, product, about, contact, cart routes
│   └── admin.js             # Login + product CRUD routes
├── utils/
│   └── db.js               # Reads/writes data/products.json
├── views/                  # EJS page templates
│   ├── partials/            # Shared header/footer/admin nav
│   └── admin/                # Login, dashboard, product form
└── public/
    ├── css/                 # Site + admin styling
    ├── js/                  # Animations, cart, admin form behavior
    └── uploads/             # Uploaded product photos land here
```

## Notes & next steps

- **No real payment processing yet.** The checkout button just clears the cart and shows a confirmation page — you'd need to add a processor like Stripe when you're ready to take real orders.
- **The contact form doesn't send real email yet** — it just shows a confirmation. Wire up something like Nodemailer or a form service (e.g. Formspree) when you're ready.
- **Product data lives in a JSON file**, which is simple and easy to inspect/back up, but if your catalog grows large or you need multiple people editing at once, consider moving to a real database later (e.g. PostgreSQL or MongoDB) — the `utils/db.js` file is the only place that would need to change.
- **Deploying (Vercel):** push this repo to GitHub and import it in Vercel (or run `npx vercel --prod`). Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET` in the Vercel project env vars before going public. Note: Vercel’s filesystem is ephemeral — admin product/image changes use `/tmp` and reset on cold starts; for lasting catalog changes commit updates to `data/products.json` or move to a real database + cloud storage.
- **Other hosts:** this also runs anywhere Node.js does — Render, Railway, a VPS, etc. Just make sure `data/` and `public/uploads/` persist between deploys.
