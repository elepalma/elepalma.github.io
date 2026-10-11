# CLAUDE.md — Palma Lab Website

## Commit checklist
Before every commit, scan all changed text content (data YAML files, layout HTML, content markdown) for:
- Spelling mistakes (names, scientific terms, institutions)
- Duplicate punctuation (e.g. `""`, `..`)
- Missing closing quotes in YAML strings
- Trailing spaces in names/affiliations

## Project overview
Static lab website for **Dr Elena Palma's research group** at the Roger Williams Institute of Liver Studies, King's College London. Focused on ALD, liver cancer, mitochondrial dysfunction, and fibrosis.

- **URL**: https://elepalma.github.io/
- **Repo**: https://github.com/elepalma/elepalma.github.io (main branch)
- **Generator**: Hugo v0.157.0+extended (Homebrew, `hugo` on PATH)
- **Hosting**: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- **CSS**: Tailwind CSS compiled locally — `npm run build:css` builds `assets/css/input.css` → `static/css/main.css` (config in `tailwind.config.js`); CI runs this before Hugo
- **Fonts**: DM Sans (Google Fonts, weights 400/500/600 only). Instrument Serif is not loaded; `font-serif` falls back to the system serif.
- **CI**: `.github/workflows/deploy.yml` pins Hugo 0.157.0, runs `npm test` (which itself builds the site with Hugo), then deploys. A weekly schedule (Monday 06:00 UTC) rebuilds the site so build-time dates stay fresh.

## Key commands

```bash
# Local development server
hugo server

# Rebuild CSS after changing Tailwind classes in layouts
npm run build:css

# Run the test suite (needs hugo on PATH and a fresh build:css)
npm test

# Production build (used by CI, after build:css)
hugo --minify
```

## Testing

`npm test` runs vitest (`js/*.test.js`, happy-dom):

| File | Covers |
|---|---|
| `js/main.test.js` | Mobile menu toggle, accordion, `aria-expanded`, Escape-to-close |
| `js/publications-filter.test.js` | Pure filter logic (`js/publications-filter.js`) and the DOM wiring in `static/js/publications-filter.js`, including the empty-state message |
| `js/events-filter.test.js` | `static/js/events-filter.js` — upcoming/past partition, sorting, linked titles, home-page limit, empty states |
| `js/data.test.js` | Validates every `data/*.yaml` file and research front matter: trailing spaces in quotes, unbalanced quotes, duplicate punctuation, `role_type` enum, ISO dates, DOI/URL format, journal not a bare year, clean `tag`, `keywords` present |
| `js/tokens.test.js` | WCAG AA contrast (≥ 4.5:1) for every text/background token pair in `tailwind.config.js`; minimum `2xs` size |
| `js/site-build.test.js` | Builds the site with Hugo into a temp dir and checks the HTML: one `h1` per page, sequential heading levels, skip link + `main#main`, no internal link with `target=_blank`, hamburger aria, focus CSS present, hero without `<br>`, all projects (not Techniques) on home and research grids, client-side events block, mitochondria framing in intros/bio, square portrait boxes, DOI-linked paper titles, author buttons only for people with papers, date-derived opportunity badges, Enquire/Apply labels, related publications on every project page, news not built |

`js/yaml-lite.js` is a tiny dependency-free reader for the flat YAML in `data/` (no `yaml` package is installed). Keep data files in the simple `key: "value"` / inline-array / block-list shape it supports.

Add or extend a test whenever a template, script, or data rule changes.

## Directory structure

