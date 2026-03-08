# LabResearch Hugo Site

A clean, responsive academic lab website built with Hugo and Tailwind CSS.

## Quick Start

### 1. Install Hugo
```bash
# macOS
brew install hugo

# Windows (via Chocolatey)
choco install hugo-extended

# Linux
snap install hugo
```

### 2. Run locally
```bash
cd labresearch
hugo server -D
# Open http://localhost:1313
```

### 3. Build for production
```bash
hugo --minify
# Output is in the /public folder
```

---

## Deploy to GitHub Pages

### One-time setup
```bash
# 1. Create a GitHub repo named: yourusername.github.io
# 2. Push this folder to it
git init
git remote add origin https://github.com/yourusername/yourusername.github.io.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Auto-deploy with GitHub Actions
Create `.github/workflows/hugo.yml`:
```yaml
name: Deploy Hugo site
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: peaceiris/actions-hugo@v2
        with:
          hugo-version: 'latest'
      - run: hugo --minify
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

---

## Customising Content

### Update lab details
Edit `hugo.toml` — change `labName`, `email`, `twitter`, `linkedin`, `address`, etc.

### Add a publication
Open `data/publications.yaml` and add an entry:
```yaml
- year: "2025"
  title: "Your paper title"
  authors: "Smith A, Jones B, et al."
  journal: "Nature · 2025"
  doi: "https://doi.org/10.xxxx"
  keywords: ["keyword1", "keyword2"]
```

### Add a team member
Open `data/people.yaml` and add under `members`:
```yaml
- name: "Dr. New Person"
  initials: "NP"
  role: "Postdoctoral Researcher"
  role_type: "postdoc"   # pi / postdoc / phd
  area: "Cell Biology"
  bio: "Short biography here."
  email: "np@kcl.ac.uk"
```

### Add a news post
Create a new file in `content/news/`:
```markdown
---
title: "Your news title"
date: 2025-04-01
emoji: "🏆"
category: "Funding"
summary: "One-line summary shown on the homepage and news list."
---

Full content of the news post goes here in Markdown.
```

### Add a research project
Create a new file in `content/research/`:
```markdown
---
title: "Project Title"
tag: "Keyword"
summary: "Short summary."
funders: ["Funder 1"]
team: ["Prof. Smith (PI)"]
---

Full project description in Markdown.
```

### Add an event
Open `data/events.yaml` and add to `upcoming`:
```yaml
- month: "Oct"
  day: "15"
  title: "Conference Name"
  location: "City, Country"
  detail: "Brief detail"
  type: "Conference"
  link: "https://conference.org"
```

---

## File Structure

```
labresearch/
├── hugo.toml              # Site config — edit this first
├── content/
│   ├── _index.md          # Homepage
│   ├── publications.md
│   ├── people.md
│   ├── events.md
│   ├── contact.md
│   ├── join.md
│   ├── research/          # One .md per project
│   └── news/              # One .md per news post
├── data/
│   ├── publications.yaml  # All papers
│   ├── people.yaml        # Team members & alumni
│   ├── events.yaml        # Events calendar
│   ├── opportunities.yaml # Job opportunities
│   └── collaborators.yaml # Collaborating groups
├── layouts/
│   ├── _default/          # Base templates
│   ├── partials/          # nav.html, footer.html (edit once, used everywhere)
│   └── [section]/         # Per-section layouts
└── static/
    ├── css/main.css
    └── js/main.js
```
