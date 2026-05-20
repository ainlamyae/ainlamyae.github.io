# ainlamyae.github.io

Personal resume website for Ali Nasr — Systems Architect and R&D Lead.
Hosted via GitHub Pages at [ainlamyae.github.io](https://ainlamyae.github.io).

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
├── assets
│   ├── style
│   │   └── main.css              # Design tokens, layout, component styles, print rules
│   ├── script
│   │   ├── utils.js              # Shared utilities: formatDate(), calculateDuration()
│   │   ├── generic.js            # Core runtime: dropdowns, modal, keyword engine, nav
│   │   ├── experience.js         # Experience renderer — org grouping, role hierarchy
│   │   ├── education.js          # Education renderer — degree/thesis/supervisor details
│   │   ├── publications.js       # Publications renderer
│   │   ├── certifications.js     # Certifications renderer — grouped by type, sorted by date
│   │   ├── awards.js             # Awards renderer
│   │   └── recommendations.js    # Recommendations renderer
│   ├── data
│   │   ├── experience.json       # Work history — organizations, roles, items, media
│   │   ├── education.json        # Academic history — degrees, theses, supervisors
│   │   ├── publications.json     # Publication records
│   │   ├── certifications.json   # Certification records with type, date, file
│   │   ├── awards.json           # Award records with institution, date, file
│   │   ├── recommendations.json  # Recommendation records
│   │   └── keyword.json          # Keyword groups mapped to URL query parameters
│   └── media
│       ├── award/                # Award certificates (JPG, PDF)
│       └── certification/        # Certification images (JPG)
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