```
layouts/          # All HTML templates (Hugo)
  _default/       # baseof.html (shell), single.html (fallback)
  index.html      # Home page
  partials/       # nav.html, footer.html, section-header.html, structured-data.html,
                  # event-data.html (hidden events data block), opportunity-status.html (date-aware badge), icon-x.html
  people/         # single.html — People page
  publications/   # single.html — Publications (with JS filtering)
  research/       # list.html (projects grid), single.html (project detail)
  news/           # list.html, single.html
  events/         # single.html
  join/           # single.html — Opportunities
  contact/        # single.html
  collaborators/  # single.html — Collaborators page

data/             # YAML data files (source of truth for content)
  people.yaml     # Lab members + alumni
  publications.yaml
  opportunities.yaml
  collaborators.yaml
  events.yaml

content/          # Markdown pages (mostly front matter only, data-driven)
  _index.md       # Home
  people.md       # type: people
  publications.md # type: publications
  join.md         # type: join
  collaborators.md # type: collaborators
  contact.md
  events.md
  research/       # _index.md + individual project .md files
  news/           # _index.md + individual news post .md files

static/
  css/main.css    # Compiled Tailwind output (gitignored; run build:css)
  js/             # main.js (nav), publications-filter.js, events-filter.js (shared by Events page and home)
  images/         # Photos etc.

js/               # Unit tests + pure modules (publications-filter.js, yaml-lite.js)
scripts/          # lint-html-classes.js, audit-safelist.js
```

## Tailwind design system (defined in tailwind.config.js)

| Token | Value |
|---|---|
| `text-ink` | `#1a1a1a` (body text) |
| `text-ink-light` | `#555` |
| `text-ink-faint` | `#6b6b6b` (was `#999`; darkened to pass 4.5:1 contrast — guarded by `js/tokens.test.js`) |
| `border-rule` / `bg-rule` | `#e2e2de` |
| `bg-bg` | `#fafaf8` (page background) |
| `text-accent` / `bg-accent` | `#2a5c45` (forest green) |
| `bg-accent-light` | `#eaf2ee` |
| `bg-accent-dark` | `#1e4533` |
| `max-w-wide` | `1400px` |
| `text-2xs` | `0.72rem` (minimum size; guarded by `js/tokens.test.js`) |
| font-serif | Instrument Serif |
| font-sans | DM Sans |

## Spacing conventions (compact style)

After the compaction update, standard vertical padding is:

| Context | Classes |
|---|---|
| Page hero (all detail pages) | `py-6 sm:py-10` |
| Main content wrapper (detail pages) | `py-6 sm:py-10` |
| Home hero | `py-8 sm:py-12 lg:py-14` |
| Home sections | `py-8 sm:py-10` |
| Footer | `py-6 sm:py-8` |
| Section dividers (`mb-*`) | `mb-8` |
| Border-top breaks (`pt-*`) | `pt-6` or `pt-8` |

Horizontal padding on all max-w-wide wrappers: `px-4 sm:px-8 lg:px-12 xl:px-20`

## Data file schemas

### `data/people.yaml`
```yaml
members:
  - name: "Full Name"
    pub_name: "Surname X"      # Abbreviated form as it appears in publication authors strings
    photo: "/images/people/file.jpg"
    initials: "AB"
    role: "Job Title"
    role_type: "pi" | "postdoc" | "phd" | "msc" | ...
    area: "Research area tags"
    bio: "Bio text"
    email: ""
    orcid: ""
    gscholar: ""
    twitter: ""
    linkedin: ""
    kcl: ""                    # KCL staff page URL

alumni:
  - name: "Full Name"
    pub_name: "Surname X"
    role: "Role held"
    years: "2020–2023"
    now: "Current position"
    thesis: "PhD thesis title (optional)"
```

### `data/publications.yaml`
```yaml
papers:
  - year: 2024
    title: "Paper title"
    authors: "Surname A, Surname B, Palma E, et al."  # Plain string, used for JS filtering
    journal: "Journal Name"
    doi: "https://doi.org/..."   # Empty string if no DOI
    keywords:
      - "keyword"
```

### `data/opportunities.yaml`
```yaml
roles:
  - emoji: "🎓"
    title: "Role Title"
    subtitle: "Short subtitle"
    description: "Full description"
    status: "Open"             # If contains "open" (case-insensitive) → green badge
    deadline: "2026-04-26"     # Optional ISO date; after it the badge reads "Closed" (grey)
    opens: "2026-12-01"        # Optional ISO date; before it the badge reads "Opens December 2026" (grey)
    apply_url: "https://..."   # https URL → "Apply →" in a new tab; site path like "/contact/" → same tab.
                               # Status containing "enquire" labels the button "Enquire →". Default: /contact/
```
Badge logic lives in `layouts/partials/opportunity-status.html` and is evaluated at build time (hence the weekly scheduled rebuild).

