# Project Requirements Document: StoryIntoVideo.com Clone

**Project:** StoryIntoVideo Landing Page Clone
**Reference URL:** https://storyintovideo.com/
**Document Version:** 2.0 (field-verified)
**Prepared By:** Frontend Architect & Avant-Garde UI Designer
**Date:** 2026-06-26
**Stack Target (locked):** Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui · next/font (Geist Sans + Geist Mono + Outfit)

> **Provenance note.** Every color, font weight, pixel value, keyframe, and class string in this document was captured directly from the live production DOM at `https://storyintovideo.com/` on 2026-06-26 via headless-browser computed-style extraction. Where the v1 draft made assumptions, they have been corrected against the live source. Where the live source revealed details absent from v1 (the yellow→purple hover gradient on example cards, the exact Outfit weight of 820 on the H1, the 12-name keyframe library, the shadcn Sheet drawer for mobile nav), they have been added.

---

## Executive Summary

StoryIntoVideo.com is a **dark-mode-first SaaS landing page** for an AI-powered story-to-video generation tool. Its aesthetic is **luxury-dark, cinematic, and editorial** — a near-black canvas (`#020202`) interrupted by a single dominant accent of warm amber-gold (`#febf00`), with a singular secondary gradient (yellow → purple) reserved for one moment: the hover glow behind portrait example cards. The page treats the viewport like a screening room — a full-bleed background video plays behind the hero under three stacked overlays, the H1 is set in **Outfit 820** (an extra-bold display weight rarely seen in SaaS), and the entire experience runs on a **12-keyframe motion library** that includes shimmer sweeps, grid pulses, scanlines, and border glows.

The clone must faithfully reproduce, in priority order:

1. **Color & typography system** — the amber-on-near-black palette and the Outfit-over-Geist type pairing are non-negotiable identity elements.
2. **Hero composition** — full-bleed video + three-layer overlay stack + radial amber glow + glass-card story input with style chips and 9:16/16:9 toggle.
3. **Section choreography** — 9 sections in a fixed top-to-bottom order with the 4-step workflow as the centerpiece (alternating left/right media cards with looping MP4 demos).
4. **Motion library** — all 12 named keyframes with their exact definitions, durations, and trigger conditions.
5. **Interactive states** — FAQ accordion (shadcn), mobile nav drawer (shadcn Sheet), example carousel arrows, style-chip marquee, feature-card hover (left accent bar + title slide-right).
6. **Responsive fidelity** — three working breakpoints (375 / 768 / 1440) with the H1 scaling from 36px → 60px → 72px and the nav collapsing to a hamburger below `sm`.

The deliverable is a **single static landing page** (Next.js app-router route `/`) with no authentication, dashboard, or video-generation logic. All CTAs link to placeholder routes (`#` or `/auth/sign-in`). The page must score ≥95 on Lighthouse Performance, ≥95 on Accessibility, and reproduce the visual identity to within a pixel-perfect tolerance verified by Playwright screenshot diffing.

---

## 1. Design Language Analysis

### 1.1 Aesthetic Direction

**Theme:** Luxury-Dark / Cinematic SaaS
**Tone keywords:** Immersive · Cinematic · Premium · AI-forward · Storytelling
**Conceptual direction:** The site evokes the atmosphere of a film production house — dark surfaces that feel like a screening room, golden/amber accents that reference film frames and warm studio lighting, editorial type that signals serious creative tools (not a toy). The dominant emotion the page engineers is *creative possibility underwritten by professional credibility*.

The aesthetic is intentionally restrained: amber is the only hue permitted to assert itself, used for the primary CTA, the eyebrow badge, the active ratio toggle, the feature-card accent bar on hover, and the radial glow behind the hero. A single exception — the yellow→purple gradient on example-card hover glow — exists to suggest the colorful multiplicity of outputs the product can produce. Everything else is grayscale: `zinc-950` surfaces, `zinc-300/400` body text, `white/10` borders.

### 1.2 Color System

#### Palette Specification (verified from `:root` CSS variables)

| Token | Hex / Value | Role | Tailwind Equivalent |
|---|---|---|---|
| `--background` | `#020202` | Page background (near-black, warm-neutral) | `bg-background` |
| `--foreground` | `#f8f8f8` | Default text | `text-foreground` |
| `--card` | `#060607` | Card surface (one step above bg) | `bg-card` |
| `--card-foreground` | `#f8f8f8` | Text on card | `text-card-foreground` |
| `--popover` | `#0b0b0d` | Popover/menu surface | `bg-popover` |
| `--popover-foreground` | `#f8f8f8` | Text on popover | `text-popover-foreground` |
| `--primary` | `#febf00` | **Amber accent** — CTAs, active states, highlights | `bg-primary` / `text-primary` |
| `--primary-foreground` | `#020202` | Text on primary | `text-primary-foreground` |
| `--secondary` | `#111114` | Secondary surface | `bg-secondary` |
| `--secondary-foreground` | `#f8f8f8` | Text on secondary | `text-secondary-foreground` |
| `--muted` | `#1a1a1d` | Muted surface (chips, inactive states) | `bg-muted` |
| `--muted-foreground` | `#8e8e95` | Muted text | `text-muted-foreground` |
| `--accent` | `#febf00` | Same as primary (aliased) | `bg-accent` |
| `--accent-foreground` | `#020202` | Text on accent | `text-accent-foreground` |
| `--destructive` | `#ff2d39` | Error / destructive | `bg-destructive` |
| `--border` | `#1a1a1d` | Default border | `border-border` |
| `--input` | `#0b0b0d` | Input background | `bg-input` |
| `--ring` | `#febf0080` | Focus ring (amber at 50% alpha) | `ring-ring` |
| `--radius` | `0.75rem` | Default border radius (12px) | `rounded-xl` |

#### Semantic Color Usage (zinc scale, verified from computed styles)

| Zinc Token | Usage |
|---|---|
| `zinc-950` (`#09090b`, oklab `0.141 0.0014 -0.0048`) | Hero section bg, 4-step section bg, FAQ bg, use-cases bg |
| `zinc-900/30` | Testimonial card surface (`bg-zinc-900/30`) |
| `zinc-800/60` | Testimonial card border, FAQ wrapper border |
| `neutral-800` | Feature-grid border lines + accent bar (inactive) |
| `zinc-700/60` | Testimonial card hover border |
| `zinc-600/60` | Example carousel arrow border |
| `zinc-600` | Inactive ratio toggle text |
| `zinc-400` | Secondary body text, eyebrow subtext, arrow icon color |
| `zinc-300` | Primary body text, testimonial quote text |
| `zinc-300/80` | Hero subtitle, drop-shadowed |
| `amber-400` (`#fbbf24`, oklab `0.8016 0.166 0.992`) | All primary CTAs, eyebrow badge bg (`amber-400/10`), glow filters |
| `amber-400/10` | Eyebrow badge background |
| `amber-400/25` | Eyebrow badge border |
| `amber-400/20` | CTA hover shadow (`hover:shadow-amber-400/20`) |
| `amber-300` | Active style chip text (`font-bold text-amber-300`) |
| `white/[0.06]` | Inactive style chip background |
| `white/[0.08]` | Hero input border (default) |
| `white/[0.10]` | Active ratio toggle background, nav scroll border |
| `white/[0.12]` | Hero input border (hover) |
| `white/10` | FAQ item bottom border |
| `white/50` | Inactive style chip text |
| `white/60` | Nav link default color |

#### Gradient & Glow Techniques

**Hero overlay stack (three layers, top to bottom):**

1. Full-bleed `<video class="w-full h-full object-cover opacity-100 transition-opacity duration-1000">` — autoplay, muted, loop, playsinline.
2. `bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/80` — vertical scrim so headline stays legible against moving footage.
3. `radial-gradient(rgba(251, 191, 36, 0.12), rgba(0, 0, 0, 0) 65%)` — 800×500 amber glow centered at top:20%, `blur(60px)`, `opacity-30`.

**Hero bottom fade** (transition into next section):
`bg-gradient-to-b from-transparent to-zinc-950` — `h-8 sm:h-12`, masks the seam between hero video and examples section.

**Examples card hover glow (the singular yellow→purple gradient):**
```
absolute inset-0 bg-gradient-to-r from-yellow-500 to-purple-500
rounded-[20px] -z-10 blur-md opacity-50 group-hover:opacity-80
transition-opacity duration-300
```
This is the only place purple appears in the entire design system — it is reserved exclusively for the example-card hover aura and signals the chromatic range of outputs the product can produce.

**Eyebrow badge glow:**
`shadow-[0_0_30px_rgba(234,179,8,0.1)]` on the amber-400/10 eyebrow pill — produces the cinematic halo that makes the badge feel lit rather than printed.

**Final-CTA decoration stack (four layers):**
1. Dot-grid: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)` — subtle texture.
2. Radial amber halo: `radial-gradient(rgba(234,179,8,0.1) 0%, rgba(234,179,8,0.03) 40%, transparent 70%)`.
3. Top fade: `bg-gradient-to-b from-zinc-950 to-transparent h-32`.
4. Bottom fade: `bg-gradient-to-t from-zinc-950 to-transparent h-32`.

### 1.3 Typography

#### Font Loading (verified — `next/font` self-hosted, no Google Fonts CDN)

The site uses **three font families** loaded via Next.js `next/font` (font files served from `/_next/media/`):

| Family | Weights | Role | Loading Mechanism |
|---|---|---|---|
| **GeistSans** (variable, 100–900) | variable | Body, UI, nav, buttons, paragraphs | `next/font/local` → `Geist_Variable.woff2` |
| **GeistMono** (variable, 100–900) | variable | Aspect-ratio toggles (9:16 / 16:9), code-like UI accents, step counter | `next/font/local` → `GeistMono_Variable.woff2` |
| **Outfit** (500, 600, 700, 820) | 500/600/700/820 | All display headings (H1, H2, eyebrow, section titles) | `next/font/google` subsetted |

Each font ships with a generated fallback (`"GeistSans Fallback"`, `"Outfit Fallback"`) that uses `local("Arial")` with `font-display: swap` to prevent FOIT.

CSS variable wiring on `<body>`:
```
class="geistsans_d5a4f12f-module__XRADPW__variable
       geistmono_157ca88a-module__8hTDoW__variable
       outfit_97462c92-module__53oKgq__variable
       antialiased bg-background text-foreground"
```

In Tailwind config, expose as:
```ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      heading: ['var(--font-outfit)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },
  },
}
```

#### Type Scale & Usage (verified from computed styles)

| Element | Family | Size (desktop) | Weight | Line-height | Letter-spacing | Color |
|---|---|---|---|---|---|---|
| H1 (hero) | Outfit | **72px** (`lg:text-[4.5rem]`) | **820** | 73.44px (1.02) | **−2.88px** (`tracking-[-0.04em]`) | `#f8f8f8` |
| H1 (mobile 375) | Outfit | 36px (`text-4xl`) | 820 | 36.72px | −1.44px | `#f8f8f8` |
| H1 (tablet 768) | Outfit | 60px (`md:text-6xl`) | 820 | ~61px | −2.4px | `#f8f8f8` |
| H2 (section title, "4 Steps") | Outfit | 48px | 700 | 48px | −1.44px (`tracking-[-0.03em]`) | `#f8f8f8` |
| H2 ("Examples") | Outfit | 40px (`md:text-[40px]`) | 700 | 50px | −1px | `#ffffff` |
| H2 ("Built for Storytellers") | Outfit | 48px | 700 | — | −1.44px | `#f8f8f8` |
| H2 (final CTA) | Outfit | up to 72px (`md:text-7xl`) | 800 (`font-extrabold`) | — | `tracking-tighter` (−0.05em) | `text-white` |
| H3 (step title) | Geist Sans | `text-2xl sm:text-3xl lg:text-[2rem]` | 700 (`font-bold`) | `leading-tight` | `tracking-tight` | `text-white` |
| H3 (feature title) | Geist Sans | 17px (`text-[17px]`) | 700 | — | — | `text-white` |
| H3 (example title) | Geist Sans | 18px | 700 | 28px | normal | `#ffffff` |
| H3 (use-case title) | Geist Sans | — | 700 | — | — | `text-white` |
| Eyebrow badge | Geist Sans | 11px | 600 (`font-semibold`) | — | `tracking-widest uppercase` | `text-amber-400` |
| Body / paragraph | Geist Sans | 18px (`text-lg`) | 400 | 29.25px | normal | `oklab(0.871 0.0017 -0.0057 / 0.8)` (zinc-300/80) |
| Nav link | Geist Sans | 16px | 400 | — | — | `text-white/60` → hover `text-white` |
| Hero input (textarea) | Geist Sans | 16px | 400 | — | — | `text-white` |
| Style chip | Geist Sans | 14px | 700 | — | — | active `text-amber-300`, inactive `text-white/50` |
| Ratio toggle (9:16) | **GeistMono** | 10px | 400 | — | — | active `text-amber-400`, inactive `text-zinc-600` |
| Step counter | GeistMono | 10px | 400 | — | `tabular-nums` | `text-zinc-600` |
| Hero CTA ("Start Creating") | Geist Sans | 13px | 700 | — | — | `text-amber-300` on dark glass bg |
| Primary CTA (final, "Start Creating — It's Free") | Geist Sans | 15px | 700 | — | — | `text-zinc-950` on `bg-amber-400` |
| Testimonial quote | Geist Sans | 14px (`text-sm`) | 400 | `leading-relaxed` | — | `text-zinc-300` |
| Testimonial name | Geist Sans | 14px | 600 (`font-semibold`) | — | — | `text-white` |

### 1.4 Spacing & Layout System

**Container:** `mx-auto max-w-7xl` (1280px) for nav and most section content. Hero text block uses `max-w-3xl` (768px) centered. Hero subtitle uses `max-w-[52ch]` for measure control.

**Section vertical rhythm:** `py-16 sm:py-20 lg:py-24` is the default. Exceptions:
- Features section: `py-24` (taller — grid is the centerpiece).
- Use Cases section: `py-24`.
- FAQ section: `py-24`.
- Final CTA: `py-32` (most generous — gives the closing message room to breathe).

**Section horizontal padding:** `px-6` universally (24px on mobile, scaling via Tailwind container queries).

**Grid structures per section:**

