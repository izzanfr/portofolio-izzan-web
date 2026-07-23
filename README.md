# Personal Portfolio — Izzan Faikar Ramadhy, CAPM®

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
| `content/profile.json` | Name, tagline, rotating hero roles, about paragraphs, stats, contact links, CV path |
| `content/experience.json` | Work history and the role accordions in the Experience timeline |
| `content/skills.json` | The four skill groups and their chips |
| `content/certifications.json` | Certifications, publications, honors, education |
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

- `public/avatar-placeholder.svg` — swap for a real portrait (rendered at 420×520)
- `public/cv-izzan-faikar-ramadhy.pdf` — the "Download CV" button points here (path set in
  `profile.json`)

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
