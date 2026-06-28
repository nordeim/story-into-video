## StoryIntoVideo — Design Language Replication

**Document Version:** 1.0  
**Date:** 2026-06-26  
**Author:** Frontend Architect & Avant-Garde UI Designer  
**Status:** Production-Ready Design Specification

---

## 1. Project Overview

### 1.1 Site Purpose & Positioning
StoryIntoVideo is an AI-powered SaaS platform that transforms written stories, novels, and scripts into fully produced video content. The platform handles the entire pipeline: script analysis → character generation → storyboard creation → voiceover → final video export. The marketing site serves as the primary conversion funnel, while the app dashboard is where creators execute their projects.

### 1.2 Target Audience
- **Primary:** Independent content creators, fan fiction writers, indie filmmakers, and social media storytellers
- **Secondary:** Marketing agencies, educators, and small production studios
- **Tertiary:** Hobbyists exploring AI video generation

### 1.3 Design Philosophy Summary
> **"Cinematic Darkness with Amber Warmth"**

The design language operates on a deliberate contrast: a deep, immersive dark environment (evoking a movie theater or editing suite) punctuated by warm amber/gold accents that signal action, creativity, and premium quality. The aesthetic rejects the sterile "AI tool" look in favor of something that feels like a professional creative studio — dark, focused, and intentionally dramatic. The visual hierarchy is built on luminosity: the darkest backgrounds make the AI-generated artwork and amber CTAs glow with cinematic intensity.

### 1.4 Conceptual Direction
- **Tone:** Dark luxury meets creative energy — like stepping into a high-end post-production studio
- **Differentiation:** Unlike generic SaaS landing pages with light backgrounds and blue accents, StoryIntoVideo commits fully to darkness. The hero isn't a gradient — it's pure black canvas where AI-generated art becomes the light source
- **The One Unforgettable Thing:** The amber-gold CTA buttons against pitch-black backgrounds create a "theater marquee" effect that feels premium and urgent

---

## 2. Visual Identity System

### 2.1 Color Palette

#### Primary Colors
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-bg-primary` | `#0A0A0A` | `rgb(10, 10, 10)` | Main page background, deepest layer |
| `--color-bg-secondary` | `#111111` | `rgb(17, 17, 17)` | Card backgrounds, elevated surfaces |
| `--color-bg-tertiary` | `#1A1A1A` | `rgb(26, 26, 26)` | Input fields, subtle containers |
| `--color-bg-elevated` | `#1E1E1E` | `rgb(30, 30, 30)` | Hover states, dropdowns, modals |

#### Accent Colors (Amber/Gold System)
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-accent-primary` | `#F5A623` | `rgb(245, 166, 35)` | Primary CTAs, active states, highlights |
| `--color-accent-hover` | `#FFB84D` | `rgb(255, 184, 77)` | CTA hover states |
| `--color-accent-subtle` | `#F5A62320` | `rgba(245, 166, 35, 0.12)` | Subtle accent backgrounds, badges |
| `--color-accent-glow` | `#F5A62340` | `rgba(245, 166, 35, 0.25)` | Glow effects, focus rings |

#### Text Colors
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-text-primary` | `#FFFFFF` | `rgb(255, 255, 255)` | Headlines, primary content |
| `--color-text-secondary` | `#A0A0A0` | `rgb(160, 160, 160)` | Body text, descriptions |
| `--color-text-tertiary` | `#666666` | `rgb(102, 102, 102)` | Captions, metadata, placeholders |
| `--color-text-muted` | `#444444` | `rgb(68, 68, 68)` | Disabled states, dividers |

#### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | `#22C55E` | Success states, confirmations |
| `--color-error` | `#EF4444` | Error states, validation failures |
| `--color-warning` | `#F59E0B` | Warnings, caution states |
| `--color-info` | `#3B82F6` | Informational highlights (rarely used) |