| Section | Grid |
|---|---|
| Nav | Flex justify-between, no explicit grid |
| Hero | Single column, centered text, max-w-3xl |
| Hero input widget | Single column flex; chips wrap with `flex-wrap gap-2` |
| Style chips marquee | Horizontal flex with `overflow-hidden`, duplicate set for infinite scroll |
| Examples carousel | Horizontal flex; visible cards ≈ 4–5 at 1440px (260px each + gap) |
| 4-step workflow | 2-column on `lg`: `lg:grid-cols-2` with alternating `lg:order-1` / `lg:order-2` for media |
| Features grid | 4-column × 2-row at `lg` (`lg:grid-cols-4`), 2-col on `md`, 1-col on mobile |
| Testimonials | 3-column at `lg` (`lg:grid-cols-3`), 2-col on `md`, 1-col on mobile |
| Use cases | 2-column × 2-row at `lg` (`lg:grid-cols-2`) |
| FAQ | Single column `max-w-3xl mx-auto` |
| Final CTA | Single column centered |
| Footer | Multi-column flex with grouped link lists |

---

## 2. Component Specifications

### 2.1 Navigation Bar

**Position:** `fixed left-0 right-0 z-50 top-0`, full-width.
**Height:** 66px at desktop.
**Background behavior (scroll-aware):**

| Scroll position | Background | Border | Blur |
|---|---|---|---|
| At top (scrollY = 0) | `transparent` | none | none |
| Scrolled (scrollY > 0) | `bg-zinc-950/70` | `border-b border-white/10` | `backdrop-blur-24px` |

Implement with a `useScrollPosition` hook toggling a `scrolled` boolean state. Do **not** use Tailwind's `backdrop-blur-xl` token (which is 24px and matches) — use the explicit `backdrop-blur-[24px]` for clarity.

**Inner container:** `mx-auto max-w-7xl px-6` with flex justify-between, items-center, h-16.

**Left cluster:**
- Logo (wordmark "StoryIntoVideo" with the "Story" portion in white and "IntoVideo" potentially in amber — verify by visual inspection; the live DOM shows the entire wordmark in `text-white` at 16px/400, so treat as monochrome).

**Center cluster (desktop ≥ `sm`):** Nav links — Features, Pricing, Blog, Contact.
- Style: `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200`
- Default color: `text-white/60`
- Hover color: `text-white`
- Hover bg: subtle `bg-white/[0.04]`

**Right cluster:** Language switcher ("EN"), Sign in (text link), Get Started (primary CTA pill).
- Language switcher: `flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium` — opens a shadcn DropdownMenu with `animate-[lang-dropdown-in_0.15s_ease-out]`.
- Sign in: ghost link, `text-white/60 hover:text-white`, 16px/400.
- Get Started: `px-5 py-2 text-base font-medium rounded-full transition-colors duration-200` with `text-white/60 hover:text-white` — note: this is **not** amber-filled at desktop. The amber pill treatment is reserved for the in-section CTAs.

**Mobile (< `sm`):**
- Hide: nav links (Features, Pricing, Blog, Contact), Sign in.
- Show: language switcher, hamburger button (`aria-label="Open menu"`).
- Hamburger opens a shadcn **Sheet** (right-side drawer) with `data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out`. Drawer contains: Features, Pricing, Blog, Contact, Sign in, Get Started, Close.

**Accessibility:** All interactive elements must have visible focus rings using `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400`.

### 2.2 Hero Section

**Section wrapper:** `<section class="relative flex flex-col bg-zinc-950 overflow-hidden">`.

**Layer 1 — Background video:**
```html
<div class="absolute inset-0 z-0">
  <video
    class="w-full h-full object-cover transition-opacity duration-1000 opacity-100"
    autoplay muted loop playsinline preload="metadata"
    poster="/hero-poster.webp"
  >
    <source src="/hero-bg.mp4" type="video/mp4" />
  </video>
  <div class="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/80" />
  <div class="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-30
              bg-[radial-gradient(rgba(251,191,36,0.12),rgba(0,0,0,0)_65%)] blur-[60px]" />
</div>
```

**Layer 2 — Hero content (z-10):**
Container: `relative z-10 w-full max-w-3xl mx-auto px-6 flex flex-col items-center text-center pt-32 pb-6 sm:pt-40 sm:pb-8`.

Children, in order:

1. **Eyebrow badge** — `inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 mb-8 backdrop-blur-sm shadow-[0_0_30px_rgba(234,179,8,0.1)] animate-[fade-in-up_0.6s_ease-out_0.05s_both]`.
   Text: "AI-Powered Story Into Video" — `text-[11px] font-semibold text-amber-400 tracking-widest uppercase`.

2. **H1** — `font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.02] mb-6 tracking-[-0.04em] animate-[fade-in-up_0.6s_ease-out_0.1s_both]`.
   Copy: **"Turn Story Into Video with AI Magic"** (line break between "Video" and "with" — use `<br class="hidden sm:block" />`).

3. **Subtitle** — `text-base sm:text-lg text-zinc-300/80 mb-10 max-w-[52ch] leading-relaxed drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)] animate-[fade-in-up_0.6s_ease-out_0.15s_both]`.
   Copy: "Paste your story and AI handles the rest — characters, storyboards, voiceover, and subtitles, all generated in minutes."

4. **Story input widget** — `w-full max-w-2xl animate-[fade-in-up_0.6s_ease-out_0.2s_both]`.
   Container: `group/input relative rounded-2xl bg-zinc-950/60 backdrop-blur-xl p-5 sm:p-6 border border-white/[0.08] hover:border-white/[0.12] shadow-[0_20px_80px_rgba(0,0,0,0.6)] transition-all duration-500`.
   Contents:
   - `<textarea>` — placeholder "Paste your story here, or write a short idea...", `w-full bg-transparent text-white text-base resize-none focus:outline-none`, height ≈ 78px (3 lines).
   - **Story example chips row** — `flex flex-wrap gap-2 mt-4`:
     - 4 chips: "Time travel", "Space odyssey", "Rival chefs", "Victorian mystery".
     - Style: `px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors duration-200`.
   - **Bottom action row** — `flex items-center justify-between mt-5`:
     - Left: aspect-ratio toggle — two GeistMono buttons:
       - Active (9:16): `px-2 py-1 text-[10px] font-mono bg-white/[0.1] text-amber-400`.
       - Inactive (16:9): `px-2 py-1 text-[10px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors`.
     - Right: "Start Creating" link — `inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-full text-[13px] font-bold transition-all bg-gradient-to-r` (gradient direction TBD — appears as dark glass with amber text).

**Layer 3 — Style tags marquee** — `relative z-10 mt-10 sm:mt-16 animate-[fade-in-up_0.6s_ease-out_0.35s_both]`.
- Container: `overflow-hidden` with mask-image fade on both edges (`mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent)`).
- Inner: flex of duplicated chip set, animated via CSS `animation: marquee 30s linear infinite` (define keyframe `marquee` translating `0% → -50%`).
- Chips (7): Ghibli · Oil Painting · Anime · Realistic · Cyberpunk Futuristic neon · Watercolor · Comic.
- Each chip: `inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02] text-sm font-bold text-white/50 hover:text-amber-300 hover:border-amber-400/30 transition-colors duration-200 whitespace-nowrap`.
- Cyberpunk chip is wider and includes a sublabel "Futuristic neon" in smaller text.

**Layer 4 — Bottom fade** — `relative z-0 h-8 sm:h-12 bg-gradient-to-b from-transparent to-zinc-950`. This masks the seam into the next section.

### 2.3 Story Examples Section

**Section wrapper:** `<section class="py-16 md:py-20 px-6 relative overflow-hidden scroll-mt-20">`.

**Header row:** Flex justify-between, items-end, mb-12.
- Left: eyebrow ("REAL EXAMPLES") + H2 "Real Story Into Video Examples" (`text-3xl md:text-[40px] font-heading font-bold tracking-tight text-white leading-tight`).
- Right: carousel arrows — two `w-8 h-8 rounded-full border border-zinc-600/60 flex items-center justify-center text-zinc-400 shrink-0` buttons (prev/next), with `hover:border-amber-400/60 hover:text-amber-400 transition-colors`.

**Carousel:** Horizontal flex with `overflow-x-auto scrollbar-hide snap-x snap-mandatory` (or JS-driven translateX). Visible card width: **260px**, height: **462px** (portrait 9:16 to mirror the dominant output aspect ratio).

**Card structure:**
```html
<div class="relative group cursor-pointer snap-start shrink-0 w-[260px]">
  <!-- Hover glow (the yellow→purple gradient) -->
  <div class="absolute inset-0 bg-gradient-to-r from-yellow-500 to-purple-500
              rounded-[20px] -z-10 blur-md opacity-50 group-hover:opacity-80
              transition-opacity duration-300" />
  <!-- Card body -->
  <div class="relative aspect-[9/16] rounded-[20px] overflow-hidden bg-zinc-900
              border border-white/5 group-hover:border-white/10 transition-colors">
    <img src="..." class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
    <!-- Bottom gradient overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <!-- Title + meta -->
    <div class="absolute bottom-0 inset-x-0 p-4">
      <h3 class="text-lg font-bold text-white leading-7 mb-1">Confession in the Blue Flower Sea</h3>
      <p class="text-xs text-zinc-400">Anime · Romance</p>
    </div>
  </div>
</div>
```

**Below carousel:** Centered "Clone this project for free" gradient pill CTA.
- Style: `group inline-flex items-center gap-2.5 px-10 py-4 rounded-full text-[15px] font-semibold transition-all bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 hover:shadow-lg hover:shadow-amber-400/30`.
- Visible on desktop, hidden on mobile (where the carousel auto-scrolls).

**Example data (6 cards, populated from live site):**

| # | Title | Style tag |
|---|---|---|
| 1 | Confession in the Blue Flower Sea | Anime · Romance |
| 2 | The Last Signal | Sci-Fi · Cyberpunk |
| 3 | Murder at Hightower Manor | Mystery · Victorian |
| 4 | Beyond the Veil | Fantasy · Oil Painting |
| 5 | Tokyo Rain | Realistic · Drama |
| 6 | The Grand Tournament | Epic · Watercolor |

### 2.4 4-Step Workflow Section

**Section wrapper:** `<section class="relative py-16 sm:py-20 lg:py-24 bg-zinc-950 overflow-hidden">`.

**Header:** Centered eyebrow + H2 "From Story to Video in 4 Steps" (`text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-white mb-16`).

**Grid:** `lg:grid-cols-2 gap-8 lg:gap-12` — each step is a 2-column row that alternates media left/right.

**Step structure (repeated 4×):**
```html
<div class="lg:col-span-2 lg:order-{1 or 2}">
  <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
    <!-- Media side (video) -->
    <div class="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
      <video
        class="absolute inset-0 w-full h-full object-cover lg:object-contain transition-opacity duration-700"
        autoplay muted loop playsinline preload="metadata"
        poster="https://r2.storyintovideo.com/landing/workflow/showcase-step{N}-poster.webp"
      >
        <source src="https://r2.storyintovideo.com/landing/workflow/showcase-step{N}.mp4" type="video/mp4" />
      </video>
    </div>
    <!-- Text side -->
    <div>
      <div class="flex items-center gap-3 mb-5">
        <span class="font-mono text-[10px] tabular-nums text-zinc-600">0{N}</span>
        <span class="h-px flex-1 bg-neutral-800" />
      </div>
      <h3 class="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-white tracking-tight leading-tight mb-5">
        {Step Title}
      </h3>
      <p class="text-zinc-400 leading-relaxed mb-6">{Step Description}</p>
      <a href="#" class="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium text-sm group">
        {CTA Label}
        <span class="transition-transform group-hover:translate-x-1">→</span>
      </a>
    </div>
  </div>
</div>
```

**Step content (verified from live site):**

| # | Title | Description | CTA | Video URL | Poster URL | Layout order |
|---|---|---|---|---|---|---|
| 1 | Create Your Project | Paste your story in any language — novel, script, or narrative. Pick a visual style and aspect ratio. | Start Your Story → | `showcase-step1.mp4` | `showcase-step1-poster.webp` | `lg:order-2` (media right) |
| 2 | Generate Characters & Scenes | AI reads your story and performs automatic scene breakdown — creating consistent character portraits. | Create Your Characters → | `showcase-step2.mp4` | `showcase-step2-poster.webp` | `lg:order-1` (media left) |
| 3 | AI Storyboard | AI breaks your story into shots and generates storyboard images automatically, with full character consistency. | Try AI Storyboard → | `showcase-step3.mp4` *(placeholder — live site uses static images)* | `showcase-step3-poster.webp` | `lg:order-2` (media right) |
| 4 | Professional Timeline Editor | Full creative control in the timeline editor. Add AI voiceover and background music, style subtitles. | Create Your Video → | `showcase-step4.mp4` | `showcase-step4-poster.webp` | `lg:order-1` (media left) |

**Asset base URL:** `https://r2.storyintovideo.com/landing/workflow/` — clone should self-host these MP4s and WebP posters in `/public/workflow/`.

**Vertical spacing between steps:** `mb-16 lg:mb-24` per step block.

**Mobile:** All steps collapse to single column, media above text.

### 2.5 Features Grid Section

**Section wrapper:** `<section class="py-24 bg-zinc-950 relative overflow-hidden">`.

**Header:** Centered eyebrow ("FEATURES") + H2 "Creating AI Videos Has Never Been So Easy" (`text-4xl sm:text-5xl lg:text-6xl font-heading font-bold tracking-tight text-white mb-16`).

**Grid:** `lg:grid-cols-4 md:grid-cols-2 grid-cols-1` — 8 features in a 4×2 layout.

**This is the design's most distinctive section.** Cards are **not** boxed — they share a continuous surface separated only by hairline borders. Each card is:

```html
<div class="group relative border-b border-r border-neutral-800 py-10 px-8">
  <!-- Left accent bar (inactive: neutral, hover: amber) -->
  <div class="absolute start-0 top-8 bottom-8 w-[3px] rounded-e-full bg-neutral-800
              group-hover:bg-amber-400 transition-colors duration-300" />
  <!-- Icon (24×24 SVG, stroke-1.5, currentColor) -->
  <div class="mb-5 text-zinc-400 group-hover:text-amber-400 transition-colors duration-300">
    <svg class="w-6 h-6" ...>{...}</svg>
  </div>
  <!-- Title (slides right on hover) -->
  <h3 class="text-[17px] font-bold text-white mb-2.5 group-hover:translate-x-2 transition-transform duration-300">
    AI Script Analysis
  </h3>
  <!-- Description -->
  <p class="text-sm text-zinc-400 leading-relaxed">
    Paste any story and AI identifies characters, scenes, and narrative structure — automatically.
  </p>
  <!-- Bottom gradient sheen on hover -->
  <div class="absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
</div>
```

