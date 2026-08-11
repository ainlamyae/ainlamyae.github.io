"""
generate_resume.py — Build Ali-Nasr-Resume.pdf from the site's assets/data/*.json files.

Usage:
    python resume/generate_resume.py

Requires pdflatex (MiKTeX recommended on Windows).  On first run, MiKTeX will
auto-install any missing packages — an internet connection is needed.
"""

import json
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR  = REPO_ROOT / "assets" / "data"
OUT_DIR   = Path(__file__).resolve().parent / "output"
SITE_URL  = "https://ainlamyae.github.io"
MODE      = "full"   # "compact" mode: future — emit section-level hyperlinks only

# ---------------------------------------------------------------------------
# Contact constants  (same source as header.html / vCard — no JSON for these)
# ---------------------------------------------------------------------------
CONTACT = {
    "name":    "Ali Nasr",
    "title":   "AI Systems Architect | R&D Engineer",
    "email":   "ainlamyae@gmail.com",
    "github":  "https://github.com/ainlamyae",
    "linkedin":"https://www.linkedin.com/in/ainlamyae",
    "scholar": "https://scholar.google.ca/citations?user=h6Gu2p8AAAAJ",
    "website": SITE_URL,
}

# ---------------------------------------------------------------------------
# LaTeX escaping
# ---------------------------------------------------------------------------
_LATEX_SPECIAL = re.compile(r'([&%$#_{}~^\\])')
_SMART_QUOT    = str.maketrans({"‘": "'", "’": "'", "“": '"', "”": '"',
                                "–": "--", "—": "---"})

def esc(text: str) -> str:
    if not text:
        return ""
    text = text.translate(_SMART_QUOT)
    text = _LATEX_SPECIAL.sub(lambda m: "\\" + m.group(1) if m.group(1) != "\\" else r"\textbackslash{}", text)
    return text

def href(url: str, label: str) -> str:
    return rf"\href{{{url}}}{{{esc(label)}}}"

def section_link(anchor: str, title: str) -> str:
    # Full mode: plain section heading (hyperref + # in moving args is fragile).
    # Compact mode (future): emit \href with section-level anchor instead.
    return rf"\section{{{esc(title)}}}"

# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------
def fmt_date(iso: str | None) -> str:
    if not iso:
        return "Present"
    try:
        return datetime.fromisoformat(iso[:10]).strftime("%b %Y")
    except ValueError:
        return esc(iso)

def date_range(d: dict) -> str:
    return f"{fmt_date(d.get('start'))} -- {fmt_date(d.get('end'))}"

def load(name: str) -> list | dict:
    path = DATA_DIR / f"{name}.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)

# ---------------------------------------------------------------------------
# Section builders
# ---------------------------------------------------------------------------

def build_header() -> str:
    c = CONTACT
    lines = [
        r"\begin{center}",
        rf"{{\Huge \textbf{{{esc(c['name'])}}}}}\\[4pt]",
        rf"{{\large {esc(c['title'])}}}\\[6pt]",
        (
            href(f"mailto:{c['email']}", c['email'])
            + r" \quad|\quad "
            + href(c["website"], "Website")
            + r" \quad|\quad "
            + href(c["github"], "GitHub")
            + r" \quad|\quad "
            + href(c["linkedin"], "LinkedIn")
            + r" \quad|\quad "
            + href(c["scholar"], "Google Scholar")
        ),
        r"\end{center}",
        r"\vspace{-4pt}",
    ]
    return "\n".join(lines)


def build_about() -> str:
    data = load("about")
    out = [r"\section{About}"]
    out.append(esc(data["summary"]))
    out.append("")
    for group in data["groups"]:
        out.append(rf"\textbf{{{esc(group['title'])}}}\\[2pt]")
        out.append(r"\begin{itemize}[noitemsep,topsep=2pt,leftmargin=*]")
        for item in group["items"]:
            if group["style"] == "tag":
                out.append(rf"  \item \textbf{{{esc(item['label'])}:}} {esc(item['text'])}")
            else:
                out.append(rf"  \item {esc(item)}")
        out.append(r"\end{itemize}")
        out.append("")
    return "\n".join(out)