#### Gradient Definitions
```css
/* Hero ambient glow — subtle radial gradient behind content */
--gradient-hero-ambient: radial-gradient(ellipse at 50% 0%, rgba(245, 166, 35, 0.08) 0%, transparent 60%);

/* CTA button gradient — warm amber depth */
--gradient-cta: linear-gradient(135deg, #F5A623 0%, #E8941F 100%);

/* Card subtle edge highlight */
--gradient-card-edge: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%);
```

### 2.2 Typography System

#### Font Families
| Role | Font | Weights | Fallback |
|------|------|---------|----------|
| **Headlines** | `Inter` | 600, 700, 800 | system-ui, sans-serif |
| **Body** | `Inter` | 400, 500 | system-ui, sans-serif |
| **Monospace** | `JetBrains Mono` | 400, 500 | monospace |

> **Design Rationale:** Inter was chosen for its exceptional legibility at small sizes on dark backgrounds and its neutral, modern character that doesn't compete with the AI-generated artwork. The geometric precision feels "technical" without being cold.

#### Type Scale
| Token | Size | Weight | Line-Height | Letter-Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `text-hero` | `clamp(2.5rem, 5vw, 4rem)` | 800 | 1.1 | -0.03em | Hero headline |
| `text-h1` | `clamp(2rem, 4vw, 3rem)` | 700 | 1.15 | -0.02em | Section headlines |
| `text-h2` | `clamp(1.5rem, 3vw, 2.25rem)` | 700 | 1.2 | -0.01em | Subsection headlines |
| `text-h3` | `1.25rem` (20px) | 600 | 1.3 | 0 | Card titles, feature names |
| `text-body-lg` | `1.125rem` (18px) | 400 | 1.6 | 0 | Lead paragraphs |
| `text-body` | `1rem` (16px) | 400 | 1.6 | 0 | Standard body text |
| `text-body-sm` | `0.875rem` (14px) | 400 | 1.5 | 0 | Secondary descriptions |
| `text-caption` | `0.75rem` (12px) | 500 | 1.4 | 0.02em | Labels, badges, metadata |
| `text-overline` | `0.75rem` (12px) | 600 | 1.4 | 0.08em | Uppercase labels, section markers |

#### Typography Patterns
- **Hero Headlines:** Large, bold, tight letter-spacing, white. Often split across two lines with the second line featuring a gradient text effect (amber-to-white) or the word "AI" highlighted in amber.
- **Section Overlines:** Uppercase, letter-spaced, amber color, small size — used as section labels above headlines (e.g., "REAL STORY INTO VIDEO EXAMPLES").
- **Body Text on Dark:** Slightly increased line-height (1.6) for readability on dark backgrounds. Secondary text uses `--color-text-secondary` to reduce visual weight.

### 2.3 Spacing System

#### Base Unit: `4px`

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | `4px` | Micro gaps, icon padding |
| `space-2` | `8px` | Tight component internal spacing |
| `space-3` | `12px` | Button padding vertical, small gaps |
| `space-4` | `16px` | Standard component padding |
| `space-5` | `20px` | Card internal padding |
| `space-6` | `24px` | Section internal spacing |
| `space-8` | `32px` | Between related components |
| `space-10` | `40px` | Medium section gaps |
| `space-12` | `48px` | Large section gaps |
| `space-16` | `64px` | Section padding vertical |
| `space-20` | `80px` | Major section separation |
| `space-24` | `96px` | Hero section padding |
| `space-32` | `128px` | Between major page sections |

#### Section Padding
- **Desktop:** `padding: 96px 0` (vertical only; horizontal uses container max-width)
- **Tablet:** `padding: 64px 0`
- **Mobile:** `padding: 48px 0`

#### Container System
| Breakpoint | Max-Width | Horizontal Padding |
|------------|-----------|-------------------|
| Mobile (<640px) | 100% | `16px` |
| Tablet (640-1024px) | 100% | `24px` |
| Desktop (1024-1280px) | `1024px` | `24px` |
| Wide (1280px+) | `1200px` | `32px` |

---

## 3. Layout Architecture

