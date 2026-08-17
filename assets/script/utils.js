// Shared date utilities used by experience.js and education.js

function formatDate(dateString) {
  if (!dateString) return "Present";
  const date = new Date(dateString);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function calculateDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const years = Math.floor(months / 12);
  months = months % 12;

  let result = '';
  if (years > 0) result += `${years} yr${years > 1 ? 's' : ''} `;
  if (months > 0) result += `${months} mo${months > 1 ? 's' : ''}`;
  return result.trim();
}

function showSectionLoading(container) {
  container.innerHTML = '<p class="section-status">Loading…</p>';
}

function showSectionError(container, label) {
  container.innerHTML = `<p class="section-status section-status-error">Couldn't load ${label}. Please try refreshing the page.</p>`;
}

// Media is only rendered into the DOM when a query string is present.
// Reader mode strips CSS, so display:none alone is not sufficient.
const MEDIA_UNLOCKED = !!window.location.search;

// Deterministic slug for stable in-page permalinks (e.g. "cognitive-memory-pipeline...").
// Mirrored in resume/generate_resume.py so the PDF resume can link to the exact same anchor.
// Combining diacritical marks (U+0300-U+036F), built from code points to avoid
// embedding literal combining characters in this source file.
const DIACRITIC_MARKS_RE = new RegExp(
  '[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g'
);

function slugify(text) {
  return (text || '')
    .toString()
    .normalize('NFKD')
    .replace(DIACRITIC_MARKS_RE, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// Gives `sectionEl` a stable, unique id — normally the entry's own short
// "id" field from its JSON (e.g. "cmpf2026"), which is what makes deep links
// short instead of a full slugified title. Falls back to slugify(titleText)
// only for entries that don't carry an id yet. Also turns `toggleEl`'s
// current content into a self-link <a href="#id"> so clicking the title
// itself copies/updates the shareable URL. Call this before appending any
// other clickable children (e.g. file icons) to toggleEl.
function makePermalink(sectionEl, toggleEl, id, titleText) {
  if (!sectionEl || !toggleEl) return null;

  const base = id || slugify(titleText);
  if (!base) return null;
  let finalId = base, n = 2;
  while (document.getElementById(finalId)) finalId = `${base}-${n++}`;
  sectionEl.id = finalId;

  const link = document.createElement('a');
  link.href = `#${finalId}`;
  link.className = 'title-anchor';
  while (toggleEl.firstChild) link.appendChild(toggleEl.firstChild);
  toggleEl.appendChild(link);
  return finalId;
}

// Expands the dropdown-section matching the current URL hash (and every
// ancestor dropdown-section) and scrolls it into view. Returns true if a
// matching element was found and revealed.
function revealHashTarget() {
  let id;
  try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { id = window.location.hash.slice(1); }
  if (!id) return false;

  const target = document.getElementById(id);
  if (!target) return false;

  let el = target.classList.contains('dropdown-section') ? target : target.closest('.dropdown-section');
  while (el) {
    el.classList.add('active');
    const toggle = el.querySelector(':scope > .dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    el = el.parentElement?.closest('.dropdown-section');
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const toggle = target.querySelector(':scope > .dropdown-toggle') || target;
  toggle.style.backgroundColor = '#fffae6';
  setTimeout(() => { toggle.style.backgroundColor = ''; }, 1500);

  return true;
}