def build_experience() -> str:
    entries = sorted(load("experience"), key=lambda e: e["date"]["start"], reverse=True)
    out = [section_link("experience", "Experience")]
    for e in entries:
        org   = esc(e["organization"])
        pos   = esc(e["position"])
        addr  = esc(e.get("address", ""))
        dr    = date_range(e["date"])
        emp   = esc(e.get("employmentType", ""))
        group = esc(e.get("group", ""))

        out.append(rf"\textbf{{{pos}}} \hfill {dr}\\")
        out.append(rf"\textit{{{org}}} --- {addr}")
        if emp:
            out.append(rf"\\ \textit{{{emp}}}")
        if group:
            out.append(rf"\\ {group}")

        for item in e.get("items", []):
            title = esc(item.get("title", ""))
            descs = item.get("description", [])
            out.append(rf"\vspace{{4pt}}\textit{{{title}}}")
            if descs:
                out.append(r"\begin{itemize}[noitemsep,topsep=2pt,leftmargin=*]")
                for d in descs:
                    out.append(rf"  \item {esc(d)}")
                out.append(r"\end{itemize}")

        out.append(r"\vspace{6pt}")

    return "\n".join(out)


def build_education() -> str:
    entries = sorted(load("education"), key=lambda e: e["date"]["end"] or "9999", reverse=True)
    out = [section_link("education", "Education")]
    for e in entries:
        inst  = esc(e["institution"]["name"])
        addr  = esc(e["institution"].get("address", ""))
        level = esc(e["degree"]["level"])
        abbr  = esc(e["degree"]["abbreviation"])
        field = esc(e["degree"]["field"])
        dr    = date_range(e["date"])
        major = esc(e.get("major", ""))

        out.append(rf"\textbf{{{level} ({abbr}) in {field}}} \hfill {dr}\\")
        out.append(rf"\textit{{{inst}}} --- {addr}\\")
        if major:
            out.append(rf"\textit{{Major:}} {major}\\")
        out.append(r"\vspace{6pt}")

    return "\n".join(out)


def _format_authors(authors: list) -> str:
    """Mirror the website's formatAuthors: 'Last, First' → 'F. Last', bold for Ali Nasr."""
    if not authors:
        return ""
    formatted = []
    for author in authors:
        parts = author.split(",", 1)
        if len(parts) == 2:
            last  = parts[0].strip()
            first = parts[1].strip()
            initial = first[0].upper() + "." if first else ""
            abbr = f"{initial} {last}" if initial else last
            if last == "Nasr" and first == "Ali":
                abbr = rf"\textbf{{{abbr}}}"
            formatted.append(abbr)
        else:
            formatted.append(esc(author))
    if len(formatted) == 1:
        return formatted[0]
    if len(formatted) == 2:
        return f"{formatted[0]} and {formatted[1]}"
    return ", ".join(formatted[:-1]) + ", and " + formatted[-1]


