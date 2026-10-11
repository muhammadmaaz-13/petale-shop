# Petalé — Skincare Shop

A multi-page skincare storefront with a built-in admin dashboard (mini CRM) for managing products — including image uploads — without touching any code.

## What's inside

- **Multi-page site**: Home, Shop (with category filters + search), Product detail pages, About, Contact, Cart, Checkout, Privacy Policy, Terms & Conditions, and confirmation ("thank you") page.
- **Dynamic product data**: products live in `data/products.json` and are rendered on every page.
- **Admin dashboard** at `/admin/login`: add, edit, and delete products — name, price, sale pricing, star rating, review count, stock, category, and a main photo (an optional secondary photo can be stored but is not currently displayed — product cards keep the same image and just zoom gently on hover).
- **Checkout — Cash on Delivery only.** The checkout page collects delivery details (name, phone, address, city) and a payment method. **Cash on Delivery (COD) is the only payment method offered.** Other methods can be added later in `config.js` → `paymentMethods` together with the matching handling in `routes/public.js`.
- **Form validation with real error messages** on the Contact form and Checkout form — both client- and server-side, with field-level messages (not just the browser's default "required" tooltip).
- **404 and 500 error pages** — friendly, on-brand pages instead of a raw crash or blank screen.
- **SEO basics**: a unique `<title>` and `<meta name="description">` per page, a dynamic `/robots.txt`, and a dynamic `/sitemap.xml` that automatically includes every product in `data/products.json`.
- **Cookie consent banner** — shown on first visit, remembers the visitor's Accept/Decline choice (stored locally in their browser), links to the Privacy Policy.
- **Click-to-call phone number** — in the header, the mobile menu, the footer, and the Contact page. Set it once in `config.js` → `phone`.
- **Privacy Policy** and **Terms & Conditions** pages — the Terms page includes a clearly highlighted **no-refund / all-sales-final policy**. Written as sensible defaults; have a lawyer review before relying on them for a real business.
- **Mobile-optimized navigation** — a slide-out hamburger menu under 900px (the old desktop nav simply disappeared on mobile with no way to reach it before), plus tightened spacing/padding for small phones.
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
Change these in `config.js` before you put the site online anywhere public. `config.js` is also where you set the announcement bar messages, free-shipping threshold, chat bubble link, **phone number**, **contact email**, **site URL** (used in robots.txt/sitemap.xml), and **payment methods**.

## Before you go live — checklist

- [ ] Change the admin username/password and `sessionSecret` in `config.js`.
- [ ] Set `phone`, `contactEmail`, and `siteUrl` in `config.js` to your real details.
- [ ] Replace the placeholder text in `views/privacy-policy.ejs` and `views/terms.ejs` with policy your business/lawyer has actually approved — these are starting points, not legal advice.
- [ ] When you're ready to accept a payment method beyond Cash on Delivery, add it under `paymentMethods` in `config.js` and wire up an actual processor in `routes/public.js` — right now the checkout route only accepts COD.
- [ ] Swap the demo products for your real catalog via the admin dashboard.

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
├── server.js              # App entry point (also handles 404 / 500 pages)
├── config.js              # Admin login, session secret, phone, payment methods, site URL
├── data/
│   └── products.json      # Your product database (plain JSON file)
├── routes/
│   ├── public.js           # Home, shop, product, about, contact, cart, checkout,
│   │                        # privacy/terms, robots.txt, sitemap.xml
│   └── admin.js             # Login + product CRUD routes
├── utils/
│   └── db.js               # Reads/writes data/products.json
├── views/                  # EJS page templates
│   ├── checkout.ejs         # Delivery details + COD-only payment selection
│   ├── checkout-success.ejs # "Thank you" page shown after a COD order
│   ├── privacy-policy.ejs
│   ├── terms.ejs             # Includes the no-refund policy
│   ├── 404.ejs / 500.ejs
│   ├── partials/            # Shared header/footer/cookie-banner/admin nav
│   └── admin/                # Login, dashboard, product form
└── public/
    ├── css/                 # Site + admin styling
    ├── js/                  # Animations, cart, mobile menu, cookie banner, admin form behavior
    └── uploads/             # Uploaded product photos land here
```

## Notes & next steps

- **Only Cash on Delivery is live.** Checkout collects delivery details and confirms a COD order — no money moves online.
- **The contact form doesn't send real email yet** — it just shows a confirmation (after validating the fields). Wire up something like Nodemailer or a form service (e.g. Formspree) when you're ready.
- **Product data lives in a JSON file**, which is simple and easy to inspect/back up, but if your catalog grows large or you need multiple people editing at once, consider moving to a real database later (e.g. PostgreSQL or MongoDB) — the `utils/db.js` file is the only place that would need to change.
- **Deploying:** this runs anywhere Node.js does — Render, Railway, a VPS, etc. Just make sure `data/` and `public/uploads/` persist between deploys (some hosts wipe the filesystem on redeploy — in that case you'd want cloud storage for images and a real database for products). Also update `siteUrl` in `config.js` to your real domain so `robots.txt`/`sitemap.xml` point search engines to the right place.

