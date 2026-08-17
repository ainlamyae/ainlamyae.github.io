# PDF Résumé Generator

Generates `output/Ali-Nasr-Resume.pdf` from the site's `assets/data/*.json` files.

## Requirements

- Python 3.9+
- `pdflatex` — install [MiKTeX](https://miktex.org/) (Windows) or TeX Live (Linux/macOS)

On first run, MiKTeX will auto-install any missing LaTeX packages (`sourcesanspro`,
`titlesec`, `fancyhdr`, `lastpage`, `etaremune`, `enumitem`, ...) — internet required.

## Usage

Run from the repository root:

```
python resume/generate_resume.py
```

This writes `resume/output/Ali-Nasr-Resume.tex`, copies `resume/resume.sty` alongside it,
and compiles the PDF to `resume/output/Ali-Nasr-Resume.pdf`.

## Style

Visual style (fonts, colors, spacing, section rules, footer) lives in `resume/resume.sty`,
ported from an earlier hand-built LaTeX résumé. It's kept ATS-friendly on purpose: a single
column, no images/graphics, and no colored boxes or tables that could scramble text order
for applicant-tracking parsers — organization/degree headers use bold text sizing for
hierarchy instead of a background box. Named macros (`\resheader`, `\publabel`, `\reslabel`)
keep raw formatting commands out of the generated content; `generate_resume.py` only calls
them.

## Deep links

Every Experience item, Project, and Education degree title in the PDF links to
`https://ainlamyae.github.io/#<id>` — the same short in-page anchor the website assigns
that entry. The id comes from the entry's own `"id"` field in its JSON (e.g. `"cmpf2026"`
for the Cognitive Memory Pipeline experience item); entries without one fall back to a
slugified title. Publication entries are left linking to their DOI/URL instead, unchanged.

## Data sources

All content comes from `assets/data/*.json` — the same files that drive the website.
Editing a JSON file updates both the website and the next generated résumé.

| File | Section |
|---|---|
| `about.json` | Summary |
| `experience.json` | Experience |
| `education.json` | Education |
| `publications.json` | Publications |
| `projects.json` | Projects |

`certifications.json`, `awards.json`, `scores.json`, `volunteering.json`, and
`recommendations.json` have builder functions (`build_credentials`, `build_engagement`)
already written but not currently wired into the PDF — see `sections = [...]` in
`build_tex()` to enable them.

## Future: compact mode

`generate_resume.py` has a `MODE = "full"` constant at the top. A future `"compact"` mode
will emit only section titles with links to the corresponding website sections, keeping
the PDF short while directing readers to the site for full detail.
