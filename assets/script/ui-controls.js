document.addEventListener('DOMContentLoaded', () => {

  const MOON = '🌙'; // 🌙
  const SUN  = '☀️'; // ☀️

  // ── Dark mode ─────────────────────────────────────────────
  const root   = document.documentElement;
  const togBtn = document.getElementById('fab-theme');

  const isDark = () => root.getAttribute('data-theme') === 'dark';

  function applyTheme(dark) {
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    togBtn.textContent = dark ? SUN : MOON;
    const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
    togBtn.setAttribute('aria-label', label);
    togBtn.setAttribute('title', label);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved === 'dark');

  togBtn.addEventListener('click', () => applyTheme(!isDark()));

  // ── Scroll to top ──────────────────────────────────────────
  const topBtn = document.getElementById('fab-top');

  window.addEventListener('scroll', () => {
    topBtn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });

  topBtn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );

  // ── Expand / collapse all dropdown sections ────────────────
  const expandBtn = document.getElementById('fab-expand');
  const EXPAND_ICON = '⏬';
  const COLLAPSE_ICON = '⏫';

  expandBtn.addEventListener('click', () => {
    const expanded = toggleAllDropdowns();
    const label = expanded ? 'Collapse all sections' : 'Expand all sections';
    expandBtn.textContent = expanded ? COLLAPSE_ICON : EXPAND_ICON;
    expandBtn.setAttribute('aria-label', label);
    expandBtn.setAttribute('title', label);
  });

});
