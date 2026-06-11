"""
wordcloud.py — Scan assets/data/*.json for the most frequent words and write
the results to assets/data/wordcloud.json as {"text": ..., "weight": ...}
entries, ready for manual curation and rendering by assets/script/wordcloud.js.

Usage:
    python assets/analysis/wordcloud.py
"""

import json
import re
from collections import Counter
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = REPO_ROOT / "assets" / "data"
OUTPUT_FILE = DATA_DIR / "wordcloud.json"
PEOPLE_FILE = DATA_DIR / "people.json"
ABOUT_FILE = DATA_DIR / "about.json"
TOP_N = 100

# Words made of letters, optionally followed by letters/digits/+/#/./- (covers
# things like "C++", "Node.js", "real-time", "RAG").
TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9+#.\-]*")

# Skip whole strings that look like file paths or URLs rather than prose.
PATH_RE = re.compile(
    r"^(https?://|/|assets/)|\.(png|jpe?g|svg|pdf|ico|webp|gif|mp4|json)$",
    re.IGNORECASE,
)

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "if", "while", "of", "to", "in", "on",
    "for", "with", "at", "by", "from", "up", "down", "out", "off", "over",
    "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "any", "both", "each", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
    "than", "too", "very", "s", "t", "can", "will", "just", "don", "should",
    "now", "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "having", "do", "does", "did", "doing", "would", "could", "might",
    "must", "shall", "i", "me", "my", "we", "our", "you", "your", "he", "him",
    "his", "she", "her", "it", "its", "they", "them", "their", "this", "that",
    "these", "those", "as", "into", "through", "during", "before", "after",
    "above", "below", "between", "about", "against", "also", "etc", "via",
    "using", "used", "use", "based", "including", "include", "includes",
    "various", "new", "like", "one", "two", "within", "across", "per",
    "towards", "toward", "among", "upon", "whose", "which", "who", "whom",
    "what", "am", "ll", "re", "ve", "d", "m", "o", "y", "ma",
    # Ordinal suffixes (e.g. "7th", "3rd" -> "th"/"rd") and the site owner's
    # own surname, which would otherwise dominate the word cloud.
    "th", "st", "nd", "rd", "nasr",
    # Generic/filler words that are too vague to be useful word-cloud terms,
    # explicitly excluded by the site owner.
    "study", "experimental", "work", "result", "professional", "device",
    "task", "different", "test", "proposed", "technology", "research",
    "conference", "leadership", "core", "foundation", "skill",
    "engineering", "project", "implement", "management", "international",
    "dof", "proce", "paper", "support", "inproce", "proces", "driv",
    "integrat", "proceed", "inproceed",
    "conduct", "general", "student", "iot", "advance", "performance",
    "challenge", "angle", "evaluate",
    "method", "develop", "approach", "integrate", "service", "evaluation",
    "equation", "path", "input", "industrial",
    "present", "future", "component", "article",
    "however", "technical", "journal", "function", "complex", "object",
    "improve",
}


# Keys whose values are addresses/affiliations or term/date labels (e.g.
# "Waterloo, Ontario, Canada", "Huawei Technologies Canada", "Fall 2018") —
# location and time info, not topical content.
SKIP_KEYS = {"address", "term", "organization", "institution"}


def extract_strings(value):
    """Recursively yield every string found in a JSON value."""
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for k, v in value.items():
            if k in SKIP_KEYS:
                continue
            yield from extract_strings(v)
    elif isinstance(value, list):
        for v in value:
            yield from extract_strings(v)


# Suffixes where the word is already singular (or uncountable) even though it
# ends in "s" — e.g. "dynamics", "robotics", "analysis", "thesis", "process".
SINGULAR_S_SUFFIXES = ("ss", "us", "is", "ics")


def singularize(word):
    """Collapse simple plural forms to their singular so e.g. "system" and
    "systems" are counted (and displayed) as one word."""
    if len(word) <= 3 or word.endswith(SINGULAR_S_SUFFIXES):
        return word
    if word.endswith("ies"):
        return word[:-3] + "y"
    if word.endswith("es") and word[:-2].endswith(("s", "x", "z", "ch", "sh")):
        return word[:-2]
    if word.endswith("s"):
        return word[:-1]
    return word


# "-ing" forms collapse to their base verb/noun (e.g. "modeling" -> "model",
# "programming" -> "program") so gerund and base forms aren't counted
# separately. A few field/discipline names are themselves the canonical term
# and shouldn't be stemmed further.
GERUND_EXCEPTIONS = {"engineering", "learning"}


# Consonants commonly dropped before "-ing"/"-ed" is appended to a
# silent-"e" verb (e.g. "drive" -> "driving", "optimize" -> "optimized",
# "evaluate" -> "evaluating") — restore the "e" when the stripped base ends
# in one of these, or in "at".
def _restore_silent_e(base):
    if base.endswith("at") or base.endswith(("v", "z", "c", "g")):
        return base + "e"
    return base


def _undo_doubled_consonant(base):
    if len(base) >= 2 and base[-1] == base[-2] and base[-1] not in "aeious":
        return base[:-1]
    return base


def degerund(word):
    if word in GERUND_EXCEPTIONS or not word.endswith("ing") or len(word) <= 6:
        return word
    return _restore_silent_e(_undo_doubled_consonant(word[:-3]))


def depast(word):
    """Collapse simple past-tense "-ed" forms to their base verb (e.g.
    "designed" -> "design", "developed" -> "develop")."""
    if not word.endswith("ed") or len(word) <= 5 or word.endswith("eed"):
        return word
    if word.endswith("ied"):
        return word[:-3] + "y"
    return _restore_silent_e(_undo_doubled_consonant(word[:-2]))


