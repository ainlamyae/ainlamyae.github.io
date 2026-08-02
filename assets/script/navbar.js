/**
 * navbar.js
 * Loads the shared navbar partial into #navbar-placeholder, then wires up
 * the active-link-on-scroll behavior and the mobile hamburger menu.
 */
document.addEventListener('DOMContentLoaded', () => {
  includePartial('navbar-placeholder', '/assets/html/navbar.html').then(nav => {
    if (!nav) return;

    // ==============================
    // Active nav link on scroll
    // ==============================
    const navLinks = document.querySelectorAll('#navbar-menu a[href^="#"]');
    const sectionIds = Array.from(navLinks).map(a => a.getAttribute('href').slice(1));
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

    // Pages other than the homepage don't contain these sections, so send the
    // link back to the homepage section instead of just changing the hash.
    // (Checking the DOM directly would race with the homepage's own
    // asynchronously-injected sections, e.g. #contact.)
    const isHomePage = location.pathname === '/' || location.pathname.endsWith('/index.html');
    if (!isHomePage) {
      navLinks.forEach(link => {
        const id = link.getAttribute('href').slice(1);
        link.setAttribute('href', `/index.html#${id}`);
      });
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('active'));
          const link = document.querySelector(`#navbar a[href="#${entry.target.id}"]`);
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-10% 0px -80% 0px' });

    sections.forEach(s => observer.observe(s));

    // ==============================
    // Mobile hamburger menu
    // ==============================
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('navbar-menu');

    if (navToggle && navMenu) {
      navToggle.addEventListener('click', function () {
        const isOpen = navMenu.classList.toggle('nav-open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function () {
          navMenu.classList.remove('nav-open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  });
});
