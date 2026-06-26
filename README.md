# StoryIntoVideo Landing Page Clone

> Pixel-accurate marketing site clone of [storyintovideo.com](https://storyintovideo.com/) — a luxury-dark, cinematic SaaS landing page built with Next.js 16, Tailwind CSS v4, and shadcn/ui.

## Overview

StoryIntoVideo is an AI-powered platform that transforms written stories into fully produced video content. This repository contains a faithful static clone of the production marketing site — every color token (field-verified from the live DOM), all 13 CSS keyframes, and every hover micro-interaction reproduced to within ~5px tolerance.

**This is a clone.** It reproduces the visual identity of the live site. All CTAs link to placeholder routes (`#`, `/auth/sign-up`). No authentication, no dashboard, no video-generation logic.

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 | App Router, static export (`force-static`) |
| UI | React 19 | Strict TypeScript, zero `any` |
| Styling | Tailwind CSS v4 | CSS-first `@theme` block (no `tailwind.config.js`) |
| Components | shadcn/ui (Radix) | Accordion, Sheet, DropdownMenu |
| Fonts | Geist Sans + Geist Mono + Outfit | Self-hosted via `next/font` (no CDN) |
| Icons | Lucide React | Tree-shaken, stroke-1.5, `currentColor` |
| Quality | ≥95 Lighthouse | Performance, Accessibility, Best Practices, SEO |

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### Setup

```bash
# Clone and install
git clone <repository-url>
cd story-into-video
pnpm install

# Run development server (Turbopack)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — page loads with dark background (`#020202`), Outfit font on H1, and Geist Sans on body text.

### Verification

```bash
# Type check — must pass with zero errors
pnpm typecheck

# Lint — must pass with zero warnings
pnpm lint

# Unit tests (Vitest) — 45 tests across 9 files
pnpm test

# E2E tests (Playwright) — 11 tests, auto-starts dev server (requires `pnpm exec playwright install` first)
pnpm test:e2e

# Format check — all files use Prettier code style
pnpm format:check
```

## Build & Quality Commands

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Static production build
pnpm start        # Serve built output
pnpm lint         # ESLint (flat config, next/core-web-vitals + typescript-eslint)
pnpm typecheck    # tsc --noEmit (strict mode, noUncheckedIndexedAccess)
pnpm test         # Vitest unit tests (jsdom env)
pnpm test:e2e     # Playwright E2E tests (Chromium)
pnpm format       # Prettier --write (auto-fix)
pnpm format:check # Prettier --check (verify only)
```

**Lighthouse targets:**

| Category | Target |
|---|---|
| Performance | ≥ 95 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |

## Architecture

This is a single-page static landing page. All 10 sections are composed in `src/app/page.tsx`. Five components are client-side (interactivity), five are server components (static HTML).

```mermaid
flowchart TB
    Layout["src/app/layout.tsx<br/>Fonts · Metadata · Body classes"]
    Page["src/app/page.tsx<br/>Composes all sections"]

    Layout --> Page

    subgraph Server Components (static)
        Footer["footer.tsx"]
        FinalCTA["final-cta.tsx"]
        Features["features.tsx"]
        Testimonials["testimonials.tsx"]
        UseCases["use-cases.tsx"]
    end

    subgraph Client Components (interactive)
        Navbar["navbar.tsx<br/>scroll-aware"]
        Hero["hero.tsx<br/>textarea + chips"]
        Examples["examples.tsx<br/>carousel arrows"]
        Faq["faq.tsx<br/>Radix Accordion"]
        Workflow["workflow.tsx<br/>video loading state"]
    end
```

### Component Rendering Strategy

| Component | Type | Reason |
|---|---|---|
| Navbar | `'use client'` | Scroll state, mobile Sheet toggle |
| Hero | `'use client'` | Textarea, chip click, ratio toggle |
| Examples | `'use client'` | Carousel arrow click handlers |
| Faq | `'use client'` | Radix Accordion (stateful) |
| Workflow | `'use client'` | `useState` for poster→video fade-in choreography |
| Features, Testimonials, UseCases, FinalCTA, Footer | Server | Pure static HTML/CSS |

### Section Order (Fixed)

```
Navbar (fixed)
 → Hero (video bg + glass input + style marquee)
 → Examples carousel
 → 4-Step Workflow
 → Features grid
 → Testimonials
 → Use Cases
 → FAQ
 → Final CTA
 → Footer
```

## Design System

### Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#020202` | Page background (near-black, NOT pure #000) |
| `--primary` | `#febf00` | CTAs, active states, focus rings (NOT Tailwind amber-400) |
| `--card` | `#060607` | Card surfaces |
| `--muted-foreground` | `#8e8e95` | Secondary text |
| `--foreground` | `#f8f8f8` | Default foreground text |
| Body text | `#d4d4d8` | Paragraph/body text (zinc-300, used via Tailwind utility) |

### Typography

| Role | Font | Weight | Key Class |
|---|---|---|---|
| Display headings | Outfit | **820** | `font-heading` |
| Body, UI | Geist Sans | 400–600 | `font-sans` |
| Accents, toggles | Geist Mono | 400 | `font-mono` |

Outfit weight 820 is self-hosted via `next/font/local` (Google Fonts API only serves discrete weights).

### Animation

All motion is pure CSS `@keyframes` — no Framer Motion, no GSAP. 13 keyframes defined in `app/globals.css`:

```
fade-in-up, float, glow-pulse, border-glow, composite-pulse-text,
shimmer, btn-shimmer, grid-shimmer, grid-sweep-h, grid-sweep-v,
scanline-scroll, lang-dropdown-in, marquee-scroll
```

Scroll-reveal uses `IntersectionObserver` + a `data-revealed` attribute pattern.

### Responsive Breakpoints

| Token | Min Width | Target |
|---|---|---|
| (default) | 0 | Mobile portrait 375px |
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / laptop |
| `xl` | 1280px | Desktop (matches `max-w-7xl`) |
| `2xl` | 1536px | Large desktop |

### Accessibility

- Focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400`
- Skip-to-content link at page top
- Hero video: `aria-hidden="true"` (decorative, no audio)
- `prefers-reduced-motion: reduce` globally disables all animation
- Color contrast: zinc-300 on zinc-950 = 12.6:1 (WCAG AAA)
- Touch targets ≥ 44×44px on mobile

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root: fonts, metadata, <body> classes + skip-to-content
│   ├── page.tsx            # Landing page (composes all 10 sections)
│   ├── globals.css         # @theme + CSS variables + 13 keyframes + utilities
│   └── icon.tsx            # Dynamic favicon
├── components/
│   ├── primitives/         # Shared presentational components (7 files)
│   │   ├── cta-amber.tsx
│   │   ├── cta-ghost.tsx
│   │   ├── cta-gradient.tsx
│   │   ├── eyebrow.tsx
│   │   ├── scroll-reveal.tsx
│   │   ├── section-heading.tsx
│   │   └── style-chip.tsx
│   ├── ui/                 # shadcn/ui primitives (Accordion, Sheet, DropdownMenu, Button)
│   └── sections/
│       ├── navbar.tsx       # Client — scroll-aware + mobile Sheet
│       ├── hero.tsx         # Client — textarea state, chips, ratio toggle
│       ├── examples.tsx     # Client — carousel with arrow handlers
│       ├── workflow.tsx     # Client — video loading state, 4 alternating rows
│       ├── features.tsx     # Server — 4×2 grid, hover accent bar
│       ├── testimonials.tsx # Server — 3×2 grid, initials avatars
│       ├── use-cases.tsx    # Server — 2×2 grid, corner glow
│       ├── faq.tsx          # Client — Radix Accordion
│       ├── final-cta.tsx    # Server — dot-grid bg, amber pill
│       └── footer.tsx       # Server — 3 link columns
├── lib/
│   ├── data/               # Static data constants (10 files)
│   ├── hooks/              # Custom React hooks (3 files)
│   │   ├── use-scrolled.ts
│   │   ├── use-reveal.ts
│   │   └── use-reduced-motion.ts
│   ├── fonts.ts            # GeistSans + GeistMono + Outfit (self-hosted)
│   └── utils.ts            # cn() utility (clsx + tailwind-merge)
├── tests/
│   ├── unit/               # Vitest unit tests (9 files, 45 tests)
│   ├── e2e/                # Playwright E2E tests (3 files, 11 tests)
│   └── setup.ts            # Test setup (jest-dom)
├── types/
│   └── index.ts            # All TypeScript interfaces (12 interfaces)
└── public/
    ├── workflow/           # Demo videos + posters (self-hosted)
    ├── examples/           # Card thumbnails (9:16 portrait)
    ├── fonts/              # Outfit variable font (45KB woff2)
    ├── hero-bg.mp4         # Hero background video
    └── og-image.png        # Open Graph image
```

## Asset Requirements

Videos and images are **not version-controlled** — they must be downloaded or generated separately.

| Category | Count | Total Size | Source |
|---|---|---|---|
| Workflow videos + posters | 5 | ~8MB | Download from `r2.storyintovideo.com` |
| Hero background video | 1 | ~2MB | Self-source cinematic footage |
| Example card thumbnails | 6 | ~600KB | Generate or source from stock |

See `Project_Requirements_Document.md` §10 for the full asset manifest with download URLs.

## Key Conventions

| Convention | Detail |
|---|---|
| TypeScript | Strict mode, zero `any`, `interface` for object shapes |
| Client components | Only when state/browser APIs are needed |
| Animation | CSS-only (no Framer Motion, no GSAP) |
| Fonts | Self-hosted via `next/font` (no Google Fonts CDN) |
| Styling | Tailwind v4 CSS-first `@theme` (no `tailwind.config.js`) |
| Static page | `force-static`, no SSR, no API routes |
| External deps | No CDN links — all bundled |

## Asset Pipeline

Media assets are **not version-controlled** in their source form (only the generated files in `/public/` are). To regenerate:

```bash
# Download workflow videos + posters from R2 (idempotent)
./scripts/download-assets.sh

# Generate 6 example thumbnails via z-ai CLI (requires z-ai-web-dev-sdk)
./scripts/generate-thumbnails.sh
```

The Outfit variable font (`public/fonts/Outfit-VariableFont.woff2`, 45KB) was downloaded from the [Google Fonts GitHub repo](https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf) and converted to woff2 via `fonttools`. This is required for weight 820 access (see Decision C in `MASTER_EXECUTION_PLAN.md`).

The hero background video (`public/hero-bg.mp4`, 46KB) was generated from `hero-poster.webp` via ffmpeg's `zoompan` filter (10s, 1920×1080, H.264, subtle 1.0→1.05 zoom).

## Testing

### Unit Tests (Vitest)

45 tests across 9 files, all GREEN:

| Test file | Tests | What it covers |
|---|---|---|
| `cn.test.ts` | 8 | `cn()` utility: string merge, conditionals, tailwind-merge dedup, arrays/objects |
| `use-scrolled.test.ts` | 7 | Scroll threshold detection, boundary cases, scroll event updates |
| `use-reveal.test.tsx` | 7 | IntersectionObserver integration, once/toggle modes, disconnect behavior |
| `use-reduced-motion.test.ts` | 4 | matchMedia integration, change event handling |
| `hero-chip-populate.test.tsx` | 5 | Chip → textarea seed population for all 4 chips + replace behavior |
| `hero-ratio-toggle.test.tsx` | 3 | Ratio toggle single-selection enforcement (9:16 ↔ 16:9) |
| `layout-hydration.test.tsx` | 5 | `suppressHydrationWarning` on `<body>`, skip-to-content, JSON-LD, children rendering |
| `metadata.test.ts` | 2 | Canonical URL (`alternates.canonical`) presence + clone-domain resolution |
| `hero-character-counter.test.tsx` | 4 | Counter renders `0 / 500`, updates on type, amber warning at ≥450 chars, muted below threshold |

### E2E Tests (Playwright)

11 tests across 3 spec files, all GREEN (Chromium):

| Spec file | Tests | What it covers |
|---|---|---|
| `hero-cta.spec.ts` | 3 | Hero CTA + Final CTA + Navbar Get Started all link to `/auth/sign-up` |
| `mobile-nav.spec.ts` | 5 | Hamburger opens Sheet, all links present, close button works, desktop links hidden on mobile |
| `faq-accordion.spec.ts` | 3 | Expand/collapse, single-open behavior, all 6 questions present |

## Implementation Notes

### Deviations from PRD

The canonical spec is `Project_Requirements_Document.md` (v2.0, 2718 lines). The following intentional deviations were made during implementation (documented in `MASTER_EXECUTION_PLAN.md` §3):

1. **Tailwind v4 CSS-first `@theme`** — all design tokens live in `src/app/globals.css` inside a single `@theme { … }` block. No `tailwind.config.ts` file exists. This aligns with the `nextjs16-tailwind4` skill's mandate and is the documented future direction in PRD §8.2.

2. **Kebab-case keyframes** — all 13 `@keyframes` names normalized to kebab-case (e.g., `grid-shimmer` instead of `gridShimmer`). PRD §9 ships camelCase, PRD §8.1 ships kebab — they conflict. Kebab-case is the modern Tailwind convention.

3. **Outfit variable font self-hosted** — loaded via `next/font/local` (not `next/font/google`) to access weight 820 precisely. The variable woff2 (45KB, weight range 100–900) is at `public/fonts/Outfit-VariableFont.woff2`.

4. **`src/` directory convention** — app code lives in `src/` (per `nextjs16-tailwind4` skill best practice), not at the repo root as shown in PRD §6.1.

5. **ESLint flat config** — `eslint.config.mjs` uses direct plugin imports (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@next/eslint-plugin-next`) instead of `eslint-config-next`'s FlatCompat (which is broken with ESLint 9.39+).

6. **shadcn/ui primitives hand-written** — the 4 shadcn components (`button`, `accordion`, `sheet`, `dropdown-menu`) were hand-written using the canonical new-york style source code. The `shadcn` CLI timed out via `pnpm dlx` and the globally-installed CLI also timed out fetching the registry.

### Known Issues

- **PostCSS moderate vulnerability** (GHSA-qx2v-qp2m-jg93): 1 moderate vuln in `postcss <8.5.10` (transitive via `next`). Not exploitable in this static page (no user-supplied CSS processing). Will resolve when Next.js updates its lockfile. `pnpm audit --audit-level=high` passes clean.

### Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| E2E tests fail with "Executable doesn't exist" | Playwright browsers not installed | Run `pnpm exec playwright install` |
| Hydration mismatch console error | Browser extension (Grammarly) injects attributes into `<body>` | Already fixed: `suppressHydrationWarning` on both `<html>` and `<body>` |
| `next lint` command not found | Deprecated in Next.js 16 | Use `eslint .` directly |
| `shadcn` CLI times out | Registry fetch failure | Primitives are hand-written in `src/components/ui/` |
| Outfit weight 820 not rendering | Google Fonts API doesn't serve weight 820 | Must self-host via `next/font/local` (already done) |
| Tailwind classes not applying | Missing `@source` directives | Check `globals.css` has `@source '../components/**/*.{ts,tsx}'` |
| Cross-origin dev resource blocked | Next.js blocks `/_next/webpack-hmr` from non-localhost origins (e.g. Cloudflare Tunnel, LAN IP) | Add the origin to `allowedDevOrigins` in `next.config.ts` and restart the dev server |

### Lessons Learned

1. **`suppressHydrationWarning` belongs on `<body>`, not just `<html>`** — Browser extensions like Grammarly inject attributes into `<body>` before React hydrates. The `<html>` element already had the prop, but `<body>` didn't, causing the mismatch.
2. **Workflow component needs `'use client'`** — Uses `useState` for poster→video fade-in choreography. Server components cannot use React state.
3. **Test counts drift from plans** — The MEP planned 6 unit + 3 E2E tests; actual implementation expanded to 45 unit + 11 E2E. Always verify counts against actual `pnpm test` output, not documentation.
4. **File structure evolves during implementation** — The `components/primitives/` directory, `lib/hooks/` and `lib/data/` subdirectories were created during build but not reflected in initial docs. Update docs as you build.
5. **Playwright requires browser binary installation** — `pnpm install` doesn't install browser binaries. Must run `pnpm exec playwright install` separately.

### Recommendations

1. **Run `pnpm exec playwright install` after fresh clone** — Required for E2E tests to work.
2. **Add pre-commit hooks** — Consider adding `husky` + `lint-staged` to enforce `pnpm lint && pnpm typecheck && pnpm test` before commits.
3. **Monitor PostCSS vulnerability** — Track when Next.js updates its lockfile to resolve the transitive `postcss <8.5.10` vuln.
4. **Visual regression testing** — Consider adding Playwright screenshot comparison against the live site for pixel-perfect verification.
5. **Bundle size monitoring** — Add `next/bundle-analyzer` to track JS/CSS bundle sizes against the <100KB JS / <30KB CSS budget.

### Document Hierarchy

| Document | Role |
|---|---|
| `Project_Requirements_Document.md` | Canonical spec (v2.0, 2718 lines, field-verified) |
| `MASTER_EXECUTION_PLAN.md` | Execution record (8 phases, 15 decisions, 20 risks) |
| `CLAUDE.md` | Agent briefing document (stack, conventions, pitfalls, anti-patterns) |
| `AGENTS.md` | Compact agent instructions |
| `README.md` | This file — quick start + build state |
| `PRD_2.md`, `draft_PRD.md` | Historical drafts (do not reference during implementation) |
| `bundled_skills_to_use.md` | Skill routing reference |
| `storyintovideo_deviation_report.md` | External gap analysis (live-site comparison — 26 claimed deviations) |
| `deviation_report_validation.md` | Validation of the deviation report against codebase + PRD (only 1 genuine gap + 1 enhancement found) |

## Contributing

This is a clone project with a fixed spec. Changes should reference the canonical `Project_Requirements_Document.md` (v2.0, 2718 lines). Before submitting:

1. `pnpm lint` — zero warnings
2. `pnpm typecheck` — zero errors
3. `pnpm test` — 45 unit tests pass
4. `pnpm test:e2e` — 11 E2E tests pass
5. `pnpm format:check` — all files use Prettier code style
6. `pnpm build` — zero errors
7. Visual verification against live site at 1440×900
8. Lighthouse ≥ 95 across all categories

## License

MIT