# Specific words whose "-ics" form refers to the same concept as the "-ic"
# form here (unlike e.g. "robotics"/"mechanics", which SINGULAR_S_SUFFIXES
# protects because they mean something distinct from "robotic"/"mechanic").
WORD_OVERRIDES = {
    "dynamics": "dynamic",
    "kinematics": "kinematic",
}


def normalize(word):
    """Collapse plural, gerund ("-ing"), and past-tense ("-ed") forms of a
    word down to one shared base form."""
    word = WORD_OVERRIDES.get(word, word)
    return depast(degerund(singularize(word)))


def tokenize(text):
    for match in TOKEN_RE.finditer(text):
        token = match.group().strip(".-").lower()
        if len(token) < 2 or token in STOPWORDS:
            continue
        token = normalize(token)
        if token in STOPWORDS:
            continue
        yield token


def collect_tokens(json_file):
    data = json.loads(json_file.read_text(encoding="utf-8"))
    for text in extract_strings(data):
        if PATH_RE.search(text):
            continue
        yield from tokenize(text)


# Multi-word terminology (e.g. "neural network", "model predictive control")
# is built from runs of consecutive content words.
NGRAM_SIZES = (2, 3)

# List/clause separators — text on either side is unrelated, so a run must
# not cross these (e.g. "Generative AI, LLMs & AI Agents" is three separate
# items, not one five-word phrase).
SEGMENT_SPLIT_RE = re.compile(r"[,&;:/()]+")


def content_runs(json_file, exclude):
    """Yield lists of consecutive content-word tokens (stopwords, short
    tokens, excluded/people.json words, and list separators break a run)."""
    data = json.loads(json_file.read_text(encoding="utf-8"))
    for text in extract_strings(data):
        if PATH_RE.search(text):
            continue

        for segment in SEGMENT_SPLIT_RE.split(text):
            run = []
            for match in TOKEN_RE.finditer(segment):
                raw = match.group().strip(".-").lower()
                token = normalize(raw) if len(raw) >= 2 else raw

                if len(raw) < 2 or raw in STOPWORDS or token in STOPWORDS or token in exclude:
                    if run:
                        yield run
                        run = []
                    continue

                run.append(token)

            if run:
                yield run


# Words that don't carry meaning on their own when leading a comma/clause-
# separated skill phrase from about.json (e.g. "..., and Simulation").
PHRASE_LEADING_STOPWORDS = {"and", "or", "the", "a", "an", "of", "for"}


def extract_about_phrases():
    """Yield normalized-token lists for each multi-word, comma/clause-
    separated skill phrase in about.json's group items (e.g. "Multi-Agent
    Orchestration", "Sensor & Actuator Integration")."""
    if not ABOUT_FILE.exists():
        return
    data = json.loads(ABOUT_FILE.read_text(encoding="utf-8"))
    for group in data.get("groups", []):
        for item in group.get("items", []):
            texts = [item] if isinstance(item, str) else [item.get("label", ""), item.get("text", "")]
            for text in texts:
                for segment in SEGMENT_SPLIT_RE.split(text):
                    tokens = []
                    for match in TOKEN_RE.finditer(segment):
                        raw = match.group().strip(".-").lower()
                        if len(raw) < 2:
                            continue
                        tokens.append(normalize(raw))
                    while tokens and tokens[0] in PHRASE_LEADING_STOPWORDS:
                        tokens = tokens[1:]
                    if len(tokens) >= 2:
                        yield tokens


def main():
    # Names/prefixes from people.json (co-authors, advisors, etc.) are
    # contact metadata, not site content — exclude that file from the count
    # and strip any of its words (names, "prof", "dr", ...) wherever else
    # they appear (e.g. citation author lists in publications.json).
    exclude = set(collect_tokens(PEOPLE_FILE)) if PEOPLE_FILE.exists() else set()

    counter = Counter()
    for json_file in sorted(DATA_DIR.glob("*.json")):
        if json_file == PEOPLE_FILE:
            continue
        for run in content_runs(json_file, exclude):
            for token in run:
                counter[token] += 1
            for n in NGRAM_SIZES:
                for i in range(len(run) - n + 1):
                    counter[" ".join(run[i:i + n])] += 1

    # Skill phrases from about.json (e.g. "Multi-Agent Orchestration") are
    # mostly one-off and wouldn't otherwise rank, so weight each by the
    # combined frequency of its individual words.
    for tokens in extract_about_phrases():
        phrase = " ".join(tokens)
        if phrase in counter:
            continue
        weight = sum(counter.get(t, 0) for t in tokens)
        if weight > 0:
            counter[phrase] = weight

    top_words = [
        {"text": word, "weight": count}
        for word, count in counter.most_common(TOP_N)
    ]

    # One entry per line (instead of json.dumps(..., indent=2)) so unwanted
    # words can be deleted by simply removing a single line.
    lines = ["["]
    for i, item in enumerate(top_words):
        comma = "," if i < len(top_words) - 1 else ""
        lines.append(f'  {{ "text": {json.dumps(item["text"])}, "weight": {item["weight"]} }}{comma}')
    lines.append("]")
    OUTPUT_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Wrote {len(top_words)} words to {OUTPUT_FILE.relative_to(REPO_ROOT)}")
    print("\nTop 20:")
    for item in top_words[:20]:
        print(f"  {item['text']:<20} {item['weight']}")


if __name__ == "__main__":
    main()