def _pub_entry(pub: dict, label: str) -> str:
    """Build one publication line matching the website's citation format."""
    authors = _format_authors(pub.get("authors", []))
    title   = esc(pub["title"])
    year    = pub["date"][:4] if pub.get("date") else ""
    ptype   = pub.get("type", "")

    # Link: DOI preferred, then url field
    doi = pub.get("doi", "").strip()
    url = pub.get("url", "").strip()
    link = (f"https://doi.org/{doi}" if doi else url)

    title_tex = (rf"\href{{{link}}}{{{title}}}" if link else title)

    # Venue string — mirrors JS renderGroup logic
    if ptype == "article":
        parts = []
        if pub.get("publisher"): parts.append(esc(pub["publisher"]))
        if pub.get("journal"):   parts.append(esc(pub["journal"]))
        venue = rf"\textit{{{' '.join(parts)}}}" if parts else ""
    elif ptype == "inproceedings":
        parts = []
        if pub.get("publisher"): parts.append(esc(pub["publisher"]))
        if pub.get("booktitle"): parts.append(esc(pub["booktitle"]))
        venue = rf"\textit{{{' '.join(parts)}}}" if parts else ""
        if pub.get("address"):   venue += rf", {esc(pub['address'])}"
    elif ptype == "patent":
        venue = rf"\textit{{{esc(pub['publisher'])}}}" if pub.get("publisher") else ""
    elif ptype == "thesis":
        deg  = esc(pub.get("degree", ""))
        pub_ = rf"\textit{{{esc(pub['publisher'])}}}" if pub.get("publisher") else ""
        venue = f"{deg}, {pub_}" if deg and pub_ else (deg or pub_)
    else:
        venue = ""

    # Volume / number / pages extras
    extras = []
    if pub.get("volume"): extras.append(rf"vol.~{esc(str(pub['volume']))}")
    if pub.get("number"): extras.append(rf"no.~{esc(str(pub['number']))}")
    if pub.get("pages"):
        pages = pub["pages"].replace(" ", "")
        extras.append(rf"pp.~{esc(pages)}" if "-" in pages else rf"p.~{esc(pages)}")
    extra = (", " + ", ".join(extras)) if extras else ""

    venue_part = f", {venue}" if venue else ""
    return rf"\item[{{[{label}]}}] {authors}, ``{title_tex}''{venue_part}{extra}, {year}."


def build_publications() -> str:
    data = load("publications")

    groups = {"article": [], "inproceedings": [], "patent": [], "thesis": []}
    for pub in data:
        if pub["type"] in groups:
            groups[pub["type"]].append(pub)

    prefix = {"article": "J", "inproceedings": "C", "patent": "P", "thesis": "T"}
    titles = {"article": "Journal", "inproceedings": "Conference", "patent": "Patent", "thesis": "Thesis"}

    out = [section_link("publications", "Publications")]

    for type_key in ("article", "inproceedings", "patent", "thesis"):
        items = sorted(groups[type_key], key=lambda p: p["date"], reverse=True)
        if not items:
            continue
        total = len(items)
        out.append(rf"\textbf{{{titles[type_key]} ({total})}}\\[2pt]")
        out.append(r"{\footnotesize")
        out.append(r"\begin{itemize}[noitemsep,topsep=2pt,leftmargin=*,label={}]")
        for idx, pub in enumerate(items):
            number = total - idx       # descending: newest gets highest number
            label  = f"{prefix[type_key]}{number}"
            out.append(_pub_entry(pub, label))
        out.append(r"\end{itemize}")
        out.append(r"}")
        out.append("")

    return "\n".join(out)


def build_credentials() -> str:
    certs  = sorted(load("certifications"), key=lambda e: e["date"], reverse=True)
    awards = sorted(load("awards"), key=lambda e: e["date"], reverse=True)
    scores = load("scores")

    out = [section_link("credentials", "Credentials")]

    # Certifications (grouped by type — top 20 most recent shown)
    out.append(r"\textbf{Selected Certifications}\\[2pt]")
    out.append(r"\begin{itemize}[noitemsep,topsep=2pt,leftmargin=*]")
    for c in certs[:20]:
        date  = fmt_date(c.get("date", ""))
        title = esc(c["title"])
        org   = esc(c["organization"])
        url   = c.get("url", "")
        entry = rf"\item [{date}] {href(url, c['title']) if url else title} --- {org}"
        out.append(entry)
    if len(certs) > 20:
        out.append(rf"\item \ldots and {len(certs) - 20} more — see {href(SITE_URL + '/#credentials', 'website')}")
    out.append(r"\end{itemize}")
    out.append("")

    # Awards
    out.append(r"\textbf{Awards \& Honours}\\[2pt]")
    out.append(r"\begin{itemize}[noitemsep,topsep=2pt,leftmargin=*]")
    for a in awards:
        date  = fmt_date(a.get("date", ""))
        title = esc(a["title"])
        inst  = esc(a.get("institution", ""))
        out.append(rf"\item [{date}] {title} --- {inst}")
    out.append(r"\end{itemize}")
    out.append("")

    # Scores
    out.append(r"\textbf{Standardised Scores}\\[2pt]")
    out.append(r"\begin{itemize}[noitemsep,topsep=2pt,leftmargin=*]")
    for s in scores:
        name    = esc(s.get("fullName") or s.get("organization", ""))
        overall = s.get("score", {}).get("overall", "")
        issued  = fmt_date(s.get("date", {}).get("issued"))
        out.append(rf"\item {name}: {esc(str(overall))} ({issued})")
    out.append(r"\end{itemize}")

    return "\n".join(out)


