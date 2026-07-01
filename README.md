# Imperfection Engineering Group Website

Clean, minimal, mobile-friendly static site for the Imperfection Engineering Group. **No build step** — pure HTML/CSS/JS, content driven from JSON. Works locally (`python -m http.server`) and on GitHub Pages.

## Run locally

```bash
cd ~/new_website
python -m http.server 8000
# open http://localhost:8000
```

## Site map

| URL                        | Source file                | Data file              |
|----------------------------|----------------------------|------------------------|
| `/`                        | `index.html`               | `data/news.json`       |
| `/pages/research.html`     | `pages/research.html`      | —                      |
| `/pages/group.html`        | `pages/group.html`         | `data/group.json`      |
| `/pages/publications.html` | `pages/publications.html`  | `data/publications.json` |
| `/pages/software.html`     | `pages/software.html`      | `data/software.json`   |
| `/pages/news.html`         | `pages/news.html`          | `data/news.json`       |
| `/pages/joinus.html`       | `pages/joinus.html`        | —                      |

## How to update content

### News (with image)
Drop the image in `news_images/`, then add a JSON entry to `data/news.json`:

```json
{
  "date": "2026-06-13",
  "title": "Group received NSF CAREER award",
  "description": "Brief one-liner that appears on the card.",
  "image": "news_images/award.jpg",
  "url": "https://link/to/full/story"
}
```

The home page shows the **3 most recent** automatically; `pages/news.html` shows them all, sorted by date.

### Publications (auto from Google Scholar — preferred)
Find your Scholar user ID (the `user=…` in your profile URL), then:

```bash
pip install scholarly bibtexparser
python scripts/update_publications.py --scholar-id YOUR_ID
```

This rewrites `data/publications.json` with everything from Scholar (titles, authors, venue, year, citation counts).

### Publications (BibTeX fallback)
Edit `data/publications.bib` and run:

```bash
python scripts/update_publications.py --bib data/publications.bib
```

### Both (BibTeX as base, Scholar to enrich with citation counts)
```bash
python scripts/update_publications.py --bib data/publications.bib --scholar-id YOUR_ID --merge
```

The publications page has live **search** (title/author/venue) and **year filter**, sorted newest-first.

### Group members
Edit `data/group.json` — `principal_investigator`, `postdocs`, `graduate_students`, `undergraduate_students`, `alumni`. Photos go in `assets/img/` and the path is `assets/img/<file>`.

### Research projects
Edit `data/projects.json`. Each project lists one **or more** themes; it appears once under every theme it lists. Theme slugs are: `polycrystalline-ensembles`, `materials-defect-genome`, `alloy-design`.

```json
{
  "title": "Project title",
  "themes": ["polycrystalline-ensembles", "alloy-design"],
  "tags": ["short", "topic", "labels"],
  "description": "One-paragraph summary.",
  "image": "assets/img/project-figure.svg",
  "links": [{ "text": "Paper", "url": "https://..." }]
}
```

To add or rename themes, edit the `RESEARCH_THEMES` array near the top of `assets/js/site.js`.

### Teaching — Courses
Edit `data/courses.json`. Each course renders as a card with a figure on the left, course code/level/term tags, a short description, and a syllabus button. Each course can have:

```json
{
  "code": "MTEN 631",
  "title": "Course Title",
  "level": "Graduate",
  "term": "Fall 2025",
  "description": "Short paragraph describing the course.",
  "syllabus": "https://link-to-or-relative-path-to/syllabus.pdf",
  "image": "assets/img/course-figure.svg",
  "links": [{ "text": "Course site", "url": "https://..." }]
}
```

To add a figure: drop it under `assets/img/` and reference it as `assets/img/<file>`.

### Teaching — Recommended Reading
Edit `data/reading.json`. Top-level array is sections (categories); each section has `category` and `items[]` (each with `title`, `url`, optional `note`).

### Software
Edit `data/software.json`. Each entry can have multiple links — set `"type": "github"`, `"doi"`, or `"link"` and the right icon shows automatically.

```json
{
  "name": "MyPackage",
  "category": "Atomistic Methods",
  "description": "What it does in one sentence.",
  "tags": ["python", "GB"],
  "links": [
    { "type": "github", "text": "GitHub", "url": "https://github.com/nutthtu/MyPackage" },
    { "type": "doi",    "text": "DOI",    "url": "https://doi.org/10.5281/zenodo.xxxxxxx" }
  ]
}
```

## Replacing logo / background
- Logo: `assets/img/logo.png` (used in hero + nav + favicon-ish)
- Hero & page-banner background: `assets/img/background.png`

Just swap those files — the CSS picks them up.

## Deploying to GitHub Pages
Copy the entire `new_website/` contents to the root of your `nutthtu.github.io` repo (replacing the existing files), commit, and push. GitHub Pages serves it as-is. No Jekyll required.

## Design notes
- Single CSS file (`assets/css/style.css`) using CSS custom properties — change colors in one place.
- Color palette taken from the group logo: navy `#1a2a55`, red `#c8242a`, gray `#6b6b6b`.
- Mobile-first responsive layout; hamburger nav under 800 px wide.
- Sticky translucent header.
- Source Serif headings + system-sans body for a clean academic feel.
