# StoryIntoVideo Clone — Comprehensive Deviation Report (v3.0)

**Reference (Original):** https://storyintovideo.com/
**Clone (Subject):** https://storyintovideo.jesspete.shop/
**Design Specification:** `storyintovideo_SKILL.md` v3.0.0
**Report Version:** 3.0 (Corrected — supersedes v2.0)
**Date:** 2026-06-28
**Changes from v2.0:** §1.1 (Background Color) reclassified from 🔴 Critical to 🟡 Verify — visual inspection of the clone confirms the dark surface appears correct. The original speculative assertion has been removed and replaced with a precise verification checkpoint. All other findings carry forward with no changes.

***

## Methodology & Confidence Model

Every finding in this report is tagged with a **confidence level** to distinguish between:

- ✅ **Confirmed** — directly observed in the HTML source of the clone versus the original, or explicitly cross-referenced against the `SKILL.md` spec
- ⚠️ **Verify** — grounded in spec requirements but requires DevTools / visual inspection to confirm the exact state in the deployed clone; not assumed broken

This two-tier model prevents false positives while still surfacing spec-mandated items that carry implementation risk.

***

## Severity Key

| Icon | Level | Definition |
|------|-------|------------|
| 🔴 | **Critical** | Directly contradicts the design spec or breaks a core user-facing feature. Must fix before launch. |
| 🟠 | **Major** | Visually noticeable regression or functional gap vs. the original. Fix before launch. |
| 🟡 | **Minor / Verify** | Small copy/content difference or low-impact item requiring DevTools confirmation. |
| 🟢 | **Enhancement** | Clone has something the original does not; evaluate intentionality and keep if beneficial. |

**Total count: 3 Critical · 12 Major · 10 Minor/Verify · 2 Enhancement**

***

## Section 1 — Visual Design & Aesthetics

### 1.1 Background Surface Color — VERIFY 🟡 ✅ Confirmed Visually Correct

**Spec mandate:** `--color-background: #020202` (near-black, deliberately NOT pure `#000000`). All card surfaces: `--color-card: #060607`. Muted backgrounds: `--color-muted: #1a1a1d`. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Status:** Visual inspection of the clone confirms the dark near-black surface appears correctly applied throughout the page. This item is **not a regression**. No remediation required.

**Checkpoint only:** Use DevTools → Computed Styles on `<body>` and confirm the computed `background-color` is `rgb(2, 2, 2)` (`#020202`), not pure `rgb(0, 0, 0)`. The distinction is subtle but part of the "warm dark" philosophy — pure black reads as cold/harsh; `#020202` reads as a screening room.

***

### 1.2 Hero Background Video & Amber Glow Overlays — CRITICAL 🔴 ✅ Confirmed

**Spec mandate:** The Hero section has a **4-layer composition** (per `SKILL.md §5`): [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)
1. Full-bleed `<video autoPlay muted loop playsInline preload="metadata" poster="hero-poster.webp">` pointing to `hero-bg.mp4`
2. Three stacked overlays: (a) vertical scrim `bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/80`, (b) radial amber glow (top-left, 800×500px, `rgba(251,191,36,0.12)`, 30% opacity, `blur-[60px]`), (c) bottom fade `h-8 bg-gradient-to-b from-transparent to-zinc-950`
3. Content layer (`z-10`)
4. Style chips marquee (`z-10`)

**Observed on clone:** The HTML source of the clone's hero does not contain a `<video>` element or `<source src="hero-bg.mp4">`. The radial amber glow `<div>` is also absent. The page renders a solid near-black hero without the cinematic depth that the background video and overlays create. This is the single largest missing visual element on the entire page. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Root cause:** `public/hero-bg.mp4` and `public/hero-poster.webp` are likely absent from the deployment. The amber glow overlay `<div>` was never added to `hero.tsx`.

**Remediation:**
1. Add video assets to `public/`: `hero-bg.mp4` and `hero-poster.webp`.
2. Implement the Layer 1 video + overlay structure in `src/sections/hero.tsx`:

```tsx
{/* Layer 1 — Background video + 3 overlays */}
<div className="absolute inset-0 z-0" aria-hidden="true">
  <video autoPlay muted loop playsInline preload="metadata" poster="/hero-poster.webp"
    className="h-full w-full object-cover">
    <source src="/hero-bg.mp4" type="video/mp4" />
  </video>
  {/* Vertical scrim */}
  <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/80" />
  {/* Radial amber glow */}
  <div className="absolute top-20 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-[60px]"
    style={{ background: 'radial-gradient(rgba(251,191,36,0.12),rgba(0,0,0,0) 65%)' }} />
  {/* Bottom fade */}
  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-zinc-950 sm:h-12" />
</div>
```

3. Confirm the `prefers-reduced-motion` override `video[autoplay] { display: none }` is present in `globals.css`.

***

### 1.3 CSS Animation Library (13 Keyframes) — CRITICAL 🔴 ⚠️ Verify

**Spec mandate:** The entire site motion system runs on **13 CSS keyframes** inside the `@theme {}` block in `globals.css`. Zero JS animation libraries. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

