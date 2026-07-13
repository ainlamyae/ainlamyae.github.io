# ainlamyae.github.io

Personal resume / portfolio website
---

## Architecture Overview

The site is a statically-served, data-driven multi-page site built entirely on vanilla
HTML, CSS, and JavaScript — no build toolchain, framework, or runtime dependencies.

Two complementary patterns keep it maintainable:

- **Content–logic separation.** Every resume section (Experience, Education, Publications,
  Credentials, Engagement, …) is rendered at runtime by a dedicated script that fetches its
  JSON data file from `assets/data/` and constructs the DOM programmatically. Updating content
  means editing JSON, never markup or logic.
- **Shared HTML partials.** Cross-page chrome that would otherwise be copy-pasted (the navbar,
  the contact section) lives once under `assets/html/` and is fetched and injected into a
  placeholder `<div>` at runtime by `include.js` + `navbar.js` / `contact-form.js`. Editing the
  menu or the contact block means editing one file, regardless of how many pages use it.

---

## System Structure

```
.
├── index.html                    # Homepage — all resume sections, nav/contact placeholders
├── contact.html                  # Dedicated contact page (reuses the shared contact partial)
├── 404.html                      # Custom not-found page (served automatically by GitHub Pages)
├── robots.txt                    # Disallows all crawler indexing
├── favicon.ico                   # Multi-resolution favicon (16/32/48)
├── favicon-16x16.png             # Favicon — 16×16 PNG
├── favicon-32x32.png             # Favicon — 32×32 PNG
├── apple-touch-icon.png          # Favicon — 180×180 PNG (iOS/Safari)
├── assets
│   ├── style
│   │   └── main.css              # Design tokens, layout, component styles, animations, print rules
│   ├── script
│   │   ├── utils.js              # Shared utilities: formatDate(), calculateDuration()
│   │   ├── include.js            # Generic fetch-and-inject helper for HTML partials
│   │   ├── navbar.js             # Loads navbar partial; wires scroll-spy + mobile hamburger menu
│   │   ├── header.js             # Loads header partial; dispatches "header:loaded" when ready
│   │   ├── footer-year.js        # CSP-safe external footer "© <year>" updater
│   │   ├── analytics.js          # Google Analytics (gtag) bootstrap
│   │   ├── about.js              # About renderer — summary + skill/expertise tag groups
│   │   ├── wordcloud.js          # Word cloud renderer — freeform layout in the header
│   │   ├── education.js          # Education renderer — degree/thesis/supervisor/course-list details
│   │   ├── experience.js         # Experience renderer — org grouping, role/position dropdowns
│   │   ├── publications.js       # Publications renderer
│   │   ├── projects.js           # Projects renderer
│   │   ├── certifications.js     # Certifications renderer — grouped by type, sorted by date
│   │   ├── awards.js             # Awards renderer
│   │   ├── scores.js             # Test scores renderer
│   │   ├── volunteering.js       # Volunteering renderer
│   │   ├── recommendations.js    # Recommendations renderer
│   │   ├── contact-form.js       # Loads contact partial; Google Form submission + status messaging
│   │   ├── email-gate.js         # Bare-URL interstitial: validates + submits visitor email, then reveals #site-content
│   │   ├── ui-controls.js        # Floating action buttons: back-to-top, theme toggle, expand/collapse all
│   │   └── app.js                # Core runtime: dropdowns (ARIA), keyword engine, lightbox modal
│   ├── html
│   │   ├── navbar.html           # Shared <nav> markup, injected into #navbar-placeholder
│   │   ├── header.html           # Shared <header> markup (name, QR/social links, word cloud overlay)
│   │   └── contact.html          # Shared <section id="contact"> markup (form, map, social links)
│   ├── analysis
│   │   └── wordcloud.py          # Stdlib-only script: scans assets/data/*.json for the most
│   │                              # frequent terms and writes candidates to wordcloud.json
│   ├── data
│   │   ├── about.json            # About summary + skill/expertise tag groups
│   │   ├── experience.json       # Work history — organizations, roles, items, media
│   │   ├── education.json        # Academic history — degrees, theses, supervisors, courses
│   │   ├── publications.json     # Publication records
│   │   ├── projects.json         # Project records
│   │   ├── certifications.json   # Certification records with type, date, file
│   │   ├── awards.json           # Award records with institution, date, file
│   │   ├── scores.json           # Standardized test score records
│   │   ├── volunteering.json     # Volunteering records
│   │   ├── recommendations.json  # Recommendation records
│   │   ├── people.json           # Directory of people — instructors, collaborators, co-authors, students
│   │   ├── keywords.json         # Keyword groups mapped to URL query parameters
│   │   └── wordcloud.json        # Curated {text, weight} entries rendered as the header word cloud
│   └── media
│       ├── award/                # Award certificates (JPG, PDF)
│       ├── certification/        # Certification images (JPG)
│       ├── education/            # Education-related media (course PDFs, etc.)
│       ├── experience/           # Experience-related media
│       ├── logo/                 # Institution/employer logos
│       ├── projects/             # Project media
│       └── publication/          # Publication media
└── README.md
```

