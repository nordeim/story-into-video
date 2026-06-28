# Project Requirements Document: StoryIntoVideo.com Clone

**Project:** StoryIntoVideo Landing Page Clone  
**Reference URL:** https://storyintovideo.com/  
**Document Version:** 1.0  
**Prepared By:** Frontend Architect & Avant-Garde UI Designer  
**Date:** 2026-06-26  
**Stack Target:** Static HTML5 / CSS3 / Vanilla JS (or React 19 + Tailwind v4)

---

## Executive Summary

This document captures the complete design language, UI/UX patterns, layout structure, and animation behavior observed on StoryIntoVideo.com and translates them into an actionable clone specification. The site is a **dark-mode-first SaaS landing page** for an AI-powered story-to-video generation tool. Its aesthetic is **luxury-dark, cinematic, and editorial** — deep navy/charcoal surfaces with amber/golden accent tones, premium serif display typography contrasted with clean sans-serif body copy, and cinematic video demonstrations embedded throughout the 4-step workflow section.

The clone must faithfully reproduce: the color system, typographic hierarchy, section-by-section layout, interactive states (hero text input, style selectors, aspect-ratio toggle), animation patterns (scroll reveals, marquee/ticker, card hovers), and responsive behavior down to 375px mobile.

---

## 1. Design Language Analysis

### 1.1 Aesthetic Direction

**Theme:** Luxury-Dark / Cinematic SaaS  
**Tone keywords:** Immersive · Cinematic · Premium · AI-forward · Storytelling  
**Conceptual direction:** The site evokes the atmosphere of a film production house — dark surfaces that feel like a screening room, golden/amber accents that reference film frames and warm studio lighting, editorial type that signals serious creative tools, not a toy. The dominant emotion is *creative possibility with professional credibility*.

**Anti-patterns successfully avoided by the original:**
- No purple gradients or neon glow blobs
- No symmetrical 3-column icon grids (features use a clean 4-column grid with typographic hierarchy)
- No generic hero stock photos (uses animated video demos instead)

---

### 1.2 Color System

The site uses a **dark-first color palette** with warm charcoal/navy backgrounds and golden/amber primary accents. Light mode does not appear to be implemented on the reference site — this clone should also default to dark-only.

#### Palette Specification

| Token | Role | Hex / Value | Notes |
|-------|------|-------------|-------|
| `--color-bg` | Page background | `#0a0a0f` | Near-black with slight blue-violet tint |
| `--color-surface` | Card / panel surface | `#111118` | One step lighter than bg |
| `--color-surface-2` | Elevated card / modal | `#181820` | Section containers |
| `--color-surface-offset` | Borders, dividers | `#1e1e28` | Subtle separation |
| `--color-border` | Card borders | `rgba(255,255,255,0.07)` | Ultra-thin white alpha border |
| `--color-text` | Primary body text | `#e8e8f0` | Warm off-white, not pure white |
| `--color-text-muted` | Secondary text | `#8888a0` | Muted lavender-gray |
| `--color-text-faint` | Metadata / labels | `#555568` | Very faint, for decorative text |
| `--color-primary` | Primary CTA / accent | `#f5a623` | Warm amber/golden orange |
| `--color-primary-hover` | CTA hover state | `#e8941a` | Slightly deeper amber |
| `--color-primary-glow` | Glow on CTAs | `rgba(245,166,35,0.25)` | Box-shadow glow |
| `--color-badge` | Tag/badge background | `rgba(245,166,35,0.12)` | Amber tint surface |
| `--color-gradient-start` | Hero gradient top | `#0a0a0f` | Same as bg |
| `--color-gradient-end` | Hero gradient bottom | `#12101a` | Slightly purple-tinted dark |

#### Gradient & Glow Techniques

- **Hero background mesh:** Radial gradient from a centered amber glow, fading to near-black — creates cinematic depth in the hero section
  ```css
  background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,166,35,0.10) 0%, transparent 70%), #0a0a0f;
  ```
- **CTA button glow:** `box-shadow: 0 0 24px rgba(245,166,35,0.35), 0 4px 16px rgba(245,166,35,0.20)` on primary buttons
- **Section separator:** Thin 1px horizontal rule using `rgba(255,255,255,0.06)` — barely visible, creates section breathing room without heavy dividers
- **Card glass effect:** Cards use `background: rgba(255,255,255,0.03)`, `border: 1px solid rgba(255,255,255,0.07)`, and `backdrop-filter: blur(12px)` for a frosted-glass premium feel

