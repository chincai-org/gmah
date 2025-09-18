// Handle current (fake) active item: choose based on hash or default
(function setActiveLink() {
  const links = document.querySelectorAll('.menu a');
  const hash = window.location.hash.toLowerCase();
  let matched = false;

  links.forEach(a => {
    const name = a.dataset.name.toLowerCase();
    if (hash && hash.includes(name)) {
      a.classList.add('active');
      matched = true;
    } else {
      a.classList.remove('active');
    }
  });

  if (!matched) {
    const first = document.querySelector('.menu a[data-name="Main"]');
    if (first) first.classList.add('active');
  }
})();

// Mobile toggle
const toggleBtn = document.querySelector('.nav-toggle');
const menu = document.getElementById('primary-menu');

toggleBtn?.addEventListener('click', () => {
  const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
  toggleBtn.setAttribute('aria-expanded', String(!expanded));
  toggleBtn.setAttribute('aria-label', expanded ? 'Open menu' : 'Close menu');
  menu.classList.toggle('open');
});

// Close on link click (mobile)
menu?.addEventListener('click', e => {
  const target = e.target;
  if (target instanceof HTMLElement && target.tagName === 'A' && window.innerWidth <= 900) {
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open menu');
    menu.classList.remove('open');
  }
});

// Close on outside click (mobile)
document.addEventListener('click', e => {
  if (window.innerWidth > 900) return;
  if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
    if (menu.classList.contains('open')) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-label', 'Open menu');
      menu.classList.remove('open');
    }
  }
});

// Optional: highlight active link on hash change
window.addEventListener('hashchange', () => {
  document.querySelectorAll('.menu a').forEach(a => {
    a.classList.toggle('active', window.location.hash.toLowerCase().includes(a.dataset.name.toLowerCase()));
  });
});
