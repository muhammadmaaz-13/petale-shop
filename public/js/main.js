// ---------- NAV SCROLL STATE ----------
const siteHeader = document.getElementById('siteHeader');
if (siteHeader) {
  window.addEventListener('scroll', () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ---------- SCROLL REVEAL ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));

// ---------- HERO FLOATING PETALS ----------
const petalsWrap = document.getElementById('petals');
if (petalsWrap) {
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('div');
    p.className = 'petal';
    const size = 10 + Math.random() * 16;
    p.style.width = size + 'px';
    p.style.height = size * 1.3 + 'px';
    p.style.left = Math.random() * 100 + '%';
    p.style.bottom = '-40px';
    p.style.background = i % 2 === 0 ? 'var(--rose)' : 'var(--rose-deep)';
    p.style.animationDuration = (10 + Math.random() * 10) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    petalsWrap.appendChild(p);
  }
}

// ---------- TESTIMONIAL CAROUSEL ----------
const testimonials = document.querySelectorAll('.testimonial');
if (testimonials.length) {
  let active = 0;
  const dots = document.querySelectorAll('.dot-btn');
  function show(i) {
    testimonials.forEach(el => el.classList.toggle('active', +el.dataset.i === i));
    dots.forEach(el => el.classList.toggle('active', +el.dataset.i === i));
    active = i;
  }
  dots.forEach(el => el.addEventListener('click', () => show(+el.dataset.i)));
  setInterval(() => show((active + 1) % testimonials.length), 4500);
}

// ---------- BUTTON RIPPLE ----------
document.querySelectorAll('.btn-primary').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
});

// ---------- NEWSLETTER (front-end only, no email backend yet) ----------
document.querySelectorAll('#newsletterForm, [data-newsletter]').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('sent');
    showToast("You're on the list 🌷");
  });
});