---

### 1.3 Typography

**Display Font:** `Instrument Serif` (Google Fonts, italic variant used for hero heading) — signals editorial prestige, literary quality  
**Body Font:** `Inter` or `DM Sans` (clean, legible sans-serif for all UI chrome)  
**Accent Label Font:** Same body font with `letter-spacing: 0.15em; text-transform: uppercase; font-size: 0.7rem` — used for section eyebrows like "AI-POWERED STORY INTO VIDEO"

#### Type Scale & Usage

| Element | Font | Weight | Size | Line Height | Notes |
|---------|------|--------|------|-------------|-------|
| Hero eyebrow label | DM Sans | 600 | `0.7rem` | 1.2 | Uppercase, tracked 0.15em, amber color |
| Hero H1 (line 1: "Turn") | Instrument Serif | 400 italic | `clamp(3rem, 6vw, 7rem)` | 1.0 | Italic serif, white |
| Hero H1 (line 2: "Story Into Video") | Instrument Serif | 400 italic | Same | 1.0 | Same, key phrase |
| Hero H1 (line 3: "with AI Magic") | Instrument Serif | 400 | Same | 1.0 | Non-italic, creates visual rhythm contrast |
| Hero subtitle | DM Sans | 400 | `1.05rem` | 1.7 | Muted text color, 55ch max-width |
| Section heading (H2) | Instrument Serif | 400 italic | `clamp(2rem, 3.5vw, 3.5rem)` | 1.15 | Multi-line with line breaks for rhythm |
| Section sub-label | DM Sans | 400 | `1rem` | 1.6 | Muted, 60ch max |
| Step label (STEP 1, STEP 2...) | DM Sans | 700 | `0.65rem` | 1 | All caps, tracked 0.2em, amber color |
| Step title (H3) | Instrument Serif | 400 | `1.6rem` | 1.2 | Serif heading for each workflow step |
| Step body paragraph | DM Sans | 400 | `0.9rem` | 1.7 | Muted color, 52ch max |
| Feature card title | DM Sans | 600 | `1rem` | 1.3 | White, bold |
| Feature card body | DM Sans | 400 | `0.875rem` | 1.6 | Muted color |
| Nav links | DM Sans | 400 | `0.875rem` | 1 | Near-white |
| Button text | DM Sans | 600 | `0.875rem` | 1 | Uppercase or sentence case |
| Footer legal | DM Sans | 400 | `0.75rem` | 1.5 | Faint color |

**Critical typographic pattern:** Section H2 headings are intentionally broken into 2 lines with a `<br>` for editorial rhythm — e.g., "Real Story Into Video / Examples" — with the second line acting as a subtitle in lighter weight.

---

### 1.4 Spacing & Layout System

**Base unit:** 4px  
**Content max-width:** `1120px` centered with `padding-inline: clamp(1rem, 4vw, 3rem)`  
**Section padding:** `padding-block: clamp(4rem, 8vw, 7rem)`

#### Grid Structures Per Section

| Section | Layout | Notes |
|---------|--------|-------|
| Navbar | Flex row, space-between | Logo left, nav center, auth CTAs right |
| Hero | Single centered column | Max-width 700px for text block; full-width for interactive widget below |
| Style Marquee | Full-width overflow scroll, no-scrollbar | Horizontal ticker of style tags |
| Story Examples | 1-column card (full width) | Single showcase card, cloneable project card |
| 4-Step Workflow | Alternating 2-col grid | Video left / text right, then text left / video right, alternating |
| Features Grid | 4-column grid (2×2 on tablet, 1-col mobile) | 8 feature cards |
| Testimonials | Horizontal scroll row (3 visible, scrollable) | 6 total testimonial cards |
| Use Cases | 2×2 grid → 1-col mobile | 4 audience persona cards |
| FAQ | 1-column accordion | Full-width with border-bottom separators |
| Final CTA | Centered column | Dark surface card, headline + subtext + CTA button |
| Footer | 5-column grid → stacked mobile | Logo+email col, 4 link columns |