def build_projects() -> str:
    projects = load("projects")
    out = [section_link("engagement", "Projects")]
    out.append(r"\begin{itemize}[noitemsep,topsep=2pt,leftmargin=*]")
    for p in projects:
        title = esc(p["title"])
        desc  = p.get("description", [])
        date_str = ""
        if isinstance(p.get("date"), dict):
            date_str = " \\hfill " + date_range(p["date"])
        elif p.get("date"):
            date_str = " \\hfill " + fmt_date(str(p["date"]))
        out.append(rf"\item \textbf{{{title}}}{date_str}")
        if isinstance(desc, list):
            for d in desc[:2]:
                out.append(rf"  \begin{{itemize}}[noitemsep,topsep=0pt,leftmargin=*]")
                out.append(rf"    \item {esc(d)}")
                out.append(rf"  \end{{itemize}}")
        elif desc:
            out.append(rf"  \begin{{itemize}}[noitemsep,topsep=0pt,leftmargin=*]")
            out.append(rf"    \item {esc(str(desc))}")
            out.append(rf"  \end{{itemize}}")
    out.append(r"\end{itemize}")
    return "\n".join(out)


def build_engagement() -> str:
    projects = load("projects")
    vol      = sorted(load("volunteering"), key=lambda e: e["date"]["start"], reverse=True)
    recs     = sorted(load("recommendations"), key=lambda e: e["date"], reverse=True)

    out = [section_link("engagement", "Engagement")]

    # Projects
    out.append(r"\textbf{Projects}\\[2pt]")
    out.append(r"\begin{itemize}[noitemsep,topsep=2pt,leftmargin=*]")
    for p in projects:
        title = esc(p["title"])
        desc  = p.get("description", [])
        date_str = ""
        if isinstance(p.get("date"), dict):
            date_str = " \\hfill " + date_range(p["date"])
        elif p.get("date"):
            date_str = " \\hfill " + fmt_date(str(p["date"]))
        out.append(rf"\item \textbf{{{title}}}{date_str}")
        if isinstance(desc, list):
            for d in desc[:2]:
                out.append(rf"  \begin{{itemize}}[noitemsep,topsep=0pt,leftmargin=*]")
                out.append(rf"    \item {esc(d)}")
                out.append(rf"  \end{{itemize}}")
        elif desc:
            out.append(rf"  \begin{{itemize}}[noitemsep,topsep=0pt,leftmargin=*]")
            out.append(rf"    \item {esc(str(desc))}")
            out.append(rf"  \end{{itemize}}")
    out.append(r"\end{itemize}")
    out.append("")

    # Volunteering
    out.append(r"\textbf{Volunteering}\\[2pt]")
    out.append(r"\begin{itemize}[noitemsep,topsep=2pt,leftmargin=*]")
    for v in vol:
        org = esc(v["organization"])
        pos = esc(v["position"])
        dr  = date_range(v["date"])
        out.append(rf"\item \textbf{{{pos}}} --- {org} \hfill {dr}")
        for item in v.get("items", []):
            t = esc(item.get("title", ""))
            if t:
                out.append(rf"  \begin{{itemize}}[noitemsep,topsep=0pt,leftmargin=*]")
                out.append(rf"    \item {t}")
                out.append(rf"  \end{{itemize}}")
    out.append(r"\end{itemize}")
    out.append("")

    # Recommendations (abbreviated)
    out.append(r"\textbf{Recommendations}\\[2pt]")
    out.append(r"\begin{itemize}[noitemsep,topsep=2pt,leftmargin=*]")
    for r in recs:
        name = esc(r["name"])
        rel  = esc(r.get("relationship", ""))
        org  = esc(r.get("organization", ""))
        text = esc(r.get("recommendation", ""))[:300]
        out.append(rf"\item \textbf{{{name}}} ({rel}, {org})\\")
        out.append(rf"  \textit{{{text}\ldots}}")
    out.append(r"\end{itemize}")

    return "\n".join(out)