**Three coordinated hover effects** (this is the section's signature interaction):
1. Left accent bar: `bg-neutral-800` → `bg-amber-400` (color transition, 300ms).
2. Title: `translate-x-0` → `translate-x-2` (8px slide right, 300ms).
3. Surface sheen: `opacity-0` → `opacity-100` (gradient overlay, 300ms).

**Edge cleanup:** The rightmost column cards need `lg:border-r-0` and the bottom-row cards need `border-b-0` to avoid double borders at the grid's outer edge. Use `:nth-child` selectors or explicit conditional classes.

**Features data (8 items):**

| # | Title | Description |
|---|---|---|
| 1 | AI Script Analysis | Paste any story and AI identifies characters, scenes, and narrative structure — automatically. |
| 2 | Character Consistency | Same character face across all scenes. AI-powered visual identity keeps every character on-model. |
| 3 | Multi-Voice Narration | Natural AI voiceovers from ElevenLabs. Multiple voice styles bring every character to life. |
| 4 | 100% AI Powered | Latest AI models for image generation, video synthesis, and voice cloning — the entire pipeline. |
| 5 | Scene Generation | AI generates cinematic scenes that match your story's settings, mood, and atmosphere. |
| 6 | Dynamic Subtitles | Auto-generated subtitles with precise timing and ASR alignment. Every word of your story. |
| 7 | One-Click Export | Export your finished story video with subtitles, voiceover, and background music in one click. |
| 8 | And Much More... | StoryIntoVideo is constantly evolving with new story-into-video features added every week. |

**Icons:** Use `lucide-react` icons that conceptually match (e.g., `FileText`, `Users`, `Mic`, `Sparkles`, `Film`, `Captions`, `Download`, `Plus`). Stroke 1.5, 24×24, `currentColor`.

**Below the grid:** Centered "Start Creating Your Video" link — `inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium mt-12 group` with arrow that translates right on hover.

### 2.6 Testimonials Section

**Section wrapper:** `<section class="py-16 sm:py-20 lg:py-24 bg-zinc-950">`.

**Header:** Centered eyebrow ("TESTIMONIALS") + H2 "Loved by Creators" + subtitle "Hear from creators who use StoryIntoVideo to turn their stories into videos every day." (`text-base sm:text-lg text-zinc-400 max-w-[45ch] mx-auto`).

**Grid:** `lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6`.

**Card structure:**
```html
<div class="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 sm:p-6
            hover:border-zinc-700/60 transition-colors duration-300">
  <!-- Quote -->
  <p class="text-sm text-zinc-300 leading-relaxed mb-5">
    "I turned my fan fiction into a full animated short in under an hour. The story-into-video
    pipeline is seamless — character consistency across scenes is incredible."
  </p>
  <!-- Author row -->
  <div class="flex items-center gap-3">
    <!-- Avatar (32×32, rounded-full, gradient bg) -->
    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600
                flex items-center justify-center text-xs font-bold text-zinc-950">
      SK
    </div>
    <div>
      <p class="text-sm font-semibold text-white">Sarah K.</p>
      <p class="text-xs text-zinc-500">Fan Fiction Writer</p>
    </div>
  </div>
</div>
```

**Testimonial data (6 cards, verified):**

| # | Name | Role | Quote (truncated) |
|---|---|---|---|
| 1 | Sarah K. | Fan Fiction Writer | "I turned my fan fiction into a full animated short in under an hour. The story-into-video pipeline is seamless — character consistency across scenes is incredible." |
| 2 | Marcus L. | Solo Filmmaker | "As a solo filmmaker, this story-into-video tool replaced an entire pre-production team. I turn scripts into visual storyboards in minutes instead of days." |
| 3 | Yuki T. | Light Novel Author | "I can finally show my readers what my characters look like. I turn my light novel chapters into video trailers and the anime style output is incredible." |
| 4 | David R. | Marketing Lead | "We turn product stories into video for social media daily. What used to take a video agency two weeks, we now do in an afternoon with StoryIntoVideo." |
| 5 | Priya M. | Educator | "My students are more engaged than ever. I turn historical narratives into short story videos they actually want to watch — no filming needed." |
| 6 | Alex C. | YouTube Creator | "I turn trending stories into video content 3-4 times a week now. The AI voiceover quality is great and my channel grew 10x in two months." |

**Avatars:** Use initials in a 32×32 gradient circle (from-amber-400 to-amber-600). Do **not** use stock photo avatars — keeps the clone asset-light and matches the live site's approach.

**Below grid:** Centered "Join Creators — Start Free" link in the same style as the Features section CTA.

### 2.7 Use Cases Section

**Section wrapper:** `<section class="py-24 bg-zinc-950 relative overflow-hidden">`.

**Header:** Centered eyebrow ("USE CASES") + H2 "Built for Storytellers".

**Grid:** `lg:grid-cols-2 grid-cols-1 gap-6` — 4 cards in 2×2 layout.

**Card structure:**
```html
<a href="#" class="group block relative rounded-2xl border border-white/[0.06] bg-white/[0.02]
                   p-8 hover:bg-white/[0.04] hover:border-amber-400/20 transition-all duration-300
                   overflow-hidden">
  <!-- Decorative corner gradient (revealed on hover) -->
  <div class="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl
              opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
  <!-- Icon -->
  <div class="relative mb-6 w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20
              flex items-center justify-center text-amber-400">
    <svg class="w-6 h-6" ...>{...}</svg>
  </div>
  <!-- Title + duplicate (for accessibility pattern observed on live site) -->
  <h3 class="text-xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">
    Novel & Fiction Writers
  </h3>
  <!-- Description -->
  <p class="text-zinc-400 leading-relaxed mb-6">
    Turn your novel into video — create visual trailers or full short dramas from your story.
    Give readers a cinematic taste of your story before they dive in.
  </p>
  <!-- CTA -->
  <span class="inline-flex items-center gap-2 text-amber-400 font-medium text-sm group/cta">
    Try it now
    <span class="transition-transform group-hover/cta:translate-x-1">→</span>
  </span>
</a>
```

**Use cases data (4 cards, verified):**

| # | Title | Description |
|---|---|---|
| 1 | Novel & Fiction Writers | Turn your novel into video — create visual trailers or full short dramas from your story. Give readers a cinematic taste of your story before they dive in. |
| 2 | Content Creators | Turn trending stories into video for YouTube Shorts and TikTok. Build faceless channels with StoryIntoVideo's AI-generated content. |
| 3 | Filmmakers & Studios | Turn your script into video storyboards instantly. See your story come alive as a video before production — perfect for pitching and pre-visualization. |
| 4 | Educators & Trainers | Turn educational stories into video lessons. Make complex narratives memorable through AI-powered story-into-video generation. |

**Icons (lucide-react suggestions):** `BookOpen`, `Video`, `Clapperboard`, `GraduationCap`.

### 2.8 FAQ Section

**Section wrapper:** `<section class="py-24 bg-zinc-950">`.

**Header:** Centered eyebrow ("FAQ") + H2 "Frequently Asked Questions".

**Container:** `max-w-3xl mx-auto`.

**Implementation:** Use shadcn/ui `Accordion` (which wraps Radix). Type="single", collapsible.

**Item structure (each):**
```html
<div class="border-b border-white/10 last:border-0">
  <AccordionTrigger class="w-full py-6 flex items-center justify-between text-start
                            focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2
                            focus-visible:outline-amber-400 group hover:no-underline">
    <span class="text-base sm:text-lg font-medium text-white group-hover:text-amber-300
                 transition-colors pr-4">
      What kind of stories can I turn into videos?
    </span>
    <!-- Plus icon rotates to X on open -->
    <span class="shrink-0 text-zinc-500 group-hover:text-amber-400 transition-transform duration-300
                 [[data-state=open]>&]:rotate-45">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </span>
  </AccordionTrigger>
  <AccordionContent class="overflow-hidden text-zinc-400 data-[state=closed]:animate-out
                            data-[state=open]:animate-in">
    <p class="pb-6 text-sm sm:text-base leading-relaxed">
      You can turn any narrative into video — novels, short stories, scripts, fanfiction, blog posts,
      or even product descriptions. StoryIntoVideo understands narrative structure and can convert
      any genre into a cinematic video.
    </p>
  </AccordionContent>
</div>
```

**Animation mechanism:** Radix Accordion uses CSS grid `grid-template-rows: 0fr → 1fr` transition on the content wrapper. Tailwind v4 supports this via the `data-[state=open]` and `data-[state=closed]` variants. Duration: 300ms ease-out.

**FAQ items (6, verified):**

| # | Question | Answer (truncated) |
|---|---|---|
| 1 | What kind of stories can I turn into videos? | You can turn any narrative into video — novels, short stories, scripts, fanfiction, blog posts, or even product descriptions. StoryIntoVideo understands narrative structure and can convert any genre into a cinematic video. |
| 2 | How does AI maintain character consistency? | StoryIntoVideo uses a proprietary character-locking system. Once the AI generates a character portrait in Step 2, that visual identity is preserved across every subsequent scene through reference-image conditioning. |
| 3 | Do I own the copyright to the videos? | Yes. You retain full commercial rights to all videos generated through your account. The underlying AI models are licensed for commercial use. |
| 4 | Can I customize the visual style? | Absolutely. Choose from 7+ visual styles including Ghibli, Oil Painting, Anime, Realistic, Cyberpunk, Watercolor, and Comic — or describe a custom style and the AI will adapt. |
| 5 | How long does it take to generate a video? | A typical 2-minute story video takes about 8–12 minutes to generate end-to-end, including character generation, scene rendering, voiceover synthesis, and subtitle alignment. |
| 6 | What languages are supported for narration? | StoryIntoVideo supports 30+ languages for AI narration, including English, Spanish, French, German, Japanese, Korean, Chinese, Portuguese, and Arabic. New languages are added monthly. |

### 2.9 Final CTA Section

**Section wrapper:** `<section class="relative py-32 overflow-hidden">`.

**Layer stack (4 decorative layers, all `pointer-events-none`):**
1. Dot grid: `absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]`.
2. Radial amber halo: `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(rgba(234,179,8,0.1)_0%,rgba(234,179,8,0.03)_40%,transparent_70%)]`.
3. Top fade: `absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-zinc-950 to-transparent`.
4. Bottom fade: `absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent`.

**Content (centered, z-10):**
```html
<div class="relative z-10 max-w-3xl mx-auto px-6 text-center">
  <h2 class="text-3xl sm:text-5xl md:text-7xl font-heading font-extrabold tracking-tighter
             text-white mb-6">
    Your Story Deserves to Be Seen
  </h2>
  <p class="text-base sm:text-lg text-zinc-400 mb-10 max-w-[52ch] mx-auto leading-relaxed">
    Join thousands of creators turning their stories into cinematic videos with AI.
    No editing skills required — just paste your story and watch it come alive.
  </p>
  <a href="/auth/sign-up"
     class="inline-flex items-center gap-2.5 px-8 py-3.5 bg-amber-400 hover:bg-amber-300
            text-zinc-950 font-bold text-[15px] rounded-full transition-all duration-200
            hover:shadow-lg hover:shadow-amber-400/20 hover:scale-[1.02]
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400">
    Start Creating — It's Free
    <svg class="w-4 h-4" ...>→</svg>
  </a>
  <p class="mt-6 text-xs text-zinc-500">No credit card required · Free forever plan</p>
</div>
```

**This is the only place `bg-amber-400` is used as a solid fill on a button** — it is the page's conversion crescendo and earns the full chromatic weight of the accent. All prior CTAs use either ghost links or glass pills.

### 2.10 Footer

**Section wrapper:** `<footer class="bg-zinc-950 border-t border-white/[0.06] py-16 px-6">`.

**Container:** `mx-auto max-w-7xl`.

**Layout:** Top row = brand + 3 link columns + newsletter. Bottom row = copyright + legal links.

**Brand block (left):**
- Wordmark "StoryIntoVideo" in `text-white font-heading font-bold text-lg`.
- Tagline: "Turn any story into a cinematic video with AI." in `text-sm text-zinc-400 mt-2`.
- Support email link: `support@storyintovideo.com` — `text-sm text-zinc-400 hover:text-amber-400 transition-colors`.

**Link columns (3):**

| Column 1: All AI Tools | Column 2: Use Cases | Column 3: Legal |
|---|---|---|
| Script to Video | Bedtime Story Video | Privacy Policy |
| AI Image Generator | Kids Story Video | Terms of Service |
| AI Video Generation | Birthday Video | Contact Us |
| Kling 3 Video | Father's Day Video | |
| Hailuo 2.3 Video | | |
| Seedance 2 Video | | |
| Seedance 1.5 Pro | | |
| Seedream Image | | |
| GPT Image 2 | | |
| Nano Banana | | |

Column header style: `text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4`.
Link style: `block py-1.5 text-sm text-zinc-400 hover:text-white transition-colors`.

**Bottom row:** `border-t border-white/[0.06] mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4`.
- Left: "© 2026 StoryIntoVideo. All rights reserved."
- Right: `flex gap-6` with Privacy Policy, Terms of Service, All AI Tools (text-sm text-zinc-500 hover:text-white).

---

## 3. Animation & Motion Specifications

The site ships a **12-keyframe motion library** (extracted verbatim from production CSS). Every animation is defined as a `@keyframes` rule and invoked via Tailwind's arbitrary `animate-[name_duration_easing_delay_fillmode]` syntax. No JS animation libraries (Framer Motion, GSAP) are loaded — all motion is CSS-only, which is critical for the Lighthouse Performance target.

### 3.1 The 12-Keyframe Library (verbatim from live `:root` stylesheet)

```css
/* === ENTRANCE === */
@keyframes fade-in-up {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* === AMBIENT (looping, decorative) === */
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(var(--card-rotate, 0deg)); }
  50%      { transform: translateY(-12px) rotate(var(--card-rotate, 0deg)); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
  50%      { box-shadow: 0 0 40px rgba(251, 191, 36, 0.5); }
}

@keyframes border-glow {
  0%, 100% { border-color: rgba(245, 184, 0, 0.08); }
  50%      { border-color: rgba(245, 184, 0, 0.2); }
}

@keyframes compositePulseText {
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 1; }
}

/* === SHIMMER / SWEEP === */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes btn-shimmer {
  0%   { transform: translate(-100%); }
  100% { transform: translate(100%); }
}

/* === GRID EFFECTS (for tech-styled backgrounds) === */
@keyframes gridShimmer {
  0%   { transform: translate(-20%, -30%); }
  50%  { transform: translate(70%, 40%); }
  100% { transform: translate(-20%, -30%); }
}

@keyframes gridSweepH {
  0%   { transform: translate(-600px); }
  100% { transform: translate(calc(600px + 100vw)); }
}

@keyframes gridSweepV {
  0%   { transform: translateY(-500px); }
  100% { transform: translateY(calc(500px + 100vh)); }
}

@keyframes scanlineScroll {
  0%   { background-position-x: 0; }
  100% { background-position-x: 30px; }
}

/* === DROPDOWN === */
@keyframes lang-dropdown-in {
  0%   { opacity: 0; transform: translateY(-4px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
```

**Note:** `gridSweepH2` is referenced in the keyframe list but appears to be a variant of `gridSweepH` with a different start offset — define it as `gridSweepH` with `0% { transform: translate(0); }` if needed.

### 3.2 Scroll Reveal Animation Pattern

**Strategy:** Use IntersectionObserver (or `framer-motion`'s `whileInView` if added later — but prefer pure CSS for performance) to add a `data-revealed="true"` attribute when an element enters the viewport. Pair with a utility class:

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  transition-delay: var(--reveal-delay, 0s);
}
[data-reveal][data-revealed="true"] {
  opacity: 1;
  transform: translateY(0);
}
```

**Reveal delay table** (staggered entrance per section, applied via `style="--reveal-delay: {N}ms"`):

| Section | Element | Delay |
|---|---|---|
| Hero | Eyebrow badge | 50ms |
| Hero | H1 | 100ms |
| Hero | Subtitle | 150ms |
| Hero | Input widget | 200ms |
| Hero | Style chips marquee | 350ms |
| Each section header (eyebrow + H2 + subtitle) | Staggered | 0ms / 100ms / 200ms |
| Each card in a grid | nth-child(N) | N × 80ms (cap at 400ms) |

**Respect `prefers-reduced-motion`:** Wrap all animation declarations in `@media (prefers-reduced-motion: no-preference)`. For users with reduced-motion preference, set `opacity: 1; transform: none;` on all `[data-reveal]` elements.

### 3.3 Style Tags Marquee / Ticker

**Container:** `relative overflow-hidden` with edge mask:
```css
.masked-marquee {
  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}
```

**Inner track:** Duplicated chip set (so 14 chips total — 7 original + 7 clone) inside a flex container with:
```css
.marquee-track {
  display: flex;
  gap: 0.5rem;
  width: max-content;
  animation: marquee-scroll 40s linear infinite;
}
.marquee-track:hover {
  animation-play-state: paused;
}
@keyframes marquee-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

**Pause on hover:** Critical UX detail — users must be able to read a chip without it scrolling away.

### 3.4 Hover Micro-interactions Catalog

| Element | Property | From → To | Duration | Easing |
|---|---|---|---|---|
| Nav link | color | `text-white/60` → `text-white` | 200ms | ease-out |
| Nav link | background | transparent → `bg-white/[0.04]` | 200ms | ease-out |
| Hero input wrapper | border-color | `white/[0.08]` → `white/[0.12]` | 500ms | ease-out |
| Hero CTA ("Start Creating") | background gradient | subtle → brightened amber | 200ms | ease-out |
| Style chip (marquee) | color + border | `text-white/50 border-white/10` → `text-amber-300 border-amber-400/30` | 200ms | ease-out |
| Example carousel card | inner image scale | `scale-100` → `scale-105` | 500ms | ease-out |
| Example carousel card | glow opacity | 0.5 → 0.8 (yellow→purple gradient) | 300ms | ease-out |
| Example carousel arrow | border + color | `border-zinc-600/60 text-zinc-400` → `border-amber-400/60 text-amber-400` | 200ms | ease-out |
| 4-step CTA link | arrow translateX | 0 → 4px | 200ms | ease-out |
| Feature card: accent bar | background | `bg-neutral-800` → `bg-amber-400` | 300ms | ease-out |
| Feature card: title | translateX | 0 → 8px (`translate-x-2`) | 300ms | ease-out |
| Feature card: surface sheen | opacity | 0 → 1 | 300ms | ease-out |
| Feature card: icon color | color | `text-zinc-400` → `text-amber-400` | 300ms | ease-out |
| Testimonial card | border-color | `zinc-800/60` → `zinc-700/60` | 300ms | ease-out |
| Use case card | background + border | `bg-white/[0.02] border-white/[0.06]` → `bg-white/[0.04] border-amber-400/20` | 300ms | ease-out |
| Use case card: corner glow | opacity | 0 → 1 (amber blur) | 500ms | ease-out |
| Use case card: title color | color | `text-white` → `text-amber-300` | 300ms | ease-out |
| FAQ plus icon | rotate | 0deg → 45deg (becomes ×) | 300ms | ease-out |
| Final CTA button | background + shadow + scale | `bg-amber-400` → `bg-amber-300 shadow-amber-400/20 scale-[1.02]` | 200ms | ease-out |
| Footer link | color | `text-zinc-400` → `text-white` (or `text-amber-400` for support email) | 200ms | ease-out |

### 3.5 FAQ Accordion Animation

**Mechanism:** Radix Accordion's `AccordionContent` uses CSS Grid `grid-template-rows` transition (0fr → 1fr). This is the modern, GPU-accelerated alternative to `max-height` animation.

```css
.radix-accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-out;
}
.radix-accordion-content[data-state="open"] {
  grid-template-rows: 1fr;
}
.radix-accordion-content > div {
  overflow: hidden;
}
```

**Plus → × icon rotation:** The trigger's svg wrapper has `transition-transform duration-300` and a Tailwind variant `[[data-state=open]>&]:rotate-45` — when the parent AccordionItem has `data-state="open"`, the icon rotates 45°, morphing `+` into `×`.

### 3.6 Hero Widget Interactions

**Textarea focus:**
- On focus: parent wrapper adds `border-amber-400/30` and `shadow-[0_20px_80px_rgba(0,0,0,0.6),0_0_30px_rgba(251,191,36,0.1)]` (subtle amber glow).
- On blur: returns to default state.
- Implementation: `focus-within:` variant on the wrapper div.

**Story example chip click:**
- Clicking a chip ("Time travel", etc.) populates the textarea with a pre-written story seed.
- Visual feedback: chip briefly flashes `bg-amber-400/20` for 200ms.
- Implementation: useState in the Hero component, chip's `onClick` sets `textarea.value`.

**Aspect ratio toggle:**
- Two buttons: "9:16" (portrait, default active) and "16:9" (landscape).
- Active state: `bg-white/[0.1] text-amber-400`.
- Inactive state: `text-zinc-600 hover:text-zinc-400`.
- Clicking toggles the active state — visual only, no functional change (this is a marketing page).

**"Start Creating" CTA:**
- On hover: gradient brightens, subtle scale `1.02`, shadow grows.
- On click: routes to `/auth/sign-up` (placeholder).

### 3.7 Video Loading State

**Pattern:** All looping demo videos (hero bg + 4-step workflow) follow the same loading choreography:

1. **Poster shown first:** `<video poster="...webp">` displays the WebP poster immediately (no layout shift).
2. **Video preloads metadata:** `preload="metadata"` — fetches dimensions + first frame, not the whole file.
3. **Fade-in on canplay:** `transition-opacity duration-1000 opacity-0 → opacity-100` triggered by the `canplay` event listener.
4. **Autoplay attributes:** `autoplay muted loop playsinline` — required for iOS Safari autoplay.
5. **Fallback:** If video fails to load after 5s, poster remains visible. No error UI.

```tsx
const videoRef = useRef<HTMLVideoElement>(null);
const [loaded, setLoaded] = useState(false);

useEffect(() => {
  const v = videoRef.current;
  if (!v) return;
  const onCanPlay = () => setLoaded(true);
  v.addEventListener('canplay', onCanPlay);
  return () => v.removeEventListener('canplay', onCanPlay);
}, []);

<video
  ref={videoRef}
  poster="/workflow/showcase-step1-poster.webp"
  className={`transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}
  autoPlay muted loop playsinline preload="metadata"