### `data/collaborators.yaml`
```yaml
groups:
  - type: "Academic" | "Clinical" | "Industry" | "Consortium" | "Societies and Committees"   # validated enum
    name: "Collaborator name"
    affiliation: "Institution"  # Optional, shown in italics
    description: "Collaboration description"
    url: "https://..."         # Optional — shows "Visit →" button if present
```

### `data/events.yaml`
```yaml
events:
  - date: "2026-10-20"         # ISO date used for upcoming/past split and sorting (last day for multi-day events)
    month: "Oct"
    day: "18–20"               # Optional display string
    year: "2026"               # Must match the year in `date`
    title: "Event title"
    location: "Venue, City"
    type: "Conference" | "Seminar" | "Webinar" | "Course" | ...
    detail: "Optional extra info"
    link: "https://..."        # Optional; title and "Info →" button link to it
```
One flat list. `layouts/partials/event-data.html` emits it as hidden data attributes; `static/js/events-filter.js` splits upcoming/past **in the browser** (so the split is relative to the visitor's date, not the build date) and renders both the Events page and the home-page "Upcoming" block (max 3).

### Research project front matter (`content/research/*.md`)
```yaml
title: "Project title"
description: "Meta description"
tag: "Short label"             # No trailing spaces (validated)
summary: "One-line card summary"
team: ["Name", ...]
funders: []                    # Hidden when empty
keywords: ["ALD", ...]         # Required. Papers sharing a keyword appear in the "Related publications" sidebar (max 5)
kind: "methods"                # Only on techniques.md — excludes it from project grids on home and /research/
```
Body headings start at `##` (the page `<h1>` is the title). `## Overview` / `## Objectives` is the convention.

## Key cross-cutting patterns

### Author filtering (publications ↔ people)
- Each person in `people.yaml` has a `pub_name` field (e.g. `"Palma E"`)
- Publications store authors as a plain string: `"Rastovic U, Palma E, et al."`
- JS `String.includes(pub_name)` does the matching on the client side
- "Papers" buttons link to `/publications/?author=Palma%20E` — read on load via `URLSearchParams`

### Layout selection
Hugo picks the layout based on content `type:` front matter:
- `type: people` → `layouts/people/single.html`
- `type: publications` → `layouts/publications/single.html`
- `type: collaborators` → `layouts/collaborators/single.html`
- etc.

### Status badge colour (opportunities)
See `layouts/partials/opportunity-status.html`: `deadline` passed → Closed; `opens` in future → "Opens <Month Year>"; otherwise any status containing "open" (case-insensitive) renders green.

### Accessibility conventions
- Skip link (`a.skip-link` → `main#main`) is the first element in `nav.html`.
- Desktop dropdowns open on `:hover` **and** `:focus-within` (input.css). Hamburger and mobile accordions toggle `aria-expanded`; Escape closes the menu.
- Heading order must be sequential on every page (tested). Page `<h1>` is the hero title; section headings `h2`; cards/items `h3`; footer column headings are `h2`.
- `*:focus-visible` outline is global; form fields also use `focus:ring-2`.
- Social icon links carry `aria-label`; SVGs are `aria-hidden`.
- Portrait images: square boxes sized to the 160px source (no stretching/cropping), with `width`/`height`, `loading="lazy"`, and `alt="Portrait of …"`.

### Positioning / copy
The site uses one framing everywhere: **mitochondrial plasticity, morphology and dynamics in liver health and disease**, studied in patient-derived human liver models (PCLS, tumour slices) for ALD/SLD and liver cancer. Keep `labDescription` (hugo.toml), the home description (`content/_index.md`), page intros, and Elena's bio aligned with it (tested in `js/site-build.test.js`).

### Navigation
Defined in `hugo.toml` `[menu]` blocks. The nav partial reads `$.Site.Menus.main`.
- "Collaborators" menu URL: `/collaborators/` (not `/people/collaborators/`)
- Footer also links to `/collaborators/`

## Deliberate choices (do not "fix")
- **No email address on the site** — the Formspree contact form is the only channel, to avoid spam harvesting. It is tested and works. Do not add `mailto:` links or print addresses.
- **No publications block on the home page** — the "Selected Papers" section in `layouts/index.html` is intentionally commented out. See TODO below if that ever changes.

## Content still placeholder / to be filled
- News posts (`content/news/`) — placeholder; section is hidden in nav until real content is ready
- Real "now" positions for alumni Ravi Jagatia and Ewald Jan Doornebal (`data/people.yaml`)

## Deployment
Push to `main` → GitHub Actions auto-builds and deploys to GitHub Pages.
GitHub Pages source must be set to **"GitHub Actions"** (not "Deploy from a branch") in repo settings.

## Hidden / temporarily disabled features

### News section
The News section is fully built but intentionally hidden. All files are preserved — do not delete them.

**To re-enable:**
1. In `hugo.toml`: uncomment the `[[menu.main]]` block for News (weight 4)
2. In `layouts/index.html`: unwrap the `{{/* ... */}}` Hugo comment around the `<!-- ══ NEWS ══ -->` section
3. Replace placeholder posts in `content/news/` with real content

**Files preserved:**
- `content/news/` — news posts (currently placeholder)
- `layouts/news/list.html` — news list page
- `layouts/news/single.html` — individual news post

## TODO

### SEO assets
- [x] `static/images/og-image.jpg` — 1200×630px branded banner (generated from design tokens); referenced in all Open Graph + Twitter Card `<meta>` tags
- [x] `static/images/favicon-96x96.png` — PNG favicon for older browsers; referenced in `baseof.html`
- [x] `static/images/apple-touch-icon.png` — 180×180px icon for iOS home screen bookmarks; referenced in `baseof.html`
- [x] Merge `seo-improvements` branch into `main` — done
- [x] Google Search Console — verified, sitemap `https://palmalab.co.uk/sitemap.xml` submitted
- [x] ORCID (`https://orcid.org/0000-0001-6294-6676`) and Google Scholar (`https://scholar.google.com/citations?user=AfvXV0EAAAAJ`) for Elena — in `data/people.yaml` and Person schema `sameAs`
- [x] Custom 404 page (`layouts/404.html`)
- [x] Sitemap `lastmod` via `enableGitInfo` (deploy.yml checks out full history with `fetch-depth: 0`)

### Content still placeholder / to be filled
- [ ] News posts (`content/news/`) — currently placeholder; section is hidden in nav until real content is ready
- [ ] Real "now" positions for alumni Ravi Jagatia and Ewald Jan Doornebal (`data/people.yaml`)
- [ ] Update `deadline` / `opens` in `data/opportunities.yaml` when the next King's/FLR fellowship call and clinical fellowship round are announced (the April 2026 call currently shows "Closed")

### Deferred (waiting on assets from Elena)
- [ ] **Higher-resolution portraits** — current files in `static/images/people/` are 160×160. When larger photos arrive (≥ 600px on the long edge), drop them in, then switch `layouts/people/single.html` and `layouts/index.html` to Hugo image processing (`resources.Get` + `.Fill`) so the boxes can grow again (PI ~220px, members ~128px, home grid full width) without upscaling.
- [ ] **Mitochondria / PCLS imagery** — the home hero and research project pages are text-only. When microscopy or tissue-slice images are available: add one hero image (right column or background band) on the home page, and an optional `image:` front-matter field rendered at the top of `layouts/research/single.html`. Remember `alt` text and an `og-image` refresh.
- [ ] **Selected papers on the home page** (optional, deliberately off today) — uncomment the `<!-- ══ LATEST PUBLICATIONS ══ -->` block in `layouts/index.html`; it already renders `first 4` of `data/publications.yaml`. Add a `js/site-build.test.js` case if enabled.
