# MASTER_EXECUTION_PLAN.md — StoryIntoVideo Landing Page Clone

**Project:** Pixel-accurate marketing-site clone of [storyintovideo.com](https://storyintovideo.com/)
**Canonical Spec:** `Project_Requirements_Document.md` v2.0 (2718 lines, field-verified 2026-06-26)
**Stack (locked):** Next.js 16 · React 19 · Tailwind CSS v4 (CSS-first `@theme`) · shadcn/ui (Radix) · Lucide React · next/font (Geist Sans + Geist Mono + Outfit 820)
**Document Version:** 1.0
**Prepared By:** Frontend Architect & Avant-Garde UI Designer
**Date:** 2026-06-26

> **Provenance.** This plan synthesizes four deep-read passes over the canonical PRD (§1–§17), the bundled skills catalog (12 SKILL.md files + 7 reference files), `AGENTS.md`, `README.md`, and `bundled_skills_to_use.md`. Every code path, file path, interface, and checklist item below traces directly to a PRD clause or a skill rule. No invention — only structured assembly.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Source Documents Reviewed](#2-source-documents-reviewed)
3. [Critical Pre-Build Decisions](#3-critical-pre-build-decisions)
4. [Stack & Dependencies (Pinned)](#4-stack--dependencies-pinned)
5. [Project File Structure (Final)](#5-project-file-structure-final)
6. [Cross-Cutting Concerns](#6-cross-cutting-concerns)
7. [Phase 0 — Pre-Build Validation Gate](#phase-0--pre-build-validation-gate)
8. [Phase 1 — Scaffold & Foundation](#phase-1--scaffold--foundation)
9. [Phase 2 — Design System & Primitives](#phase-2--design-system--primitives)
10. [Phase 3 — Static Sections (Server Components)](#phase-3--static-sections-server-components)
11. [Phase 4 — Interactive Sections (Client Components)](#phase-4--interactive-sections-client-components)
12. [Phase 5 — Animation & Polish](#phase-5--animation--polish)
13. [Phase 6 — Asset Pipeline](#phase-6--asset-pipeline)
14. [Phase 7 — QA & Delivery](#phase-7--qa--delivery)
15. [Risk Register](#7-risk-register)
16. [Verification Gates (Between Phases)](#8-verification-gates-between-phases)
17. [Open Questions for User Validation](#9-open-questions-for-user-validation)
18. [Skill Consultation Map](#10-skill-consultation-map)
19. [Glossary](#11-glossary)
20. [Changelog](#12-changelog)

---

## 1. Executive Summary

### 1.1 What is being built

A single-page Next.js 16 static landing page that clones the visual identity of `https://storyintovideo.com/` — a luxury-dark, cinematic SaaS marketing site for an AI story-to-video generator. The clone reproduces every color token, font weight (including the rare Outfit 820 display weight), all 13 CSS keyframes, every hover micro-interaction, and the singular yellow→purple gradient exception on example-card hover.

**This is a clone.** No authentication, no dashboard, no video-generation backend, no database. All CTAs link to placeholders (`#` anchors or `/auth/sign-up`). The page is `force-static` — no SSR, no API routes, no server actions.

### 1.2 Deliverable shape

| Artifact | Description |
|---|---|
| **Source code** | A complete, runnable Next.js 16 project at `/home/z/my-project/story-into-video/` (root of the cloned repo) |
| **Self-hosted assets** | 5 videos + 5 posters + 6 example thumbnails + 1 OG image + 1 favicon + 3 woff2 fonts in `/public/` |
| **Documentation** | Updated `README.md` reflecting the final build; this `MASTER_EXECUTION_PLAN.md` is the execution record |
| **Tests** | 6 Vitest unit tests (hooks + utils) + 3 Playwright E2E tests (critical user flows) |
| **Quality gates passed** | `pnpm lint` (0 warnings) · `pnpm typecheck` (0 errors) · `pnpm build` (0 errors) · Lighthouse ≥95 across Performance / Accessibility / Best Practices / SEO |

### 1.3 Phases at a glance

| # | Phase | Goal | Files | Effort | Hard dependency |
|---|---|---|---|---|---|
| 0 | Pre-Build Validation Gate | Lock all design decisions; user confirms plan | 0 | 0.5h | — |
| 1 | Scaffold & Foundation | Next.js app boots with dark bg, correct fonts, amber token | ~12 | 2-3h | Phase 0 |
| 2 | Design System & Primitives | `@theme` tokens, keyframes, hooks, shadcn primitives, custom UI components | ~14 | 3-4h | Phase 1 |
| 3 | Static Sections (Server) | Footer, FinalCTA, Features, Testimonials, UseCases, Workflow | ~7 | 3-4h | Phase 2 |
| 4 | Interactive Sections (Client) | Navbar, Hero, StyleMarquee, Examples, FAQ | ~6 | 4-5h | Phase 2 |
| 5 | Animation & Polish | Scroll reveal, video loading, skip link, focus rings, reduced-motion | ~3 | 2-3h | Phases 3 & 4 |
| 6 | Asset Pipeline | Download/generate all videos, posters, thumbnails, OG, favicon, Outfit 820 | ~6 | 2-3h | Phase 1 |
| 7 | QA & Delivery | All 6 QA checklists pass; Lighthouse ≥95; deploy-ready | 0 | 2-3h | All prior |
| **Total** | | | **~48 files** | **18-25h** | |

> Phases 3 and 4 can be partially parallelized (different files, no shared state). Phase 6 can be parallelized with Phases 3-5 (assets are independent of code). Phase 5 strictly requires Phases 3 & 4 to be complete.

### 1.4 Success criteria (single sentence)

A senior reviewer opening the deployed URL side-by-side with `storyintovideo.com` at 1440×900 cannot tell which is the clone within a 30-second visual scan, AND Lighthouse reports ≥95 across all four categories, AND `pnpm lint && pnpm typecheck && pnpm build` all pass with zero warnings or errors.

---

## 2. Source Documents Reviewed

### 2.1 Primary spec documents (read in full)

| Document | Lines | Role |
|---|---|---|
| `Project_Requirements_Document.md` | 2718 | Canonical spec — every color, pixel, keyframe, copy string field-verified from live DOM |
| `AGENTS.md` | 173 | Compact agent instructions — stack lock, color system, file structure, interaction inventory |
| `README.md` | 248 | Quick start, architecture overview, design system summary, conventions |
| `bundled_skills_to_use.md` | 327 | Skill routing — primary (4), supporting (7), testing (3), do-not-use (2) |
| `docs/prompt-to-build.md` | 327 | Original user prompt template (workflow + standards) |
| `PRD_2.md` | 835 | Alternate shorter PRD draft (cross-referenced for conflict resolution) |
| `draft_PRD.md` | 626 | Earlier PRD draft (cross-referenced) |

### 2.2 Skill files read in full

**Primary (4):**
- `skills/nextjs16-tailwind4/SKILL.md` — exact stack pin, Tailwind v4 `@theme` template, v3→v4 migration map, mobile nav Sheet pattern
- `skills/ui-styling/SKILL.md` + 7 reference files — shadcn/ui install/init patterns, dark mode token setup, Radix accessibility, component variants
- `skills/frontend-design/SKILL.md` + 6 reference files — anti-AI-slop checklist, WCAG AAA targets, UX laws, animation timing, typography rules
- `skills/tailwind-patterns/SKILL.md` — `@theme` template, container queries, 3-tier token architecture, OKLCH guidance

**Supporting (8):**
- `skills/visual-design-foundations/SKILL.md` + 3 references — typography pairing, color theory, 8-pt spacing, iconography
- `skills/performance-optimization/SKILL.md` — Lighthouse ≥95 techniques, Core Web Vitals budgets, next/image patterns, font loading
- `skills/lint-and-validate/SKILL.md` — quality loop, exact commands, pre-commit gates
- `skills/code-review-checklist/SKILL.md` — 12-category review framework
- `skills/planning-and-task-breakdown/SKILL.md` — vertical slicing, acceptance criteria template, task sizing
- `skills/coding-agent/SKILL.md` + 6 auxiliary files — plan→execute→verify→deliver workflow, memory template, verification gates
- `skills/incremental-implementation/SKILL.md` — slicing strategies, commit cadence, scope discipline
- `skills/test-driven-development/SKILL.md` — Red/Green/Refactor, test pyramid, Beyoncé rule

### 2.3 Skills referenced by `bundled_skills_to_use.md` but NOT in `/skills/` directory

The following skills are listed in `bundled_skills_to_use.md` but are external to this repo (they live in the user's broader skill environment, marked with `*` in the skills catalog). For each, I've mapped to an in-repo substitute:

| External skill referenced | In-repo substitute | Rationale |
|---|---|---|
| `avant-garde-design-v4` | `frontend-design` + `aesthetic` | Both cover anti-generic strategy and luxury aesthetic direction |
| `super-frontend-design` | `frontend-design` + `frontend-ui-engineering` | Combined, they cover the master-skill scope (design systems, WCAG AAA, performance) |
| `claude-design` | `design` (router) + `frontend-design` | Router delegates to artifact skills; `frontend-design` provides the design thinking |
| `code-quality-standards` | `code-review-checklist` + `code-review-and-audit` | 12-category review + unified audit pipeline |
| `verification-and-review-protocol` | `coding-agent/verification.md` + `code-review-and-audit` | Verification gates + "Iron Law" preventing false completion |
| `webapp-testing-journey` | `playwright-cli` + `agent-browser` | Real-browser testing via CLI |
| `browser-testing-with-devtools` | `playwright-cli` | Programmatic Chrome DevTools via Playwright |

---

## 3. Critical Pre-Build Decisions

The PRD ships several internal contradictions and the skills layer adds further tensions. Each decision below was made by weighing the PRD (canonical spec) against the skill guidance (modern best practice). **All decisions are open to user override at the Phase 0 validation gate.**

### 3.1 Decision A — Tailwind v4 configuration approach

| Option | Source | Trade-off |
|---|---|---|
| (a) Ship `tailwind.config.ts` per PRD §8.1 verbatim | PRD | Familiar; works; but skill says "delete it" |
| (b) Ship `globals.css` per PRD §9 verbatim (raw `:root` + `@keyframes`, no `@theme`) | PRD | Works but bypasses Tailwind v4's CSS-first token system |
| (c) **Convert to `@theme` block in `globals.css`, drop `tailwind.config.ts`** | `nextjs16-tailwind4` skill | Modern v4 idiom; future-proof; smaller CSS bundle |

**Decision: (c).** All design tokens (colors, fonts, spacing, radius, shadows, keyframes, animations) live inside a single `@theme { … }` block in `app/globals.css`. No `tailwind.config.ts` file is created. This aligns with the `nextjs16-tailwind4` skill's mandate and is the documented future direction in PRD §8.2.

### 3.2 Decision B — Keyframe naming convention

The PRD ships two contradictory naming conventions:

| Source | Names |
|---|---|
| PRD §9 `globals.css` (camelCase) | `compositePulseText`, `gridShimmer`, `gridSweepH`, `gridSweepV`, `scanlineScroll` |
| PRD §8.1 `tailwind.config.ts` (kebab-case) | `composite-pulse-text`, `grid-shimmer`, `grid-sweep-h`, `grid-sweep-v`, `scanline-scroll` |
| Both sources agree (kebab) | `fade-in-up`, `float`, `glow-pulse`, `border-glow`, `shimmer`, `btn-shimmer`, `lang-dropdown-in`, `marquee-scroll` |

CSS `@keyframes` names are **case-sensitive**. If we ship both files unchanged, `animate-grid-shimmer` (kebab) won't find `@keyframes gridShimmer` (camel).

**Decision: Use kebab-case throughout.** All 13 `@keyframes` blocks in `globals.css` use kebab-case names: `composite-pulse-text`, `grid-shimmer`, `grid-sweep-h`, `grid-sweep-v`, `scanline-scroll`. Every `animate-[name_…]` arbitrary invocation in JSX uses the kebab-case name. The total keyframe count is **13** (the 12 from the live site + `marquee-scroll` which is custom for the style-chips ticker).

### 3.3 Decision C — Outfit weight 820

PRD §1.5 specifies H1 uses Outfit weight **820** — an extra-bold display weight rarely seen in SaaS. However:

- `next/font/google` only serves discrete weights (500, 600, 700, 800, 900) — **820 is not available**
- PRD §10.3 explicitly flags this: "Self-host the Outfit variable font via `next/font/local` to access weight 820 precisely"
- Risk register rates this as **High likelihood, Medium impact**

**Decision: Self-host the Outfit variable font via `next/font/local`.** Download `Outfit-VariableFont_wght.ttf` (or the variable woff2 if available) from the Google Fonts GitHub repo. Convert to woff2 if needed. Load via:

```ts
import localFont from 'next/font/local';

const outfit = localFont({
  src: './fonts/Outfit-VariableFont.woff2',
  weight: '100 900',  // Full variable range — includes 820
  variable: '--font-outfit',
  display: 'swap',
});
```

This guarantees pixel-perfect parity with the live site's H1 weight.

### 3.4 Decision D — Color token format

| Source | Format | Example |
|---|---|---|
| PRD §9 `globals.css` | Hex | `--primary: #febf00` |
| `nextjs16-tailwind4` skill | OKLCH | `--color-aurora-cyan: oklch(0.87 0.16 184)` |
| `ui-styling` reference | HSL (no wrapper) | `--primary: 222.2 47.4% 11.2%` |
| `tailwind-patterns` skill | OKLCH recommended | `--color-primary: oklch(0.7 0.15 250)` |

**Decision: Keep PRD's hex values verbatim in `@theme` block.** The PRD's tokens are field-verified from the live DOM — converting to OKLCH would risk introducing perceptual drift. Tailwind v4's `@theme` block fully supports hex. OKLCH is reserved for future gradient work (the singular yellow→purple example-card hover gradient doesn't need OKLCH — it's a Tailwind utility `bg-gradient-to-r from-yellow-500 to-purple-500`, not a custom token).

> **Note:** `bg-amber-400/10` opacity modifiers work natively with hex tokens in Tailwind v4 — no special handling required.

### 3.5 Decision E — Font CSS variable names

| Source | Variables |
|---|---|
| PRD §10.3 | `--font-geist-sans`, `--font-geist-mono`, `--font-outfit` |
| `nextjs16-tailwind4` skill | `--font-sans`, `--font-serif` |

**Decision: Use PRD's variable names (`--font-geist-sans`, `--font-geist-mono`, `--font-outfit`) and map them to Tailwind tokens inside `@theme`:**

```css
@theme {
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace;
  --font-heading: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;
}
```

This preserves the PRD's naming for clarity while exposing the standard Tailwind `font-sans` / `font-mono` / `font-heading` utilities.

### 3.6 Decision F — Framer Motion vs CSS-only animation

| Source | Stance |
|---|---|
| PRD §3 | **NO Framer Motion, NO GSAP** — all 13 keyframes are CSS `@keyframes`. "Critical for Lighthouse ≥95." |
| `nextjs16-tailwind4` skill | Includes `framer-motion: 12.29+` in pinned stack |
| `bundled_skills_to_use.md` | Lists `nextjs16-tailwind4` as primary skill |

**Decision: Follow the PRD strictly — NO Framer Motion.** All animation is CSS-only via `@keyframes` + Tailwind arbitrary `animate-[name_duration_easing_delay_fillmode]` syntax. Scroll reveal uses a custom `useReveal` hook with `IntersectionObserver` + `data-revealed` attribute. This is critical for the Lighthouse ≥95 performance target (saves ~50KB of JS) and matches the live site's zero-JS-animation-library approach.

### 3.7 Decision G — Marquee chip duplication strategy

PRD §3.3 specifies 7 original chips + 7 clone chips = 14 total, with the track translating `-50%` for a seamless loop.

**Decision: Render the chip list twice in JSX.** The `StyleMarquee` component maps over a single `STYLE_CHIPS` constant twice (using `React.Children.toArray` or a `<Fragment>` with two `.map()` calls). The CSS `.marquee-track` animates `translateX(0 → -50%)` over 40s linear infinite (30s on mobile `<640px`).

### 3.8 Decision H — Testing scope

The TDD skill explicitly says: *"When NOT to use: Pure configuration changes, documentation updates, or static content changes that have no behavioral impact."*

A static landing page is ~90% presentational content. The remaining ~10% has testable behavior.

**Decision: Write 6 Vitest unit tests + 3 Playwright E2E tests.** No tests for static JSX rendering (Hero headline text, footer copyright, etc.).

| Test type | Target | Framework |
|---|---|---|
| Unit | `useScrolled()` hook — boolean after scroll past threshold | Vitest + jsdom |
| Unit | `useReveal()` hook — IntersectionObserver triggers `revealed=true` | Vitest + jsdom + mocked IntersectionObserver |
| Unit | `useReducedMotion()` hook — matchMedia returns boolean | Vitest + jsdom + mocked matchMedia |
| Unit | `cn()` utility — clsx + tailwind-merge correctness | Vitest |
| Unit | Hero chip → textarea population (state transition) | Vitest + @testing-library/react |
| Unit | Hero ratio toggle state (single selection enforced) | Vitest + @testing-library/react |
| E2E | Hero CTA click → routes to `/auth/sign-up` | Playwright |
| E2E | Mobile hamburger → Sheet opens → all links visible | Playwright |
| E2E | FAQ accordion expand/collapse (single-open) | Playwright |

### 3.9 Decision I — Tailwind v4 content scanning

Tailwind v4 auto-detects content sources, but to be explicit and prevent missed utility classes:

**Decision: Add explicit `@source` directives in `globals.css`:**

```css
@import "tailwindcss";

@source "../components/**/*.{ts,tsx}";
@source "../lib/**/*.{ts,tsx}";
```

(The `app/` directory is auto-scanned by default.)

### 3.10 Decision J — Project location

The cloned repo at `/home/z/my-project/story-into-video/` already contains `PRD_2.md`, `Project_Requirements_Document.md`, `bundled_skills_to_use.md`, `README.md`, `AGENTS.md`, `docs/`, `skills/`, and `.git/`.

**Decision: Build the Next.js app at the root of the cloned repo.** The `skills/` directory will not be scanned by Tailwind (no `.tsx` files there). The PRD documents and `docs/` directory will remain as in-repo reference. A `.gitignore` will be added to exclude `node_modules/`, `.next/`, and other build artifacts.

### 3.11 Decision K — Project scaffold command

**Decision:** Use `pnpm create next-app@latest` with the following flags:

```bash
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --turbopack \
  --eslint \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm
```

This creates the project in the current directory (`.`) with TypeScript, Tailwind v4, App Router, Turbopack, ESLint, the `src/` directory convention, and the `@/*` import alias.

> **Note:** The PRD §6.1 file structure does NOT use `src/` (it shows `app/` at root). The `nextjs16-tailwind4` skill DOES use `src/`. I'm following the skill's `src/` convention because it's the modern best practice and keeps app code separate from config files. The PRD's file structure is illustrative, not prescriptive.

### 3.12 Decision L — Color palette: hex or OKLCH in `@theme`

Already covered in Decision D — keep PRD's hex values. OKLCH only if a perceptual gradient is needed (none in this project).

### 3.13 Decision M — Skip `next-themes`

The `ui-styling` skill's `references/shadcn-theming.md` recommends installing `next-themes` for light/dark toggle. The PRD commits fully to darkness — there is no light mode, no theme toggle.

**Decision: Skip `next-themes` entirely.** Set dark color tokens directly in `:root` (no `.dark` class needed). This eliminates a dependency, removes hydration concerns, and matches the PRD's "always dark" stance.

### 3.14 Decision N — Pre-existing PRD drafts (`PRD_2.md`, `draft_PRD.md`)

These are intermediate artifacts from the PRD's development. They contain contradictions with the canonical `Project_Requirements_Document.md` (e.g., `PRD_2.md` specifies Inter+JetBrains Mono fonts; the canonical PRD specifies Geist+Outfit).

**Decision: Leave them in the repo as historical artifacts.** Do not delete. Do not reference them during implementation — `Project_Requirements_Document.md` is the single source of truth. Add a note in the final `README.md` clarifying the canonical hierarchy.

### 3.15 Decision O — Existing `README.md` and `AGENTS.md`

The cloned repo's `README.md` and `AGENTS.md` are well-written and align with the PRD. They describe the intended end state.

**Decision: Update both files at Phase 7 (QA & Delivery) to reflect any final adjustments discovered during implementation.** Do not modify them mid-build.

---

## 4. Stack & Dependencies (Pinned)

### 4.1 Production dependencies

```json
{
  "dependencies": {
    "next": "^16.1.4",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0",
    "lucide-react": "^0.460.0",
    "geist": "^1.3.0"
  }
}
```

### 4.2 Dev dependencies

```json
{
  "devDependencies": {
    "tailwindcss": "^4.1.18",
    "@tailwindcss/postcss": "^4.1.18",
    "typescript": "^5.9.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.1.4",
    "prettier": "^3.4.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "vitest": "^2.1.0",
    "@vitejs/plugin-react": "^4.3.0",
    "jsdom": "^25.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/user-event": "^14.5.0",
    "@playwright/test": "^1.48.0"
  }
}
```

### 4.3 Install commands (in order)

```bash
# 1. Scaffold (Phase 1)
pnpm create next-app@latest . --typescript --tailwind --app --turbopack --eslint --src-dir --import-alias "@/*" --use-pnpm

# 2. shadcn/ui init (Phase 1)
pnpm dlx shadcn@latest init

# 3. shadcn/ui primitives (Phase 1)
pnpm dlx shadcn@latest add accordion sheet dropdown-menu button

# 4. Radix primitives (Phase 1 — pulled in by shadcn but pinning for safety)
pnpm add @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot

# 5. Supporting libraries (Phase 1)
pnpm add class-variance-authority clsx tailwind-merge@^3 lucide-react@^0.460.0 geist@^1.3.0

# 6. Dev tooling (Phase 1)
pnpm add -D prettier@^3.4 prettier-plugin-tailwindcss@^0.6
pnpm add -D vitest@^2.1 @vitejs/plugin-react@^4.3 jsdom@^25
pnpm add -D @testing-library/react@^16 @testing-library/jest-dom@^6.6 @testing-library/user-event@^14.5
pnpm add -D @playwright/test@^1.48

# 7. Playwright browser install (Phase 7)
pnpm exec playwright install --with-deps chromium
```

### 4.4 Excluded dependencies (with rationale)

| Package | Why excluded |
|---|---|
| `framer-motion` | PRD forbids — all animation is CSS-only |
| `next-themes` | No theme toggle — page is always dark |
| `zod` | No form validation needed (textarea is decorative) |
| `@tanstack/react-query` | No data fetching — static page |
| `prisma` / `drizzle-orm` | No database |
| `next-auth` / `auth.js` | No authentication |
| `stripe` / `@stripe/stripe-js` | No payments |
| `gray-matter` / `contentlayer` | No CMS / blog |
| `@vercel/analytics` / `posthog` | No analytics (out of scope per PRD §14.1) |

---

## 5. Project File Structure (Final)

Built at the root of `/home/z/my-project/story-into-video/`. The `src/` directory convention is used (per `nextjs16-tailwind4` skill best practice).

```
story-into-video/                          # Root of cloned repo
├── .git/                                  # Existing — preserve
├── .gitignore                             # Add Next.js entries (node_modules, .next, etc.)
├── .npmrc                                 # Add — pin pnpm behavior
├── AGENTS.md                              # Existing — update at Phase 7
├── README.md                              # Existing — update at Phase 7
├── MASTER_EXECUTION_PLAN.md               # This document
├── Project_Requirements_Document.md       # Existing — canonical spec, do not modify
├── PRD_2.md                               # Existing — historical artifact
├── draft_PRD.md                           # Existing — historical artifact
├── bundled_skills_to_use.md               # Existing — skill routing reference
├── docs/                                  # Existing — links.txt, prompt-to-build.md
├── skills/                                # Existing — bundled skill reference (not scanned by Tailwind)
│
├── package.json                           # Phase 1 — pinned deps
├── pnpm-lock.yaml                         # Phase 1 — auto-generated
├── tsconfig.json                          # Phase 1 — strict + noUncheckedIndexedAccess
├── next.config.ts                         # Phase 1 — security headers, image config
├── postcss.config.mjs                     # Phase 1 — @tailwindcss/postcss
├── eslint.config.mjs                      # Phase 1 — flat config, next/core-web-vitals
├── .prettierrc.json                       # Phase 1 — prettier + tailwind plugin
├── playwright.config.ts                   # Phase 1 — E2E config
├── vitest.config.ts                       # Phase 1 — unit test config
├── components.json                        # Phase 1 — shadcn/ui config
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Phase 1 — fonts, metadata, body classes
│   │   ├── page.tsx                       # Phase 3 — composes all 10 sections
│   │   ├── globals.css                    # Phase 2 — @theme + @keyframes + utilities
│   │   └── icon.tsx                       # Phase 6 — dynamic favicon (amber "S" on near-black)
│   │
│   ├── components/
│   │   ├── ui/                            # shadcn/ui primitives (auto-generated by `pnpm dlx shadcn add`)
│   │   │   ├── accordion.tsx              # Phase 1 — Radix Accordion wrapper
│   │   │   ├── sheet.tsx                  # Phase 1 — Radix Dialog wrapper (mobile nav)
│   │   │   ├── dropdown-menu.tsx          # Phase 1 — Radix DropdownMenu (lang switcher)
│   │   │   └── button.tsx                 # Phase 1 — cva-based button
│   │   │
│   │   ├── primitives/                    # Phase 2 — custom reusable components
│   │   │   ├── eyebrow.tsx                # Eyebrow badge (amber pill with glow)
│   │   │   ├── section-heading.tsx        # H2 with Outfit + tracking-tight
│   │   │   ├── cta-ghost.tsx              # Tier-1 ghost link with arrow
│   │   │   ├── cta-amber.tsx              # Tier-4 solid amber pill
│   │   │   ├── cta-gradient.tsx           # Tier-3 amber-gradient pill (examples CTA)
│   │   │   ├── style-chip.tsx             # Marquee chip with optional sublabel
│   │   │   └── scroll-reveal.tsx          # Wrapper applying data-reveal + useReveal
│   │   │
│   │   └── sections/                      # Page sections (one file per section)
│   │       ├── navbar.tsx                 # Phase 4 — client, scroll-aware + Sheet + Dropdown
│   │       ├── hero.tsx                   # Phase 4 — client, textarea + chips + ratio + video bg
│   │       ├── style-marquee.tsx          # Phase 4 — client (or server, CSS-only) — infinite scroll
│   │       ├── examples.tsx               # Phase 4 — client, carousel arrows
│   │       ├── workflow.tsx               # Phase 3 — server, 4 alternating rows + videos
│   │       ├── features.tsx               # Phase 3 — server, 4×2 hairline grid
│   │       ├── testimonials.tsx           # Phase 3 — server, 3×2 grid
│   │       ├── use-cases.tsx              # Phase 3 — server, 2×2 grid + corner glow
│   │       ├── faq.tsx                    # Phase 4 — client, Radix Accordion
│   │       ├── final-cta.tsx              # Phase 3 — server, dot-grid + amber pill
│   │       └── footer.tsx                 # Phase 3 — server, 3 columns + brand
│   │
│   ├── lib/
│   │   ├── fonts.ts                       # Phase 1 — GeistSans + GeistMono + Outfit (local)
│   │   ├── utils.ts                       # Phase 1 — cn() helper (clsx + tailwind-merge)
│   │   ├── hooks/
│   │   │   ├── use-scrolled.ts            # Phase 2 — scroll position boolean (threshold 10px)
│   │   │   ├── use-reveal.ts              # Phase 2 — IntersectionObserver + data-revealed
│   │   │   └── use-reduced-motion.ts      # Phase 2 — matchMedia('(prefers-reduced-motion: reduce)')
│   │   └── data/
│   │       ├── nav-links.ts               # Phase 4 — nav link constants
│   │       ├── story-seeds.ts             # Phase 4 — chip → textarea seed mapping
│   │       ├── style-chips.ts             # Phase 4 — marquee chip list
│   │       ├── examples.ts                # Phase 4 — 6 example card data
│   │       ├── workflow-steps.ts          # Phase 3 — 4 step data
│   │       ├── features.ts                # Phase 3 — 8 feature data
│   │       ├── testimonials.ts            # Phase 3 — 6 testimonial data
│   │       ├── use-cases.ts               # Phase 3 — 4 use case data
│   │       ├── faq-items.ts               # Phase 4 — 6 FAQ data
│   │       └── footer-links.ts            # Phase 3 — 3 column footer data
│   │
│   ├── types/
│   │   └── index.ts                       # Phase 2 — shared interfaces (NavLink, StoryExample, etc.)
│   │
│   └── tests/
│       ├── unit/
│       │   ├── use-scrolled.test.ts       # Phase 2 — written before hook (TDD)
│       │   ├── use-reveal.test.ts         # Phase 2 — written before hook (TDD)
│       │   ├── use-reduced-motion.test.ts # Phase 2 — written before hook (TDD)
│       │   ├── cn.test.ts                 # Phase 1 — utility test
│       │   ├── hero-chip-populate.test.tsx    # Phase 4 — chip → textarea
│       │   └── hero-ratio-toggle.test.tsx     # Phase 4 — ratio toggle state
│       └── e2e/
│           ├── hero-cta.spec.ts           # Phase 7 — hero CTA → /auth/sign-up
│           ├── mobile-nav.spec.ts         # Phase 7 — hamburger → Sheet
│           └── faq-accordion.spec.ts      # Phase 7 — accordion expand/collapse
│
├── public/
│   ├── fonts/
│   │   ├── Outfit-VariableFont.woff2      # Phase 6 — self-hosted Outfit (weight 100-900)
│   │   ├── Geist_Variable.woff2            # Phase 6 — fallback if geist pkg fails (usually not needed)
│   │   └── GeistMono_Variable.woff2        # Phase 6 — fallback if geist pkg fails
│   ├── workflow/
│   │   ├── showcase-step1.mp4             # Phase 6 — download from R2
│   │   ├── showcase-step1-poster.webp     # Phase 6 — download from R2
│   │   ├── showcase-step2.mp4             # Phase 6
│   │   ├── showcase-step2-poster.webp     # Phase 6
│   │   ├── showcase-step3.mp4             # Phase 6
│   │   ├── showcase-step3-poster.webp     # Phase 6
│   │   ├── showcase-step4.mp4             # Phase 6
│   │   └── showcase-step4-poster.webp     # Phase 6
│   ├── examples/
│   │   ├── example-1.webp                 # Phase 6 — generated (Confession in Blue Flower Sea)
│   │   ├── example-2.webp                 # Phase 6 — generated (The Last Signal)
│   │   ├── example-3.webp                 # Phase 6 — generated (Murder at Hightower Manor)
│   │   ├── example-4.webp                 # Phase 6 — generated (Beyond the Veil)
│   │   ├── example-5.webp                 # Phase 6 — generated (Tokyo Rain)
│   │   └── example-6.webp                 # Phase 6 — generated (The Grand Tournament)
│   ├── hero-bg.mp4                        # Phase 6 — sourced cinematic dark footage
│   ├── hero-poster.webp                   # Phase 6 — first frame of hero-bg.mp4
│   └── og-image.png                       # Phase 6 — 1200×630 OG image
│
└── scripts/
    ├── download-assets.sh                 # Phase 6 — curl R2 videos + posters
    ├── generate-thumbnails.ts             # Phase 6 — image-generation skill wrapper
    └── compress-hero-video.sh             # Phase 6 — ffmpeg compress to <2MB
```

**File count summary:** ~48 source files + ~18 asset files + 8 config files = ~74 total files.

---

## 6. Cross-Cutting Concerns

### 6.1 TypeScript strict mode

`tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,
    "exactOptionalPropertyTypes": false,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "es2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

**Rules enforced:**
- Zero `any` — use `unknown` or proper types
- `interface` over `type` for object shapes; `type` only for unions
- Early returns; no deep nesting
- `verbatimModuleSyntax` requires `import type` for type-only imports

### 6.2 ESLint flat config

`eslint.config.mjs`:

```js
import { FlatCompat } from '@eslint/eslintrc';
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [...compat.extends('next/core-web-vitals', 'next/typescript')];
```

Plus a custom rule block:
```js
{
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    'react/no-unescaped-entities': 'off',  // We use literal apostrophes in copy
    'react-hooks/exhaustive-deps': 'warn',
  },
}
```

### 6.3 Prettier

`.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 6.4 Accessibility (WCAG 2.1 AA, target AAA)

Mandatory patterns applied across all components:

| Pattern | Implementation |
|---|---|
| Skip-to-content link | `<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-zinc-950">Skip to content</a>` at top of `<body>` |
| Focus rings | `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400` on every interactive element. Global default in `@layer base`: `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }` |
| Semantic HTML | `<nav>`, `<main id="main">`, `<section aria-labelledby="...">`, `<footer>` |
| Touch targets | Min 44×44px on mobile. Ratio toggle wrapped in `min-h-[44px] min-w-[44px]` flex container (visual size unchanged) |
| Hero video | `aria-hidden="true"` (decorative, no audio) |
| Icon-only buttons | `aria-label` always (e.g., hamburger: `aria-label="Open menu"`) |
| Form labels | `<label htmlFor="story-input">` + `<textarea id="story-input">` |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` block in `globals.css` disables all animations, hides autoplay videos, shows `[data-reveal]` content immediately |
| Color contrast | Body text `zinc-300` on `zinc-950` = 12.6:1 (AAA). All combinations verified in PRD §6.4 |
| Mobile nav | shadcn Sheet provides focus trap, Escape close, scroll lock, focus return — verify all four |
| FAQ accordion | Radix provides `aria-expanded`, `aria-controls`, `role="region"` automatically |

### 6.5 Performance budgets

| Metric | Target | Strategy |
|---|---|---|
| Lighthouse Performance | ≥95 | Self-hosted fonts, no CDN, no animation libs, lazy video loading |
| Lighthouse Accessibility | ≥95 | WCAG AA+ compliance, semantic HTML, ARIA |
| Lighthouse Best Practices | ≥95 | HTTPS, no console errors, security headers |
| Lighthouse SEO | ≥95 | Meta tags, OG, JSON-LD structured data |
| LCP | < 2.0s | Hero poster WebP (<50KB) loads immediately; video lazy-loads via `preload="metadata"` |
| CLS | < 0.05 | All media has explicit `width`/`height` or `aspect-ratio`; fonts use `display: swap` + size-adjusted fallbacks |
| INP | < 200ms | Only 5 client components, minimal JS, no animation libraries |
| TBT | < 200ms | Server components for all static sections; hydration only on interactive components |
| JS bundle | < 100KB gzipped | shadcn/ui tree-shaken, no Framer Motion, no Moment, no Lodash |
| CSS bundle | < 30KB gzipped | Tailwind v4 with @source directives, only used utilities ship |
| Above-fold images | < 500KB total | Hero poster WebP, no large images above fold |
| Per-video size | < 2MB | ffmpeg compress to H.264 CRF 28 |

### 6.6 Anti-AI-slop enforcement

The `frontend-design` skill's anti-AI-slop checklist is applied as a hard gate at Phase 7. Specific items enforced:

| AI default | Avoided by |
|---|---|
| Bento grids | Features uses a continuous hairline grid, NOT boxed cards |
| Mesh/Aurora gradients | Only one gradient: yellow→purple on example-card hover (PRD-mandated exception) |
| Glassmorphism everywhere | Glass effect restricted to hero input widget only (`backdrop-blur-xl`) |
| Purple/Violet accents | Amber `#febf00` is the only accent (purple appears ONLY in the example-card hover gradient) |
| "Orchestrate/Empower/Unlock" copy | All copy is PRD-verified verbatim from live site |
| Predictable hero split | Hero is full-bleed video + centered text block, not left/right split |
| Generic Inter/Roboto | Outfit 820 (display) + Geist Sans (body) + Geist Mono (accents) — bespoke pairing |
| Rounded everything | Mixed radii: `rounded-full` (pills, chips), `rounded-2xl` (cards, input), `rounded-xl` (icon containers) |

### 6.7 Security headers (`next.config.ts`)

```ts
const nextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
```

### 6.8 Static export

`src/app/page.tsx` declares:

```tsx
export const dynamic = 'force-static';
```

No SSR, no ISR, no data fetching. The page is fully static at build time.

---

## Phase 0 — Pre-Build Validation Gate

**Goal:** Lock all design decisions. Obtain explicit user confirmation of this `MASTER_EXECUTION_PLAN.md` before writing any code.

**Estimated effort:** 0.5 hour (mostly user review time)

**Files touched:** 0 (this document only)

### Phase 0 checklist

- [ ] User has read this `MASTER_EXECUTION_PLAN.md` in full
- [ ] User has confirmed or overridden each of the 15 decisions in §3 (Critical Pre-Build Decisions)
- [ ] User has confirmed the 8-phase breakdown (Phases 0-7)
- [ ] User has confirmed the testing scope (6 unit tests + 3 E2E tests)
- [ ] User has confirmed the asset sourcing strategy (R2 download + image-generation skill + cinematic stock for hero)
- [ ] User has confirmed the project location (build at root of `/home/z/my-project/story-into-video/`)
- [ ] User has confirmed the stack pin (Next.js 16.1.4+, React 19.2.3+, Tailwind v4.1.18+, TypeScript 5.9+)
- [ ] User has reviewed the risk register (§7) and accepted the mitigations
- [ ] User has explicit go/no-go signal to proceed to Phase 1

### Phase 0 exit criteria

> **GATE:** User responds with explicit "proceed" or "approved" (or returns modifications to the plan). No code is written until this gate is passed.

---

## Phase 1 — Scaffold & Foundation

**Goal:** A bootable Next.js 16 app at `/home/z/my-project/story-into-video/` with correct dependencies, TypeScript strict mode, dark background (`#020202`), Outfit + Geist fonts loading, and the amber `#febf00` token available.

**Estimated effort:** 2-3 hours
**Files touched:** ~12

### Phase 1 — Files to create

#### 1.1 `package.json` (auto-generated by `pnpm create next-app`, then patched)

**Description:** Project manifest with pinned dependencies (per §4.1 and §4.2).

**Interface:**
```json
{
  "name": "story-into-video-clone",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": { /* see §4.1 */ },
  "devDependencies": { /* see §4.2 */ }
}
```

#### 1.2 `tsconfig.json`

**Description:** TypeScript strict mode with `noUncheckedIndexedAccess` and `@/*` path alias.

**Interface:** See §6.1 for full content.

#### 1.3 `next.config.ts`

**Description:** Next.js 16 configuration with security headers, image format optimization, and Turbopack.

**Interface:**
```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
};

export default nextConfig;
```

#### 1.4 `postcss.config.mjs`

**Description:** PostCSS config for Tailwind v4 (uses `@tailwindcss/postcss`, NOT the v3 `tailwindcss` plugin).

**Interface:**
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

#### 1.5 `eslint.config.mjs`

**Description:** ESLint 9 flat config extending `next/core-web-vitals` and `next/typescript`.

**Interface:** See §6.2.

#### 1.6 `.prettierrc.json`

**Description:** Prettier config with `prettier-plugin-tailwindcss` for class sorting.

**Interface:** See §6.3.

#### 1.7 `.gitignore`

**Description:** Standard Next.js gitignore plus project-specific entries.

**Interface:**
```
# dependencies
/node_modules
/.pnp
.pnp.*

# next.js
/.next/
/out/
next-env.d.ts

# production
/build

# misc
.DS_Store
*.pem
.idea/

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env*
!.env.example

# vercel
.vercel

# typescript
*.tsbuildinfo

# playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/

# editor
.vscode/*
!.vscode/extensions.json
```

#### 1.8 `components.json` (shadcn/ui config)

**Description:** shadcn/ui configuration for component installation.

**Interface:**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/lib/hooks"
  },
  "iconLibrary": "lucide"
}
```

#### 1.9 `src/lib/utils.ts`

**Description:** The `cn()` utility (clsx + tailwind-merge) used by every component for class composition.

**Interface:**
```ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

#### 1.10 `src/lib/fonts.ts`

**Description:** Loads Geist Sans, Geist Mono (via `geist` npm package), and Outfit (self-hosted via `next/font/local` for weight 820 access). Exposes CSS variables for Tailwind `@theme` mapping.

**Interface:**
```ts
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import localFont from 'next/font/local';

const outfit = localFont({
  src: '../../public/fonts/Outfit-VariableFont.woff2',
  weight: '100 900',
  variable: '--font-outfit',
  display: 'swap',
});

export const fonts = {
  sans: GeistSans,
  mono: GeistMono,
  heading: outfit,
};

export const fontVariables = [
  GeistSans.variable,
  GeistMono.variable,
  outfit.variable,
].join(' ');
```

> **Note:** The Outfit variable woff2 file (`Outfit-VariableFont.woff2`) is downloaded in Phase 6. For Phase 1, place a placeholder (or skip ahead to Phase 6 step 1 to download it first). The build will not break if the font file is missing — `next/font/local` will warn at build time.

#### 1.11 `src/app/layout.tsx`

**Description:** Root layout — wires fonts to `<html>`, sets `<body>` classes, defines metadata (title, description, OG, Twitter, JSON-LD).

**Interface:**
```tsx
import type { Metadata } from 'next';
import { fontVariables } from '@/lib/fonts';
import './globals.css';

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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'StoryIntoVideo',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'AI-powered story-into-video generation tool.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-400 focus:text-zinc-950 focus:rounded-md focus:font-medium"
        >
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
```

#### 1.12 `src/app/page.tsx` (Phase 1 stub)

**Description:** Phase 1 ships a minimal stub that confirms the foundation works. Phase 3 will replace this with the full section composition.

**Interface:**
```tsx
export const dynamic = 'force-static';

export default function HomePage() {
  return (
    <main id="main" className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-[11px] font-semibold text-amber-400 tracking-widest uppercase">
          Foundation Verified
        </span>
        <h1 className="font-heading text-4xl lg:text-[4.5rem] font-extrabold tracking-[-0.04em] text-foreground leading-[1.02]">
          StoryIntoVideo
        </h1>
        <p className="text-zinc-400 max-w-[52ch] mx-auto">
          Phase 1 complete — Outfit 820, Geist Sans, amber token, dark background all verified.
        </p>
      </div>
    </main>
  );
}
```

> **Note:** `font-extrabold` (800) is used as a temporary fallback here. Once Phase 6 downloads the Outfit variable font, this stub will be replaced by the full Hero section which uses inline `style={{ fontWeight: 820 }}` or a Tailwind arbitrary class `font-[820]` (TBD at Phase 4).

### Phase 1 — Skill consultation

| Skill | What to apply |
|---|---|
| `nextjs16-tailwind4` | §1.1 pinned stack, §1.2 directory structure, §1.4 v3→v4 migration map, §1.6 next.config.ts security headers, §1.7 pre-commit gate |
| `lint-and-validate` | §7.1 quality loop, §7.2 exact commands |
| `planning-and-task-breakdown` | §9.2 acceptance criteria template |
| `coding-agent/planning.md` | Step format: Output + Test |

### Phase 1 — Acceptance checklist

- [ ] `pnpm install` completes without errors
- [ ] `pnpm dev` starts the dev server at `http://localhost:3000`
- [ ] Browser DevTools → Computed Styles on `<body>`: `background-color: rgb(2, 2, 2)` (NOT `#000`)
- [ ] Browser DevTools → Computed Styles on `<h1>`: `font-family` resolves to Outfit (after Phase 6 download; before that, falls back to system-ui — verify the variable `--font-outfit` is set on `<html>`)
- [ ] `:root` CSS variable `--primary` equals `#febf00`
- [ ] `:root` CSS variable `--background` equals `#020202`
- [ ] `:root` CSS variable `--font-sans` includes `var(--font-geist-sans)`
- [ ] `:root` CSS variable `--font-heading` includes `var(--font-outfit)`
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] `pnpm build` succeeds (Phase 1 stub page)
- [ ] shadcn/ui primitives installed: `src/components/ui/accordion.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `button.tsx` all exist
- [ ] `src/lib/utils.ts` exports `cn()` function
- [ ] `src/lib/fonts.ts` exports `fontVariables` string
- [ ] Skip-to-content link is present and functional (Tab key focuses it)
- [ ] JSON-LD structured data script is in the DOM
- [ ] Security headers present in `next.config.ts`

### Phase 1 — Exit gate

> **GATE:** `pnpm dev` boots, page loads at `localhost:3000` with dark background, Outfit variable font is wired (even if file is missing), amber token is in `:root`, skip link works, `pnpm typecheck && pnpm lint && pnpm build` all pass. Then proceed to Phase 2.

---

## Phase 2 — Design System & Primitives

**Goal:** Build the complete design-system layer — Tailwind v4 `@theme` block, all 13 `@keyframes` (kebab-case), utility classes, custom hooks (TDD), shadcn/ui primitives, and the 7 reusable presentational components. After this phase, every visual primitive is in place and individually testable.

**Estimated effort:** 3-4 hours
**Files touched:** ~14
**Hard dependency:** Phase 1 complete

### Phase 2 — Files to create

#### 2.1 `src/app/globals.css` (the heart of the design system)

**Description:** Complete Tailwind v4 CSS-first stylesheet. Converts PRD §9's raw `:root` + `@keyframes` into a single `@theme` block, with all keyframe names normalized to kebab-case (Decision B). Includes `@source` directives, `@layer base`, custom `@utility` declarations, the 13 `@keyframes` blocks, and the `@media (prefers-reduced-motion: reduce)` override.

**Interface (full file content):**

```css
@import 'tailwindcss';

/* ============================================================
   @source — explicit content scanning (v4 best practice)
   ============================================================ */
@source '../components/**/*.{ts,tsx}';
@source '../lib/**/*.{ts,tsx}';

/* ============================================================
   @theme — design tokens (Tailwind v4 CSS-first)
   Converts PRD §9 :root variables to v4 @theme block.
   All keyframe names normalized to kebab-case (Decision B).
   ============================================================ */
@theme {
  /* ── Color Palette (verified hex from PRD §1.2) ── */
  --color-background: #020202;
  --color-foreground: #f8f8f8;
  --color-card: #060607;
  --color-card-foreground: #f8f8f8;
  --color-popover: #0b0b0d;
  --color-popover-foreground: #f8f8f8;
  --color-primary: #febf00;
  --color-primary-foreground: #020202;
  --color-secondary: #111114;
  --color-secondary-foreground: #f8f8f8;
  --color-muted: #1a1a1d;
  --color-muted-foreground: #8e8e95;
  --color-accent: #febf00;
  --color-accent-foreground: #020202;
  --color-destructive: #ff2d39;
  --color-destructive-foreground: #f8f8f8;
  --color-border: #1a1a1d;
  --color-input: #0b0b0d;
  --color-ring: #febf0080;

  /* Chart palette (reserved for future use) */
  --color-chart-1: #febf00;
  --color-chart-2: #00aa6f;
  --color-chart-3: #8d92f9;
  --color-chart-4: #f14d4c;
  --color-chart-5: #7bc27e;

  /* ── Typography ── */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace;
  --font-heading: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;

  /* ── Border Radius ── */
  --radius: 0.75rem;
  --radius-sm: calc(0.75rem - 4px);
  --radius-md: calc(0.75rem - 2px);
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.25rem;

  /* ── Shadows ── */
  --shadow-hero-input: 0 20px 80px rgba(0, 0, 0, 0.6);
  --shadow-eyebrow-glow: 0 0 30px rgba(234, 179, 8, 0.1);
  --shadow-cta-glow: 0 0 40px rgba(251, 191, 36, 0.3);

  /* ── Background images ── */
  --background-image-dot-grid: radial-gradient(circle, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  --background-image-amber-halo: radial-gradient(rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.03) 40%, transparent 70%);

  /* ── Animations (13 keyframes, all kebab-case) ── */
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

  /* ── Keyframes (defined inside @theme so Tailwind v4 picks them up) ── */

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

  @keyframes composite-pulse-text {
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
  @keyframes grid-shimmer {
    0%   { transform: translate(-20%, -30%); }
    50%  { transform: translate(70%, 40%); }
    100% { transform: translate(-20%, -30%); }
  }

  @keyframes grid-sweep-h {
    0%   { transform: translate(-600px); }
    100% { transform: translate(calc(600px + 100vw)); }
  }

  @keyframes grid-sweep-v {
    0%   { transform: translateY(-500px); }
    100% { transform: translateY(calc(500px + 100vh)); }
  }

  @keyframes scanline-scroll {
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
}

/* ============================================================
   @layer base — global element styles
   ============================================================ */
@layer base {
  * {
    border-color: var(--color-border);
  }

  html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
  }

  ::selection {
    background-color: rgba(251, 191, 36, 0.3);
    color: #fff;
  }

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

  :focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

/* ============================================================
   @utility — single-purpose helpers (Tailwind v4 idiom)
   ============================================================ */

@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

@utility marquee-mask {
  -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}

@utility marquee-track {
  display: flex;
  gap: 0.5rem;
  width: max-content;
  animation: var(--animate-marquee-scroll);
  &:hover {
    animation-play-state: paused;
  }
  @media (max-width: 640px) {
    animation-duration: 30s;
  }
}

@utility glass-input {
  position: relative;
  border-radius: var(--radius-2xl);
  background-color: rgb(9 9 11 / 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 1.25rem;
  border: 1px solid rgb(255 255 255 / 0.08);
  transition-property: border-color, box-shadow;
  transition-duration: 500ms;
  box-shadow: var(--shadow-hero-input);

  @media (min-width: 640px) {
    padding: 1.5rem;
  }

  &:hover {
    border-color: rgb(255 255 255 / 0.12);
  }

  &:focus-within {
    border-color: rgb(251 191 36 / 0.3);
    box-shadow: var(--shadow-hero-input), 0 0 30px rgb(251 191 36 / 0.1);
  }
}

@utility eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 1rem;
  border-radius: 9999px;
  background-color: rgb(251 191 36 / 0.1);
  border: 1px solid rgb(251 191 36 / 0.25);
  backdrop-filter: blur(4px);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  box-shadow: var(--shadow-eyebrow-glow);
}

@utility section-heading {
  font-family: var(--font-heading);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #ffffff;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.1;
}

@utility cta-amber {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 0.875rem 2rem;
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  font-weight: 700;
  font-size: 15px;
  border-radius: 9999px;
  transition-property: background-color, box-shadow, transform;
  transition-duration: 200ms;

  &:hover {
    background-color: rgb(252 211 77);
    box-shadow: 0 10px 15px -3px rgb(251 191 36 / 0.2);
    transform: scale(1.02);
  }
}

/* ============================================================
   Scroll reveal (data-attribute driven, CSS-only animation)
   ============================================================ */
[data-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  transition-delay: var(--reveal-delay, 0s);
}
[data-reveal][data-revealed='true'] {
  opacity: 1;
  transform: translateY(0);
}

/* ============================================================
   Radix accordion content animation (grid-template-rows trick)
   ============================================================ */
.radix-accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms ease-out;
}
.radix-accordion-content[data-state='open'] {
  grid-template-rows: 1fr;
}
.radix-accordion-content > div {
  overflow: hidden;
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

> **Key changes from PRD §9 verbatim:**
> 1. `:root` block converted to `@theme { … }` block (Decision A)
> 2. All camelCase keyframe names normalized to kebab-case (Decision B)
> 3. `@keyframes` blocks moved INSIDE `@theme` so Tailwind v4 picks them up via `--animate-*` tokens
> 4. `@layer components` `.eyebrow`, `.section-heading`, `.cta-amber`, `.glass-input` converted to `@utility` declarations (Tailwind v4 idiom — `@layer components` is discouraged in v4 per the `tailwind-patterns` skill)
> 5. Added explicit `@source` directives (Decision I)

#### 2.2 `src/lib/hooks/use-scrolled.ts` (TDD — write test first)

**Description:** Client hook returning `true` when `window.scrollY > threshold`. Used by Navbar for scroll-aware background.

**Interface:**
```ts
'use client';

import { useEffect, useState } from 'react';

export function useScrolled(threshold = 10): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll(); // Initialize on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
```

#### 2.3 `src/lib/hooks/use-reveal.ts` (TDD — write test first)

**Description:** Client hook wrapping `IntersectionObserver`. Returns a `ref` to attach and a `revealed` boolean. Observer disconnects after first intersection (one-shot).

**Interface:**
```ts
'use client';

import { useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

interface UseRevealReturn<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  revealed: boolean;
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {},
): UseRevealReturn<T> {
  const { threshold = 0.15, rootMargin = '0px 0px -50px 0px', once = true } = options;
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setRevealed(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setRevealed(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, revealed };
}
```

#### 2.4 `src/lib/hooks/use-reduced-motion.ts` (TDD — write test first)

**Description:** Client hook returning `true` when the user has OS-level reduced-motion preference enabled.

**Interface:**
```ts
'use client';

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mediaQuery.matches);

    onChange(); // Initialize
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
```

#### 2.5 `src/types/index.ts`

**Description:** Shared TypeScript interfaces used across multiple components. All use `interface` (not `type`) per project convention.

**Interface:**
```ts
import type { LucideIcon } from 'lucide-react';

export interface NavLink {
  label: string;
  href: string;
}

export interface StoryExample {
  label: string;
  seed: string;
}

export interface AspectRatio {
  label: '9:16' | '16:9';
  value: 'portrait' | 'landscape';
}

export interface ExampleCard {
  id: string;
  title: string;
  styleTag: string;
  thumbnail: string;
  href: string;
}

export interface WorkflowStep {
  number: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  videoSrc: string;
  videoPoster: string;
  mediaPosition: 'left' | 'right';
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  initials: string;
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface StyleChip {
  label: string;
  sublabel?: string;
}
```

#### 2.6 `src/components/primitives/eyebrow.tsx`

**Description:** Server component. Renders the amber eyebrow badge used in every section header. Uses the `eyebrow` `@utility` class.

**Interface:**
```tsx
import { cn } from '@/lib/utils';

interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return <span className={cn('eyebrow', className)}>{children}</span>;
}
```

#### 2.7 `src/components/primitives/section-heading.tsx`

**Description:** Server component. Renders an H2 with the `section-heading` `@utility` class. Polymorphic `as` prop allows rendering as h1/h2/h3.

**Interface:**
```tsx
import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
}

export function SectionHeading({ children, as: Tag = 'h2', className }: SectionHeadingProps) {
  return <Tag className={cn('section-heading', className)}>{children}</Tag>;
}
```

#### 2.8 `src/components/primitives/cta-ghost.tsx`

**Description:** Server component. Tier-1 ghost link with animated arrow (translates right on hover). Used by Workflow, Features, Testimonials, UseCases sections.

**Interface:**
```tsx
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CtaGhostProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

export function CtaGhost({ children, href, className }: CtaGhostProps) {
  return (
    <a
      href={href}
      className={cn(
        'group inline-flex items-center gap-2 text-amber-400 hover:text-amber-300',
        'font-medium text-sm transition-colors duration-200',
        className,
      )}
    >
      {children}
      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  );
}
```

#### 2.9 `src/components/primitives/cta-amber.tsx`

**Description:** Server component (or client if `onClick` provided). Tier-4 solid amber pill — the page's conversion crescendo. Used only by FinalCTA.

**Interface:**
```tsx
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CtaAmberProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  onClick?: () => void;
}

export function CtaAmber({ children, href, className, onClick }: CtaAmberProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        'cta-amber group inline-flex items-center gap-2.5',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
        className,
      )}
    >
      {children}
      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  );
}
```

#### 2.10 `src/components/primitives/cta-gradient.tsx`

**Description:** Server component. Tier-3 amber-gradient pill. Used only by Examples section ("Clone this project for free").

**Interface:**
```tsx
import { cn } from '@/lib/utils';

interface CtaGradientProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

export function CtaGradient({ children, href, className }: CtaGradientProps) {
  return (
    <a
      href={href}
      className={cn(
        'group inline-flex items-center gap-2.5 px-10 py-4 rounded-full',
        'text-[15px] font-semibold transition-all duration-200',
        'bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950',
        'hover:shadow-lg hover:shadow-amber-400/30',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
        className,
      )}
    >
      {children}
    </a>
  );
}
```

> **Note:** Tailwind v4 supports `bg-gradient-to-r` as an alias for `bg-linear-to-r` (the v4-preferred name). Either works; we use `bg-gradient-to-r` to match the PRD's class strings verbatim.

#### 2.11 `src/components/primitives/style-chip.tsx`

**Description:** Server component (or client if `onClick` provided). Marquee chip with optional sublabel (used for "Cyberpunk Futuristic neon").

**Interface:**
```tsx
import { cn } from '@/lib/utils';

interface StyleChipProps {
  label: string;
  sublabel?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function StyleChip({ label, sublabel, active = false, onClick, className }: StyleChipProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full',
        'border border-white/10 bg-white/[0.02]',
        'text-sm font-bold whitespace-nowrap transition-colors duration-200',
        active
          ? 'text-amber-300 border-amber-400/30'
          : 'text-white/50 hover:text-amber-300 hover:border-amber-400/30',
        className,
      )}
    >
      <span>{label}</span>
      {sublabel && <span className="text-xs text-zinc-500">{sublabel}</span>}
    </Component>
  );
}
```

#### 2.12 `src/components/primitives/scroll-reveal.tsx`

**Description:** Client component. Wraps children with `data-reveal` attribute + `useReveal` hook. Optional `delay` prop sets `--reveal-delay` CSS variable.

**Interface:**
```tsx
'use client';

import { type ReactNode } from 'react';
import { useReveal } from '@/lib/hooks/use-reveal';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number; // in milliseconds
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}

export function ScrollReveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const { ref, revealed } = useReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-revealed={revealed ? 'true' : 'false'}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
```

#### 2.13 `src/tests/unit/cn.test.ts`

**Description:** Unit test for the `cn()` utility. Verifies clsx composition + tailwind-merge deduplication.

**Interface:**
```ts
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'no', true && 'yes')).toBe('base yes');
  });

  it('dedupes conflicting Tailwind classes (tailwind-merge)', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles arrays and objects (clsx)', () => {
    expect(cn(['a', { b: true, c: false }])).toBe('a b');
  });
});
```

#### 2.14 `src/tests/unit/use-scrolled.test.ts` (RED → GREEN → REFACTOR)

**Description:** TDD test for `useScrolled` hook. Written BEFORE the hook implementation. Mocks `window.scrollY` and `window.addEventListener`.

**Interface:**
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrolled } from '@/lib/hooks/use-scrolled';

describe('useScrolled', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollY', 0);
  });

  it('returns false when scrollY is below threshold', () => {
    vi.stubGlobal('scrollY', 5);
    const { result } = renderHook(() => useScrolled(10));
    expect(result.current).toBe(false);
  });

  it('returns true when scrollY exceeds threshold', () => {
    vi.stubGlobal('scrollY', 15);
    const { result } = renderHook(() => useScrolled(10));
    expect(result.current).toBe(true);
  });

  it('updates on scroll event', () => {
    vi.stubGlobal('scrollY', 0);
    const { result } = renderHook(() => useScrolled(10));
    expect(result.current).toBe(false);

    act(() => {
      vi.stubGlobal('scrollY', 20);
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });
});
```

#### 2.15 `src/tests/unit/use-reveal.test.ts` and `src/tests/unit/use-reduced-motion.test.ts`

**Description:** TDD tests for the other two hooks. Mock `IntersectionObserver` and `window.matchMedia` respectively. Written before the hook implementations.

**Interface (use-reveal):**
```ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReveal } from '@/lib/hooks/use-reveal';

describe('useReveal', () => {
  it('returns revealed=false initially', () => {
    const { result } = renderHook(() => useReveal());
    expect(result.current.revealed).toBe(false);
    expect(result.current.ref.current).toBeNull();
  });

  it('sets revealed=true when IntersectionObserver fires', async () => {
    const observers: IntersectionObserver[] = [];
    class MockIntersectionObserver {
      callback: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.callback = cb;
        observers.push(this as unknown as IntersectionObserver);
      }
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    const { result } = renderHook(() => useReveal());
    expect(result.current.revealed).toBe(false);

    // Simulate intersection
    const [observer] = observers;
    if (!observer) throw new Error('Observer not created');
    observer.callback([{ isIntersecting: true } as IntersectionObserverEntry], observer);

    expect(result.current.revealed).toBe(true);
  });
});
```

### Phase 2 — Skill consultation

| Skill | What to apply |
|---|---|
| `tailwind-patterns` | §4.1 `@theme` template, §4.7 anti-patterns (avoid `@apply` heavily, use `@utility`), §4.9 v3→v4 gotchas |
| `nextjs16-tailwind4` | §1.3 `@theme` block template, §1.4 v3→v4 migration map (`@layer utilities` → `@utility`), §1.5 v4 pitfalls |
| `ui-styling` | §2.1 shadcn/ui install commands, §2.3 accessibility patterns (focus-visible, skip link, aria-label), §2.4 a11y testing checklist |
| `frontend-design` | §3.1 anti-AI-slop checklist, §3.2 WCAG AAA targets, §3.6 animation timing (entrance/exit easing) |
| `visual-design-foundations` | §5.3 8-point spacing system, §5.4 iconography rules (24px lucide-react, stroke-1.5) |
| `test-driven-development` | §12.1 Red/Green/Refactor cycle, §12.4 which behaviors to test (hooks), §12.5 test state not interactions |

### Phase 2 — Acceptance checklist

- [ ] `src/app/globals.css` contains the `@theme { … }` block with all color, font, radius, shadow, and animation tokens
- [ ] All 13 `@keyframes` blocks are inside `@theme`, using kebab-case names (`fade-in-up`, `float`, `glow-pulse`, `border-glow`, `composite-pulse-text`, `shimmer`, `btn-shimmer`, `grid-shimmer`, `grid-sweep-h`, `grid-sweep-v`, `scanline-scroll`, `lang-dropdown-in`, `marquee-scroll`)
- [ ] `@utility` declarations exist for: `scrollbar-hide`, `marquee-mask`, `marquee-track`, `glass-input`, `eyebrow`, `section-heading`, `cta-amber`
- [ ] `@layer base` includes global `:focus-visible` ring, body bg/color, scrollbar styling, selection color
- [ ] `@media (prefers-reduced-motion: reduce)` block disables all animations, hides autoplay videos, shows `[data-reveal]` content
- [ ] `[data-reveal]` and `[data-reveal][data-revealed='true']` CSS rules exist
- [ ] `.radix-accordion-content` Grid `0fr → 1fr` transition rules exist
- [ ] `tailwind.config.ts` does NOT exist (Decision A — CSS-first only)
- [ ] `src/lib/hooks/use-scrolled.ts` exists and exports `useScrolled(threshold)`
- [ ] `src/lib/hooks/use-reveal.ts` exists and exports `useReveal<T>()` returning `{ ref, revealed }`
- [ ] `src/lib/hooks/use-reduced-motion.ts` exists and exports `useReducedMotion()`
- [ ] All 7 primitives exist in `src/components/primitives/`: `eyebrow.tsx`, `section-heading.tsx`, `cta-ghost.tsx`, `cta-amber.tsx`, `cta-gradient.tsx`, `style-chip.tsx`, `scroll-reveal.tsx`
- [ ] `src/types/index.ts` exports all 10 interfaces: `NavLink`, `StoryExample`, `AspectRatio`, `ExampleCard`, `WorkflowStep`, `Feature`, `Testimonial`, `UseCase`, `FAQItem`, `FooterColumn`, `StyleChip`
- [ ] All shadcn/ui primitives installed: `accordion.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `button.tsx`
- [ ] `pnpm test` passes — 4 unit tests (`cn`, `useScrolled`, `useReveal`, `useReducedMotion`) all green
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] `pnpm build` succeeds
- [ ] Manual verification: temporarily add `<Eyebrow>Test</Eyebrow>` to Phase 1 stub page — amber pill with glow renders correctly
- [ ] Manual verification: temporarily add `<ScrollReveal>Test</ScrollReveal>` to stub page — element starts at opacity 0, fades in on scroll

### Phase 2 — Exit gate

> **GATE:** All `@utility` classes render correctly when used in JSX. All 3 hooks pass their unit tests (Red → Green achieved). All 7 primitives exist with correct TypeScript interfaces. `pnpm test && pnpm typecheck && pnpm lint && pnpm build` all pass. Then proceed to Phase 3 (and optionally parallelize Phase 4).

---

## Phase 3 — Static Sections (Server Components)

**Goal:** Build all 6 server-side section components (Footer, FinalCTA, Features, Testimonials, UseCases, Workflow) plus the 5 data files backing them. Compose them into `app/page.tsx` in the correct fixed order. After this phase, scrolling through the page shows every section with correct content and hover effects — only interactive sections (Navbar, Hero, Examples, FAQ) are missing.

**Estimated effort:** 3-4 hours
**Files touched:** ~12 (6 section components + 5 data files + 1 page.tsx rewrite)
**Hard dependency:** Phase 2 complete
**Parallelizable with:** Phase 4 (different files, no shared state) and Phase 6 (assets are independent of code)

### Phase 3 — Files to create

#### 3.1 `src/lib/data/footer-links.ts`

**Description:** Footer link data — 3 columns + brand info. All copy verbatim from PRD §12.1 Footer section.

**Interface:**
```ts
import type { FooterColumn } from '@/types';

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'All AI Tools',
    links: [
      { label: 'Script to Video', href: '#' },
      { label: 'AI Image Generator', href: '#' },
      { label: 'AI Video Generation', href: '#' },
      { label: 'Kling 3 Video', href: '#' },
      { label: 'Hailuo 2.3 Video', href: '#' },
      { label: 'Seedance 2 Video', href: '#' },
      { label: 'Seedance 1.5 Pro', href: '#' },
      { label: 'Seedream Image', href: '#' },
      { label: 'GPT Image 2', href: '#' },
      { label: 'Nano Banana', href: '#' },
    ],
  },
  {
    title: 'Use Cases',
    links: [
      { label: 'Bedtime Story Video', href: '#' },
      { label: 'Kids Story Video', href: '#' },
      { label: 'Birthday Video', href: '#' },
      { label: "Father's Day Video", href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Contact Us', href: '#' },
    ],
  },
];

export const FOOTER_BRAND = {
  name: 'StoryIntoVideo',
  tagline: 'Turn any story into a cinematic video with AI.',
  supportEmail: 'support@storyintovideo.com',
} as const;

export const FOOTER_COPYRIGHT = '© 2026 StoryIntoVideo. All rights reserved.';
```

#### 3.2 `src/components/sections/footer.tsx`

**Description:** Server component. Brand block (left) + 3 link columns + bottom row (copyright + legal links).

**Interface:**
```tsx
import { FOOTER_COLUMNS, FOOTER_BRAND, FOOTER_COPYRIGHT } from '@/lib/data/footer-links';

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-white/[0.06] py-16 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand block */}
          <div className="lg:col-span-1">
            <a href="/" className="font-heading text-base font-medium text-white tracking-tight">
              {FOOTER_BRAND.name}
            </a>
            <p className="text-sm text-zinc-400 mt-2 max-w-[24ch]">{FOOTER_BRAND.tagline}</p>
            <a
              href={`mailto:${FOOTER_BRAND.supportEmail}`}
              className="inline-block mt-4 text-sm text-zinc-400 hover:text-amber-400 transition-colors"
            >
              {FOOTER_BRAND.supportEmail}
            </a>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                {col.title}
              </h3>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="block py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="border-t border-white/[0.06] mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-zinc-500">{FOOTER_COPYRIGHT}</p>
          <nav className="flex gap-6" aria-label="Legal">
            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">All AI Tools</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
```

#### 3.3 `src/components/sections/final-cta.tsx`

**Description:** Server component. Dot-grid bg + radial amber halo + top/bottom fades + H2 + subtitle + solid amber pill CTA + footnote. The page's conversion crescendo.

**Interface:**
```tsx
import { CtaAmber } from '@/components/primitives/cta-amber';
import { ArrowRight } from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Decorative layers */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
        style={{
          background:
            'radial-gradient(rgba(234,179,8,0.1) 0%, rgba(234,179,8,0.03) 40%, transparent 70%)',
        }}
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-zinc-950 to-transparent pointer-events-none" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-heading text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter text-white mb-6">
          Your Story Deserves to Be Seen
        </h2>
        <p className="text-base sm:text-lg text-zinc-400 mb-10 max-w-[52ch] mx-auto leading-relaxed">
          Join thousands of creators turning their stories into cinematic videos with AI.
          No editing skills required — just paste your story and watch it come alive.
        </p>
        <CtaAmber href="/auth/sign-up">
          Start Creating — It&apos;s Free
        </CtaAmber>
        <p className="mt-6 text-xs text-zinc-500">No credit card required · Free forever plan</p>
      </div>
    </section>
  );
}
```

#### 3.4 `src/lib/data/features.ts`

**Description:** 8 feature items with lucide-react icons. All copy verbatim from PRD §12.1 Features section.

**Interface:**
```ts
import { FileText, Users, Mic, Sparkles, Film, Captions, Download, Plus } from 'lucide-react';
import type { Feature } from '@/types';

export const FEATURES: Feature[] = [
  {
    id: 'ai-script-analysis',
    title: 'AI Script Analysis',
    description: 'Paste any story and AI identifies characters, scenes, and narrative structure — automatically.',
    icon: FileText,
  },
  {
    id: 'character-consistency',
    title: 'Character Consistency',
    description: 'Same character face across all scenes. AI-powered visual identity keeps every character on-model.',
    icon: Users,
  },
  {
    id: 'multi-voice-narration',
    title: 'Multi-Voice Narration',
    description: 'Natural AI voiceovers from ElevenLabs. Multiple voice styles bring every character to life.',
    icon: Mic,
  },
  {
    id: 'ai-powered',
    title: '100% AI Powered',
    description: 'Latest AI models for image generation, video synthesis, and voice cloning — the entire pipeline.',
    icon: Sparkles,
  },
  {
    id: 'scene-generation',
    title: 'Scene Generation',
    description: 'AI generates cinematic scenes that match your story\'s settings, mood, and atmosphere.',
    icon: Film,
  },
  {
    id: 'dynamic-subtitles',
    title: 'Dynamic Subtitles',
    description: 'Auto-generated subtitles with precise timing and ASR alignment. Every word of your story.',
    icon: Captions,
  },
  {
    id: 'one-click-export',
    title: 'One-Click Export',
    description: 'Export your finished story video with subtitles, voiceover, and background music in one click.',
    icon: Download,
  },
  {
    id: 'and-much-more',
    title: 'And Much More...',
    description: 'StoryIntoVideo is constantly evolving with new story-into-video features added every week.',
    icon: Plus,
  },
];
```

#### 3.5 `src/components/sections/features.tsx`

**Description:** Server component. 4×2 grid with continuous hairline borders. Three coordinated hover effects: left accent bar (neutral→amber), title slide right (8px), surface sheen (opacity 0→1).

**Interface:**
```tsx
import { FEATURES } from '@/lib/data/features';
import { CtaGhost } from '@/components/primitives/cta-ghost';
import { Eyebrow } from '@/components/primitives/eyebrow';
import { SectionHeading } from '@/components/primitives/section-heading';
import { cn } from '@/lib/utils';

export function Features() {
  return (
    <section className="py-24 bg-zinc-950 relative overflow-hidden" aria-labelledby="features-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <Eyebrow className="mb-4">FEATURES</Eyebrow>
          <SectionHeading id="features-heading">
            Creating AI Videos Has Never Been So Easy
          </SectionHeading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            const isRightColumn = (idx + 1) % 4 === 0; // lg only
            const isBottomRow = idx >= 4; // lg only
            return (
              <div
                key={feature.id}
                className={cn(
                  'group relative border-b border-r border-neutral-800 py-10 px-8',
                  'transition-colors duration-300',
                  isRightColumn && 'lg:border-r-0',
                  isBottomRow && 'lg:border-b-0',
                  // md grid: 2 cols — every 2nd item is right column
                  (idx + 1) % 2 === 0 && 'md:border-r-0',
                )}
              >
                {/* Left accent bar */}
                <div
                  aria-hidden="true"
                  className="absolute start-0 top-8 bottom-8 w-[3px] rounded-e-full bg-neutral-800 group-hover:bg-amber-400 transition-colors duration-300"
                />

                {/* Icon */}
                <div className="mb-5 text-zinc-400 group-hover:text-amber-400 transition-colors duration-300">
                  <Icon className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
                </div>

                {/* Title */}
                <h3 className="text-[17px] font-bold text-white mb-2.5 group-hover:translate-x-2 transition-transform duration-300">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>

                {/* Bottom gradient sheen on hover */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                />
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <CtaGhost href="#">Start Creating Your Video</CtaGhost>
        </div>
      </div>
    </section>
  );
}
```

#### 3.6 `src/lib/data/testimonials.ts`

**Description:** 6 testimonial items with initials. All copy verbatim from PRD §12.1 Testimonials section.

**Interface:**
```ts
import type { Testimonial } from '@/types';

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'sarah-k',
    quote: 'I turned my fan fiction into a full animated short in under an hour. The story-into-video pipeline is seamless — character consistency across scenes is incredible.',
    authorName: 'Sarah K.',
    authorRole: 'Fan Fiction Writer',
    initials: 'SK',
  },
  {
    id: 'marcus-l',
    quote: 'As a solo filmmaker, this story-into-video tool replaced an entire pre-production team. I turn scripts into visual storyboards in minutes instead of days.',
    authorName: 'Marcus L.',
    authorRole: 'Solo Filmmaker',
    initials: 'ML',
  },
  {
    id: 'yuki-t',
    quote: 'I can finally show my readers what my characters look like. I turn my light novel chapters into video trailers and the anime style output is incredible.',
    authorName: 'Yuki T.',
    authorRole: 'Light Novel Author',
    initials: 'YT',
  },
  {
    id: 'david-r',
    quote: 'We turn product stories into video for social media daily. What used to take a video agency two weeks, we now do in an afternoon with StoryIntoVideo.',
    authorName: 'David R.',
    authorRole: 'Marketing Lead',
    initials: 'DR',
  },
  {
    id: 'priya-m',
    quote: 'My students are more engaged than ever. I turn historical narratives into short story videos they actually want to watch — no filming needed.',
    authorName: 'Priya M.',
    authorRole: 'Educator',
    initials: 'PM',
  },
  {
    id: 'alex-c',
    quote: 'I turn trending stories into video content 3-4 times a week now. The AI voiceover quality is great and my channel grew 10x in two months.',
    authorName: 'Alex C.',
    authorRole: 'YouTube Creator',
    initials: 'AC',
  },
];
```

#### 3.7 `src/components/sections/testimonials.tsx`

**Description:** Server component. 3×2 grid. Card = quote + avatar (initials in amber gradient circle) + name + role. Border lightens on hover.

**Interface:**
```tsx
import { TESTIMONIALS } from '@/lib/data/testimonials';
import { CtaGhost } from '@/components/primitives/cta-ghost';
import { Eyebrow } from '@/components/primitives/eyebrow';
import { SectionHeading } from '@/components/primitives/section-heading';

export function Testimonials() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-zinc-950" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <Eyebrow className="mb-4">TESTIMONIALS</Eyebrow>
          <SectionHeading id="testimonials-heading">Loved by Creators</SectionHeading>
          <p className="text-base sm:text-lg text-zinc-400 max-w-[45ch] mx-auto mt-4">
            Hear from creators who use StoryIntoVideo to turn their stories into videos every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.id}
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 sm:p-6 hover:border-zinc-700/60 transition-colors duration-300"
            >
              <blockquote>
                <p className="text-sm text-zinc-300 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-zinc-950"
                  style={{ background: 'linear-gradient(to bottom right, #fbbf24, #d97706)' }}
                  aria-hidden="true"
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.authorName}</p>
                  <p className="text-xs text-zinc-500">{t.authorRole}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="text-center mt-12">
          <CtaGhost href="#">Join Creators — Start Free</CtaGhost>
        </div>
      </div>
    </section>
  );
}
```

#### 3.8 `src/lib/data/use-cases.ts`

**Description:** 4 use case items with icons. All copy verbatim from PRD §12.1 UseCases section.

**Interface:**
```ts
import { BookOpen, Video, Clapperboard, GraduationCap } from 'lucide-react';
import type { UseCase } from '@/types';

export const USE_CASES: UseCase[] = [
  {
    id: 'novel-writers',
    title: 'Novel & Fiction Writers',
    description: 'Turn your novel into video — create visual trailers or full short dramas from your story. Give readers a cinematic taste of your story before they dive in.',
    icon: BookOpen,
    href: '#',
  },
  {
    id: 'content-creators',
    title: 'Content Creators',
    description: 'Turn trending stories into video for YouTube Shorts and TikTok. Build faceless channels with StoryIntoVideo\'s AI-generated content.',
    icon: Video,
    href: '#',
  },
  {
    id: 'filmmakers',
    title: 'Filmmakers & Studios',
    description: 'Turn your script into video storyboards instantly. See your story come alive as a video before production — perfect for pitching and pre-visualization.',
    icon: Clapperboard,
    href: '#',
  },
  {
    id: 'educators',
    title: 'Educators & Trainers',
    description: 'Turn educational stories into video lessons. Make complex narratives memorable through AI-powered story-into-video generation.',
    icon: GraduationCap,
    href: '#',
  },
];
```

#### 3.9 `src/components/sections/use-cases.tsx`

**Description:** Server component. 2×2 grid. Each card is an `<a>` with corner amber glow on hover, icon container, title (color shift on hover), description, "Try it now →" CTA.

**Interface:**
```tsx
import { USE_CASES } from '@/lib/data/use-cases';
import { Eyebrow } from '@/components/primitives/eyebrow';
import { SectionHeading } from '@/components/primitives/section-heading';
import { ArrowRight } from 'lucide-react';

export function UseCases() {
  return (
    <section className="py-24 bg-zinc-950 relative overflow-hidden" aria-labelledby="use-cases-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <Eyebrow className="mb-4">USE CASES</Eyebrow>
          <SectionHeading id="use-cases-heading">Built for Storytellers</SectionHeading>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            return (
              <a
                key={uc.id}
                href={uc.href}
                className="group block relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:bg-white/[0.04] hover:border-amber-400/20 transition-all duration-300 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              >
                {/* Decorative corner gradient */}
                <div
                  aria-hidden="true"
                  className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                />

                {/* Icon */}
                <div className="relative mb-6 w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                  <Icon className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-amber-300 transition-colors">
                  {uc.title}
                </h3>

                {/* Description */}
                <p className="text-zinc-400 leading-relaxed mb-6">{uc.description}</p>

                {/* CTA */}
                <span className="inline-flex items-center gap-2 text-amber-400 font-medium text-sm">
                  Try it now
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

#### 3.10 `src/lib/data/workflow-steps.ts`

**Description:** 4 workflow step items with video URLs, posters, media positions. All copy verbatim from PRD §12.1 Workflow section.

**Interface:**
```ts
import type { WorkflowStep } from '@/types';

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    number: 1,
    title: 'Create Your Project',
    description: 'Paste your story in any language — novel, script, or narrative. Pick a visual style and aspect ratio.',
    ctaLabel: 'Start Your Story',
    ctaHref: '#',
    videoSrc: '/workflow/showcase-step1.mp4',
    videoPoster: '/workflow/showcase-step1-poster.webp',
    mediaPosition: 'right',
  },
  {
    number: 2,
    title: 'Generate Characters & Scenes',
    description: 'AI reads your story and performs automatic scene breakdown — creating consistent character portraits.',
    ctaLabel: 'Create Your Characters',
    ctaHref: '#',
    videoSrc: '/workflow/showcase-step2.mp4',
    videoPoster: '/workflow/showcase-step2-poster.webp',
    mediaPosition: 'left',
  },
  {
    number: 3,
    title: 'AI Storyboard',
    description: 'AI breaks your story into shots and generates storyboard images automatically, with full character consistency.',
    ctaLabel: 'Try AI Storyboard',
    ctaHref: '#',
    videoSrc: '/workflow/showcase-step3.mp4',
    videoPoster: '/workflow/showcase-step3-poster.webp',
    mediaPosition: 'right',
  },
  {
    number: 4,
    title: 'Professional Timeline Editor',
    description: 'Full creative control in the timeline editor. Add AI voiceover and background music, style subtitles.',
    ctaLabel: 'Create Your Video',
    ctaHref: '#',
    videoSrc: '/workflow/showcase-step4.mp4',
    videoPoster: '/workflow/showcase-step4-poster.webp',
    mediaPosition: 'left',
  },
];
```

#### 3.11 `src/components/sections/workflow.tsx`

**Description:** Server component. 4 alternating media/text rows. Each row: 2-col grid (lg), media side (video with poster), text side (step counter in GeistMono + horizontal rule + H3 + description + ghost CTA). Mobile: single column, media above text, `object-contain` instead of `object-cover`.

**Interface:**
```tsx
import { WORKFLOW_STEPS } from '@/lib/data/workflow-steps';
import { Eyebrow } from '@/components/primitives/eyebrow';
import { SectionHeading } from '@/components/primitives/section-heading';
import { CtaGhost } from '@/components/primitives/cta-ghost';
import { cn } from '@/lib/utils';

export function Workflow() {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 bg-zinc-950 overflow-hidden" aria-labelledby="workflow-heading">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <Eyebrow className="mb-4">HOW IT WORKS</Eyebrow>
          <SectionHeading id="workflow-heading">From Story to Video in 4 Steps</SectionHeading>
        </div>

        <div className="space-y-16 lg:space-y-24">
          {WORKFLOW_STEPS.map((step) => (
            <div key={step.number} className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Media side */}
              <div
                className={cn(
                  'relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-zinc-900',
                  step.mediaPosition === 'left' ? 'lg:order-1' : 'lg:order-2',
                )}
              >
                <video
                  className="absolute inset-0 w-full h-full object-cover lg:object-contain transition-opacity duration-700"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={step.videoPoster}
                  aria-hidden="true"
                >
                  <source src={step.videoSrc} type="video/mp4" />
                </video>
              </div>

              {/* Text side */}
              <div
                className={cn(
                  step.mediaPosition === 'left' ? 'lg:order-2' : 'lg:order-1',
                )}
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-mono text-[10px] tabular-nums text-zinc-600">
                    {String(step.number).padStart(2, '0')}
                  </span>
                  <span className="h-px flex-1 bg-neutral-800" aria-hidden="true" />
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-white tracking-tight leading-tight mb-5">
                  {step.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed mb-6">{step.description}</p>
                <CtaGhost href={step.ctaHref}>{step.ctaLabel}</CtaGhost>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

#### 3.12 `src/app/page.tsx` (Phase 3 partial — stub interactive sections)

**Description:** Composes the 6 static sections in fixed order. Interactive sections (Navbar, Hero, Examples, FAQ) are temporarily stubbed with placeholder divs — they will be replaced in Phase 4.

**Interface:**
```tsx
import { Footer } from '@/components/sections/footer';
import { FinalCTA } from '@/components/sections/final-cta';
import { Features } from '@/components/sections/features';
import { Testimonials } from '@/components/sections/testimonials';
import { UseCases } from '@/components/sections/use-cases';
import { Workflow } from '@/components/sections/workflow';

export const dynamic = 'force-static';

export default function HomePage() {
  return (
    <>
      {/* Phase 4 will replace these stubs */}
      <div className="h-16 bg-transparent" aria-hidden="true" /> {/* Navbar spacer */}
      <div className="py-32 text-center text-zinc-500">[Hero placeholder — Phase 4]</div>
      <div className="py-32 text-center text-zinc-500">[Examples placeholder — Phase 4]</div>

      {/* Static sections (Phase 3) */}
      <Workflow />
      <Features />
      <Testimonials />
      <UseCases />

      {/* Phase 4 will insert FAQ here */}
      <div className="py-32 text-center text-zinc-500">[FAQ placeholder — Phase 4]</div>

      <FinalCTA />
      <Footer />
    </>
  );
}
```

### Phase 3 — Skill consultation

| Skill | What to apply |
|---|---|
| `frontend-design` | §3.1 anti-AI-slop (continuous hairline grid for Features, not boxed cards; corner glow only on UseCases), §3.3 8-pt grid, §3.7 UX laws (Von Restorff — amber rationing) |
| `frontend-development` | Server component patterns, file organization, `interface` over `type` |
| `ui-styling` | §2.3 semantic HTML (`<section aria-labelledby>`, `<figure>`, `<figcaption>`, `<blockquote>`), focus-visible on UseCase `<a>` |
| `performance-optimization` | §6.3 video preload="metadata", §6.6 Server Components by default |

### Phase 3 — Acceptance checklist

- [ ] All 5 data files exist: `footer-links.ts`, `features.ts`, `testimonials.ts`, `use-cases.ts`, `workflow-steps.ts`
- [ ] All 6 section components exist: `footer.tsx`, `final-cta.tsx`, `features.tsx`, `testimonials.tsx`, `use-cases.tsx`, `workflow.tsx`
- [ ] All copy strings match PRD §12.1 verbatim (spot-check 3 random items per section)
- [ ] Features grid renders as 4×2 on desktop, 2×2 on tablet, 1×8 on mobile
- [ ] Features hover effects: accent bar neutral→amber, title slides right, sheen appears
- [ ] Features right column has `lg:border-r-0`, bottom row has `lg:border-b-0`
- [ ] Testimonials grid renders as 3×2 / 2×3 / 1×6
- [ ] Testimonials avatar shows initials in amber gradient circle
- [ ] UseCases grid renders as 2×2 on desktop
- [ ] UseCases corner glow reveals on hover (500ms fade)
- [ ] Workflow steps alternate media left/right on desktop
- [ ] Workflow step counter uses GeistMono with `tabular-nums`
- [ ] Workflow videos have `poster`, `preload="metadata"`, `autoPlay muted loop playsInline`
- [ ] FinalCTA shows dot-grid bg, radial amber halo, top/bottom fades
- [ ] FinalCTA H2 scales `text-3xl sm:text-5xl md:text-7xl`
- [ ] Footer has 3 link columns + brand block + bottom row
- [ ] Footer support email hovers to amber
- [ ] All sections have `aria-labelledby` pointing to their H2 id
- [ ] All icons use `strokeWidth={1.5}` and `aria-hidden="true"`
- [ ] `pnpm typecheck && pnpm lint && pnpm build` all pass
- [ ] Manual scroll-through: every section visible in correct order (with Phase 4 stubs in place)

### Phase 3 — Exit gate

> **GATE:** All 6 static sections render with correct content, layout, and hover effects. `pnpm build` succeeds. The page is scrollable end-to-end (with Phase 4 placeholders where interactive sections will go). Then proceed to Phase 4 (and optionally parallelize Phase 5 and Phase 6).

---

## Phase 4 — Interactive Sections (Client Components)

**Goal:** Build the 5 client-side interactive sections (Navbar, Hero, StyleMarquee, Examples, FAQ) plus their data files and 2 unit tests. Wire them into `app/page.tsx`, replacing the Phase 3 stubs. After this phase, every section of the page is functional — only polish (scroll reveal, video loading choreography) remains.

**Estimated effort:** 4-5 hours
**Files touched:** ~10 (5 section components + 4 data files + 2 tests + 1 page.tsx update)
**Hard dependency:** Phase 2 complete (for hooks and primitives)
**Parallelizable with:** Phase 3 (different files) and Phase 6 (assets)

### Phase 4 — Files to create

#### 4.1 `src/lib/data/nav-links.ts`

**Description:** Navigation link constants.

**Interface:**
```ts
import type { NavLink } from '@/types';

export const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];

export const NAV_LANGUAGES = ['EN', '中文', '日本語'] as const;
```

#### 4.2 `src/lib/data/story-seeds.ts`

**Description:** Maps story-example chip labels to multi-paragraph seed texts (300-500 chars each). Verbatim from PRD §12.3.

**Interface:**
```ts
export const STORY_SEEDS: Record<string, string> = {
  'Time travel': `Dr. Elena Voss pressed her palm against the cold brass of the chronograph. The year was 1923, but the device in her hands pulsed with a future that hadn't happened yet. Outside her laboratory window, horse-drawn carriages clattered past — but in exactly forty-seven seconds, they would be replaced by something else entirely. She had one chance to set things right. One chance before the timeline collapsed.`,

  'Space odyssey': `The colony ship Aurora drifted past Neptune, its hull groaning against the absolute cold of deep space. Captain Reyes stared at the navigation console — they were three hundred years from Earth, and the signal they'd just received was human. It shouldn't exist. The last transmission from Sol system had been two centuries ago, before the silence. "Play it again," she said. The bridge went quiet as the voice of a dead woman filled the room.`,

  'Rival chefs': `In the Michelin-starred kitchen of Maison Lumière, Chef Adrien Laurent was plating the most important dish of his career. Across the pass, his former apprentice Sofia Reyes mirrored his movements with terrifying precision. Tonight was not about cooking. Tonight was about proving which of them had been right all those years ago, when the fire had taken everything. The judges would taste both dishes blind. Only one would walk out with the restaurant.`,

  'Victorian mystery': `The fog rolled in over Whitechapel as Lady Ashford stepped from her carriage. Number 13 Bleecker Street was supposed to be empty — had been empty for six years, ever since the incident. And yet, candlelight flickered in the upstairs window. She tightened her grip on the silver-handled cane her late husband had given her and climbed the steps. The door was already unlocked. Inside, the smell of laudanum and old paper. And a voice she had not heard in six years said: "You're late, Margaret."`,
};

export const DEFAULT_STORY_EXAMPLES = Object.keys(STORY_SEEDS).map((label) => ({
  label,
  seed: STORY_SEEDS[label]!,
}));
```

#### 4.3 `src/lib/data/style-chips.ts`

**Description:** 7 style chips for the marquee. Includes "Cyberpunk" with sublabel "Futuristic neon".

**Interface:**
```ts
import type { StyleChip } from '@/types';

export const STYLE_CHIPS: StyleChip[] = [
  { label: 'Ghibli' },
  { label: 'Oil Painting' },
  { label: 'Anime' },
  { label: 'Realistic' },
  { label: 'Cyberpunk', sublabel: 'Futuristic neon' },
  { label: 'Watercolor' },
  { label: 'Comic' },
];
```

#### 4.4 `src/lib/data/examples.ts`

**Description:** 6 example card data items.

**Interface:**
```ts
import type { ExampleCard } from '@/types';

export const EXAMPLE_CARDS: ExampleCard[] = [
  { id: '1', title: 'Confession in the Blue Flower Sea', styleTag: 'Anime · Romance', thumbnail: '/examples/example-1.webp', href: '#' },
  { id: '2', title: 'The Last Signal', styleTag: 'Sci-Fi · Cyberpunk', thumbnail: '/examples/example-2.webp', href: '#' },
  { id: '3', title: 'Murder at Hightower Manor', styleTag: 'Mystery · Victorian', thumbnail: '/examples/example-3.webp', href: '#' },
  { id: '4', title: 'Beyond the Veil', styleTag: 'Fantasy · Oil Painting', thumbnail: '/examples/example-4.webp', href: '#' },
  { id: '5', title: 'Tokyo Rain', styleTag: 'Realistic · Drama', thumbnail: '/examples/example-5.webp', href: '#' },
  { id: '6', title: 'The Grand Tournament', styleTag: 'Epic · Watercolor', thumbnail: '/examples/example-6.webp', href: '#' },
];
```

#### 4.5 `src/lib/data/faq-items.ts`

**Description:** 6 FAQ items. Verbatim from PRD §12.1 FAQ section.

**Interface:**
```ts
import type { FAQItem } from '@/types';

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'stories-types',
    question: 'What kind of stories can I turn into videos?',
    answer: 'You can turn any narrative into video — novels, short stories, scripts, fanfiction, blog posts, or even product descriptions. StoryIntoVideo understands narrative structure and can convert any genre into a cinematic video.',
  },
  {
    id: 'character-consistency',
    question: 'How does AI maintain character consistency?',
    answer: 'StoryIntoVideo uses a proprietary character-locking system. Once the AI generates a character portrait in Step 2, that visual identity is preserved across every subsequent scene through reference-image conditioning.',
  },
  {
    id: 'copyright',
    question: 'Do I own the copyright to the videos?',
    answer: 'Yes. You retain full commercial rights to all videos generated through your account. The underlying AI models are licensed for commercial use.',
  },
  {
    id: 'visual-style',
    question: 'Can I customize the visual style?',
    answer: 'Absolutely. Choose from 7+ visual styles including Ghibli, Oil Painting, Anime, Realistic, Cyberpunk, Watercolor, and Comic — or describe a custom style and the AI will adapt.',
  },
  {
    id: 'generation-time',
    question: 'How long does it take to generate a video?',
    answer: 'A typical 2-minute story video takes about 8–12 minutes to generate end-to-end, including character generation, scene rendering, voiceover synthesis, and subtitle alignment.',
  },
  {
    id: 'narration-languages',
    question: 'What languages are supported for narration?',
    answer: 'StoryIntoVideo supports 30+ languages for AI narration, including English, Spanish, French, German, Japanese, Korean, Chinese, Portuguese, and Arabic. New languages are added monthly.',
  },
];
```

#### 4.6 `src/components/sections/navbar.tsx`

**Description:** Client component. Fixed nav with scroll-aware bg (transparent → `bg-zinc-950/70 backdrop-blur-[24px] border-b border-white/10`). Desktop: logo + nav links + lang dropdown + Sign in + Get Started. Mobile (<sm): logo + lang + hamburger → right-side Sheet.

**Interface:**
```tsx
'use client';

import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useScrolled } from '@/lib/hooks/use-scrolled';
import { NAV_LINKS, NAV_LANGUAGES } from '@/lib/data/nav-links';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const scrolled = useScrolled(10);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        'fixed left-0 right-0 z-50 top-0 transition-all duration-300',
        scrolled
          ? 'bg-zinc-950/70 backdrop-blur-[24px] border-b border-white/10'
          : 'bg-transparent',
      )}
    >
      <nav className="mx-auto max-w-7xl px-6 flex justify-between items-center h-16" aria-label="Main">
        {/* Logo */}
        <a
          href="/"
          className="font-heading text-base font-medium text-white tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          StoryIntoVideo
        </a>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.04] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium text-white/60 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              aria-label="Switch language"
            >
              EN
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-popover border-border animate-[lang-dropdown-in_0.15s_ease-out]"
            >
              {NAV_LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang}
                  className={cn(
                    'cursor-pointer focus:bg-white/[0.04]',
                    lang === 'EN' && 'text-amber-400',
                  )}
                >
                  {lang}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sign in (desktop only) */}
          <a
            href="#"
            className="hidden sm:inline px-3 py-1.5 rounded-lg text-sm font-medium text-white/60 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            Sign in
          </a>

          {/* Get Started (desktop) */}
          <a
            href="/auth/sign-up"
            className="hidden sm:inline px-5 py-2 text-base font-medium rounded-full text-white/60 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            Get Started
          </a>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/[0.04] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-zinc-950 border-l border-white/10 p-6">
              <SheetHeader className="flex flex-row items-center justify-between mb-6">
                <SheetTitle className="font-heading text-base font-medium text-white">
                  Menu
                </SheetTitle>
                <SheetClose asChild>
                  <button
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/[0.04] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </SheetClose>
              </SheetHeader>
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 rounded-lg text-base font-medium text-white/80 hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <hr className="border-white/10 my-2" />
                <a
                  href="#"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-base font-medium text-white/80 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Sign in
                </a>
                <a
                  href="/auth/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-base font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-colors"
                >
                  Get Started
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
```

#### 4.7 `src/components/sections/hero.tsx`

**Description:** Client component. 4 layers: video bg (with scrim + radial amber glow), content (eyebrow + H1 + subtitle + glass input widget), style marquee, bottom fade. Glass input has textarea, 4 story chips, ratio toggle (9:16/16:9), "Start Creating" CTA.

**Interface:**
```tsx
'use client';

import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { DEFAULT_STORY_EXAMPLES, STORY_SEEDS } from '@/lib/data/story-seeds';
import { STYLE_CHIPS } from '@/lib/data/style-chips';
import { StyleChip as StyleChipComponent } from '@/components/primitives/style-chip';
import { cn } from '@/lib/utils';
import type { AspectRatio } from '@/types';

const ASPECT_RATIOS: AspectRatio[] = [
  { label: '9:16', value: 'portrait' },
  { label: '16:9', value: 'landscape' },
];

export function Hero() {
  const [story, setStory] = useState('');
  const [activeRatio, setActiveRatio] = useState<AspectRatio>(ASPECT_RATIOS[0]!);

  const handleChipClick = (label: string) => {
    const seed = STORY_SEEDS[label];
    if (seed) setStory(seed);
  };

  return (
    <section className="relative flex flex-col bg-zinc-950 overflow-hidden">
      {/* Layer 1: Background video + overlays */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <video
          className="w-full h-full object-cover transition-opacity duration-1000 opacity-100"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero-poster.webp"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/80" />
        <div
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-30 blur-[60px]"
          style={{
            background:
              'radial-gradient(rgba(251,191,36,0.12),rgba(0,0,0,0) 65%)',
          }}
        />
      </div>

      {/* Layer 2: Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 flex flex-col items-center text-center pt-32 pb-6 sm:pt-40 sm:pb-8">
        {/* Eyebrow */}
        <span className="eyebrow mb-8 animate-[fade-in-up_0.6s_ease-out_0.05s_both]">
          <Sparkles className="w-3 h-3" aria-hidden="true" />
          AI-Powered Story Into Video
        </span>

        {/* H1 */}
        <h1
          className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.02] mb-6 tracking-[-0.04em] text-white animate-[fade-in-up_0.6s_ease-out_0.1s_both]"
          style={{ fontWeight: 820 }}
        >
          Turn Story Into Video
          <br className="hidden sm:block" /> with AI Magic
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-zinc-300/80 mb-10 max-w-[52ch] leading-relaxed drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)] animate-[fade-in-up_0.6s_ease-out_0.15s_both]">
          Paste your story and AI handles the rest — characters, storyboards, voiceover, and subtitles, all generated in minutes.
        </p>

        {/* Glass input widget */}
        <div className="w-full max-w-2xl animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
          <div className="glass-input">
            <label htmlFor="story-input" className="sr-only">
              Your story
            </label>
            <textarea
              id="story-input"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Paste your story here, or write a short idea..."
              className="w-full bg-transparent text-white text-base resize-none focus:outline-none min-h-[78px]"
              rows={3}
            />

            {/* Story example chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {DEFAULT_STORY_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => handleChipClick(ex.label)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            {/* Bottom action row */}
            <div className="flex items-center justify-between mt-5">
              {/* Aspect ratio toggle */}
              <div className="flex items-center gap-1" role="group" aria-label="Aspect ratio">
                {ASPECT_RATIOS.map((ratio) => {
                  const isActive = ratio.label === activeRatio.label;
                  return (
                    <button
                      key={ratio.label}
                      type="button"
                      onClick={() => setActiveRatio(ratio)}
                      aria-pressed={isActive}
                      className={cn(
                        'min-h-[44px] min-w-[44px] flex items-center justify-center px-2 py-1 text-[10px] font-mono transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
                        isActive
                          ? 'bg-white/[0.1] text-amber-400'
                          : 'text-zinc-600 hover:text-zinc-400',
                      )}
                    >
                      {ratio.label}
                    </button>
                  );
                })}
              </div>

              {/* Start Creating CTA */}
              <a
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-2 rounded-full text-[13px] font-bold transition-all bg-gradient-to-r from-zinc-800 to-zinc-900 text-amber-300 hover:from-zinc-700 hover:to-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              >
                Start Creating
                <ArrowRight className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 3: Style tags marquee */}
      <div className="relative z-10 mt-10 sm:mt-16 animate-[fade-in-up_0.6s_ease-out_0.35s_both]">
        <div className="marquee-mask overflow-hidden py-4">
          <div className="marquee-track">
            {/* Render chips twice for seamless loop */}
            {[...STYLE_CHIPS, ...STYLE_CHIPS].map((chip, idx) => (
              <StyleChipComponent
                key={`${chip.label}-${idx}`}
                label={chip.label}
                sublabel={chip.sublabel}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Layer 4: Bottom fade */}
      <div className="relative z-0 h-8 sm:h-12 bg-gradient-to-b from-transparent to-zinc-950" aria-hidden="true" />
    </section>
  );
}
```

#### 4.8 `src/components/sections/style-marquee.tsx`

**Description:** Already inlined inside Hero (§4.7). If a separate component is preferred for testing, extract the marquee block into this file. For now, treat Hero as the canonical location. (This file may not be created if Hero inlines it.)

#### 4.9 `src/components/sections/examples.tsx`

**Description:** Client component. Header row (eyebrow + H2 + carousel arrows) + horizontal flex carousel + "Clone this project for free" gradient CTA. Arrow clicks call `scrollBy(260 + gap)`. Cards have yellow→purple gradient glow on hover (the singular purple exception).

**Interface:**
```tsx
'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EXAMPLE_CARDS } from '@/lib/data/examples';
import { CtaGradient } from '@/components/primitives/cta-gradient';
import { Eyebrow } from '@/components/primitives/eyebrow';
import { SectionHeading } from '@/components/primitives/section-heading';

const CARD_WIDTH = 260; // px
const CARD_GAP = 16; // px (gap-4)

export function Examples() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByCards = (direction: 'prev' | 'next') => {
    const container = scrollRef.current;
    if (!container) return;
    const delta = (CARD_WIDTH + CARD_GAP) * 2 * (direction === 'next' ? 1 : -1);
    container.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="py-16 md:py-20 px-6 relative overflow-hidden scroll-mt-20" aria-labelledby="examples-heading">
      <div className="mx-auto max-w-7xl">
        {/* Header row */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <Eyebrow className="mb-4">REAL EXAMPLES</Eyebrow>
            <SectionHeading id="examples-heading" className="text-3xl md:text-[40px]">
              Real Story Into Video Examples
            </SectionHeading>
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scrollByCards('prev')}
              className="w-8 h-8 rounded-full border border-zinc-600/60 flex items-center justify-center text-zinc-400 shrink-0 hover:border-amber-400/60 hover:text-amber-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              aria-label="Previous examples"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => scrollByCards('next')}
              className="w-8 h-8 rounded-full border border-zinc-600/60 flex items-center justify-center text-zinc-400 shrink-0 hover:border-amber-400/60 hover:text-amber-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
              aria-label="Next examples"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
          role="region"
          aria-label="Example videos carousel"
        >
          {EXAMPLE_CARDS.map((card) => (
            <article
              key={card.id}
              className="relative group cursor-pointer snap-start shrink-0 w-[260px] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amber-400"
            >
              {/* Hover glow (yellow→purple gradient — the singular purple exception) */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-purple-500 rounded-[20px] -z-10 blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-300"
              />

              {/* Card body */}
              <a
                href={card.href}
                className="relative block aspect-[9/16] rounded-[20px] overflow-hidden bg-zinc-900 border border-white/5 group-hover:border-white/10 transition-colors"
              >
                <img
                  src={card.thumbnail}
                  alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Bottom gradient overlay */}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Title + meta */}
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <h3 className="text-lg font-bold text-white leading-7 mb-1">{card.title}</h3>
                  <p className="text-xs text-zinc-400">{card.styleTag}</p>
                </div>
              </a>
            </article>
          ))}
        </div>

        {/* Below carousel CTA */}
        <div className="text-center mt-12 hidden sm:block">
          <CtaGradient href="#">Clone this project for free</CtaGradient>
        </div>
      </div>
    </section>
  );
}
```

#### 4.10 `src/components/sections/faq.tsx`

**Description:** Client component. Radix Accordion (single-open, collapsible). 6 items. Plus icon rotates 45° on open. Content uses CSS Grid `0fr → 1fr` transition.

**Interface:**
```tsx
'use client';

import { Plus } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQ_ITEMS } from '@/lib/data/faq-items';
import { Eyebrow } from '@/components/primitives/eyebrow';
import { SectionHeading } from '@/components/primitives/section-heading';
import { cn } from '@/lib/utils';

export function Faq() {
  return (
    <section className="py-24 bg-zinc-950" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-12">
          <Eyebrow className="mb-4">FAQ</Eyebrow>
          <SectionHeading id="faq-heading">Frequently Asked Questions</SectionHeading>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-b border-white/10 last:border-0"
            >
              <AccordionTrigger
                className={cn(
                  'w-full py-6 flex items-center justify-between text-start',
                  'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
                  'group hover:no-underline',
                )}
              >
                <span className="text-base sm:text-lg font-medium text-white group-hover:text-amber-300 transition-colors pr-4 text-start">
                  {item.question}
                </span>
                <span
                  className="shrink-0 text-zinc-500 group-hover:text-amber-400 transition-transform duration-300 [[data-state=open]>&]:rotate-45"
                  aria-hidden="true"
                >
                  <Plus className="w-5 h-5" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="overflow-hidden text-zinc-400 radix-accordion-content">
                <div>
                  <p className="pb-6 text-sm sm:text-base leading-relaxed">{item.answer}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
```

> **Note on Radix AccordionContent:** The shadcn/ui `AccordionContent` ships with its own animation (data-[state=closed]:animate-out, etc.). To use the PRD's grid-template-rows trick, we override with the `radix-accordion-content` class (defined in globals.css §2.1). This requires either patching the shadcn/ui component OR removing its default animation classes. Implementation note: when adding the shadcn/ui accordion, strip the `data-[state=closed]:animate-out data-[state=open]:animate-in` classes from `AccordionContent` and rely on the `.radix-accordion-content` CSS class instead.

#### 4.11 `src/app/page.tsx` (Phase 4 final composition)

**Description:** Composes all 10 sections in fixed order. Replaces Phase 3 stubs.

**Interface:**
```tsx
import { Navbar } from '@/components/sections/navbar';
import { Hero } from '@/components/sections/hero';
import { Examples } from '@/components/sections/examples';
import { Workflow } from '@/components/sections/workflow';
import { Features } from '@/components/sections/features';
import { Testimonials } from '@/components/sections/testimonials';
import { UseCases } from '@/components/sections/use-cases';
import { Faq } from '@/components/sections/faq';
import { FinalCTA } from '@/components/sections/final-cta';
import { Footer } from '@/components/sections/footer';

export const dynamic = 'force-static';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <Examples />
        <Workflow />
        <Features />
        <Testimonials />
        <UseCases />
        <Faq />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
```

#### 4.12 `src/tests/unit/hero-chip-populate.test.tsx`

**Description:** TDD test verifying that clicking a story-example chip populates the textarea with the matching seed text.

**Interface:**
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero } from '@/components/sections/hero';

describe('Hero chip → textarea population', () => {
  it('populates textarea with Time travel seed when chip clicked', async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const textarea = screen.getByPlaceholderText(/Paste your story here/i);
    expect(textarea).toHaveValue('');

    const chip = screen.getByRole('button', { name: /Time travel/i });
    await user.click(chip);

    expect(textarea).toHaveValue(expect.stringContaining('Dr. Elena Voss'));
  });

  it('populates textarea with Victorian mystery seed when chip clicked', async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const chip = screen.getByRole('button', { name: /Victorian mystery/i });
    await user.click(chip);

    const textarea = screen.getByPlaceholderText(/Paste your story here/i);
    expect(textarea).toHaveValue(expect.stringContaining('Lady Ashford'));
  });
});
```

#### 4.13 `src/tests/unit/hero-ratio-toggle.test.tsx`

**Description:** TDD test verifying that the ratio toggle enforces single selection (clicking 16:9 deactivates 9:16).

**Interface:**
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero } from '@/components/sections/hero';

describe('Hero ratio toggle', () => {
  it('starts with 9:16 active and 16:9 inactive', () => {
    render(<Hero />);
    const portrait = screen.getByRole('button', { name: /9:16/i });
    const landscape = screen.getByRole('button', { name: /16:9/i });
    expect(portrait).toHaveAttribute('aria-pressed', 'true');
    expect(landscape).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles active state on click (single selection enforced)', async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const portrait = screen.getByRole('button', { name: /9:16/i });
    const landscape = screen.getByRole('button', { name: /16:9/i });

    await user.click(landscape);
    expect(landscape).toHaveAttribute('aria-pressed', 'true');
    expect(portrait).toHaveAttribute('aria-pressed', 'false');

    await user.click(portrait);
    expect(portrait).toHaveAttribute('aria-pressed', 'true');
    expect(landscape).toHaveAttribute('aria-pressed', 'false');
  });
});
```

### Phase 4 — Skill consultation

| Skill | What to apply |
|---|---|
| `nextjs16-tailwind4` | §9.2 mobile nav Sheet pattern (focus trap, escape, scroll lock), §1.4 v3→v4 (use `bg-linear-to-r` or `bg-gradient-to-r` — both work) |
| `ui-styling` | §2.3 mobile nav a11y (focus trap, aria-label on hamburger, Sheet close button), dropdown keyboard nav |
| `frontend-design` | §3.6 animation timing (200ms for chip click feedback, 300ms for accordion, 500ms for video fade-in), §3.7 UX laws (Fitts — 44px touch targets on ratio toggle) |
| `frontend-development` | Client component patterns (`'use client'` only when needed), state management (useState for story/ratio/menus) |
| `test-driven-development` | §12.4 which behaviors to test (chip→textarea, ratio toggle), §12.5 test state not interactions |
| `incremental-implementation` | §11.4 Rule 1 (one thing at a time — build Hero, test it, then move on; don't build Hero + Navbar + FAQ in one commit) |

### Phase 4 — Acceptance checklist

- [ ] All 4 data files exist: `nav-links.ts`, `story-seeds.ts`, `style-chips.ts`, `examples.ts`, `faq-items.ts`
- [ ] All 5 client section components exist with `'use client'` directive: `navbar.tsx`, `hero.tsx`, `examples.tsx`, `faq.tsx`
- [ ] Navbar transparent at top, `bg-zinc-950/70 backdrop-blur-[24px] border-b border-white/10` on scroll
- [ ] Navbar desktop shows: logo, 4 nav links, EN dropdown, Sign in, Get Started
- [ ] Navbar mobile (<sm): hamburger opens right-side Sheet with all links + Sign in + Get Started + Close
- [ ] Navbar Sheet has focus trap, Escape closes, scroll lock, focus returns to hamburger
- [ ] Hero shows: video bg (with poster + 3-layer overlay stack), eyebrow, H1 (Outfit weight 820, line break after "Video" on sm+), subtitle, glass input widget, style marquee, bottom fade
- [ ] Hero textarea: placeholder visible, focus triggers amber border glow on parent wrapper (focus-within)
- [ ] Hero chips: clicking "Time travel" / "Space odyssey" / "Rival chefs" / "Victorian mystery" populates textarea with the matching seed
- [ ] Hero ratio toggle: 9:16 active by default, clicking 16:9 activates it (single selection)
- [ ] Hero ratio toggle: each button has `min-h-[44px] min-w-[44px]` for touch target compliance
- [ ] Hero "Start Creating" CTA: glass pill with amber text, links to `/auth/sign-up`
- [ ] Hero style marquee: 14 chips (7 original × 2 duplicate), 40s linear infinite animation (30s on mobile), pauses on hover, edges masked
- [ ] Examples carousel: 6 cards 260×462px portrait, snap-x mandatory on mobile
- [ ] Examples hover: yellow→purple gradient glow appears behind card (opacity 0.5 → 0.8), image scales 1.05 (500ms)
- [ ] Examples arrows: 32×32px circles, scrollBy 2 cards on click, hidden on mobile
- [ ] Examples "Clone this project for free": gradient amber pill, hidden on mobile
- [ ] FAQ: 6 items in single-column max-w-3xl, Radix Accordion single-open collapsible
- [ ] FAQ plus icon rotates 45° on open (becomes ×)
- [ ] FAQ content uses CSS Grid `0fr → 1fr` transition (300ms ease-out)
- [ ] FAQ question text color: white → amber-300 on hover
- [ ] `app/page.tsx` composes all 10 sections in correct order
- [ ] `pnpm test` passes — 6 unit tests total (4 from Phase 2 + 2 from Phase 4) all green
- [ ] `pnpm typecheck && pnpm lint && pnpm build` all pass
- [ ] Manual click-through: every interactive element works (chips, ratio, arrows, accordion, mobile menu, language dropdown)

### Phase 4 — Exit gate

> **GATE:** All 5 interactive sections are functional. Hero chip click populates textarea. Ratio toggle enforces single selection. Examples carousel arrows scroll. FAQ accordion expands/collapses with plus→× rotation. Mobile Sheet opens/closes with focus trap. `pnpm test && pnpm typecheck && pnpm lint && pnpm build` all pass. Then proceed to Phase 5.

---

## Phase 5 — Animation & Polish

**Goal:** Apply scroll-reveal animations with staggered delays, implement video loading choreography (poster → fade-in on `canplay`), verify all 13 keyframes work, add global focus-visible rings, verify `prefers-reduced-motion` handling, and run a manual click-through QA.

**Estimated effort:** 2-3 hours
**Files touched:** ~5 (modifications to existing section files + 1 new E2E test if desired)
**Hard dependency:** Phases 3 AND 4 complete

### Phase 5 — Files to modify / create

#### 5.1 Modify `src/components/sections/workflow.tsx` — Add scroll reveal + video loading state

**Description:** Wrap each step row in `<ScrollReveal delay={step.number * 80}>`. Add `useRef` + `useState` for video loaded state, listen for `canplay` event, toggle `opacity-0 → opacity-100`.

**Interface (the modified step block):**
```tsx
'use client'; // Promote to client for video loading state

import { useRef, useState } from 'react';
import { ScrollReveal } from '@/components/primitives/scroll-reveal';
// ... existing imports

function WorkflowVideo({ src, poster }: { src: string; poster: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  return (
    <video
      ref={videoRef}
      poster={poster}
      onCanPlay={() => setLoaded(true)}
      className={cn(
        'absolute inset-0 w-full h-full object-cover lg:object-contain transition-opacity duration-1000',
        loaded ? 'opacity-100' : 'opacity-0',
      )}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

export function Workflow() {
  // ... existing code, but each step row wrapped in <ScrollReveal delay={step.number * 80}>
  return (
    <section className="...">
      {/* header */}
      <div className="space-y-16 lg:space-y-24">
        {WORKFLOW_STEPS.map((step) => (
          <ScrollReveal key={step.number} delay={step.number * 80}>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className={cn('relative aspect-[4/3] ...', step.mediaPosition === 'left' ? 'lg:order-1' : 'lg:order-2')}>
                <WorkflowVideo src={step.videoSrc} poster={step.videoPoster} />
              </div>
              <div className={cn(step.mediaPosition === 'left' ? 'lg:order-2' : 'lg:order-1')}>
                {/* text content */}
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
```

> **Note:** This promotes `Workflow` from server to client component. The performance impact is minimal — the only state is `loaded` per video (4 videos × 1 boolean = negligible). The benefit is the cinematic fade-in choreography that matches the live site.

#### 5.2 Modify `src/components/sections/features.tsx` — Add staggered scroll reveal to each card

**Description:** Wrap each feature card in `<ScrollReveal delay={idx * 80}>` (cap at 400ms).

**Interface (modified grid):**
```tsx
import { ScrollReveal } from '@/components/primitives/scroll-reveal';

// Inside the component:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {FEATURES.map((feature, idx) => (
    <ScrollReveal
      key={feature.id}
      delay={Math.min(idx * 80, 400)}
      className={cn(
        'group relative border-b border-r border-neutral-800 py-10 px-8',
        // ... existing conditional classes
      )}
    >
      {/* existing card content */}
    </ScrollReveal>
  ))}
</div>
```

#### 5.3 Modify `src/components/sections/testimonials.tsx` and `use-cases.tsx` — Add scroll reveal

**Description:** Same pattern as Features — wrap each card in `<ScrollReveal delay={idx * 80}>`.

#### 5.4 Modify `src/components/sections/hero.tsx` — Already animated via CSS `animate-[fade-in-up_…]` arbitrary values

**Description:** No changes needed — Hero already uses CSS `animate-[fade-in-up_0.6s_ease-out_0.05s_both]` for the eyebrow, `0.1s` for H1, `0.15s` for subtitle, `0.2s` for input widget, `0.35s` for marquee. These fire on mount (no scroll trigger needed — Hero is above the fold).

#### 5.5 Modify `src/components/sections/examples.tsx` — Add scroll reveal to header + carousel

**Description:** Wrap header row and carousel container in `<ScrollReveal>`.

#### 5.6 Modify `src/components/sections/final-cta.tsx` — Add scroll reveal to content block

**Description:** Wrap the centered content block in `<ScrollReveal>`.

#### 5.7 Verify `prefers-reduced-motion` handling

**Description:** Manual verification — open browser DevTools → Rendering tab → toggle "Emulate CSS media feature prefers-reduced-motion: reduce". Confirm:

- All `[data-reveal]` elements are visible immediately (no fade-in)
- All marquee animation stops
- All autoplay videos are hidden (poster images remain)
- All transitions are 0.01ms (effectively instant)

#### 5.8 Verify global focus rings

**Description:** Manual keyboard-only navigation through the page. Tab from the URL bar → skip link appears → press Enter → focus jumps to `#main`. Continue tabbing through Navbar, Hero, Examples, Workflow, Features, Testimonials, UseCases, FAQ, FinalCTA, Footer. Every interactive element must show a visible amber focus ring (`outline: 2px solid #febf00; outline-offset: 2px`).

### Phase 5 — Skill consultation

| Skill | What to apply |
|---|---|
| `performance-optimization` | §6.3 video loading choreography (poster → preload metadata → canplay fade-in), §6.6 React 19 patterns |
| `frontend-design` | §3.6 animation timing (50ms stagger, 600ms reveal, 1000ms video fade), §3.7 UX laws (Serial Position — reveal sequences first item + last item memorable) |
| `ui-styling` | §2.3 keyboard navigation patterns, focus-visible testing |
| `coding-agent/verification.md` | Screenshot every section after animation polish; split long page into 3-5 sections (~800px each) for screenshot review |

### Phase 5 — Acceptance checklist

- [ ] Every section that's below the fold is wrapped in `<ScrollReveal>` (Workflow steps, Features cards, Testimonials cards, UseCases cards, Examples header + carousel, FinalCTA content)
- [ ] Scroll reveal staggered delays applied per PRD §3.2 table (cards: N × 80ms capped at 400ms)
- [ ] Scroll reveal observer disconnects after first intersection (no re-trigger on scroll up)
- [ ] Workflow videos show poster first, then fade in over 1000ms on `canplay` event
- [ ] Hero CSS animations fire on mount with correct delays (eyebrow 50ms, H1 100ms, subtitle 150ms, input 200ms, marquee 350ms)
- [ ] All 13 keyframes are referenced somewhere in the codebase (grep `animate-[fade-in-up`, `animate-marquee-scroll`, etc.)
- [ ] `prefers-reduced-motion: reduce` disables all animations (verify via DevTools Rendering panel)
- [ ] All autoplay videos hidden when reduced-motion is active (posters remain)
- [ ] `[data-reveal]` elements visible immediately when reduced-motion is active
- [ ] Tab key navigates the entire page; every interactive element shows amber focus ring
- [ ] Skip-to-content link: Tab from URL bar focuses it, Enter jumps to `#main`
- [ ] No console errors or warnings during scroll
- [ ] `pnpm typecheck && pnpm lint && pnpm build` all pass
- [ ] Screenshots captured: Hero, Examples, Workflow, Features, Testimonials, UseCases, FAQ, FinalCTA, Footer (9 total) — each reviewed manually

### Phase 5 — Exit gate

> **GATE:** Scroll animations are cinematic (not janky). Video loading choreography matches live site. Reduced-motion preference fully honored. Keyboard navigation works end-to-end. `pnpm typecheck && pnpm lint && pnpm build` all pass. Then proceed to Phase 6 (or Phase 7 if assets are already in place).

---

## Phase 6 — Asset Pipeline

**Goal:** Replace all placeholder asset references with real, self-hosted assets. Download workflow videos + posters from R2. Generate 6 example card thumbnails (using the `image-generation` skill or sourced from stock). Source cinematic dark footage for the hero background video. Generate OG image (1200×630) and favicon. Download the Outfit variable font for weight 820 access.

**Estimated effort:** 2-3 hours
**Files touched:** ~18 asset files + 3 scripts + 1 component (`src/app/icon.tsx`)
**Hard dependency:** Phase 1 complete (for the `public/` directory to exist)
**Parallelizable with:** Phases 3, 4, 5 (assets are independent of code)

### Phase 6 — Files to create / download

#### 6.1 Download the Outfit variable font

**Description:** Fetch `Outfit-VariableFont_wght.ttf` from Google Fonts GitHub repo and convert to woff2.

**Commands:**
```bash
mkdir -p public/fonts
curl -L -o /tmp/outfit-variable.ttf \
  "https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf"

# Convert to woff2 using fonttools (install if needed: pip install fonttools brotli)
pip install fonttools brotli
python -c "
from fontTools.ttLib import TTFont
font = TTFont('/tmp/outfit-variable.ttf')
font.flavor = 'woff2'
font.save('public/fonts/Outfit-VariableFont.woff2')
"

# Verify the file exists and is reasonably sized (~80-120KB for the variable font)
ls -lh public/fonts/Outfit-VariableFont.woff2
```

> **Verification:** After this step, restart `pnpm dev`. The Hero H1 should now render at Outfit weight 820 (the `style={{ fontWeight: 820 }}` inline style becomes effective).

#### 6.2 `scripts/download-assets.sh` — Download workflow videos + posters

**Description:** Bash script that downloads 4 workflow step videos + 4 posters from the R2 bucket to `public/workflow/`. Idempotent — skips files that already exist.

**Interface:**
```bash
#!/bin/bash
# scripts/download-assets.sh
# Downloads self-hosted workflow videos and posters from the StoryIntoVideo R2 bucket.
set -euo pipefail

DEST="public/workflow"
BASE="https://r2.storyintovideo.com/landing/workflow"

mkdir -p "$DEST"
cd "$DEST"

for i in 1 2 3 4; do
  VIDEO="showcase-step${i}.mp4"
  POSTER="showcase-step${i}-poster.webp"

  if [ ! -f "$VIDEO" ]; then
    echo "⬇️  Downloading $VIDEO..."
    curl -L --fail -o "$VIDEO" "${BASE}/${VIDEO}" || {
      echo "⚠️  Failed to download $VIDEO (R2 URL may be unavailable)"
      echo "   The clone will use the poster image as fallback."
    }
  else
    echo "✓  $VIDEO already exists, skipping"
  fi

  if [ ! -f "$POSTER" ]; then
    echo "⬇️  Downloading $POSTER..."
    curl -L --fail -o "$POSTER" "${BASE}/${POSTER}" || {
      echo "⚠️  Failed to download $POSTER"
    }
  else
    echo "✓  $POSTER already exists, skipping"
  fi
done

echo ""
echo "✅ Asset download complete."
ls -lh "$DEST"
```

**Execution:**
```bash
chmod +x scripts/download-assets.sh
./scripts/download-assets.sh
```

#### 6.3 Source hero background video

**Description:** The hero needs a 10-20s cinematic dark video (1920×1080, ~2MB compressed). Options:

1. **Pexels / Pixabay** — search "dark cinematic", "smoke", "abstract dark motion". Download a royalty-free clip.
2. **Generate via `image-generation` skill** — create a static dark image, then use a video generation tool (out of scope for this clone).
3. **Use one of the workflow videos as a fallback** — `showcase-step1.mp4` could double as the hero bg.

**Recommended approach:** Download from Pexels (royalty-free, no attribution required for commercial use).

**Commands:**
```bash
# Example: download a cinematic dark video from Pexels
# (Replace URL with a specific Pexels video download link)
curl -L -o public/hero-bg.mp4 "https://videos.pexels.com/video-files/..."

# Generate a poster from the first frame using ffmpeg
ffmpeg -i public/hero-bg.mp4 -vframes 1 -q:v 2 public/hero-poster.webp

# Compress to <2MB if needed
ffmpeg -i public/hero-bg.mp4 -vcodec h264 -crf 28 -preset slow \
  -acodec aac -b:a 128k -movflags +faststart public/hero-bg-compressed.mp4
mv public/hero-bg-compressed.mp4 public/hero-bg.mp4

ls -lh public/hero-bg.mp4 public/hero-poster.webp
```

> **Note:** If Pexels is unavailable, the `image-generation` skill can generate a static dark abstract image, which can be used as a poster fallback. The `<video>` element will then have no `<source>` and only the poster will display.

#### 6.4 Generate 6 example card thumbnails

**Description:** 6 portrait (9:16) WebP thumbnails matching the example card titles. Use the `image-generation` skill via the z-ai-web-dev-sdk.

**Prompts:**
1. **Confession in the Blue Flower Sea** — "Anime romance scene, two characters standing in a vast field of glowing blue flowers under a twilight sky, soft cinematic lighting, 9:16 portrait composition"
2. **The Last Signal** — "Cyberpunk sci-fi scene, lone astronaut on a desolate alien planet receiving a holographic transmission, neon teal and magenta color palette, 9:16 portrait"
3. **Murder at Hightower Manor** — "Victorian mystery scene, fog-shrouded English manor at night, single candlelit window, oil painting aesthetic, sepia and amber tones, 9:16 portrait"
4. **Beyond the Veil** — "Fantasy oil painting, ethereal figure stepping through a shimmering portal between worlds, rich purples and golds, romanticism style, 9:16 portrait"
5. **Tokyo Rain** — "Realistic cinematic scene, neon-lit Tokyo street at night in heavy rain, reflections on wet pavement, lone figure with umbrella, 9:16 portrait"
6. **The Grand Tournament** — "Epic watercolor painting, medieval jousting tournament scene, knights in armor, grand castle backdrop, vibrant washes of color, 9:16 portrait"

**Commands (using image-generation skill):**
```bash
# Install the z-ai-web-dev-sdk CLI if not already installed
# (See /home/z/my-project/story-into-video/skills/image-generation/SKILL.md for details)

# Generate each thumbnail (520×924 = 2× the 260×462 display size for retina)
for i in 1 2 3 4 5 6; do
  PROMPT=$(get_prompt_for_card $i)  # helper function with the 6 prompts above
  npx z-ai-web-dev-sdk image-generation \
    --prompt "$PROMPT" \
    --width 520 \
    --height 924 \
    --output "public/examples/example-${i}.webp"
done

ls -lh public/examples/
```

> **Fallback:** If the `image-generation` skill is unavailable, source images from Unsplash (royalty-free, no attribution required). Search for portrait-orientation images matching each card's theme. Convert to WebP using `cwebp`:
> ```bash
> cwebp -q 80 input.jpg -o public/examples/example-N.webp
> ```

#### 6.5 Generate OG image (1200×630)

**Description:** Open Graph image for social sharing. Background: dark with radial amber glow. Centered text: "Turn Story Into Video with AI Magic" in Outfit 820, white. Subtitle: "AI-Powered Story Into Video" in amber, uppercase.

**Approach:** Use the `image-generation` skill OR generate via Playwright screenshot of an HTML template OR create via Python PIL.

**Recommended (Playwright screenshot of an HTML template):**

```bash
# Create a simple HTML template
cat > /tmp/og-template.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 0; width: 1200px; height: 630px; background: #020202;
         display: flex; flex-direction: column; align-items: center; justify-content: center;
         font-family: 'Outfit', sans-serif; position: relative; overflow: hidden; }
  body::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                 width: 800px; height: 800px; border-radius: 50%;
                 background: radial-gradient(rgba(234,179,8,0.1) 0%, rgba(234,179,8,0.03) 40%, transparent 70%); }
  .eyebrow { color: #febf00; font-size: 14px; font-weight: 600; letter-spacing: 0.2em;
             text-transform: uppercase; margin-bottom: 24px; position: relative; }
  h1 { color: white; font-size: 80px; font-weight: 820; letter-spacing: -0.04em; margin: 0;
       text-align: center; line-height: 1.02; position: relative; max-width: 900px; }
</style>
</head>
<body>
  <div class="eyebrow">AI-Powered Story Into Video</div>
  <h1>Turn Story Into Video with AI Magic</h1>
</body>
</html>
EOF

# Use Playwright to screenshot
npx playwright screenshot --viewport-size="1200,630" --full-page \
  "file:///tmp/og-template.html" public/og-image.png

ls -lh public/og-image.png
```

#### 6.6 `src/app/icon.tsx` — Dynamic favicon

**Description:** Next.js 16 dynamic favicon route. Renders a 32×32 image with near-black background (`#020202`) and amber "S" letter in Outfit.

**Interface:**
```tsx
import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#020202',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#febf00',
          fontSize: 22,
          fontWeight: 800,
          fontFamily: 'sans-serif',
        }}
      >
        S
      </div>
    ),
    { ...size },
  );
}
```

#### 6.7 `scripts/compress-hero-video.sh` — Optional ffmpeg compression

**Description:** Compresses the hero video to under 2MB if it exceeds the budget. Uses H.264 CRF 28, slow preset, AAC 128k audio, faststart for streaming.

**Interface:**
```bash
#!/bin/bash
# scripts/compress-hero-video.sh
set -euo pipefail

INPUT="${1:-public/hero-bg.mp4}"
OUTPUT="public/hero-bg-compressed.mp4"
MAX_SIZE_KB=2048  # 2MB

if [ ! -f "$INPUT" ]; then
  echo "❌ Input file not found: $INPUT"
  exit 1
fi

INPUT_SIZE=$(stat -f%z "$INPUT" 2>/dev/null || stat -c%s "$INPUT")
INPUT_SIZE_KB=$((INPUT_SIZE / 1024))

if [ "$INPUT_SIZE_KB" -le "$MAX_SIZE_KB" ]; then
  echo "✓  $INPUT is already under ${MAX_SIZE_KB}KB (${INPUT_SIZE_KB}KB). No compression needed."
  exit 0
fi

echo "⬇️  Compressing $INPUT (${INPUT_SIZE_KB}KB → target ≤${MAX_SIZE_KB}KB)..."
ffmpeg -y -i "$INPUT" \
  -vcodec h264 -crf 28 -preset slow \
  -acodec aac -b:a 128k \
  -movflags +faststart \
  "$OUTPUT"

mv "$OUTPUT" "$INPUT"
echo "✅  Compression complete. New size: $(du -h "$INPUT" | cut -f1)"
```

### Phase 6 — Skill consultation

| Skill | What to apply |
|---|---|
| `image-generation` | Skill's CLI for generating example thumbnails and OG image (z-ai-web-dev-sdk) |
| `performance-optimization` | §6.3 image optimization (WebP for all raster, AVIF if possible), §6.4 next/font self-hosting, §6.5 video compression budgets (<2MB per video) |
| `nextjs16-tailwind4` | §7.5 next/font/local for self-hosted Outfit variable font |
| `playwright-cli` | Screenshotting the OG image HTML template at 1200×630 |

### Phase 6 — Acceptance checklist

- [ ] `public/fonts/Outfit-VariableFont.woff2` exists and is between 80-200KB
- [ ] After font download, Hero H1 renders at Outfit weight 820 (verify via DevTools Computed Styles → `font-weight: 820`)
- [ ] `public/workflow/showcase-step{1-4}.mp4` all exist (or fallback posters if R2 unavailable)
- [ ] `public/workflow/showcase-step{1-4}-poster.webp` all exist
- [ ] `public/hero-bg.mp4` exists and is under 2MB (or `public/hero-poster.webp` exists as fallback)
- [ ] `public/examples/example-{1-6}.webp` all exist, each under 100KB, dimensions 520×924
- [ ] `public/og-image.png` exists, dimensions 1200×630, under 300KB
- [ ] `src/app/icon.tsx` exists and generates a 32×32 favicon (verify by visiting `/icon` in dev)
- [ ] All workflow videos autoplay (muted, loop, playsinline) without errors
- [ ] Hero background video autoplays without errors (or poster displays if video unavailable)
- [ ] Example card thumbnails load (lazy-loaded via `loading="lazy"`)
- [ ] `pnpm typecheck && pnpm lint && pnpm build` all pass
- [ ] Lighthouse Performance run: should approach ≥95 (videos now have content, not 404s)

### Phase 6 — Exit gate

> **GATE:** All asset files in place. Hero H1 renders at Outfit 820. All videos autoplay. All example thumbnails load. OG image and favicon generated. `pnpm build` succeeds. Lighthouse Performance ≥90 (will optimize to ≥95 in Phase 7). Then proceed to Phase 7.

---

## Phase 7 — QA & Delivery

**Goal:** Pass all 6 PRD QA checklists (visual, responsive, accessibility, performance, cross-browser, code quality). Write 3 Playwright E2E tests. Update `README.md` and `AGENTS.md` with final adjustments. Deploy-ready.

**Estimated effort:** 2-3 hours
**Files touched:** ~5 (3 E2E tests + README update + AGENTS update)
**Hard dependency:** All prior phases complete

### Phase 7 — Files to create / modify

#### 7.1 `src/tests/e2e/hero-cta.spec.ts`

**Description:** Playwright E2E test. Verifies the Hero "Start Creating" CTA routes to `/auth/sign-up`.

**Interface:**
```ts
import { test, expect } from '@playwright/test';

test.describe('Hero CTA', () => {
  test('clicking Start Creating navigates to /auth/sign-up', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /Start Creating/i }).first();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });

  test('Hero Final CTA navigates to /auth/sign-up', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /Start Creating — It's Free/i });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });
});
```

#### 7.2 `src/tests/e2e/mobile-nav.spec.ts`

**Description:** Playwright E2E test. Verifies mobile hamburger opens the Sheet with all nav links.

**Interface:**
```ts
import { test, expect } from '@playwright/test';

test.describe('Mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger opens Sheet with all nav links', async ({ page }) => {
    await page.goto('/');
    const hamburger = page.getByRole('button', { name: /Open menu/i });
    await expect(hamburger).toBeVisible();
    await hamburger.click();

    // Sheet should be visible
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();

    // All nav links should be present
    for (const label of ['Features', 'Pricing', 'Blog', 'Contact']) {
      await expect(sheet.getByRole('link', { name: label })).toBeVisible();
    }

    // Sign in and Get Started should be present
    await expect(sheet.getByRole('link', { name: /Sign in/i })).toBeVisible();
    await expect(sheet.getByRole('link', { name: /Get Started/i })).toBeVisible();
  });

  test('Escape closes the Sheet', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Open menu/i }).click();
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(sheet).not.toBeVisible();
  });
});
```

#### 7.3 `src/tests/e2e/faq-accordion.spec.ts`

**Description:** Playwright E2E test. Verifies the FAQ accordion expands and collapses correctly.

**Interface:**
```ts
import { test, expect } from '@playwright/test';

test.describe('FAQ accordion', () => {
  test('clicking a question expands the answer', async ({ page }) => {
    await page.goto('/#faq-heading');

    const firstQuestion = page.getByRole('button', { name: /What kind of stories/i });
    await firstQuestion.click();

    // Answer should be visible
    const answer = page.getByText(/You can turn any narrative into video/i);
    await expect(answer).toBeVisible();
  });

  test('opening a second item closes the first (single-open)', async ({ page }) => {
    await page.goto('/#faq-heading');

    const firstQuestion = page.getByRole('button', { name: /What kind of stories/i });
    const secondQuestion = page.getByRole('button', { name: /How does AI maintain character/i });

    await firstQuestion.click();
    await expect(page.getByText(/You can turn any narrative/i)).toBeVisible();

    await secondQuestion.click();
    // First answer should now be hidden
    await expect(page.getByText(/You can turn any narrative/i)).not.toBeVisible();
    await expect(page.getByText(/proprietary character-locking system/i)).toBeVisible();
  });

  test('plus icon rotates 45° when open', async ({ page }) => {
    await page.goto('/#faq-heading');
    const firstTrigger = page.getByRole('button', { name: /What kind of stories/i });
    await firstTrigger.click();

    // The Plus icon should have a rotation transform applied
    const icon = firstTrigger.locator('svg').last();
    await expect(icon).toHaveCSS('transform', /matrix/);  // Non-identity transform
  });
});
```

#### 7.4 `playwright.config.ts`

**Description:** Playwright configuration. Targets Chromium only (cross-browser visual QA is manual). Base URL `http://localhost:3000`.

**Interface:**
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 7.5 `vitest.config.ts`

**Description:** Vitest configuration for unit tests. Uses jsdom environment, `@vitejs/plugin-react`, path alias.

**Interface:**
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

#### 7.6 `src/tests/setup.ts`

**Description:** Vitest setup file. Imports `@testing-library/jest-dom` for custom matchers like `toBeInTheDocument()`.

**Interface:**
```ts
import '@testing-library/jest-dom/vitest';
```

#### 7.7 Update `README.md`

**Description:** Update the existing `README.md` to reflect the final build state. Add sections for: testing commands, asset download instructions, deployment notes.

**Key additions:**
- Testing section: `pnpm test`, `pnpm test:e2e`
- Asset pipeline section: `./scripts/download-assets.sh`
- Outfit font download instructions
- Lighthouse targets reaffirmed
- Note clarifying that `Project_Requirements_Document.md` is the canonical spec; `PRD_2.md` and `draft_PRD.md` are historical drafts

#### 7.8 Update `AGENTS.md`

**Description:** Minor updates to reflect any deviations discovered during implementation. Specifically:
- Document the `src/` directory convention (vs PRD's root-level `app/`)
- Document the `@theme` block approach (vs PRD's `tailwind.config.ts` + raw `:root`)
- Document the kebab-case keyframe naming (vs PRD's mixed camelCase/kebab)
- Document the Outfit variable font self-hosting via `next/font/local`
- Note that `MASTER_EXECUTION_PLAN.md` is the execution record

### Phase 7 — QA execution

Run the following in order. Fix any failures before proceeding to the next.

#### 7.9 Pre-delivery visual verification (PRD §13.1)

Open `https://storyintovideo.com/` and the clone side-by-side at 1440×900. Walk through every checklist item in PRD §13.1 (Global, Navigation, Hero, Examples, Workflow, Features, Testimonials, Use Cases, FAQ, Final CTA, Footer).

#### 7.10 Responsive verification (PRD §13.2)

Use Chrome DevTools device toolbar. Test at:
- 375×812 (iPhone 13)
- 768×1024 (iPad portrait)
- 1024×768 (iPad landscape)
- 1440×900 (desktop)
- 1920×1080 (large desktop)

#### 7.11 Accessibility verification (PRD §13.3)

Run axe DevTools (browser extension) on the page. Fix any violations. Manually verify:
- Tab order is logical
- Skip link works
- All interactive elements have visible focus rings
- FAQ keyboard navigation (Arrow Up/Down, Enter/Space)
- Mobile Sheet focus trap + Escape close
- Hero video has `aria-hidden="true"`
- `prefers-reduced-motion` disables all animations

#### 7.12 Performance verification (PRD §13.4)

Run Lighthouse (Chrome DevTools → Lighthouse → Performance + Mobile). Target:
- Performance ≥ 95
- Accessibility ≥ 95
- Best Practices ≥ 95
- SEO ≥ 95
- LCP < 2.0s
- CLS < 0.05
- INP < 200ms
- TBT < 200ms
- Total JS bundle < 100KB gzipped
- Total CSS bundle < 30KB gzipped

If any metric is below target, identify the bottleneck and optimize:
- If LCP > 2.0s: add `priority` to hero poster image, ensure fonts use `display: swap`
- If CLS > 0.05: add explicit `width`/`height` to all images, ensure video containers have `aspect-ratio`
- If JS bundle > 100KB: audit imports, eliminate barrel files, dynamic-import heavy components
- If CSS bundle > 30KB: audit `@source` directives, remove unused utilities

#### 7.13 Cross-browser verification (PRD §13.5)

Test in latest stable:
- Chrome (macOS + Windows)
- Firefox (macOS + Windows)
- Safari (macOS + iOS)
- Edge (Windows)

Known concerns:
- Safari iOS: verify `playsinline` on videos
- Firefox: verify `backdrop-filter` smoothness on glass input
- All browsers: verify CSS Grid `0fr → 1fr` accordion transition (Chrome 117+, Firefox 118+, Safari 17.4+)

#### 7.14 Code quality verification (PRD §13.6)

```bash
pnpm lint        # ESLint zero warnings
pnpm typecheck   # tsc --noEmit zero errors
pnpm build       # next build zero errors
pnpm test        # Vitest all green (6 unit tests)
pnpm test:e2e    # Playwright all green (3 E2E tests)
pnpm audit --audit-level=high   # No high/critical vulnerabilities
```

### Phase 7 — Skill consultation

| Skill | What to apply |
|---|---|
| `code-review-checklist` | All 12 categories — review codebase against the pre-merge checklist |
| `lint-and-validate` | §7.1 quality loop — `pnpm lint && pnpm typecheck && pnpm test && pnpm build` must all pass |
| `performance-optimization` | §6.1 Lighthouse ≥95 specific techniques, §6.5 bundle size analysis, §6.7 CI enforcement |
| `frontend-design` | §3.1 final anti-AI-slop review (compare side-by-side with live site) |
| `test-driven-development` | §12.4 test pyramid (mostly unit, few E2E, no integration needed for static page) |
| `verification-and-review-protocol` (via `coding-agent/verification.md`) | "Iron Law" — no false completion claims; every checklist item must be visibly green |
| `playwright-cli` | E2E test patterns, screenshot comparison |

### Phase 7 — Acceptance checklist

- [ ] All 3 Playwright E2E tests pass (`pnpm test:e2e`)
- [ ] All 6 Vitest unit tests pass (`pnpm test`)
- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm lint` — zero warnings
- [ ] `pnpm build` — zero errors
- [ ] `pnpm audit --audit-level=high` — no high/critical vulnerabilities
- [ ] Lighthouse Performance ≥ 95
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse Best Practices ≥ 95
- [ ] Lighthouse SEO ≥ 95
- [ ] LCP < 2.0s, CLS < 0.05, INP < 200ms, TBT < 200ms
- [ ] JS bundle < 100KB gzipped
- [ ] CSS bundle < 30KB gzipped
- [ ] axe DevTools reports zero violations
- [ ] Tab-only navigation works end-to-end
- [ ] Screen reader (VoiceOver or NVDA) announces all content correctly
- [ ] Visual side-by-side with `storyintovideo.com` at 1440×900 — indistinguishable within 30 seconds
- [ ] Responsive at all 5 breakpoints (375, 768, 1024, 1440, 1920) — no layout breaks
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge all render correctly
- [ ] `prefers-reduced-motion: reduce` disables all animations
- [ ] `README.md` updated with final build state, testing commands, asset instructions
- [ ] `AGENTS.md` updated with implementation deviations documented
- [ ] Deploy to Vercel (or target platform) — URL accessible, Lighthouse ≥95 on deployed URL

### Phase 7 — Exit gate (FINAL)

> **GATE:** All 6 PRD QA checklists pass. All tests green. Lighthouse ≥95 across all 4 categories. Deployed URL accessible. The clone is visually indistinguishable from the live site at 1440×900 within a 30-second scan. **The project is complete.**

---

## 7. Risk Register

Updated from PRD §15.3 with additional risks discovered during planning.

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| 1 | Outfit weight 820 unavailable via `next/font/google` | High | Medium | Self-host variable Outfit via `next/font/local` (Decision C, Phase 6.1) | Build |
| 2 | R2 video URLs change or become inaccessible | Medium | High | Download all videos to `/public/workflow/` in Phase 6.2 immediately; script is idempotent and warns on failure | Build |
| 3 | Keyframe naming mismatch (camelCase vs kebab) causes animations to silently fail | High | High | Normalize all `@keyframes` to kebab-case (Decision B); grep the codebase for any camelCase `animate-[name_…]` arbitrary values and fix | Build |
| 4 | shadcn/ui AccordionContent default animation conflicts with PRD's grid-template-rows trick | Medium | Low | Strip shadcn's default `data-[state=closed]:animate-out data-[state=open]:animate-in` classes; apply `.radix-accordion-content` class instead | Build |
| 5 | `backdrop-filter` rendering varies across browsers | Medium | Low | Test in Firefox specifically; accept graceful degradation if blur is slightly different | QA |
| 6 | Hero background video too large (>2MB) | Medium | Medium | Compress with ffmpeg (Phase 6.7 script): H.264 CRF 28, slow preset, AAC 128k, faststart | Build |
| 7 | Lighthouse Performance < 95 | Low | Medium | Lazy-load below-fold videos via IntersectionObserver; use `next/image` for all raster; eliminate barrel imports; target JS bundle ~80KB (below 100KB budget) | QA |
| 8 | Mobile touch targets too small (ratio toggle 40×23px) | High | High | Wrap in `min-h-[44px] min-w-[44px]` flex container (already in Hero §4.7); verify with axe touch-target audit | Build |
| 9 | Step 3 demo video URL unavailable on R2 (live site uses static images) | Medium | Low | Script (Phase 6.2) warns but continues; poster image displays as fallback | Build |
| 10 | Example thumbnail generation via `image-generation` skill fails | Medium | Low | Fallback: source portrait images from Unsplash; convert to WebP via `cwebp -q 80` | Build |
| 11 | OG image generation via Playwright screenshot fails (no Playwright installed) | Low | Medium | Fallback: use `image-generation` skill with a 1200×630 dimension; or hand-craft via Python PIL | Build |
| 12 | Tailwind v4 `@utility` syntax unfamiliar — developer accidentally uses `@layer components` | Medium | Low | Code review at Phase 2 exit gate; grep for `@layer components` and reject | QA |
| 13 | Tailwind v4 `@source` directives missing — utilities purged from production CSS | Medium | High | Explicit `@source` directives in globals.css (Phase 2.1); verify by grepping built CSS for expected utility classes | QA |
| 14 | shadcn/ui init fails or installs incompatible version | Low | High | Use `pnpm dlx shadcn@latest init` (latest 2.x); if it fails, fall back to manual component creation from shadcn/ui source | Build |
| 15 | `next/font/local` fails to load Outfit (file path or format issue) | Medium | High | Verify file exists at `public/fonts/Outfit-VariableFont.woff2`; verify `weight: '100 900'` syntax; check Next.js build output for font warnings | Build |
| 16 | CSS Grid `0fr → 1fr` transition not supported in older Safari (<17.4) | Low | Low | Accept graceful degradation — accordion content will jump open instead of animate; feature still functional | QA |
| 17 | Hero video autoplay blocked by browser (mobile Safari, Chrome's autoplay policy) | Low | Medium | Use `muted` + `playsInline` + `autoplay` (already specified); poster image displays if video blocked | Build |
| 18 | Image bandwidth exceeds budget on slow connections | Low | Medium | All below-fold images use `loading="lazy"`; videos use `preload="metadata"`; hero poster is < 50KB WebP | Build |
| 19 | User requests deviation from PRD mid-build | Medium | Medium | Surface in Phase 0 validation gate; document any post-gate deviations in `AGENTS.md` at Phase 7 | All |
| 20 | Scope creep — adding features not in PRD (analytics, theme toggle, blog) | Medium | Medium | Strict adherence to PRD §14 Out of Scope; reject additions; note in CHANGELOG if user explicitly approves | All |

---

## 8. Verification Gates (Between Phases)

Each phase ends with an explicit "exit gate" — a checklist that must be fully green before proceeding. The gates are designed to prevent false completion claims (the "Iron Law" from the `verification-and-review-protocol` skill).

| From → To | Gate criteria | Verification command |
|---|---|---|
| 0 → 1 | User explicit approval of `MASTER_EXECUTION_PLAN.md` | User says "proceed" |
| 1 → 2 | Next.js boots, dark bg, Outfit wired, amber token, skip link works | `pnpm dev` + manual DevTools check + `pnpm typecheck && pnpm lint && pnpm build` |
| 2 → 3 | All `@utility` classes work, all hooks pass TDD, all primitives exist | `pnpm test && pnpm typecheck && pnpm lint && pnpm build` |
| 3 → 4 | All 6 static sections render with correct content + hover | `pnpm build` + manual scroll-through |
| 4 → 5 | All 5 interactive sections functional, all unit tests green | `pnpm test && pnpm typecheck && pnpm lint && pnpm build` + manual click-through |
| 5 → 6 | Scroll animations cinematic, video choreography works, reduced-motion honored | Manual DevTools Rendering panel + keyboard-only nav |
| 6 → 7 | All assets in place, Outfit 820 renders, videos autoplay, Lighthouse ≥90 | `ls -lh public/` + manual DevTools + Lighthouse run |
| 7 → DONE | All 6 PRD QA checklists pass, Lighthouse ≥95, deployed URL accessible | Full QA execution per §7.9-§7.14 |

### 8.1 The Iron Law (from `verification-and-review-protocol`)

> **No phase may be marked complete until every checklist item in its exit gate is visibly green.** "I think it works" is not sufficient. A screenshot, a passing test, or a Lighthouse score is required.

If a checklist item fails:
1. **Stop.** Do not proceed to the next phase.
2. **Diagnose.** Use the `debugging-and-error-recovery` skill's systematic root-cause method.
3. **Fix.** Apply the minimal change to make the item pass.
4. **Re-verify.** Re-run the full checklist (not just the failed item — fixes can introduce regressions).
5. **Document.** Add a note to the phase's exit gate explaining what failed and how it was fixed.

---

## 9. Open Questions for User Validation

These are surfaced for the Phase 0 validation gate. The user should confirm or override each.

### 9.1 Project location

Build the Next.js app at the root of `/home/z/my-project/story-into-video/` (the cloned repo), keeping `Project_Requirements_Document.md`, `skills/`, `docs/`, etc. as in-repo reference?

**Default:** Yes. **Alternative:** Build in a sibling directory like `/home/z/my-project/story-into-video-app/`.

### 9.2 Tailwind v4 configuration approach

Use Tailwind v4's CSS-first `@theme` block in `globals.css` (no `tailwind.config.ts`)? This deviates from PRD §8.1 which ships a config file, but aligns with the `nextjs16-tailwind4` skill's mandate.

**Default:** Yes, use `@theme` only (Decision A).

### 9.3 Outfit weight 820

Self-host the Outfit variable font via `next/font/local` to access weight 820 precisely? This adds a woff2 file (~100KB) to the repo but ensures pixel-perfect parity with the live site's H1.

**Default:** Yes, self-host (Decision C). **Alternative:** Use `next/font/google` with weight 800 and accept the 20-unit difference.

### 9.4 Keyframe naming convention

Normalize all `@keyframes` to kebab-case (e.g., `grid-shimmer` instead of `gridShimmer`)? This deviates from PRD §9 verbatim (which uses camelCase) but aligns with PRD §8.1 (kebab-case) and modern Tailwind convention.

**Default:** Yes, kebab-case throughout (Decision B).

### 9.5 Framer Motion exclusion

Follow the PRD strictly — NO Framer Motion, all animation is CSS-only via `@keyframes`? The `nextjs16-tailwind4` skill includes Framer Motion in its pinned stack, but the PRD explicitly forbids it for Lighthouse ≥95.

**Default:** Yes, no Framer Motion (Decision F).

### 9.6 Testing scope

Write 6 Vitest unit tests + 3 Playwright E2E tests, with NO tests for static JSX rendering? The TDD skill explicitly excludes "static content changes that have no behavioral impact" from TDD scope.

**Default:** Yes (Decision H).

### 9.7 Hero background video source

How should the hero background video be sourced?
- (a) Download a royalty-free cinematic dark video from Pexels/Pixabay
- (b) Use one of the workflow step videos as a fallback
- (c) Generate via AI video generation tool (out of scope for this clone)
- (d) Use a static image as a poster-only fallback (no video)

**Default:** (a) Pexels. **Fallback if unavailable:** (d) poster-only.

### 9.8 Example thumbnail generation

Use the `image-generation` skill (z-ai-web-dev-sdk) to generate 6 portrait thumbnails matching the card titles? Or source from Unsplash?

**Default:** `image-generation` skill. **Fallback:** Unsplash + `cwebp` conversion.

### 9.9 OG image generation method

Generate the 1200×630 OG image via:
- (a) Playwright screenshot of an HTML template (recommended — uses Outfit 820)
- (b) `image-generation` skill (AI-generated, may not match brand exactly)
- (c) Python PIL with the Outfit font file

**Default:** (a) Playwright screenshot.

### 9.10 Pre-existing PRD drafts

Leave `PRD_2.md` and `draft_PRD.md` in the repo as historical artifacts (do not delete, do not reference during implementation)?

**Default:** Yes (Decision N).

### 9.11 Phase parallelization

Allow Phases 3 & 4 to be developed in parallel (different files, no shared state)? Allow Phase 6 (assets) to be developed in parallel with Phases 3-5?

**Default:** Yes, parallelize where the dependency graph allows.

### 9.12 Deployment target

Where will the clone be deployed?
- (a) Vercel (recommended for Next.js)
- (b) Netlify
- (c) Self-hosted (Docker)
- (d) No deployment — local build only

**Default:** (a) Vercel. **Note:** Deployment is the final step of Phase 7; if no deployment is desired, Phase 7 ends at "deploy-ready" instead of "deployed".

---

## 10. Skill Consultation Map

This map shows which skills are consulted in which phases, providing a quick reference for the implementing agent.

| Skill | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 | Phase 7 |
|---|---|---|---|---|---|---|---|---|
| `nextjs16-tailwind4` | ✓ | ✓ | ✓ | | ✓ | | ✓ | |
| `ui-styling` | | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| `frontend-design` | ✓ | | ✓ | ✓ | ✓ | ✓ | | ✓ |
| `tailwind-patterns` | | | ✓ | | | | | |
| `visual-design-foundations` | | | ✓ | | | | | |
| `performance-optimization` | | | | ✓ | | ✓ | ✓ | ✓ |
| `lint-and-validate` | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `code-review-checklist` | | | | | | | | ✓ |
| `planning-and-task-breakdown` | ✓ | ✓ | | | | | | |
| `coding-agent` (all 6 files) | ✓ | ✓ | ✓ | | | | | ✓ |
| `incremental-implementation` | ✓ | | | | ✓ | | | ✓ |
| `test-driven-development` | ✓ | | ✓ | | ✓ | | | ✓ |
| `playwright-cli` | | | | | | | ✓ | ✓ |
| `image-generation` | | | | | | | ✓ | |
| `debugging-and-error-recovery` | | | | | | | | (as needed) |
| `documentation-and-adrs` | | | | | | | | ✓ |
| `readme-md` | | | | | | | | ✓ |
| `agents-md` | | | | | | | | ✓ |

### 10.1 Skill substitution table (external → in-repo)

Skills referenced by `bundled_skills_to_use.md` that are NOT in the cloned repo's `/skills/` directory. For each, the in-repo substitute is used:

| External skill | In-repo substitute | Phases |
|---|---|---|
| `avant-garde-design-v4` | `frontend-design` + `aesthetic` | All |
| `super-frontend-design` | `frontend-design` + `frontend-ui-engineering` | All |
| `claude-design` | `design` (router) + `frontend-design` | 3, 4 |
| `code-quality-standards` | `code-review-checklist` + `code-review-and-audit` | 7 |
| `verification-and-review-protocol` | `coding-agent/verification.md` + `code-review-and-audit` | All gates |
| `webapp-testing-journey` | `playwright-cli` + `agent-browser` | 7 |
| `browser-testing-with-devtools` | `playwright-cli` | 7 |

---

## 11. Glossary

Terms specific to this execution plan (supplements PRD §16 Glossary).

| Term | Definition |
|---|---|
| **@theme block** | Tailwind v4's CSS-first configuration block. Replaces `tailwind.config.ts`. All design tokens (colors, fonts, spacing, keyframes, animations) live inside `@theme { … }` in `globals.css`. |
| **@utility** | Tailwind v4's replacement for `@layer components` and `@layer utilities`. Custom single-purpose classes are defined as `@utility name { … }` and can be used like any Tailwind utility. |
| **@source** | Tailwind v4 directive that explicitly tells the compiler which files to scan for utility class usage. Auto-detection works for the `app/` directory; `@source` is needed for `components/` and `lib/`. |
| **CSS Grid `0fr → 1fr` transition** | Modern accordion animation technique. The grid container's `grid-template-rows` transitions from `0fr` (collapsed) to `1fr` (expanded); inner content has `overflow: hidden`. Supported in Chrome 117+, Firefox 118+, Safari 17.4+. |
| **`force-static`** | Next.js page option that disables SSR and forces static generation at build time. Used on `app/page.tsx` for this clone. |
| **`next/font/local`** | Next.js's local font loader. Self-hosts font files at build time, generates fallback fonts with matching metrics, exposes CSS variables. Used for Outfit variable font (weight 820). |
| **`next/font/google`** | Next.js's Google Fonts loader. Auto-subsets and self-hosts at build time. Used for fonts available in discrete weights only (NOT used for Outfit 820 — see Decision C). |
| **Outfit weight 820** | An extra-bold display weight rarely seen in SaaS. The live site's H1 uses this exact weight. Available only via the variable font range (`100 900`), NOT via `next/font/google`'s discrete weights. |
| **Tailwind v4 kebab-case keyframes** | The modern Tailwind convention for `@keyframes` names. Replaces the PRD's mixed camelCase (`compositePulseText`) and kebab-case (`composite-pulse-text`) with consistent kebab-case. |
| **The singular purple exception** | The only place purple appears in the entire design system — the `bg-gradient-to-r from-yellow-500 to-purple-500` hover glow behind example carousel cards. All other accents are amber `#febf00`. |
| **4-tier CTA hierarchy** | The page's deliberate CTA visual hierarchy: (1) ghost link, (2) glass pill, (3) gradient pill, (4) solid amber pill. Amber's appearance is rationed so the final CTA feels "earned". |
| **Iron Law** | From the `verification-and-review-protocol` skill: no phase may be marked complete until every checklist item is visibly green. "I think it works" is insufficient — a screenshot, passing test, or Lighthouse score is required. |
| **Phase exit gate** | A checklist at the end of each phase that must be fully green before proceeding to the next phase. Prevents false completion claims and incremental technical debt. |
| **TDD (Red/Green/Refactor)** | Test-Driven Development cycle: write a failing test (Red) → write minimal code to pass (Green) → clean up the code without changing behavior (Refactor). Used for the 3 custom hooks in Phase 2 and the 2 Hero behavior tests in Phase 4. |

---

## 12. Changelog

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-06-26 | Frontend Architect | Initial draft. Synthesized from 4 deep-read passes over `Project_Requirements_Document.md` (2718 lines), 12 skill `SKILL.md` files + 7 reference files, `AGENTS.md`, `README.md`, `bundled_skills_to_use.md`. Defined 15 critical pre-build decisions (§3), 8 phases (Phases 0-7), ~48 source files with full interfaces, 7 risk register additions beyond PRD §15.3, 12 open questions for user validation. |

---

*End of MASTER_EXECUTION_PLAN.md. The build can now proceed to Phase 0 (Pre-Build Validation Gate) — user review and explicit approval of this plan.*

> **Next action for the user:** Read this document in full, then either:
> - Respond with **"proceed"** (or **"approved"**) to authorize Phase 1 execution, OR
> - Respond with **modifications** to any of the 15 decisions in §3, the 12 open questions in §9, or the phase breakdown — I will revise the plan and re-present for validation.