---

## 2. Component Specifications

### 2.1 Navigation Bar

**Structure:** Sticky top nav, `position: sticky; top: 0; z-index: 100`  
**Background:** `backdrop-filter: blur(20px); background: rgba(10,10,15,0.85); border-bottom: 1px solid rgba(255,255,255,0.06)`  
**Height:** `64px`  
**Logo:** SVG wordmark "StoryIntoVideo" — sans-serif, white, with a small film-frame or play icon mark to the left  
**Nav links:** Features · Pricing · Blog · Contact — DM Sans 400 0.875rem, hover: amber color transition  
**Language selector:** `EN` text button with dropdown indicator  
**Auth CTAs:**
- "Sign in" → ghost style: transparent bg, white text, hover: subtle bg
- "Get Started" → primary amber button: `background: var(--color-primary)`, rounded-full pill shape, 36px height, amber glow on hover

**Responsive (mobile):** hamburger icon at ≤768px, links collapse into a slide-down drawer

---

### 2.2 Hero Section

**Layout:** Full-viewport-height (`min-height: 100svh`), flex column, centered, `text-align: center`  
**Background:** Radial amber glow mesh (see color system above)  
**Eyebrow label:** "AI-POWERED STORY INTO VIDEO" — small amber uppercase tracked label above H1  

**H1 structure:**
```html
<h1>
  Turn<br>
  <em>Story Into Video</em><br>
  with AI Magic
</h1>
```
Key: "Story Into Video" is in Instrument Serif italic, creating visual distinction from surrounding lines.

**Subtitle:** 1–2 lines of muted body copy, max-width ~55ch, centered  

**Hero Interactive Widget:**  
This is the signature component — a rounded dark card containing:

1. **Textarea:** Multi-line input, `placeholder="Paste your story here, or write a short idea..."`, dark glass background, no visible border until focused (then amber 1px border), minimum 80px height
2. **Prompt Chips:** Horizontal row of clickable example prompts — "Time travel", "Space odyssey", "Rival chefs", "Victorian mystery" — each a pill button (`border: 1px solid rgba(255,255,255,0.12)`, hover: amber border)
3. **Aspect Ratio Toggle:** "9:16" | "/" | "0" | "16:9" — segmented control, selected state uses amber background; label shows character count "/500" 
4. **Start Creating CTA:** Full-width amber button at bottom of widget card

**Visual Style Marquee** (below widget):  
Infinite horizontal auto-scroll ticker of visual style tags: "Ghibli · Medieval · Oil Painting · Anime · Japanese animation · Realistic · Cyberpunk · Watercolor" — duplicated for seamless looping. Each tag has a subtle frosted pill background.

---

### 2.3 Story Examples Section

**Section Label:** "Real Story Into Video / Examples" (H2, two-line editorial format)  
**Section Sub-text:** "See real story-into-video results — clone any project and make it yours."

**Example Card:** Full-width dark glass card with:
- Left column: Preview area (video/image thumbnail with aspect ratio frame)
- Right column: Project metadata — title, script snippet (truncated), voice name + attributes, background music name + genre tags
- Bottom bar: "Clone this project for free" CTA button + explanatory micro-copy
- Hover state: Subtle card lift (`transform: translateY(-2px)`, increased shadow)

---

### 2.4 4-Step Workflow Section

**Section Label:** "From Story to Video / in 4 Steps" (two-line H2)

**Layout:** Alternating full-width 2-column rows  
- Row 1 (Step 1): Video demo LEFT + Text content RIGHT  
- Row 2 (Step 2): Text content LEFT + Video demo RIGHT  
- Row 3 (Step 3): Video demo LEFT + Text content RIGHT  
- Row 4 (Step 4): Text content LEFT + Video demo RIGHT  

**Each step contains:**
- Step label: "STEP 1" (amber, uppercase micro-label)
- H3 title: Instrument Serif, e.g., "Create Your Project"
- Body paragraph: DM Sans muted, 52ch max
- CTA inline link: "Start Your Story →" — amber text link with arrow, no button style

**Video container:** `<video>` element with `autoplay muted loop playsinline`, dark rounded container with `border-radius: 12px`, slight inner shadow/overlay on hover. Placeholder state shows "Loading video..." text while video loads.

