// ---------- ADD TO BAG (product cards + product page) ----------
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.add-btn');
  if (!btn) return;
  e.preventDefault();
  const id = btn.dataset.id;
  if (!id || btn.disabled) return;

  // Remember the button's original label ("Add" on cards, "Add to bag" on the
  // product page) so we can put it back after the "Added" confirmation.
  const label = btn.querySelector('.btn-label');
  if (label && !btn.dataset.label) btn.dataset.label = label.textContent;

  btn.disabled = true;
  try {
    const qtyInput = document.getElementById('qtyInput');
    const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
    const data = await window.__cartRequest('/cart/add/' + encodeURIComponent(id), { qty });
    if (!data.ok) return;

    // Update cart badge
    if (window.__syncCartCount) window.__syncCartCount(data.cartCount);
    const countEl = document.getElementById('cartCount');
    if (countEl) {
      countEl.classList.add('bump');
      setTimeout(() => countEl.classList.remove('bump'), 500);
    }

    // Flying dot animation toward the cart icon
    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
      const startRect = btn.getBoundingClientRect();
      const endRect = cartBtn.getBoundingClientRect();
      const dot = document.createElement('div');
      dot.className = 'flying-dot';
      dot.style.left = startRect.left + startRect.width / 2 + 'px';
      dot.style.top = startRect.top + startRect.height / 2 + 'px';
      document.body.appendChild(dot);
      requestAnimationFrame(() => {
        dot.style.left = endRect.left + endRect.width / 2 + 'px';
        dot.style.top = endRect.top + endRect.height / 2 + 'px';
        dot.style.opacity = '0.2';
        dot.style.transform = 'scale(0.3)';
      });
      setTimeout(() => dot.remove(), 750);
    }

    // Button feedback
    btn.classList.add('added');
    if (label) label.textContent = 'Added';
    setTimeout(() => {
      btn.classList.remove('added');
      if (label) label.textContent = btn.dataset.label || 'Add';
    }, 1400);

    // Open the cart drawer and show what's inside now
    if (window.__renderCartDrawer) window.__renderCartDrawer(data);
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('drawerOverlay');
    if (drawer && overlay) {
      drawer.classList.add('show');
      overlay.classList.add('show');
    }
  } catch (err) {
    console.error(err);
    if (window.showToast) window.showToast("Couldn't add that to your bag — please try again.");
  } finally {
    btn.disabled = false;
  }
});

// ---------- CART PAGE: + / – / Remove ----------
(function () {
  const lines = document.getElementById('cartLines');
  if (!lines) return; // not on the cart page (or the bag is empty)

  function applyCartPage(data) {
    if (window.__syncCartCount) window.__syncCartCount(data.cartCount);

    // Bag is now empty: reload so the normal empty-bag screen appears.
    if (!data.items || data.items.length === 0) {
      window.location.assign('/cart');
      return;
    }

    const byId = {};
    data.items.forEach(item => { byId[item.product.id] = item; });

    lines.querySelectorAll('.cart-line').forEach(lineEl => {
      const item = byId[lineEl.dataset.line];
      if (!item) {
        lineEl.classList.add('removing');
        setTimeout(() => lineEl.remove(), 260);
        return;
      }
      const numEl = lineEl.querySelector('.qty-num');
      const totalEl = lineEl.querySelector('.line-total');
      const minus = lineEl.querySelector('.qty-btn[value="-1"]');
      if (numEl && numEl.textContent !== String(item.qty)) {
        numEl.textContent = item.qty;
        numEl.classList.remove('bump');
        void numEl.offsetWidth; // restart the animation
        numEl.classList.add('bump');
      }
      if (totalEl) totalEl.textContent = item.lineTotal;
      if (minus) minus.disabled = item.qty <= 1;
    });

    const sub = document.getElementById('summarySubtotal');
    const tot = document.getElementById('summaryTotal');
    if (sub) sub.textContent = data.total;
    if (tot) tot.textContent = data.total;
  }

  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('form[data-cart-form]');
    if (!form) return;
    e.preventDefault();
    if (form.classList.contains('is-busy')) return;

    const id = form.dataset.id;
    const kind = form.dataset.cartForm;
    form.classList.add('is-busy');
    try {
      let data;
      if (kind === 'remove') {
        data = await window.__cartRequest('/cart/remove/' + encodeURIComponent(id));
      } else {
        const delta = parseInt(e.submitter && e.submitter.value, 10);
        if (!delta) return;
        data = await window.__cartRequest('/cart/update/' + encodeURIComponent(id), { delta });
      }
      if (data.ok) applyCartPage(data);
    } catch (err) {
      console.error(err);
      if (window.showToast) window.showToast("Couldn't update your bag — please try again.");
    } finally {
      form.classList.remove('is-busy');
    }
  });

  // Changes made in the slide-out drawer while this page is open
  document.addEventListener('cart:updated', (e) => applyCartPage(e.detail));
})();