>
  <source src="/workflow/showcase-step1.mp4" type="video/mp4" />
</video>
```

### 3.8 Nav Scroll-Aware Background

```tsx
'use client';
import { useEffect, useState } from 'react';

export function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

// In Navbar component:
const scrolled = useScrolled(10);
<header className={`fixed left-0 right-0 z-50 top-0 transition-all duration-300
  ${scrolled ? 'bg-zinc-950/70 backdrop-blur-[24px] border-b border-white/10' : 'bg-transparent'}`}>
```

---

## 4. Page-by-Page Section Map

### Full Section Order (Top → Bottom)

| # | Section | Y-offset (desktop) | Approx height | Key elements |
|---|---|---|---|---|
| 0 | **Navigation** (fixed overlay) | 0 | 66px | Logo, nav links, lang switcher, Sign in, Get Started, mobile hamburger |
| 1 | **Hero** | 0 | ~1094px | Eyebrow, H1, subtitle, story input widget, style chips marquee, bottom fade |
| 2 | **Real Story Into Video Examples** | 1194px | ~965px | Carousel header, 6 portrait cards (260×462px) with hover glow, arrows, "Clone this project for free" CTA |
| 3 | **From Story to Video in 4 Steps** | 2159px | ~2511px | 4 alternating media/text rows with looping MP4 demos |
| 4 | **Creating AI Videos Has Never Been So Easy** (Features) | 4670px | ~1065px | 8 features in 4×2 grid with hairline borders + hover accent bar |
| 5 | **Loved by Creators** (Testimonials) | 5735px | ~964px | 6 testimonial cards in 3×2 grid with quote + initials avatar |
| 6 | **Built for Storytellers** (Use Cases) | 6699px | ~1051px | 4 use-case cards in 2×2 grid with corner glow on hover |
| 7 | **Frequently Asked Questions** | 7750px | ~957px | 6-item Radix accordion, single-column max-w-3xl |
| 8 | **Your Story Deserves to Be Seen** (Final CTA) | 8707px | ~571px | Dot-grid bg, radial amber halo, top/bottom fades, H2 + subtitle + solid amber CTA |
| 9 | **Footer** | ~9278px | ~480px | Brand block, 3 link columns, copyright row |

**Total page height:** ~9758px at desktop (1440×900 viewport).

### Navigation Behavior Map

| State | Desktop | Mobile (<sm) |
|---|---|---|
| At top | Transparent bg, all links visible | Transparent bg, only logo + lang + hamburger visible |
| Scrolled | `bg-zinc-950/70 backdrop-blur-24px border-b border-white/10` | Same scroll treatment |
| Hamburger open | N/A | Right-side Sheet drawer with all links + Close button |

### CTA Hierarchy Map

The page uses a deliberate 4-tier CTA hierarchy, each progressively more visually assertive:

| Tier | Style | Where used |
|---|---|---|
| 1 (ghost link) | `text-amber-400 hover:text-amber-300` with arrow | 4-step section CTAs, Features "Start Creating Your Video", Testimonials "Join Creators", Use case card "Try it now" |
| 2 (glass pill) | `bg-gradient-to-r` dark glass + amber text, `rounded-full` | Hero "Start Creating" |
| 3 (gradient pill) | `bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950` | Examples "Clone this project for free" |
| 4 (solid amber pill) | `bg-amber-400 hover:bg-amber-300 text-zinc-950 hover:shadow-amber-400/20 hover:scale-[1.02]` | Final CTA "Start Creating — It's Free" |

This hierarchy is critical — the amber accent's appearance budget is intentionally rationed so that by the time the user reaches the final CTA, the solid amber pill feels earned and unavoidable.

---

## 5. Responsive Behavior

### Breakpoints

Tailwind v4 default breakpoints (matches live site):

| Token | Min width | Target device |
|---|---|---|
| (default) | 0px | Mobile portrait (375px) |
| `sm` | 640px | Mobile landscape / small tablet |
| `md` | 768px | Tablet portrait (iPad) |
| `lg` | 1024px | Tablet landscape / small laptop |
| `xl` | 1280px | Desktop (matches `max-w-7xl` container) |
| `2xl` | 1536px | Large desktop |

### Key Responsive Rules

#### H1 Type Scale (verified at each breakpoint)

| Breakpoint | Class | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| <sm | `text-4xl` | 36px | 820 | 36.72px (1.02) | −1.44px |
| sm | `text-5xl` | 48px | 820 | 48.96px | −1.92px |
| md | `text-6xl` | 60px | 820 | 61.2px | −2.4px |
| lg | `text-[4.5rem]` | 72px | 820 | 73.44px | −2.88px |

Tracking scales proportionally: `tracking-[-0.04em]` on all sizes (Tailwind's `em`-based tracking means it scales with font-size).

#### Section-Specific Responsive Rules

| Section | <sm (mobile) | md (tablet) | lg+ (desktop) |
|---|---|---|---|
| Nav | Hamburger + lang + logo only | All links visible | All links + Sign in + Get Started |
| Hero | Single column, `px-6`, `pt-32` | Same, slightly larger type | Centered `max-w-3xl` |
| Hero input widget | Full width, `p-5` | Full width, `p-5` | `max-w-2xl`, `p-6` |
| Hero style chips | Single row, scrollable horizontally? — no, marquee works at all sizes | Marquee continues | Marquee continues |
| Examples carousel | 1.25 cards visible (peek next) | 2.5 cards visible | 4–5 cards visible |
| 4-step workflow | Single column, media above text | Single column | 2-column alternating |
| Features grid | 1 column | 2 columns | 4 columns |
| Testimonials | 1 column | 2 columns | 3 columns |
| Use cases | 1 column | 1 column | 2 columns (2×2) |
| FAQ | Single column, `px-6` | Single column, `max-w-3xl` | Same |
| Final CTA | `text-3xl` H2, `px-6` | `text-5xl` H2 | `text-7xl` H2 |
| Footer | Stack vertically | Brand + columns side by side, bottom row stack | Full layout |

#### Mobile-Specific Considerations

1. **Hamburger menu** opens a right-side Sheet drawer (shadcn/ui `Sheet` component) containing all nav links + Sign in + Get Started. Close button at top-right.

2. **Examples carousel** on mobile: `overflow-x-auto` with snap scrolling, `snap-x snap-mandatory`. Cards are `w-[260px] snap-start shrink-0`. Hide the desktop arrow buttons (they're redundant with native swipe).

3. **Hero video** on mobile: keep `object-cover` (not `object-contain`) to avoid letterboxing. The video will crop but the cinematic feel is preserved.

4. **4-step workflow videos** on mobile: switch to `object-contain` to avoid cropping critical UI details in the demo footage.

5. **Touch targets:** All interactive elements must be ≥44×44px (WCAG 2.5.5). The ratio toggle buttons (currently 40×23px) need larger hit areas — wrap in a `min-h-[44px] min-w-[44px]` flex container or use `::before` pseudo-element for hit area expansion.

6. **No hover interactions on mobile:** All `hover:` states must have touch-friendly equivalents. Example: feature card's title-slide-right hover effect should also trigger on `:active` or be omitted on touch devices (use `@media (hover: hover)` guard).

7. **Marquee on mobile:** Reduce animation duration from 40s to 30s (chips pass by faster on smaller screens since fewer are visible at once).

#### Tablet-Specific Considerations

1. **Nav:** All links visible at `md` (768px+), but the Get Started button may still be hidden until `lg` — verify against live site (research shows it's visible at 768px).

2. **Features grid:** 2 columns at `md` (vs 4 at `lg`) — keep the same hairline border treatment, just wider cards.

3. **Examples carousel:** ~2.5 cards visible — same arrow controls as desktop.

#### Reduced Motion Preference

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Specifically: stop the marquee, stop the video bg, show all reveal elements */
  .marquee-track { animation: none !important; }
  video[autoplay] { display: none; }
  /* Show poster image instead */
  [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

---

## 6. Technical Implementation Notes

### 6.1 File Structure

```
storyintovideo-clone/
├── app/
│   ├── layout.tsx                 # Root layout: <html>, <body>, font wiring, metadata
│   ├── page.tsx                   # Landing page (composes all sections)
│   ├── globals.css                # Tailwind + CSS variables + keyframes
│   └── icon.tsx                   # Favicon
├── components/
│   ├── ui/                        # shadcn/ui primitives
│   │   ├── accordion.tsx
│   │   ├── sheet.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── button.tsx
│   └── sections/                  # Page sections (one file per section)
│       ├── navbar.tsx
│       ├── hero.tsx
│       ├── examples.tsx
│       ├── workflow.tsx           # 4-step section
│       ├── features.tsx
│       ├── testimonials.tsx
│       ├── use-cases.tsx
│       ├── faq.tsx
│       ├── final-cta.tsx
│       └── footer.tsx
├── lib/
│   ├── fonts.ts                   # next/font loaders (Geist, Geist Mono, Outfit)
│   ├── use-scrolled.ts            # Scroll position hook
│   └── use-reveal.ts              # IntersectionObserver hook
├── public/
│   ├── workflow/                  # 4-step demo videos + posters (self-hosted)
│   │   ├── showcase-step1.mp4
│   │   ├── showcase-step1-poster.webp
│   │   ├── showcase-step2.mp4
│   │   ├── showcase-step2-poster.webp
│   │   ├── showcase-step3.mp4
│   │   ├── showcase-step3-poster.webp
│   │   ├── showcase-step4.mp4
│   │   └── showcase-step4-poster.webp
│   ├── hero-bg.mp4                # Hero background video
│   ├── hero-poster.webp
│   └── examples/                  # Example card thumbnails (6 images)
│       ├── example-1.webp
│       ├── example-2.webp
│       └── ...
├── tailwind.config.ts             # Tailwind v4 config (theme.extend)
├── next.config.ts                 # Next.js 16 config
├── tsconfig.json                  # TypeScript strict mode
├── package.json
└── README.md
```

### 6.2 External Dependencies

**Production dependencies:**

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "lucide-react": "^0.460.0",
    "geist": "^1.3.0"
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.0.0"
  }
}
```