---

### 2.5 Features Grid Section

**Section Label:** "Creating AI Videos Has Never Been / So Easy" (two-line H2)  
**Sub-text:** Supporting copy about AI models and complete pipeline

**Grid:** CSS Grid, `grid-template-columns: repeat(4, 1fr)` (desktop), 2-col (tablet), 1-col (mobile)  
**8 Feature Cards:**
1. AI Script Analysis
2. Character Consistency  
3. Multi-Voice Narration  
4. 100% AI Powered  
5. Scene Generation  
6. Dynamic Subtitles  
7. One-Click Export  
8. And Much More...

**Card anatomy:**
- No icon circles (avoids AI slop anti-pattern)
- Title: DM Sans 600, white, 1rem
- Body: DM Sans 400, muted, 0.875rem, 3–4 lines max
- Card: `background: rgba(255,255,255,0.03)`, `border: 1px solid rgba(255,255,255,0.07)`, `border-radius: 10px`, `padding: 1.5rem`
- Hover: subtle border amber tint `border-color: rgba(245,166,35,0.2)`, `background` brightens slightly

**Section CTA:** Centered amber button below the grid

---

### 2.6 Testimonials Section

**Section Label:** "Loved by / Creators" (two-line H2)  
**Layout:** Horizontally scrollable row, 3 cards visible at once (desktop), 1.5 visible (mobile) — scroll hint visible  
**6 Testimonial Cards:**

| Quote excerpt | Name | Role |
|---------------|------|------|
| Fan fiction → animated short in under an hour | Sarah K. | YouTube Creator |
| Replaced an entire pre-production team | Marcus L. | Indie Filmmaker |
| Light novel chapters → anime video trailers | Yuki T. | Light Novel Author |
| Product stories into social media video daily | David R. | Content Marketer |
| Historical narratives students want to watch | Priya M. | Educator |
| Trending stories → channel grew 10x | Alex C. | TikTok Creator |

**Card style:**  
- Glass card with left-edge accent: `border-left: none` (avoid slop), instead use a subtle amber quote mark `"` as decorative element, Instrument Serif italic, 3rem, amber color, positioned top-left
- Name: DM Sans 600, white
- Role: DM Sans 400, muted amber/golden
- Min-width: `320px` per card to prevent wrapping

**CTA:** Centered "Join Creators — Start Free" amber button below

---

### 2.7 Use Cases Section

**Section Label:** "Built for / Storytellers" (two-line H2)  
**Grid:** 2×2 grid desktop, 1-col mobile  
**4 Persona Cards:**
1. Novel & Fiction Writers
2. Content Creators
3. Filmmakers & Studios
4. Educators & Trainers

**Card anatomy:**
- Icon: Minimal SVG icon or emoji-free label (single line identifier)
- H3 title: DM Sans 700 or Instrument Serif 400
- Body: 2–3 lines muted text
- "Try it now" link: amber text link, no button
- Hover: card lifts, amber top border appears `border-top: 2px solid var(--color-primary)`

---

### 2.8 FAQ Section

**Section Label:** "Frequently Asked / Questions" (two-line H2)

**6 FAQ items:**
1. What kind of stories can I turn into videos?
2. How does AI maintain character consistency?
3. Do I own the copyright to the videos?
4. Can I customize the visual style?
5. How long does it take to generate a video?
6. What languages are supported for narration?

**Accordion behavior:**
- Each item: `border-bottom: 1px solid rgba(255,255,255,0.07)` separator
- Question row: flex, space-between, with `+` / `×` icon toggle (amber, 1.25rem)
- Answer: collapsible, animated with CSS `max-height` transition from `0` to content height
- Open state: `+` rotates to `×`, answer slides down with `opacity: 0 → 1` fade

---

### 2.9 Final CTA Section

**Background:** Slightly lighter dark glass card inset from page edges  
**Centered content:**
- H2: "Your Story Deserves to Be Seen" — Instrument Serif, large, centered
- Sub-heading: amber primary CTA button (largest on page)
- Micro-copy below: "No filming. No editing. Just paste your story." — DM Sans, muted, small

---

### 2.10 Footer

