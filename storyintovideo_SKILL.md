# StoryIntoVideo — Complete Project Skill

> **Purpose:** This document is the definitive reference for any coding agent working on the StoryIntoVideo codebase. It distills every design decision, architectural pattern, hook implementation, anti-pattern, and lesson learned into a single actionable guide. Read it before writing any code.

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Custom Hooks Deep Dive](#6-custom-hooks-deep-dive)
7. [Content Management: Static Data Pattern](#7-content-management-static-data-pattern)
8. [Accessibility (WCAG AAA) Implementation](#8-accessibility-wcag-aaa-implementation)
9. [Anti-Patterns & Common Bugs](#9-anti-patterns--common-bugs)
10. [Debugging Guide](#10-debugging-guide)
11. [Pre-Ship Checklist](#11-pre-ship-checklist)
12. [Lessons Learnt & How to Avoid Them](#12-lessons-learnt--how-to-avoid-them)
13. [Pitfalls to Avoid](#13-pitfalls-to-avoid)
14. [Best Practices](#14-best-practices)
15. [Coding Patterns](#15-coding-patterns)
16. [Coding Anti-Patterns](#16-coding-anti-patterns)
17. [Responsive Breakpoint Reference](#17-responsive-breakpoint-reference)
18. [Z-Index Layer Map](#18-z-index-layer-map)
19. [Color Reference (Complete)](#19-color-reference-complete)
20. [TypeScript Interface Reference](#20-typescript-interface-reference)

---

## 1. Project Identity & Design Philosophy

### What This Project Is

StoryIntoVideo is a production SaaS that transforms written stories into finished MP4 videos via a 6-step AI pipeline. Originally a pixel-accurate marketing clone of `storyintovideo.com`, it evolved into a hybrid Next.js 16 app with:

- **Marketing layer** — 10 sections, statically prerendered, luxury-dark cinematic aesthetic
- **Production app layer** — auth, dashboard, create wizard, project detail with SSE, billing
- **AI pipeline** — Inngest-orchestrated: moderate → analyze → characters → scenes → voiceover → subtitles → video assembly
- **Billing** — Stripe with credit metering + idempotent webhooks

### Design Philosophy: Luxury-Dark Cinematic

The design language is **not** brutalist, minimalist, or generic. It is a deliberate **luxury-dark cinematic** aesthetic with these non-negotiable principles:

1. **Amber is rationed** — `#febf00` is the ONLY hue permitted to assert itself. It appears on CTAs, focus rings, active states, and the singular eyebrow badge. It is NEVER used as a background fill except on the single Tier-4 CTA (FinalCTA section).

2. **The singular purple exception** — the yellow→purple gradient on example-card hover (`from-yellow-500 to-purple-500`) is the ONLY purple on the entire site. This is intentional — it signals "premium example content" and breaks the amber monopoly in one carefully chosen place.

3. **Background is `#020202`, NOT `#000000`** — the near-black has a warm-neutral undertone. Pure black looks flat; `#020202` has depth. This is field-verified from the live site.

4. **CSS-only animation** — no Framer Motion, no GSAP. All 13 keyframes are `@keyframes` in `globals.css`. This is critical for Lighthouse ≥95.

5. **Intentional minimalism** — whitespace is a structural element, not empty space. The 4-column feature grid uses continuous hairline borders, not boxed cards.

6. **Anti-generic enforcement** — no Bootstrap grids, no "Inter/Roboto safety", no purple-gradient-on-white clichés. Every pixel serves a purpose.

### The CTA Hierarchy (4 Tiers)

The call-to-action system is a deliberate hierarchy from restrained to assertive:

| Tier | Component | Visual | Usage |
|---|---|---|---|
| 1 (Ghost) | `CtaGhost` | Amber text, arrow translates on hover | Workflow steps, Features, Testimonials, UseCases |
| 2 (Glass) | Hero "Start Creating" | Glass pill with amber text, gradient bg | Hero section only |
| 3 (Gradient) | `CtaGradient` | Amber gradient pill (`from-primary to-primary`) | Examples "Clone this project" |
| 4 (Solid) | `CtaAmber` | Solid amber pill, the ONLY `bg-primary` button | FinalCTA "Start Creating — It's Free" |

---

## 2. Tech Stack & Environment

### Exact Versions (from `package.json`)

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router, hybrid) | `^16.2.0` | Turbopack dev server |
| UI | React | `^19.2.3` | ⚠️ CVE-2025-55182 floor — never downgrade below 19.2.3 |
| Styling | Tailwind CSS | `^4.3.0` | CSS-first `@theme` block (no `tailwind.config.ts`) |
| Components | shadcn/ui (hand-written) | — | 4 primitives: button, accordion, sheet, dropdown-menu |
| Fonts | Geist Sans + Geist Mono + Outfit 820 | self-hosted | Via `next/font/local` for Outfit weight 820 |
| Icons | Lucide React | `^0.460.0` | |
| Auth | Auth.js v5 (NextAuth) | `5.0.0-beta.31` | + `@auth/drizzle-adapter` |
| Database | PostgreSQL (Neon) + Drizzle ORM | `drizzle ^0.45.2` | 11 tables, 8 enums |
| Job Queue | Inngest | `^4.11.0` | 6-step AI pipeline |
| AI — LLM | OpenAI | `^6.45.0` | GPT-4o + Whisper + Moderation |
| AI — Image | Replicate | `^1.4.0` | SDXL + IP-Adapter |
| AI — TTS | ElevenLabs | `^1.59.0` | |
| Storage | Cloudflare R2 | `@aws-sdk/client-s3 ^3.1075` | 3 private buckets |
| Billing | Stripe | `^22.3.0` | Checkout + Portal + Webhooks |
| Validation | Zod | `^4.4.3` | Env + all Server Action inputs |
| Video | FFmpeg | system binary | `FFMPEG_PATH` env var (default `/usr/bin/ffmpeg`) |
| Rate Limiting | Upstash Ratelimit + Redis | `^2.0.8` / `^1.38.0` | auth, pipeline, SSE |
| Package Manager | pnpm | `>=10.26.0` | `allowBuilds` syntax floor |
| Node | — | `>=20.0.0` | |

### TypeScript Configuration (`tsconfig.json`)

Maximum strictness is enforced:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "verbatimModuleSyntax": true,
  "forceConsistentCasingInFileNames": true,
  "moduleResolution": "bundler",
  "target": "ES2022",
  "jsx": "react-jsx",
  "paths": { "@/*": ["./src/*"] }
}
```

**Critical rules enforced by this config:**
- `noUncheckedIndexedAccess` — array access returns `T | undefined`, forcing null checks
- `verbatimModuleSyntax` — `import type` is mandatory for type-only imports
- `noUnusedLocals` / `noUnusedParameters` — dead code is a compile error, not a warning

### ESLint Configuration (`eslint.config.mjs`)

Flat config (ESLint 9+), no `FlatCompat`:

```javascript
// Key rules (errors, not warnings):
'@typescript-eslint/no-explicit-any': 'error',
'@typescript-eslint/consistent-type-imports': 'error',
'react-hooks/exhaustive-deps': 'warn',
// Ignores: node_modules, .next, skills, docs, scripts, public
```

**`next lint` is deprecated in Next.js 16** — run `eslint .` directly.

### Prettier Configuration (`.prettierrc.json`)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### pnpm Workspace (`pnpm-workspace.yaml`)

```yaml
packages:
  - '.'
allowBuilds:
  esbuild: true
  protobufjs: true
  sharp: true
  unrs-resolver: true
```

**Critical:** `allowBuilds` (pnpm 10.26+) replaced `onlyBuiltDependencies` (removed in pnpm 11). The engine floor is `>=10.26.0` to enforce this syntax.

---

## 3. Bootstrapping & Configuration

### Recreating This Project From Scratch

```bash
# 1. Scaffold Next.js 16 with TypeScript + Tailwind v4
pnpm create next-app@latest story-into-video \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --use-pnpm

# 2. Install core dependencies
pnpm add next-auth@5.0.0-beta.31 @auth/drizzle-adapter
pnpm add drizzle-orm postgres
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
pnpm add inngest openai replicate elevenlabs
pnpm add stripe @upstash/ratelimit @upstash/redis
pnpm add bcryptjs zod lucide-react class-variance-authority clsx tailwind-merge
pnpm add geist fluent-ffmpeg

# 3. Install dev dependencies
pnpm add -D drizzle-kit @playwright/test vitest @vitejs/plugin-react
pnpm add -D jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm add -D typescript-eslint eslint-plugin-react eslint-plugin-react-hooks @next/eslint-plugin-next
pnpm add -D prettier prettier-plugin-tailwindcss
pnpm add -D husky lint-staged dotenv-cli tsx
pnpm add -D @types/bcryptjs @types/fluent-ffmpeg

# 4. Install Playwright browsers (separate step — pnpm install doesn't do this)
pnpm exec playwright install chromium

# 5. Download the Outfit variable font (weight 820 access)
# Source: https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf
# Convert to woff2 via fonttools → public/fonts/Outfit-VariableFont.woff2 (45KB)
```

### Critical Configuration Files

**`postcss.config.mjs`** — Tailwind v4 PostCSS plugin (replaces `tailwindcss` + `autoprefixer`):
```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

**`next.config.ts`** — Security headers + image formats + dev origins:
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ['image/avif', 'image/webp'] },
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
```

**`drizzle.config.ts`** — Uses `DATABASE_URL_UNPOOLED` (direct connection for DDL):
```typescript
export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED! },
  verbose: true,
  strict: true,
});
```

**`components.json`** (shadcn config):
```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "css": "src/app/globals.css", "baseColor": "zinc", "cssVariables": true },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui" },
  "iconLibrary": "lucide"
}
```

### Environment Setup

```bash
cp .env.example .env.local
# Fill in 27 required env vars + 3 optional (Google OAuth)
pnpm drizzle-kit generate    # Create migration SQL from schema
pnpm drizzle-kit migrate     # Apply to Neon (needs DATABASE_URL_UNPOOLED)
pnpm dev                     # Start dev server (Turbopack, port 3000)
```

**Env validation is fail-fast at module load.** The Zod schema in `src/lib/env/index.ts` validates all 30 vars. Missing/invalid vars throw at boot with a descriptive error. Build context (`NEXT_PHASE=phase-production-build` or `NODE_ENV=test`) returns placeholders so `next build` succeeds without real secrets.

---

## 4. The Design System (Code-First)

### The `@theme` Block (Tailwind v4 CSS-First)

All design tokens live in `src/app/globals.css` inside `@theme { ... }`. There is **no `tailwind.config.ts`**. This is the Tailwind v4 CSS-first convention.

```css
@import 'tailwindcss';

@source '../components/**/*.{ts,tsx}';
@source '../lib/**/*.{ts,tsx}';

@theme {
  /* ── Color Palette (field-verified from live site) ── */
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
}
```

### ⚠️ Critical Color Rule

`#febf00` ≠ Tailwind's `amber-400` (`#fbbf24`). These are different colors. **Always use the custom `--color-primary` token**, never `amber-400`. The `brand-tokens.test.ts` CI guard enforces zero `amber-300/400/500/600` and `bg-zinc-950/900/black` violations across all source files.

### Typography Hierarchy

| Element | Font | Weight | Key Class |
|---|---|---|---|
| H1 (hero) | Outfit | **820** | `font-heading text-[4.5rem] tracking-[-0.04em]` + `style={{ fontWeight: 820 }}` |
| H2 (sections) | Outfit | 700 | `font-heading text-4xl lg:text-6xl tracking-[-0.03em]` |
| Body | Geist Sans | 400 | `font-sans text-lg` |
| Ratio toggles | Geist Mono | 400 | `font-mono text-[10px]` |
| Eyebrow | Geist Sans | 600 | `text-[11px] tracking-widest uppercase` |

**Outfit weight 820** is self-hosted via `next/font/local` because Google Fonts API only serves discrete weights (100, 200, ..., 900). The variable font file (`Outfit-VariableFont.woff2`, 45KB) supports the full 100-900 range including 820.

### The 13 Keyframes (All Kebab-Case)

```css
/* Inside @theme so Tailwind v4 picks them up as --animate-* utilities */
fade-in-up, float, glow-pulse, border-glow, composite-pulse-text,
shimmer, btn-shimmer, grid-shimmer, grid-sweep-h, grid-sweep-v,
scanline-scroll, lang-dropdown-in, marquee-scroll
```

**Usage pattern:** `animate-[fade-in-up_0.6s_ease-out_0.1s_both]` (arbitrary value syntax in className).

### Custom `@utility` Classes

Tailwind v4 replaces `@layer components` + `@layer utilities` with `@utility`:

| Utility | Purpose |
|---|---|
| `scrollbar-hide` | Hide scrollbar for carousels (cross-browser) |
| `marquee-mask` | Edge fade mask for the style chips marquee |
| `marquee-track` | Infinite horizontal scroll, pauses on hover |
| `glass-input` | Hero textarea wrapper — backdrop-blur + amber focus glow |
| `eyebrow` | Amber pill badge with ambient glow |
| `section-heading` | Outfit H2, fluid `clamp(2rem, 5vw, 3rem)` |
| `cta-amber` | Solid amber pill, hover scale 1.02 + glow |

### Scroll Reveal Pattern (CSS + JS Data Attributes)

```css
/* globals.css */
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
```

The `useReveal` hook flips `data-revealed` from `'false'` to `'true'` when the element enters the viewport via `IntersectionObserver`. Staggered delays are set via `style={{ '--reveal-delay': '${delay}ms' }}`.

---

## 5. Component Architecture & Patterns

### The 5-Layer Architecture (Golden Rule)

```
Layer 0: src/proxy.ts             — Cookie check, redirect. NO DB. NO logic. Edge runtime.
Layer 1: src/app/                 — Route structure, metadata, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (auth, projects, pipeline, billing)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers. Side effects only.
```

**Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code.

### Server vs Client Component Decision Tree

```
Does the component use useState, useEffect, event handlers, or browser APIs?
  YES → 'use client' at the top of the file
  NO  → Server Component (default, no directive needed)
```

**Client components in this codebase:**
- Marketing: Navbar, Hero, Examples, Faq, Workflow, ScrollReveal
- App: AuthForm, CreateWizard, Providers, ProjectProgressPanel, ProjectDownloadButton, ProjectShareButton, CookieBanner

**Server components (default):**
- Marketing: Features, Testimonials, UseCases, FinalCTA, Footer
- App: Dashboard, Create page, Project detail page, Billing page
- Legal: Privacy, Terms, Pricing, Blog, Contact
- `not-found.tsx`

### The `queries.ts` Boundary

All DB access goes through feature-level `queries.ts` files. Components never call `db` directly.

```
src/features/
├── auth/{actions,queries,domain/verify-session}.ts
├── projects/{queries,actions}.ts
├── pipeline/{queries,inngest,domain/}.ts
├── billing/{queries,actions,domain/}.ts
```

**Pattern:**
```typescript
// src/features/projects/queries.ts
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';

export async function getUserProjects(userId: string) {
  return db.select().from(projects).where(eq(projects.userId, userId));
}
```

### Auth Pattern: `verifySession()` vs `auth()`

| Context | Use | Behavior |
|---|---|---|
| Server Components / Server Actions | `verifySession()` | Throws `NEXT_REDIRECT` → redirects to `/sign-in` |
| API routes (JSON, SSE) | `auth()` | Returns `null` → return 401 JSON |

**CRITICAL:** Never wrap `verifySession()` in try/catch — it throws `NEXT_REDIRECT` which must propagate. Never use `verifySession()` in API routes — it would produce a 307 redirect instead of a 401 JSON.

```typescript
// Server Component pattern
import { verifySession } from '@/features/auth/domain/verify-session';

async function DashboardPage() {
  const session = await verifySession({ redirectTo: '/dashboard' });
  const userId = session.user?.id;
  // ...
}

// API route pattern
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

### Marketing Page Composition (10 Sections, Fixed Order)

```typescript
// src/app/page.tsx
<Navbar />     {/* fixed, scroll-aware */}
<Hero />       {/* video bg + glass input + style marquee */}
<Examples />   {/* carousel */}
<Workflow />   {/* 4 alternating media/text rows */}
<Features />   {/* 4×2 hairline grid */}
<Testimonials />
<UseCases />   {/* 2×2 grid */}
<Faq />        {/* Radix Accordion */}
<FinalCTA />   {/* solid amber pill */}
<Footer />
```

### CTA Primitive Components

All 3 CTA primitives are **Server Components** (pure presentation, hover via CSS `group` utility). They use `next/link`'s `<Link>`, not `<a>`.

| Component | Tier | Visual | Props |
|---|---|---|---|
| `CtaGhost` | 1 | Amber text, arrow translates on hover | `children, href, className` |
| `CtaGradient` | 3 | Amber gradient pill | `children, href, className` |
| `CtaAmber` | 4 | Solid amber pill, hover scale + glow | `children, href, className, onClick?` |

### EmptyState Pattern

```typescript
<EmptyState
  icon={<Film className="h-6 w-6" aria-hidden="true" />}
  title="No projects yet"
  description="Create your first AI-generated video from a story."
  ctaLabel="Create your first video"
  ctaHref="/create"
/>
```

Uses the luxury-dark design system: `bg-white/[0.02]` surface, `border-white/[0.06]` border, `text-primary` CTA.

### Suspense Pattern (Next.js 16 `cacheComponents`)

```typescript
// Dashboard page — async data fetcher wrapped in Suspense
function DashboardSkeleton() {
  return <div className="animate-pulse rounded-2xl bg-white/[0.02]" />;
}

export default function DashboardPage() {
  return (
    <main>
      <Suspense fallback={<DashboardSkeleton />}>
        <ProjectList />
      </Suspense>
    </main>
  );
}

async function ProjectList() {
  const session = await verifySession({ redirectTo: '/dashboard' });
  // ... fetch and render
}
```

---

## 6. Custom Hooks Deep Dive

### `useScrolled(threshold)` — Scroll-Aware Navbar

```typescript
// src/lib/hooks/use-scrolled.ts
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

**Usage:** `<Navbar>` toggles between `bg-transparent` and `bg-background/70 backdrop-blur-[24px] border-b border-white/10`.

**Key detail:** `{ passive: true }` on the scroll listener — prevents blocking the main thread during scroll. The `onScroll()` call on mount ensures the initial state is correct (in case the page loads scrolled).

### `useReveal<T>(options)` — IntersectionObserver Reveal

```typescript
// src/lib/hooks/use-reveal.ts
interface UseRevealOptions {
  threshold?: number;      // default 0.15
  rootMargin?: string;     // default '0px 0px -50px 0px' (triggers 50px before entering)
  once?: boolean;          // default true (disconnect after first intersection)
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {},
): { ref: React.RefObject<T | null>; revealed: boolean } {
  // ... IntersectionObserver implementation
}
```

**Usage:** The `ScrollReveal` primitive wraps this hook and sets `data-reveal` / `data-revealed` attributes. The CSS in `globals.css` handles the opacity + translateY transition.

**Staggered animation pattern:** Section components wrap each card in `<ScrollReveal delay={Math.min(idx * 80, 400)}>` — 80ms stagger per card, capped at 400ms.

### `useReducedMotion()` — OS-Level Motion Preference

```typescript
// src/lib/hooks/use-reduced-motion.ts
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mediaQuery.matches);
    onChange();
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
```

**Dual-layer approach:** The global CSS `@media (prefers-reduced-motion: reduce)` block handles most cases declaratively (disables all animations, hides autoplay videos, forces `[data-reveal]` to visible). This hook is for JS-conditional cases (e.g., skipping a programmatic animation).

### `useProjectProgress(projectId)` — SSE with Exponential Backoff

This is the most complex hook — it subscribes to a Server-Sent Events stream for live pipeline progress, with automatic reconnection.

```typescript
export interface ProjectProgressState {
  status: string | null;
  progressPercent: number | null;
  progressDetail: string | null;
  errorMessage: string | null;
  connectionState: 'connecting' | 'open' | 'closed' | 'error' | 'reconnecting';
}

export function useProjectProgress(projectId: string): ProjectProgressState
```

**Key implementation details:**

1. **EventSource lifecycle:** Opens on mount, closes on unmount or terminal status (`completed`/`failed`).

2. **Exponential backoff reconnection:** On error, waits 1s → 2s → 4s (3 attempts max). Vercel Fluid Compute caps SSE at 300s (Hobby) or 800s (Pro/Enterprise GA); the pipeline runs 5-15min, so a single connection may not survive.

3. **Double-close guard:** After closing on terminal status, sets `eventSource = null` so the cleanup function's `if (eventSource)` guard skips the redundant close.

4. **Cancellation flag:** `isCancelled` prevents reconnect attempts after unmount — without it, a reconnect timer could fire after the component is gone.

5. **Counter reset on success:** `onopen` resets `reconnectAttempt = 0` — a successful connection after a reconnect doesn't count toward the attempt cap.

```typescript
// Reconnect logic
const openStream = () => {
  if (isCancelled) return;
  eventSource = new EventSource(`/api/projects/${projectId}/progress`);
  eventSource.onopen = () => { reconnectAttempt = 0; /* ... */ };
  eventSource.onmessage = (event) => { /* parse + update state */ };
  eventSource.onerror = () => {
    eventSource?.close();
    if (isCancelled) return;
    if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      setState((prev) => ({ ...prev, connectionState: 'error' }));
      return;
    }
    const delay = BASE_BACKOFF_MS * Math.pow(2, reconnectAttempt);
    reconnectAttempt += 1;
    setState((prev) => ({ ...prev, connectionState: 'reconnecting' }));
    reconnectTimer = setTimeout(() => openStream(), delay);
  };
};
```

---

## 7. Content Management: Static Data Pattern

Unlike Vite-based projects that use `import.meta.glob`, this Next.js project uses **static TypeScript data files** in `src/lib/data/`. This provides type safety, tree-shaking, and no runtime file-system access.

### File Structure

```
src/lib/data/
├── nav-links.ts          # NAV_LINKS (4 items) + NAV_LANGUAGES
├── footer-links.ts       # FOOTER_COLUMNS (3 columns) + FOOTER_BRAND + FOOTER_COPYRIGHT
├── story-seeds.ts        # STORY_SEEDS (4 seeds) + DEFAULT_STORY_EXAMPLES
├── style-chips.ts        # STYLE_CHIPS (8 chips — the spec set)
├── examples.ts           # EXAMPLE_CARDS (6 portrait cards)
├── workflow-steps.ts     # WORKFLOW_STEPS (4 alternating media/text rows)
├── features.ts           # FEATURES (8 items, 4×2 grid)
├── testimonials.ts       # TESTIMONIALS (6 cards)
├── use-cases.ts          # USE_CASES (4 cards, 2×2 grid)
├── faq-items.ts          # FAQ_ITEMS (6 accordion items)
```

### Pattern: Typed Data Constants

```typescript
// src/lib/data/style-chips.ts
import type { StyleChip } from '@/types';

export const STYLE_CHIPS: StyleChip[] = [
  { label: 'Ghibli' },
  { label: 'Medieval' },
  { label: 'Oil Painting' },
  { label: 'Anime' },
  { label: 'Japanese animation' },
  { label: 'Realistic' },
  { label: 'Cyberpunk', sublabel: 'Futuristic neon' },
  { label: 'Watercolor' },
];
```

**The 8-chip spec set is locked** — `style-chips.test.ts` enforces exact labels + uniqueness. Any drift (e.g., "Comic" instead of "Medieval") fails CI.

### Adding New Content

1. Add the data object to the appropriate file in `src/lib/data/`
2. Ensure the TypeScript type in `src/types/index.ts` matches
3. The consuming component imports it and renders via `.map()`
4. If it's a new data category, create a new file + interface + test

### Why Not `import.meta.glob`?

This is a **Next.js App Router** project, not Vite. Next.js uses:
- Static imports for type-safe, tree-shakeable data
- Server Components for data fetching (async server functions)
- The `queries.ts` boundary for DB access

`import.meta.glob` is a Vite-specific API that doesn't exist in Next.js. Attempting to use it will cause a build error.

---

## 8. Accessibility (WCAG AAA) Implementation

### Focus Rings

```css
/* globals.css — global focus-visible */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

All interactive components use `focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2` (NOT `outline-amber-400` — that's the wrong color).

### Skip-to-Content Link

```typescript
// src/app/layout.tsx
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50
    focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-zinc-950"
>
  Skip to content
</a>
```

Visually hidden by default, appears on focus. The `#main` target must exist on every page (add `id="main"` to the `<main>` element).

### Reduced Motion (Dual-Layer)

**Layer 1 — CSS (global):**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .marquee-track { animation: none !important; }
  video[autoplay] { display: none; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

**Layer 2 — JS hook:** `useReducedMotion()` for programmatic decisions.

### Touch Targets

All interactive elements have minimum 44×44px touch targets on mobile:

```typescript
// Hero ratio toggle buttons
<button
  className="flex min-h-[44px] min-w-[44px] items-center justify-center"
  aria-pressed={isActive}
>
```

### Color Contrast

| Combination | Ratio | Standard |
|---|---|---|
| zinc-300 (#d4d4d8) on zinc-950 (#09090b) | 12.6:1 | WCAG AAA |
| primary (#febf00) on background (#020202) | 14.8:1 | WCAG AAA |
| zinc-500 (#8e8e95) on background (#020202) | 6.4:1 | WCAG AA |

### ARIA Patterns

- **Accordion:** Radix UI `Accordion` with `aria-labelledby` on each item
- **Carousel:** `role="region"` + `aria-label="Example videos carousel"` on the scroll container
- **Mobile nav:** Radix `Sheet` with `SheetTitle` (required for `aria-label`)
- **Active state:** `aria-pressed={isActive}` on toggle buttons (ratio toggles, style chips)

### Hero Video Accessibility

```typescript
<video
  autoPlay
  muted
  loop
  playsInline
  preload="metadata"
  poster="/hero-poster.webp"
  aria-hidden="true"  // Decorative, no audio
>
```

The hero video is decorative — it has no audio and provides no information. `aria-hidden="true"` removes it from the accessibility tree.

---

## 9. Anti-Patterns & Common Bugs

### 1. Using `amber-400` Instead of `--color-primary`

**Bug:** `text-amber-400` renders as `#fbbf24` (Tailwind's default amber), not `#febf00` (the brand amber). These are different colors.

**Fix:** Always use `text-primary`, `bg-primary`, `border-primary`. The `brand-tokens.test.ts` CI guard enforces zero `amber-300/400/500/600` violations.

### 2. Using `bg-zinc-950` Instead of `bg-background`

**Bug:** `bg-zinc-950` is `#09090b`, not `#020202` (the brand background). The 7-digit difference is visible.

**Fix:** Always use `bg-background`. The `brand-tokens.test.ts` CI guard enforces zero `bg-zinc-950/900/black` violations.

### 3. Importing `r2.ts` in Client Components

**Bug:** `import { getSignedDownloadUrl } from '@/lib/storage/r2'` in a `'use client'` file crashes the browser — `r2.ts` imports `env` which validates 30 server-only env vars at module load. In the browser, only `NEXT_PUBLIC_*` vars exist.

**Fix:** Server Component signs the URL, passes as prop to client component. Or client component fetches a `/api/...` route that signs at click time (the H4 pattern).

### 4. Using `verifySession()` in API Routes

**Bug:** `verifySession()` throws `NEXT_REDIRECT` — wrong for JSON/SSE endpoints that should return 401.

**Fix:** API routes use `auth()` directly:
```typescript
const session = await auth();
if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### 5. Using `<a href>` for Internal Routes

**Bug:** Causes full-page reloads, degrading UX + Lighthouse.

**Fix:** Use `<Link>` from `next/link` for all internal routes. Keep `<a>` for `mailto:`, hash anchors (`#main`), and external URLs. The `cta-routes.test.ts` source-reading test enforces `<Link` usage across 9 files.

### 6. Vitest Mock Factory Hoisting

**Bug:** `vi.mock()` factories are hoisted above imports. Referencing an outer `const mockFn = vi.fn()` inside the factory throws `Cannot access 'mockFn' before initialization`.

**Fix:** Use `vi.hoisted()`:
```typescript
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }));
vi.mock('module', () => ({ x: mockFn }));
```

### 7. Mock Constructors Need `class` Syntax

**Bug:** `vi.fn().mockImplementation(() => ({ ... }))` returns an arrow function that can't be `new`-ed. Real code does `new S3Client(...)`.

**Fix:** Use `class` syntax:
```typescript
class MockS3Client { send = sendMock; }
```

### 8. `.tsx` Extension Required for JSX Tests

**Bug:** `render(<Component />)` in a `*.test.ts` file produces `[PARSE_ERROR] Expected '>' but found 'Identifier'` from oxc.

**Fix:** Rename to `*.test.tsx`. The transformer needs the `.tsx` extension to parse JSX.

### 9. `fetch()` in Pipeline Tests Hits Real DNS

**Bug:** Steps 5 and 6 download audio/SRT from R2 via `fetch(signedUrl)`. In tests, the signed URL is `https://r2.example.com/...` which fails with `ENOTFOUND`.

**Fix:** Stub `fetch` globally:
```typescript
const fetchMock = vi.fn().mockResolvedValue({ arrayBuffer: ..., text: ... });
vi.stubGlobal('fetch', fetchMock);
```

### 10. `NODE_ENV` is Read-Only in Tests

**Bug:** `process.env.NODE_ENV = 'test'` silently fails (read-only property).

**Fix:** `vi.stubEnv('NODE_ENV', 'test')`.

### 11. Source-Reading Tests Must Strip Comments

**Bug:** When asserting "code does not contain X" via regex on source, docblock comments that mention the old pattern trigger false positives.

**Fix:**
```typescript
const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
expect(stripped).not.toMatch(/pattern/);
```

### 12. `Date.now()` Temp File Names Collide Under Concurrency

**Bug:** Two Inngest pipeline runs finishing at the same millisecond write to the same `/tmp/siv-srt-<ts>.srt` file.

**Fix:** Use `crypto.randomUUID()` for temp file names.

### 13. `EventSource.close()` is Idempotent but Sloppy

**Bug:** Calling `close()` twice doesn't crash, but it's sloppy. The cleanup function's `if (eventSource)` guard would still try to close.

**Fix:** Set `eventSource = null` after `close()`:
```typescript
eventSource?.close();
eventSource = null;
```

### 14. `pnpm-workspace.yaml` Missing `packages:` Field

**Bug:** Fresh clones with pnpm 9+ fail with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION packages field missing or empty`.

**Fix:** Add `packages: ['.']` to `pnpm-workspace.yaml`.

### 15. `esbuild` Build Scripts Need Approval

**Bug:** `pnpm install` skips esbuild's postinstall (drizzle-kit, vitest, tsx depend on it).

**Fix:** Add `esbuild: true` to the `allowBuilds` map in `pnpm-workspace.yaml` (pnpm 10.26+ syntax).

### 16. AUTH_URL ↔ NEXT_PUBLIC_APP_URL Host Mismatch (Sprint 3 T1)

**Bug:** When `AUTH_URL` and `NEXT_PUBLIC_APP_URL` point to different hosts, auth-protected routes redirect to the wrong host.

**Fix:** The env module now **THROWS** at boot in production runtime (Sprint 3 T1). Dev/test keep the warn-only behavior. Set both env vars to the same production host.

### 17. `/api/health` `config.healthy=false` Does NOT Trigger 503 (Sprint 3 T2)

**Bug:** Monitoring that checks only HTTP status misses env misconfigurations.

**Fix:** Monitoring must inspect the JSON body's `config.healthy` field, not just HTTP 200/503. The `config` + `configErrors` fields are observability, not liveness.

### 18. CookieBanner Must Use `useSyncExternalStore`, Not `useState` (Sprint 3 T8)

**Bug:** `useState` + `useEffect` to read `localStorage` triggers the `react-hooks/set-state-in-effect` lint rule.

**Fix:** Use `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`. Server snapshot returns `false` (no banner during SSR → no hydration mismatch).

### 19. R2 Key Collection Must Happen BEFORE DB CASCADE (Sprint 3 T4)

**Bug:** If you delete the user row first, the projects table is wiped by CASCADE, making it impossible to find the R2 keys — orphaning media forever.

**Fix:** `deleteUserAccount()` first SELECTs all R2 keys across the user's projects, THEN deletes the user row (CASCADE handles children), THEN best-effort `deleteUserMedia(keys[])`.

### 20. `deleteUserMedia` Blasts All 3 R2 Buckets Per Key (Sprint 3 T4)

**Bug:** A given key exists in exactly one bucket, but we don't know which without listing. Listing + deleting is 3× round-trips.

**Fix:** `DeleteObjectsCommand` silently ignores missing keys, so calling it against all 3 buckets is safe and avoids 3× list-then-delete round-trips. Errors are logged but don't throw (DB deletion is the source of truth).

---

## 10. Debugging Guide

### Build Fails: "Invalid environment variables"

**Cause:** Real env vars not set in `.env.local`.

**Fix:** Copy `.env.example` → `.env.local`, fill in real values. The build-context fallback only applies when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`.

### Build Fails: "Failed to collect page data for /api/auth/[...nextauth]"

**Cause:** Auth route tries to prerender DrizzleAdapter.

**Fix:** Ensure `export const dynamic = 'force-dynamic'` in the route handler.

### Production App Refuses to Boot: "❌ Host mismatch in environment variables"

**Cause:** Sprint 3 T1 — `AUTH_URL` and `NEXT_PUBLIC_APP_URL` hosts differ in production runtime.

**Fix:** Set both env vars to the same production host (e.g., `https://storyintovideo.jesspete.shop`). Dev/test keep the warn-only behavior.

### `/api/health` Returns 200 but `config.healthy: false`

**Cause:** AUTH_URL ↔ NEXT_PUBLIC_APP_URL host mismatch (T2 surfaces it).

**Fix:** Check the `configErrors` array in the JSON response. Fix the env vars. NOTE: this does NOT return 503 — monitoring must check `config.healthy`, not HTTP status.

### Auth Redirects to `http://localhost:3000` in Production

**Cause:** `AUTH_URL` or `NEXT_PUBLIC_APP_URL` env var set to localhost.

**Fix:** Set both to the production URL. With Sprint 3 T1 deployed, the app would have refused to boot — so if you're seeing this, T1's fail-fast may have been disabled.

### Nav Clicks Cause Full-Page Reloads

**Cause:** Raw `<a href>` instead of `<Link>` (Sprint 3 T5 fixed this across 9 files).

**Fix:** Use `<Link>` from `next/link`. The `cta-routes.test.ts` test enforces this. `mailto:` and hash anchors (`#main`) intentionally stay as `<a>`.

### Tests Fail: "Cannot find module 'next/server'"

**Cause:** jsdom can't load Next.js server modules.

**Fix:** Mock `next-auth`, `next/navigation`, and `@/lib/db` in tests that transitively import them.

### Tests Fail: "Cannot access 'X' before initialization"

**Cause:** `vi.mock()` factory references a `vi.fn()` defined in the test body.

**Fix:** Use `vi.hoisted()`:
```typescript
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }));
```

### Tests Fail: "X is not a constructor"

**Cause:** Mock factory returns an arrow function, but real code does `new X()`.

**Fix:** Use `class` syntax in the mock factory.

### Tests Fail: "[PARSE_ERROR] Expected '>' but found 'Identifier'"

**Cause:** Test file uses JSX but has `.test.ts` extension.

**Fix:** Rename to `*.test.tsx`.

### Pipeline Tests Fail: "fetch failed: ENOTFOUND r2.example.com"

**Cause:** Steps 5 & 6 download audio/SRT via `fetch()` which hits real DNS.

**Fix:** Stub global `fetch`:
```typescript
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ arrayBuffer: ..., text: ... }));
```

### `pnpm install` Fails: "ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION"

**Cause:** `pnpm-workspace.yaml` missing `packages:` field.

**Fix:** Add `packages: ['.']` to `pnpm-workspace.yaml`.

### `pnpm install` Warns: "Ignored build scripts: esbuild"

**Cause:** `pnpm-workspace.yaml` missing esbuild approval.

**Fix:** Add `esbuild: true` to the `allowBuilds` map in `pnpm-workspace.yaml`.

### Replicate Scene Generation 404s

**Cause:** `REPLICATE_SDXL_IPADAPTER_MODEL` is the SDXL base placeholder (not IP-Adapter).

**Fix:** Set `REPLICATE_SDXL_IPADAPTER_MODEL` env var to a real `lucataco/sdxl-ipadapter:<sha>` hash from replicate.com/explorer.

### `DELETE /api/user` Returns 200 but R2 Media Still Exists

**Cause:** T4's `deleteUserMedia` is best-effort — R2 errors are logged but don't fail the request.

**Fix:** Check server logs for `[r2] deleteUserMedia: batch failed in bucket <name>:`. The DB CASCADE has already succeeded; orphaned R2 keys are inert. Re-run a manual R2 cleanup if needed.

### CookieBanner Flashes Open Then Disappears

**Cause:** SSR snapshot returns `false` (banner hidden), client snapshot reads localStorage — if the user already acknowledged, there's a brief render before `useSyncExternalStore` resolves.

**Fix:** This is the documented `useSyncExternalStore` SSR pattern. Verify `getServerSnapshot` returns `false` and `if (!shouldShow) return null` is the first statement.

### E2E Tests in CI Fail: "Cannot connect to the database"

**Cause:** Postgres 17 service container not ready when `drizzle:migrate` runs.

**Fix:** The `services.postgres.options` health check (`pg_isready`) should block. Verify retries (5 × 10s = 50s timeout) are sufficient for cold starts.

---

## 11. Pre-Ship Checklist

### Before Every Commit

```bash
pnpm lint          # ESLint — 0 warnings, 0 errors
pnpm typecheck     # tsc --noEmit — 0 errors
pnpm test          # Vitest — 479 unit tests pass (53 files)
pnpm test:e2e      # Playwright — 48 E2E tests pass (9 specs, requires Playwright browsers)
pnpm build         # next build — 0 errors, 22 routes compiled
```

**Pre-commit chain:**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All four must pass with zero warnings/errors. **husky + lint-staged** automatically run ESLint + Prettier on staged `.ts/.tsx` files via `.husky/pre-commit`. Run the full chain manually before pushing — lint-staged only checks staged files.

### Before Every Deploy

1. **Provision external services** — Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2 (3 buckets), Stripe, Inngest, Resend, Upstash, Sentry
2. **Run migrations** — `pnpm drizzle:generate && pnpm drizzle:migrate` against real Neon
3. **Set `AUTH_URL` AND `NEXT_PUBLIC_APP_URL`** to the same production URL (T1 throws if they differ)
4. **Set `REPLICATE_SDXL_IPADAPTER_MODEL`** to a real `lucataco/sdxl-ipadapter:<sha>` hash
5. **Run `pnpm install`** to activate husky
6. **Post-deploy smoke test:**
   - `GET /api/health` → assert HTTP 200 + `status === 'healthy'` + `config.healthy === true` + empty `configErrors`
   - `GET /dashboard` (unauthenticated) → expect 307 redirect to `/sign-in` on the SAME host (NOT `localhost:3000`)
   - `GET /pricing`, `/blog`, `/contact` → expect 200 with proper metadata
   - `GET /nonexistent` → expect 404 with custom not-found page

### CI Verification

The `.github/workflows/ci.yml` workflow runs two jobs on every PR:

1. **`quality-gate`** — lint + typecheck + test + build (blocking)
2. **`e2e`** — Playwright with Postgres 17 service container (`continue-on-error: true` initially — flip to required once stable)

### Lighthouse Targets (Marketing Page)

| Category | Target |
|---|---|
| Performance | ≥ 95 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |

---

## 12. Lessons Learnt & How to Avoid Them

### Architecture

1. **5-layer architecture prevents circular dependencies** — proxy → app → features → domain → lib. Lower layers never import higher. Domain is pure (no Next.js, no DB runtime).

2. **`queries.ts` boundary keeps DB access centralized** — components never call `db` directly. All access goes through feature-level `queries.ts` files.

3. **Hybrid rendering (no `force-static`)** — marketing page is static-prerendered; app routes are dynamic; API routes are `force-dynamic`. Don't add `force-static` to app routes.

### Auth

4. **`trustHost: true` is mandatory for reverse-proxy deployments** — without it, Auth.js falls back to `AUTH_URL` which may be `localhost:3000` if the dev default leaked to production.

5. **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host mismatch is a leading indicator of misconfiguration** — the env module now THROWS in production runtime (Sprint 3 T1). Dev/test warn-only.

6. **API routes use `auth()`, not `verifySession()`** — `verifySession()` throws `NEXT_REDIRECT` (wrong for JSON). `auth()` returns null → 401 JSON.

### Testing

7. **Vitest mock hoisting is the #1 test bug** — use `vi.hoisted()` for any `vi.fn()` referenced inside `vi.mock()` factories.

8. **Mock constructors must be `class`, not arrow fns** — `new S3Client(...)` requires the mock to be `new`-able.

9. **`.tsx` extension is mandatory for JSX tests** — oxc throws `[PARSE_ERROR]` for JSX in `*.test.ts`.

10. **Source-reading tests must strip comments** — docblocks that mention old patterns trigger false positives.

11. **`fetch()` in tests hits real DNS** — stub `fetch` globally for tests that exercise the Inngest pipeline.

12. **`NODE_ENV` is read-only** — use `vi.stubEnv('NODE_ENV', 'test')`.

### Pipeline

13. **TDD exposed 4 latent defects in `assemble-video.ts`** — placeholder Buffer, missing SRT file, missing input options, brittle filter extraction. All discovered by writing tests first.

14. **Image moderation via Replicate's safety output is preferred** — parsing `safety_concept` adds zero latency vs. a second OpenAI vision API call.

15. **`putObject` for pipeline vs. `getSignedUploadUrl` for client uploads** — pipeline has Buffer in memory (direct PUT); client uploads use presigned URLs.

### Infrastructure

16. **`postgres()` doesn't connect until a query runs** — eager db instantiation is safe for build-time.

17. **DrizzleAdapter validates the db object's structure** — Proxy-based lazy db is rejected. Use a real Drizzle client.

18. **Inngest v4 changed `createFunction` signature** — trigger is in `triggers: [{ event: '...' }]`, not a second argument.

19. **Stripe "Basil" API (2025-03-31) moved `current_period_end`** — field removed from top-level Subscription, moved to `subscription.items.data[0].current_period_end`.

20. **ElevenLabs `textToSpeech.convert()` returns a `Readable`**, not `ReadableStream` — the `streamToBuffer` helper duck-types both.

### Sprint 3 (T1–T9)

21. **`console.warn` is insufficient for env misconfigurations** — production misconfigs should fail fast (throw) OR be surfaced via `/api/health`. T1 throws; T2 surfaces.

22. **Legal pages must not promise features the code doesn't implement** — Privacy Policy §4/§6 now match the code (T3/T4 GDPR endpoints).

23. **`<a href>` vs `<Link>` drift is easy to miss in source-reading tests** — tests should assert both the route AND the component type.

24. **Next.js default 404 inherits root layout metadata** — always ship a custom `not-found.tsx` (T7).

25. **`useSyncExternalStore` is the SSR-safe way to read `localStorage`** — avoids the `react-hooks/set-state-in-effect` lint rule (T8).

26. **R2 cleanup on account deletion is best-effort** — DB cascade always succeeds; R2 errors are logged but don't fail the GDPR request (T4).

27. **CI e2e needs Postgres service container** — `pg_isready` health check, `DATABASE_URL` pointing at `localhost:5432`, `drizzle:migrate` before `test:e2e` (T9).

### Remediation Sprint 1 (Pipeline Wiring + UX)

28. **`inngest.send()` must be wrapped in try/catch** — when Inngest is unreachable, `setProjectFailed()` prevents orphan `pending` projects (T7).

29. **Image moderation via Replicate's safety output is preferred** — parsing `safety_concept` adds zero latency vs. a second OpenAI vision API call (ADR-011).

30. **`putObject` for pipeline vs. `getSignedUploadUrl` for client uploads** — pipeline has Buffer in memory (direct PUT); client uploads use presigned URLs (M3).

### Remediation Sprint 2 (Post-Review Hardening)

31. **`trustHost: true` is mandatory for reverse-proxy deployments** — without it, Auth.js falls back to `AUTH_URL` which may be `localhost:3000` if the dev default leaked to production. This was a P0 production outage (T2).

32. **Hardcoded third-party model IDs are an operational liability** — the placeholder `SDXL_IPADAPTER_MODEL` hash was a UUID-format string, not Replicate's 64-char hex SHA. Scene generation would have 404'd. Model IDs are now env-configurable with format validation (T4).

33. **SSE needs both server-side and client-side resilience** — `maxDuration = 800` (corrected from 900) is the Vercel Pro/Enterprise GA ceiling under Fluid Compute; the previous value of 900 exceeded the GA limit (T6).

34. **`putObject` needs a size guard** — `MAX_PUT_OBJECT_BYTES = 500 MB` + `PayloadTooLargeError`. R2's hard limit is 5 GB, but function memory is the real constraint (T7).

35. **`pnpm-workspace.yaml` requires `packages:` field** — pnpm 9+ enforces this even for single-package repos. Fresh clones fail with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION` (T0).

### Remediation Sprint 3 (Revenue Integrity + Auth + Security + Design)

36. **Sign-up was completely broken** — `AuthForm` called `signIn('credentials')` for BOTH sign-in and sign-up modes. The Credentials provider's `authorize()` only checks existing users — no user-creation logic existed. Fixed via `signUpAction` in `src/features/auth/actions.ts` (C1).

37. **Steps 2 & 3 never debited credits (60% revenue leak)** — a 60% revenue leak. `FULL_PIPELINE_COST = 131` credits assumes all 6 steps debit, but only 4 did (5+15+3+30=53). Now all 6 steps call `debitCredits()` with per-entity idempotency keys (C6).

38. **`FFMPEG_PATH` violated the "never `process.env.*`" rule** — `assemble-video.ts:20` read `process.env.FFMPEG_PATH` directly. Now goes through the Zod env schema (`env.FFMPEG_PATH`) (H1).

39. **Brand color system fully replaced** — `sed` sweep across 45 files replaced `amber-300/400/500/600` → `primary`, `bg-zinc-950` → `bg-background`, `bg-zinc-900` → `bg-card`, `bg-black` → `bg-background`. `brand-tokens.test.ts` now ENFORCES 0 violations (H2 + T11).

40. **Host Header Injection risk** — `trustHost: true` makes Auth.js trust `X-Forwarded-Host`. Without edge validation, an attacker behind a misconfigured reverse proxy can inject `evil.com` to steal magic-link tokens. `proxy.ts` now validates the Host header against a whitelist (H6).

41. **Stripe webhook idempotency was a TOCTOU race** — the old SELECT-then-INSERT pattern on `metadata` (no UNIQUE index) allowed concurrent webhooks to both pass the check. Now uses INSERT-first `ON CONFLICT (idempotency_key) DO NOTHING` (H7).

42. **Download button stale-tab 403** — `SignedDownloadWrapper` signed the R2 URL at SSR time, baking the 1h-expiry URL into the RSC payload. Users who left tabs open >1h got 403. Now: `ProjectDownloadButton` fetches `/api/projects/[id]/download` at click time → gets a fresh URL (H4).

43. **Style chip enum mismatch (H3)** — clicking "Medieval" or "Japanese animation" set `style='medieval'` / `'japanese-animation'` which were NOT in the backend enum → Zod rejected the submission after the user typed a 100+ char story. Fixed by adding both values to `visualStyleEnum` + Zod + `STYLE_PROMPTS` (migration `0004`).

44. **Health endpoint was bare** — returned `{ status: 'ok' }` unconditionally. Now checks DB (`SELECT 1`) + FFmpeg (`fs.accessSync`), returns 503 when unhealthy (H9).

45. **Row lock untested** — `.for('update')` now test-verified via source-reading + concurrency test (H10).

### Audit v1 (T1–T12)

46. **Billing upgrade buttons POST to non-existent `/api/stripe/checkout` route** — fixed via `billingCheckoutAction` Server Action in `billing/actions.ts` (T1).

47. **All protected routes return `ERR_CONNECTION_REFUSED`** — proxy redirect used `nextUrl.origin` which resolves to `http://` behind TLS-terminating reverse proxy. Fixed: proxy uses `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)` (T2).

48. **Orphan project rows on insufficient credits** — `createProjectAction` inserted the project before debiting credits; InsufficientCreditsError left an orphan row. Fixed: INSERT + debit now wrapped in `db.transaction()` via `debitCreditsTx` (T3).

49. **Stripe webhook idempotency INSERT-before-handler lost updates** — idempotency INSERT happened BEFORE the event handler; retries hit `onConflictDoNothing` and returned `{ duplicate: true }` without re-processing. Fixed: idempotency INSERT now happens AFTER side effects succeed + pre-check SELECT (T4).

50. **SSE rate limit never released on disconnect** — `sseRateLimit.fixedWindow(1, '1 m')` never released the counter on disconnect. Fixed: SSE now uses `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern (SET NX EX 30 + DEL on abort) (T5).

51. **Download route generic 500 for all R2 failures** — Single catch block didn't distinguish error types. Fixed: download route now classifies errors — S3/NoSuchKey/NoSuchBucket → 502, Timeout/Networking/Connection → 504, other → 500 (T6).

52. **`inngest.send()` failure orphaned projects** — `inngest.send()` threw but the project row was already committed. Fixed: `inngest.send()` is now wrapped in try/catch → `setProjectFailed()` (T7).

53. **`appendVideo` set `status='completed'` before MP4 existed** — Fixed: `status='rendering'` at insert, `updateVideo` sets `'completed'` (T8).

54. **`FAIL_OPEN` read at module load, not testable per-call** — `getFailOpen()` now reads inside the function body (was module-load const) (T9).

55. **Dead `buildFfmpegCommand` export** — deleted (T10).

56. **Brand color system bypassed 122+ times across 28 files** — `sed` sweep across 45 files → `primary`/`background`/`card` tokens; `brand-tokens.test.ts` enforces 0 violations (T11).

57. **`useProjectProgress` double-close risk + `Date.now()` temp file collisions + hardcoded `metadataBase` placeholder** — Fixed: `eventSource=null` guard, `crypto.randomUUID()`, `env.NEXT_PUBLIC_APP_URL` (T12).

### Post-Audit-v1 Validation (2026-06-29)

58. **`console.warn` is insufficient for env misconfigurations in production** — the AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch warning only emits `console.warn`. The live site exhibited the failure (redirect to `localhost:3000`). The T2 code fix WAS deployed (proven by `/api/health` returning the H9 check), but the env var was wrong. Lesson: production env misconfigurations should fail fast (throw at module load) OR be surfaced via `/api/health`. **RESOLVED in Sprint 3 T1+T2: env module now THROWS in production runtime; /api/health surfaces config errors.**

59. **Legal pages must not promise features the code doesn't implement** — the Privacy Policy publicly states GDPR rights (Erasure + Portability) that don't exist. **RESOLVED in Sprint 3 T3+T4: both endpoints now exist.**

60. **`<a href>` vs `<Link>` drift is easy to miss** — navbar, dashboard, and hero all used raw `<a href>` for internal routes. **RESOLVED in Sprint 3 T5: 9 files converted to `<Link>`.**

---

## 13. Pitfalls to Avoid

### TypeScript

- **Never use `any`** — use `unknown`. ESLint enforces `@typescript-eslint/no-explicit-any: error`.
- **Use `interface` for object shapes, `type` for unions/intersections.**
- **Always `import type` for type-only imports** — `verbatimModuleSyntax` is enabled.
- **`noUncheckedIndexedAccess` means `arr[0]` returns `T | undefined`** — always null-check.

### Next.js 16

- **`next lint` is deprecated** — use `eslint .` directly.
- **`middleware.ts` renamed to `proxy.ts`** — file convention changed in Next.js 16.
- **Async `params` / `searchParams` / `cookies()`** — all three are `Promise<T>` in Next.js 16. Always `await` them.
- **`force-static` on app routes is forbidden** — only the marketing page can be static.
- **Layouts must NOT fetch data** — use Suspense + async Server Components instead.

### React 19

- **Named function exports only** — `export function ComponentName()`, never default exports for components.
- **`'use client'` only when needed** — `useState`, `useEffect`, event handlers, browser APIs.
- **`suppressHydrationWarning` on `<html>` and `<body>`** — Grammarly extension compatibility.
- **Handle all UI states** — loading, error, empty, success.

### Tailwind CSS v4

- **No `tailwind.config.ts`** — all tokens in `@theme` block in `globals.css`.
- **`@source` directives required** — `@source '../components/**/*.{ts,tsx}'` and `@source '../lib/**/*.{ts,tsx}'`.
- **`@utility` replaces `@layer components`** — Tailwind v4 idiom.
- **Kebab-case keyframes only** — not camelCase.

### Database

- **Never use `db push` in production** — always `drizzle-kit generate` + `migrate`.
- **Migrations need `DATABASE_URL_UNPOOLED`** — pooled connections + DDL is unreliable.
- **All FKs from `users` are `onDelete: 'cascade'`** — GDPR deletion relies on this.

### Storage (R2)

- **Never make buckets public** — use signed URLs (1-hour expiry).
- **Never import `@/lib/storage/r2` in client components** — env validation crashes in browser.
- **`putObject` has a 500MB cap** — use multipart upload for larger files.

### Security

- **Never read `process.env.*` directly** — always import `env` from `@/lib/env`.
- **Never wrap `verifySession()` in try/catch** — `NEXT_REDIRECT` must propagate.
- **Stripe webhook: use `await req.text()` (not `.json()`)** — signature verification needs raw body.

---

## 14. Best Practices

### Code Organization

- **Co-locate tests in `src/tests/`** — not alongside components.
- **Feature-level `queries.ts` for all DB access** — components never call `db`.
- **Domain isolation** — pure business logic in `src/features/*/domain/` (no Next.js, no DB runtime).
- **Static data in `src/lib/data/`** — typed constants, not runtime file reads.

### Component Design

- **Server Components by default** — add `'use client'` only when necessary.
- **`cn()` utility for conditional classes** — `clsx` + `tailwind-merge`.
- **`<Link>` for all internal navigation** — never `<a href>`.
- **Brand tokens only** — `bg-background`, `text-primary`, `border-primary/20`, never `bg-zinc-950` or `text-amber-400`.

### Testing

- **TDD: RED → GREEN → REFACTOR** — write failing test first, minimum fix, then refactor.
- **Mock AI provider SDKs** — never make real API calls in tests.
- **Mock `@/lib/db` in tests that transitively import Drizzle** — jsdom can't reach Postgres.
- **Mock `next-auth`, `next/navigation`** — jsdom can't load `next/server`.
- **`vi.hoisted()` for shared mock state** — when a mock factory needs to reference a `vi.fn()`.
- **Strip comments before regex in source-reading tests** — avoid false positives.

### Performance

- **CSS-only animations** — no Framer Motion, no GSAP (Lighthouse ≥95).
- **`next/font` for all fonts** — self-hosted, no CDN links.
- **`next/image` for all images** — AVIF + WebP formats, lazy loading.
- **`preload="metadata"` on videos** — don't download full video until played.
- **`loading="lazy"` on images below the fold.**

### Accessibility

- **WCAG AAA contrast** — zinc-300 on zinc-950 = 12.6:1.
- **44×44px touch targets** on mobile.
- **`focus-visible:outline-primary`** — not `outline-amber-400`.
- **`prefers-reduced-motion: reduce`** disables all animations.
- **`aria-hidden="true"` on decorative videos.**

---

## 15. Coding Patterns

### Server Action Pattern

```typescript
// src/features/billing/actions.ts
'use server';

import { z } from 'zod';
import { verifySession } from '@/features/auth/domain/verify-session';

const Schema = z.object({ planId: z.string() });

export async function checkoutAction(input: z.infer<typeof Schema>) {
  const session = await verifySession(); // Auth-first
  const parsed = Schema.safeParse(input); // Zod validation
  if (!parsed.success) throw new Error('Invalid input');

  // ... business logic
}
```

### Queries.ts Boundary Pattern

```typescript
// src/features/projects/queries.ts
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';

export async function getProject(projectId: string, userId: string) {
  const [row] = await db.select().from(projects)
    .where(eq(projects.id, projectId)).limit(1);

  // Owner check — returns null if not owner (treated as 404 by caller)
  if (row && row.userId !== userId) return null;

  return row;
}
```

### API Route Pattern (auth() not verifySession)

```typescript
// src/app/api/projects/[id]/download/route.ts
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params; // Next.js 16 async params
  // ... business logic
}
```

### ScrollReveal Stagger Pattern

```typescript
{ITEMS.map((item, idx) => (
  <ScrollReveal key={item.id} delay={Math.min(idx * 80, 400)}>
    {/* card content */}
  </ScrollReveal>
))}
```

### SSE Route Pattern

```typescript
// src/app/api/projects/[id]/progress/route.ts
export const dynamic = 'force-dynamic';
export const maxDuration = 800; // Vercel Pro/Enterprise GA ceiling

export async function GET(req: NextRequest, { params }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Poll DB every 2s, enqueue `data: JSON\n\n` messages
      // Close on terminal status (completed/failed)
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
```

### GDPR Endpoint Pattern (Sprint 3 T3/T4)

```typescript
// src/app/api/user/export/route.ts — T3
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const session = await auth(); // NOT verifySession — API pattern
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exportData = await getUserExportData(session.user.id); // queries.ts boundary
  if (!exportData) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json(exportData, { status: 200 });
}
```

### CookieBanner Pattern (Sprint 3 T8)

```typescript
// useSyncExternalStore — SSR-safe localStorage read
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getServerSnapshot = () => false; // No banner during SSR
const getClientSnapshot = () => {
  try { return localStorage.getItem(KEY) !== 'acknowledged'; }
  catch { return true; }
};

export function CookieBanner() {
  const shouldShow = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  if (!shouldShow) return null;
  // ... render banner
}
```

### Custom `@utility` Class Pattern

```css
/* globals.css — Tailwind v4 @utility */
@utility glass-input {
  position: relative;
  border-radius: var(--radius-2xl);
  background-color: rgb(9 9 11 / 0.6);
  backdrop-filter: blur(16px);
  /* ... */

  &:hover { border-color: rgb(255 255 255 / 0.12); }
  &:focus-within {
    border-color: rgb(251 191 36 / 0.3);
    box-shadow: var(--shadow-hero-input), 0 0 30px rgb(251 191 36 / 0.1);
  }
}
```

---

## 16. Coding Anti-Patterns

- **Do not add `tailwind.config.ts`** — all tokens in `@theme` block
- **Do not use `next/font/google` for Outfit** — can't serve weight 820
- **Do not use Framer Motion or GSAP** — all animation is CSS-only
- **Do not use camelCase keyframes** — kebab-case only
- **Do not read `process.env.*` directly** — use the Zod-validated `env` module
- **Do not wrap `verifySession()` in try/catch** — `NEXT_REDIRECT` must propagate
- **Do not put DB access in components** — use the `queries.ts` boundary
- **Do not put DB access in proxy/middleware** — Edge runtime, no DB
- **Do not make R2 buckets public** — use signed URLs
- **Do not skip content moderation** — every story input must be moderated
- **Do not use `force-static` on app routes** — only marketing page can be static
- **Do not use `any`** — ESLint will error. Use `unknown` or proper types
- **Do not add CDN links** — all assets are self-hosted
- **Do not use default exports for components** — use named exports
- **Do not skip the verification chain** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Do not use `db push` in production** — always `drizzle-kit generate` + `migrate`
- **Do not use `<a href>` for internal routes** — use `<Link>` from `next/link`
- **Do not import `@/lib/storage/r2` in client components** — env validation crashes in browser
- **Do not use `amber-400`** — use `text-primary` (the custom `#febf00` token)
- **Do not use `bg-zinc-950`** — use `bg-background` (the custom `#020202` token)
- **Do not collect R2 keys AFTER DB CASCADE** — CASCADE wipes the projects table; collect keys BEFORE deletion
- **Do not use `useState` + `useEffect` for localStorage** — use `useSyncExternalStore` (avoids `react-hooks/set-state-in-effect` lint error)

---

## 17. Responsive Breakpoint Reference

| Token | Min Width | Target |
|---|---|---|
| (default) | 0 | Mobile portrait 375px |
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / laptop |
| `xl` | 1280px | Desktop (matches `max-w-7xl`) |
| `2xl` | 1536px | Large desktop |

### Key Responsive Patterns

```typescript
// Hero H1 — fluid sizing
className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem]"

// Section heading — fluid clamp
@utility section-heading {
  font-size: clamp(2rem, 5vw, 3rem);
}

// Grid — 1 col mobile → 2 col tablet → 4 col desktop
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"

// Hide on mobile, show on desktop
className="hidden sm:flex"

// Max width container
className="mx-auto max-w-7xl"
```

---

## 18. Z-Index Layer Map

| Z-Index | Element | Location |
|---|---|---|
| `z-50` | Navbar (fixed) | `src/components/sections/navbar.tsx` |
| `z-50` | Skip-to-content link (on focus) | `src/app/layout.tsx` |
| `z-40` | CookieBanner (fixed bottom) | `src/components/app/cookie-banner.tsx` |
| `z-10` | Hero content (above video bg) | `src/components/sections/hero.tsx` |
| `z-0` | Hero background video | `src/components/sections/hero.tsx` |
| `-z-10` | Examples hover glow | `src/components/sections/examples.tsx` |

### Radix Portal Z-Index

Radix components (Sheet, DropdownMenu, Accordion) use their own stacking context. The `Sheet` (mobile nav) renders at `z-50` by default via Radix's `Dialog` primitive.

---

## 19. Color Reference (Complete)

### Brand Tokens (from `@theme` in `globals.css`)

| Token | Hex | Usage |
|---|---|---|
| `--color-background` | `#020202` | Page background (near-black, warm-neutral — NOT pure #000) |
| `--color-foreground` | `#f8f8f8` | Default foreground text |
| `--color-card` | `#060607` | Card surfaces |
| `--color-card-foreground` | `#f8f8f8` | Text on cards |
| `--color-popover` | `#0b0b0d` | Dropdown menus, language switcher |
| `--color-popover-foreground` | `#f8f8f8` | Text in popovers |
| `--color-primary` | `#febf00` | CTAs, active states, focus rings (NOT Tailwind amber-400 #fbbf24) |
| `--color-primary-foreground` | `#020202` | Text on primary fills |
| `--color-secondary` | `#111114` | Secondary surfaces |
| `--color-secondary-foreground` | `#f8f8f8` | Text on secondary |
| `--color-muted` | `#1a1a1d` | Muted backgrounds |
| `--color-muted-foreground` | `#8e8e95` | Secondary text (zinc-400 equivalent) |
| `--color-accent` | `#febf00` | Same as primary |
| `--color-accent-foreground` | `#020202` | Text on accent |
| `--color-destructive` | `#ff2d39` | Error states |
| `--color-destructive-foreground` | `#f8f8f8` | Text on destructive |
| `--color-border` | `#1a1a1d` | Default border color |
| `--color-input` | `#0b0b0d` | Input backgrounds |
| `--color-ring` | `#febf0080` | Focus ring (50% opacity primary) |

### Chart Palette (reserved for future dashboard)

| Token | Hex |
|---|---|
| `--color-chart-1` | `#febf00` |
| `--color-chart-2` | `#00aa6f` |
| `--color-chart-3` | `#8d92f9` |
| `--color-chart-4` | `#f14d4c` |
| `--color-chart-5` | `#7bc27e` |

### Opacity Variants (common usage)

| Pattern | Hex | Usage |
|---|---|---|
| `bg-white/[0.02]` | `rgba(255,255,255,0.02)` | Card surfaces, empty states |
| `bg-white/[0.04]` | `rgba(255,255,255,0.04)` | Hover state on cards |
| `bg-white/[0.06]` | `rgba(255,255,255,0.06)` | Borders on cards |
| `bg-white/[0.1]` | `rgba(255,255,255,0.1)` | Active ratio toggle bg |
| `bg-primary/10` | `rgba(254,191,0,0.1)` | Icon container bg |
| `bg-primary/30` | `rgba(254,191,0,0.3)` | Active chip border |
| `border-primary/20` | `rgba(254,191,0,0.2)` | Icon container border |
| `border-primary/30` | `rgba(254,191,0,0.3)` | Active chip border |
| `text-white/50` | `rgba(255,255,255,0.5)` | Inactive nav links |
| `text-white/60` | `rgba(255,255,255,0.6)` | Default nav links |

### Zinc Utility Colors (used for text, NOT backgrounds)

| Class | Hex | Usage |
|---|---|---|
| `text-zinc-300` | `#d4d4d8` | Body text (12.6:1 contrast on background) |
| `text-zinc-400` | `#a1a1aa` | Secondary text |
| `text-zinc-500` | `#71717a` | Tertiary text, timestamps |
| `text-zinc-600` | `#52525b` | Muted text, ratio toggle inactive |

⚠️ **`bg-zinc-950`, `bg-zinc-900`, `bg-black` are FORBIDDEN** — use `bg-background` or `bg-card` instead. The `brand-tokens.test.ts` CI guard enforces this.

### The Singular Purple Exception

```css
/* Examples card hover glow — the ONLY purple on the site */
.bg-gradient-to-r.from-yellow-500.to-purple-500
```

This is intentional — it signals "premium example content" and breaks the amber monopoly in exactly one place.

---

## 20. TypeScript Interface Reference

All interfaces live in `src/types/index.ts`. Here is the complete reference:

```typescript
import type { LucideIcon } from 'lucide-react';

/** Navigation link in the Navbar (desktop + mobile Sheet). */
interface NavLink {
  label: string;
  href: string;
}

/** Story example chip in the Hero — clicking populates the textarea. */
interface StoryExample {
  label: string;
  /** The multi-paragraph seed text injected into the textarea on click. */
  seed: string;
}

/** Aspect ratio toggle button in the Hero (9:16 portrait or 16:9 landscape). */
interface AspectRatio {
  label: '9:16' | '16:9';
  value: 'portrait' | 'landscape';
}

/** Portrait example card in the Examples carousel. */
interface ExampleCard {
  id: string;
  title: string;
  /** Style tag shown below the title (e.g., "Anime · Romance"). */
  styleTag: string;
  /** Path to the 9:16 WebP thumbnail in /public/examples/. */
  thumbnail: string;
  href: string;
}

/** One of the 4 alternating media/text rows in the Workflow section. */
interface WorkflowStep {
  number: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  /** Path to the looping MP4 demo in /public/workflow/. */
  videoSrc: string;
  /** Path to the WebP poster shown before the video loads. */
  videoPoster: string;
  /** Desktop layout: which side the media sits on. */
  mediaPosition: 'left' | 'right';
}

/** One of the 8 items in the Features 4×2 hairline grid. */
interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** One of the 6 testimonial cards in the Testimonials 3×2 grid. */
interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  /** 2-letter initials rendered in the amber gradient avatar (e.g., "SK"). */
  initials: string;
}

/** One of the 4 use case cards in the UseCases 2×2 grid. */
interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

/** One of the 6 items in the FAQ Radix Accordion. */
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

/** A single link in the Footer. */
interface FooterLink {
  label: string;
  href: string;
}

/** A titled column of links in the Footer. */
interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/** A chip in the Hero style tags marquee. */
interface StyleChip {
  label: string;
  /** Optional smaller sublabel (only "Cyberpunk" uses this: "Futuristic neon"). */
  sublabel?: string;
}
```

### Component Props Interfaces (co-located)

```typescript
// CtaAmber
interface CtaAmberProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  onClick?: () => void;
}

// CtaGradient
interface CtaGradientProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

// CtaGhost
interface CtaGhostProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

// Eyebrow
interface EyebrowProps {
  children: React.ReactNode;
  className?: string;
}

// SectionHeading
interface SectionHeadingProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
  className?: string;
}

// StyleChip (component)
interface StyleChipProps {
  label: string;
  sublabel?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

// ScrollReveal
interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li' | 'span';
}

// EmptyState
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

// useReveal
interface UseRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

// useProjectProgress
interface ProjectProgressState {
  status: string | null;
  progressPercent: number | null;
  progressDetail: string | null;
  errorMessage: string | null;
  connectionState: 'connecting' | 'open' | 'closed' | 'error' | 'reconnecting';
}
```

### Pipeline Domain Interfaces

```typescript
// src/features/pipeline/domain/assemble-video.ts
export interface AssembleVideoInput {
  sceneImageUrls: string[];
  sceneDurations: number[];
  audioUrl: string;
  subtitlesSrt: string;
  aspectRatio: 'portrait' | 'landscape';
  resolution: '720p' | '1080p' | '4k';
}

export interface AssembleVideoOutput {
  videoBuffer: Buffer;
  duration: number;
}

// src/features/pipeline/domain/moderate-image.ts
export interface ModerateImageInput {
  imageUrl: string;
  rawOutput: unknown;
}

export interface ImageModerationResult {
  flagged: boolean;
  categories: string[];
  /** true when moderation could not run because the output shape was unknown. */
  moderationSkipped: boolean;
}
```

### Billing Interfaces

```typescript
// src/features/billing/queries.ts
export class InsufficientCreditsError extends Error {
  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(`Insufficient credits: need ${required}, have ${available}.`);
    this.name = 'InsufficientCreditsError';
  }
}

export interface DebitResult {
  /** true if this call was a no-op (duplicate idempotencyKey detected) */
  idempotent: boolean;
  /** The usage_event row id, or null if the debit was skipped */
  eventId: string | null;
  /** The user's credit balance after the debit (null if skipped) */
  creditsRemaining: number | null;
}

export type DebitOperation =
  | 'analysis'
  | 'character_generation'
  | 'scene_generation'
  | 'voiceover'
  | 'subtitle_alignment'
  | 'video_assembly'
  | 'moderation_check';

// src/features/billing/domain/tier-limits.ts
export type Plan = 'free' | 'creator' | 'pro' | 'studio';

export interface TierLimit {
  plan: Plan;
  monthlyCredits: number;
  maxResolution: '720p' | '1080p' | '4k';
  maxVideoDurationSec: number;
  watermark: boolean;
  priorityQueue: boolean;
}
```

### Auth Interfaces

```typescript
// src/features/auth/actions.ts
export type SignUpResult =
  | { success: true; userId: string }
  | {
      success: false;
      error: string;
      code: 'VALIDATION' | 'EMAIL_EXISTS' | 'INTERNAL' | 'RATE_LIMITED';
    };

// src/features/auth/domain/verify-session.ts
interface VerifySessionOptions {
  /** Where to send the user after sign-in (defaults to current route) */
  redirectTo?: string;
}

// src/features/projects/actions.ts
export type CreateProjectResult =
  | { success: true; projectId: string }
  | {
      success: false;
      error: string;
      code:
        | 'UNAUTHORIZED'
        | 'VALIDATION'
        | 'FLAGGED'
        | 'INSUFFICIENT_CREDITS'
        | 'INTERNAL'
        | 'RATE_LIMITED';
    };
```

### SSE / Progress Interfaces

```typescript
// src/app/api/projects/[id]/progress/route.ts
interface ProgressEvent {
  status: string;
  progressPercent: number;
  progressDetail: string | null;
  errorMessage: string | null;
}

// src/lib/hooks/use-project-progress.ts
export interface ProjectProgressState {
  status: string | null;
  progressPercent: number | null;
  progressDetail: string | null;
  errorMessage: string | null;
  connectionState: 'connecting' | 'open' | 'closed' | 'error' | 'reconnecting';
}
```

### Environment Interface (30 vars)

```typescript
// src/lib/env/index.ts (inferred from Zod schema)
type EnvData = {
  // Database (Neon)
  DATABASE_URL: string;              // postgresql://... (pooled)
  DATABASE_URL_UNPOOLED: string;     // postgresql://... (direct, for migrations)
  // Auth (Auth.js v5)
  AUTH_SECRET: string;               // ≥32 chars, not known-weak
  AUTH_URL: string;                  // https://your-app.com
  GOOGLE_CLIENT_ID?: string;         // both required to enable Google OAuth
  GOOGLE_CLIENT_SECRET?: string;
  // AI Providers
  OPENAI_API_KEY: string;            // starts with 'sk-'
  REPLICATE_API_TOKEN: string;       // starts with 'r8_'
  ELEVENLABS_API_KEY: string;
  REPLICATE_SDXL_MODEL: string;      // owner/model:sha format (has default)
  REPLICATE_SDXL_IPADAPTER_MODEL: string; // owner/model:sha (placeholder default — set to real IP-Adapter!)
  // Stripe
  STRIPE_SECRET_KEY: string;         // starts with 'sk_'
  STRIPE_WEBHOOK_SECRET: string;     // starts with 'whsec_'
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string; // starts with 'pk_'
  // Cloudflare R2
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_UPLOADS: string;
  R2_BUCKET_GENERATED: string;
  R2_BUCKET_VIDEOS: string;
  // Inngest
  INNGEST_EVENT_KEY: string;
  INNGEST_SIGNING_KEY: string;
  // Email (Resend)
  RESEND_API_KEY: string;            // starts with 're_'
  // Rate Limiting (Upstash)
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  // Monitoring (Sentry)
  SENTRY_DSN: string;
  // Image Moderation (optional, default depends on NODE_ENV)
  IMAGE_MODERATION_FAIL_OPEN: 'true' | 'false'; // default 'false' in production, 'true' in dev/test
  // FFmpeg (optional, default '/usr/bin/ffmpeg')
  FFMPEG_PATH: string;
  // App
  NEXT_PUBLIC_APP_URL: string;       // https://your-app.com
  NODE_ENV: 'development' | 'production' | 'test';
};
// Total: 30 env vars (27 required + 3 optional)
```

### Database Schema Types (Drizzle-generated)

The 11 tables + 8 enums are defined in `src/lib/db/schema/`:

```typescript
// Enums (8 total)
project_status: 'draft' | 'pending' | 'analyzing' | 'generating_characters' |
  'generating_scenes' | 'synthesizing_voice' | 'aligning_subtitles' |
  'assembling_video' | 'completed' | 'failed'

visual_style: 'ghibli' | 'medieval' | 'oil-painting' | 'anime' |
  'japanese-animation' | 'realistic' | 'cyberpunk' | 'watercolor' | 'comic'

aspect_ratio: 'portrait' | 'landscape'
video_status: 'pending' | 'rendering' | 'completed' | 'failed'
video_resolution: '720p' | '1080p' | '4k'
plan: 'free' | 'creator' | 'pro' | 'studio'
subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | ...
usage_event_type: 'analysis' | 'character_generation' | 'scene_generation' |
  'voiceover' | 'subtitle_alignment' | 'video_assembly' |
  'moderation_check' | 'stripe_webhook'
```

---

## Appendix A: ADRs (Architecture Decision Records)

The engineering blueprint (`PRODUCTION_READINESS_PLAN.md`) defines 11 ADRs. The 7 most-referenced:

| ADR | Decision | Rationale |
|---|---|---|
| **ADR-001** | 5-Layer Architecture with Golden Rule | Isolates business logic from Next.js runtime + DB; enables testing domain functions without mocking Next.js |
| **ADR-002** | Hybrid Rendering (Static Marketing + Dynamic App) | Static prerendering gives marketing ≥95 Lighthouse; dynamic app routes need auth + DB |
| **ADR-003** | Stripe "Basil" API Period-End Extraction | Pure helper `extractSubscriptionPeriodEnd()` handles the 2025-03-31 shape change (`items.data[0].current_period_end`) |
| **ADR-004** | Build-Context Env Fallback for Zod Schema | `parseEnv()` returns placeholders when `NEXT_PHASE=phase-production-build` — allows CI build without secrets |
| **ADR-005** | Click-Time R2 URL Signing (H4 Fix) | Replace `SignedDownloadWrapper` with API route; client fetches fresh URL on click |
| **ADR-006** | System FFmpeg Binary (Not npm Installer) | `@ffmpeg-installer/ffmpeg` uses dynamic `require()` incompatible with Turbopack |
| **ADR-011** | Image Moderation on Every AI-Generated Image | `moderateImage()` parses Replicate safety output; env-configurable fail-open policy |

---

## Appendix B: The 6-Step AI Pipeline (Credit Costs)

| Step | Service | Domain File | Credits | Idempotency Key |
|---|---|---|---|---|
| 0 — Moderate story | OpenAI Moderation | `moderate-content.ts` | 0 (gate) | — |
| 1 — Analyze story | OpenAI GPT-4o (JSON mode) | `analyze-story.ts` | 5 | `${projectId}:analysis` |
| 2 — Generate characters | Replicate SDXL → R2 | `generate-character.ts` + `moderate-image.ts` | 10 each | `${projectId}:character:${name}` |
| 3 — Generate scenes | Replicate SDXL + IP-Adapter → R2 | `generate-scene.ts` + `moderate-image.ts` | 8 each | `${projectId}:scene:${order}` |
| 4 — Voiceover | ElevenLabs TTS → R2 | `synthesize-voice.ts` | 15 | `${projectId}:voiceover` |
| 5 — Subtitles | Whisper ASR → SRT → R2 | `align-subtitles.ts` | 3 | `${projectId}:subtitle_alignment` |
| 6 — Assemble video | FFmpeg → R2 | `assemble-video.ts` | 30 | `${projectId}:video_assembly` |

**Total cost (3 chars + 6 scenes): 131 credits** (= `FULL_PIPELINE_COST`)

---

## Appendix C: Post-Audit-v1 Live-Site Validation (2026-06-29)

This appendix documents the live-site behavioral testing methodology used to validate the audit-v1 remediation against the actual deployment at `https://storyintovideo.jesspete.shop/`. It serves as a template for future post-deploy validations.

### Methodology: `agent-browser` E2E on Live Site

Use the `agent_browser` CLI to drive a headless Chromium against the live URL. This catches operational misconfigurations that unit tests (which run against the source code) cannot detect.

```bash
# 1. Health check (DB + FFmpeg)
curl -s https://storyintovideo.jesspete.shop/api/health | jq .status
# Expected: "healthy"

# 2. Verify auth redirect target host matches the request host
curl -sI https://storyintovideo.jesspete.shop/dashboard
# Expected: HTTP/2 307 Location: https://storyintovideo.jesspete.shop/sign-in?callbackUrl=...
# Forbidden: Location: http://localhost:3000/sign-in

# 3. Test known routes exist
for route in / /sign-in /sign-up /privacy /terms /pricing /blog /contact; do
  curl -s -o /dev/null -w "%{http_code}" "https://storyintovideo.jesspete.shop${route}"
done
# Expected: all 200

# 4. Test unknown route returns 404
curl -s -o /dev/null -w "%{http_code}" https://storyintovideo.jesspete.shop/nonexistent
# Expected: 404
```

### Validated Findings (2026-06-29)

| Test | Expected | Actual | Status |
|---|---|---|---|
| `GET /` marketing page | 10 sections render | All 10 sections render, H1 has 3-line `<br>` stack with `style="font-weight:820"` | ✅ |
| `GET /api/health` | 200 JSON `{status:'healthy', services:{database, ffmpeg}}` (H9) | `{"status":"healthy",...}` | ✅ H9 fix deployed |
| `GET /dashboard` (unauth) | 307 redirect to `/sign-in` on canonical HTTPS host | **307 redirect to `http://localhost:3000/sign-in`** → `ERR_CONNECTION_REFUSED` | 🔴 Operational misconfig |
| `GET /pricing`, `/blog`, `/contact` | 200 with proper metadata | Returns 200 with correct metadata | ✅ T6 fix deployed |
| `GET /nonexistent` | 404 with custom `not-found.tsx` | Returns 404 with custom page | ✅ T7 fix deployed |

### Root-Cause Diagnosis: The `/dashboard` Failure

The proxy at `src/proxy.ts:71` correctly uses `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)` — the issue is that `NEXT_PUBLIC_APP_URL` was set to `http://localhost:3000` instead of `https://storyintovideo.jesspete.shop`. The code was right; the env vars were wrong. This is why T1 throws at boot in production — `console.warn` lets this bug survive into production.

### Post-Deploy Smoke Test (add to CI/CD runbook)

After every deploy, run this 30-second smoke test:

```bash
#!/bin/bash
set -e

HOST="https://storyintovideo.jesspete.shop"
REDIRECT=$(curl -sI "$HOST/dashboard" | grep -i location | tr -d '\r')

# 1. Verify auth redirect stays on same host
if echo "$REDIRECT" | grep -q "localhost"; then
  echo "FAIL: Redirects to localhost — env NEXT_PUBLIC_APP_URL is wrong"
  exit 1
fi

# 2. Verify /api/health (H9)
curl -s "$HOST/api/health" | jq '.status == "healthy" and .config.healthy' | grep true

# 3. Verify known routes return 200
for path in / /pricing /blog /contact /privacy /terms; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$HOST$path")
  [[ "$code" == "200" ]] || { echo "FAIL: $path returned $code"; exit 1; }
done

echo "Smoke test passed"
```

---

## Appendix: The Meticulous Approach (Six-Phase Workflow)

All implementation tasks must follow this workflow:

1. **ANALYZE** — Deep requirement mining. Never assume. Check existing patterns before writing new code.
2. **PLAN** — Structured roadmap. Present plan for confirmation before coding.
3. **VALIDATE** — Get explicit approval before implementation.
4. **IMPLEMENT** — Modular, tested components. Test each before integration. TDD: RED → GREEN → REFACTOR.
5. **VERIFY** — Run full quality gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
6. **DELIVER** — Confirm all checks pass. Document deviations.

### Verification Commands Reference

```bash
pnpm lint              # ESLint flat config — 0 warnings, 0 errors
pnpm typecheck         # tsc --noEmit — strict mode, 0 errors
pnpm test              # Vitest — 479 unit tests, 53 files, jsdom
pnpm test:e2e          # Playwright — 48 E2E tests, 9 specs, Chromium
pnpm build             # next build — 22 routes, hybrid static + dynamic
pnpm format            # Prettier auto-fix
pnpm format:check      # Prettier verify (CI)
pnpm drizzle:generate  # Create migration SQL from schema diff
pnpm drizzle:migrate   # Apply migrations to Neon
pnpm drizzle:studio    # Open Drizzle Studio (schema browser)
pnpm db:seed           # Seed database with test data
pnpm db:reset          # Migrate + seed (fresh DB)
```

---

*This skill document is the definitive reference for the StoryIntoVideo codebase. When in doubt, read the source code — this document is a guide, not a substitute for understanding the actual implementation.*
