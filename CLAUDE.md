# CLAUDE.md — Palma Lab Website

## Project overview
Static lab website for **Dr Elena Palma's research group** at the Roger Williams Institute of Liver Studies, King's College London. Focused on ALD, liver cancer, mitochondrial dysfunction, and fibrosis.

- **URL**: https://elepalma.github.io/
- **Repo**: https://github.com/elepalma/elepalma.github.io (main branch)
- **Generator**: Hugo v0.157.0+extended (Homebrew, `hugo` on PATH)
- **Hosting**: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- **CSS**: Tailwind CSS via CDN (configured inline in `baseof.html`) — no build step needed
- **Fonts**: Instrument Serif + DM Sans (Google Fonts)

## Key commands

```bash
# Local development server
hugo server

# Production build (used by CI)
hugo --minify

# Build is always fast (~15ms). No npm/node needed.
```

## Directory structure

```
layouts/          # All HTML templates (Hugo)
  _default/       # baseof.html (shell), single.html (fallback)
  index.html      # Home page
  partials/       # nav.html, footer.html, section-header.html
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
  css/main.css    # Custom CSS (minimal — mostly Tailwind handles everything)
  images/         # Photos etc.
```

## Tailwind design system (defined in baseof.html)

All configured inline in the `<script>tailwind.config = {...}</script>` block.

| Token | Value |
|---|---|
| `text-ink` | `#1a1a1a` (body text) |
| `text-ink-light` | `#555` |
| `text-ink-faint` | `#999` |
| `border-rule` / `bg-rule` | `#e2e2de` |
| `bg-bg` | `#fafaf8` (page background) |
| `text-accent` / `bg-accent` | `#2a5c45` (forest green) |
| `bg-accent-light` | `#eaf2ee` |
| `bg-accent-dark` | `#1e4533` |
| `max-w-wide` | `1400px` |
| `text-2xs` | `0.68rem` |
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
    apply_url: "https://..."   # If empty/absent → falls back to mailto:
```

### `data/collaborators.yaml`
```yaml
groups:
  - type: "Academic" | "Clinical" | "Industry" | "Consortium"
    name: "Collaborator name"
    description: "Collaboration description"
    url: "https://..."         # Optional — shows "Visit →" button if present
```

### `data/events.yaml`
```yaml
upcoming:
  - title: "Event title"
    month: "MAR"
    day: "15"
    location: "Venue, City"
    type: "Conference" | "Seminar" | ...
    detail: "Optional extra info"
    link: "https://..."        # Optional info link

past:
  - title: "..."
    month: "JAN"
    day: "10"
    year: "2024"
    location: "..."
    type: "..."
```

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
Uses `strings.Contains (. | lower) "open"` — any status containing the word "open" (case-insensitive) renders green. Exact match is NOT used.

### Navigation
Defined in `hugo.toml` `[menu]` blocks. The nav partial reads `$.Site.Menus.main`.
- "Collaborators" menu URL: `/collaborators/` (not `/people/collaborators/`)
- Footer also links to `/collaborators/`

## Content still placeholder / to be filled
- Research pages (`content/research/flr.md`, `mitochondria.md`, `omics.md`, `techniques.md`)
- News posts (`content/news/`) — currently 3 placeholder posts
- Events (`data/events.yaml`) — placeholder data
- ORCID + Google Scholar for Dr. Elena Palma (empty strings in people.yaml)
- Bio for Moyosoreoluwa Feyide
- Real "now" positions for alumni Ravi Jagatia and Ewald Jan Doornebal
- Collaborators: `apply_url` for "Collaborators" role in opportunities.yaml is empty

## Deployment
Push to `main` → GitHub Actions auto-builds and deploys to GitHub Pages.
GitHub Pages source must be set to **"GitHub Actions"** (not "Deploy from a branch") in repo settings.

## TODO

### SEO assets still needed
- [ ] `static/images/og-image.jpg` — 1200×630px image for social share previews (use a lab photo or branded banner); referenced in all Open Graph + Twitter Card `<meta>` tags
- [ ] `static/images/favicon-96x96.png` — PNG favicon for older browsers; referenced in `baseof.html`
- [ ] `static/images/apple-touch-icon.png` — 180×180px icon for iOS home screen bookmarks; referenced in `baseof.html`

### Content still placeholder / to be filled
- [ ] Research pages (`content/research/techniques.md`) — still placeholder
- [ ] News posts (`content/news/`) — currently 3 placeholder posts
- [ ] Events (`data/events.yaml`) — placeholder data
- [ ] ORCID + Google Scholar for Dr. Elena Palma (empty strings in `data/people.yaml`)
- [ ] Bio for Moyosoreoluwa Feyide (`data/people.yaml`)
- [ ] Real "now" positions for alumni Ravi Jagatia and Ewald Jan Doornebal
- [ ] `apply_url` for "Collaborators" role in `data/opportunities.yaml` is empty
