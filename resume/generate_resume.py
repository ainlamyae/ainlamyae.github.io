"""
generate_resume.py — Build Ali-Nasr-Resume.pdf from the site's assets/data/*.json files.

Usage:
    python resume/generate_resume.py

Requires pdflatex (MiKTeX recommended on Windows).  On first run, MiKTeX will
auto-install any missing packages (sourcesanspro, titlesec, fancyhdr, etaremune,
lastpage, ...) — an internet connection is needed.

Visual style is defined in resume/resume.sty (ported from an earlier hand-built
LaTeX resume): RoyalRed small-caps section rules, a light-blue highlight bar for
organization/degree/group headers, RoyalBlue bold sub-headers, and a RoyalBlue
"page x of y / last updated" footer.
"""

import json
import re
import shutil
import subprocess
import sys
import unicodedata
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR  = REPO_ROOT / "assets" / "data"
RESUME_DIR = Path(__file__).resolve().parent
OUT_DIR   = RESUME_DIR / "output"
STY_PATH  = RESUME_DIR / "resume.sty"
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

def section_link(_anchor: str, title: str) -> str:
    # Full mode: plain section heading (hyperref + # in moving args is fragile).
    # Compact mode (future): emit \href with section-level anchor instead.
    return rf"\section{{{esc(title)}}}"

# ---------------------------------------------------------------------------
# Deep links — mirrors assets/script/utils.js `slugify` / `makePermalink` so
# each title in the PDF links to the exact same in-page anchor the website
# assigns that entry (e.g. "exp-cognitive-memory-pipeline...").
# ---------------------------------------------------------------------------
_SLUG_NON_ALNUM = re.compile(r"[^a-z0-9]+")

