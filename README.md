# Personal Portfolio - Izzan Faikar Ramadhy, CAPM®

Personal portfolio site for an IT Consultant and Professional AI, Data Science, and Project
Management Instructor. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer
Motion, Embla Carousel, and MDX.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Other scripts: `npm run build` (production build), `npm start` (serve the build), `npm run lint`.

## Editing content

All copy lives in `content/` — no text is hardcoded in components.

| File | Drives |
| --- | --- |
| `content/profile.json` | Name, tagline, rotating hero roles, about paragraphs, stats, contact links |
| `content/experience.json` | Work history and the role accordions in the Experience timeline |
| `content/certifications.json` | Certifications |
| `content/projects/*.mdx` | One file per project — frontmatter feeds the cards, the body becomes the detail page |

### Adding a project

Create a new `.mdx` file in `content/projects/`:

```mdx
---
title: "Project title"
client: "Client name"
role: "Your role"
period: "Mar 2024 — Jun 2024"
duration: "3 months"
order: 1              # lower numbers appear first
featured: false
summary: "One or two sentences shown on the card."
tags: ["SPBE", "Data Governance"]
metrics:
  - value: "30+"
    label: "Agencies covered"
---

## Context

Markdown body — becomes the project detail page at /projects/<filename>.
```

The filename becomes the URL slug. Cards, the carousel, and the static routes all pick it up
automatically; no code changes needed.

### Assets to replace

- The About portrait reads from `profile.json` → `avatar` (currently `/Foto Profile.jpg`). It is
  rendered in a square frame with `object-cover`, so a square source crops cleanly.

## Uploading images

Both galleries read their paths from the content JSON, so adding photos never requires touching a
component. Anything left empty simply doesn't render — no empty frames.

### Experience photos → `public/experience/`

One folder per role, named after that role's `slug` in `content/experience.json`:

```
public/experience/
  it-consultant/
  data-science-instructor/
  ai-instructor/
  big-data-instructor/
  project-management-instructor/
  data-management-instructor/
  digital-skills-instructor/
  strategic-marketing/
```

Drop files in, then list them in the role's `photos` array:

```json
"photos": [
  {
    "src": "/experience/data-science-instructor/training-jakarta-01.jpg",
    "alt": "Leading a Python for Data Science session in Jakarta",
    "caption": "Optional — shown under the photo in the lightbox"
  }
]
```

- **Size:** 1600×1200 (4:3) works best. Thumbnails crop to 4:3; the lightbox shows the whole image,
  so other ratios are fine too.
- **Format:** JPG or WebP. Keep each file under ~400 KB.
- **`alt` is required** — it is the accessible description, and it is the fallback caption.
- **No photos yet?** Leave `"photos": []`. The role card renders normally without a gallery.
- Only `data-science-instructor` has photos so far; the other seven roles are empty and render no
  gallery.

### Certificate images → `public/certificates/`

Flat folder, one image per certification:

```
public/certificates/
  capm-pmi.jpg
  machine-learning-python-level-1.jpg
  python.jpg
  python-for-data-science.jpg
```

Then fill in the entry in `content/certifications.json`:

```json
{
  "name": "Certified Associate in Project Management (CAPM)®",
  "issuer": "Project Management Institute (PMI)",
  "date": "Issued Mar 2023 · Expires Mar 2026",
  "featured": true,
  "image": "/certificates/capm-pmi.jpg",
  "description": "A paragraph describing what the certification covers.",
  "covers": ["Short", "Topic", "Chips"]
}
```

- **Orientation:** any. Card thumbnails crop to 4:3; the modal renders the full image with
  `object-contain`, so portrait and landscape scans both display whole.
- **Size:** long edge ≥ 1600 px so the modal stays sharp. JPG, PNG, or WebP.
- **`date`:** free text — leave `""` to hide the line entirely.
- **`featured: true`** gives the card an amber border and a "Flagship credential" tag. Currently
  only CAPM® is flagged.
- **`covers`:** short chips listed under "What it covers" in the modal. An empty array hides the
  block.
- Every entry currently points at a real scan. `_placeholder.svg` is kept in the folder for when a
  new certification is added before its scan is ready.

## Project structure

```
app/                 Routes: home, /projects, /projects/[slug]
components/
  layout/            Navbar, mobile menu, footer, theme toggle
  sections/          One component per homepage section
  ui/                Reusable primitives (Reveal, Section, ProjectCard, carousel, …)
  providers/         Theme provider
content/             All editable copy (JSON + MDX)
lib/                 MDX loading, content access, helpers
public/              Static assets
```

## Notes

- **Theme** — light/dark state lives on `<html class="dark">` and is applied by an inline script
  before first paint, so there is no flash and no hydration mismatch. Preference persists in
  `localStorage`, defaulting to the OS setting.
- **Contact form** — no backend. Submitting composes a `mailto:` link with the message pre-filled
  in the visitor's own email client; nothing is stored or transmitted by the site.
- **Colors** — the navy/amber palette is defined as CSS custom properties at the top of
  `app/globals.css`; change them there and the whole site follows.
- **Motion** — all scroll animations respect `prefers-reduced-motion`.