**Structure:** `grid-template-columns: 2fr 1fr 1fr 1fr 1fr` desktop → stacked mobile  
**Col 1:** Logo + tagline + email link  
**Col 2–5:** Link lists — Tools / AI Video Models / AI Image Models / Use Cases + Legal  
**Bottom bar:** Copyright line + inline links (All AI Tools · Privacy Policy · Terms of Service)  
**Separator:** 1px `rgba(255,255,255,0.06)` border above bottom bar  

---

## 3. Animation & Motion Specifications

### 3.1 Scroll Reveal Animations

All scroll animations use CSS-native `animation-timeline: view()` to avoid layout shift. Only `opacity` and `clip-path` are animated on scroll-triggered elements (no `translateY` on scroll to prevent CLS).

```css
/* Default scroll reveal — every section heading and content block */
.reveal {
  opacity: 1; /* fallback */
}
@supports (animation-timeline: scroll()) {
  .reveal {
    opacity: 0;
    animation: fade-in linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 60%;
  }
}
@keyframes fade-in { to { opacity: 1; } }
```

**Stagger pattern:** Feature grid cards, testimonial cards, and use-case cards use staggered `animation-delay` (100ms increments per child) to create cascade effect.

### 3.2 Style Tags Marquee / Ticker

Infinite horizontal scroll ticker for visual style tags in the hero section.

```css
.marquee-track {
  display: flex;
  gap: 0.75rem;
  animation: marquee 30s linear infinite;
  width: max-content;
}
.marquee-wrapper {
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); } /* Content duplicated for seamless loop */
}
```

Hover on marquee-wrapper: `animation-play-state: paused`  
Respects `prefers-reduced-motion`: `animation-duration: 0.01ms` fallback

### 3.3 Hover Micro-interactions

| Element | Hover Transition | Duration |
|---------|-----------------|----------|
| Nav links | `color → amber` | 180ms ease-out |
| Primary CTA button | `box-shadow` grows, `translateY(-1px)` | 200ms cubic-bezier(0.16,1,0.3,1) |
| Ghost button | `border-color → amber`, `color → amber` | 180ms |
| Feature cards | `border-color → amber(0.2)`, `background` lightens | 200ms |
| Use-case cards | `border-top: amber`, `translateY(-3px)` | 220ms |
| Testimonial cards | `box-shadow` expands | 200ms |
| FAQ chevron | `rotate(45deg)` → `rotate(0)` or `rotate(135deg)` | 250ms |
| Prompt chips | `border-color → amber`, slight scale `1.02` | 160ms |

### 3.4 FAQ Accordion Animation

```css
.faq-answer {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 350ms cubic-bezier(0.16, 1, 0.3, 1),
              opacity 250ms ease;
}
.faq-item.open .faq-answer {
  max-height: 400px; /* generous upper bound */
  opacity: 1;
}
```

### 3.5 Hero Widget Interactions

- **Textarea focus:** `border-color` transitions from `rgba(255,255,255,0.07)` to `rgba(245,166,35,0.6)` with `box-shadow: 0 0 0 3px rgba(245,166,35,0.12)` — amber glow focus ring
- **Aspect ratio toggle:** Active pill slides with `background: var(--color-primary)`, inactive collapses — smooth background transition, not instant
- **Prompt chips:** On click, the chip text fills the textarea with the selected story prompt; chip briefly pulses amber (`scale(0.97) → scale(1.03) → scale(1)`)
- **Character counter:** Updates live on textarea `input` event, turns amber when approaching 500, turns red at limit

### 3.6 Video Loading State

Each `<video>` element in the 4-step section shows a skeleton loader until the video can play:
```css
.video-loading {
  background: linear-gradient(90deg, var(--color-surface) 25%, var(--color-surface-2) 50%, var(--color-surface) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}
```
"Loading video..." text centered within, DM Sans muted.

---

## 4. Page-by-Page Section Map

### Full Section Order (Top → Bottom)

