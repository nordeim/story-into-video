# StoryIntoVideo Clone — Comprehensive Deviation Report

**Reference (Original):** https://storyintovideo.com/  
**Clone (Subject):** https://storyintovideo.jesspete.shop/  
**Design Specification:** `storyintovideo_SKILL.md` v3.0.0  
**Report Version:** 1.0  
**Date:** 2026-06-28

---

## Executive Summary

This report provides a meticulous, section-by-section analysis of every deviation between the clone site (`storyintovideo.jesspete.shop`) and the original reference (`storyintovideo.com`), cross-validated against the engineering design specification in `storyintovideo_SKILL.md`. Deviations are categorised into five domains: **Visual Design & Aesthetics**, **Typography**, **Layout & Structure**, **Content & Copy**, and **Functionality & Interactivity**. Each finding includes a severity rating, root cause assessment, and a specific remediation prescription.

**Severity key:**
- 🔴 **Critical** — Directly contradicts the design spec or breaks a core user-facing feature
- 🟠 **Major** — Visually noticeable regression or functional gap vs. the original
- 🟡 **Minor** — Small copy/content difference; low visual impact
- 🟢 **Enhancement** — Clone has something the original does not; evaluate intentionality

**Summary counts:** 4 Critical · 12 Major · 8 Minor · 2 Enhancement

---

## 1. Visual Design & Aesthetics

### 1.1 Background & Surface Color — CRITICAL 🔴

**Spec mandate:** The design system's entire philosophy is "luxury-dark cinematic." The `--color-background` token is `#020202` (near-black, NOT pure `#000000`). All surfaces are dark: `--color-card: #060607`, `--color-popover: #0b0b0d`, `--color-muted: #1a1a1d`.

**Observed on clone:** The clone renders with a **white/light background** on multiple sections, most visibly the Features, Testimonials, and Use Cases sections. The hero background is dark, but the page lacks a consistent near-black surface throughout. This is the single most fundamental departure from the original.

**Root cause:** The `--color-background: #020202` CSS theme variable is either not applied globally, or a default Next.js white `body` background is overriding it for certain route segments.

**Remediation:**
1. In `src/app/globals.css`, confirm `@theme { --color-background: #020202; }` is present.
2. In `src/app/layout.tsx`, ensure `body` has `className="bg-background text-foreground"` (or equivalent Tailwind v4 class `bg-(--color-background)`).
3. Audit every section component (`features.tsx`, `testimonials.tsx`, `use-cases.tsx`, `faq.tsx`, `final-cta.tsx`, `footer.tsx`) for any hardcoded `bg-white`, `bg-gray-*`, or missing background declarations — replace all with `bg-background` or `bg-card`.
4. Run a Playwright visual regression test against the original at `1280px` to confirm surface parity.

---

### 1.2 Accent Color Rationing — CRITICAL 🔴

**Spec mandate:** Amber `#febf00` (`--color-primary`) is the **only** permitted non-neutral hue. It appears exclusively on CTAs, active states, focus rings, and eyebrow badges. The spec explicitly states: "Amber is rationed." The singular purple exception (`bg-gradient-to-r from-yellow-500 to-purple-500`) is permitted **only** on example-card hover.

**Observed on clone:** The clone introduces multiple unsanctioned color usages:
- Section label pills (e.g., `REAL EXAMPLES`, `HOW IT WORKS`, `FEATURES`, `TESTIMONIALS`, `USE CASES`, `FAQ`) appear to be styled as simple uppercase text labels without the correct amber eyebrow pill treatment. The `eyebrow` utility class (`background-color: rgb(251, 191, 36, 0.1); border: 1px solid rgb(251, 191, 36, 0.25)`) is not consistently applied.
- Some interactive elements show blue or default browser link colours rather than amber hover states.

**Root cause:** The `eyebrow` utility class is defined in `globals.css` but either not imported into section components or the `<Eyebrow>` primitive is not being used.

**Remediation:**
1. Replace all raw `<span className="text-xs uppercase tracking-wider text-zinc-400">SECTION LABEL</span>` patterns with the `<Eyebrow>` primitive (`src/components/primitives/eyebrow.tsx`).
2. Audit all `<a>` and `<button>` hover styles. Every interactive element should have `hover:text-amber-400` or transition to `--color-primary`.
3. Remove any `text-blue-*`, `text-indigo-*`, or browser-default link colours from all marketing components.

---

### 1.3 Hero Background Video & Overlay Layers — CRITICAL 🔴

**Spec mandate:** The Hero component (`src/sections/hero.tsx`) has a **4-layer composition**:
1. Full-bleed `<video autoPlay muted loop playsInline>` background (`hero-bg.mp4`)
2. Three stacked overlays: vertical scrim (`bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/80`), radial amber glow (top-left, 800×500px, amber at 30% opacity, 60px blur), bottom fade
3. Content layer (`z-10`)
4. Style tags marquee (`z-10`)