### 3.1 Grid System
- **Primary Grid:** 12-column with `24px` gutters (desktop), `16px` (tablet), `12px` (mobile)
- **Feature Cards Grid:** 3-column on desktop, 2-column on tablet, 1-column on mobile
- **Style Showcase Grid:** 4-column on desktop, 2-column on tablet, 2-column on mobile
- **Steps Grid:** 2-column alternating layout (image left/text right, then reverse)

### 3.2 Section Breakdown

#### Section: Navigation Header
- **Position:** Fixed top, full-width, `z-index: 50`
- **Height:** `64px`
- **Background:** `rgba(10, 10, 10, 0.8)` with `backdrop-filter: blur(12px)`
- **Border:** `1px solid rgba(255, 255, 255, 0.06)` bottom border
- **Content:**
  - Left: Logo (text-based "StoryIntoVideo" with play icon triangle ▶)
  - Center: Nav links — Features, Pricing, Blog, Contact
  - Right: Language selector ("EN" dropdown) + User avatar or "Get Started" CTA
- **Scroll Behavior:** Background opacity increases from 0.8 to 0.95 after 50px scroll

#### Section: Hero
- **Height:** `100vh` minimum, centered content
- **Background:** Pure `#0A0A0A` with subtle radial gradient glow at top-center (amber, very low opacity)
- **Layout:** Centered text above a horizontal scrolling image showcase
- **Content:**
  - Overline: Small amber text (optional, not always present)
  - Headline: "Turn Story Into Video with AI Magic" — large, bold, white. "AI Magic" may have amber gradient.
  - Subheadline: "Paste your story and AI handles the rest — characters, storyboards, voiceover, and a finished video in minutes."
  - CTA: "Start Creating" — amber button, large
- **Below Headline:** Horizontal scrolling row of AI-generated image pairs (landscape + portrait) showing different visual styles (Ghibli, Medieval, Oil Painting, Anime, Realistic, Cyberpunk, Watercolor)
- **Image Cards:** Rounded corners (`12px`), subtle shadow, hover scale effect

#### Section: Style Showcase (Visual Styles Grid)
- **Layout:** Full-width section with centered headline
- **Headline:** "Real Story Into Video Examples" or similar
- **Grid:** 4 columns of image pairs (landscape scene + portrait character)
- **Each Pair:**
  - Two images side by side with small gap (`8px`)
  - Landscape image: ~60% width, rounded top-left and bottom-left
  - Portrait image: ~40% width, rounded top-right and bottom-right
  - Below: Style name label (e.g., "Ghibli", "Medieval") in small white text
- **Featured Example:** One large featured card spanning full width showing a specific project (e.g., "Confession in the Blue Flower Sea") with description text below

#### Section: How It Works (4 Steps)
- **Layout:** Vertical stack of 4 step blocks, each with:
  - Left: Video/demo placeholder or screenshot (rounded `16px`, border `1px solid rgba(255,255,255,0.08)`)
  - Right: Text content
  - Alternating: Step 1 (image left), Step 2 (image right), Step 3 (image left), Step 4 (image right)
- **Step Number:** Large amber number "01", "02", etc. with label "Step 1" above
- **Headline:** Bold white, e.g., "Create Your Project"
- **Description:** `--color-text-secondary`, 2-3 sentences
- **CTA Link:** "Start Your Story →" in amber with arrow icon
- **Video Placeholder:** Dark container with "Loading video..." text and spinner

#### Section: Features Grid
- **Headline:** "Creating AI Videos Has Never Been So Easy"
- **Subheadline:** Description of the all-in-one platform
- **Grid:** 4 columns × 2 rows = 8 feature cards
- **Each Card:**
  - Icon: Small amber/gold icon (24×24px) at top-left
  - Title: `text-h3`, white, bold
  - Description: `text-body-sm`, `--color-text-secondary`
  - Background: Transparent (no card background — text sits directly on page bg)
  - Padding: `24px`
- **Features Listed:**
  1. AI Script Analysis
  2. Character Consistency
  3. Multi-Voice Narration
  4. 100% AI Powered
  5. Scene Generation
  6. Dynamic Subtitles
  7. One-Click Export
  8. And Much More...

