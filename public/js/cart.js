document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.add-btn');
  if (!btn) return;
  e.preventDefault();
  const id = btn.dataset.id;
  if (!id) return;

  try {
    const qtyInput = document.getElementById('qtyInput');
    const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
    const res = await fetch('/cart/add/' + id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty })
    });
    const data = await res.json();
    if (!data.ok) return;

    // Update cart badge
    const countEl = document.getElementById('cartCount');
    if (countEl) {
      countEl.textContent = data.cartCount;
      countEl.classList.add('show', 'bump');
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
    const label = btn.querySelector('.btn-label');
    if (label) label.textContent = 'Added';
    setTimeout(() => {
      btn.classList.remove('added');
      if (label) label.textContent = 'Add';
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
  }
});