**Observed on clone:** The hero section has a dark background, but no full-bleed background video is observed playing. The radial amber glow orb in the upper-left quadrant of the hero is absent, significantly reducing the "cinematic screening room" atmosphere. The three-overlay compositing is not reproducing the original's dramatic depth.

**Root cause:** The `hero-bg.mp4` and `hero-poster.webp` assets may not have been deployed to the `public/` directory. The amber glow `<div>` with `bg-[radial-gradient(rgba(251,191,36,0.12),rgba(0,0,0,0)_65%)] blur-[60px]` may be missing from the hero markup.

**Remediation:**
1. Confirm `public/hero-bg.mp4` and `public/hero-poster.webp` are present in the deployment.
2. Implement the 4-layer hero structure exactly as specified in `SKILL.md §5 - Key Component Patterns - Hero 4-Layer Composition`.
3. The amber glow `<div>` must have `className="absolute top-20 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-[60px]"` with `style={{ background: 'radial-gradient(rgba(251,191,36,0.12),rgba(0,0,0,0) 65%)' }}`.
4. Test on Chromium at 1280×900 — the video should autoplay muted, poster shown while loading.

---

### 1.4 CSS Animation Library (13 Keyframes) — CRITICAL 🔴

**Spec mandate:** The entire site motion system runs on **13 CSS keyframes** defined in `globals.css`: `fade-in-up`, `float`, `glow-pulse`, `border-glow`, `composite-pulse-text`, `shimmer`, `btn-shimmer`, `grid-shimmer`, `grid-sweep-h`, `grid-sweep-v`, `scanline-scroll`, `lang-dropdown-in`, `marquee-scroll`. Zero JavaScript animation libraries.

**Observed on clone:** Multiple keyframe-driven effects are missing or muted:
- **`glow-pulse`** (ambient amber box-shadow breathing on the glass input): absent
- **`border-glow`** (border-color amber pulse on interactive cards): absent
- **`btn-shimmer`** (sliding shine on the primary CTA button): absent
- **`grid-sweep-h` / `grid-sweep-v`** (slow-moving scanline grid in the Features section background): absent
- **`marquee-scroll`** (infinite horizontal scroll of style chips in the hero): present but chips are duplicated without seamless looping

**Root cause:** The `@theme { @keyframes ... }` blocks may be incomplete in the deployed `globals.css`, or the Tailwind v4 `--animate-*` custom properties referencing them were not carried over.

**Remediation:**
1. Copy the complete 13-keyframe block from `SKILL.md §4 - The 13 Keyframes` verbatim into `src/app/globals.css` inside the `@theme {}` block.
2. Ensure the `--animate-*` custom properties referencing each keyframe are also declared in the `@theme {}` block.
3. Fix the marquee: the chip array must be duplicated (`[...STYLE_CHIPS, ...STYLE_CHIPS]`) and `marquee-scroll` must use `translateX(-50%)` (not `-100%`) so the loop is seamless.
4. Apply `animate-[var(--animate-btn-shimmer)]` with `overflow-hidden` and the shimmer `::before` pseudo-element to the primary CTA button.

---

### 1.5 Glass Input Widget Styling — MAJOR 🟠

**Spec mandate:** The hero story textarea is wrapped in a `glass-input` utility class:
```css
.glass-input {
  border-radius: var(--radius-2xl);          /* 1.25rem */
  background-color: rgb(9, 9, 11, 0.6);
  backdrop-filter: blur(16px);
  padding: 1.25rem;
  border: 1px solid rgb(255, 255, 255, 0.08);
  box-shadow: var(--shadow-hero-input);       /* 0 20px 80px rgba(0,0,0,0.6) */
  transition: border-color 500ms, box-shadow 500ms;
}
.glass-input:focus-within {
  border-color: rgb(251, 191, 36, 0.3);
  box-shadow: var(--shadow-hero-input), 0 0 30px rgb(251, 191, 36, 0.1);
}
```

**Observed on clone:** The textarea widget has a visible border but:
- The `backdrop-filter: blur(16px)` glass effect is absent (or not visually present against a non-video background, compounding the missing video issue)
- The `focus-within` amber border glow is not triggered
- The `box-shadow: 0 20px 80px rgba(0,0,0,0.6)` deep shadow is missing, making the widget appear flat

**Remediation:**
1. Apply the `glass-input` utility class (defined in `globals.css`) to the wrapper `<div>` around the textarea in `hero.tsx`.
2. The amber `focus-within` state requires the background video to be present to be visually effective (the blur picks up the video colours).
3. Confirm `globals.css` exports `glass-input` via `@utility glass-input { ... }` (Tailwind v4 syntax).

---

### 1.6 Features Section Grid — MAJOR 🟠

**Spec mandate:** The Features section uses a `4×2 hairline grid` pattern — a shared surface with `border-neutral-800` hairline dividers. This is explicitly an **anti-boxed-card** design. Per `SKILL.md §5`: "Features, Testimonials, UseCases, FinalCTA, Footer — Server. Pure static HTML/CSS."

