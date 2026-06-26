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
app/
├── layout.tsx       # Root: fonts, metadata, <body> classes
├── page.tsx         # Landing page (composes all sections)
└── globals.css      # Tailwind import + @theme + CSS variables + 13 keyframes + utility classes
components/
├── ui/              # shadcn/shadcn (Accordion, Sheet, DropdownMenu, Button)
└── sections/
    ├── navbar.tsx        # 'use client' — scroll-aware + mobile Sheet
    ├── hero.tsx          # 'use client' — textarea state, chips, ratio toggle
    ├── examples.tsx      # 'use client' — carousel with arrow handlers
    ├── workflow.tsx      # server component — 4 alternating media/text rows + looping MP4
    ├── features.tsx      # server component — 4×2 grid, hover accent bar + title slide
    ├── testimonials.tsx  # server component — 3×2 grid, quote + initials avatar
    ├── use-cases.tsx     # server component — 2×2 grid, corner glow on hover
    ├── faq.tsx           # 'use client' — Radix Accordion (single collapsible)
    ├── final-cta.tsx     # server component — dot-grid bg, amber CTA pill
    └── footer.tsx        # server component — 3 link columns + copyright
lib/
├── fonts.ts         # GeistSans + GeistMono (from geist pkg) + Outfit (local variable)
├── use-scrolled.ts  # 'use client' — scroll position boolean hook
└── use-reveal.ts    # 'use client' — IntersectionObserver with data-revealed attr
public/
├── workflow/        # showcase-step{1-4}.mp4 + posters (download from R2)
├── hero-bg.mp4      # Hero background video (self-source)
└── examples/        # example-{1-6}.webp (9:16 portrait thumbnails)
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

- `'use client'` only for: Navbar, Hero, Examples, Faq (anything with useState/useEffect)
- Server components by default: Workflow, Features, Testimonials, UseCases, FinalCta, Footer
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

1. **Pure black vs near-black:** Background is `#02020 `#000` or `#0a0a0a`
2. **Amber shades:** PRD amber (`#febf00`) ≠ Tailwind amber-400 (`#fbbf24`) — use custom token
3. **Outfit 820 missing from Google Fonts API:** Self-host via `next/font/local`
4. **Feature grid uses hairline borders, not cards:** Cards share a continuous surface separated by `border-neutral-800`
5. **Examples hover gradient is the ONLY purple on the entire site:** `bg-gradient-to-r from-yellow-500 to-purple-500` on card hover
6. **CTA hierarchy is deliberate:** Ghost link → glass pill → gradient pill → solid amber (ration the amber accent)
7. **Geist Mono for ratio toggles, NOT Geist Sans:** `font-mono text-[10px]` for 9:16/16:9 buttons

## What's Out of Scope

No auth, no dashboard, no video generation, no CMS, no API routes, no database, no analytics, no i18n. All nav links point to `#` placeholders. The "Get Started" CTA points to `/auth/sign-up`.

## Reference

The canonical spec is `Project_Requirements_Document.md` (v2.0, 2719 lines). Every color, pixel, keyframe, and interaction is field-verified from the live production DOM.
