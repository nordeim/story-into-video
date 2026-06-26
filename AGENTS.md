# StoryIntoVideo Landing Page Clone — Agent Instructions

## Project Overview

Single-page Next.js 16 static landing page cloning `https://storyintovideo.com/` — a luxury-dark, cinematic SaaS marketing site for an AI story-to-video generator. **No auth, no database, no backend.** All CTAs link to placeholders.

## Stack (Locked)

```
Next.js 16 · React 19 · Tailwind CSS v4 (CSS-first @theme) · shadcn/ui · next/font
Geist Sans (body) + Geist Mono (accents) + Outfit (display headings, weight 820)
Lucide React icons · class-variance-authority + clsx + tailwind-merge
```

## Critical Design Decisions

| Decision | Why |
|---|---|
| Tailwind v4 `@theme` block in `globals.css`, NOT `tailwind.config.ts` | CSS-first is the future direction; PRD ships both, prefer `@theme` |
| Outfit weight **820** via `next/font/local` (not `/google`) | `/google` only serves discrete weights; PRD specifies 820 explicitly |
| Amber is `#febf00` (not Tailwind's `amber-400` = `#fbbf24`) | These are different colors; use custom `--color-primary: #febf00` |
| All animation is CSS `@keyframes` only — no Framer Motion | Matches live site; critical for Lighthouse ≥95 |
| Static page: `export const dynamic = 'force-static'` | No SSR, no data fetching, no API routes |

## Color System (Non-Negotiable)

```
Background:    #020202  (near-black, warm-neutral — NOT pure #000)
Primary/Amber: #febf00  (CTAs, active states, focus rings, accents)
Surface:       #060607  (cards)
Muted text:    #8e8e95  (zinc-400 equivalent)
Body text:     #d4d4d8  (zinc-300)
```

Full semantic token table lives in `Project_Requirements_Document.md` §1.2.

## Typography

| Element | Class | Weight | Tracking |
|---|---|---|---|
| H1 (hero desktop) | `font-heading text-[4.5rem]` | **820** | `-0.04em` |
| H1 (hero mobile) | `text-4xl` | 820 | scales with `em` |
| H2 (sections) | `font-heading text-4xl lg:text-6xl` | 700 | `-0.03em` |
| Body | `font-sans text-lg` | 400 | normal |
| Ratio toggles | `font-mono text-[10px]` | 400 | — |

## File Structure

```
src/
├── app/
│   ├── layout.tsx       # Root: fonts, metadata, <body> classes + skip-to-content
│   ├── page.tsx         # Landing page (composes all sections)
│   ├── globals.css      # Tailwind import + @theme + CSS variables + 13 keyframes + utility classes
│   └── icon.tsx         # Dynamic favicon
├── components/
│   ├── primitives/      # Shared presentational components (7 files)
│   │   ├── cta-amber.tsx
│   │   ├── cta-ghost.tsx
│   │   ├── cta-gradient.tsx
│   │   ├── eyebrow.tsx
│   │   ├── scroll-reveal.tsx
│   │   ├── section-heading.tsx
│   │   └── style-chip.tsx
│   ├── ui/              # shadcn/shadcn (Accordion, Sheet, DropdownMenu, Button)
│   └── sections/
│       ├── navbar.tsx        # 'use client' — scroll-aware + mobile Sheet
│       ├── hero.tsx          # 'use client' — textarea state, chips, ratio toggle
│       ├── examples.tsx      # 'use client' — carousel with arrow handlers
│       ├── workflow.tsx      # 'use client' — video loading state + 4 alternating media/text rows
│       ├── features.tsx      # server component — 4×2 grid, hover accent bar + title slide
│       ├── testimonials.tsx  # server component — 3×2 grid, quote + initials avatar
│       ├── use-cases.tsx     # server component — 2×2 grid, corner glow on hover
│       ├── faq.tsx           # 'use client' — Radix Accordion (single collapsible)
│       ├── final-cta.tsx     # server component — dot-grid bg, amber CTA pill
│       └── footer.tsx        # server component — 3 link columns + copyright
├── lib/
│   ├── data/             # Static data constants (10 files)
│   ├── hooks/            # Custom React hooks (3 files)
│   │   ├── use-scrolled.ts   # 'use client' — scroll position boolean hook
│   │   ├── use-reveal.ts     # 'use client' — IntersectionObserver with data-revealed attr
│   │   └── use-reduced-motion.ts  # 'use client' — OS prefers-reduced-motion detection
│   ├── fonts.ts          # GeistSans + GeistMono (from geist pkg) + Outfit (local variable)
│   └── utils.ts          # cn() utility (clsx + tailwind-merge)
├── tests/
│   ├── unit/             # Vitest unit tests (9 files, 45 tests)
│   ├── e2e/              # Playwright E2E tests (3 files, 11 tests)
│   └── setup.ts          # Test setup (jest-dom)
├── types/
│   └── index.ts          # All TypeScript interfaces (12 interfaces)
└── public/
    ├── workflow/         # showcase-step{1-4}.mp4 + posters (download from R2)
    ├── hero-bg.mp4       # Hero background video (self-source)
    ├── examples/         # example-{1-6}.webp (9:16 portrait thumbnails)
    ├── fonts/            # Outfit-VariableFont.woff2 (45KB, weight 100-900)
    └── og-image.png      # Open Graph image
```

## Build & Quality Commands

```bash
# Dev (Turbopack)
pnpm dev

# Full verification chain (run before claiming done)
pnpm lint          # ESLint zero warnings
pnpm typecheck     # tsc --noEmit zero errors
pnpm build         # next build zero errors

# Lighthouse (Chrome DevTools → Lighthouse)
# Target: Performance ≥95, Accessibility ≥95, Best Practices ≥95, SEO ≥95
```

## Component Contracts (TypeScript)

All components use `interface` (not `type` for object shapes), zero `any`. Key interfaces defined in PRD §11. Critical rules:

- `'use client'` only for: Navbar, Hero, Examples, Faq, Workflow (anything with useState/useEffect)
- Server components by default: Features, Testimonials, UseCases, FinalCta, Footer
- `next/image` for all raster images, `next/font` for all fonts

## Section Order (Top → Bottom, Fixed)

1. Navbar (fixed overlay)
2. Hero (video bg + glass input + style marquee)
3. Examples carousel (portrait cards, yellow→purple hover glow)
4. 4-Step Workflow (alternating media/text rows)
5. Features grid (4×2, accent bar + title slide on hover)
6. Testimonials (3×2, initials avatars)
7. Use Cases (2×2, corner glow on hover)
8. FAQ (Radix accordion, single collapsible)
9. Final CTA (dot-grid bg, solid amber pill)
10. Footer (3 link columns)

## Interaction Inventory

| Component | Interaction | Mechanism |
|---|---|---|
| Navbar | Scroll-aware bg | `useScrolled` hook → `bg-zinc-950/70 backdrop-blur-[24px]` |
| Navbar | Mobile hamburger → Sheet | shadcn Sheet (right-side) |
| Navbar | Language switcher → Dropdown | shadcn DropdownMenu |
| Hero | Textarea focus glow | `focus-within:` on parent wrapper |
| Hero | Story chip click → populate textarea | `useState` |
| Hero | Aspect ratio toggle | `aria-pressed` toggle buttons |
| Examples | Carousel arrow scroll | `scrollBy` / `scrollLeft` |
| Examples | Card hover glow | CSS `group-hover:opacity-80` on gradient layer |
| FAQ | Expand/collapse | Radix Accordion (grid-template-rows: 0fr→1fr) |
| FAQ | Plus → × rotation | `data-[state=open]:rotate-45` |
| All sections | Scroll reveal | IntersectionObserver → `data-revealed` attr |

## 13 Keyframes (All CSS, in globals.css)

```
fade-in-up, float, glow-pulse, border-glow, composite-pulse-text,
shimmer, btn-shimmer, grid-shimmer, grid-sweep-h, grid-sweep-v,
scanline-scroll, lang-dropdown-in, marquee-scroll
```

## Accessibility Requirements

- Focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400`
- Skip-to-content link at page top
- Hero video: `aria-hidden="true"` (decorative)
- `prefers-reduced-motion: reduce` global override disables all animation
- Touch targets ≥44×44px on mobile (ratio toggle needs hit-area expansion)
- Color contrast: body text zinc-300 on zinc-950 = 12.6:1 (AAA)

## Performance Budget

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥95 |
| JS bundle | < 100KB gzipped |
| CSS bundle | < 30KB gzipped |
| Above-fold images | < 500KB total |
| Videos preload | `metadata` only (not `auto`) |

## Common Pitfalls (From PRD Research)

1. **Pure black vs near-black:** Background is `#020202`, NOT `#000` or `#0a0a0a`
2. **Amber shades:** PRD amber (`#febf00`) ≠ Tailwind amber-400 (`#fbbf24`) — use custom token
3. **Outfit 820 missing from Google Fonts API:** Self-host via `next/font/local`
4. **Feature grid uses hairline borders, not cards:** Cards share a continuous surface separated by `border-neutral-800`
5. **Examples hover gradient is the ONLY purple on the entire site:** `bg-gradient-to-r from-yellow-500 to-purple-500` on card hover
6. **CTA hierarchy is deliberate:** Ghost link → glass pill → gradient pill → solid amber (ration the amber accent)
7. **Geist Mono for ratio toggles, NOT Geist Sans:** `font-mono text-[10px]` for 9:16/16:9 buttons

## What's Out of Scope

No auth, no dashboard, no video generation, no CMS, no API routes, no database, no analytics, no i18n. All nav links point to `#` placeholders. The "Get Started" CTA points to `/auth/sign-up`.

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| E2E tests fail with "Executable doesn't exist" | Playwright browsers not installed | `pnpm exec playwright install` |
| Hydration mismatch console error | Browser extension (Grammarly) injects attributes into `<body>` | `suppressHydrationWarning` on both `<html>` and `<body>` (already applied) |
| `next lint` command not found | Deprecated in Next.js 16 | Use `eslint .` directly |
| `shadcn` CLI times out | Registry fetch failure | Primitives are hand-written in `src/components/ui/` |
| Outfit weight 820 not rendering | Google Fonts API doesn't serve weight 820 | Must self-host via `next/font/local` (already done) |
| Tailwind classes not applying | Missing `@source` directives | Check `globals.css` has `@source '../components/**/*.{ts,tsx}'` |
| Cross-origin dev resource blocked | Next.js blocks `/_next/webpack-hmr` from non-localhost origins | Add origin to `allowedDevOrigins` in `next.config.ts` and restart dev server |

## Lessons Learned

1. **`suppressHydrationWarning` on `<body>`** — Browser extensions inject attributes before React hydrates. `<html>` alone is insufficient.
2. **Workflow is `'use client'`** — Uses `useState` for video loading choreography. Don't assume server components for "mostly static" sections.
3. **Test counts drift from plans** — MEP planned 6+3, actual is 39+11. Always verify against `pnpm test` output.
4. **File structure evolves** — `components/primitives/`, `lib/hooks/`, `lib/data/` were created during build. Update docs as you build.
5. **Playwright needs separate install** — `pnpm install` doesn't install browser binaries.

## Reference

The canonical spec is `Project_Requirements_Document.md` (v2.0, 2718 lines). Every color, pixel, keyframe, and interaction is field-verified from the live production DOM. The execution record is `MASTER_EXECUTION_PLAN.md` (8 phases, 15 critical pre-build decisions, 20-item risk register).

## Implementation Deviations (Post-Build)

The following deviations from the PRD were made during implementation. All are documented in `MASTER_EXECUTION_PLAN.md` §3 (Critical Pre-Build Decisions):

1. **`src/` directory convention** — app code lives in `src/` (per `nextjs16-tailwind4` skill), not at repo root as shown in PRD §6.1.
2. **Tailwind v4 `@theme` block** — all design tokens in `src/app/globals.css` `@theme { … }`. No `tailwind.config.ts` file. Aligns with PRD §8.2 future direction.
3. **Kebab-case keyframes** — all 13 `@keyframes` normalized to kebab-case (`grid-shimmer`, not `gridShimmer`). PRD §9 camelCase and PRD §8.1 kebab conflict; kebab is the modern convention.
4. **Outfit variable font self-hosted** — `next/font/local` pointing to `public/fonts/Outfit-VariableFont.woff2` (45KB, weight 100–900 covering 820). NOT `next/font/google` (which only serves discrete weights).
5. **ESLint flat config** — `eslint.config.mjs` uses direct plugin imports (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `@next/eslint-plugin-next`). The `eslint-config-next` FlatCompat is broken with ESLint 9.39+.
6. **shadcn/ui primitives hand-written** — 4 components (`button`, `accordion`, `sheet`, `dropdown-menu`) hand-written per canonical new-york style. The `shadcn` CLI timed out via `pnpm dlx` and global install.
7. **`next lint` deprecated** — Next.js 16 removed `next lint`. The `lint` script in `package.json` runs `eslint .` directly.

## Build & Quality Commands (Actual)

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Static production build
pnpm lint         # eslint . (flat config)
pnpm typecheck    # tsc --noEmit (strict + noUncheckedIndexedAccess)
pnpm test         # vitest run (45 unit tests, jsdom)
pnpm test:e2e     # playwright test (11 E2E tests, Chromium, auto-starts dev)
pnpm format       # prettier --write
pnpm format:check # prettier --check
```

## Asset Pipeline

```bash
./scripts/download-assets.sh        # Download R2 workflow videos + posters (idempotent)
./scripts/generate-thumbnails.sh    # Generate 6 example thumbnails via z-ai CLI
```