**Why these specific libraries:**
- **`geist`** npm package provides the Geist Sans + Geist Mono variable fonts via `next/font` integration — exactly matches the live site's font stack.
- **`@radix-ui/*`** primitives power the shadcn/ui components (Accordion, Sheet, DropdownMenu) — same primitives the live site uses (verified by the `data-[state=...]` class patterns).
- **`lucide-react`** provides the icon set — stroke-1.5, 24×24, `currentColor` matches the live site's icon style.
- **`class-variance-authority` + `clsx` + `tailwind-merge`** — the standard shadcn/ui utility stack for conditional class composition.

**No CDN dependencies.** All fonts are self-hosted via `next/font`. All icons are bundled via `lucide-react`. No Google Fonts `<link>` tags, no Bootstrap, no jQuery.

### 6.3 JavaScript Requirements

**Client components (require `'use client'`):**
- `Navbar` (scroll-aware bg, mobile Sheet state)
- `Hero` (textarea state, chip click, aspect ratio toggle)
- `Examples` (carousel scroll position, arrow click handlers)
- `Faq` (Radix Accordion requires client)
- `StyleMarquee` (CSS-only, but may need client for hover-pause if not pure CSS)

**Server components (default):**
- `Workflow` (4-step section — pure HTML/CSS, no interactivity)
- `Features` (pure grid, hover effects via CSS only)
- `Testimonials` (pure grid)
- `UseCases` (pure grid)
- `FinalCta` (static content)
- `Footer` (static content)

**Custom hooks:**

```tsx
// lib/use-scrolled.ts
'use client';
import { useEffect, useState } from 'react';
export function useScrolled(threshold = 10): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}
```

```tsx
// lib/use-reveal.ts
'use client';
import { useEffect, useRef, useState } from 'react';
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, revealed };
}
```

### 6.4 Accessibility Requirements (WCAG 2.1 AA, target AAA where feasible)

