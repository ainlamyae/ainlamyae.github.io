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
    togBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
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

});