---

## Page Map & Sections

`index.html` is the single-page homepage; its sections (and nav anchors) are:

`#about` · `#experience` · `#education` · `#publications` · `#credentials` · `#engagement` · `#contact`

- **Credentials** groups Certifications, Awards, and Language/Test Scores.
- **Engagement** groups Projects, Volunteering, and Recommendations.

`404.html` and `contact.html` are standalone pages that share the same navbar. Because they
don't contain the homepage's sections, `navbar.js` rewrites the `#about`/`#experience`/…
anchors on those pages to `/index.html#about`, `/index.html#experience`, … so the links always
land on the right section instead of just changing the URL hash in place.

---

## Shared Partials (`assets/html/`)

To avoid duplicating markup across `index.html`, `404.html`, and `contact.html`:

- A page declares a placeholder, e.g. `<div id="navbar-placeholder"></div>` or
  `<div id="contact-placeholder"></div>`.
- `include.js` exposes `includePartial(placeholderId, url)`, which fetches the partial,
  parses it, and replaces the placeholder with the resulting element — returning a promise
  that resolves to the inserted element.
- `navbar.js` calls `includePartial('navbar-placeholder', '/assets/html/navbar.html')`, then
  wires up scroll-spy (`IntersectionObserver` highlighting the active link), the mobile
  hamburger toggle, and the cross-page anchor rewriting described above.
- `header.js` calls `includePartial('header-placeholder', '/assets/html/header.html')`, then
  dispatches a `header:loaded` event on `document` so other scripts (e.g. `wordcloud.js`) can
  safely query elements that live inside the injected header.
- `contact-form.js` calls `includePartial('contact-placeholder', '/assets/html/contact.html')`,
  then wires the `#contact-form` submit handler once the form actually exists in the DOM.