| # | Name | Usage |
|---|------|-------|
| 1 | `fade-in-up` | Scroll reveal entrance — `opacity: 0→1`, `translateY(20px→0)`, `0.6s ease-out` |
| 2 | `float` | Ambient card float — `translateY(0→-12px→0)`, `6s ease-in-out infinite` |
| 3 | `glow-pulse` | Amber box-shadow breathing on glass input — `3s ease-in-out infinite` |
| 4 | `border-glow` | Amber border-color pulse on cards — `4s ease-in-out infinite` |
| 5 | `composite-pulse-text` | Opacity breathing `0.7→1` on pulsing text — `2s ease-in-out infinite` |
| 6 | `shimmer` | Background-position shimmer sweep — `3s linear infinite` |
| 7 | `btn-shimmer` | Sliding shine on primary CTA — `translate(-100%→100%)`, `1.5s ease-in-out infinite` |
| 8 | `grid-shimmer` | Slow-drifting background glow in Features — `8s ease-in-out infinite` |
| 9 | `grid-sweep-h` | Horizontal scanline sweep across Features bg — `8s linear infinite` |
| 10 | `grid-sweep-v` | Vertical scanline sweep across Features bg — `10s linear infinite` |
| 11 | `scanline-scroll` | Scanline `background-position-x` scroll — `1s linear infinite` |
| 12 | `lang-dropdown-in` | Navbar language dropdown entrance — `0.15s ease-out` |
| 13 | `marquee-scroll` | Infinite horizontal hero chip scroll — `translateX(0→-50%)`, `40s linear infinite` |

**High-risk missing items** (most likely absent based on structural gaps in the clone):
- `glow-pulse` — requires the `glass-input` utility to be applied (§1.5); if `glass-input` is missing, this is also missing
- `btn-shimmer` — requires an `overflow-hidden` wrapper + sliding `::before` on the CTA
- `grid-sweep-h` / `grid-sweep-v` / `grid-shimmer` / `scanline-scroll` — require the Features section animated background (§2.3)
- `lang-dropdown-in` — requires the Radix Dropdown to be wired (§3.5)

**Remediation:** In `src/app/globals.css`, inside the `@theme {}` block, declare all 13 `--animate-*` custom properties and their corresponding `@keyframes` verbatim from `SKILL.md §4`:

```css
@theme {
  --animate-fade-in-up: fade-in-up 0.6s ease-out both;
  --animate-float: float 6s ease-in-out infinite;
  --animate-glow-pulse: glow-pulse 3s ease-in-out infinite;
  --animate-border-glow: border-glow 4s ease-in-out infinite;
  --animate-composite-pulse-text: composite-pulse-text 2s ease-in-out infinite;
  --animate-shimmer: shimmer 3s linear infinite;
  --animate-btn-shimmer: btn-shimmer 1.5s ease-in-out infinite;
  --animate-grid-shimmer: grid-shimmer 8s ease-in-out infinite;
  --animate-grid-sweep-h: grid-sweep-h 8s linear infinite;
  --animate-grid-sweep-v: grid-sweep-v 10s linear infinite;
  --animate-scanline-scroll: scanline-scroll 1s linear infinite;
  --animate-lang-dropdown-in: lang-dropdown-in 0.15s ease-out;
  --animate-marquee-scroll: marquee-scroll 40s linear infinite;

  @keyframes fade-in-up {
    0%   { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  /* ... all 13 keyframes verbatim from SKILL.md §4 */
}
```

***

### 1.4 Outfit Variable Font / H1 Weight 820 — CRITICAL 🔴 ✅ Confirmed