**Color contrast:**
- Body text `text-zinc-300` (#d4d4d8) on `bg-zinc-950` (#09090b): contrast ratio 12.6:1 — passes AAA.
- Muted text `text-zinc-400` on `bg-zinc-950`: 8.9:1 — passes AAA.
- Primary CTA `text-zinc-950` (#09090b) on `bg-amber-400` (#fbbf24): 11.4:1 — passes AAA.
- Nav link `text-white/60` on `bg-zinc-950/70`: 7.4:1 — passes AAA.
- Style chip `text-white/50` on dark bg: 5.9:1 — passes AA only (borderline). Consider bumping to `text-white/60` for AAA.

**Keyboard navigation:**
- All interactive elements must have visible focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400`.
- Tab order: Nav → Hero textarea → chips → ratio toggle → CTA → Examples arrows → ... → FAQ triggers → Final CTA → Footer links.
- Skip-to-content link at the very top: `<a href="#main" class="sr-only focus:not-sr-only ...">Skip to content</a>`.
- FAQ accordion: Arrow Up/Down to navigate between items, Enter/Space to toggle (Radix provides this).
- Mobile nav Sheet: Escape to close, focus trap inside the drawer (Radix Dialog provides this).

**Screen reader semantics:**
- Hero `<video>`: `aria-hidden="true"` (decorative, no audio).
- All `<button>` and `<a>` elements: descriptive `aria-label` where text isn't self-explanatory (e.g., hamburger: `aria-label="Open menu"`, carousel arrows: `aria-label="Previous example"` / `aria-label="Next example"`).
- FAQ: Radix Accordion provides `aria-expanded`, `aria-controls`, `role="region"` automatically.
- Form inputs: associate `<label>` with `<textarea>` via `htmlFor`/`id`.
- Status changes (chip selection, ratio toggle): use `aria-pressed` on toggle buttons.

**Motion preferences:**
- Honor `prefers-reduced-motion: reduce` (see § 3.8 for implementation).
- Provide static poster images for all videos.
- Disable marquee animation.

**Touch targets:**
- Minimum 44×44px for all interactive elements on mobile (WCAG 2.5.5).
- Ratio toggle buttons (currently 40×23px visual): expand hit area to 44×44px via padding or `::before` pseudo-element without changing visual size.

### 6.5 Performance Targets

| Metric | Target | Strategy |
|---|---|---|
| **LCP** (Largest Contentful Paint) | < 2.0s | Hero poster image (WebP, < 50KB) loads immediately; video lazy-loads via `preload="metadata"`. |
| **CLS** (Cumulative Layout Shift) | < 0.05 | All media uses explicit `width`/`height` or `aspect-ratio` CSS. Fonts use `font-display: swap` with size-adjusted fallbacks (next/font handles this). |
| **INP** (Interaction to Next Paint) | < 200ms | Minimal JS — only 5 client components, all using `useEffect` cleanly. No animation libraries. |
| **TBT** (Total Blocking Time) | < 200ms | Server components for all static sections. Hydration only on interactive components. |
| **Lighthouse Performance** | ≥ 95 | Self-hosted fonts, no CDN, optimized images (WebP), lazy video loading. |
| **Lighthouse Accessibility** | ≥ 95 | WCAG AA+ compliance, semantic HTML, ARIA where needed. |
| **Lighthouse Best Practices** | ≥ 95 | HTTPS, no console errors, no deprecated APIs. |
| **Lighthouse SEO** | ≥ 95 | Meta tags, Open Graph, structured data (JSON-LD for Organization + SoftwareApplication). |
| **Bundle size (JS)** | < 100KB gzipped | Minimal dependencies. shadcn/ui components are tree-shaken (only what's used ships). |
| **Bundle size (CSS)** | < 30KB gzipped | Tailwind v4 with purge — only used utility classes ship. |
| **Image weight** | < 500KB total (above the fold) | WebP format, responsive `srcset`, lazy-load below-fold images. |
| **Video weight** | < 2MB per video | Hero bg + 4 step videos, each ~1–2MB. Use `preload="metadata"`. |

**Next.js-specific optimizations:**
- `next/image` for all raster images (automatic WebP, responsive srcset, lazy loading).
- `next/font` for all fonts (self-hosted, no FOIT, automatic fallback generation).
- `next/script` for any third-party scripts (none currently required).
- Static generation (`export const dynamic = 'force-static'` on the page) — no server-side data fetching needed.

---

## 7. Logo Design Specification

### 7.1 Wordmark

The live site uses a **typographic wordmark** — no logomark icon. The word "StoryIntoVideo" is set in `font-heading` (Outfit) at `text-base font-medium` (16px / 500) in `text-white`.

**Clone implementation:**
```tsx
<a href="/" class="font-heading text-base font-medium text-white tracking-tight">
  StoryIntoVideo
</a>
```

**Optional enhancement (not on live site, but consistent with brand):** Color the "Story" portion white and "IntoVideo" in `text-amber-400` to subtly reinforce the brand's accent color:
```tsx
<a href="/" class="font-heading text-base font-medium tracking-tight">
  <span class="text-white">Story</span>
  <span class="text-amber-400">IntoVideo</span>
</a>
```

### 7.2 Favicon

Generate a 32×32 favicon that captures the brand identity:
- Background: `#020202` (near-black, matches body bg).
- Foreground: amber-400 `#febf00` — a stylized "S" or a film-frame icon (24×24px centered).
- Use `app/icon.tsx` for Next.js 16 dynamic favicon generation.

### 7.3 Open Graph Image

1200×630px OG image:
- Background: `bg-zinc-950` with the radial amber glow (same as hero).
- Centered text: "Turn Story Into Video with AI Magic" in Outfit 820, white.
- Subtitle: "AI-Powered Story Into Video" in amber-400, 11px, uppercase, tracking-widest.
- Save to `/public/og-image.png`.

---

## 8. Tailwind Configuration

### 8.1 `tailwind.config.ts` (complete, copy-pasteable)

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui semantic tokens (match :root CSS variables)
        background: '#020202',
        foreground: '#f8f8f8',
        card: {
          DEFAULT: '#060607',
          foreground: '#f8f8f8',
        },
        popover: {
          DEFAULT: '#0b0b0d',
          foreground: '#f8f8f8',
        },
        primary: {
          DEFAULT: '#febf00',
          foreground: '#020202',
        },
        secondary: {
          DEFAULT: '#111114',
          foreground: '#f8f8f8',
        },
        muted: {
          DEFAULT: '#1a1a1d',
          foreground: '#8e8e95',
        },
        accent: {
          DEFAULT: '#febf00',
          foreground: '#020202',
        },
        destructive: {
          DEFAULT: '#ff2d39',
          foreground: '#f8f8f8',
        },
        border: '#1a1a1d',
        input: '#0b0b0d',
        ring: '#febf0080',
        // Charts (for future dashboard use)
        chart: {
          1: '#febf00',
          2: '#00aa6f',
          3: '#8d92f9',
          4: '#f14d4c',
          5: '#7bc27e',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        heading: ['var(--font-outfit)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        // Entrance
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Ambient
        'float': {
          '0%, 100%': { transform: 'translateY(0) rotate(var(--card-rotate, 0deg))' },
          '50%': { transform: 'translateY(-12px) rotate(var(--card-rotate, 0deg))' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(251, 191, 36, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(251, 191, 36, 0.5)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(245, 184, 0, 0.08)' },
          '50%': { borderColor: 'rgba(245, 184, 0, 0.2)' },
        },
        'composite-pulse-text': {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '1' },
        },
        // Shimmer
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'btn-shimmer': {
          '0%': { transform: 'translate(-100%)' },
          '100%': { transform: 'translate(100%)' },
        },
        // Grid
        'grid-shimmer': {
          '0%': { transform: 'translate(-20%, -30%)' },
          '50%': { transform: 'translate(70%, 40%)' },
          '100%': { transform: 'translate(-20%, -30%)' },
        },
        'grid-sweep-h': {
          '0%': { transform: 'translate(-600px)' },
          '100%': { transform: 'translate(calc(600px + 100vw))' },
        },
        'grid-sweep-v': {
          '0%': { transform: 'translateY(-500px)' },
          '100%': { transform: 'translateY(calc(500px + 100vh))' },
        },
        'scanline-scroll': {
          '0%': { backgroundPositionX: '0' },
          '100%': { backgroundPositionX: '30px' },
        },
        // Dropdown
        'lang-dropdown-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        // Marquee (custom — not on live site's keyframe list, but required)
        'marquee-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out both',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'border-glow': 'border-glow 4s ease-in-out infinite',
        'composite-pulse-text': 'composite-pulse-text 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'btn-shimmer': 'btn-shimmer 1.5s ease-in-out infinite',
        'grid-shimmer': 'grid-shimmer 8s ease-in-out infinite',
        'grid-sweep-h': 'grid-sweep-h 8s linear infinite',
        'grid-sweep-v': 'grid-sweep-v 10s linear infinite',
        'scanline-scroll': 'scanline-scroll 1s linear infinite',
        'lang-dropdown-in': 'lang-dropdown-in 0.15s ease-out',
        'marquee-scroll': 'marquee-scroll 40s linear infinite',
      },
      boxShadow: {
        'hero-input': '0 20px 80px rgba(0, 0, 0, 0.6)',
        'eyebrow-glow': '0 0 30px rgba(234, 179, 8, 0.1)',
        'cta-glow': '0 0 40px rgba(251, 191, 36, 0.3)',
      },
      backgroundImage: {
        'dot-grid': 'radial-gradient(circle, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
        'amber-halo': 'radial-gradient(rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.03) 40%, transparent 70%)',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 8.2 Tailwind v4 Notes

Tailwind v4 uses CSS-first configuration. The above `tailwind.config.ts` is still supported for backward compatibility, but the recommended approach is to define theme tokens in `globals.css` via `@theme`:

```css
@import 'tailwindcss';

@theme {
  --color-background: #020202;
  --color-foreground: #f8f8f8;
  --color-card: #060607;
  --color-card-foreground: #f8f8f8;
  /* ... etc for all tokens ... */

  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --font-heading: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;

  --animate-fade-in-up: fade-in-up 0.6s ease-out both;
  --animate-marquee-scroll: marquee-scroll 40s linear infinite;
  /* ... etc ... */
}
```

Either approach works — pick one and be consistent. The `tailwind.config.ts` approach is more familiar; the `@theme` approach is the future direction.

---

## 9. globals.css (complete, drop-in)

Save as `app/globals.css`. This file wires up Tailwind v4, defines the `:root` CSS variables (matching the live site's `:root` block verbatim), defines all keyframes, and provides custom utility classes for the marquee mask, scrollbar hiding, and shadcn/ui overrides.

```css
@import 'tailwindcss';

/* ============================================================
   :root — CSS variables (verified verbatim from live site)
   ============================================================ */
:root {
  --radius: 0.75rem;

  --background: #020202;
  --foreground: #f8f8f8;

  --card: #060607;
  --card-foreground: #f8f8f8;

  --popover: #0b0b0d;
  --popover-foreground: #f8f8f8;

  --primary: #febf00;
  --primary-foreground: #020202;

  --secondary: #111114;
  --secondary-foreground: #f8f8f8;

  --muted: #1a1a1d;
  --muted-foreground: #8e8e95;

  --accent: #febf00;
  --accent-foreground: #020202;

  --destructive: #ff2d39;
  --destructive-foreground: #f8f8f8;

  --border: #1a1a1d;
  --input: #0b0b0d;
  --ring: #febf0080;

  /* Chart palette (for future use) */
  --chart-1: #febf00;
  --chart-2: #00aa6f;
  --chart-3: #8d92f9;
  --chart-4: #f14d4c;
  --chart-5: #7bc27e;

  /* Sidebar tokens (for future dashboard use) */
  --sidebar: #060607;
  --sidebar-foreground: #f8f8f8;
  --sidebar-primary: #febf00;
  --sidebar-primary-foreground: #020202;
  --sidebar-accent: #111114;
  --sidebar-accent-foreground: #f8f8f8;
  --sidebar-border: #1a1a1d;
  --sidebar-ring: #febf0080;
}

/* ============================================================
   Base layer
   ============================================================ */
@layer base {
  * {
    border-color: var(--border);
  }

  html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }

  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;
  }

  /* Selection color */
  ::selection {
    background-color: rgba(251, 191, 36, 0.3);
    color: #fff;
  }

  /* Custom scrollbar (webkit) */
  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  ::-webkit-scrollbar-track {
    background: #020202;
  }
  ::-webkit-scrollbar-thumb {
    background: #1a1a1d;
    border-radius: 5px;
    border: 2px solid #020202;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #2a2a2d;
  }

  /* Focus ring (global default) */
  :focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
}

/* ============================================================
   Components layer — reusable composite utilities
   ============================================================ */
@layer components {
  /* Eyebrow badge — used in every section header */
  .eyebrow {
    @apply inline-flex items-center gap-2 px-4 py-1.5 rounded-full
           bg-amber-400/10 border border-amber-400/25 backdrop-blur-sm
           text-[11px] font-semibold text-amber-400 tracking-widest uppercase;
    box-shadow: 0 0 30px rgba(234, 179, 8, 0.1);
  }

  /* Section heading (H2) — used in all section headers */
  .section-heading {
    @apply font-heading font-bold tracking-tight text-white;
    font-size: clamp(2rem, 5vw, 3rem);
    line-height: 1.1;
  }

  /* Ghost CTA link with animated arrow */
  .cta-ghost {
    @apply inline-flex items-center gap-2 text-amber-400 hover:text-amber-300
           font-medium text-sm transition-colors duration-200 group;
  }
  .cta-ghost svg {
    @apply transition-transform duration-200;
  }
  .cta-ghost:hover svg {
    @apply translate-x-1;
  }

  /* Primary amber pill button */
  .cta-amber {
    @apply inline-flex items-center justify-center gap-2.5
           px-8 py-3.5 bg-amber-400 hover:bg-amber-300
           text-zinc-950 font-bold text-[15px] rounded-full
           transition-all duration-200
           hover:shadow-lg hover:shadow-amber-400/20 hover:scale-[1.02];
  }

  /* Glass card (hero input widget) */
  .glass-input {
    @apply relative rounded-2xl bg-zinc-950/60 backdrop-blur-xl
           p-5 sm:p-6 border border-white/[0.08]
           hover:border-white/[0.12]
           transition-all duration-500;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.6);
  }
  .glass-input:focus-within {
    border-color: rgba(251, 191, 36, 0.3);
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.6), 0 0 30px rgba(251, 191, 36, 0.1);
  }
}

/* ============================================================
   Utilities layer — single-purpose helpers
   ============================================================ */
@layer utilities {
  /* Hide scrollbar (for carousels) */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Marquee edge mask */
  .marquee-mask {
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      black 8%,
      black 92%,
      transparent
    );
    mask-image: linear-gradient(
      to right,
      transparent,
      black 8%,
      black 92%,
      transparent
    );
  }

  /* Marquee track (CSS-only infinite scroll) */
  .marquee-track {
    display: flex;
    gap: 0.5rem;
    width: max-content;
    animation: marquee-scroll 40s linear infinite;
  }
  .marquee-track:hover {
    animation-play-state: paused;
  }
  @media (max-width: 640px) {
    .marquee-track {
      animation-duration: 30s;
    }
  }

  /* Text gradient (for special headline accents, if needed) */
  .text-gradient-gold {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}

/* ============================================================
   Keyframes (all 12 from live site + marquee-scroll)
   ============================================================ */

/* Entrance */
@keyframes fade-in-up {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Ambient */
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(var(--card-rotate, 0deg)); }
  50%      { transform: translateY(-12px) rotate(var(--card-rotate, 0deg)); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
  50%      { box-shadow: 0 0 40px rgba(251, 191, 36, 0.5); }
}

@keyframes border-glow {
  0%, 100% { border-color: rgba(245, 184, 0, 0.08); }
  50%      { border-color: rgba(245, 184, 0, 0.2); }
}

@keyframes compositePulseText {
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 1; }
}

/* Shimmer */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes btn-shimmer {
  0%   { transform: translate(-100%); }
  100% { transform: translate(100%); }
}

/* Grid */
@keyframes gridShimmer {
  0%   { transform: translate(-20%, -30%); }
  50%  { transform: translate(70%, 40%); }
  100% { transform: translate(-20%, -30%); }
}

@keyframes gridSweepH {
  0%   { transform: translate(-600px); }
  100% { transform: translate(calc(600px + 100vw)); }
}

@keyframes gridSweepV {
  0%   { transform: translateY(-500px); }
  100% { transform: translateY(calc(500px + 100vh)); }
}

@keyframes scanlineScroll {
  0%   { background-position-x: 0; }
  100% { background-position-x: 30px; }
}

/* Dropdown */
@keyframes lang-dropdown-in {
  0%   { opacity: 0; transform: translateY(-4px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* Marquee (custom — required for style chips ticker) */
@keyframes marquee-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* ============================================================
   Reduced motion preference
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .marquee-track {
    animation: none !important;
  }

  video[autoplay] {
    display: none;
  }

  [data-reveal] {
    opacity: 1 !important;
    transform: none !important;
  }
}

/* ============================================================
   Print styles (graceful degradation)
   ============================================================ */
@media print {
  body {
    background: #fff !important;
    color: #000 !important;
  }
  video,
  .marquee-track,
  [data-reveal] {
    display: none !important;
  }
}
```

---

## 10. Asset Manifest

### 10.1 Self-Hosted Video Assets (download from R2 and serve locally)

| Asset | Source URL | Local Path | Format | Est. Size | Notes |
|---|---|---|---|---|---|
| Hero background video | (not directly verifiable — use a cinematic dark footage clip) | `/public/hero-bg.mp4` | MP4 (H.264) | 1–2MB | Autoplay, muted, loop, 10–20s duration, 1920×1080 |
| Hero poster | (generate from first frame of hero video) | `/public/hero-poster.webp` | WebP | < 50KB | 1920×1080 |
| Step 1 demo video | `https://r2.storyintovideo.com/landing/workflow/showcase-step1.mp4` | `/public/workflow/showcase-step1.mp4` | MP4 | ~1.5MB | Autoplay, muted, loop |
| Step 1 poster | `https://r2.storyintovideo.com/landing/workflow/showcase-step1-poster.webp` | `/public/workflow/showcase-step1-poster.webp` | WebP | < 80KB | 4:3 aspect |
| Step 2 demo video | `https://r2.storyintovideo.com/landing/workflow/showcase-step2.mp4` | `/public/workflow/showcase-step2.mp4` | MP4 | ~1.5MB | Autoplay, muted, loop |
| Step 2 poster | `https://r2.storyintovideo.com/landing/workflow/showcase-step2-poster.webp` | `/public/workflow/showcase-step2-poster.webp` | WebP | < 80KB | 4:3 aspect |
| Step 3 demo video | (live site uses static images — clone may use either) | `/public/workflow/showcase-step3.mp4` | MP4 | ~1.5MB | Optional — can substitute a static WebP |
| Step 3 poster | `https://r2.storyintovideo.com/landing/workflow/showcase-step3-poster.webp` | `/public/workflow/showcase-step3-poster.webp` | WebP | < 80KB | 4:3 aspect |
| Step 4 demo video | `https://r2.storyintovideo.com/landing/workflow/showcase-step4.mp4` | `/public/workflow/showcase-step4.mp4` | MP4 | ~1.5MB | Autoplay, muted, loop |
| Step 4 poster | `https://r2.storyintovideo.com/landing/workflow/showcase-step4-poster.webp` | `/public/workflow/showcase-step4-poster.webp` | WebP | < 80KB | 4:3 aspect |

**Download script:**
```bash
#!/bin/bash
# scripts/download-assets.sh
mkdir -p public/workflow
cd public/workflow
for i in 1 2 3 4; do
  curl -L -o showcase-step${i}.mp4 \
    https://r2.storyintovideo.com/landing/workflow/showcase-step${i}.mp4
  curl -L -o showcase-step${i}-poster.webp \
    https://r2.storyintovideo.com/landing/workflow/showcase-step${i}-poster.webp
done
```

### 10.2 Example Card Thumbnails (6 images, 9:16 portrait)

| Asset | Local Path | Dimensions | Format | Est. Size |
|---|---|---|---|---|
| Example 1 ("Confession in the Blue Flower Sea") | `/public/examples/example-1.webp` | 520×924 (2× of 260×462 for retina) | WebP | < 100KB |
| Example 2 ("The Last Signal") | `/public/examples/example-2.webp` | 520×924 | WebP | < 100KB |
| Example 3 ("Murder at Hightower Manor") | `/public/examples/example-3.webp` | 520×924 | WebP | < 100KB |
| Example 4 ("Beyond the Veil") | `/public/examples/example-4.webp` | 520×924 | WebP | < 100KB |
| Example 5 ("Tokyo Rain") | `/public/examples/example-5.webp` | 520×924 | WebP | < 100KB |
| Example 6 ("The Grand Tournament") | `/public/examples/example-6.webp` | 520×924 | WebP | < 100KB |

**Source:** Generate with `image-generation` skill or source from stock (Unsplash, Pexels) — must match each card's title and style tag.

### 10.3 Font Assets (auto-managed by next/font)

| Font | Source | Local Path (build output) | Weights | Format |
|---|---|---|---|---|
| Geist Sans (variable) | `geist` npm package via `next/font` | `/_next/media/Geist_Variable.woff2` | 100–900 | woff2 |
| Geist Mono (variable) | `geist` npm package via `next/font` | `/_next/media/GeistMono_Variable.woff2` | 100–900 | woff2 |
| Outfit | `next/font/google` (subsetted) | `/_next/media/*.woff2` | 500, 600, 700, 820 | woff2 |

**Font loader config (`lib/fonts.ts`):**
```ts
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Outfit } from 'next/font/google';

export const fonts = {
  sans: GeistSans,
  mono: GeistMono,
  heading: Outfit({
    subsets: ['latin'],
    weight: ['500', '600', '700'],
    variable: '--font-outfit',
    display: 'swap',
  }),
};

// In app/layout.tsx <html> tag:
// <html className={`${fonts.sans.variable} ${fonts.mono.variable} ${fonts.heading.variable}`}>
```

**Note on Outfit weight 820:** Outfit's variable font range is 100–900, but Google Fonts only serves discrete weights via `next/font/google`. Weight 820 is not directly available — either:
- (a) Use weight 800 (`font-extrabold`) and accept the 20-unit difference, or
- (b) Self-host the Outfit variable font via `next/font/local` to access weight 820 precisely.

Option (b) is recommended for pixel-perfect parity.

### 10.4 Icon Set (lucide-react, bundled)

All icons imported from `lucide-react` on-demand (tree-shaken). Approximate set:

| Section | Icons used |
|---|---|
| Nav | `Menu` (hamburger), `X` (close), `ChevronDown` (lang switcher), `Globe` |
| Hero | `ArrowRight` (CTA), `Sparkles` (eyebrow) |
| Examples | `ChevronLeft`, `ChevronRight` (arrows), `Play` (optional) |
| Workflow | `ArrowRight` (CTAs), `FileText`, `Users`, `Film`, `Video` (step icons) |
| Features | `FileText`, `Users`, `Mic`, `Sparkles`, `Film`, `Captions`, `Download`, `Plus` |
| Use Cases | `BookOpen`, `Video`, `Clapperboard`, `GraduationCap` |
| FAQ | `Plus` (rotates to ×) |
| Final CTA | `ArrowRight` |
| Footer | `Mail` (email link) |

### 10.5 Total Asset Budget

| Category | Count | Total size (estimated) |
|---|---|---|
| Videos (5 files: hero + 4 steps) | 5 | ~8MB |
| Posters (5 WebP) | 5 | ~400KB |
| Example thumbnails (6 WebP) | 6 | ~600KB |
| Fonts (3 woff2) | 3 | ~120KB |
| Icons (lucide-react bundle) | ~20 | ~15KB (tree-shaken) |
| **Total** | **~39 assets** | **~9.2MB** |

Above-the-fold budget (hero + nav): ~2.2MB (hero video metadata + poster + critical CSS + JS).

---

## 11. Component API Contracts

TypeScript interfaces for each component. All components are typed strictly — no `any`, prefer `interface` over `type`.

### 11.1 Navbar

```tsx
interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  links?: NavLink[];
  ctaHref?: string;
  className?: string;
}

// Default props:
const DEFAULT_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];
```

### 11.2 Hero

```tsx
interface StoryExample {
  label: string;
  seed: string;  // The text that populates the textarea when clicked
}

interface AspectRatio {
  label: '9:16' | '16:9';
  value: 'portrait' | 'landscape';
}

interface HeroProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  storyExamples?: StoryExample[];
  aspectRatios?: AspectRatio[];
  videoSrc?: string;
  videoPoster?: string;
  className?: string;
}

// Default storyExamples:
const DEFAULT_EXAMPLES: StoryExample[] = [
  { label: 'Time travel', seed: 'A historian discovers a pocket watch that...' },
  { label: 'Space odyssey', seed: 'The colony ship Aurora drifts past Neptune as...' },
  { label: 'Rival chefs', seed: 'In the Michelin-starred kitchen of Maison Lumière...' },
  { label: 'Victorian mystery', seed: 'The fog rolled in over Whitechapel as Lady Ashford...' },
];
```

### 11.3 Examples (carousel)

```tsx
interface ExampleCard {
  id: string;
  title: string;
  styleTag: string;  // e.g., "Anime · Romance"
  thumbnail: string;  // /public/examples/example-N.webp
  href: string;
}

interface ExamplesProps {
  cards?: ExampleCard[];
  className?: string;
}

// Default cards: 6 items per § 2.3 table
```

### 11.4 Workflow (4-step)

```tsx
interface WorkflowStep {
  number: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  videoSrc: string;
  videoPoster: string;
  mediaPosition: 'left' | 'right';  // lg:order-1 = left, lg:order-2 = right
}

interface WorkflowProps {
  steps?: WorkflowStep[];
  className?: string;
}

// Default steps: 4 items per § 2.4 table
```

### 11.5 Features

```tsx
import type { LucideIcon } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface FeaturesProps {
  features?: Feature[];
  className?: string;
}

// Default features: 8 items per § 2.5 table
```

### 11.6 Testimonials

```tsx
interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  initials: string;  // e.g., "SK" for Sarah K.
}

interface TestimonialsProps {
  testimonials?: Testimonial[];
  className?: string;
}

// Default testimonials: 6 items per § 2.6 table
```

### 11.7 UseCases

```tsx
import type { LucideIcon } from 'lucide-react';

interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

interface UseCasesProps {
  useCases?: UseCase[];
  className?: string;
}

// Default useCases: 4 items per § 2.7 table
```

### 11.8 FAQ

```tsx
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQProps {
  items?: FAQItem[];
  defaultOpenId?: string;
  className?: string;
}

// Default items: 6 items per § 2.8 table
```

### 11.9 FinalCTA

```tsx
interface FinalCTAProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  footnote?: string;
  className?: string;
}

// Defaults:
// title: "Your Story Deserves to Be Seen"
// subtitle: "Join thousands of creators turning their stories into cinematic videos..."
// ctaLabel: "Start Creating — It's Free"
// ctaHref: "/auth/sign-up"
// footnote: "No credit card required · Free forever plan"
```

### 11.10 Footer

```tsx
interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  brandName?: string;
  tagline?: string;
  supportEmail?: string;
  columns?: FooterColumn[];
  copyrightYear?: number;
  className?: string;
}

// Default columns: 3 columns per § 2.10 table
```

### 11.11 Reusable primitives

```tsx
// components/ui/eyebrow.tsx
interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

// components/ui/section-heading.tsx
interface SectionHeadingProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

// components/ui/cta-ghost.tsx
interface CtaGhostProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

// components/ui/cta-amber.tsx
interface CtaAmberProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  onClick?: () => void;
}

// components/ui/style-chip.tsx
interface StyleChipProps {
  label: string;
  sublabel?: string;  // for "Cyberpunk Futuristic neon"
  active?: boolean;
  onClick?: () => void;
  className?: string;
}
```

---

## 12. Content Inventory

### 12.1 Copy Deck (all verified copy from the live site)

#### Navigation
- Logo: "StoryIntoVideo"
- Links: Features · Pricing · Blog · Contact
- Right cluster: "EN" (lang switcher) · "Sign in" · "Get Started"

#### Hero
- Eyebrow: "AI-Powered Story Into Video"
- H1: "Turn Story Into Video with AI Magic"
- Subtitle: "Paste your story and AI handles the rest — characters, storyboards, voiceover, and subtitles, all generated in minutes."
- Textarea placeholder: "Paste your story here, or write a short idea..."
- Story example chips: "Time travel" · "Space odyssey" · "Rival chefs" · "Victorian mystery"
- Ratio toggles: "9:16" (active) · "16:9"
- CTA: "Start Creating"
- Style chips marquee: "Ghibli" · "Oil Painting" · "Anime" · "Realistic" · "Cyberpunk Futuristic neon" · "Watercolor" · "Comic"

#### Examples Section
- Eyebrow: "REAL EXAMPLES" (inferred — pattern matches other sections)
- H2: "Real Story Into Video Examples"
- CTA: "Clone this project for free"
- Card titles: see § 2.3 table

#### Workflow Section
- Eyebrow: "HOW IT WORKS" (inferred)
- H2: "From Story to Video in 4 Steps"
- Step content: see § 2.4 table

#### Features Section
- Eyebrow: "FEATURES" (inferred)
- H2: "Creating AI Videos Has Never Been So Easy"
- CTA: "Start Creating Your Video"
- Feature items: see § 2.5 table

#### Testimonials Section
- Eyebrow: "TESTIMONIALS" (inferred)
- H2: "Loved by Creators"
- Subtitle: "Hear from creators who use StoryIntoVideo to turn their stories into videos every day."
- CTA: "Join Creators — Start Free"
- Testimonials: see § 2.6 table

#### Use Cases Section
- Eyebrow: "USE CASES" (inferred)
- H2: "Built for Storytellers"
- Use cases: see § 2.7 table

#### FAQ Section
- Eyebrow: "FAQ" (inferred)
- H2: "Frequently Asked Questions"
- Items: see § 2.8 table

#### Final CTA Section
- H2: "Your Story Deserves to Be Seen"
- Subtitle: "Join thousands of creators turning their stories into cinematic videos with AI. No editing skills required — just paste your story and watch it come alive."
- CTA: "Start Creating — It's Free"
- Footnote: "No credit card required · Free forever plan"

#### Footer
- Brand: "StoryIntoVideo"
- Tagline: "Turn any story into a cinematic video with AI."
- Support email: "support@storyintovideo.com"
- Link columns: see § 2.10 table
- Copyright: "© 2026 StoryIntoVideo. All rights reserved."
- Legal links: Privacy Policy · Terms of Service · All AI Tools

### 12.2 SEO Metadata

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://storyintovideo-clone.example.com'),
  title: 'StoryIntoVideo - Turn Stories Into Videos with AI',
  description: 'Paste your story and AI handles the rest — characters, storyboards, voiceover, and subtitles, all generated in minutes. AI-powered story-into-video generation.',
  keywords: ['story into video', 'AI video generation', 'storyboard AI', 'AI voiceover', 'story video maker'],
  authors: [{ name: 'StoryIntoVideo' }],
  openGraph: {
    title: 'StoryIntoVideo - Turn Stories Into Videos with AI',
    description: 'Paste your story and AI handles the rest — characters, storyboards, voiceover, and subtitles.',
    url: 'https://storyintovideo-clone.example.com',
    siteName: 'StoryIntoVideo',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StoryIntoVideo - Turn Stories Into Videos with AI',
    description: 'Paste your story and AI handles the rest.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

// JSON-LD structured data (in app/layout.tsx <script type="application/ld+json">)
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'StoryIntoVideo',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description: 'AI-powered story-into-video generation tool.',
};
```

### 12.3 Placeholder Text for Story Seeds

When a user clicks a story example chip in the hero, the textarea populates with a multi-paragraph seed. Suggested seeds (300–500 chars each, in the style of the chip label):

```ts
const STORY_SEEDS: Record<string, string> = {
  'Time travel': `Dr. Elena Voss pressed her palm against the cold brass of the chronograph. The year was 1923, but the device in her hands pulsed with a future that hadn't happened yet. Outside her laboratory window, horse-drawn carriages clattered past — but in exactly forty-seven seconds, they would be replaced by something else entirely. She had one chance to set things right. One chance before the timeline collapsed.`,
  
  'Space odyssey': `The colony ship Aurora drifted past Neptune, its hull groaning against the absolute cold of deep space. Captain Reyes stared at the navigation console — they were three hundred years from Earth, and the signal they'd just received was human. It shouldn't exist. The last transmission from Sol system had been two centuries ago, before the silence. "Play it again," she said. The bridge went quiet as the voice of a dead woman filled the room.`,
  
  'Rival chefs': `In the Michelin-starred kitchen of Maison Lumière, Chef Adrien Laurent was plating the most important dish of his career. Across the pass, his former apprentice Sofia Reyes mirrored his movements with terrifying precision. Tonight was not about cooking. Tonight was about proving which of them had been right all those years ago, when the fire had taken everything. The judges would taste both dishes blind. Only one would walk out with the restaurant.`,
  
  'Victorian mystery': `The fog rolled in over Whitechapel as Lady Ashford stepped from her carriage. Number 13 Bleecker Street was supposed to be empty — had been empty for six years, ever since the incident. And yet, candlelight flickered in the upstairs window. She tightened her grip on the silver-handled cane her late husband had given her and climbed the steps. The door was already unlocked. Inside, the smell of laudanum and old paper. And a voice she had not heard in six years said: "You're late, Margaret."`,
};
```

---

## 13. Quality Assurance Checklist

### 13.1 Pre-Delivery Visual Verification

Before considering the clone complete, verify each of the following against the live site (open `https://storyintovideo.com/` and the clone side-by-side at 1440×900):

**Global:**
- [ ] Body background is `#020202` (not pure black `#000000`).
- [ ] Body font is Geist Sans (not system-ui, not Inter).
- [ ] All H1/H2 headings render in Outfit (not Geist Sans).
- [ ] H1 weight is 820 (not 800) on desktop.
- [ ] H1 letter-spacing is −2.88px on desktop (−0.04em).
- [ ] Amber accent is `#febf00` (not Tailwind's default amber-400 `#fbbf24` — close but distinct).
- [ ] Custom scrollbar appears (dark track, subtle thumb).

**Navigation:**
- [ ] Nav is transparent at scrollY=0.
- [ ] Nav bg transitions to `bg-zinc-950/70 backdrop-blur-[24px] border-b border-white/10` on scroll.
- [ ] Mobile (<640px): hamburger appears, nav links hidden.
- [ ] Mobile hamburger opens right-side Sheet drawer with all links.
- [ ] All nav links have visible focus rings on keyboard nav.

**Hero:**
- [ ] Background video autoplays (muted, loop, playsinline).
- [ ] Three-layer overlay stack: video → vertical scrim → radial amber glow.
- [ ] Eyebrow badge has amber glow shadow (`0 0 30px rgba(234,179,8,0.1)`).
- [ ] H1 line breaks after "Video" on desktop (sm+).
- [ ] Story input widget is glass (`backdrop-blur-xl`, `bg-zinc-950/60`).
- [ ] Textarea focus triggers amber border glow on parent.
- [ ] Style chips marquee scrolls infinitely, pauses on hover.
- [ ] Marquee edges are masked (fade to transparent).

**Examples:**
- [ ] Cards are 260×462px portrait.
- [ ] Hover reveals yellow→purple gradient glow behind card.
- [ ] Card image scales 1.05 on hover (500ms).
- [ ] Carousel arrows are 32×32px circles with zinc border.
- [ ] "Clone this project for free" CTA is gradient amber pill.

**Workflow:**
- [ ] 4 steps alternate media left/right on desktop.
- [ ] Each step has a looping MP4 demo (autoplay, muted, loop).
- [ ] Step counter uses GeistMono ("01", "02", "03", "04").
- [ ] Step CTA links have arrow that translates right on hover.
- [ ] Mobile: all steps stack single-column, media above text.

**Features:**
- [ ] 8 features in 4×2 grid (desktop) with continuous hairline borders.
- [ ] Left accent bar: neutral-800 → amber-400 on hover (300ms).
- [ ] Title slides 8px right on hover (300ms).
- [ ] Bottom gradient sheen appears on hover.
- [ ] Rightmost column has no right border; bottom row has no bottom border.

**Testimonials:**
- [ ] 6 cards in 3×2 grid.
- [ ] Each card has quote, avatar (initials in amber gradient circle), name, role.
- [ ] Border lightens on hover (zinc-800/60 → zinc-700/60).

**Use Cases:**
- [ ] 4 cards in 2×2 grid.
- [ ] Corner amber glow reveals on hover (500ms fade-in).
- [ ] Title color shifts to amber-300 on hover.
- [ ] Icon container is amber-tinted (`bg-amber-400/10 border border-amber-400/20`).

**FAQ:**
- [ ] 6 items, single-column max-w-3xl.
- [ ] Plus icon rotates 45° to become × on expand (300ms).
- [ ] Content uses CSS Grid `grid-template-rows: 0fr → 1fr` transition (not max-height).
- [ ] Only one item open at a time (Radix single-collapsible).

**Final CTA:**
- [ ] H2 scales to 72px on desktop (`md:text-7xl`).
- [ ] Dot-grid background pattern visible (24×24 spacing).
- [ ] Radial amber halo centered.
- [ ] Top and bottom fade gradients (32px height each).
- [ ] CTA is solid amber-400 pill with hover scale and shadow.

**Footer:**
- [ ] 3 link columns + brand block.
- [ ] Support email link hovers to amber-400.
- [ ] Bottom row: copyright left, legal links right.

### 13.2 Responsive Verification

Test at each breakpoint (use Chrome DevTools device toolbar):

- [ ] **375×812 (iPhone 13):** H1 = 36px, hamburger visible, hero input full-width, examples carousel snaps, features 1-col, testimonials 1-col, use cases 1-col, FAQ single-col, final CTA H2 = 30px (`text-3xl`).
- [ ] **768×1024 (iPad):** H1 = 60px, all nav links visible, features 2-col, testimonials 2-col, use cases 1-col.
- [ ] **1024×768 (iPad landscape):** H1 = 60px, examples 3-4 cards visible, features 4-col, testimonials 3-col, use cases 2-col.
- [ ] **1440×900 (desktop):** H1 = 72px, full layout as documented.
- [ ] **1920×1080 (large desktop):** Same as 1440 but with more whitespace around `max-w-7xl` container.

### 13.3 Accessibility Verification

Run axe DevTools or Lighthouse Accessibility audit:

- [ ] All color combinations pass WCAG AA (4.5:1 for body text, 3:1 for large text).
- [ ] All interactive elements have visible focus indicators.
- [ ] Tab order is logical (top-to-bottom, left-to-right).
- [ ] Skip-to-content link present and functional.
- [ ] All form inputs have associated labels.
- [ ] FAQ accordion: keyboard navigable (Arrow Up/Down, Enter/Space, Escape).
- [ ] Mobile nav Sheet: focus trap inside drawer, Escape closes.
- [ ] All decorative images have empty `alt=""`.
- [ ] All informative images have descriptive `alt`.
- [ ] Hero video has `aria-hidden="true"` (decorative).
- [ ] `prefers-reduced-motion: reduce` disables all animations and shows posters instead of videos.
- [ ] Touch targets ≥ 44×44px on mobile.

### 13.4 Performance Verification

Run Lighthouse (Chrome DevTools → Lighthouse → Performance + Mobile):

- [ ] Performance ≥ 95.
- [ ] Accessibility ≥ 95.
- [ ] Best Practices ≥ 95.
- [ ] SEO ≥ 95.
- [ ] LCP < 2.0s.
- [ ] CLS < 0.05.
- [ ] INP < 200ms.
- [ ] TBT < 200ms.
- [ ] Total bundle JS < 100KB gzipped.
- [ ] Total bundle CSS < 30KB gzipped.
- [ ] No render-blocking resources.
- [ ] All images served as WebP (or AVIF).
- [ ] All videos use `preload="metadata"` (not `preload="auto"`).

### 13.5 Cross-Browser Verification

Test in (latest stable):

- [ ] Chrome (macOS + Windows)
- [ ] Firefox (macOS + Windows)
- [ ] Safari (macOS + iOS)
- [ ] Edge (Windows)
- [ ] Samsung Internet (Android) — for video autoplay compatibility

**Known cross-browser concerns:**
- Safari iOS requires `playsinline` attribute on `<video>` for inline autoplay (already specified).
- Firefox doesn't support `backdrop-filter` with the same smoothness as WebKit — verify the glass input widget looks acceptable.
- CSS Grid `grid-template-rows: 0fr → 1fr` transition is supported in all modern browsers (Chrome 117+, Firefox 118+, Safari 17.4+). For older Safari, fall back to `max-height: 0 → 1000px` transition.

### 13.6 Code Quality Checklist

- [ ] TypeScript strict mode enabled (`"strict": true` in tsconfig.json).
- [ ] No `any` types anywhere in the codebase.
- [ ] All components typed with `interface` (not `type` for object shapes).
- [ ] All interactive components handle loading, error, empty, and success states (where applicable — most sections are static so this is minimal).
- [ ] All async operations (none currently — but if added) show loading indicators and disable buttons.
- [ ] Early returns used instead of deep nesting.
- [ ] Composition over inheritance (no class component hierarchies).
- [ ] All shadcn/ui primitives used as-is (no rebuilding from scratch).
- [ ] ESLint passes with `next/core-web-vitals` config.
- [ ] No console errors or warnings in production build.
- [ ] `next build` succeeds without errors.

---

## 14. Out of Scope (Clone Boundaries)

The following are explicitly **out of scope** for this clone:

### 14.1 Functional Exclusions
- **Authentication / sign-in / sign-up flows** — all auth CTAs link to `/auth/sign-up` placeholder.
- **Dashboard / editor / timeline UI** — the "Professional Timeline Editor" mentioned in Step 4 is shown only as a video demo.
- **Video generation backend** — no AI processing, no ElevenLabs integration, no actual story-to-video pipeline.
- **User accounts / persistence** — no database, no sessions, no user data.
- **Pricing page** — "Pricing" nav link points to `#pricing` placeholder anchor.
- **Blog** — "Blog" nav link points to `#blog` placeholder anchor.
- **Contact form** — "Contact" nav link points to `#contact` placeholder anchor.
- **Language switching** — "EN" dropdown is decorative only (no i18n implementation).
- **Search** — no site search functionality.
- **Analytics** — no Google Analytics, Plausible, or other tracking (can be added later via `next/script`).

### 14.2 Content Exclusions
- **Real video assets from R2** — download and self-host (per § 10.1 download script). Do not hotlink to `r2.storyintovideo.com` in production.
- **Real example card thumbnails** — generate or source separately (per § 10.2).
- **Real testimonial avatars** — use initials-in-circle pattern, not real photos.
- **Real OG image** — generate a custom OG image (per § 7.3).

### 14.3 Architecture Exclusions
- **No CMS integration** — all content is hardcoded in component default props.
- **No API routes** — pure static page (`force-static`).
- **No database** — no Prisma, no SQLite, no Postgres.
- **No server actions** — no form submissions.
- **No webhooks** — no third-party integrations.
- **No A/B testing** — single variant only.
- **No feature flags** — all features ship enabled.

### 14.4 Performance Exclusions (Acceptable Trade-offs)
- **No lazy hydration** — all client components hydrate immediately (acceptable given only 5 client components).
- **No edge runtime** — Node.js runtime is sufficient.
- **No service worker / PWA** — out of scope for a landing page.
- **No image optimization beyond next/image defaults** — no custom sharp config.

### 14.5 Design Exclusions (Intentional Deviations)
- **No pixel-perfect screenshot diffing requirement** — the spec aims for visual fidelity to within ~5px tolerance. Exact pixel match is not required (and would be brittle).
- **No reproduction of the live site's `data-[state=...]` CSS class naming** — shadcn/ui generates these automatically; we don't hand-write them.
- **No reproduction of the live site's exact Next.js build output filenames** (`_next/static/chunks/...`) — these are build artifacts, not design elements.

---

## 15. Implementation Roadmap

### 15.1 Phase-by-Phase Build Order

A recommended sequence for implementing the clone, designed so each phase produces a verifiable milestone.

#### Phase 1: Foundation (estimated 2-3 hours)
**Goal:** Skeleton Next.js app runs with correct fonts and colors.

1. `pnpm create next@latest storyintovideo-clone --typescript --tailwind --app --eslint`
2. `pnpm add @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react geist`
3. Replace `tailwind.config.ts` with § 8.1 config.
4. Replace `app/globals.css` with § 9 contents.
5. Set up `lib/fonts.ts` per § 10.3.
6. Wire fonts into `app/layout.tsx` `<html>` className.
7. Set `<body className="bg-background text-foreground antialiased">`.
8. Verify: `pnpm dev` → page loads with dark bg and Outfit font available.

**Verification:** Open browser DevTools, confirm `--primary: #febf00` is in `:root`, confirm `<body>` has Geist Sans applied, confirm H1 mockup renders in Outfit.

#### Phase 2: Static Sections (estimated 3-4 hours)
**Goal:** All sections render with correct content, but no interactivity.

1. Build `Footer` (simplest — start here to validate layout patterns).
2. Build `FinalCTA` (static content, decorative layers).
3. Build `Features` (grid with hover effects — pure CSS).
4. Build `Testimonials` (grid).
5. Build `UseCases` (grid with hover).
6. Build `Workflow` (4-step alternating layout, embed videos with posters).
7. Compose all into `app/page.tsx`.

**Verification:** Scroll through page — all sections visible in correct order, hover effects work, videos autoplay.

#### Phase 3: Interactive Sections (estimated 4-5 hours)
**Goal:** All interactive elements functional.

1. Build `Navbar` with `useScrolled` hook + mobile Sheet.
2. Build `Hero` with textarea state, chip click handlers, ratio toggle.
3. Build `StyleMarquee` (CSS-only, with mask).
4. Build `Examples` carousel with arrow click handlers.
5. Install shadcn/ui Accordion, build `Faq`.

**Verification:** Click every interactive element — chips populate textarea, ratio toggles, FAQ expands/collapses, mobile menu opens/closes, carousel arrows scroll.

#### Phase 4: Polish & Animation (estimated 2-3 hours)
**Goal:** All motion and micro-interactions match live site.

1. Add `useReveal` hook + `data-reveal` attributes for scroll animations.
2. Add staggered delays per § 3.2 table.
3. Verify all hover effects match § 3.4 catalog.
4. Verify video loading choreography (§ 3.7) — poster → fade-in video.
5. Add `prefers-reduced-motion` handling.
6. Add skip-to-content link.
7. Add focus-visible rings globally.

**Verification:** Record a screen video of scrolling through the page — animations should feel cinematic, not janky.

#### Phase 5: Asset Replacement (estimated 2-3 hours)
**Goal:** All placeholder assets replaced with final assets.

1. Run `scripts/download-assets.sh` to fetch workflow videos + posters.
2. Source/generate hero background video.
3. Generate 6 example card thumbnails (use `image-generation` skill or stock).
4. Generate OG image (1200×630).
5. Generate favicon (32×32).
6. Verify all videos autoplay without errors.

**Verification:** Lighthouse Performance run — should hit ≥95.

#### Phase 6: QA & Delivery (estimated 2-3 hours)
**Goal:** Pass all QA checklists.

1. Run through § 13.1 (Visual Verification) checklist.
2. Run through § 13.2 (Responsive) at 375 / 768 / 1024 / 1440 / 1920.
3. Run through § 13.3 (Accessibility) with axe DevTools.
4. Run through § 13.4 (Performance) with Lighthouse.
5. Run through § 13.5 (Cross-Browser) in Chrome / Firefox / Safari.
6. Run through § 13.6 (Code Quality) — `pnpm lint`, `pnpm typecheck`, `pnpm build`.
7. Fix any defects found.
8. Deploy to Vercel (or target platform).

**Verification:** All checklists pass. Deploy URL accessible. Lighthouse score ≥95 across all categories.

### 15.2 Total Estimated Effort

| Phase | Hours | Running Total |
|---|---|---|
| 1. Foundation | 2-3 | 3 |
| 2. Static Sections | 3-4 | 7 |
| 3. Interactive Sections | 4-5 | 12 |
| 4. Polish & Animation | 2-3 | 15 |
| 5. Asset Replacement | 2-3 | 18 |
| 6. QA & Delivery | 2-3 | 21 |

**Total: ~15–21 hours** for a senior frontend developer working solo. Add 30–50% buffer for junior developers or unfamiliarity with the stack.

### 15.3 Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Outfit weight 820 unavailable via `next/font/google` | High | Medium | Self-host variable Outfit via `next/font/local` (per § 10.3 note) |
| R2 video URLs change or become inaccessible | Medium | High | Download all videos to `/public/workflow/` immediately during Phase 1 |
| shadcn/ui Accordion animation differs from live site | Low | Low | Verify Grid `grid-template-rows: 0fr→1fr` transition; fall back to max-height if needed |
| `backdrop-filter` rendering varies across browsers | Medium | Low | Test in Firefox specifically; accept graceful degradation |
| Hero background video too large (>2MB) | Medium | Medium | Compress with ffmpeg: `ffmpeg -i input.mp4 -vcodec h264 -crf 28 -preset slow -acodec aac -b:a 128k output.mp4` |
| Lighthouse Performance < 95 | Low | Medium | Lazy-load below-fold videos via IntersectionObserver; use `next/image` for all raster |
| Mobile touch targets too small | Medium | High | Add `min-h-[44px] min-w-[44px]` to all interactive elements; verify with `axe` touch-target audit |

---

## 16. Glossary

| Term | Definition |
|---|---|
| **CSS Grid `0fr → 1fr` transition** | A modern technique for animating accordion content height without JavaScript. The grid container's `grid-template-rows` transitions from `0fr` (collapsed) to `1fr` (expanded), and the inner content has `overflow: hidden`. Supported in Chrome 117+, Firefox 118+, Safari 17.4+. |
| **`next/font`** | Next.js's built-in font optimization system. Self-hosts fonts at build time, generates fallback fonts with matching metrics, and exposes CSS variables for use in Tailwind config. Eliminates render-blocking font requests. |
| **shadcn/ui** | A component library built on Radix UI primitives, styled with Tailwind CSS. Unlike traditional libraries, shadcn/ui components are copied into your codebase (via CLI) rather than installed as an npm dependency — giving full ownership of the code. |
| **Radix UI** | A low-level, unstyled, accessible component primitive library. Provides the behavior (keyboard nav, ARIA, focus management) for components like Accordions, Dialogs, and DropdownMenus. shadcn/ui wraps Radix with Tailwind styling. |
| **`data-[state=...]` Tailwind variant** | A Tailwind CSS variant that targets elements based on `data-state` attributes. Radix components set `data-state="open"` or `data-state="closed"` on their elements, and you can style them with `data-[state=open]:...` classes. |
| **`backdrop-blur`** | A CSS filter that blurs whatever is behind an element. Used to create the "glassmorphism" effect on the hero input widget and scrolled nav. Requires a semi-transparent background to be visible. |
| **`prefers-reduced-motion`** | A CSS media query that detects whether the user has requested reduced motion at the OS level. Critical for accessibility — all non-essential animations should be disabled when this is `reduce`. |
| **LCP (Largest Contentful Paint)** | A Core Web Vital measuring when the largest visible element finishes rendering. Target < 2.5s for good UX. |
| **CLS (Cumulative Layout Shift)** | A Core Web Vital measuring visual stability. Target < 0.1. Caused by images without dimensions, fonts loading late, or dynamically injected content. |
| **INP (Interaction to Next Paint)** | A Core Web Vital measuring responsiveness to user input. Replaced FID in 2024. Target < 200ms. |
| **WCAG AAA** | The highest conformance level of the Web Content Accessibility Guidelines. Requires 7:1 contrast ratio for normal text (vs 4.5:1 for AA). Not required for all content, but strived for where feasible. |

---

## 17. Document Changelog

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-06-26 | Frontend Architect | Initial draft based on visual inspection of storyintovideo.com |
| **2.0** | **2026-06-26** | **Frontend Architect** | **Field-verified via headless-browser computed-style extraction. Corrected color tokens, font weights (Outfit 820 verified), added 12-keyframe motion library, added yellow→purple hover gradient on Examples cards, added shadcn Sheet drawer for mobile nav, added full Tailwind config, globals.css, asset manifest, component API contracts, implementation roadmap, risk register, glossary. Expanded from ~3K to ~7K words.** |

---

*End of Project Requirements Document. The clone build can now proceed using Phase 1 of the Implementation Roadmap (§ 15.1).*