#### Section: Testimonials
- **Headline:** "Loved by Creators"
- **Subheadline:** "Hear from creators who use StoryIntoVideo..."
- **Layout:** Single testimonial card or carousel
- **Card Design:**
  - Background: `#111111` with `1px solid rgba(255,255,255,0.06)` border
  - Border-radius: `16px`
  - Padding: `32px`
  - Quote text: Italic, `--color-text-secondary`, large size
  - Attribution: Name and role below, smaller text

#### Section: Final CTA
- **Layout:** Centered, generous vertical padding (`128px`)
- **Headline:** "Start Creating Your Video"
- **CTA Button:** Large amber button, centered
- **Background:** Subtle radial gradient glow centered behind button

#### Section: Footer
- **Background:** `#0A0A0A` (same as page)
- **Border:** `1px solid rgba(255,255,255,0.06)` top border
- **Layout:** Multi-column grid
  - Column 1: Logo + brief tagline
  - Column 2: Product links (Features, Pricing, Blog)
  - Column 3: Legal links (Terms, Privacy, Contact)
  - Column 4: Social/contact info
- **Bottom Bar:** Copyright "© 2026 StoryIntoVideo. All rights reserved." centered, `--color-text-tertiary`

### 3.3 Responsive Behavior

| Breakpoint | Key Changes |
|------------|-------------|
| **< 640px (Mobile)** | Single column everything. Hero headline `2.5rem`. Nav collapses to hamburger. Feature grid 1-column. Steps stack vertically (image above text). |
| **640-1024px (Tablet)** | Feature grid 2-column. Steps may still alternate or stack. Style showcase 2-column. Container padding `24px`. |
| **1024-1280px (Desktop)** | Full layout as designed. 3-4 column grids. Alternating steps. |
| **> 1280px (Wide)** | Max container `1200px`. Slightly larger spacing. |

---

## 4. Component Library

### 4.1 Navigation (Header)

```
┌─────────────────────────────────────────────────────────────────┐
│ [▶ StoryIntoVideo]    Features  Pricing  Blog  Contact    EN ▼  👤 │
└─────────────────────────────────────────────────────────────────┘
```

- **Logo:** Play triangle icon (▶) in amber + "StoryIntoVideo" text in white, `font-weight: 700`, `1rem`
- **Nav Links:** `text-body-sm`, `--color-text-secondary`, hover → white with `transition: color 0.2s ease`
- **Language Selector:** "EN" with small chevron down, `--color-text-secondary`
- **User Avatar:** Circular `32px` image or fallback initials
- **Mobile:** Hamburger icon (three lines), slide-out drawer from right, dark background `#111111`

### 4.2 Buttons & CTAs

#### Primary CTA (Amber)
```css
.btn-primary {
  background: linear-gradient(135deg, #F5A623 0%, #E8941F 100%);
  color: #0A0A0A;
  font-weight: 600;
  padding: 14px 28px;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(245, 166, 35, 0.3);
}
.btn-primary:active {
  transform: translateY(0);
}
```

#### Secondary CTA (Outline)
```css
.btn-secondary {
  background: transparent;
  color: #F5A623;
  border: 1px solid rgba(245, 166, 35, 0.4);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.btn-secondary:hover {
  background: rgba(245, 166, 35, 0.1);
  border-color: #F5A623;
}
```

#### Text Link with Arrow
```css
.link-arrow {
  color: #F5A623;
  font-weight: 500;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.link-arrow::after {
  content: "→";
  transition: transform 0.2s ease;
}
.link-arrow:hover::after {
  transform: translateX(4px);
}
```

#### Ghost Button (Dark)
```css
.btn-ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #FFFFFF;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  border-radius: 8px;
  transition: all 0.2s ease;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}
```

### 4.3 Cards & Containers

#### Feature Card (Text-Only)
- Background: Transparent
- Padding: `24px`
- Icon: `24×24px`, amber color, top-left
- Title: `text-h3`, white
- Description: `text-body-sm`, `--color-text-secondary`
- No border, no shadow — relies on spacing for separation