```
1. NAVBAR (sticky)
2. HERO
   ├── Eyebrow label
   ├── H1 (3-line split)
   ├── Subtitle paragraph
   ├── Hero Widget Card
   │   ├── Textarea input
   │   ├── Prompt chips (4 examples)
   │   ├── Aspect ratio toggle (9:16 / 16:9)
   │   └── "Start Creating" CTA button
   └── Style Marquee Ticker
3. STORY EXAMPLES
   ├── Section heading + sub-text
   └── Single showcase example card (cloneable)
4. 4-STEP WORKFLOW
   ├── Section heading + sub-text
   ├── Step 1: Create Your Project (video + text, alternating)
   ├── Step 2: Generate Characters & Scenes (text + video)
   ├── Step 3: AI Storyboard (video + text)
   └── Step 4: Professional Timeline Editor (text + video)
5. FEATURES GRID
   ├── Section heading
   ├── 8-card grid (4-col)
   └── CTA button
6. TESTIMONIALS
   ├── Section heading
   ├── Horizontal scroll row (6 cards)
   └── CTA button
7. USE CASES
   ├── Section heading
   └── 2×2 card grid (4 personas)
8. FAQ ACCORDION
   ├── Section heading
   └── 6 accordion items
9. FINAL CTA BANNER
   ├── Headline
   ├── CTA button
   └── Micro-copy
10. FOOTER
    ├── 5-column grid
    └── Bottom copyright bar
```

---

## 5. Responsive Behavior

### Breakpoints

| Name | Width | Layout changes |
|------|-------|----------------|
| Mobile S | 375px | All single-column, full-bleed hero widget, hamburger nav |
| Mobile L | 430px | Same as Mobile S |
| Tablet | 768px | 2-col use cases, 2-col features, nav visible |
| Desktop S | 1024px | 4-step alternating grid, 3-col testimonials |
| Desktop | 1280px | Full 4-col features, 5-col footer |
| Wide | 1440px+ | Content max-width capped at 1120px, outer gutters expand |

### Key Responsive Rules

- **Hero H1:** Uses `clamp(2.5rem, 6vw, 7rem)` — never wraps awkwardly on any viewport
- **Hero widget:** Full width on mobile (minus 1rem padding each side), `max-width: 640px` centered on desktop
- **4-step alternating grid:** Collapses to single column on mobile; alternation order neutralized (video always above text)
- **Features grid:** `repeat(4, 1fr)` → `repeat(2, 1fr)` at 768px → `1fr` at 480px
- **Testimonials:** `overflow-x: scroll; scroll-snap-type: x mandatory` with `scroll-snap-align: start` on each card — native scrollable on mobile
- **Footer:** `grid-template-columns` → `1fr 1fr` → `1fr` stacked below 600px
- **Marquee:** Width auto-adjusts; gap reduces to `0.5rem` below 480px
- **Touch targets:** All interactive elements maintain `min-height: 44px; min-width: 44px`

---

## 6. Technical Implementation Notes

### 6.1 File Structure

```
storyintovideo-clone/
├── index.html                  ← Main entry point
├── assets/
│   ├── logo.svg                ← Custom SVG wordmark
│   ├── favicon.svg             ← 32×32 simplified mark
│   └── (generated images)      ← Hero backgrounds, card thumbnails
└── (embed fonts via CDN)
```

### 6.2 External Dependencies (CDN)

```html
<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap" rel="stylesheet">

<!-- Icons (Lucide) -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js" defer></script>
```

**No external CSS framework required** — all styling is bespoke CSS using the token system defined in Section 1.2. This keeps the bundle small and avoids Tailwind class noise for a single-file HTML implementation.

### 6.3 JavaScript Requirements

All interactivity is vanilla JS:

| Feature | Implementation |
|---------|---------------|
| Navbar scroll state | `IntersectionObserver` on hero section; add `.scrolled` class to nav when hero exits viewport |
| Mobile hamburger menu | Toggle `aria-expanded` + class `open` on nav drawer |
| Hero textarea character counter | `input` event listener, update counter span |
| Prompt chips | `click` → set `textarea.value = chipText` |
| Aspect ratio toggle | Segmented control, update `aria-pressed` and visual state |
| FAQ accordion | `click` toggle `.open` class, `aria-expanded` update |
| Testimonial scroll | Native CSS `scroll-snap` — no JS needed |
| Marquee pause on hover | CSS `animation-play-state: paused` via `:hover` |
| Video lazy loading | `loading="lazy"` on video containers; `IntersectionObserver` for autoplay trigger |

