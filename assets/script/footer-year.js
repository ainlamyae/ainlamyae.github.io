/**
 * footer-year.js
 * Fills the footer: "© <year> ALI — Latest update: <date>".
 * The date is the latest commit on GitHub (cached per session); if GitHub
 * can't be reached, it falls back to the page's own Last-Modified date.
 */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const updatedEl = document.getElementById('footer-updated');
  if (!updatedEl) return;

  const COMMITS_API = 'https://api.github.com/repos/ainlamyae/ainlamyae.github.io/commits?sha=main&per_page=1';
  const CACHE_KEY = 'site-last-updated';

  const show = iso => {
    const d = new Date(iso);
    if (isNaN(d)) return;
    updatedEl.textContent = d.toLocaleDateString('en-US', {
      timeZone: 'America/Toronto', year: 'numeric', month: 'short', day: 'numeric'
    });
    updatedEl.setAttribute('datetime', d.toISOString());
  };

  let cached = null;
  try { cached = sessionStorage.getItem(CACHE_KEY); } catch (e) { /* storage blocked */ }
  if (cached) { show(cached); return; }

  show(document.lastModified);

  fetch(COMMITS_API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(res => (res.ok ? res.json() : Promise.reject(res.status)))
    .then(commits => {
      const iso = commits?.[0]?.commit?.committer?.date;
      if (!iso) return;
      show(iso);
      try { sessionStorage.setItem(CACHE_KEY, iso); } catch (e) { /* storage blocked */ }
    })
    .catch(() => {});
});