#### Image Pair Card (Style Showcase)
- Container: `border-radius: 12px`, `overflow: hidden`
- Layout: Flex row, two images with `8px` gap
- Left image: `border-radius: 12px 0 0 12px`, aspect-ratio ~16:10
- Right image: `border-radius: 0 12px 12px 0`, aspect-ratio ~3:4
- Hover: `transform: scale(1.02)`, `transition: transform 0.3s ease`
- Label below: `text-caption`, white, centered

#### Testimonial Card
- Background: `#111111`
- Border: `1px solid rgba(255, 255, 255, 0.06)`
- Border-radius: `16px`
- Padding: `32px`
- Quote: Italic, `text-body-lg`, `--color-text-secondary`
- Attribution: `text-body-sm`, white name + `--color-text-tertiary` role

#### Pricing Card (App/Dashboard Context)
- Background: `#111111` or slightly elevated `#151515`
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Border-radius: `12px`
- Padding: `24px`
- "RECOMMENDED" badge: Small amber pill/badge at top-right
- Selected state: `border-color: #F5A623`, subtle amber glow

### 4.4 Forms & Inputs

#### Text Input (Dark)
```css
.input-dark {
  background: #1A1A1A;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  color: #FFFFFF;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-dark::placeholder {
  color: #666666;
}
.input-dark:focus {
  outline: none;
  border-color: #F5A623;
  box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.15);
}
```

#### Textarea (Prompt Input)
- Same styling as text input
- Min-height: `120px`
- Resize: vertical only
- Character counter: Bottom-right, `text-caption`, `--color-text-tertiary`

#### Select/Dropdown (App Context)
- Background: `#1A1A1A`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Border-radius: `8px`
- Options panel: `#1E1E1E` with subtle shadow
- Selected option: Amber left border or amber text

### 4.5 Icons & Decorative Elements

- **Icon Style:** Line icons (not filled), `1.5px` stroke, rounded caps
- **Icon Color:** Default `--color-text-secondary`, hover/active → amber or white
- **Icon Size:** `20px` (nav), `24px` (features), `16px` (inline)
- **Logo Icon:** Filled play triangle, amber `#F5A623`
- **Decorative:** Subtle dot patterns or grid lines (very low opacity, ~3%) occasionally used as background texture in hero sections

---

## 5. Animation & Motion Design

### 5.1 Page Load Sequence
1. **0ms:** Background appears (instant)
2. **100ms:** Header fades in (`opacity: 0 → 1`, `duration: 300ms`, `ease: ease-out`)
3. **200ms:** Hero headline fades in + translates up (`translateY: 20px → 0`, `duration: 500ms`, `ease: cubic-bezier(0.22, 1, 0.36, 1)`)
4. **350ms:** Hero subheadline fades in (same pattern, 150ms stagger)
5. **500ms:** Hero CTA button fades in + scales (`scale: 0.95 → 1`, `duration: 400ms`)
6. **600ms:** Hero image showcase begins horizontal scroll animation or fade-in

### 5.2 Scroll-Triggered Animations

#### Fade-Up (Primary Scroll Animation)
```css
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Trigger: when element enters viewport (IntersectionObserver, threshold: 0.15) */
/* Duration: 600ms */
/* Easing: cubic-bezier(0.22, 1, 0.36, 1) */
/* Stagger: 100ms between sibling elements */
```

#### Staggered Grid Reveal
- Feature cards reveal with `fadeUp` animation
- Stagger delay: `100ms` per card (left-to-right, top-to-bottom)
- Trigger: When 15% of the grid container is visible