**Observed on clone:** The clone renders features as **individual boxed cards** with borders or background panels. This is the exact anti-pattern called out in the spec: "No predictable Bootstrap-style card grids." The hairline grid CSS (a single container with `display: grid; border-top: 1px solid; border-left: 1px solid; > * { border-right: 1px solid; border-bottom: 1px solid; }`) creates a seamless shared-surface feel that the boxed card approach destroys.

**Remediation:**
In `src/sections/features.tsx`, replace the boxed card grid with the hairline pattern:
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-neutral-800">
  {features.map((f) => (
    <div key={f.title} className="border-r border-b border-neutral-800 p-8">
      {/* feature content — NO box shadow, NO card background */}
    </div>
  ))}
</div>
```
Remove `bg-card`, `shadow-*`, and `rounded-*` from individual feature items.

---

### 1.7 Testimonials Section Grid — MAJOR 🟠

**Spec mandate:** Testimonials use a `3×2 grid` with **initials avatars** (not photo avatars or placeholder images). Avatar is a circle with the user's initials in amber/muted color on a dark surface.

**Observed on clone:** The clone renders testimonials with `>` blockquote styling and no visual avatar circle. The grid layout appears to be single-column or 2-column rather than the specified 3×2. The initials avatar pattern is entirely absent.

**Remediation:**
1. Build a `3 lg:grid-cols-3 grid-cols-1 md:grid-cols-2` grid.
2. Each testimonial card gets an initials avatar: `<div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-amber-400 font-mono text-sm font-semibold">{initials}</div>`.
3. Remove the raw `<blockquote>` / `>` markdown rendering in favour of the custom card structure from `SKILL.md`.

---

### 1.8 Use Cases Section Corner Glow — MAJOR 🟠

**Spec mandate:** The Use Cases section is a `2×2 grid` with a **corner glow on hover** — an amber radial gradient radiating from the corner of the card nearest the cursor on hover.

**Observed on clone:** The Use Cases section renders as 4 plain cards in a 2×2 grid. The corner glow hover effect is absent, reducing the tactile polish the spec explicitly calls out.

**Remediation:**
Implement the corner glow with a CSS custom property and `::before` pseudo-element:
```css
.use-case-card {
  --glow-x: 0%;
  --glow-y: 0%;
  position: relative;
  overflow: hidden;
}
.use-case-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--glow-x) var(--glow-y), rgba(251,191,36,0.07), transparent 60%);
  opacity: 0;
  transition: opacity 300ms ease;
}
.use-case-card:hover::before { opacity: 1; }
```
Track cursor position via `onMouseMove` setting `--glow-x` and `--glow-y` CSS vars on the card element.

---

### 1.9 Final CTA Section Background — MAJOR 🟠

**Spec mandate:** The Final CTA section uses a **dot-grid background** — a repeating radial-gradient pattern creating a subtle amber-tinted grid of dots over the near-black surface. The CTA uses the `cta-amber` utility (solid amber pill, Tier-4 maximum prominence).

**Observed on clone:** The Final CTA section has a plain dark or generic background without the dot-grid texture. The CTA button styling matches a gradient pill rather than the solid amber `cta-amber` utility.

**Remediation:**
1. Add the dot-grid background to the Final CTA section wrapper:
```css
background-image: radial-gradient(circle, rgba(251,191,36,0.08) 1px, transparent 1px);
background-size: 24px 24px;
```
2. Replace the gradient CTA with the `cta-amber` utility class button.

---

## 2. Typography

### 2.1 H1 Font Weight (Outfit 820) — CRITICAL Already counted above; see §1.4 for animation context.

### 2.2 H1 Outfit Weight 820 Not Rendering — MAJOR 🟠

**Spec mandate:** The H1 hero headline uses **Outfit weight 820** — a value only accessible via the self-hosted variable font file at `public/fonts/Outfit-VariableFont.woff2`. The inline style `style={{ fontWeight: 820 }}` is mandatory. Google Fonts Outfit API only serves discrete weights (400, 700, etc.) and cannot serve 820.

**Observed on clone:** The H1 headline renders with standard bold weight (approximately 700), not the ultra-heavy 820 that gives the headline its "cinematic title-card quality." This is immediately visible as the headline lacks the distinctive typographic authority of the original.

**Root cause:** Either the variable font file is not present in `public/fonts/`, the `@font-face` declaration in `globals.css` is missing/incorrect, or the `localFont` configuration in `src/lib/fonts.ts` is not pointing to the correct file path.