Because injection is asynchronous, any script that depends on injected markup (e.g. the
contact form, or the word cloud's header overlay) must do its DOM queries inside the
`includePartial(...).then(...)` callback (or a corresponding custom event like
`header:loaded`) rather than on `DOMContentLoaded` directly.

---

## Design Decisions

**Content–logic separation.** All section data lives in versioned JSON files under
`assets/data/`. Renderers read, parse, and inject into the DOM on page load. Adding or
updating any entry requires only a JSON edit.

**Single-source shared chrome.** The navbar and contact block are defined once under
`assets/html/` and reused via runtime `fetch` + DOM injection (see above), so there is exactly
one place to edit the menu or the contact form regardless of how many pages reference it.

**Progressive disclosure via collapsible dropdowns.** Experience roles/items, education
details, certifications, and awards are collapsed by default using the shared
`.dropdown-section` / `.dropdown-toggle` / `.dropdown-content` pattern. A CSS `max-height`
transition driven by an `.active` class toggle (managed in `app.js`) keeps the implementation
free of JS animation libraries, while `wireDropdownAria`/`syncDropdownAria` keep
`aria-expanded`/`aria-controls` in sync for keyboard and screen-reader users.

**Animated headings.** Section (`h3`) and role-toggle (`h4.dropdown-toggle` inside a
`.dropdown-section`) headings share a hover animation — a slight lift, a soft shadow, and a
diagonal shimmer sweep via a `::after` pseudo-element — disabled under
`prefers-reduced-motion: reduce`.

**URL-parameter keyword engine.** Appending a query parameter (e.g., `?ai`, `?robotics`)
triggers `app.js` to load `keywords.json`, match the parameter to a keyword group, auto-expand
all relevant dropdown sections with a staggered delay, and highlight matched terms in-place
using a safe text-node walk. This enables shareable, context-targeted deep links.

**Media gating.** Certificate and award thumbnails are hidden by default (`display: none`).
Presence of any query string triggers `unhideMedia()`, exposing the media layer selectively
for authenticated or invited visitors without additional server-side logic.

**Lightbox modal.** A single shared modal (`#cert-modal`) handles both image and PDF media
across all sections. Navigation between items within the same media list is managed via an
index pointer into a shared `currentMediaList` array.

**Print stylesheet.** `@media print` collapses the navbar, forces all dropdown content
visible, strips decorative backgrounds/animations, and resets typography to 11pt black —
producing a clean single-pass PDF without any separate export pipeline.

**Serverless contact form.** `contact-form.js` injects the shared contact partial, intercepts
the `#contact-form` submit, maps its fields (name/email/subject/message) to a Google Form's
`entry.*` IDs, and POSTs them to the form's `formResponse` endpoint with `mode: "no-cors"` —
letting visitors send messages without any backend, while `#contact-status` reports a
"Sending… / Thanks! / Something went wrong" status (styled via `.contact-status` /
`.contact-status.error` in `main.css`). Because the response is opaque under `no-cors`,
success here only confirms the request was sent, not that Google accepted it. The same partial
(and the same handler) powers both the in-page `#contact` section on the homepage and the
standalone `contact.html` page.

**Email-gated homepage.** Loading `index.html` with no `?query` and no `#hash` shows a plain
interstitial (`#email-gate`) instead of the page content (`#site-content`), which stays
`display: none` until the gate clears. The gate/bypass decision is made by a small inline
`<script>` at the top of `<head>` — before any CSS paints — so there's no flash of hidden
content: it adds a `gate-active` class to `<html>` unless `location.search`, `location.hash`,
or a prior `localStorage.gateVerified` flag says to skip it. Submitting the gate's email field
(validated with a basic `@`/`.` pattern) reuses the same Google Form `no-cors` POST as the
contact form (`name: "Visitor"`, `subject: "Visitor at <date/time>"`) to log the lead, then
removes `gate-active` and sets `localStorage.gateVerified` so the same browser isn't asked
again. This is a client-side filter for casual visitors and lead capture, not an access-control
mechanism — anyone can bypass it with any query string or hash, view source, or disabled JS.

**Content Security Policy.** `index.html` and `contact.html` declare a restrictive CSP via
`<meta http-equiv="Content-Security-Policy">` (self-hosted scripts/styles/fonts, plus an
allowlist for Google Analytics, Google Ads-audience, Google Forms, and the embedded Google
Map). Because CSP blocks inline `<script>` execution, any per-page bootstrap logic — e.g. the
footer year — lives in an external file (`footer-year.js`) rather than an inline `<script>`
block.

**Word cloud.** `assets/analysis/wordcloud.py` (stdlib only) scans every `assets/data/*.json`
file plus the comma-separated skill phrases in `about.json`, tokenizes and normalizes terms
(singular/plural, gerund, and past-tense forms collapse to one base word), and writes the top
100 `{text, weight}` candidates to `assets/data/wordcloud.json` for manual curation. At runtime,
`wordcloud.js` fetches that file, takes the top 75 by weight, and lays them out with an
Archimedean-spiral collision-avoidance algorithm — sized by weight and color-graded from
`--wc-color-high` (most frequent) to `--wc-color-low` (least frequent) via `color-mix()`. The
result is rendered at low opacity as an absolutely-positioned, non-interactive
`#wordcloud-container` overlay inside `<header>`, behind the name and QR code, so it reads as a
subtle background texture without taking up any layout space.

**Branding & crawler controls.** A monogram favicon (`favicon.ico` / PNG variants /
`apple-touch-icon.png`) is generated from the site's `--color-primary` palette and linked from
`<head>`. `404.html` and `contact.html` reuse the same shared navbar/footer chrome as the
homepage so navigation stays consistent everywhere — GitHub Pages serves `404.html`
automatically for unmatched routes on a `<username>.github.io` repo, no extra config needed.
`robots.txt` plus `<meta name="robots" content="noindex, nofollow, noarchive">` on every page
keep the site out of search indexes.

---

## Data Schema Reference

### `experience.json`
```json
{
  "organization": "string",
  "logo": "path/to/logo",
  "address": "string",
  "position": "string",
  "group": "string",
  "employmentType": "string",
  "date": { "start": "YYYY-MM", "end": "YYYY-MM" },
  "items": [
    {
      "title": "string",
      "category": "Project | Leadership | Service | Teaching",
      "contributor": "string",
      "date": { "start": "YYYY-MM", "end": "YYYY-MM" },
      "description": ["string"],
      "media": [{ "src": "path", "caption": "string" }]
    }
  ]
}
```

### `keywords.json`
```json
{ "group": "ai", "keywords": ["LangChain", "RAG", "LLM"] }
```

---

## Local Development

```bash
python -m http.server 8000
# Access at http://localhost:8000
```

No build step. No package manager. Edit JSON, HTML partials, or CSS and reload.

To regenerate word cloud candidates after content changes:

```bash
python assets/analysis/wordcloud.py
# Writes the top 100 {text, weight} candidates to assets/data/wordcloud.json
```

Then manually curate `assets/data/wordcloud.json` (delete unwanted entries) — the file is
written one entry per line specifically to make this easy.

---

## Deployment

All pushes to `main` are published automatically via GitHub Pages. No CI pipeline is required.

---

## License

All rights reserved. The contents of this repository are provided for viewing purposes only.
Reproduction, modification, redistribution, or reuse of any part of this codebase requires
explicit written permission from the repository owner.