def slugify(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = _SLUG_NON_ALNUM.sub("-", text.lower()).strip("-")
    return text[:60]

def title_href(anchor_id: str, title: str) -> str:
    # Use a query param, not a "#" fragment: PDF readers are inconsistent about
    # literal "#" in clickable links — some percent-encode it to "%23" before
    # handing the URL to a browser, turning "/#id" into a nonexistent "/%23id"
    # path (404). "?id=" is unambiguous and needs no LaTeX escaping either.
    # assets/script/utils.js `revealHashTarget()` reads this param as a fallback.
    return rf"\href{{{SITE_URL}/?id={anchor_id}}}{{{esc(title)}}}"

def sub_header(text: str) -> str:
    """Organization / institution / group-level header — highlight bar."""
    return rf"\subsection{{{text}}}"

def sub_entry(text: str) -> str:
    """Position / degree / entry-level header — bold RoyalBlue."""
    return rf"\subsubsection{{{text}}}"

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
    contact_line = (
        href(f"mailto:{c['email']}", c['email'])
        + r"~|~"
        + href(c["website"], "Website")
        + r"~|~"
        + href(c["github"], "GitHub")
        + r"~|~"
        + href(c["linkedin"], "LinkedIn")
        + r"~|~"
        + href(c["scholar"], "Google Scholar")
    )
    lines = [
        rf"\def\name{{{esc(c['name'])}}}",
        r"\thispagestyle{empty}",
        r"\begin{center}",
        rf"\resheader{{{esc(c['name'])}}} \\[4pt]",
        contact_line,
        r"\end{center}",
        r"\vspace{2pt}",
    ]
    return "\n".join(lines)


def build_about() -> str:
    data = load("about")
    out = [section_link("about", "Summary")]
    out.append(esc(data["summary"]))
    out.append("")
    for group in data["groups"]:
        out.append(rf"\textbf{{{esc(group['title'])}}}\\[2pt]")
        out.append(r"\begin{itemize}")
        for item in group["items"]:
            if group["style"] == "tag":
                out.append(rf"  \item \reslabel{{{esc(item['label'])}}}: {esc(item['text'])}")
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

        header = f"{org} --- {addr}" if addr else org
        out.append(sub_header(rf"{header} \hfill {dr}"))
        out.append(sub_entry(f"{pos}{f' | {emp}' if emp else ''}"))
        if group:
            out.append(rf"\textit{{{group}}}\\[2pt]")

        out.append(r"\begin{itemize}")
        for item in e.get("items", []):
            raw_title = item.get("title", "")
            title = title_href(item.get("id") or slugify(raw_title), raw_title) if raw_title else ""
            descs = item.get("description", [])
            idate = item.get("date")
            idr   = rf" \hfill {date_range(idate)}" if idate else ""
            out.append(rf"  \item \textbf{{{title}}}{idr}")
            if descs:
                out.append(r"  \begin{itemize}")
                for d in descs:
                    out.append(rf"    \item {esc(d)}")
                out.append(r"  \end{itemize}")
        out.append(r"\end{itemize}")
        out.append(r"\vspace{4pt}")

    return "\n".join(out)


def build_education() -> str:
    entries = sorted(load("education"), key=lambda e: e["date"]["end"] or "9999", reverse=True)
    out = [section_link("education", "Education")]
    for e in entries:
        inst  = esc(e["institution"]["name"])
        addr  = esc(e["institution"].get("address", ""))
        dr    = date_range(e["date"])
        major = esc(e.get("major", ""))

        degree_title = f"{e['degree']['level']} ({e['degree']['abbreviation']}) in {e['degree']['field']}"

        header = f"{inst} --- {addr}" if addr else inst
        out.append(sub_header(rf"{header} \hfill {dr}"))
        out.append(sub_entry(title_href(e.get("id") or slugify(degree_title), degree_title)))
        if major:
            out.append(rf"\textit{{Major:}} {major}\\")
        out.append(r"\vspace{4pt}")

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
    return rf"\item[{{\publabel{{[{label}]}}}}] {authors}, ``{title_tex}''{venue_part}{extra}, {year}."


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
        out.append(sub_header(f"{titles[type_key]} ({total})"))
        out.append(r"{\footnotesize")
        out.append(r"\begin{itemize}[label={}, leftmargin=2.6em, itemindent=0pt, labelsep=0.4em]")
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
    out.append(sub_header("Selected Certifications"))
    out.append(r"\begin{itemize}")
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
    out.append(sub_header("Awards \\& Honours"))
    out.append(r"\begin{itemize}")
    for a in awards:
        date  = fmt_date(a.get("date", ""))
        title = esc(a["title"])
        inst  = esc(a.get("institution", ""))
        out.append(rf"\item [{date}] {title} --- {inst}")
    out.append(r"\end{itemize}")
    out.append("")

    # Scores
    out.append(sub_header("Standardised Scores"))
    out.append(r"\begin{itemize}")
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
    out.append(r"\begin{itemize}")
    for p in projects:
        title = title_href(p.get("id") or slugify(p["title"]), p["title"])
        desc  = p.get("description", [])
        date_str = ""
        if isinstance(p.get("date"), dict):
            date_str = " \\hfill " + fmt_date(p["date"].get("end") or p["date"].get("start"))
        elif p.get("date"):
            date_str = " \\hfill " + fmt_date(str(p["date"]))
        out.append(rf"\item \textbf{{{title}}}{date_str}")
        if isinstance(desc, list) and desc:
            out.append(r"  \begin{itemize}")
            for d in desc:
                out.append(rf"    \item {esc(d)}")
            out.append(r"  \end{itemize}")
        elif desc:
            out.append(r"  \begin{itemize}")
            out.append(rf"    \item {esc(str(desc))}")
            out.append(r"  \end{itemize}")
    out.append(r"\end{itemize}")
    return "\n".join(out)


def build_engagement() -> str:
    projects = load("projects")
    vol      = sorted(load("volunteering"), key=lambda e: e["date"]["start"], reverse=True)
    recs     = sorted(load("recommendations"), key=lambda e: e["date"], reverse=True)

    out = [section_link("engagement", "Engagement")]

    # Projects
    out.append(sub_header("Projects"))
    out.append(r"\begin{itemize}")
    for p in projects:
        title = title_href(p.get("id") or slugify(p["title"]), p["title"])
        desc  = p.get("description", [])
        date_str = ""
        if isinstance(p.get("date"), dict):
            date_str = " \\hfill " + date_range(p["date"])
        elif p.get("date"):
            date_str = " \\hfill " + fmt_date(str(p["date"]))
        out.append(rf"\item \textbf{{{title}}}{date_str}")
        if isinstance(desc, list) and desc:
            out.append(r"  \begin{itemize}")
            for d in desc:
                out.append(rf"    \item {esc(d)}")
            out.append(r"  \end{itemize}")
        elif desc:
            out.append(r"  \begin{itemize}")
            out.append(rf"    \item {esc(str(desc))}")
            out.append(r"  \end{itemize}")
    out.append(r"\end{itemize}")
    out.append("")

    # Volunteering
    out.append(sub_header("Volunteering"))
    out.append(r"\begin{itemize}")
    for v in vol:
        org = esc(v["organization"])
        pos = esc(v["position"])
        dr  = date_range(v["date"])
        out.append(rf"\item \textbf{{{pos}}} --- {org} \hfill {dr}")
        for item in v.get("items", []):
            t = esc(item.get("title", ""))
            if t:
                out.append(r"  \begin{itemize}")
                out.append(rf"    \item {t}")
                out.append(r"  \end{itemize}")
    out.append(r"\end{itemize}")
    out.append("")

    # Recommendations (abbreviated)
    out.append(sub_header("Recommendations"))
    out.append(r"\begin{itemize}")
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
\documentclass[letterpaper,11pt]{article}
\usepackage{resume}

\hypersetup{
  pdftitle={Ali Nasr -- Resume},
  pdfauthor={Ali Nasr},
  pdfsubject={AI Systems Architect and R\&D Engineer},
  pdfkeywords={AI, Systems Engineering, Robotics, Control, Machine Learning, Resume}
}
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
    shutil.copy(STY_PATH, OUT_DIR / STY_PATH.name)

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