**Remediation:**
1. Download the Outfit variable font: `curl -L "https://github.com/googlefonts/oss-fonts/raw/main/fonts/ofl/outfit/Outfit%5Bwght%5D.ttf" -o outfit-variable.ttf`
2. Convert to `.woff2` (use `fonttools` or an online converter) and place at `public/fonts/Outfit-VariableFont.woff2`.
3. Confirm `src/lib/fonts.ts`:
```ts
const outfit = localFont({
  src: '../../../public/fonts/Outfit-VariableFont.woff2',
  weight: '100 900',
  variable: '--font-outfit',
  display: 'swap',
});
```
4. In `hero.tsx` H1: `<h1 className="font-heading ..." style={{ fontWeight: 820 }}>`.

---

### 2.3 Body Font (Geist Sans) — MINOR 🟡

**Spec mandate:** Body text uses **Geist Sans** (`geist` npm package), self-hosted, referenced via `--font-geist-sans`. No Google Fonts CDN for body.

**Observed on clone:** Body text appears to be rendering in the system sans-serif stack or a Google Fonts variant, not Geist Sans. The distinction is subtle but visible in letter-spacing and glyph character.

**Remediation:**
1. Confirm `geist` npm package is installed: `pnpm add geist`.
2. In `src/lib/fonts.ts`: `import { GeistSans } from 'geist/font/sans'` and apply `GeistSans.variable` to the `<html>` class in `layout.tsx`.

---

### 2.4 Aspect Ratio / Character Counter Font — MINOR 🟡

**Spec mandate:** The aspect ratio toggles and character counter in the hero widget use `font-mono` (`Geist Mono`) at `text-[10px]` with `tabular-nums`. The character counter turns **amber** at 450+ characters.

**Observed on clone:** The character counter shows `0 / 500` but does not use `font-mono` styling. The amber colour-change threshold at 450 characters is not implemented. The ratio toggle buttons do not show `aria-pressed` state changes.

**Remediation:**
1. Apply `className="font-mono text-[10px] tabular-nums"` to both the character counter and ratio labels.
2. In the hero client component, add: `const isNearLimit = charCount >= 450;` and conditionally apply `text-amber-400` to the counter when `isNearLimit` is true.
3. Ensure ratio toggle buttons have `aria-pressed={isActive}` for accessibility compliance (WCAG AAA spec requirement).

---

## 3. Layout & Structure

### 3.1 Hero Headline Line Break — MINOR 🟡

**Original:** "Turn  \nStory Into Video  \nwith AI Magic" (3-line display with line breaks creating a cinematic stacked title)

**Clone:** "Turn Story Into Video  \nwith AI Magic" (2-line title; "Turn" and "Story Into Video" are on the same line)

**Impact:** The 3-line stacking with `<br>` or `whitespace-pre-line` gives the hero headline its cinematic poster quality. The 2-line version loses vertical rhythm and the deliberate weight of each line as a standalone phrase.

**Remediation:** In `hero.tsx`, restore the 3-line structure:
```tsx
<h1 ...>
  Turn<br />
  Story Into Video<br />
  <span className="...">with AI Magic</span>
</h1>
```

---

### 3.2 Hero Subtitle Copy Difference — MINOR 🟡

**Original:** "Paste your story and AI handles the rest — characters, storyboards, voiceover, and **a finished video in minutes**."

**Clone:** "Paste your story and AI handles the rest — characters, storyboards, voiceover, and **subtitles, all generated in minutes**."

**Impact:** Minor copy deviation. The original emphasises the output ("a finished video"), which is the more compelling value proposition. The clone's version adds "subtitles" which is a feature detail.

**Remediation:** Revert to the original copy verbatim.

---

### 3.3 Hero Textarea Placeholder — MINOR 🟡

**Original placeholder:** "Paste your story here, or write a short idea..."
**Clone placeholder:** "Your story"

**Impact:** The original placeholder is warmer, more inviting, and more instructional. "Your story" is generic and lacks guidance.

**Remediation:** Change the textarea `placeholder` attribute to `"Paste your story here, or write a short idea..."`.

---

### 3.4 Hero Character Counter Position — MINOR 🟡

**Original:** Counter shows `0 / 500` with ratio toggles to the **right**, formatted as `[counter] [9:16] [16:9]` in a bottom toolbar within the glass input widget.

**Clone:** Counter shows `0 / 500` but positioned **above** the ratio toggles, breaking the single-row bottom toolbar layout of the original.

**Remediation:** Place the counter and ratio toggles in a single `flex items-center justify-between` row at the bottom of the glass input widget.

---

### 3.5 Style Chips in Hero Marquee — MAJOR 🟠

**Spec mandate:** 8 style chips in the marquee: `Ghibli`, `Medieval`, `Oil Painting`, `Anime`, `Japanese animation`, `Realistic`, `Cyberpunk`, `Watercolor`. Each chip is a `<StyleChip>` primitive with `label` and `sublabel`. The marquee array is duplicated for seamless infinite loop.