# ---------------------------------------------------------------------------
# Full document assembly
# ---------------------------------------------------------------------------

def build_tex() -> str:
    preamble = r"""
\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[margin=2cm]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage[colorlinks=true,urlcolor=blue,linkcolor=black]{hyperref}
\usepackage{microtype}

\hypersetup{
  pdftitle={Ali Nasr -- Resume},
  pdfauthor={Ali Nasr},
  pdfsubject={AI Systems Architect and R\&D Engineer},
  pdfkeywords={AI, Systems Engineering, Robotics, Control, Machine Learning, Resume}
}

\setcounter{secnumdepth}{0}
\titleformat{\section}{\large\bfseries}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{8pt}{4pt}

\setlength{\parindent}{0pt}
\setlength{\parskip}{4pt}
\pagestyle{empty}
""".strip()

    sections = [
        build_header(),
        build_about(),
        build_experience(),
        build_education(),
        build_publications(),
        build_projects(),
    ]

    body = "\n\n".join(sections)

    return f"""{preamble}

\\begin{{document}}

{body}

\\end{{document}}
"""


# ---------------------------------------------------------------------------
# Compilation
# ---------------------------------------------------------------------------

def compile_pdf(tex_path: Path, out_dir: Path) -> Path:
    pdflatex = shutil.which("pdflatex")
    if not pdflatex:
        print("ERROR: pdflatex not found in PATH.")
        print("Install MiKTeX from https://miktex.org/ and ensure pdflatex is on PATH.")
        sys.exit(1)

    cmd = [
        pdflatex,
        "-interaction=nonstopmode",
        "-halt-on-error",
        f"-output-directory={out_dir}",
        str(tex_path),
    ]

    for run in (1, 2):
        print(f"  pdflatex pass {run}/2 ...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            log_file = out_dir / tex_path.with_suffix(".log").name
            print(f"pdflatex FAILED on pass {run}. Last 40 lines of log:")
            if log_file.exists():
                lines = log_file.read_text(encoding="utf-8", errors="replace").splitlines()
                print("\n".join(lines[-40:]))
            else:
                print(result.stdout[-3000:])
                print(result.stderr[-1000:])
            sys.exit(1)

    # Clean up auxiliary files
    stem = tex_path.stem
    for ext in (".aux", ".log", ".out", ".fls", ".fdb_latexmk", ".synctex.gz"):
        p = out_dir / (stem + ext)
        if p.exists():
            p.unlink()

    return out_dir / (stem + ".pdf")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Building LaTeX source ...")
    tex_content = build_tex()

    tex_path = OUT_DIR / "Ali-Nasr-Resume.tex"
    tex_path.write_text(tex_content, encoding="utf-8")
    print(f"  Written: {tex_path}")

    print("Compiling PDF ...")
    pdf_path = compile_pdf(tex_path, OUT_DIR)
    print(f"  Done: {pdf_path}")


if __name__ == "__main__":
    main()
