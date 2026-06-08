# PDF Résumé Generator

Generates `output/Ali-Nasr-Resume.pdf` from the site's `assets/data/*.json` files.

## Requirements

- Python 3.9+
- `pdflatex` — install [MiKTeX](https://miktex.org/) (Windows) or TeX Live (Linux/macOS)

On first run MiKTeX will auto-install any missing LaTeX packages (internet required).

## Usage

Run from the repository root:

```
python resume/generate_resume.py
```

The PDF is written to `resume/output/Ali-Nasr-Resume.pdf`.

## Data sources

All content comes from `assets/data/*.json` — the same files that drive the website.
Editing a JSON file updates both the website and the next generated résumé.

| File | Section |
|---|---|
| `about.json` | About |
| `experience.json` | Experience |
| `education.json` | Education |
| `publications.json` | Publications |
| `certifications.json`, `awards.json`, `scores.json` | Credentials |
| `projects.json`, `volunteering.json`, `recommendations.json` | Engagement |

## Future: compact mode

`generate_resume.py` has a `MODE = "full"` constant at the top. A future `"compact"` mode
will emit only section titles with links to the corresponding website sections, keeping
the PDF short while directing readers to the site for full detail.