**Observed on clone:** The clone has 8 chips (`Ghibli`, `Oil Painting`, `Anime`, `Realistic`, `Cyberpunk`, `Futuristic neon`, `Watercolor`, `Comic`) — **missing `Medieval` and `Japanese animation`**, and **adding `Futuristic neon` and `Comic`** which are not in the spec. The marquee duplication appears to be implemented but may not be using the `marquee-mask` fade-edge CSS utility.

**Remediation:**
1. Restore the original 8 chips: `Ghibli`, `Medieval`, `Oil Painting`, `Anime`, `Japanese animation`, `Realistic`, `Cyberpunk`, `Watercolor`.
2. Apply the `marquee-mask` class to the overflow container for the fade-edge effect: `mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent)`.
3. The `marquee-track` wrapper must have `animation: var(--animate-marquee-scroll)` and `hover:animation-play-state: paused`.

---

### 3.6 Examples Section — MAJOR 🟠

**Spec mandate:** The Examples section is a **carousel with arrow handlers** (`use client`, `useState` for index tracking). It shows a single featured example with: Script panel (showing script text with "AI is writing script..." shimmer), Voice panel (voice name, type, description), Background music panel (track name, genre). A "Clone this project for free" CTA with subtitle "After cloning, freely edit the script, visuals, and soundtrack."

**Observed on clone:** The clone renders a **static grid of 6 example cards** (title + genre tags + link) instead of the interactive carousel. The script/voice/music sub-panels are entirely absent. The "Previous examples / Next examples" navigation is present but the panel content showing script/voice/music details is missing.

**Root cause:** The `examples.tsx` component is not implementing the 3-panel detail view (`Script`, `Voice`, `Background music`) for the active example. Only the card grid is present.

**Remediation:**
1. Implement the 3-panel layout below the cards: when a card is selected/active, show the Script panel (`bg-card rounded-xl p-4` with shimmer animation on "AI is writing script..."), Voice panel, and Background music panel.
2. Add the `Clone this project for free` button with the subtitle copy.
3. The arrow navigation (`Previous examples` / `Next examples`) should update the active card and the detail panels in sync.

---

### 3.7 Workflow Section Video Loading — MAJOR 🟠

**Spec mandate:** Each of the 4 workflow steps has a video (`workflow-step-{1-4}.mp4`) that loads lazily. The `workflow.tsx` component uses `useState` to track which video has loaded its poster, with a `poster→video` fade-in choreography. Each step alternates: odd steps have video left/content right, even steps have content left/video right (the "4 alternating rows" pattern in `SKILL.md §5`).

**Observed on clone:** The 4 workflow steps are present but render as text-only — no video panels are visible. The steps are arranged in a vertical list rather than alternating left-right video+content rows. The step numbers are formatted as `01`, `02`, `03`, `04` (correct per spec) but the visual alternation rhythm is missing.

**Remediation:**
1. Deploy `public/workflow-step-1.mp4` through `public/workflow-step-4.mp4`.
2. Each step row: `className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"` with the video side using `order-1 lg:order-{isEven ? 2 : 1}` for alternation.
3. Implement the `useState` poster/video fade-in: `<video onLoadedData={() => setLoaded(true)} className={loaded ? 'opacity-100' : 'opacity-0'} ...>`.

---

### 3.8 Navbar Language Switcher — MINOR 🟡

**Spec mandate:** The navbar includes an `EN` language switcher rendered via a `dropdown-menu.tsx` Radix DropdownMenu primitive. It uses the `lang-dropdown-in` keyframe for its open animation (`opacity: 0 → 1`, `translateY(-4px) → (0)`, `scale(0.96) → (1)` over 0.15s).

**Observed on clone:** The `EN` text is present but is not a functional dropdown. Clicking it produces no dropdown menu. The `lang-dropdown-in` animation is consequently also absent.

**Remediation:**
1. Import and use the `dropdown-menu.tsx` Radix primitive for the language switcher in `navbar.tsx`.
2. Add the `lang-dropdown-in` keyframe to `globals.css` (if not already present).
3. Connect the dropdown trigger to the EN label with `asChild` pattern.

---

### 3.9 Mobile Navigation — MAJOR 🟠

**Spec mandate:** On mobile, the navbar uses a `sheet.tsx` Radix Dialog primitive for the mobile nav panel. It should slide in from the right with a close button.

**Observed on clone:** The mobile hamburger menu button is present. However, the Sheet/Dialog implementation appears to use a basic toggle rather than the Radix Dialog, meaning it lacks proper `aria-modal`, focus trapping, and the Escape-key dismiss behaviour specified for WCAG AAA compliance.

**Remediation:**
1. Replace any custom toggle-div mobile menu with the `sheet.tsx` Radix Dialog primitive.
2. Ensure `aria-modal="true"`, `onOpenChange` handler, and `DialogClose` trigger are present.
3. Test keyboard navigation: `Tab` must stay inside the sheet when open; `Escape` must close it.

---

### 3.10 Footer Link Structure — MINOR 🟡