#### Step Section Reveal
- Image slides in from its side (`translateX: -40px → 0` or `translateX: 40px → 0`)
- Text content fades up with `200ms` delay after image
- Duration: `700ms`
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`

### 5.3 Hover & Interaction States

#### Image Card Hover
```css
.image-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.image-card:hover {
  transform: scale(1.03);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
```

#### Button Hover (All Types)
- Primary: `translateY(-2px)` + amber glow shadow
- Secondary: Background fill + border brighten
- Ghost: Background opacity increase
- Duration: `200ms`
- Easing: `ease`

#### Nav Link Hover
- Color transition: `--color-text-secondary → #FFFFFF`
- Duration: `200ms`
- Optional: Subtle underline animation (width `0 → 100%`, amber, from left)

#### Feature Card Hover (App Dashboard)
```css
.feature-card:hover {
  border-color: rgba(245, 166, 35, 0.3);
  background: rgba(245, 166, 35, 0.03);
}
```

### 5.4 Continuous/Ambient Animations

#### Hero Image Scroll (Marquee Effect)
- Horizontal auto-scrolling row of image pairs
- Direction: Right to left
- Speed: ~`40px/second` (slow, cinematic)
- Pause on hover
- Gradient fade masks on left and right edges (`linear-gradient(to right, #0A0A0A, transparent 10%, transparent 90%, #0A0A0A)`)

#### Loading States
- **Spinner:** Circular amber spinner, `2px` border, `24px` size
- **Skeleton:** Shimmer effect on dark gray blocks (`#1A1A1A` base, animated gradient overlay)
- **Video Placeholder:** Pulsing opacity on "Loading video..." text

### 5.5 Easing Curves & Timing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `ease-smooth` | `cubic-bezier(0.22, 1, 0.36, 1)` | Primary entrance animations |
| `ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful micro-interactions |
| `ease-default` | `ease` | Standard transitions (hover, focus) |
| `ease-linear` | `linear` | Continuous animations (marquee) |
| `duration-fast` | `150ms` | Micro-interactions |
| `duration-normal` | `200ms` | Hover states, focus |
| `duration-slow` | `400ms` | Button animations |
| `duration-entrance` | `600ms` | Scroll-triggered reveals |
| `duration-hero` | `800ms` | Page load sequence |

---

## 6. Imagery & Asset Guidelines

### 6.1 Photography Style
- **Source:** AI-generated imagery (not photography)
- **Style:** Highly stylized, cinematic, painterly, or anime-influenced
- **Treatment:** Images are presented as-is with no additional filters — the AI art IS the visual content
- **Aspect Ratios:**
  - Landscape scenes: ~16:10 or 16:9
  - Portrait characters: ~3:4 or 9:16
  - Hero showcase pairs: Side-by-side landscape + portrait

### 6.2 Visual Style Categories (App Context)
The app offers these visual style presets, each represented by a thumbnail:
1. **Ghibli** — Soft, painterly, Studio Ghibli-inspired anime
2. **Medieval** — Oil painting, classical European art style
3. **Oil Painting** — Thick brush strokes, impressionistic
4. **Anime** — Clean Japanese animation style
5. **Japanese Animation** — Detailed anime with cinematic lighting
6. **Realistic** — Photorealistic, cinematic depth of field
7. **Cyberpunk** — Neon-lit, futuristic dystopian
8. **Watercolor** — Soft, translucent, delicate

### 6.3 Thumbnail Treatment
- Border-radius: `8px`
- Border: `2px solid transparent` (default), `2px solid #F5A623` (selected)
- Overlay label at bottom: Semi-transparent dark gradient + white text
- Hover: Slight brightness increase (`filter: brightness(1.1)`)

### 6.4 Iconography
- **Style:** Minimal line icons, single-color, consistent stroke width
- **Library Recommendation:** Lucide React or Heroicons (outline style)
- **Color:** Inherit from parent text color
- **Size Scale:** `16px` (inline), `20px` (nav), `24px` (features), `32px` (empty states)

### 6.5 Video/Media Treatments
- **Player:** Custom dark player with minimal chrome
- **Controls:** Semi-transparent dark bar at bottom, amber play button
- **Timeline:** Thin amber progress bar
- **Thumbnails:** Filmstrip-style timeline at bottom showing scene thumbnails

---

## 7. Page-by-Page Breakdown

### 7.1 Homepage (`/`)

**Sections in Order:**
1. **Header** — Fixed nav (see Section 4.1)
2. **Hero** — Full-viewport, headline + subheadline + CTA + scrolling image showcase
3. **Style Showcase** — "Real Story Into Video Examples" with image pair grid + featured project card
4. **How It Works** — 4 steps with alternating image/text layout
5. **Features** — 8 feature cards in 4×2 grid
6. **Testimonials** — Creator quotes section
7. **Final CTA** — "Start Creating Your Video" with large CTA button
8. **Footer** — Multi-column links + copyright

### 7.2 Pricing Page (`/pricing`)

**Layout:**
- Header (same as homepage)
- Page headline: "Pricing Plans" or "简单透明的定价" (Simple Transparent Pricing)
- Subheadline: "选择适合你创作需求的套餐，无隐藏费用。"
- Pricing cards grid (3-4 tiers)
- FAQ accordion section below
- Footer

**Pricing Card Structure:**
- Plan name (e.g., "Starter", "Pro", "Enterprise")
- Price (e.g., "$9/month" or "$65 credits")
- Feature list with checkmarks
- "RECOMMENDED" badge on popular plan (amber pill)
- CTA button per card
- Toggle: Monthly / Annual (save 25%)

### 7.3 Contact Page (`/contact`)

**Layout:**
- Header
- Page headline: "Contact Us" / "联系我们"
- Subheadline: "We'd love to hear from you!..."
- Contact form (3 fields: Email, Subject, Message)
- Side info: Email support address, response time, FAQ link
- Footer

**Form Fields:**
- Email: Input with label "Email Address" + helper text
- Subject: Input with label "Subject"
- Message: Textarea with label "Message"
- Submit: Amber CTA button "Send Message"

### 7.4 Legal Pages (`/terms`, `/privacy`)

**Layout:**
- Header
- Page headline (H1)
- Content: Numbered sections with H2 headings
- Body text: `--color-text-secondary`, `text-body`, max-width `720px`
- Footer

### 7.5 App Dashboard (Authenticated)

**Layout:** Sidebar + Main Content

**Sidebar:**
- Width: `240px` fixed
- Background: `#0F0F0F` (slightly darker than main bg)
- Border-right: `1px solid rgba(255,255,255,0.06)`
- Sections:
  - Logo at top
  - "CREATE" section: Prompt to Video, Script to Video
  - "TOOLS" section: AI Image, AI Video
  - "OTHER" section: Characters
  - Credit display at bottom: "65 credits" large number + "Recharge credits →" link

**Main Content Area:**
- Background: `#0A0A0A`
- Content varies by route:
  - **Prompt to Video:** Large textarea prompt input, suggestion chips, video method selection cards, visual style grid, aspect ratio selector, generate button
  - **Script to Video:** Similar but with script-specific options
  - **Image Generation:** Character/scene image grids with generation controls
  - **Storyboard:** Shot-by-shot timeline with AI-generated frames
  - **Timeline Editor:** Video preview player, scene thumbnails, audio controls, subtitle editor

**Top Bar (App):**
- Project name (editable)
- Progress stepper: Generate Images → Storyboard → Scenes → Final Compose
- Action buttons: "Original Script", "AI Assistant" (amber), "Batch Generate Videos" (amber)
- Language selector + User avatar

---

## 8. Accessibility Requirements

### 8.1 WCAG 2.1 AA Compliance (Minimum)
- **Color Contrast:**
  - White text on `#0A0A0A`: Ratio ~21:1 ✓
  - `--color-text-secondary` (#A0A0A0) on `#0A0A0A`: Ratio ~6.8:1 ✓
  - Amber CTA text (#0A0A0A) on `#F5A623`: Ratio ~8.5:1 ✓
  - `--color-text-tertiary` (#666666) on `#0A0A0A`: Ratio ~4.5:1 ✓ (borderline, consider `#757575` for AAA)
- **Focus Indicators:** All interactive elements have visible focus rings (`box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.4)`)
- **Keyboard Navigation:** Full tab-order support, skip-to-content link
- **ARIA Labels:** All icons, buttons, and non-text interactive elements labeled
- **Reduced Motion:** Respect `prefers-reduced-motion` — disable scroll animations, marquee, and hover transforms

### 8.2 Dark Mode Considerations
- The site is **dark-mode-first** — there is no light mode toggle
- All imagery must work on dark backgrounds (no white-background images without dark container)
- Avoid pure black (`#000000`) — use `#0A0A0A` to reduce eye strain

---

## 9. Technical Implementation Notes

### 9.1 Recommended Stack
| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Shadcn UI v4 (customized to dark theme) |
| **Animation** | Framer Motion (page transitions, scroll triggers) |
| **Icons** | Lucide React |
| **Fonts** | Inter (Google Fonts), JetBrains Mono |

### 9.2 Key Implementation Patterns

#### Dark Theme Configuration (Tailwind)
```javascript
// tailwind.config.ts
export default {
  darkMode: 'class', // or remove if always dark
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0A0A0A',
          secondary: '#111111',
          tertiary: '#1A1A1A',
          elevated: '#1E1E1E',
        },
        accent: {
          DEFAULT: '#F5A623',
          hover: '#FFB84D',
          subtle: 'rgba(245, 166, 35, 0.12)',
          glow: 'rgba(245, 166, 35, 0.25)',
        },
        foreground: {
          DEFAULT: '#FFFFFF',
          secondary: '#A0A0A0',
          tertiary: '#666666',
          muted: '#444444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'marquee': 'marquee 40s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
}
```

#### Scroll Animation Hook Pattern
```typescript
// hooks/useScrollAnimation.ts
import { useEffect, useRef } from 'react';

export function useScrollAnimation(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
```

#### Marquee Component Pattern
```tsx
// components/Marquee.tsx
export function Marquee({ children, speed = 40 }: MarqueeProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Fade masks */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
      
      <div className="flex animate-marquee" style={{ animationDuration: `${speed}s` }}>
        {children}
        {children} {/* Duplicate for seamless loop */}
      </div>
    </div>
  );
}
```

### 9.3 Performance Considerations
- **Images:** Use Next.js `<Image>` with `priority` for hero images, lazy load below-fold
- **Animations:** Use `transform` and `opacity` only (GPU-accelerated). Avoid animating `width`, `height`, `top`, `left`
- **Fonts:** Preload Inter and JetBrains Mono. Use `font-display: swap`
- **Code Splitting:** Route-based splitting for app dashboard vs marketing pages
- **Core Web Vitals Target:**
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1

### 9.4 Asset Requirements
| Asset | Format | Notes |
|-------|--------|-------|
| Logo | SVG | Play triangle + wordmark |
| Hero Images | WebP | AI-generated showcase pairs, ~800px wide |
| Style Thumbnails | WebP | 8 visual style previews, ~400px |
| Step Demo Videos | MP4/WebM | 4 short demo clips, muted autoplay |
| Feature Icons | SVG | 8 line icons, 24×24px |
| App Screenshots | WebP | Dashboard UI screenshots for marketing |

---

## 10. Quality Assurance Checklist

Before considering the implementation complete, verify:

- [ ] All colors match the specified palette exactly
- [ ] Typography scale renders correctly at all breakpoints
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Focus states are visible on all interactive elements
- [ ] Color contrast ratios meet WCAG AA minimum
- [ ] All hover states are implemented consistently
- [ ] Mobile navigation drawer functions correctly
- [ ] Marquee animation loops seamlessly
- [ ] Scroll-triggered animations fire at correct thresholds
- [ ] Images load with appropriate lazy loading
- [ ] No layout shift (CLS) during page load
- [ ] All buttons have loading, error, and success states (app context)
- [ ] Empty states are designed and implemented
- [ ] Form validation follows the visual system (amber error borders)

# https://www.kimi.com/share/19f0278f-c602-8fd1-8000-0000c07b051b 
