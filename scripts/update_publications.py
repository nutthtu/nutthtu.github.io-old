#!/usr/bin/env python3
"""
Update data/publications.json from either Google Scholar (preferred) or a BibTeX file.

Usage
-----
  # Google Scholar (preferred). Provide the Scholar user ID (the bit after `user=` in your
  # profile URL, e.g. https://scholar.google.com/citations?user=ABCdEFgHIJK):
  python scripts/update_publications.py --scholar-id ABCdEFgHIJK

  # BibTeX fallback:
  python scripts/update_publications.py --bib data/publications.bib

  # Use both: BibTeX as the base, Scholar to enrich with citation counts:
  python scripts/update_publications.py --bib data/publications.bib --scholar-id ABCdEFgHIJK --merge

The output is `data/publications.json` rendered by the website.

Dependencies (install once)
---------------------------
  pip install scholarly bibtexparser
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from datetime import date


HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = ROOT / "data" / "publications.json"


# ----------------- Google Scholar -----------------

def fetch_from_scholar(scholar_id: str, max_pubs: int | None = None) -> list[dict]:
    try:
        from scholarly import scholarly
    except ImportError:
        sys.exit("scholarly not installed.  pip install scholarly")

    print(f"[scholar] looking up user {scholar_id} …")
    author = scholarly.search_author_id(scholar_id)
    author = scholarly.fill(author, sections=["publications"])
    pubs = author.get("publications", [])
    if max_pubs:
        pubs = pubs[:max_pubs]

    out: list[dict] = []
    for i, p in enumerate(pubs, 1):
        print(f"[scholar] {i}/{len(pubs)}: filling …")
        try:
            filled = scholarly.fill(p)
        except Exception as e:
            print(f"  ! could not fill: {e}")
            continue
        bib = filled.get("bib", {})
        title = bib.get("title", "").strip()
        if not title:
            continue
        out.append({
            "title": title,
            "authors": bib.get("author", "").replace(" and ", ", "),
            "venue": bib.get("journal") or bib.get("conference") or bib.get("venue") or bib.get("publisher", ""),
            "year": _int_or_none(bib.get("pub_year")),
            "url": filled.get("pub_url") or filled.get("eprint_url") or "",
            "doi": "",  # Scholar rarely exposes DOI; left blank
            "citations": filled.get("num_citations", 0),
            "scholar_url": _abs_scholar(filled.get("citedby_url", "")),
        })
        time.sleep(0.4)  # be nice to Scholar
    return out


# ----------------- BibTeX -----------------

def fetch_from_bibtex(bib_path: Path) -> list[dict]:
    try:
        import bibtexparser
    except ImportError:
        sys.exit("bibtexparser not installed.  pip install bibtexparser")

    text = bib_path.read_text(encoding="utf-8")
    db = bibtexparser.loads(text)
    out: list[dict] = []
    for e in db.entries:
        title = _strip_braces(e.get("title", "")).strip()
        if not title:
            continue
        out.append({
            "title": title,
            "authors": _strip_braces(e.get("author", "")).replace(" and ", ", "),
            "venue": _strip_braces(e.get("journal", "") or e.get("booktitle", "") or e.get("publisher", "")),
            "year": _int_or_none(e.get("year", "")),
            "url": e.get("url", "") or e.get("eprint", ""),
            "doi": e.get("doi", ""),
            "citations": None,
            "scholar_url": "",
        })
    return out


def _strip_braces(s: str) -> str:
    return re.sub(r"[{}]", "", s).strip()


def _abs_scholar(u: str) -> str:
    if not u:
        return ""
    if u.startswith("/"):
        return "https://scholar.google.com" + u
    return u


def _int_or_none(s):
    m = re.search(r"\d{4}", str(s))
    return int(m.group()) if m else None


# ----------------- Merge -----------------

def merge_lists(base: list[dict], extra: list[dict]) -> list[dict]:
    """Merge `extra` into `base`, keyed on normalized title.
    Fields from `extra` override only when `base` value is empty/None."""
    def key(p): return re.sub(r"\W+", "", (p.get("title") or "").lower())
    idx = {key(p): p for p in base}
    for p in extra:
        k = key(p)
        if k in idx:
            for field, v in p.items():
                if v and not idx[k].get(field):
                    idx[k][field] = v
        else:
            base.append(p)
            idx[k] = p
    return base


# ----------------- CLI -----------------

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--scholar-id", help="Google Scholar user ID")
    ap.add_argument("--bib", type=Path, help="Path to a BibTeX file")
    ap.add_argument("--merge", action="store_true", help="Use bibtex as base, scholar to enrich (citations etc.)")
    ap.add_argument("--max", type=int, help="Cap number of Scholar entries fetched (for quick tests)")
    args = ap.parse_args()

    if not args.scholar_id and not args.bib:
        ap.error("Provide --scholar-id or --bib (or both).")

    if args.merge and args.bib and args.scholar_id:
        pubs = fetch_from_bibtex(args.bib)
        scholar_pubs = fetch_from_scholar(args.scholar_id, max_pubs=args.max)
        pubs = merge_lists(pubs, scholar_pubs)
        source = "bibtex+scholar"
    elif args.scholar_id:
        pubs = fetch_from_scholar(args.scholar_id, max_pubs=args.max)
        source = "google-scholar"
    else:
        pubs = fetch_from_bibtex(args.bib)
        source = "bibtex"

    pubs.sort(key=lambda p: (p.get("year") or 0), reverse=True)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({
        "meta": {
            "updated": date.today().isoformat(),
            "source": source,
            "count": len(pubs),
        },
        "publications": pubs,
    }, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[done] wrote {len(pubs)} publications → {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