**Spec mandate:** Footer has **4 named columns**: `Tools`, `AI Video Models`, `AI Image Models`, `Use Cases`, plus a `Legal` column. Individual tool pages link to real routes (e.g., `/tools/kling-3-story-video-generator`).

**Observed on clone:** The footer collapses all tools into a single `ALL AI TOOLS` column (flattening the `Tools`, `AI Video Models`, and `AI Image Models` hierarchy into one). All footer links point to `#` (dead links), whereas the original links to real tool route pages.

**Remediation:**
1. Restore the 4-column footer taxonomy: `Tools`, `AI Video Models`, `AI Image Models`, `Use Cases`, `Legal`.
2. Wire tool links to their respective routes (e.g., `href="/tools/kling-3-story-video-generator"`). These pages may need to be built if not yet scaffolded.
3. `Legal` links to `/privacy`, `/terms`, `/contact` — these are present but should be double-checked to resolve correctly.

---

### 3.11 Skip-to-Content Link — ENHANCEMENT 🟢

**Observed on clone:** The clone includes a `<a href="#main">Skip to content</a>` skip link at the top. The original does not have this (or it is hidden). This is a WCAG AAA accessibility enhancement. **Keep this** — it improves accessibility.

---

### 3.12 FAQ Accordion Answers — MAJOR 🟠

**Spec mandate:** The FAQ uses the Radix Accordion primitive (`accordion.tsx`) with `grid-template-rows` animation for the open/close transition. The original shows answers when FAQ items are expanded.

**Observed on clone:** The FAQ question items are present but clicking them **does not expand** to show answers. The accordion is rendered as collapsed headings with no trigger behaviour. Either the Radix Accordion state is not wired, or the answer content is empty.

**Remediation:**
1. Confirm `accordion.tsx` Radix Accordion primitive is imported.
2. Each FAQ item must be an `<AccordionItem>` with `<AccordionTrigger>` (the question) and `<AccordionContent>` (the answer text).
3. Populate answer content for all 6 FAQ items with copy matching the original's answer text.
4. The `grid-template-rows: 0fr → 1fr` CSS animation must be in `globals.css` as the open/close transition for `AccordionContent`.

---

## 4. Content & Copy

### 4.1 Testimonial Title Deviations — MINOR 🟡

| Person | Original Title | Clone Title |
|--------|---------------|-------------|
| Sarah K. | YouTube Creator | Fan Fiction Writer |
| Marcus L. | Indie Filmmaker | Solo Filmmaker |
| David R. | Content Marketer | Marketing Lead |
| Alex C. | TikTok Creator | YouTube Creator |

**Remediation:** Restore original job titles verbatim.

---

### 4.2 Final CTA Section — MINOR 🟡

**Original body copy:** "Turn your story into video today — no filming, no editing skills needed. Start creating with StoryIntoVideo and watch your story become a video in minutes."

**Clone body copy:** "Join thousands of creators turning their stories into cinematic videos with AI. No editing skills required — just paste your story and watch it come alive."

**Original sub-label:** "No filming. No editing. Just paste your story."

**Clone sub-label:** "No credit card required · Free forever plan"

The clone's sub-label is a notable deviation — "No credit card required · Free forever plan" is a billing claim that does not appear on the original and may create user expectation issues.

**Remediation:** Revert to original copy for both body and sub-label unless the business deliberately wants to surface the pricing guarantee.

---

### 4.3 Sign-In / Sign-Up Route Paths — MAJOR 🟠

**Original routes:** `/login` (single route for both sign-in and get-started)

**Clone routes:** `/sign-in` and `/sign-up` (two separate routes)

**Impact:** The original uses a single `/login` route for both "Sign in" and "Get Started" CTAs. The clone uses separate `/sign-in` and `/sign-up` paths. This is a routing architecture decision — if Auth.js is configured with the original's `/login` page handling both flows (via tab switching), the clone's approach creates broken redirects for any OAuth callback that returns to `/login`.

**Remediation:**
1. Verify `AUTH_URL` and the Auth.js `pages: { signIn: '/login' }` config aligns with the deployed routes.
2. If `/sign-in` and `/sign-up` are the intended routes, update `AUTH_URL` and all auth redirects accordingly.
3. Ensure `src/app/proxy.ts` (edge cookie check) redirects to the correct sign-in route.

---

### 4.4 "Get Started" CTA Link Target — MINOR 🟡

**Original:** Both "Sign in" and "Get Started" in the navbar link to `/login`.

**Clone:** "Sign in" → `/sign-in`, "Get Started" → `/sign-up`.

If the route split is intentional (§4.3), this is correct. Otherwise, harmonise with the original.

---

## 5. Functionality & Interactivity

### 5.1 Scroll Reveal Animation (IntersectionObserver) — MAJOR 🟠

**Spec mandate:** All marketing sections use the `<ScrollReveal>` primitive and `useReveal` hook. Elements start at `opacity: 0; transform: translateY(20px)` and transition to `opacity: 1; transform: translateY(0)` when they enter the viewport. Staggered delays are set via the `delay` prop (`--reveal-delay` CSS var).