### 6.4 Accessibility Requirements (WCAG AA)

- All `<img>` elements have descriptive `alt` attributes
- All interactive elements are keyboard-reachable (Tab / Enter / Space / Escape)
- Accordion items use `<button>` with `aria-expanded` and `aria-controls`
- Nav links have visible `:focus-visible` ring (amber outline)
- Color contrast: off-white `#e8e8f0` on dark `#0a0a0f` → passes AA (contrast ratio ~15:1)
- Muted text `#8888a0` on `#0a0a0f` → approx 5.2:1, passes AA for body text
- Amber `#f5a623` on dark → passes for large text / non-text (3:1); do not use amber for small body copy
- Skip-to-content link as first focusable element
- `prefers-reduced-motion` disables all animation timelines and marquee

### 6.5 Performance Targets

- Total initial load: < 800KB (excluding video streams)
- Videos: `<video preload="none" autoplay muted loop playsinline>` — use `preload="none"` and trigger play only when section is in viewport via `IntersectionObserver`
- Images: `loading="lazy"`, `decoding="async"`, explicit `width` and `height` to prevent CLS
- Fonts: `font-display: swap` (handled by Google Fonts `display=swap` parameter)
- No third-party tracking scripts in the clone

---

## 7. Logo Design Specification

**Custom SVG logo** to be generated for the project:

- **Mark:** A simple film-frame icon (two small squares at corners of a rectangle) combined with a play triangle — represents "story becomes video"
- **Wordmark:** "StoryIntoVideo" in DM Sans Bold, letterspaced slightly
- **Color:** White (`currentColor`) — works on dark background
- **Size:** Must render legibly at 24px height
- **Favicon:** Extract just the film-frame mark, centered in 32×32 SVG

---

## 8. Content Inventory

### 8.1 Placeholder Text Requirements

All body copy, testimonials, FAQ answers, and step descriptions are available from the reference site (captured above). Use the exact copy from the reference for the clone — do not generate generic placeholder text.

### 8.2 Media Assets Required

| Asset | Source | Notes |
|-------|--------|-------|
| Hero background glow | CSS-generated | Radial gradient, no image needed |
| 4-step video demos | Placeholder `<video>` with shimmer skeleton | Use `https://picsum.photos/seed/story/800/450` as poster fallback |
| Example project thumbnail | Generated or placeholder | 9:16 aspect ratio, anime style |
| Style tag icons | CSS pill elements only | No images |

---

## 9. Quality Assurance Checklist

Before considering the clone complete, verify:

- [ ] **Color fidelity:** Dark surfaces, amber accent, glass effects match reference
- [ ] **Typography fidelity:** Instrument Serif italic for H1/H2, DM Sans for all body/UI
- [ ] **Hero widget fully interactive:** Textarea, chips, aspect-ratio toggle, character counter all functional
- [ ] **Marquee auto-scrolls** with pause-on-hover and reduced-motion fallback
- [ ] **4-step alternating layout** with video+text columns on desktop, stacked on mobile
- [ ] **FAQ accordion** opens/closes with smooth animation
- [ ] **All hover states** implemented per interaction spec in Section 3.3
- [ ] **Testimonials** horizontally scrollable with snap on mobile
- [ ] **Sticky nav** backdrop-blur activates on scroll
- [ ] **Skip-to-content** link present
- [ ] **Keyboard navigation** works for all interactive elements
- [ ] **WCAG AA contrast** passes for all text elements
- [ ] **Mobile at 375px:** All sections single-column, no horizontal overflow
- [ ] **Reduced-motion:** All animations disabled, marquee static
- [ ] **No console errors**
- [ ] **SVG logo** renders at all sizes

---

## 10. Out of Scope (Clone Boundaries)

The following elements exist on the live site but are **not in scope** for this static clone:

- Authentication flows (Sign in / Get Started → login page)
- Actual AI video generation API calls
- Dashboard / project creation UI (`/create/prompt`)
- Blog post content (`/blog`)
- Pricing page (`/pricing`)
- Contact form backend (`/contact`)
- User account state / session management
- Payment processing

The clone is a **pixel-faithful static marketing landing page** — all CTAs link to `#` or are visually present but non-functional.

---

*End of Document — StoryIntoVideo Clone PRD v1.0*
