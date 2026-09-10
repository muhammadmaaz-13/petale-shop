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
    const initial = (name || '?').charAt(0).toUpperCase();
    return '<div class="product-placeholder" style="width:100%;height:100%;font-size:20px;">' + initial + '</div>';
  }

  function renderDrawer(data) {
    const itemsWrap = document.getElementById('drawerItems');
    const footer = document.getElementById('drawerFooter');
    const totalEl = document.getElementById('drawerTotal');
    const shipMsg = document.getElementById('shippingMsg');
    const progressFill = document.getElementById('progressFill');

    if (!data.items || data.items.length === 0) {
      itemsWrap.innerHTML = '<div class="cart-empty"><p>Your bag is empty.<br>Add something you\'ll love.</p></div>';
      footer.style.display = 'none';
    } else {
      footer.style.display = 'block';
      itemsWrap.innerHTML = data.items.map(item => {
        const p = item.product;
        const img = p.image
          ? '<img src="' + p.image + '" alt="">'
          : renderPlaceholder(p.name);
        return '<div class="drawer-line">' +
          '<div class="drawer-line-visual" style="background:' + (p.image ? 'transparent' : p.accentColor) + '">' + img + '</div>' +
          '<div class="drawer-line-info"><h4>' + p.name + '</h4><span>Qty ' + item.qty + '</span></div>' +
          '<div class="drawer-line-price">$' + item.lineTotal + '</div>' +
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

  window.__openCartDrawer = openDrawer;
  window.__renderCartDrawer = renderDrawer;
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
