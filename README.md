# ainlamyae.github.io

Personal resume website
---

## Architecture Overview

The site is a statically-served, data-driven single-page application built entirely on vanilla
HTML, CSS, and JavaScript with no build toolchain or runtime dependencies. All dynamic content
is decoupled from the presentation layer: each section is rendered at runtime by fetching its
corresponding JSON data file and constructing the DOM programmatically.

This design keeps content updates isolated to JSON edits with no redeployment of markup or
logic required.

---

## System Structure

```
.
├── index.html                    # Shell document — layout, nav, section anchors
├── 404.html                      # Custom not-found page (served by GitHub Pages)
├── robots.txt                    # Disallows all crawler indexing
├── favicon.ico                   # Multi-resolution favicon (16/32/48)
├── favicon-16x16.png             # Favicon — 16×16 PNG
├── favicon-32x32.png             # Favicon — 32×32 PNG
├── apple-touch-icon.png          # Favicon — 180×180 PNG (iOS/Safari)
├── assets
│   ├── style
│   │   └── main.css              # Design tokens, layout, component styles, print rules
│   ├── script
│   │   ├── utils.js              # Shared utilities: formatDate(), calculateDuration()
│   │   ├── education.js          # Education renderer — degree/thesis/supervisor/course-list details
│   │   ├── experience.js         # Experience renderer — org grouping, role hierarchy
│   │   ├── publications.js       # Publications renderer
│   │   ├── projects.js           # Projects renderer
│   │   ├── certifications.js     # Certifications renderer — grouped by type, sorted by date
│   │   ├── awards.js             # Awards renderer
│   │   ├── scores.js             # Test scores renderer
│   │   ├── volunteering.js       # Volunteering renderer
│   │   ├── recommendations.js    # Recommendations renderer
│   │   ├── contact-form.js       # Contact form — Google Form submission + status messaging
│   │   └── app.js                # Core runtime: dropdowns, modal, keyword engine, nav
│   ├── data
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
│   │   └── keywords.json         # Keyword groups mapped to URL query parameters
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

## Design Decisions

**Content–logic separation.** All section data lives in versioned JSON files under `assets/data/`.
Renderers read, parse, and inject into the DOM on page load. Adding or updating any entry
requires only a JSON edit.

**Progressive disclosure via collapsible dropdowns.** Experience items, education details,
certifications, and awards are collapsed by default. A CSS `max-height` transition driven by
an `.active` class toggle keeps the implementation free of JS animation libraries.

**URL-parameter keyword engine.** Appending a query parameter (e.g., `?robotics`, `?ai`)
triggers `generic.js` to load `keyword.json`, match the parameter to a keyword group,
auto-expand all relevant dropdown sections with a staggered delay, and highlight matched
terms in-place using a safe text-node walk. This enables shareable, context-targeted deep links.

**Media gating.** Certificate and award thumbnails are hidden by default (`display: none`).
Presence of any query string triggers `unhideMedia()`, exposing the media layer selectively
for authenticated or invited visitors without additional server-side logic.

**Lightbox modal.** A single shared modal handles both image and PDF media across all sections.
Navigation between items within the same media list is managed via an index pointer into a
shared `currentMediaList` array.

**Print stylesheet.** `@media print` collapses the navbar, forces all dropdown content visible,
strips decorative backgrounds, and resets typography to 11pt black — producing a clean
single-pass PDF without any separate export pipeline.

**Serverless contact form.** `contact-form.js` intercepts the `#contact-form` submit, maps its
fields (name/email/subject/message) to a Google Form's `entry.*` IDs, and POSTs them to the
form's `formResponse` endpoint with `mode: "no-cors"` — letting visitors send messages without
any backend, while `#contact-status` reports a "Sending… / Thanks! / Something went wrong"
status (styled via `.contact-status`/`.contact-status.error` in `main.css`). Because the
response is opaque under `no-cors`, success here only confirms the request was sent, not that
Google accepted it.

**Branding & crawler controls.** A monogram favicon (`favicon.ico` / PNG variants /
`apple-touch-icon.png`) is generated from the site's `--color-primary` palette and linked from
`<head>`. `404.html` mirrors the site shell (navbar, header, footer) so broken links land on a
page consistent with the rest of the site — GitHub Pages serves it automatically for unmatched
routes on a `<username>.github.io` repo, no extra config needed. `robots.txt` plus
`<meta name="robots" content="noindex, nofollow, noarchive">` on every page keep the site out
of search indexes.

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

### `keyword.json`
```json
{ "group": "ai", "keywords": ["LangChain", "RAG", "LLM"] }
```

---

## Local Development

```bash
python -m http.server 8000
# Access at http://localhost:8000
```

No build step. No package manager. Edit JSON or CSS and reload.

---

## Deployment

All pushes to `main` are published automatically via GitHub Pages. No CI pipeline is required.

---

## License

All rights reserved. The contents of this repository are provided for viewing purposes only.
Reproduction, modification, redistribution, or reuse of any part of this codebase requires
explicit written permission from the repository owner.