// ---------- SEARCH OVERLAY ----------
(function () {
  const btn = document.getElementById('searchBtn');
  const overlay = document.getElementById('searchOverlay');
  const closeBtn = document.getElementById('searchClose');
  if (!btn || !overlay) return;
  btn.addEventListener('click', () => {
    overlay.classList.add('show');
    const input = overlay.querySelector('input');
    if (input) setTimeout(() => input.focus(), 100);
  });
  const close = () => overlay.classList.remove('show');
  if (closeBtn) closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

// ---------- CART DRAWER ----------
(function () {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('drawerOverlay');
  const cartBtn = document.getElementById('cartBtn');
  const closeBtn = document.getElementById('closeDrawer');
  if (!drawer || !cartBtn) return;

  function renderPlaceholder(name) {
    const initial = esc((name || '?').charAt(0).toUpperCase());
    return '<div class="product-placeholder" style="width:100%;height:100%;font-size:20px;">' + initial + '</div>';
  }

  // POST to a cart route and get the updated cart back as JSON.
  async function cartRequest(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body || {})
    });
    if (!res.ok) throw new Error('Cart request failed (' + res.status + ')');
    return res.json();
  }
  window.__cartRequest = cartRequest;

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Keeps the header badge and the "is the bag empty?" flag in step with the server.
  function syncCartCount(count) {
    window.__cartCount = count;
    const countEl = document.getElementById('cartCount');
    if (countEl) {
      countEl.textContent = count;
      countEl.classList.toggle('show', count > 0);
    }
  }
  window.__syncCartCount = syncCartCount;

  // opts.quiet = true re-renders without replaying the slide-in animation
  // (used for +/- clicks so the list doesn't flicker).
  function renderDrawer(data, opts) {
    const itemsWrap = document.getElementById('drawerItems');
    const footer = document.getElementById('drawerFooter');
    const totalEl = document.getElementById('drawerTotal');
    const shipMsg = document.getElementById('shippingMsg');
    const progressFill = document.getElementById('progressFill');

    itemsWrap.classList.toggle('no-anim', !!(opts && opts.quiet));
    if (typeof data.cartCount === 'number') syncCartCount(data.cartCount);

    if (!data.items || data.items.length === 0) {
      itemsWrap.innerHTML = '<div class="cart-empty"><p>Your bag is empty.<br>Add something you\'ll love.</p></div>';
      footer.style.display = 'none';
    } else {
      footer.style.display = 'block';
      itemsWrap.innerHTML = data.items.map(item => {
        const p = item.product;
        const img = p.image
          ? '<img src="' + esc(p.image) + '" alt="">'
          : renderPlaceholder(p.name);
        return '<div class="drawer-line" data-id="' + esc(p.id) + '">' +
          '<div class="drawer-line-visual" style="background:' + (p.image ? 'transparent' : esc(p.accentColor)) + '">' + img + '</div>' +
          '<div class="drawer-line-info"><h4>' + esc(p.name) + '</h4>' +
            '<div class="drawer-qty">' +
              '<button type="button" class="dq-btn" data-delta="-1" aria-label="Decrease quantity"' + (item.qty <= 1 ? ' disabled' : '') + '>–</button>' +
              '<span class="dq-num">' + item.qty + '</span>' +
              '<button type="button" class="dq-btn" data-delta="1" aria-label="Increase quantity">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="drawer-line-side"><div class="drawer-line-price">$' + item.lineTotal + '</div>' +
            '<button type="button" class="drawer-remove" data-remove>Remove</button></div>' +
          '</div>';
      }).join('');
      totalEl.textContent = '$' + data.total;
    }

    const threshold = (window.__siteConfig && window.__siteConfig.freeShippingThreshold) || 50;
    const total = data.total || 0;
    if (total >= threshold) {
      shipMsg.innerHTML = "🎉 You've unlocked <strong>free shipping</strong>!";
      progressFill.style.width = '100%';
    } else {
      const remaining = (threshold - total).toFixed(2);
      shipMsg.innerHTML = 'Add <strong>$' + remaining + '</strong> more for free shipping';
      progressFill.style.width = Math.min(100, (total / threshold) * 100) + '%';
    }
  }

  async function openDrawer() {
    drawer.classList.add('show');
    overlay.classList.add('show');
    try {
      const res = await fetch('/cart/data');
      const data = await res.json();
      if (data.ok) renderDrawer(data);
    } catch (err) { console.error(err); }
  }
  function closeDrawerFn() {
    drawer.classList.remove('show');
    overlay.classList.remove('show');
  }

  cartBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawerFn);
  overlay.addEventListener('click', closeDrawerFn);

  // Plus / minus / remove inside the drawer
  const drawerItems = document.getElementById('drawerItems');
  if (drawerItems) {
    drawerItems.addEventListener('click', async (e) => {
      const qtyBtn = e.target.closest('.dq-btn');
      const removeBtn = e.target.closest('[data-remove]');
      if (!qtyBtn && !removeBtn) return;
      if (qtyBtn && qtyBtn.disabled) return;
      const line = e.target.closest('.drawer-line');
      if (!line || line.classList.contains('is-busy')) return;
      line.classList.add('is-busy');
      try {
        const data = removeBtn
          ? await cartRequest('/cart/remove/' + encodeURIComponent(line.dataset.id))
          : await cartRequest('/cart/update/' + encodeURIComponent(line.dataset.id), { delta: parseInt(qtyBtn.dataset.delta, 10) });
        if (data.ok) {
          renderDrawer(data, { quiet: true });
          document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
        }
      } catch (err) {
        console.error(err);
        line.classList.remove('is-busy');
        showToast("Couldn't update your bag — please try again.");
      }
    });
  }

  // Never go to checkout with nothing in the bag (drawer button and cart-page button)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('#drawerCheckoutBtn, #cartCheckoutBtn');
    if (!link) return;
    if (!window.__cartCount) {
      e.preventDefault();
      showToast('Your bag is empty — add an item before checking out.');
    }
  });

  window.__openCartDrawer = openDrawer;
  window.__renderCartDrawer = renderDrawer;
})();

// ---------- MOBILE HAMBURGER MENU ----------
(function () {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileMenuOverlay');
  const closeBtn = document.getElementById('mobileMenuClose');
  if (!toggle || !menu || !overlay) return;

  function openMenu() {
    menu.classList.add('show');
    overlay.classList.add('show');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('mobile-menu-open');
  }
  function closeMenu() {
    menu.classList.remove('show');
    overlay.classList.remove('show');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mobile-menu-open');
  }

  toggle.addEventListener('click', () => {
    if (menu.classList.contains('show')) closeMenu(); else openMenu();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  // Close the mobile menu automatically if the viewport is resized back to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
  // Close when a link inside the menu is tapped
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
})();

// ---------- COOKIE BANNER ----------
(function () {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  const STORAGE_KEY = 'petale_cookie_consent';

  let stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (err) { /* storage unavailable, e.g. private mode */ }

  if (!stored) {
    // Small delay so it doesn't compete with the page's own reveal animations
    setTimeout(() => banner.classList.add('show'), 600);
  }

  function dismiss(value) {
    banner.classList.remove('show');
    try { localStorage.setItem(STORAGE_KEY, value); } catch (err) { /* ignore if storage unavailable */ }
  }

  const acceptBtn = document.getElementById('cookieAccept');
  const declineBtn = document.getElementById('cookieDecline');
  if (acceptBtn) acceptBtn.addEventListener('click', () => dismiss('accepted'));
  if (declineBtn) declineBtn.addEventListener('click', () => dismiss('declined'));
})();

// ---------- TOAST ----------
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
window.showToast = showToast;