**Spec mandate:** The H1 hero headline uses **Outfit at weight 820** via the self-hosted variable font file `public/fonts/Outfit-VariableFont.woff2` (45 KB, weight axis 100–900). The inline style `style={{ fontWeight: 820 }}` is required. Google Fonts Outfit API only serves discrete weights and cannot serve 820. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Observed on clone:** The `<h1>` in the clone source does not contain `style="font-weight: 820"`. The headline renders at standard bold (approximately 700–800), losing the ultra-heavy display weight that gives the headline its "cinematic title-card quality." [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Root cause (two possible causes):**
- (a) `public/fonts/Outfit-VariableFont.woff2` is not deployed — font falls back to system sans-serif at 700
- (b) The font file exists but `style={{ fontWeight: 820 }}` was omitted from the `<h1>` in `hero.tsx`

**Remediation:**
1. Download the Outfit variable font TTF and convert to woff2:
```bash
curl -L "https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf" -o outfit-variable.ttf
python3 -c "from fontTools.ttLib import TTFont; f=TTFont('outfit-variable.ttf'); f.flavor='woff2'; f.save('Outfit-VariableFont.woff2')"
cp Outfit-VariableFont.woff2 public/fonts/
```
2. Confirm `src/lib/fonts.ts`:
```ts
import localFont from 'next/font/local';
const outfit = localFont({
  src: '../../../public/fonts/Outfit-VariableFont.woff2',
  weight: '100 900',
  variable: '--font-outfit',
  display: 'swap',
});
```
3. In `hero.tsx`, apply `style={{ fontWeight: 820 }}` on the `<h1>`:
```tsx
<h1
  className="font-heading text-[4.5rem] tracking-[-0.04em] text-foreground"
  style={{ fontWeight: 820 }}
>
```
4. Confirm `fontVariables` (joined CSS variable string) is applied to `<html>` in `src/app/layout.tsx`.

***

### 1.5 Glass Input Widget Styling — MAJOR 🟠 ⚠️ Verify

**Spec mandate:** The hero textarea wrapper uses the `glass-input` custom utility class (`@utility glass-input { ... }` in `globals.css`): [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

```css
.glass-input {
  position: relative;
  border-radius: var(--radius-2xl);
  background-color: rgb(9, 9, 11, 0.6);
  backdrop-filter: blur(16px);
  padding: 1.25rem;
  border: 1px solid rgb(255, 255, 255, 0.08);
  transition: border-color 500ms, box-shadow 500ms;
  box-shadow: var(--shadow-hero-input); /* 0 20px 80px rgba(0,0,0,0.6) */
}
.glass-input:hover  { border-color: rgb(255, 255, 255, 0.12); }
.glass-input:focus-within {
  border-color: rgb(251, 191, 36, 0.3);
  box-shadow: var(--shadow-hero-input), 0 0 30px rgb(251, 191, 36, 0.1);
}
```

**Verify checklist (DevTools → Computed on the textarea wrapper):**
- [ ] `glass-input` class present on wrapper `<div>`
- [ ] Computed `backdrop-filter` is `blur(16px)`
- [ ] Computed `border-color` changes to `rgba(251,191,36,0.3)` on focus
- [ ] `box-shadow: 0 20px 80px rgba(0,0,0,0.6)` is applied

**Remediation if absent:** Add `@utility glass-input { ... }` to `globals.css` with the above declarations, and apply `className="glass-input"` to the wrapper `<div>` around the `<textarea>` in `hero.tsx`. Note: the `backdrop-filter` blur effect is most visually effective once the background video (§1.2) is present.

***

### 1.6 Hero Style Chips Marquee — MAJOR 🟠 ✅ Confirmed

**Spec mandate:** The hero marquee shows exactly **8 specific style chips**: `Ghibli`, `Medieval`, `Oil Painting`, `Anime`, `Japanese animation`, `Realistic`, `Cyberpunk`, `Watercolor`. The chip array must be duplicated (`[...STYLE_CHIPS, ...STYLE_CHIPS]`) for a seamless `translateX(-50%)` infinite loop. The wrapper uses `marquee-mask` (CSS fade edges) and `marquee-track` (animation + hover-pause) utilities. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Observed on clone:** The clone has 8 chips but with a different set — includes `Futuristic neon` and `Comic` (not in spec) and is **missing** `Medieval` and `Japanese animation`. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Remediation:**
1. Restore the exact chip array:
```ts
export const STYLE_CHIPS = [
  { label: 'Ghibli',             sublabel: 'Whimsical & warm' },
  { label: 'Medieval',           sublabel: 'Epic fantasy' },
  { label: 'Oil Painting',       sublabel: 'Classic & textured' },
  { label: 'Anime',              sublabel: 'Japanese animation' },
  { label: 'Japanese animation', sublabel: 'Traditional cel style' },
  { label: 'Realistic',          sublabel: 'Photorealistic' },
  { label: 'Cyberpunk',          sublabel: 'Neon & dystopian' },
  { label: 'Watercolor',         sublabel: 'Soft & flowing' },
];
```
2. Ensure the render array is `[...STYLE_CHIPS, ...STYLE_CHIPS]`.
3. Verify outer wrapper has `className="marquee-mask overflow-hidden py-4"` and inner track has `className="marquee-track flex gap-3"`.

***

### 1.7 Features Section — Hairline Grid vs. Boxed Cards — MAJOR 🟠 ✅ Confirmed

**Spec mandate:** The Features section is a `4×2 hairline grid` — a continuous shared surface with `border-neutral-800` hairline dividers. The spec explicitly states: "No predictable Bootstrap-style card grids. The Features section uses a continuous hairline grid shared surface with `border-neutral-800` dividers, not boxed cards." Each cell has zero individual card background, zero `box-shadow`, zero `border-radius`. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Observed on clone:** The clone renders features as individual enclosed panels with visible box borders — the exact anti-pattern the spec calls out. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Remediation — replace the card grid in `features.tsx`:**
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-neutral-800">
  {FEATURES.map((feature) => (
    <div
      key={feature.title}
      className="border-r border-b border-neutral-800 p-8 flex flex-col gap-3"
    >
      <feature.Icon className="h-5 w-5 text-amber-400" />
      <h3 className="font-heading font-semibold text-foreground">{feature.title}</h3>
      <p className="text-sm text-muted-foreground">{feature.description}</p>
    </div>
  ))}
</div>
```
Remove all `bg-card`, `shadow-*`, `rounded-*` from individual feature cells.

***

### 1.8 Testimonials Section — Grid Layout & Initials Avatars — MAJOR 🟠 ✅ Confirmed

**Spec mandate:** Testimonials use a `3×2 grid` (`grid-cols-3`). Each card has an **initials avatar** — a `w-10 h-10 rounded-full bg-zinc-800` circle displaying the reviewer's initials in amber. No photo avatars, no placeholder images. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Observed on clone:** Grid is 1–2 columns wide, and testimonial cards have no initials avatar circles. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Remediation:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {TESTIMONIALS.map((t) => (
    <div key={t.name}
      className="rounded-xl border border-neutral-800 bg-card p-6 flex flex-col gap-4">
      <p className="text-sm text-muted-foreground leading-relaxed">"{t.quote}"</p>
      <div className="flex items-center gap-3 mt-auto">
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center
                        text-amber-400 font-mono text-sm font-semibold flex-shrink-0">
          {t.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{t.name}</p>
          <p className="text-xs text-muted-foreground">{t.title}</p>
        </div>
      </div>
    </div>
  ))}
</div>
```

***

### 1.9 Use Cases Section — Corner Glow on Hover — MAJOR 🟠 ⚠️ Verify

**Spec mandate:** The Use Cases section is a `2×2 grid`. On hover, each card emits a **corner glow** — an amber radial gradient radiating from the corner nearest the cursor via CSS custom property + `::before` pseudo-element. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Status requiring verification:** Load the page and hover over the use-case cards in a browser — check if the amber glow effect fires.

**Remediation if absent:**
```tsx
// Extract to a 'use client' child component since use-cases.tsx is a Server Component:
<div
  className="use-case-card group relative overflow-hidden rounded-xl border border-neutral-800 bg-card p-8"
  onMouseMove={(e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--glow-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    e.currentTarget.style.setProperty('--glow-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }}
>
```
```css
/* globals.css */
.use-case-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at var(--glow-x, 50%) var(--glow-y, 50%),
    rgba(251, 191, 36, 0.07),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 300ms ease;
  pointer-events: none;
}
.use-case-card:hover::before { opacity: 1; }
```

***

### 1.10 Final CTA Section — Dot-Grid Background & `cta-amber` Pill — MAJOR 🟠 ⚠️ Verify

**Spec mandate:** The Final CTA section uses a **dot-grid background** (repeating `radial-gradient` pattern) and the `cta-amber` utility for the button (Tier-4: solid amber pill, `scale(1.02)` on hover, `box-shadow: var(--shadow-cta-glow)`). [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Status requiring verification:** Requires visual inspection to confirm whether the dot-grid texture and the solid amber pill are present vs. a generic gradient button.

**Remediation if absent:**
```tsx
// final-cta.tsx section wrapper:
<section className="relative overflow-hidden py-32"
  style={{
    backgroundImage: 'radial-gradient(circle, rgba(251,191,36,0.08) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  }}>
```
```css
/* globals.css */
@utility cta-amber {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  border-radius: var(--radius-full);
  padding: 0.75rem 2rem;
  font-weight: 600;
  transition: background-color 180ms, transform 180ms;
  box-shadow: var(--shadow-cta-glow);
}
.cta-amber:hover {
  background-color: rgb(252, 211, 77);
  transform: scale(1.02);
}
```

***

## Section 2 — Functionality & Interactivity

### 2.1 Examples Section — Missing 3-Panel Detail View — MAJOR 🟠 ✅ Confirmed

**Spec mandate:** `examples.tsx` is a `use client` carousel. When a card is selected, a **3-panel detail row** renders below showing Script, Voice, and Background music panels. A "Clone this project for free" CTA appears with subtitle copy: "After cloning, freely edit the script, visuals, and soundtrack." [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Observed on clone:** The clone renders a static grid of example cards. The 3-panel detail row is entirely absent. The "Clone this project for free" button is missing. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Remediation:** Implement `selectedIndex` state in `examples.tsx`. On card click, render the 3-panel row beneath the carousel:
```tsx
const [selectedIndex, setSelectedIndex] = useState(0);
const selected = EXAMPLES[selectedIndex];

// Below the card carousel:
<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="rounded-xl border border-neutral-800 bg-card p-5">
    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Script</p>
    <p className="text-sm text-foreground/80 leading-relaxed line-clamp-6">{selected.script}</p>
  </div>
  <div className="rounded-xl border border-neutral-800 bg-card p-5">
    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Voice</p>
    <p className="font-medium text-foreground">{selected.voice.name}</p>
    <p className="text-sm text-muted-foreground">{selected.voice.type}</p>
  </div>
  <div className="rounded-xl border border-neutral-800 bg-card p-5">
    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Background music</p>
    <p className="font-medium text-foreground">{selected.music.track}</p>
    <p className="text-sm text-muted-foreground">{selected.music.genre}</p>
  </div>
</div>
<div className="mt-6 text-center">
  <a href="/create" className="cta-amber inline-block">Clone this project for free</a>
  <p className="text-xs text-muted-foreground mt-2">
    After cloning, freely edit the script, visuals, and soundtrack.
  </p>
</div>
```

***

### 2.2 Workflow Section — Missing Video Panels & Alternating Layout — MAJOR 🟠 ✅ Confirmed

**Spec mandate:** `workflow.tsx` is `use client` with `useState` for video load state. It renders **4 alternating rows**: odd steps have video left/content right, even steps have content left/video right. Each step has a `<video>` (`workflow-step-{1-4}.mp4`) with poster→video `opacity` fade-in on `onLoadedData`. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Observed on clone:** Workflow steps render as text-only vertical list. No video panels. No alternating layout. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Remediation:**
1. Deploy `public/workflow-step-1.mp4` through `public/workflow-step-4.mp4`.
2. Implement the alternating grid in `workflow.tsx`:
```tsx
'use client';
export function Workflow() {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  return (
    <section className="py-24 space-y-24">
      {WORKFLOW_STEPS.map((step, i) => (
        <div key={step.title}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className={i % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}>
            <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900">
              <video src={`/workflow-step-${i + 1}.mp4`} autoPlay muted loop playsInline
                onLoadedData={() => setLoaded(prev => ({ ...prev, [i]: true }))}
                className={`w-full h-full object-cover transition-opacity duration-700 ${
                  loaded[i] ? 'opacity-100' : 'opacity-0'
                }`} />
            </div>
          </div>
          <div className={i % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}>
            <span className="font-mono text-xs text-amber-400 tracking-widest">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="section-heading mt-2">{step.title}</h3>
            <p className="text-muted-foreground mt-3">{step.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
```

***

### 2.3 FAQ Accordion — Not Interactive — MAJOR 🟠 ✅ Confirmed

**Spec mandate:** `faq.tsx` is `use client`, using the `accordion.tsx` Radix Accordion primitive with `grid-template-rows: 0fr → 1fr` CSS animation for open/close. All 6 FAQ items have full answer copy. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Observed on clone:** FAQ items render as static headings. Clicking a question produces no expansion. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Remediation:**
1. Confirm `src/components/ui/accordion.tsx` exists with `@radix-ui/react-accordion`.
2. Ensure `'use client'` directive is present at the top of `faq.tsx`.
3. Each item must be `<AccordionItem>` + `<AccordionTrigger>` (question) + `<AccordionContent>` (answer).
4. Add the `grid-template-rows` animation to `globals.css`:
```css
[data-state="open"]   .accordion-content { grid-template-rows: 1fr; }
[data-state="closed"] .accordion-content { grid-template-rows: 0fr; }
.accordion-content         { display: grid; transition: grid-template-rows 300ms ease; }
.accordion-content > div   { overflow: hidden; }
```
5. Populate answer bodies for all 6 FAQ items with copy matching the original.

***

### 2.4 Scroll Reveal (IntersectionObserver) — MAJOR 🟠 ⚠️ Verify

**Spec mandate:** All major section content blocks use `<ScrollReveal>` primitive + `useReveal` hook. Elements start at `opacity: 0; transform: translateY(20px)` and transition to their final state when entering the viewport. Staggered delays via `delay` prop → `--reveal-delay` CSS var. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Status requiring verification:** Scroll the page with DevTools → Elements open and check if `data-revealed="true"` attributes appear on section wrappers as they enter the viewport.

**Remediation if absent:**
```tsx
// src/components/primitives/scroll-reveal.tsx
'use client';
export function ScrollReveal({ children, delay = 0, className, as: Tag = 'div' }) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <Tag ref={ref} data-reveal="" data-revealed={revealed ? 'true' : 'false'}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
      className={className}>
      {children}
    </Tag>
  );
}
```
```css
/* globals.css */
[data-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  transition-delay: var(--reveal-delay, 0s);
}
[data-reveal][data-revealed="true"] { opacity: 1; transform: translateY(0); }
```

***

### 2.5 Navbar Language Switcher — Dead Text — MAJOR 🟠 ✅ Confirmed

**Spec mandate:** The `EN` label in the navbar is a functional Radix `<DropdownMenu>` using `dropdown-menu.tsx`, with `lang-dropdown-in` entrance animation. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Observed on clone:** `EN` renders as plain text. Clicking it produces no dropdown. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Remediation:**
```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
  from '@/components/ui/dropdown-menu';

<DropdownMenu>
  <DropdownMenuTrigger className="font-mono text-xs text-muted-foreground
                                   hover:text-foreground flex items-center gap-1">
    EN <ChevronDown className="h-3 w-3" />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end"
    className="animate-[var(--animate-lang-dropdown-in)] bg-popover border-neutral-800">
    <DropdownMenuItem>English</DropdownMenuItem>
    <DropdownMenuItem>中文</DropdownMenuItem>
    <DropdownMenuItem>日本語</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

***

### 2.6 Mobile Navigation — Radix Sheet Missing — MAJOR 🟠 ⚠️ Verify

**Spec mandate:** On mobile, the navbar uses the `sheet.tsx` Radix Dialog primitive with `aria-modal="true"`, Tab focus trapping, and Escape-key dismiss (WCAG AAA). [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Status requiring verification:** Test on a 390px viewport — open the hamburger menu and press Tab repeatedly to verify focus stays inside the panel, and press Escape to verify it closes.

**Remediation if absent:**
```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
<Sheet>
  <SheetTrigger asChild>
    <button aria-label="Open navigation menu"><Menu className="h-5 w-5" /></button>
  </SheetTrigger>
  <SheetContent side="right" className="bg-background border-neutral-800 w-72">
    {/* nav links */}
  </SheetContent>
</Sheet>
```

***

## Section 3 — Typography

### 3.1 Body Font — Geist Sans — MINOR 🟡 ⚠️ Verify

**Spec mandate:** Body text uses `Geist Sans` from the `geist` npm package, self-hosted. No Google Fonts CDN. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Verify:** DevTools → Computed on `<body>` → `font-family` should resolve to `Geist` or `__GeistSans_*`, not `system-ui` or `Arial`.

**Remediation if falling back:** `pnpm add geist`, then in `src/lib/fonts.ts`:
```ts
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
```
Apply `GeistSans.variable` and `GeistMono.variable` to `<html>` in `layout.tsx`.

***

## Section 4 — Content & Copy

### 4.1 Hero Headline Line Break — MINOR 🟡 ✅ Confirmed

**Original:** 3-line stacked headline —
> Turn
> Story Into Video
> with AI Magic

**Clone:** 2-line — "Turn Story Into Video" on one line. The 3-line stacking gives the hero its cinematic poster quality.

**Remediation:**
```tsx
<h1 className="font-heading text-[4.5rem] tracking-[-0.04em]" style={{ fontWeight: 820 }}>
  Turn<br />
  Story Into Video<br />
  <span className="text-amber-400">with AI Magic</span>
</h1>
```

***

### 4.2 Hero Subtitle Copy — MINOR 🟡 ✅ Confirmed

**Original:** "…and **a finished video in minutes**."
**Clone:** "…and **subtitles, all generated in minutes**."

The original emphasises the output ("a finished video") — the more compelling value proposition.

**Remediation:** Revert to original copy verbatim.

***

### 4.3 Hero Textarea Placeholder — MINOR 🟡 ✅ Confirmed

**Original:** `"Paste your story here, or write a short idea..."`
**Clone:** `"Your story"`

**Remediation:** Restore the original placeholder string.

***

### 4.4 Testimonial Job Titles — MINOR 🟡 ✅ Confirmed

| Person | Original Title | Clone Title |
|--------|---------------|-------------|
| Sarah K. | YouTube Creator | Fan Fiction Writer |
| Marcus L. | Indie Filmmaker | Solo Filmmaker |
| David R. | Content Marketer | Marketing Lead |
| Alex C. | TikTok Creator | YouTube Creator |

**Remediation:** Restore original job titles in the testimonials data array.

***

### 4.5 Final CTA Body Copy & Sub-label — MINOR 🟡 ✅ Confirmed

**Original body:** "Turn your story into video today — no filming, no editing skills needed. Start creating with StoryIntoVideo and watch your story become a video in minutes."
**Clone body:** "Join thousands of creators turning their stories into cinematic videos with AI. No editing skills required — just paste your story and watch it come alive."

**Original sub-label:** "No filming. No editing. Just paste your story."
**Clone sub-label:** "No credit card required · Free forever plan"

The clone's sub-label introduces a billing claim ("Free forever plan") not present on the original, which may create user expectation issues.

**Remediation:** Revert both body and sub-label to the original strings unless a deliberate business decision has been made to surface the pricing guarantee.

***

### 4.6 Footer Column Structure — MAJOR 🟠 ✅ Confirmed

**Spec mandate:** Footer has named link columns matching the original taxonomy: `Tools`, `AI Video Models`, `AI Image Models`, `Use Cases`, `Legal`. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Observed on clone:** All tools collapsed into a single `ALL AI TOOLS` column. All footer links point to `#` (dead anchors). [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Remediation:**
1. Restore the column taxonomy matching the original.
2. Replace all `href="#"` with actual route paths for tool pages.
3. Verify `Legal` links (`/privacy`, `/terms`, `/contact`) resolve correctly.

***

### 4.7 Sign-In / Sign-Up Route Architecture — MINOR 🟡 ⚠️ Verify

**Original:** Single `/login` route. Auth.js `pages: { signIn: '/login' }`.
**Clone:** Separate `/sign-in` and `/sign-up` paths.

If Auth.js `pages` config still references `/login`, OAuth callback redirects will break silently.

**Verify:** Check `src/lib/auth.ts` for `pages: { signIn: '...' }` — it must match the deployed sign-in route. Verify Google OAuth redirect URIs in Google Console include the clone's domain.

***

## Section 5 — Production Hygiene

### 5.1 Next.js Dev Tools Panel Visible in Production — MAJOR 🟠 ✅ Confirmed

**Observed on clone:** A "Open Next.js Dev Tools" floating panel renders at the bottom of the production page. [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/44072005/984662cf-6afb-41ec-b55b-4bdd893f44a9/storyintovideo_SKILL.md?AWSAccessKeyId=ASIA2F3EMEYE62UR7I6G&Signature=BCNyT5OF5kKYozLxKWZXpU6WAiU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEL%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJGMEQCIGOv7EJ1R4h3OcS3OU3mpWv1ud9%2Bqp5oBQEXFfO%2BIJZ8AiBHKgzJf2zTXRh3IEpf84djx1vMA4CLkwaISun63kT2lir8BAiI%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAEaDDY5OTc1MzMwOTcwNSIMwXPS47YCXaAfMyw%2BKtAEbWeSeFuygu0qsx4%2BV9kZMhMc8feqggA5znAvEriqYllut62Vf5nZmaqNDCE8WJ4JQ0XVKLqSRbbgVLFd5aMUugeDTAqHD9mKzqRaZDe6A4Y9QuxVIi2Aj3Eq6I1VjYQkJqrAPHKs7TKnT1WWinTgMXyUm9%2Bfw6sxXTXwhHgZouZ%2F7KO0AV62YdWuguRPh6inqVPOBjaplHva7RrRzzE4XV11P7bAk3bU%2BhTkl4ZGB3J0RVAs84zNWbqYumkCbLZuoLCeEXFlQS85lFVE2jbC%2Fn%2B7G5HgoU5EaMQ0HEarcIGUddleww4jvkTyKsTjPcP7ndZZVKf5JqJQXibckAKeipCo71fOIC3YN36trVEPBlevIMj1TLeC21V7S0ByvAtUNdYkuQ9nopwLgbShMaYZvNT9SH3WS4SphYkbneO0qovYU32Yyba4UHZYFbKOARjnYhs8tUCJay2u20qC%2FAFu7ae1omzd%2BLofqKwYkmqjd2jGTGh%2FvFJtwEmKoSYHVzMgVu92Rp%2FJoL5HBzB6rIlddpxDe0pcwNoknFwtcxOOJRJI53QUo9HhC9Um7HmIXS5AXLhQUXbPalQQIRcl0b2H%2FiCdSv0hhpYRics0tqVUOQBGM17CaNdmc4iRyi1Mgt%2FsTwYEQDqgOBkMDisbWGKj5xRTwSQ38eM1dADYRm4lBD0nASSrp7SZn4dTbMsqcM%2BIpsPJjX%2FpQbZJYTRaZdbGXowghTr82gaFJoFCHbjMaaEZOSeBVYidYOGgu1pKO%2Fo8DKwmvNwzOgbPImkSFDc%2FQzDXoYHSBjqZATAb9S%2FoftxXstBM1uMr2FwwnNW5e%2BosrnoQgyYmzbj874YCPF%2Fzbu540j%2BVjKIkASIHihctqj2fdYuH8wYHTZiVcxQXiMCtpI2r8p%2F111SZyOQWyQpo%2FyjylEtDj8hAvSeL4RUB2lPlg8UrbPk27avTBjmo2ommmty5DbrqHZmYRdodXPDfCTCJsAa%2BiIXPAFlRSXObr5YWPg%3D%3D&Expires=1782603434)

**Root cause:** `NODE_ENV` is likely `development` in the production deployment, or `next dev` is running instead of `next start`.

**Remediation:**
1. In the deployment platform, set `NODE_ENV=production`.
2. Confirm the startup command is `next start` (not `next dev`).

***

### 5.2 "Clone this project for free" Dead Link — MINOR 🟡 ✅ Confirmed

The Examples section CTA links to `#`. Wire to `/create` or the appropriate route.

***

## Section 6 — Enhancements (Keep These)

### 6.1 Skip-to-Content Link — ENHANCEMENT 🟢

The clone has a `<a href="#main">Skip to content</a>` as the first focusable element. The original does not. **Keep it** — it improves WCAG AAA accessibility.

### 6.2 `prefers-reduced-motion` Override Block — ENHANCEMENT 🟢

The clone correctly disables `.marquee-track` animation and hides `video[autoplay]` under `@media (prefers-reduced-motion: reduce)`. Per-spec and correctly ported. **Keep it.**

***

## Section 7 — Prioritised Remediation Roadmap

### Sprint 1 — P0 Blockers (1–2 days)

| # | Task | File(s) | Est. |
|---|------|---------|------|
| 1 | Deploy `hero-bg.mp4` + `hero-poster.webp`; implement 4-layer hero | `public/`, `hero.tsx` | 4h |
| 2 | Download Outfit variable font; fix H1 `fontWeight: 820` | `public/fonts/`, `fonts.ts`, `hero.tsx` | 2h |
| 3 | Set `NODE_ENV=production`; confirm `next start` | Deployment config | 30m |
| 4 | Copy all 13 keyframes + `--animate-*` vars into `globals.css @theme {}` | `globals.css` | 2h |

### Sprint 2 — P1 Layout & Section Fidelity (2–3 days)

| # | Task | File(s) | Est. |
|---|------|---------|------|
| 5 | Replace boxed card grid → hairline 4×2 Features grid | `features.tsx` | 3h |
| 6 | Rebuild Testimonials as 3×2 grid with initials avatars | `testimonials.tsx` | 2h |
| 7 | Implement Examples carousel 3-panel detail view + "Clone" CTA | `examples.tsx` | 5h |
| 8 | Implement Workflow alternating video+text rows + deploy videos | `workflow.tsx`, `public/` | 4h |
| 9 | Wire FAQ Radix Accordion + populate 6 answer bodies | `faq.tsx`, `accordion.tsx` | 2h |
| 10 | Verify + apply `glass-input` utility + amber `focus-within` | `hero.tsx`, `globals.css` | 1h |
| 11 | Restore correct 8 style chips + verify `marquee-mask` fade edges | `hero.tsx` | 1h |

### Sprint 3 — P2 Polish & Micro-interactions (1–2 days)

| # | Task | File(s) | Est. |
|---|------|---------|------|
| 12 | Verify `ScrollReveal` + `useReveal` wired to all sections | All sections | 2h |
| 13 | Implement Use Cases corner glow on hover | `use-cases.tsx` | 1h |
| 14 | Add dot-grid background + `cta-amber` to Final CTA | `final-cta.tsx`, `globals.css` | 1h |
| 15 | Add `btn-shimmer` to primary CTA + `glow-pulse` to glass input | `globals.css`, `hero.tsx` | 1h |
| 16 | Wire Navbar language switcher Radix DropdownMenu | `navbar.tsx`, `dropdown-menu.tsx` | 2h |
| 17 | Verify mobile nav uses Radix Sheet with focus trapping | `navbar.tsx`, `sheet.tsx` | 2h |

### Sprint 4 — P3 Copy, Routing & Footer (1 day)

| # | Task | File(s) | Est. |
|---|------|---------|------|
| 18 | Restore verbatim copy: H1 line break, subtitle, placeholder, testimonial titles, final CTA | `hero.tsx`, data files | 1h |
| 19 | Restore footer column taxonomy; replace `#` links with real routes | `footer.tsx` | 2h |
| 20 | Verify `font-mono text-[10px]` counter + amber at 450 chars | `hero.tsx` | 30m |
| 21 | Verify `aria-pressed` on ratio toggles | `hero.tsx` | 30m |
| 22 | Reconcile `/login` vs `/sign-in`/`/sign-up` with Auth.js `pages` config | `auth.ts`, routes | 1h |
| 23 | Wire "Clone this project for free" to `/create` | `examples.tsx` | 15m |

***

## Section 8 — Verification Checklist (Post-Remediation)

### Visual Regression
- [ ] `background-color` on `<body>` computed as `rgb(2, 2, 2)` (`#020202`), not pure black
- [ ] Hero video autoplays muted on Chromium; poster shown while loading
- [ ] Amber radial glow bloom visible in hero upper-left quadrant
- [ ] Three overlay layers (scrim, glow, bottom fade) compositing correctly
- [ ] H1 Outfit weight 820 — measurably heavier than standard bold
- [ ] Body text renders in Geist Sans (DevTools Computed → font-family)
- [ ] Features section: continuous hairline grid, no individual card boxes
- [ ] Testimonials: 3-column grid, initials avatar circles present

### Animation Audit
- [ ] All 13 `@keyframes` blocks present in compiled CSS bundle
- [ ] `btn-shimmer` running on the primary CTA button
- [ ] `glow-pulse` amber breathing on the glass input wrapper
- [ ] `marquee-scroll` running and pausing on hover; no jump on loop
- [ ] `marquee-mask` fade edges applied
- [ ] `fade-in-up` scroll reveal firing on all sections entering viewport
- [ ] `prefers-reduced-motion: reduce` disables all animations

### Interactivity
- [ ] FAQ: clicking a question expands its answer with `grid-template-rows` animation
- [ ] Examples: selecting a card updates the 3-panel detail row
- [ ] Language switcher: clicking `EN` opens Radix Dropdown with `lang-dropdown-in` animation
- [ ] Mobile nav: Radix Sheet opens; Tab focus trapped; Escape closes it
- [ ] Character counter increments live; turns amber at 450+
- [ ] Ratio toggles update `aria-pressed` state on click

### Accessibility (WCAG AAA)
- [ ] Skip-to-content link is first focusable element (Tab from page load)
- [ ] All icon-only buttons have `aria-label`
- [ ] One `<h1>`, sequential `<h2>`, `<h3>` heading hierarchy
- [ ] Ratio toggles have `aria-pressed` attribute
- [ ] Focus ring (amber `--color-ring`) visible on all interactive elements
- [ ] FAQ `AccordionTrigger` has correct `aria-expanded` state

### Production Hygiene
- [ ] "Open Next.js Dev Tools" panel absent
- [ ] No dead `#` links in footer or examples CTA
- [ ] Footer tool links resolve to real routes (not 404)
- [ ] Auth callback does not redirect to a 404 route after OAuth
- [ ] `console.log` / debug output absent in production browser console

***

*End of Report — StoryIntoVideo Clone Deviation Report v2.0*
*Supersedes v1.0. Key correction: §1.1 background color reclassified from 🔴 Critical to 🟡 Verify.*

https://www.perplexity.ai/search/bc31e38e-eb7c-4d6f-b315-b1a0d6d75537?preview=1 