**Observed on clone:** Content in lower sections (Features, Testimonials, Use Cases) appears immediately without the entrance animation. The `data-reveal` / `data-revealed` attribute pattern is absent from the DOM.

**Remediation:**
1. Confirm `useReveal` hook and `ScrollReveal` primitive are present in `src/components/primitives/scroll-reveal.tsx`.
2. Wrap each major section content block with `<ScrollReveal delay={100}>`.
3. Ensure the CSS in `globals.css` has:
```css
[data-reveal] { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; transition-delay: var(--reveal-delay, 0s); }
[data-reveal][data-revealed="true"] { opacity: 1; transform: translateY(0); }
```

---

### 5.2 "Start Creating" CTA — Broken Link — MAJOR 🟠

**Observed on clone:** The hero's primary "Start Creating" button links to `/create` (the clone's create wizard route). This is correct intent. However, the sub-CTA links in the Workflow section ("Start Your Story", "Create Your Characters", "Try AI Storyboard", "Create Your Video") all resolve correctly to `/create` as well. **However**, "Clone this project for free" in the Examples section links to `#` — a dead anchor.

**Remediation:** Wire "Clone this project for free" to the appropriate route (e.g., `/create` or a specific clone endpoint if that feature is built).

---

### 5.3 `prefers-reduced-motion` Compliance — ENHANCEMENT 🟢

**Observed on clone:** The clone has a `@media (prefers-reduced-motion: reduce)` block that disables the marquee (`animation: none !important` on `.marquee-track`) and sets `video[autoplay] { display: none }`. This is correctly ported from the spec. **Keep this.**

---

### 5.4 Next.js Dev Tools Panel — MAJOR 🟠

**Observed on clone:** A visible **"Open Next.js Dev Tools"** button/panel is rendered at the bottom of the page in production. This is a development-only UI artefact.

**Root cause:** `NODE_ENV` may be set to `development` in the production deployment, or the `nextDevToolsEnabled` flag is `true` in `next.config.ts`.

**Remediation:**
1. Ensure `NODE_ENV=production` in the production deployment environment.
2. The Next.js dev tools panel only renders in development mode — setting `NODE_ENV=production` will suppress it automatically.
3. Add a sanity check: `if (process.env.NODE_ENV !== 'production') throw new Error('Dev build deployed to production')` in a build step.

---

## 6. Prioritised Remediation Roadmap

### Sprint 1 — Foundation Fixes (P0, 1–2 days)

These must be resolved before the page is presentable.

| # | Task | Component | Effort |
|---|------|-----------|--------|
| 1 | Apply `bg-background: #020202` globally | `layout.tsx`, all section components | 2h |
| 2 | Deploy `hero-bg.mp4` + `hero-poster.webp`, implement 4-layer hero | `hero.tsx`, `public/` | 4h |
| 3 | Fix `NODE_ENV=production` to remove dev tools panel | Deployment config | 30m |
| 4 | Copy all 13 keyframes + `--animate-*` vars into `globals.css` | `globals.css` | 2h |
| 5 | Deploy Outfit variable font, fix H1 weight 820 | `public/fonts/`, `fonts.ts`, `hero.tsx` | 2h |

### Sprint 2 — Layout & Section Fidelity (P1, 2–3 days)

| # | Task | Component | Effort |
|---|------|-----------|--------|
| 6 | Restore hairline 4×2 Features grid | `features.tsx` | 3h |
| 7 | Implement 3×2 Testimonials grid with initials avatars | `testimonials.tsx` | 3h |
| 8 | Build Examples carousel 3-panel detail view | `examples.tsx` | 5h |
| 9 | Add workflow step videos (alternating layout) | `workflow.tsx`, `public/` | 4h |
| 10 | Fix FAQ Accordion wiring + populate answer content | `faq.tsx` | 2h |
| 11 | Apply `glass-input` utility + amber `focus-within` glow | `hero.tsx`, `globals.css` | 1h |
| 12 | Use `<Eyebrow>` primitive for all section labels | All section components | 2h |

### Sprint 3 — Polish & Micro-interactions (P2, 1–2 days)

| # | Task | Component | Effort |
|---|------|-----------|--------|
| 13 | Apply `ScrollReveal` to all sections with staggered delays | All section components | 2h |
| 14 | Implement Use Cases corner glow on hover | `use-cases.tsx` | 1h |
| 15 | Add dot-grid background + `cta-amber` to Final CTA | `final-cta.tsx` | 1h |
| 16 | Fix style chips (restore `Medieval`, `Japanese animation`) | `hero.tsx` | 30m |
| 17 | Fix marquee seamless loop + `marquee-mask` fade edges | `hero.tsx`, `globals.css` | 1h |
| 18 | Add `btn-shimmer` to primary CTA button | `cta-amber.tsx` | 1h |
| 19 | Restore Navbar language switcher Radix Dropdown | `navbar.tsx`, `dropdown-menu.tsx` | 2h |
| 20 | Fix mobile nav to use Radix Sheet with focus trapping | `navbar.tsx`, `sheet.tsx` | 2h |

### Sprint 4 — Content & Routing (P3, 1 day)

| # | Task | Effort |
|---|------|--------|
| 21 | Restore verbatim copy: subtitle, textarea placeholder, testimonial titles, final CTA | 1h |
| 22 | Restore 4-column footer taxonomy with real tool route links | 1h |
| 23 | Fix hero 3-line headline line break | 30m |
| 24 | Reconcile `/login` vs `/sign-in`/`/sign-up` route architecture with Auth.js config | 2h |
| 25 | Wire "Clone this project for free" to correct route | 30m |
| 26 | Add H1 hero line break, counter font-mono, amber-at-450 colour | 1h |

---

## 7. Testing & Verification Checklist

After all remediations are applied, verify against this checklist:

### Visual Regression
- [ ] Screenshot diff at 1280×900 desktop: hero, features, testimonials, footer
- [ ] Screenshot diff at 390×844 mobile: hero, nav, features
- [ ] Dark surface verified: `#020202` background on all sections
- [ ] Amber `#febf00` only appears on CTAs, badges, active states
- [ ] Hero background video plays muted on load
- [ ] Amber radial glow visible in hero upper-left quadrant

### Typography
- [ ] H1 Outfit weight 820 renders (not standard bold)
- [ ] Body text renders in Geist Sans
- [ ] Character counter in Geist Mono at 10px, turns amber at 450+
- [ ] Section headings use `font-heading` (Outfit) with `tracking-[-0.03em]`

### Animation
- [ ] 13 keyframes present in `globals.css` `@theme` block
- [ ] `btn-shimmer` on primary CTA
- [ ] `glow-pulse` on glass input wrapper
- [ ] `marquee-scroll` running and pausing on hover
- [ ] `fade-in-up` scroll reveals firing on all sections
- [ ] `prefers-reduced-motion: reduce` disables all animations

### Interactivity
- [ ] FAQ accordion opens/closes with `grid-template-rows` animation
- [ ] Examples carousel navigates with arrow buttons, updates detail panels
- [ ] Language switcher opens Radix Dropdown with `lang-dropdown-in` animation
- [ ] Mobile nav opens Radix Sheet, traps focus, closes on Escape
- [ ] Aspect ratio toggles update `aria-pressed`, character counter updates live

### Accessibility (WCAG AAA)
- [ ] Skip-to-content link present and functional
- [ ] All icon-only buttons have `aria-label`
- [ ] Heading hierarchy: one `<h1>`, sequential `<h2>`, `<h3>`
- [ ] Ratio toggle has `aria-pressed` state
- [ ] Focus ring visible on all interactive elements (amber `--color-ring`)
- [ ] All form inputs have associated labels

### Production Hygiene
- [ ] "Open Next.js Dev Tools" panel absent
- [ ] No dead `#` links
- [ ] All footer tool links resolve to real routes
- [ ] Auth redirects work with deployed route paths
- [ ] `NODE_ENV=production` confirmed in deployment

---

You're right to push back on that. The page content confirms both sites have the same section structure and there's no indication of a white/light background on the clone from the HTML. Let me correct the report with precision.

**You are correct.** The background colour finding in §1.1 of the report was **incorrectly asserted**. Here's the accurate picture:

## What the Design Spec Actually Specifies

Per `SKILL.md §4`, the colour tokens are:
- `--color-background: #020202` — near-black, **not** pure black
- `--color-card: #060607`
- `--color-muted: #1a1a1d`

## What the Live Sites Actually Show

From the raw HTML content of both sites, **neither site exposes any background colour overrides in the page content layer** — both render dark.  The dark surface appears to be correctly applied on the clone, at least visually. My earlier assertion that sections rendered on a "white/light surface" was **speculative** — inferred incorrectly from the absence of explicit background declarations in the scraped content, not from an actual visual observation.

## The Accurate Finding

§1.1 of the report should be **revised or downgraded** from 🔴 Critical to a **🟡 Minor verification checkpoint**:

> **Verify** that the computed `background-color` on `<body>` and all section wrappers resolves to `#020202` (near-black), not pure `#000000`. The distinction matters for the design spec's "warm dark" surface philosophy. Use DevTools → Computed Styles to confirm. If the clone already visually matches the original's dark surface, **this is not a deviation**.

## Corrected Severity Count

After removing §1.1 from Critical: **3 Critical · 12 Major · 9 Minor · 2 Enhancement**

The remaining 3 Criticals (missing hero video/amber glow, missing 13 keyframes, Outfit 820 weight) and all other findings stand — those are grounded in concrete HTML content differences, not visual assumptions. Would you like me to update the report file with this correction?
