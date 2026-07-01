# StoryIntoVideo — Complete Skill Reference

> **Version:** 7.0.0 (Post-Audit-v1 Live-Site Validation — supersedes v1–v6)
> **Date:** 2026-06-29
> **Status:** Production-ready codebase. 396 unit tests + 48 E2E tests, all GREEN. Lint clean. Typecheck clean. Build succeeds.
> **Maintainer:** Frontend Architect & Avant-Garde UI Designer

This document is the **canonical skill file** for the StoryIntoVideo project. It distills every design decision, architectural pattern, gotcha, lesson learned, and validation checkpoint into a single reference that any coding agent can use to replicate, extend, or debug this codebase with fidelity.

**v7.0.0 adds (over v6.0.0):**
- Live-site behavioral validation methodology (Appendix: Live-Site Behavioral Testing)
- 5 new post-audit-v1 findings from `agent-browser` testing on `https://storyintovideo.jesspete.shop/`
- 5 new lessons learned (#56–60)
- 5 new troubleshooting rows
- Updated Recommendations + Outstanding Issues reflecting live-site state
- Clarified C-2 status: code fix IS deployed; live-site symptom is operational env-var misconfiguration

**Audit v1 Remediation (v6.0.0) closed 12 issues across 2 Critical + 3 High + 6 Medium + 3 Low:**
- 🔴 C-1: Billing upgrade buttons wired to `billingCheckoutAction` Server Action (was broken POST to non-existent `/api/stripe/checkout`)
- 🔴 C-2: Proxy redirect uses `env.NEXT_PUBLIC_APP_URL` (was `nextUrl.origin` → ERR_CONNECTION_REFUSED behind reverse proxy)
- 🟠 H-1: `createProjectAction` wraps INSERT + debit in `db.transaction()` via `debitCreditsTx` (no orphan project rows)
- 🟠 H-2: Stripe webhook idempotency INSERT moved to AFTER side effects (no permanently-lost subscription updates)
- 🟠 H-3: SSE rate limit replaced with `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern (releases on disconnect)
- 🟡 M-1: Download route classifies R2 errors (502/504/500)
- 🟡 M-2: `inngest.send()` wrapped in try/catch → `setProjectFailed()` (no pending-orphan on Inngest outage)
- 🟡 M-3: `appendVideo` uses `status: 'rendering'` at insert; `updateVideo` sets `'completed'` (no contradictory state)
- 🟡 M-4: `getFailOpen()` reads `env.IMAGE_MODERATION_FAIL_OPEN` per-call (was module-load const — not testable)
- 🟡 M-5: Dead `buildFfmpegCommand` export deleted (was second source of truth)
- 🟡 M-6: Brand color full replacement — `sed` sweep across 45 files: `amber-400` → `primary`, `bg-zinc-950` → `bg-background`; `brand-tokens.test.ts` enforces 0 violations
- 🟢 L-2/L-3/L-4: `useProjectProgress` double-close guard; `crypto.randomUUID()` temp files; `env.NEXT_PUBLIC_APP_URL` for `metadataBase`

**Canonical companion documents:**
- `Project_Requirements_Document.md` (v2.0, 2718 lines — marketing layer spec, field-verified from live DOM)
- `PRODUCTION_READINESS_PLAN.md` (engineering blueprint — 11 ADRs, 27 TDD task cards, risk register, pre-launch checklist)
- `Project_Architecture_Document.md` (v1.1 — master architecture reference, DEFINITIVE, PRODUCTION-LOCKED)
- `AUDIT_REPORT_v1.md` (code review findings — 2 Critical + 3 High + 6 Medium + 4 Low)
- `REMEDIATION_PLAN_v1.md` (12-task TDD remediation plan with RED/GREEN/REFACTOR steps)
- `CLAUDE.md` (comprehensive agent briefing — 55 lessons learned, 16 anti-patterns)
- `AGENTS.md` (compact agent instructions — 37 lessons learned)
- `README.md` (quick start + architecture + build state)

---

## Table of Contents

1. [Project Identity & Design Philosophy](#1-project-identity--design-philosophy)
2. [Tech Stack & Environment](#2-tech-stack--environment)
3. [Bootstrapping & Configuration](#3-bootstrapping--configuration)
4. [The Design System (Code-First)](#4-the-design-system-code-first)
5. [Component Architecture & Patterns](#5-component-architecture--patterns)
6. [Custom Hooks Deep Dive](#6-custom-hooks-deep-dive)
7. [Content Management: Static Data + Pipeline Queries](#7-content-management-static-data--pipeline-queries)
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
20. [The Complete TypeScript Interface Reference](#20-the-complete-typescript-interface-reference)

---

## 1. Project Identity & Design Philosophy

### What This Is

StoryIntoVideo is a **production SaaS** for an AI-powered story-into-video generator. It began as a pixel-accurate marketing clone of [storyintovideo.com](https://storyintovideo.com/) and has been extended into a full hybrid Next.js app with a 6-step AI pipeline (story analysis → character generation → scene generation → voiceover → subtitles → video assembly), Auth.js v5 authentication, Drizzle/PostgreSQL database, Stripe billing with credit metering, and Cloudflare R2 storage.

### The Design Thesis: "Luxury-Dark Cinematic"

The aesthetic is **not** generic SaaS. It is a deliberate cinematic experience — the visual language of a film studio's screening room, not a dashboard. Every design decision serves this thesis:

- **Near-black, not pure black.** Background is `#020202` (warm-neutral), NOT `#000000`. Pure black reads as cold/harsh; `#020202` reads as a dimmed screening room. This is the foundational token — get it wrong and the entire mood collapses.
- **Amber is rationed.** `#febf00` is the ONLY hue permitted to assert itself. It appears on CTAs, focus rings, active states, and a single hero glow. It does NOT appear in body text, backgrounds, or decorative elements. The singular exception: the Examples carousel hover gradient (`from-yellow-500 to-purple-500`) is the ONLY purple on the entire site.
- **CSS-only animation.** All 13 keyframes are `@keyframes` in `globals.css`. Zero JS animation libraries (no Framer Motion, no GSAP). This is critical for Lighthouse ≥95 and matches the live site's performance profile.
- **Hairline grids, not boxed cards.** The Features section uses a continuous shared surface with `border-neutral-800` hairline dividers — explicitly rejecting "predictable Bootstrap-style card grids."
- **Outfit weight 820.** The H1 hero headline uses Outfit at weight 820 via a self-hosted variable font. Google Fonts API only serves discrete weights (100, 200, ..., 900); 820 is an intermediate weight that gives the headline its "ultra-heavy cinematic title-card quality."

### The "Anti-Generic" Mandate

This project rejects:
- Inter/Roboto/system-font safety (we use Geist Sans + Geist Mono + Outfit 820)
- Purple-gradient-on-white clichés (amber is the only accent)
- Predictable card grids (hairline grids instead)
- Template hero sections (4-layer cinematic composition instead)
- The homogenized "AI slop" aesthetic

### The 5-Layer Architecture (Golden Rule)

```
Layer 0: src/proxy.ts             — Cookie check, redirect. NO DB. NO logic. Edge runtime.
Layer 1: src/app/                 — Route structure, metadata, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (auth, projects, pipeline, billing)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers. Side effects only.
```

**Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code. This isolation is what makes the pipeline domain functions unit-testable without a live database or Next.js server.

### The Meticulous Approach (Six-Phase Workflow)

All implementation tasks follow this workflow:

1. **ANALYZE** — Deep requirement mining. Never assume. Check existing patterns before writing new code.
2. **PLAN** — Structured roadmap. Present plan for confirmation before coding.
3. **VALIDATE** — Get explicit approval before implementation.
4. **IMPLEMENT** — Modular, tested components. Test each before integration. TDD: RED → GREEN → REFACTOR, one cycle per logical change.
5. **VERIFY** — Run full quality gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
6. **DELIVER** — Confirm all checks pass. Document deviations.

---

## 2. Tech Stack & Environment

### Locked Versions (from `package.json`)

| Layer | Technology | Version | Critical Note |
|---|---|---|---|
| Framework | Next.js (App Router, hybrid) | `^16.2.0` | `proxy.ts` replaces `middleware.ts` in Next.js 16 |
| UI | React (strict TypeScript) | `^19.2.3` | ⚠️ CVE-2025-55182 floor — never downgrade below 19.2.3 |
| Styling | Tailwind CSS (CSS-first `@theme`) | `^4.3.0` | No `tailwind.config.ts` — all tokens in `globals.css` |
| Components | shadcn/ui (Radix primitives, hand-written) | — | 4 hand-written components; CLI timed out |
| Fonts | Geist Sans + Geist Mono + Outfit 820 | self-hosted | Outfit via `next/font/local` (not `/google`) for weight 820 |
| Icons | Lucide React | `^0.460.0` | `strokeWidth={1.5}` on all feature/use-case icons |
| Auth | Auth.js v5 (NextAuth) + `@auth/drizzle-adapter` | `5.0.0-beta.31` | Deliberate pin; `trustHost: true` for reverse-proxy |
| Database | PostgreSQL (Neon) + Drizzle ORM | `drizzle-orm ^0.45.2`, `drizzle-kit ^0.31.10` | Pooled for app, unpooled for migrations |
| Job Queue | Inngest (multi-step AI pipeline) | `^4.11.0` | v4 `createFunction` signature: trigger in config object |
| AI — LLM | OpenAI GPT-4o + Whisper + Moderation | `openai ^6.45.0` | GPT-4o for analysis, Whisper-1 for ASR |
| AI — Image | Replicate SDXL + IP-Adapter | `replicate ^1.4.0` | Model IDs env-configurable with format validation |
| AI — TTS | ElevenLabs | `^1.59.0` | Returns `Readable`, not `ReadableStream` |
| Storage | Cloudflare R2 (S3-compatible) | `@aws-sdk/client-s3 ^3.1075.0` | 3 private buckets; signed URLs only |
| Billing | Stripe (Checkout + Portal + Webhooks) | `^22.3.0` | Credit-based metering, not metered billing |
| Validation | Zod | `^4.4.3` | v4 — `.url()` uses `new URL()`, accepts any scheme |
| Video | FFmpeg (system binary) | `FFMPEG_PATH` env var | No `@ffmpeg-installer/ffmpeg` (Turbopack-incompatible) |
| CI/CD | GitHub Actions | `.github/workflows/ci.yml` | lint + typecheck + test + build on every PR |
| Package Manager | pnpm | `>=10.26.0` | `allowBuilds` syntax floor (not `onlyBuiltDependencies`) |
| Rate Limiting | Upstash Ratelimit + Redis | `@upstash/ratelimit ^2.0.8` | 3 limiters: auth, pipeline, SSE-slot |
| Password Hashing | bcryptjs | `^3.0.3` | Cost factor 12 (matches docs, not seed's 10) |

### TypeScript Strict Mode (Critical Flags)

`tsconfig.json` enables maximum strictness. These flags are non-negotiable:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] }
  },
  "exclude": ["node_modules", "skills", "docs"]
}
```

**Critical flag explanations:**

- **`verbatimModuleSyntax: true`** — requires `import type` for type-only imports. `import { Foo }` where `Foo` is a type errors. Must use `import type { Foo }` or `import { type Foo }`.
- **`noUncheckedIndexedAccess: true`** — array/object access returns `T | undefined`. `arr[0]` is `T | undefined`, not `T`. Forces null checks.
- **`isolatedModules: true`** — each file must be independently transpilable. Affects re-exports: `export { Foo } from './foo'` works, but type re-exports need `export type { Foo }`.
- **`strict: true`** — enables `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`.

### Engine Requirements

```json
"engines": {
  "node": ">=20.0.0",
  "pnpm": ">=10.26.0"
}
```

### Package Manager

**pnpm** is the only supported package manager. `pnpm-lock.yaml` is the source of truth. `pnpm-workspace.yaml` MUST contain `packages: ['.']` (even for single-package repos) or pnpm 9+ will fail with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION`.

```bash
pnpm install          # Install deps (activates husky via `prepare` script)
pnpm dev              # Start dev server (Turbopack, port 3000)
pnpm lint             # ESLint flat config
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest (396 unit tests across 48 files)
pnpm test:e2e         # Playwright (48 E2E tests across 9 spec files, requires `pnpm exec playwright install`)
pnpm build            # Production build
pnpm drizzle-kit generate   # Create migration SQL from schema diff
pnpm drizzle-kit migrate    # Apply migrations (needs DATABASE_URL_UNPOOLED)
pnpm db:seed                # Run seed script (dev@storyintovideo.com / password123)
pnpm db:reset               # Migrate + seed in one command
```

---

## 3. Bootstrapping & Configuration

### From Zero (Recreating This Project)

This is **not** a Vite project. It uses Next.js 16 App Router. To bootstrap a similar project from scratch:

```bash
# 1. Create Next.js 16 app
pnpm create next-app@latest story-into-video \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm

# 2. Install runtime deps
pnpm add next-auth@5.0.0-beta.31 @auth/drizzle-adapter drizzle-orm postgres
pnpm add inngest openai replicate elevenlabs stripe
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
pnpm add fluent-ffmpeg
# System FFmpeg — install via apt/brew, set FFMPEG_PATH env var if non-standard
# sudo apt install ffmpeg  (Ubuntu)  or  brew install ffmpeg  (macOS)
pnpm add @radix-ui/react-accordion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-slot
pnpm add bcryptjs class-variance-authority clsx tailwind-merge geist lucide-react zod
pnpm add @upstash/ratelimit @upstash/redis

# 3. Install dev deps
pnpm add -D drizzle-kit tsx dotenv-cli
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
pnpm add -D @playwright/test
pnpm add -D husky lint-staged prettier prettier-plugin-tailwindcss
pnpm add -D @types/bcryptjs @types/fluent-ffmpeg @types/node @types/react @types/react-dom

# 4. Install Playwright browsers
pnpm exec playwright install chromium

# 5. Initialize husky
pnpm exec husky init
echo "pnpm lint-staged" > .husky/pre-commit
chmod +x .husky/pre-commit

# 6. Download Outfit variable font (for weight 820 access)
# Source: https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf
# Convert to woff2 via fonttools, place at public/fonts/Outfit-VariableFont.woff2

# 7. Create pnpm-workspace.yaml (CRITICAL — pnpm 9+ requires this even for single-package repos)
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - '.'

allowBuilds:
  esbuild: true
  sharp: true
  unrs-resolver: true
EOF
```

### `next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ['storyintovideo.jesspete.shop', '192.168.2.132'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### `drizzle.config.ts`

```typescript
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED!,  // Direct Neon connection (NOT pooled)
  },
  verbose: true,
  strict: true,
});
```

**CRITICAL:** Never use `drizzle-kit push` in production — always `drizzle-kit generate` + `migrate`. Pooling + DDL is unreliable; migrations must use the unpooled connection.

### `vitest.config.ts`

The test config uses jsdom environment + `@vitejs/plugin-react` for component tests. Setup file at `src/tests/setup.ts` registers `@testing-library/jest-dom` matchers and sets test env vars.

### `eslint.config.mjs`

ESLint flat config (no FlatCompat — broken with ESLint 9.39+). Direct plugin imports: `eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `typescript-eslint`. `@typescript-eslint/no-explicit-any: error` — use `unknown` instead.

### `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

**Note:** `@tailwindcss/postcss` is mandatory for Tailwind v4. The legacy `tailwindcss` plugin does NOT work with v4's CSS-first `@theme` block.

### `.env.example` → `.env.local`

30 env vars (27 required + 3 optional). See `src/lib/env/index.ts` for the Zod schema. Critical: `DATABASE_URL` (pooled) + `DATABASE_URL_UNPOOLED` (direct for migrations) are BOTH required.

---

## 4. The Design System (Code-First)

### Tailwind v4 CSS-First `@theme` Block

All design tokens live in `src/app/globals.css` inside a single `@theme { … }` block. There is NO `tailwind.config.ts` file. This is the Tailwind v4 future direction.

```css
@import 'tailwindcss';

@source '../components/**/*.{ts,tsx}';
@source '../lib/**/*.{ts,tsx}';

@theme {
  /* ── Color Palette (verified from live site :root) ── */
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
}
```

### The 13 Keyframes (All CSS, All Kebab-Case)

All keyframes are defined INSIDE the `@theme` block (Tailwind v4 requirement). Names are kebab-case (Decision B — PRD §9 camelCase and §8.1 kebab conflict; kebab wins).

```
fade-in-up, float, glow-pulse, border-glow, composite-pulse-text,
shimmer, btn-shimmer, grid-shimmer, grid-sweep-h, grid-sweep-v,
scanline-scroll, lang-dropdown-in, marquee-scroll
```

### The 7 `@utility` Classes

Custom utilities defined in `globals.css`:

```css
@utility scrollbar-hide { ... }      /* Hide scrollbar on carousels */
@utility marquee-mask { ... }        /* Edge fade mask for style chip marquee */
@utility marquee-track { ... }       /* Infinite scroll animation track */
@utility glass-input { ... }         /* Hero textarea glass-morphism wrapper */
@utility eyebrow { ... }             /* Section eyebrow badge (amber dot + uppercase) */
@utility section-heading { ... }     /* H2 heading with Outfit 700 + tracking */
@utility cta-amber { ... }           /* Amber CTA pill with hover shimmer */
```

### Brand Token Rules (Post-T11 — ENFORCED)

**T11 fix:** The codebase now uses brand tokens everywhere. `brand-tokens.test.ts` **ENFORCES 0 violations**.

| Use Case | ✅ Correct (brand token) | ❌ Wrong (Tailwind default) |
|---|---|---|
| CTA background | `bg-primary` | `bg-amber-400` |
| CTA text | `text-primary` | `text-amber-400` |
| Border | `border-primary` | `border-amber-400` |
| Focus ring | `outline-primary` | `outline-amber-400` |
| Page background | `bg-background` | `bg-zinc-950` |
| Card surface | `bg-card` | `bg-zinc-900` |
| Opacity modifier | `bg-primary/20` | `bg-amber-400/20` |

**⚠️ Critical:** `#febf00` (brand `--color-primary`) ≠ Tailwind's `amber-400` (`#fbbf24`). These are DIFFERENT COLORS. The brand token is warmer/more saturated.

### Typography Hierarchy

| Role | Font | Weight | Key Class | Size (desktop) |
|---|---|---|---|---|
| Display H1 (hero) | Outfit | **820** | `font-heading` | `text-[4.5rem]` |
| Display H2 (sections) | Outfit | 700 | `font-heading` | `text-4xl lg:text-6xl` |
| Body | Geist Sans | 400 | `font-sans` | `text-sm` / `text-base` |
| Accents, toggles | Geist Mono | 400 | `font-mono` | `text-[10px]` / `text-xs` |

### Font Loading (`src/lib/fonts.ts`)

```typescript
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import localFont from 'next/font/local';

const outfit = localFont({
  src: '../../public/fonts/Outfit-VariableFont.woff2',
  weight: '100 900',
  variable: '--font-outfit',
  display: 'swap',
});

export const fonts = { sans: GeistSans, mono: GeistMono, heading: outfit };
export const fontVariables: string = [GeistSans.variable, GeistMono.variable, outfit.variable].join(' ');
```

**Why `next/font/local` for Outfit (not `next/font/google`)?** Google Fonts API only serves discrete weights (100, 200, ..., 900). Weight 820 is an intermediate weight that gives the H1 its cinematic title-card quality. The variable font file (`Outfit-VariableFont.woff2`, 45KB) was downloaded from the Google Fonts GitHub repo and converted to woff2 via `fonttools`.

### Hybrid Rendering Strategy (ADR-002)

- **Marketing page (`/`)** — statically prerendered (was `force-static`, now removed; still prerenders for Lighthouse ≥95)
- **App routes** (`/dashboard`, `/create`, `/projects/[id]`, `/billing`) — dynamic (auth + DB access)
- **API routes** — `force-dynamic` (webhooks, SSE, health, download signing)

---

## 5. Component Architecture & Patterns

### Marketing Page — 10 Sections (Fixed Order, Top → Bottom)

```
1. Navbar (fixed overlay, 'use client' — scroll-aware bg + mobile Sheet)
2. Hero ('use client' — 4-layer: video bg + scrim + glow + fade. Glass input. Style marquee. Character counter.)
3. Examples ('use client' — carousel with arrow scroll)
4. Workflow ('use client' — 4 alternating rows + looping MP4, poster→video fade-in)
5. Features (Server — 4×2 hairline grid, NOT boxed cards)
6. Testimonials (Server — 3×2 grid, initials avatars)
7. Use Cases (Server — 2×2 grid, corner glow)
8. FAQ ('use client' — Radix Accordion)
9. Final CTA (Server — dot-grid bg, amber CTA pill)
10. Footer (Server — 3 link columns + copyright)
```

**5 client-side + 5 server components.** The split is deliberate: client only where interactivity is required (scroll state, textarea, carousel, accordion, video loading). Everything else is static HTML for Lighthouse performance.

### Component Directories

```
src/components/
├── primitives/   (7 files — marketing presentational: cta-amber, cta-ghost, cta-gradient, eyebrow, scroll-reveal, section-heading, style-chip)
├── sections/     (10 files — marketing page sections)
├── ui/           (4 files — hand-written shadcn: button, accordion, sheet, dropdown-menu)
└── app/          (7 files — app components: auth-form, create-wizard, empty-state, providers, project-progress-panel, project-download-button, project-share-button)
```

### The 4 shadcn/ui Primitives (Hand-Written)

The shadcn CLI timed out during initial setup. All 4 primitives were hand-written:

1. **`button.tsx`** — `class-variance-authority` variants (default, ghost, outline), sizes (sm, md, lg), `asChild` via `@radix-ui/react-slot`
2. **`accordion.tsx`** — wraps `@radix-ui/react-accordion` (FAQ section)
3. **`sheet.tsx`** — wraps `@radix-ui/react-dialog` (mobile nav)
4. **`dropdown-menu.tsx`** — wraps `@radix-ui/react-dropdown-menu` (language switcher — decorative, no i18n)

### Key Component Patterns

#### Hero (`src/components/sections/hero.tsx`) — 4-Layer Cinematic Composition

The hero is the most complex marketing component. It uses 4 stacked layers:

```
Layer 1 (bottom): <video> background (hero-bg.mp4, 46KB, aria-hidden="true")
Layer 2: vertical scrim (bg-gradient-to-b from-black/40 via-black/20 to-background)
Layer 3: radial amber glow (absolute, blur-3xl, opacity-50)
Layer 4 (top): content (eyebrow + H1 + subtitle + glass input + style marquee)
```

**The glass input** is a `<div className="glass-input">` wrapper containing the textarea, character counter, story seed chips, aspect ratio toggle, and CTA. The `@utility glass-input` class applies the glass-morphism styling.

**The character counter** shows `{story.length} / 5000`. The amber warning activates at ≥4500 chars (90% of 5000 limit). **T11 fix:** uses `text-primary` (was `text-amber-400`).

**The style marquee** duplicates the 8-chip `STYLE_CHIPS` array (8×2=16 chips) for seamless infinite scroll via `marquee-track` @utility (translateX -50%).

#### ProjectDownloadButton (`src/components/app/project-download-button.tsx`) — H4 + T6 Fix

**H4 fix (click-time signing):** The button receives only `{ projectId, hasVideo }` (primitives that never expire). On click, it fetches `/api/projects/${projectId}/download` to get a FRESH signed URL. The signed URL is never baked into the RSC payload.

**UI states:** `idle → loading → success (2.5s) → idle`, OR `idle → error`. Uses the luxury-dark design system (near-black surface, rationed amber on hover, AAA focus rings).

**T6 fix (error classification):** The download API route classifies R2 errors — S3/NoSuchKey/NoSuchBucket → 502, Timeout/Networking/Connection → 504, other → 500.

**CRITICAL:** This component NEVER imports `@/lib/storage/r2` at module level — `r2.ts` imports `env` which validates all 30 env vars at module load. In the browser, only `NEXT_PUBLIC_*` vars exist — all server-only vars are `undefined`, causing "Invalid environment variables" crash. Pattern: Server Component signs the URL via API route, client component fetches it on click.

#### CreateWizard (`src/components/app/create-wizard.tsx`) — /create Route

Reuses the Hero's glass-input widget pattern (story textarea, style chips, ratio toggle, character counter). On submit, calls `createProjectAction` Server Action. **T3 fix:** the action wraps INSERT + debit in `db.transaction()` via `debitCreditsTx` (no orphan on InsufficientCreditsError). **T7 fix:** `inngest.send()` is wrapped in try/catch → `setProjectFailed()` on failure.

### Server Component vs Client Component Decision Tree

```
Does the component need:
├── Browser APIs (window, document, localStorage)?
│   └── YES → 'use client'
├── React state (useState, useEffect, useRef)?
│   └── YES → 'use client'
├── Event handlers (onClick, onChange)?
│   └── YES → 'use client'
├── Browser-only hooks (useScrolled, useReveal, useReducedMotion, useProjectProgress)?
│   └── YES → 'use client'
└── None of the above?
    └── Server Component (default — static HTML, better SEO, no JS bundle)
```

### The `queries.ts` Boundary

Components NEVER call `db` directly. All DB access goes through a `queries.ts` file in each feature module:

```
src/features/
├── auth/domain/verify-session.ts   # DAL auth function
├── projects/{queries,actions}.ts   # DB access + Server Actions
├── pipeline/queries.ts             # Pipeline state updates
└── billing/{queries,actions}.ts    # DB access + Server Actions
```

This boundary is what makes the domain functions unit-testable without a live database.

---

## 6. Custom Hooks Deep Dive

The project has 4 custom hooks in `src/lib/hooks/`. All are `'use client'` (they use browser APIs).

### `useScrolled(threshold = 10): boolean`

Returns `true` when `window.scrollY` exceeds the given threshold. Used by the Navbar to toggle its scroll-aware background.

```typescript
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

**Key details:**
- `passive: true` on the scroll listener — prevents blocking the main thread
- Initializes on mount (`onScroll()` call) — handles page reload mid-scroll
- Cleanup removes the listener — no memory leak

### `useReveal<T extends HTMLElement>(options): { ref, revealed }`

Wraps `IntersectionObserver` to trigger a one-shot reveal flag when an element enters the viewport. Used by the `ScrollReveal` primitive and section components for cinematic staggered entrance animations.

```typescript
interface UseRevealOptions {
  threshold?: number;     // Default 0.15
  rootMargin?: string;    // Default '0px 0px -50px 0px' (triggers 50px before entering)
  once?: boolean;         // Default true (disconnect after first intersection)
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
        if (!entry) return;
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

**Key details:**
- The `data-reveal` / `data-revealed` CSS attributes handle the actual visual transition (opacity + translateY); this hook just flips the flag
- `once: true` (default) disconnects the observer after first intersection — performance optimization
- `rootMargin: '0px 0px -50px 0px'` triggers the reveal 50px BEFORE the element fully enters viewport — feels more responsive
- Generic `<T extends HTMLElement>` allows typing the ref (default `HTMLDivElement`)
- Returns `React.RefObject<T | null>` (not `T`) because `useRef<T>(null)` returns `RefObject<T | null>`

### `useReducedMotion(): boolean`

Returns `true` when the user has OS-level reduced-motion preference enabled (`prefers-reduced-motion: reduce`). Used to conditionally skip JS-driven animations.

```typescript
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mediaQuery.matches);
    onChange(); // Initialize on mount
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
```

**Key details:**
- The global CSS `@media (prefers-reduced-motion: reduce)` block in `globals.css` handles most cases declaratively; this hook is for cases where JS needs to know the preference (e.g., skipping a video autoplay)
- Initializes on mount (`onChange()` call) — handles the case where the user already has the preference enabled
- Listens for `change` events — responds to the user toggling the preference mid-session

### `useProjectProgress(projectId): ProjectProgressState`

Subscribes to the SSE progress stream for a project. Opens an EventSource on `/api/projects/[id]/progress`, parses incoming JSON events, and exposes the latest status/progress to the component.

**T5 fix (SSE slot pattern):** The server-side SSE route now uses `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` instead of `sseRateLimit.fixedWindow`. This hook doesn't change, but the server-side behavior is now: slot claimed on open, refreshed every 2s poll, released on abort.

**T6 fix (reconnect with exponential backoff):** On error, the hook waits (1s → 2s → 4s) and reopens the EventSource, up to `MAX_RECONNECT_ATTEMPTS = 3`. After max attempts, `connectionState` becomes `'error'` and the UI shows a "Reconnect failed" message.

**T12 fix (double-close guard):** When the stream reaches a terminal status, `onmessage` calls `eventSource?.close()` then sets `eventSource = null`. The cleanup function's `if (eventSource)` guard then skips the redundant close.

```typescript
export interface ProjectProgressState {
  status: string | null;
  progressPercent: number | null;
  progressDetail: string | null;
  errorMessage: string | null;
  connectionState: 'connecting' | 'open' | 'closed' | 'error' | 'reconnecting';
}

const TERMINAL_STATUSES = new Set(['completed', 'failed']);
const MAX_RECONNECT_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;

function backoffDelay(attempt: number): number {
  return BASE_BACKOFF_MS * Math.pow(2, attempt);  // 1000 → 2000 → 4000
}
```

**Connection states:**
- `'connecting'` — initial state, EventSource opening
- `'open'` — `onopen` fired, reconnect counter reset to 0
- `'closed'` — terminal status reached, EventSource closed cleanly
- `'reconnecting'` — error fired, waiting for backoff timer before retry
- `'error'` — max reconnect attempts exceeded, user must refresh

---

## 7. Content Management: Static Data + Pipeline Queries

### Static Marketing Data (`src/lib/data/`)

The marketing page uses 10 static data files in `src/lib/data/`. These are plain TypeScript files exporting typed arrays/objects — NOT `import.meta.glob` (this is a Next.js project, not Vite). The data is statically imported and tree-shaken into the bundle.

```
src/lib/data/
├── nav-links.ts          # Navbar links (desktop + mobile Sheet)
├── story-seeds.ts        # 4 story example chips + STORY_SEEDS map
├── style-chips.ts        # 8 style chips for the Hero marquee (spec-locked)
├── examples.ts           # 6 example cards for the Examples carousel
├── workflow-steps.ts     # 4 workflow steps with video/poster paths
├── features.ts           # 8 features for the 4×2 hairline grid
├── testimonials.ts       # 6 testimonials for the 3×2 grid
├── use-cases.ts          # 4 use cases for the 2×2 grid
├── faq-items.ts          # 6 FAQ items for the Radix Accordion
└── footer-links.ts       # 3 footer columns of links
```

### `STYLE_CHIPS` — Spec-Locked 8-Chip Set

```typescript
export const STYLE_CHIPS: StyleChip[] = [
  { label: 'Ghibli' },
  { label: 'Medieval' },
  { label: 'Oil Painting' },
  { label: 'Anime' },
  { label: 'Japanese animation' },
  { label: 'Realistic' },
  { label: 'Cyberpunk' },
  { label: 'Watercolor' },
];
```

This array is **locked to the spec-mandated set** from the original storyintovideo.com site. A prior implementation had drifted to 7 chips with different labels (added "Comic" + "Futuristic neon"; dropped "Medieval" + "Japanese animation"). The spec set is restored and protected by `src/tests/unit/style-chips.test.ts` (9 tests).

**H3 fix:** The `visual_style` enum + Zod schema + `STYLE_PROMPTS` now include `medieval` + `japanese-animation` (migration `0004`). All 8 marketing chips now work end-to-end.

### Pipeline Queries (`src/features/pipeline/queries.ts`)

All DB access for the AI pipeline goes through this file. The `append*` queries return `AppendResult<T>`:

```typescript
export interface AppendResult<T> {
  inserted: boolean;
  row: T | null;
}
```

**C5 fix:** All `append*` queries use `onConflictDoNothing` — `appendCharacter/appendScene/appendVoiceover/appendVideo` return `{ inserted, row }`. This makes the pipeline idempotent against Inngest retries.

**T8 fix:** `appendVideo` now inserts with `status: 'rendering'` (not `'completed'`). The video row is created in Step 5 (subtitles) with `videoKey=null`; Step 6 calls `updateVideo` which sets `videoKey` + `duration` + `status: 'completed'`. No more contradictory `status='completed'` with `videoKey=null`.

### Billing Queries (`src/features/billing/queries.ts`)

#### `debitCredits(userId, amount, operationType, idempotencyKey, projectId?)`

Standalone entry point. Opens its own `db.transaction()` and delegates to `debitCreditsTx`.

**C5 fix:** Uses `ON CONFLICT (idempotency_key) DO NOTHING` + `.for('update')` row lock. Returns `DebitResult { idempotent, eventId, creditsRemaining }`. If `idempotent: true`, the caller should skip side effects (Inngest retry detected).

#### `debitCreditsTx(tx, userId, amount, operationType, idempotencyKey, projectId?)` — T3 Fix

Transaction-scoped variant. Accepts an existing transaction handle (`tx`) from a caller that has already opened `db.transaction(...)`. This lets `createProjectAction` wrap INSERT + debit in a SINGLE transaction so that `InsufficientCreditsError` rolls back the INSERT (no orphan project rows).

```typescript
export async function debitCreditsTx(
  tx: Parameters<Parameters<Database['transaction']>[0]>[0],
  userId: string,
  amount: number,
  operationType: DebitOperation,
  idempotencyKey: string,
  projectId?: string,
): Promise<DebitResult> {
  // 1. IDEMPOTENCY GATE — INSERT with ON CONFLICT DO NOTHING
  // 2. LOCK subscription row with .for('update')
  // 3. DEBIT — subtract credits from locked row
}
```

**Why two functions?** Drizzle transactions can't be nested. `debitCredits` (standalone) is for pipeline steps that don't need a shared transaction. `debitCreditsTx` (transaction-scoped) is for `createProjectAction` which needs INSERT + debit to be atomic.

### Credit Costs

```typescript
export const CREDIT_COSTS = {
  analysis: 5,
  character_generation: 10,    // per character
  scene_generation: 8,         // per scene
  voiceover: 15,
  subtitle_alignment: 3,
  video_assembly: 30,
  moderation_check: 0,         // free — logged for audit
  stripe_webhook: 0,           // free — logged for audit
} as const;

// Total for 3 chars + 6 scenes: 5 + 30 + 48 + 15 + 3 + 30 = 131 credits
export const FULL_PIPELINE_COST = 131;
```

---

## 8. Accessibility (WCAG AAA) Implementation

### Color Contrast (All AAA)

| Element | Foreground | Background | Ratio | Level |
|---|---|---|---|---|
| Primary CTA text | `#020202` (background) | `#febf00` (primary) | 15.7:1 | AAA |
| Body text | `#d4d4d8` (zinc-300) | `#020202` (background) | 12.6:1 | AAA |
| Muted text | `#8e8e95` (muted-foreground) | `#020202` (background) | 5.2:1 | AA |
| Destructive | `#f8f8f8` (foreground) | `#ff2d39` (destructive) | 5.9:1 | AA |

### Focus Rings

**T11 fix:** All focus rings use `outline-primary` (was `outline-amber-400`).

```css
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
```

**Why `focus-visible` not `focus`?** `focus-visible` only shows the ring for keyboard users, not mouse clicks. This is the modern a11y best practice — mouse users get a visual cue from the cursor change, keyboard users need the ring.

### Skip-to-Content Link

```tsx
<a
  href="#main"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-zinc-950 focus:shadow-lg"
>
  Skip to content
</a>
```

Visually hidden by default (`sr-only`), becomes visible on focus (`focus:not-sr-only`). The `<main>` element has `id="main"`.

### Hero Video Accessibility

```tsx
<video
  autoPlay
  muted
  loop
  playsInline
  poster="/hero-poster.webp"
  aria-hidden="true"  // decorative, no audio
  className="..."
>
  <source src="/hero-bg.mp4" type="video/mp4" />
</video>
```

The hero video is **decorative** (provides ambiance, no informational content). `aria-hidden="true"` removes it from the accessibility tree. `muted` + `autoPlay` + `playsInline` are required for mobile autoplay.

### `prefers-reduced-motion` Global Override

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This globally disables ALL animations + transitions for users with reduced-motion preference. The `useReducedMotion` hook is for JS-driven animations that can't be handled declaratively.

### Touch Targets

All interactive elements on mobile have minimum 44×44px touch targets:

```tsx
<button className="flex min-h-[44px] min-w-[44px] items-center justify-center ...">
```

The aspect ratio toggle buttons in the Hero explicitly use `min-h-[44px] min-w-[44px]` to meet the iOS HIG / WCAG 2.5.5 target size requirement.

### ARIA Patterns

| Component | ARIA Pattern |
|---|---|
| FAQ | `Radix Accordion` (handles `aria-expanded`, `aria-controls`, `role="region"`) |
| Mobile nav | `Radix Dialog` (Sheet) — handles focus trap, escape, restore |
| Language switcher | `Radix DropdownMenu` — handles `aria-haspopup`, `aria-expanded` |
| Aspect ratio toggle | `role="group" aria-label="Aspect ratio"` + `aria-pressed` per button |
| Progress bar | `role="progressbar" aria-valuenow aria-valuemin={0} aria-valuemax={100}` |
| Error messages | `role="alert"` (screen readers announce immediately) |

---

## 9. Anti-Patterns & Common Bugs

### Bug: Billing upgrade buttons POST to non-existent route (C-1, fixed in T1)

**Symptom:** Clicking "Upgrade to Creator/Pro/Studio" on `/billing` returned a 404. 100% of paid conversions were blocked.

**Root cause:** The billing page rendered `<form action="/api/stripe/checkout?plan=${plan}" method="POST">`. But no such API route existed — only `/api/stripe/webhook`. The `checkoutAction` Server Action existed but was never called.

**Fix (T1):** Created `billingCheckoutAction(formData)` Server Action in `src/features/billing/actions.ts` (which has `"use server"` at the top). The billing page imports it and uses `<form action={billingCheckoutAction}>` with `<button name="plan" value={plan}>`.

**Lesson:** Server Action forms must live in a `"use server"` module. Defining a Server Action inline in a Server Component page causes `pnpm build` to fail with "Functions cannot be passed directly to Client Components".

### Bug: Protected routes return ERR_CONNECTION_REFUSED (C-2, fixed in T2)

**Symptom:** All 4 protected routes (`/dashboard`, `/create`, `/billing`, `/projects/*`) returned `net::ERR_CONNECTION_REFUSED` for unauthenticated users on the live site.

**Root cause:** `proxy.ts` constructed the redirect with `new URL('/sign-in', nextUrl.origin)`. Behind a TLS-terminating reverse proxy (Cloudflare Tunnel), `nextUrl.protocol` is `http:` (not `https:`) and/or the Host header may not match the public domain. The redirect went to `http://public-domain:80/sign-in` → connection refused (only 443 open).

**Fix (T2):** Changed to `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)`. The proxy now uses the canonical public HTTPS URL for redirects.

**Lesson:** Behind a TLS-terminating reverse proxy, `nextUrl.origin` lies. Always use `env.NEXT_PUBLIC_APP_URL` for redirects that must reach the user's browser.

### Bug: Orphan project rows on insufficient credits (H-1, fixed in T3)

**Symptom:** Dashboard showed ghost "pending" projects the user never completed.

**Root cause:** `createProjectAction` inserted the project (top-level), then called `debitCredits` (separate transaction). If `debitCredits` threw `InsufficientCreditsError`, the project row was already committed as an orphan with `status='pending'`.

**Fix (T3):** Added `debitCreditsTx(tx, ...)` variant that accepts an existing transaction handle. Wrapped `createProjectAction`'s INSERT + debit in a single `db.transaction()`. If the debit throws, the INSERT rolls back.

**Lesson:** Drizzle transactions can't be nested. To share a transaction across multiple operations, extract a `*Tx(tx, ...)` variant that accepts the transaction handle.

### Bug: Stripe webhook silently loses subscription updates (H-2, fixed in T4)

**Symptom:** User pays for an upgrade, but the subscription never updates in the DB.

**Root cause:** The idempotency INSERT happened BEFORE the event handler. If the handler threw (transient DB error), the webhook returned 500, Stripe retried, but the idempotency row was already committed. The retry hit `onConflictDoNothing` and returned `{ duplicate: true }` without re-processing. The subscription update was permanently lost.

**Fix (T4):** Moved the idempotency INSERT to AFTER all side effects succeed. Added a pre-check SELECT for the common duplicate case. If the handler throws, no idempotency row is inserted → Stripe retries → handler runs again.

**Lesson:** Idempotency-key-too-early is a silent data-loss anti-pattern. INSERT the idempotency row AFTER side effects succeed, not before.

### Bug: SSE 429 after closing and reopening within 60s (H-3, fixed in T5)

**Symptom:** User closes the project detail tab, reopens within 60s, gets "Too many concurrent connections" 429.

**Root cause:** `sseRateLimit.fixedWindow(1, '1 m')` incremented a counter on connection open and let it expire after 60s. When the client disconnected cleanly, the counter was NOT decremented. Upstash `fixedWindow` doesn't support release.

**Fix (T5):** Added `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` functions using Redis `SET NX EX 30` (atomic claim with TTL). SSE route claims on open, refreshes every 2s poll, releases on abort. Slot auto-expires after 30s if the server crashes.

**Lesson:** Upstash `fixedWindow` rate limiters can't release on disconnect. Use Redis `SET NX EX` + `DEL` for connection-counting patterns.

### Bug: `appendVideo` set `status='completed'` before MP4 existed (M-3, fixed in T8)

**Symptom:** Queries between Step 5 and Step 6 saw `status='completed'` with `videoKey=null` — a contradictory state.

**Root cause:** `appendVideo` inserted with `status: 'completed'` and `videoKey: null`. The video row is created in Step 5 (subtitles) before the MP4 exists.

**Fix (T8):** Changed `appendVideo` to insert with `status: 'rendering'` (existing enum value). `updateVideo` now sets `status: 'completed'` alongside `videoKey` + `duration`. No migration needed — the `video_status` enum already had `pending, rendering, completed, failed`.

**Lesson:** Don't set a terminal status at insert time if the entity isn't complete yet. Use a "in-progress" status; transition to terminal on completion.

### Bug: `FAIL_OPEN` read at module load — not testable per-call (M-4, fixed in T9)

**Symptom:** Tests couldn't verify both fail-open and fail-closed policies in the same test run.

**Root cause:** `const FAIL_OPEN = env.IMAGE_MODERATION_FAIL_OPEN === 'true'` at module top level. The value is locked at first import; changing the mock for a second test has no effect.

**Fix (T9):** Moved the read into a `getFailOpen()` function called inside the `moderateImage` function body. Tests can now mock `env` per-call.

**Lesson:** Module-load constants make env-configurable behavior untestable per-call. Read env vars inside the function body if tests need to vary them.

### Bug: Dead `buildFfmpegCommand` export — second source of truth (M-5, fixed in T10)

**Symptom:** If someone updated `buildFfmpegCommand` but not the real `assembleVideo` (or vice versa), the test passed but production broke.

**Root cause:** `buildFfmpegCommand` was exported "for unit testing" but never called in production. The real `assembleVideo` uses fluent-ffmpeg's API directly.

**Fix (T10):** Deleted `buildFfmpegCommand` and its test. Tests now verify the real `assembleVideo` code path.

**Lesson:** Dead exported functions create a second source of truth. Delete dead code. Tests should verify the real code path, not a parallel implementation.

### Bug: Brand color system bypassed 122+ times (M-6, fixed in T11)

**Symptom:** App pages rendered with `#fbbf24` (Tailwind `amber-400`) instead of the spec'd `#febf00` (brand `--color-primary`). Visually subtle but brand-inconsistent.

**Root cause:** 122 `amber-*` violations + 27 `bg-zinc-950/900/black` violations across 28+ files. The H2 fix added a CI guard test that measured the baseline but didn't reduce it.

**Fix (T11):** `sed` sweep across 45 files: `amber-300/400/500/600` → `primary`, `bg-zinc-950` → `bg-background`, `bg-zinc-900` → `bg-card`, `bg-black` → `bg-background`. `brand-tokens.test.ts` now ENFORCES 0 violations.

**Lesson:** Large mechanical sweeps need scripted `sed`, not manual edits. Per `skills/code-simplification` §3 "Rule of 500": if a refactor touches >500 lines, use automation.

### Bug: `metadataBase` hardcoded to placeholder (L-4, fixed in T12)

**Symptom:** Social sharing previews (OG image) resolved to `https://storyintovideo-clone.example.com/og-image.png` which doesn't exist.

**Root cause:** `metadataBase: new URL('https://storyintovideo-clone.example.com')` in `layout.tsx`.

**Fix (T12):** Changed to `metadataBase: new URL(env.NEXT_PUBLIC_APP_URL)`. Also updated `openGraph.url` to use `env.NEXT_PUBLIC_APP_URL`.

**Lesson:** Always use `env.NEXT_PUBLIC_APP_URL` for metadata URLs so they match the deployment.

### Bug: `Date.now()` temp file collisions (L-3, fixed in T12)

**Symptom:** Two Inngest pipeline runs finishing at the same millisecond would write to the same `/tmp/siv-srt-<ts>.srt` file.

**Root cause:** `const srtPath = /tmp/siv-srt-${Date.now()}.srt` — `Date.now()` has millisecond resolution; concurrent runs can collide.

**Fix (T12):** Changed to `crypto.randomUUID()` for temp file names. Atomic, no collision risk.

**Lesson:** `Date.now()` temp file names collide under concurrency. Use `crypto.randomUUID()`.

### Bug: `EventSource.close()` called twice (L-2, fixed in T12)

**Symptom:** `EventSource.close()` called twice (once on terminal status, once on unmount cleanup). Not a crash (close is idempotent) but sloppy.

**Fix (T12):** Set `eventSource = null` after `close()` in the terminal-status handler. The cleanup function's `if (eventSource)` guard then skips the redundant close.

### Bug: Client component imports `r2.ts` → env validation crash (P0)

**Symptom:** Project detail page shows "This page couldn't load" in production.

**Root cause:** Client component imported `@/lib/storage/r2` at module level. `r2.ts` imports `env` which validates all 30 env vars at module load. In the browser, only `NEXT_PUBLIC_*` vars exist — all server-only vars are `undefined`, causing "Invalid environment variables" crash.

**Fix (H4):** Replaced SSR-time `SignedDownloadWrapper` with click-time API route `/api/projects/[id]/download`. `ProjectDownloadButton` receives `{ projectId, hasVideo }` (primitives) and fetches the API route on click. `SignedDownloadWrapper` DELETED.

**Lesson:** Client components must NEVER import `r2.ts` (or any module that imports `env`) at module level. Server Component signs the URL, passes as prop to client component (or client fetches an API route on click).

### Bug: `@ffmpeg-installer/ffmpeg` incompatible with Turbopack

**Symptom:** Build fails with "server relative imports are not implemented".

**Root cause:** `@ffmpeg-installer/ffmpeg` uses dynamic `require()` calls with runtime-constructed paths (`__dirname.indexOf('node_modules')`) that produce `/ROOT/node_modules/...` under Turbopack's virtual filesystem. Turbopack rejects this.

**Fix (ADR-006):** Removed `@ffmpeg-installer/ffmpeg`. Use system FFmpeg binary via `getFfmpegPath()` helper that reads `env.FFMPEG_PATH` (default `/usr/bin/ffmpeg`).

### Bug: `middleware.ts` renamed to `proxy.ts` in Next.js 16

**Symptom:** Edge middleware not running after Next.js 16 upgrade.

**Root cause:** Next.js 16 renamed the `middleware` file convention to `proxy` to better reflect its role as a network boundary.

**Fix:** `npx @next/codemod@canary middleware-to-proxy .` or rename manually. Functionality is identical; only the filename changes.

### Bug: Vitest mock hoisting — `Cannot access 'X' before initialization`

**Symptom:** Test fails with `Cannot access 'mockFn' before initialization`.

**Root cause:** `vi.mock()` factories are hoisted above imports by Vitest's transformer. If the factory references an outer `vi.fn()`, the fn isn't yet defined when the factory runs.

**Fix:** Use `vi.hoisted()`:

```typescript
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { insert: mockFn } }));
```

### Bug: Mock factory returns arrow fn, real code does `new X()`

**Symptom:** Test fails with `"X is not a constructor"`.

**Root cause:** `vi.fn().mockImplementation(() => ({ ... }))` returns an arrow function. Arrow functions can't be called with `new`.

**Fix:** Use `class` syntax:

```typescript
vi.mock('@aws-sdk/client-s3', () => ({
  class MockS3Client { send = sendMock; }
}));
```

### Bug: JSX in `*.test.ts` file — parse error

**Symptom:** Test fails with `[PARSE_ERROR] Expected '>' but found 'Identifier'`.

**Root cause:** oxc (Vitest's transformer) throws a parse error for JSX in `*.test.ts` files.

**Fix:** Rename the test file to `*.test.tsx`.

### Bug: Source-reading tests fail on docblock false positives

**Symptom:** Source-reading test fails because a docblock mentions the old pattern.

**Root cause:** When asserting "code does not contain X" via regex on source, docblocks that explain the old pattern (e.g., "this replaces the placeholder Buffer.from pattern") trigger false positives.

**Fix:** Strip comments before regex:

```typescript
const stripped = source
  .replace(/\/\*[\s\S]*?\*\//g, '')  // block comments
  .replace(/\/\/.*$/gm, '');          // line comments
```

### Bug: Source-reading test fails on multiline method chains

**Symptom:** `indexOf('db.insert(usageEvents)')` returns -1 even though the code clearly has `db.insert(usageEvents)`.

**Root cause:** The source has `db\n  .insert(usageEvents)` across lines (Prettier formatting). `indexOf` needs a contiguous match.

**Fix:** Search for `.insert(usageEvents)` (without the `db` prefix) — the method chain is always contiguous even when the receiver is on a different line.

---

## 10. Debugging Guide

### Build fails: "Invalid environment variables"

**Cause:** Real env vars not set in `.env.local`, and not in build-context fallback (`NEXT_PHASE=phase-production-build` or `NODE_ENV=test`).

**Fix:** Copy `.env.example` → `.env.local`, fill in real values. The build-context fallback only returns placeholders during `next build` or `NODE_ENV=test`.

### Build fails: "Failed to collect page data for /api/auth/[...nextauth]"

**Cause:** Auth route tries to prerender DrizzleAdapter which needs env vars at module load.

**Fix:** Ensure `export const dynamic = 'force-dynamic'` in the route handler (`src/app/api/auth/[...nextauth]/route.ts`).

### Build fails: "Functions cannot be passed directly to Client Components"

**Cause:** Server Action defined inline in a Server Component page (not in a `"use server"` module).

**Fix:** Move the Server Action to a module with `"use server"` at the top (e.g., `src/features/billing/actions.ts`). Import it into the page.

### `tsc` error: "Argument of type 'string | undefined' is not assignable to parameter of type 'string'" inside a closure

**Cause:** TypeScript doesn't preserve `session.user.id` narrowing inside closures.

**Fix:** Capture `const userId: string = session.user.id` BEFORE the closure so the type is narrowed.

### `/dashboard` returns ERR_CONNECTION_REFUSED for unauthenticated users

**Cause:** Proxy redirect used `nextUrl.origin` which resolves to `http://` behind TLS-terminating reverse proxy.

**Fix (T2):** Proxy now uses `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)`. Verify `NEXT_PUBLIC_APP_URL` is set to the public HTTPS URL in `.env.local`.

**⚠️ Live-site update (2026-06-29):** The T2 code fix IS deployed (proven by `/api/health` returning the H9 DB+FFmpeg check). However, the live site at `storyintovideo.jesspete.shop` STILL exhibits the symptom — every auth-protected route redirects to `http://localhost:3000/sign-in` → `ERR_CONNECTION_REFUSED`. **Root cause: production `NEXT_PUBLIC_APP_URL` env var is set to `http://localhost:3000` instead of `https://storyintovideo.jesspete.shop`.** This is an operational misconfiguration, NOT a code bug. Fix: set the env var correctly on the production host and redeploy. The env module's host-mismatch warning (`src/lib/env/index.ts:217-226`) only emits `console.warn` — it was missed in server logs. Consider promoting it to a thrown error in production OR surfacing env misconfigurations via `/api/health`.

### Live site `/pricing`, `/blog`, `/contact` return 200 OK with marketing page title

**Cause:** No route handlers exist for these paths AND no custom `not-found.tsx` — Next.js default 404 inherits root layout metadata.

**Fix:** Implement the routes (preferred) OR add `src/app/not-found.tsx` with proper 404 metadata + on-brand UX so dead links are visible to operators + SEO crawlers. Confirmed on live site via `agent-browser`: all three URLs return 200 with title `StoryIntoVideo - Turn Stories Into Videos with AI`.

### Nav clicks cause full-page reloads (visible flash, Lighthouse regression)

**Cause:** Navbar/dashboard/hero use raw `<a href>` instead of `<Link>` from `next/link` (violates the "never use `<a>` for internal routes" rule). 9 places: `navbar.tsx` (6), `dashboard/page.tsx` (2), `hero.tsx` (1).

**Fix:** Replace all internal `<a href>` with `<Link href>` from `next/link`. The `cta-routes.test.ts` verifies href values but not the component type — add a source-reading assertion for `<Link` usage.

### `/api/health` returns 200 healthy but auth-protected routes still broken

**Cause:** The health check only validates DB + FFmpeg, NOT env var correctness. `NEXT_PUBLIC_APP_URL` misconfiguration goes undetected.

**Fix (planned):** Extend `/api/health` to verify `AUTH_URL` and `NEXT_PUBLIC_APP_URL` hosts match, returning 503 if they differ. Operators monitoring `/api/health` will then catch env misconfigurations without reading server logs.

### Billing upgrade buttons return 404

**Cause:** Form posted to non-existent `/api/stripe/checkout` route (C-1 bug).

**Fix (T1):** Billing page now uses `<form action={billingCheckoutAction}>` Server Action. Ensure `billingCheckoutAction` is imported from `@/features/billing/actions` (has `"use server"`).

### Dashboard shows ghost "pending" projects

**Cause:** `createProjectAction` inserted the project before debiting credits; InsufficientCreditsError left an orphan row (H-1 bug).

**Fix (T3):** INSERT + debit now wrapped in `db.transaction()` via `debitCreditsTx`. To clean up existing orphans: `DELETE FROM projects WHERE status = 'pending' AND progress_percent = 0;`

### Stripe webhook retries don't update the subscription

**Cause:** Idempotency INSERT happened BEFORE the event handler (H-2 bug).

**Fix (T4):** Idempotency INSERT now happens AFTER side effects succeed + pre-check SELECT. If you have affected events, delete the `usageEvents` rows with `type='stripe_webhook'` for those event IDs so Stripe retries can re-process.

### SSE returns 429 after closing and reopening within 60s

**Cause:** `sseRateLimit.fixedWindow(1, '1 m')` never released the counter on disconnect (H-3 bug).

**Fix (T5):** SSE now uses `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern (SET NX EX 30 + DEL on abort). Slot auto-expires after 30s if the server crashes.

### Download returns generic 500 for all R2 failures

**Cause:** Single catch block didn't distinguish error types (M-1 bug).

**Fix (T6):** Download route now classifies errors — S3/NoSuchKey/NoSuchBucket → 502, Timeout/Networking/Connection → 504, other → 500. Check server logs for the specific `errorName`.

### Project stuck in "pending" after Inngest outage

**Cause:** `inngest.send()` threw but the project row was already committed (M-2 bug).

**Fix (T7):** `inngest.send()` is now wrapped in try/catch → `setProjectFailed()`. The project status will be 'failed' with an error message; the user can retry.

### Project detail page shows "This page couldn't load"

**Cause:** Client component imports `r2.ts` at module level, triggering env validation crash in browser.

**Fix:** Never import `@/lib/storage/r2` in `'use client'` files. Sign URLs in Server Components, pass as props. Or use the click-time API route pattern (H4 fix).

### `assemble-video` can't find FFmpeg binary

**Cause:** `@ffmpeg-installer/ffmpeg` removed; system FFmpeg not installed.

**Fix:** `sudo apt install ffmpeg` (Ubuntu) or `brew install ffmpeg` (macOS). Set `FFMPEG_PATH` env var if non-standard location.

### E2E tests fail with "Executable doesn't exist"

**Cause:** Playwright browsers not installed.

**Fix:** `pnpm exec playwright install` (chromium only — that's all we test against).

### Tests fail: "Cannot find module 'next/server'"

**Cause:** jsdom can't load Next.js server modules (imported transitively by `next-auth`).

**Fix:** Mock `next-auth` and `next/navigation` in the test:

```typescript
vi.mock('next-auth', () => ({ ... }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), ... }));
```

### Tests fail: "Cannot access 'X' before initialization"

**Cause:** `vi.mock()` factory references outer `vi.fn()`.

**Fix:** Use `vi.hoisted()`:

```typescript
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { insert: mockFn } }));
```

### Tests fail: "X is not a constructor"

**Cause:** Mock factory returns arrow fn, real code does `new X()`.

**Fix:** Use `class` syntax:

```typescript
class MockS3Client { send = sendMock; }
```

### Tests fail: "[PARSE_ERROR] Expected '>' but found 'Identifier'"

**Cause:** Test file has JSX but `.test.ts` extension.

**Fix:** Rename to `*.test.tsx`.

### Pipeline tests fail: "fetch failed: ENOTFOUND r2.example.com"

**Cause:** Steps 5 & 6 use `fetch()` for R2 downloads (signed URLs).

**Fix:** `vi.stubGlobal('fetch', fetchMock)` in the test setup.

### SSE stream hangs / never closes

**Cause:** `controller.close()` not called on terminal status.

**Fix:** Poll DB every 2s; close when `status ∈ {completed, failed}`.

### `pnpm install` warns "Ignored build scripts: esbuild"

**Cause:** `pnpm-workspace.yaml` missing approval.

**Fix:** Add `esbuild: true` to the `allowBuilds` map in `pnpm-workspace.yaml` (pnpm 10.26+ syntax).

### `pnpm install` fails with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION packages field missing or empty`

**Cause:** `pnpm-workspace.yaml` missing `packages:` field.

**Fix:** Add `packages: ['.']` to `pnpm-workspace.yaml`.

### Replicate scene generation 404s

**Cause:** `REPLICATE_SDXL_IPADAPTER_MODEL` is the SDXL base placeholder (default).

**Fix:** Set `REPLICATE_SDXL_IPADAPTER_MODEL` env var to a real `lucataco/sdxl-ipadapter:<sha>` hash from replicate.com/explorer.

### Auth redirects to `http://localhost:3000` in production

**Cause:** `AUTH_URL` env var set to localhost, OR reverse proxy doesn't forward `X-Forwarded-Host`.

**Fix:** Set `AUTH_URL` to the production URL. The `trustHost: true` config (T2) makes Auth.js use the request's Host header as a fallback. The env module also emits a `console.warn` at module load when AUTH_URL and NEXT_PUBLIC_APP_URL hosts differ.

---

## 11. Pre-Ship Checklist

Before claiming any task is complete, verify ALL of the following:

### Quality Gate (Mandatory — must pass with zero warnings/errors)

```bash
pnpm lint          # ESLint — zero warnings, zero errors
pnpm typecheck     # tsc --noEmit — zero errors (strict + noUncheckedIndexedAccess + verbatimModuleSyntax)
pnpm test          # Vitest — 396 tests across 48 files, all passing
pnpm build         # next build — production build succeeds, all 17 routes generated
```

### Pre-Commit Hook

husky + lint-staged automatically runs ESLint + Prettier on staged `.ts/.tsx` files via `.husky/pre-commit`. Run `pnpm install` to activate (the `prepare` script sets up the hook). The hook only checks staged files — run the full quality gate manually before pushing.

### Code Quality Checks

- [ ] No `any` type (ESLint enforces `@typescript-eslint/no-explicit-any: error`)
- [ ] No `@ts-ignore` or `@ts-nocheck`
- [ ] No `eval()` or `Function()` constructor
- [ ] No SQL string concatenation (Drizzle parameterized queries only)
- [ ] No `process.env.*` direct access (use the Zod-validated `env` module)
- [ ] No `dangerouslySetInnerHTML` with user input (only static JSON-LD is allowed)
- [ ] No empty catch blocks
- [ ] No client component importing `@/lib/storage/r2` at module level

### Architecture Checks

- [ ] 5-layer architecture respected (lower layers never import from higher)
- [ ] `verifySession()` first in every Server Action (never wrap in try/catch)
- [ ] `auth()` in API routes (returns null → 401 JSON, not redirect)
- [ ] DB access through `queries.ts` boundary (components never call `db` directly)
- [ ] Server Actions in a `"use server"` module (not inline in Server Component pages)
- [ ] No `db push` in production (always `drizzle-kit generate` + `migrate`)

### Design System Checks (Post-T11)

- [ ] No `amber-300/400/500/600` classes (use `primary`)
- [ ] No `bg-zinc-950` / `bg-zinc-900` / `bg-black` (use `bg-background` / `bg-card`)
- [ ] Focus rings use `outline-primary` (not `outline-amber-400`)
- [ ] `brand-tokens.test.ts` passes with 0 violations

### Accessibility Checks

- [ ] Focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`
- [ ] Skip-to-content link present
- [ ] All images have `alt` text (or `aria-hidden="true"` if decorative)
- [ ] All interactive elements have ≥44×44px touch targets on mobile
- [ ] `prefers-reduced-motion: reduce` globally disables animation
- [ ] Color contrast meets WCAG AA (AAA for body text + primary)

### Testing Checks

- [ ] Every new behavior has a corresponding test
- [ ] Bug fixes include a reproduction test that failed before the fix
- [ ] Test names describe the behavior being verified
- [ ] No tests skipped or disabled
- [ ] Mock conventions followed: `vi.hoisted()` for shared state, `class` for constructors, `.tsx` for JSX

### Security Checks

- [ ] All user input validated at the boundary (Zod schemas)
- [ ] Auth checked on every protected endpoint
- [ ] Owner checks on every resource access (`getProject(projectId, userId)`)
- [ ] Rate limiting active on auth, pipeline, SSE endpoints
- [ ] No secrets in code or git history
- [ ] Error responses don't expose internal details
- [ ] `IMAGE_MODERATION_FAIL_OPEN=false` for production (fail-closed)

### Deployment Checks

- [ ] `NEXT_PUBLIC_APP_URL` set to the public HTTPS URL (NOT `http://localhost:3000`)
- [ ] `AUTH_URL` set to the same public URL
- [ ] `REPLICATE_SDXL_IPADAPTER_MODEL` set to a real IP-Adapter hash
- [ ] Database migrations applied (`pnpm drizzle:migrate`)
- [ ] Stripe products configured (`PRICE_IDS` env vars)
- [ ] All 30 env vars set in `.env.local` (27 required + 3 optional)

### Post-Deploy Smoke Test (v7.0.0 addition — mandatory after every deploy)

- [ ] `curl -s https://YOUR-DOMAIN/api/health | jq .status` returns `"healthy"`
- [ ] `curl -sI https://YOUR-DOMAIN/dashboard | grep -i location` returns `Location: https://YOUR-DOMAIN/sign-in?callbackUrl=%2Fdashboard` (NOT `localhost:3000`)
- [ ] `curl -s https://YOUR-DOMAIN/ | grep -c 'font-weight:820'` returns `1` (H1 hero headline renders)
- [ ] `/sign-in`, `/sign-up`, `/privacy`, `/terms` all return 200 with route-specific titles
- [ ] `/pricing`, `/blog`, `/contact` return 404 (or render content if implemented) — NOT 200 with marketing title

---

## 12. Lessons Learnt & How to Avoid Them

### Marketing Layer (inherited)

1. **`suppressHydrationWarning` belongs on `<body>`, not just `<html>`** — Browser extensions like Grammarly inject attributes into `<body>` before React hydrates.
2. **Workflow component needs `'use client'`** — Uses `useState` for poster→video fade-in choreography.
3. **Test counts drift from plans** — MEP planned 6+3, actual is now 396 unit + 48 E2E. Always verify against `pnpm test` output.
4. **File structure evolves during implementation** — Update docs as you build.
5. **Playwright requires browser binary installation** — `pnpm install` doesn't install browser binaries.

### Production App Layer

6. **Zod v4 `.url()` accepts any scheme (including `postgresql://`)** — compose `.url()` (validates URL format) with `.refine()` (restricts protocol to `postgres:`/`postgresql:`) for `DATABASE_URL`.
7. **Env validation needs build-context fallback** — without it, `next build` fails during page-data collection.
8. **`postgres()` defers connection until first query** — allows eager db instantiation without breaking the build.
9. **DrizzleAdapter validates db object structure** — a Proxy-based lazy db was rejected; use a real Drizzle client.
10. **Inngest v4 changed `createFunction` signature** — trigger is now in the config object, not a second argument.
11. **Auth unit tests must mock `next-auth` + `next/navigation`** — jsdom can't load `next/server`.
12. **Source-reading tests are valid** for server-only modules that can't be rendered in jsdom.
13. **Stripe "Basil" API (2025-03-31) moved `current_period_end`** — from top-level Subscription to `subscription.items.data[0].current_period_end`.
14. **ElevenLabs SDK returns `Readable`, not `ReadableStream`** — duck-type the input in `streamToBuffer`.
15. **TDD with mocked AI providers works well** — all 6 pipeline domain functions are fully unit-tested.

### Remediation Sprint 1 (pipeline wiring)

16. **Vitest mock hoisting is the #1 test bug** — use `vi.hoisted()` for shared `vi.fn()` state.
17. **Mock constructors must be `class`, not arrow fns** — `new S3Client(...)` requires `new`-able mock.
18. **`.tsx` extension is mandatory for JSX tests** — oxc throws parse error for JSX in `*.test.ts`.
19. **SSE in Next.js 16** — `ReadableStream` + `text/event-stream` + 2s DB polling. Simpler than Postgres LISTEN/NOTIFY.
20. **`auth()` vs `verifySession()` for API routes** — `verifySession()` throws redirect (wrong for JSON). API routes use `auth()` → null → 401 JSON.
21. **`EventSource` cleanup is non-negotiable** — `useEffect` must return `() => eventSource.close()`.
22. **Image moderation via Replicate safety output is preferred** — zero extra API calls vs. OpenAI vision.
23. **`getProject()` LEFT JOIN videos is cheaper than two queries** — <1ms vs 5-15ms.
24. **`putObject` for pipeline vs `getSignedUploadUrl` for client** — pipeline has Buffer in memory → direct PUT.
25. **TDD exposed 4 latent defects in `assemble-video.ts`** — placeholder Buffer, missing SRT write, missing input options, brittle filter extraction.
26. **Source-reading tests must strip comments** — else docblocks trigger false positives.
27. **husky `prepare` script with `|| true` is intentional** — prevents `pnpm install` failure on first install.
28. **Client components must NEVER import `r2.ts` at module level** — env validation crashes in browser (30 env vars, only `NEXT_PUBLIC_*` exist in browser).
29. **Server-side URL signing pattern** — Server Component computes the value, passes as prop to client component.
30. **`@ffmpeg-installer/ffmpeg` is incompatible with Turbopack** — use system FFmpeg via `getFfmpegPath()`.
31. **`middleware.ts` renamed to `proxy.ts` in Next.js 16** — functionality identical, only filename changes.

### Remediation Sprint 2 (post-review hardening)

32. **`trustHost: true` is mandatory for reverse-proxy deployments** — without it, auth redirects resolve to `AUTH_URL` (often localhost).
33. **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch is a leading indicator of misconfiguration** — env module emits `console.warn`.
34. **`OPENAI_API_KEY.startsWith('sk-')` is NOT too strict** — `sk-proj-*`, `sk-svcacct-*`, `sk-admin-*` all start with `sk-`.
35. **Hardcoded third-party model IDs are an operational liability** — placeholder hash was UUID-format, not Replicate's 64-char hex SHA.
36. **Silent fail-open policies are dangerous** — `moderationSkipped` field + `console.warn` makes bypasses observable.
37. **SSE on Vercel needs both server-side and client-side resilience** — `maxDuration = 800` (Pro/Enterprise GA) + client reconnect with exponential backoff.
38. **`putObject` needs a size guard** — `MAX_PUT_OBJECT_BYTES = 500 MB` (function memory is the real constraint, not R2's 5 GB limit).
39. **`pnpm-workspace.yaml` requires `packages:` field** — even for single-package repos.
40. **CI should run the full quality gate** — lint-staged only checks staged files; CI catches whole-codebase regressions.

### Audit v1 Remediation (T1–T12)

41. **Server Action forms must live in a `"use server"` module** — defining inline in a Server Component page causes build failure. (T1)
42. **Behind a TLS-terminating reverse proxy, `nextUrl.origin` lies** — always use `env.NEXT_PUBLIC_APP_URL` for redirects. (T2)
43. **Idempotency-key-too-early is a silent data-loss anti-pattern** — INSERT the idempotency row AFTER side effects succeed. (T4)
44. **Upstash `fixedWindow` rate limiters can't release on disconnect** — use Redis `SET NX EX` + `DEL` for connection-counting. (T5)
45. **Drizzle transactions can't be nested** — extract a `*Tx(tx, ...)` variant that accepts the transaction handle. (T3)
46. **Source-reading tests must search for `.method()` not `db.method()`** — multiline chains break `indexOf` on the receiver. (T4 test)
47. **TypeScript doesn't preserve `session.user.id` narrowing inside closures** — capture `const userId: string = session.user.id` before the closure. (T5)
48. **`appendVideo` setting `status='completed'` at insert time is a state-machine lie** — use `'rendering'` at insert, `'completed'` on completion. (T8)
49. **Module-load constants make env-configurable behavior untestable per-call** — move the read into a function body. (T9)
50. **Dead exported functions create a second source of truth** — delete dead code. Tests verify the real code path. (T10)
51. **Large mechanical sweeps need scripted `sed`, not manual edits** — Rule of 500: use automation for >500-line refactors. (T11)
52. **`metadataBase` hardcoded to a placeholder breaks social sharing** — use `env.NEXT_PUBLIC_APP_URL`. (T12/L-4)
53. **`Date.now()` temp file names collide under concurrency** — use `crypto.randomUUID()`. (T12/L-3)
54. **`EventSource.close()` is idempotent but sloppy** — set `eventSource = null` after close to guard against double-close. (T12/L-2)
55. **R2 error classification matters for operators** — 502/504/500 lets operators distinguish transient from permanent failures. (T6)

### Post-Audit-v1 Live-Site Validation (2026-06-29)

56. **`console.warn` is insufficient for env misconfigurations in production** — the AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch warning at `src/lib/env/index.ts:217-226` only emits `console.warn`. Behind a reverse proxy, server logs are easily missed. The live site at `storyintovideo.jesspete.shop` exhibited exactly this failure: `NEXT_PUBLIC_APP_URL=http://localhost:3000` caused every auth-protected route (`/dashboard`, `/create`, `/billing`, `/projects/[id]`, `/settings`) to redirect to `http://localhost:3000/sign-in` → `ERR_CONNECTION_REFUSED`. The T2 code fix was correctly deployed (proven by `/api/health` returning the H9 DB+FFmpeg check), but the env var was wrong. **Lesson: production env misconfigurations should fail fast (throw at module load) OR be surfaced via `/api/health` so monitoring catches them.**
57. **Legal pages must not promise features the code doesn't implement** — the Privacy Policy at `src/app/(legal)/privacy/page.tsx` §4 publicly states "You may delete your account at any time, which triggers a CASCADE deletion of all your projects, characters, scenes, voiceovers, videos, and usage events from our database." and §6 lists GDPR rights to Erasure + Portability. No `DELETE /api/user` or `GET /api/user/export` endpoint exists. This is a compliance P0 — the public legal page is making promises the code can't keep. **Lesson: every right promised in legal copy must trace to a working endpoint.** The DB schema already has `onDelete: 'cascade'` on every FK from `users`, so the cascade is wired — only the API surface is missing.
58. **`<a href>` vs `<Link>` drift is easy to miss in source-reading tests** — `src/components/sections/navbar.tsx`, `src/app/(app)/dashboard/page.tsx`, and `src/components/sections/hero.tsx` all use raw `<a href>` for internal routes, directly violating CLAUDE.md's "never use `<a>` for internal routes" rule. The existing `cta-routes.test.ts` verifies the href VALUES (e.g., `/sign-in`, `/create`) but not whether they're rendered as `<a>` or `<Link>`. **Lesson: source-reading tests should assert both the route AND the component type when the distinction matters for performance (full-page reload vs client-side navigation).**
59. **Next.js default 404 inherits root layout metadata** — without a custom `src/app/not-found.tsx`, any unknown URL (e.g., `/pricing`, `/blog`, `/contact` — all linked from nav/footer) returns 200 OK with the marketing page title. This hides broken links from operators and is bad for SEO. **Lesson: always ship a custom `not-found.tsx` with proper metadata + on-brand UX.** Confirmed on live site: `https://storyintovideo.jesspete.shop/pricing` returns 200 with title `StoryIntoVideo - Turn Stories Into Videos with AI`.
60. **Live-site behavioral testing catches what unit tests can't** — the `/dashboard` ERR_CONNECTION_REFUSED issue was only discoverable by hitting the live URL with a browser. Unit tests verify the proxy code uses `env.NEXT_PUBLIC_APP_URL` (correct), but can't catch the operational misconfiguration of that env var on the production server. **Lesson: add a smoke test that hits `/api/health` + `/dashboard` (expecting redirect to `/sign-in` on the SAME host) after every deploy.**

---

## 13. Pitfalls to Avoid

### Architecture Pitfalls

- **Don't put DB access in middleware** — `proxy.ts` runs on Edge runtime; can't reach Postgres.
- **Don't put DB access in components** — use the `queries.ts` boundary.
- **Don't use `force-static` on app routes** — only the marketing page can be static.
- **Don't nest Drizzle transactions** — extract a `*Tx(tx, ...)` variant.
- **Don't make R2 buckets public** — use signed URLs.
- **Don't skip content moderation** — every story input must be moderated (ADR-011).

### TypeScript Pitfalls

- **Don't use `any`** — ESLint will error. Use `unknown` or proper types.
- **Don't use `@ts-ignore` or `@ts-nocheck`** — fix the type error instead.
- **Don't capture narrowed variables inside closures without re-assigning** — TypeScript loses narrowing.
- **Don't use `import { Foo }` for type-only imports** — `verbatimModuleSyntax: true` requires `import type { Foo }`.

### Testing Pitfalls

- **Don't write tests after the code** — TDD: RED → GREEN → REFACTOR.
- **Don't test implementation details** — test behavior, not internal structure.
- **Don't use arrow functions for mock constructors** — use `class` syntax.
- **Don't put JSX in `*.test.ts` files** — rename to `*.test.tsx`.
- **Don't forget to strip comments in source-reading tests** — docblocks trigger false positives.
- **Don't forget `vi.hoisted()` for shared mock state** — `vi.mock()` factories are hoisted.

### Design System Pitfalls

- **Don't use `amber-400`** — use `primary` (the brand token `#febf00`).
- **Don't use `bg-zinc-950`** — use `bg-background` (`#020202`).
- **Don't use `bg-zinc-900`** — use `bg-card` (`#060607`).
- **Don't use `next/font/google` for Outfit** — it can't serve weight 820.
- **Don't use Framer Motion or GSAP** — all animation is CSS-only.
- **Don't use camelCase keyframes** — kebab-case is the convention.
- **Don't add `tailwind.config.ts`** — all tokens in `globals.css` `@theme`.

### Security Pitfalls

- **Don't read `process.env.*` directly** — use the Zod-validated `env` module.
- **Don't wrap `verifySession()` in try/catch** — it throws `NEXT_REDIRECT` which must propagate.
- **Don't trust client-side validation** — always validate at the server boundary.
- **Don't expose stack traces** — return generic error messages to users.
- **Don't use `db push` in production** — always `drizzle-kit generate` + `migrate`.
- **Don't store sessions in localStorage** — use httpOnly cookies.

### Performance Pitfalls

- **Don't import `@/lib/storage/r2` in client components** — env validation crashes in browser.
- **Don't use `@ffmpeg-installer/ffmpeg`** — incompatible with Turbopack.
- **Don't add CDN links** — all assets are self-hosted.
- **Don't use default exports for components** — use named exports.
- **Don't skip the verification chain** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

---

## 14. Best Practices

### Code Organization

- **5-layer architecture** — proxy → app → features → domain → lib. Lower layers never import from higher.
- **Feature-based modules** — `src/features/{auth,projects,pipeline,billing}/` each with `queries.ts`, `actions.ts`, `domain/`.
- **`queries.ts` boundary** — all DB access goes through this file; components never call `db` directly.
- **Domain isolation** — `src/features/*/domain/` contains pure functions with no Next.js or DB runtime imports.
- **Colocated tests** — `src/tests/unit/` and `src/tests/e2e/` (not alongside components).

### TypeScript

- **Strict mode** — `strict: true` + `noUncheckedIndexedAccess` + `verbatimModuleSyntax`.
- **`interface` for object shapes, `type` for unions/intersections** — per project convention.
- **`import type` for type-only imports** — required by `verbatimModuleSyntax`.
- **Early returns** — avoid deeply nested conditionals.
- **Composition over inheritance** — small functions composed together.

### React / Next.js

- **Server Components by default** — only use `'use client'` when browser APIs/state are needed.
- **Auth-first Server Actions** — `verifySession()` is the first call in every Server Action.
- **`auth()` in API routes** — returns null → 401 JSON (not redirect).
- **Suspense for async data** — `<Suspense fallback={<Skeleton />}>` per Next.js 16 `cacheComponents`.
- **Named exports for components** — not default exports.

### Testing

- **TDD: RED → GREEN → REFACTOR** — write a failing test first, then minimum code to pass, then refactor.
- **Test behavior, not implementation** — assert on outcomes, not method call sequences.
- **DAMP over DRY in tests** — each test should read like a specification.
- **Arrange-Act-Assert pattern** — clear structure.
- **One assertion per concept** — each test verifies one behavior.
- **Mock only at boundaries** — real implementations > fakes > stubs > mocks.
- **`vi.hoisted()` for shared mock state** — avoids hoisting bugs.
- **`class` syntax for mock constructors** — arrow fns can't be `new`-ed.
- **`.tsx` extension for JSX tests** — oxc throws parse error otherwise.

### Database

- **Drizzle parameterized queries** — never SQL string concatenation.
- **`ON CONFLICT DO NOTHING` for idempotency** — Inngest retries must not double-insert.
- **`.for('update')` row locks** — race-condition-proof credit debiting.
- **UNIQUE constraints** — `videos.projectId`, `voiceovers.projectId`, `characters(projectId, name)`, `scenes(projectId, order)`.
- **Pooled connection for app, unpooled for migrations** — pooling + DDL is unreliable.
- **`drizzle-kit generate` + `migrate`** — never `db push` in production.

### Security

- **Zod validation at boundaries** — every Server Action input, every env var.
- **bcrypt cost 12** — matches docs (not seed's 10).
- **httpOnly, secure, sameSite cookies** — Auth.js v5 default.
- **Rate limiting** — auth (10/15min/IP), pipeline (5/min/user), SSE (1/user/project slot).
- **Owner checks** — `getProject(projectId, userId)` returns null if not owner.
- **Click-time URL signing** — fresh signed URL per request (H4 fix).
- **Host header validation** — proxy rejects unauthorized Host headers (H6 fix).
- **Fail-closed moderation** — `IMAGE_MODERATION_FAIL_OPEN=false` in production (H8 fix).

### Design

- **Brand tokens everywhere** — `primary`, `background`, `card` (not `amber-400`, `zinc-950`).
- **CSS-only animation** — 13 keyframes, no Framer Motion.
- **Outfit 820 for H1** — self-hosted via `next/font/local`.
- **`prefers-reduced-motion` override** — globally disables animation.
- **WCAG AAA contrast** — body text 12.6:1, primary 15.7:1.
- **44×44px touch targets** — mobile accessibility.

---

## 15. Coding Patterns

### Pattern: Auth-First Server Action

```typescript
export async function createProjectAction(input: z.infer<typeof CreateProjectSchema>): Promise<CreateProjectResult> {
  // 1. AUTH FIRST
  const session = await verifySession({ redirectTo: '/create' });
  const userId = session.user?.id;
  if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };

  // 2. RATE LIMIT (C3)
  const { success: rateLimitOk } = await pipelineRateLimit.limit(userId);
  if (!rateLimitOk) return { success: false, error: 'Too fast', code: 'RATE_LIMITED' };

  // 3. ZOD VALIDATE
  const parsed = CreateProjectSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: '...', code: 'VALIDATION' };

  // 4. CONTENT MODERATION (ADR-011)
  const moderation = await moderateContent(parsed.data.story);
  if (moderation.flagged) return { success: false, error: '...', code: 'FLAGGED' };

  // 5. TRANSACTION (T3: INSERT + debit atomic)
  let projectId: string;
  try {
    projectId = await db.transaction(async (tx) => {
      const [project] = await tx.insert(projects).values({...}).returning({ id: projects.id });
      if (!project) throw new Error('Failed to create project');
      await debitCreditsTx(tx, userId, CREDIT_COSTS.analysis, 'analysis', `${project.id}:analysis`, project.id);
      return project.id;
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) return { success: false, error: err.message, code: 'INSUFFICIENT_CREDITS' };
    throw err;
  }

  // 6. TRIGGER INNGEST (T7: try/catch → setProjectFailed)
  try {
    await inngest.send({ name: PIPELINE_EVENT, data: { projectId } });
  } catch (err) {
    await setProjectFailed(projectId, 'Failed to queue the AI pipeline. Please try again.');
    return { success: false, error: '...', code: 'INTERNAL' };
  }

  // 7. REVALIDATE + REDIRECT
  revalidatePath('/dashboard');
  redirect(`/projects/${projectId}`);
}
```

### Pattern: Idempotent Pipeline Step (C5/C6)

```typescript
await step.run('generate-characters', async () => {
  await updateProjectProgress(projectId, 'generating_characters', 'Generating characters…', 25);
  for (const char of analysis.characters) {
    // C6: Debit BEFORE calling Replicate (deterministic idempotency key)
    const charDebit = await debitCredits(
      project.userId,
      CREDIT_COSTS.character_generation,
      'character_generation',
      `${projectId}:character:${char.name}`,  // per-entity key
      projectId,
    );
    if (charDebit.idempotent) continue;  // already processed — skip

    const result = await generateCharacter({ name: char.name, description: char.description, style: project.style });

    // ADR-011: Moderate every AI-generated image
    const imageModeration = await moderateImage({ imageUrl: result.imageUrl, rawOutput: result.raw });
    if (imageModeration.flagged) {
      await setProjectFailed(projectId, `Character image flagged: ${imageModeration.categories.join(', ')}`);
      throw new Error(`Character image moderation blocked`);
    }

    await appendCharacter(projectId, char.name, char.description, result.imageUrl);
  }
});
```

### Pattern: Click-Time URL Signing (H4 + T6)

```typescript
// Server: API route signs URL at click time
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: projectId } = await params;
  const project = await getProject(projectId, session.user.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!project.videoKey) return NextResponse.json({ error: 'Video not ready' }, { status: 409 });
  try {
    const signedUrl = await getSignedDownloadUrl('videos', project.videoKey);
    return NextResponse.json({ url: signedUrl }, { status: 200 });
  } catch (err) {
    // T6: Classify R2 errors
    const errorName = err instanceof Error ? err.name : 'UnknownError';
    if (errorName.includes('S3') || errorName.includes('NoSuchKey')) return NextResponse.json({ error: 'Storage service error' }, { status: 502 });
    if (errorName.includes('Timeout')) return NextResponse.json({ error: 'Storage timeout' }, { status: 504 });
    return NextResponse.json({ error: 'Storage error' }, { status: 500 });
  }
}

// Client: fetches fresh URL on click (never baked into RSC payload)
async function handleDownload() {
  setState('loading');
  const res = await fetch(`/api/projects/${projectId}/download`);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Failed');
  const { url } = await res.json();
  const a = document.createElement('a');
  a.href = url;
  a.download = `story-${projectId}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setState('success');
}
```

### Pattern: SSE Slot Management (T5)

```typescript
// Server: claim slot on open, refresh on poll, release on abort
const slotClaimed = await claimSseSlot(userId, projectId);
if (!slotClaimed) return NextResponse.json({ error: 'Too many concurrent connections' }, { status: 429 });

const stream = new ReadableStream({
  async start(controller) {
    const interval = setInterval(async () => {
      await refreshSseSlot(userId, projectId);  // T5: keep slot alive
      const current = await readProjectProgress(projectId);
      controller.enqueue(encoder.encode(formatSseMessage(current)));
      if (TERMINAL_STATUSES.has(current.status)) { controller.close(); clearInterval(interval); }
    }, POLL_INTERVAL_MS);

    req.signal.addEventListener('abort', () => {
      clearInterval(interval);
      void releaseSseSlot(userId, projectId);  // T5: release for immediate reconnection
      controller.close();
    });
  },
});

// rate-limit.ts: Redis SET NX EX + DEL + EXPIRE
export async function claimSseSlot(userId: string, projectId: string): Promise<boolean> {
  const result = await redis.set(slotKey(userId, projectId), '1', { ex: 30, nx: true });
  return result === 'OK';
}
export async function releaseSseSlot(userId: string, projectId: string): Promise<void> {
  await redis.del(slotKey(userId, projectId));
}
export async function refreshSseSlot(userId: string, projectId: string): Promise<void> {
  await redis.expire(slotKey(userId, projectId), 30);
}
```

### Pattern: Webhook Idempotency (T4)

```typescript
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${(err as Error).message}` }, { status: 400 });
  }

  // T4: PRE-CHECK (SELECT for duplicate)
  const [existing] = await db.select({ id: usageEvents.id }).from(usageEvents).where(eq(usageEvents.idempotencyKey, event.id)).limit(1);
  if (existing) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case 'checkout.session.completed': { /* side effects */ break; }
      // ... other cases
    }
    // T4: CLAIM — INSERT idempotency row AFTER side effects succeed
    await db.insert(usageEvents).values({ userId: null, type: 'stripe_webhook', cost: 0, idempotencyKey: event.id, metadata: event.id }).onConflictDoNothing({ target: usageEvents.idempotencyKey });
    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: `Webhook handler failed: ${(err as Error).message}` }, { status: 500 });
  }
}
```

### Pattern: Env Module with Build-Context Fallback (ADR-004)

```typescript
function parseEnv(): EnvData {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    // Surface AUTH_URL ↔ NEXT_PUBLIC_APP_URL host mismatches
    const authHost = extractHost(result.data.AUTH_URL);
    const appHost = extractHost(result.data.NEXT_PUBLIC_APP_URL);
    if (authHost && appHost && authHost !== appHost) {
      console.warn(`[env] AUTH_URL host differs from NEXT_PUBLIC_APP_URL host...`);
    }
    return result.data;
  }
  // Build/test fallback — placeholders only
  const isBuildContext = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'test';
  if (isBuildContext) return { /* placeholder values matching schema formats */ };
  // Real runtime with missing/invalid env vars — fail fast
  throw new Error(`\n❌ Invalid environment variables:\n${errors.join('\n')}\n`);
}
```

### Pattern: Source-Reading Test

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('T1: Billing page wires upgrade button to checkoutAction', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'app', '(app)', 'billing', 'page.tsx'), 'utf-8');
  // Strip comments so docblocks don't trigger false positives
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('imports billingCheckoutAction from the billing feature', () => {
    expect(stripped).toMatch(/import\s+\{[^}]*\bbillingCheckoutAction\b[^}]*\}\s+from\s+['"]@\/features\/billing\/actions['"]/);
  });
});
```

---

## 16. Coding Anti-Patterns

| ❌ Don't | ✅ Do |
|---|---|
| Add `tailwind.config.ts` | All tokens in `globals.css` `@theme` |
| Use `next/font/google` for Outfit | Self-host via `next/font/local` (weight 820) |
| Use Framer Motion or GSAP | All animation is CSS-only (13 keyframes) |
| Use camelCase keyframes | Kebab-case is the convention |
| Read `process.env.*` directly | Use the Zod-validated `env` module |
| Wrap `verifySession()` in try/catch | It throws `NEXT_REDIRECT` which must propagate |
| Put DB access in components | Use the `queries.ts` boundary |
| Put DB access in middleware | Middleware runs on Edge runtime |
| Make R2 buckets public | Use signed URLs |
| Skip content moderation | Every story input must be moderated (ADR-011) |
| Use `force-static` on app routes | Only the marketing page can be static |
| Use `any` | ESLint will error. Use `unknown` |
| Add CDN links | All assets are self-hosted |
| Use default exports for components | Use named exports |
| Skip the verification chain | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` |
| Use `db push` in production | Always `drizzle-kit generate` + `migrate` |
| Import `@/lib/storage/r2` in client components | Sign URLs server-side, pass as props |
| Use `@ffmpeg-installer/ffmpeg` | Use system FFmpeg via `FFMPEG_PATH` |
| Use `amber-400` / `bg-zinc-950` | Use brand tokens: `primary` / `background` / `card` |
| Define Server Actions inline in Server Component pages | Put them in a `"use server"` module |
| Use `nextUrl.origin` for redirects behind reverse proxy | Use `env.NEXT_PUBLIC_APP_URL` |
| INSERT idempotency row BEFORE side effects | INSERT AFTER side effects succeed (T4) |
| Use `sseRateLimit.fixedWindow` for SSE | Use `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` (T5) |
| Set `status='completed'` at insert time | Use `'rendering'`; transition to `'completed'` on completion (T8) |
| Read env vars at module load | Read inside function body for testability (T9) |
| Export dead "for testing" functions | Delete them; test the real code path (T10) |
| Use `Date.now()` for temp file names | Use `crypto.randomUUID()` (T12) |
| Use arrow functions for mock constructors | Use `class` syntax |
| Put JSX in `*.test.ts` files | Rename to `*.test.tsx` |
| Nest Drizzle transactions | Extract a `*Tx(tx, ...)` variant |

---

## 17. Responsive Breakpoint Reference

Tailwind v4 default breakpoints (no custom config):

| Token | Min Width | Target Device |
|---|---|---|
| (default) | 0 | Mobile portrait (375px) |
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / laptop |
| `xl` | 1280px | Desktop (matches `max-w-7xl`) |
| `2xl` | 1536px | Large desktop |

### Usage Patterns

```tsx
// Mobile-first: base styles, then override at breakpoints
<h1 className="text-3xl sm:text-4xl lg:text-6xl">

// Grid: 1 col mobile → 2 col tablet → 3 col desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Hide on mobile, show on desktop
<div className="hidden lg:block">

// Max width container
<div className="mx-auto max-w-7xl">
```

### Section-Specific Breakpoints

| Section | Mobile | Desktop |
|---|---|---|
| Navbar | Hamburger → Sheet | Inline links |
| Hero H1 | `text-3xl` | `text-[4.5rem]` |
| Examples carousel | 1 card visible, arrow scroll | Multiple cards visible |
| Workflow | Stacked (media above text) | Alternating (media left/right) |
| Features | 1 column | 4 columns (hairline grid) |
| Testimonials | 1 column | 3 columns |
| Use Cases | 1 column | 2 columns |
| Footer | Stacked columns | 3 columns inline |

---

## 18. Z-Index Layer Map

| Layer | Z-Index | Element |
|---|---|---|
| Skip-to-content (focused) | `z-50` | `<a href="#main" className="... focus:z-50">` |
| Navbar (fixed) | `z-40` | `<nav className="fixed ... z-40">` |
| Mobile nav Sheet | `z-50` | Radix Dialog (Sheet) overlay |
| Language dropdown | `z-40` | Radix DropdownMenu |
| Hero glow (decorative) | (none — `absolute` in flow) | `<div className="absolute ... blur-3xl">` |
| Hero content | `z-10` | `<div className="relative z-10">` |
| Workflow video | (none — in flow) | `<video>` |
| FAQ accordion | (none — in flow) | Radix Accordion |
| Final CTA | (none — in flow) | `<section>` |
| Footer | (none — in flow) | `<footer>` |

**Rule:** Amber CTAs and focus rings don't need z-index — they're in flow. Only fixed/sticky elements and overlays need explicit z-index. The skip-to-content link is `z-50` only when focused (visually hidden otherwise).

---

## 19. Color Reference (Complete)

### Brand Tokens (from `globals.css` `@theme`)

| Token | Hex | Tailwind Class | Usage |
|---|---|---|---|
| `--color-background` | `#020202` | `bg-background` | Page background (near-black, NOT pure #000) |
| `--color-foreground` | `#f8f8f8` | `text-foreground` | Default foreground text |
| `--color-card` | `#060607` | `bg-card` | Card surfaces |
| `--color-card-foreground` | `#f8f8f8` | `text-card-foreground` | Text on cards |
| `--color-popover` | `#0b0b0d` | `bg-popover` | Popover backgrounds |
| `--color-popover-foreground` | `#f8f8f8` | `text-popover-foreground` | Text in popovers |
| `--color-primary` | `#febf00` | `bg-primary` / `text-primary` | CTAs, active states, focus rings (NOT Tailwind amber-400) |
| `--color-primary-foreground` | `#020202` | `text-primary-foreground` | Text on primary (near-black) |
| `--color-secondary` | `#111114` | `bg-secondary` | Secondary surfaces |
| `--color-secondary-foreground` | `#f8f8f8` | `text-secondary-foreground` | Text on secondary |
| `--color-muted` | `#1a1a1d` | `bg-muted` | Muted backgrounds |
| `--color-muted-foreground` | `#8e8e95` | `text-muted-foreground` | Secondary/muted text |
| `--color-accent` | `#febf00` | `bg-accent` / `text-accent` | Accent (same as primary) |
| `--color-accent-foreground` | `#020202` | `text-accent-foreground` | Text on accent |
| `--color-destructive` | `#ff2d39` | `bg-destructive` | Error/destructive actions |
| `--color-destructive-foreground` | `#f8f8f8` | `text-destructive-foreground` | Text on destructive |
| `--color-border` | `#1a1a1d` | `border-border` | Default borders |
| `--color-input` | `#0b0b0d` | `bg-input` | Input backgrounds |
| `--color-ring` | `#febf0080` | `ring-ring` | Focus rings (50% opacity primary) |

### Chart Palette (reserved for future dashboard)

| Token | Hex |
|---|---|
| `--color-chart-1` | `#febf00` (amber) |
| `--color-chart-2` | `#00aa6f` (green) |
| `--color-chart-3` | `#8d92f9` (purple) |
| `--color-chart-4` | `#f14d4c` (red) |
| `--color-chart-5` | `#7bc27e` (light green) |

### Body Text Colors (Tailwind utilities, not @theme tokens)

| Usage | Hex | Tailwind Class |
|---|---|---|
| Body paragraph text | `#d4d4d8` | `text-zinc-300` |
| Muted secondary text | `#8e8e95` | `text-muted-foreground` |
| Tertiary text | `#71717a` | `text-zinc-500` |
| Disabled text | `#52525b` | `text-zinc-600` |

### WCAG Contrast Ratios

| Foreground | Background | Ratio | Level |
|---|---|---|---|
| `#020202` (primary-foreground) | `#febf00` (primary) | 15.7:1 | AAA |
| `#d4d4d8` (zinc-300 body) | `#020202` (background) | 12.6:1 | AAA |
| `#f8f8f8` (foreground) | `#020202` (background) | 17.4:1 | AAA |
| `#8e8e95` (muted-foreground) | `#020202` (background) | 5.2:1 | AA |
| `#f8f8f8` (destructive-foreground) | `#ff2d39` (destructive) | 5.9:1 | AA |

### The Singular Purple Exception

The Examples carousel hover gradient (`from-yellow-500 to-purple-500`) is the **ONLY purple on the entire site**. It exists as a deliberate surprise — a moment of color rebellion in an otherwise monochrome+amber palette. Do not add purple anywhere else.

---

## 20. The Complete TypeScript Interface Reference

All marketing interfaces live in `src/types/index.ts` (12 interfaces):

```typescript
import type { LucideIcon } from 'lucide-react';

/** Navigation link in the Navbar (desktop + mobile Sheet). */
export interface NavLink {
  label: string;
  href: string;
}

/** Story example chip in the Hero — clicking populates the textarea. */
export interface StoryExample {
  label: string;
  /** The multi-paragraph seed text injected into the textarea on click. */
  seed: string;
}

/** Aspect ratio toggle button in the Hero (9:16 portrait or 16:9 landscape). */
export interface AspectRatio {
  label: '9:16' | '16:9';
  value: 'portrait' | 'landscape';
}

/** Portrait example card in the Examples carousel. */
export interface ExampleCard {
  id: string;
  title: string;
  /** Style tag shown below the title (e.g., "Anime · Romance"). */
  styleTag: string;
  /** Path to the 9:16 WebP thumbnail in /public/examples/. */
  thumbnail: string;
  href: string;
}

/** One of the 4 alternating media/text rows in the Workflow section. */
export interface WorkflowStep {
  number: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  /** Path to the looping MP4 demo in /public/workflow/. */
  videoSrc: string;
  /** Path to the WebP poster shown before the video loads. */
  videoPoster: string;
  /** Desktop layout: which side the media sits on. Mobile always stacks media-above-text. */
  mediaPosition: 'left' | 'right';
}

/** One of the 8 items in the Features 4×2 hairline grid. */
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** One of the 6 testimonial cards in the Testimonials 3×2 grid. */
export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  /** 2-letter initials rendered in the amber gradient avatar (e.g., "SK"). */
  initials: string;
}

/** One of the 4 use case cards in the UseCases 2×2 grid. */
export interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

/** One of the 6 items in the FAQ Radix Accordion. */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

/** A single link in the Footer. */
export interface FooterLink {
  label: string;
  href: string;
}

/** A titled column of links in the Footer. */
export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/** A chip in the Hero style tags marquee. */
export interface StyleChip {
  label: string;
  /** Optional smaller sublabel (only "Cyberpunk" uses this: "Futuristic neon"). */
  sublabel?: string;
}
```

### Pipeline Domain Interfaces

```typescript
// src/features/pipeline/domain/assemble-video.ts
export interface AssembleVideoInput {
  sceneImageUrls: string[];
  sceneDurations: number[];      // seconds per scene
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

### Pipeline Query Interfaces

```typescript
// src/features/pipeline/queries.ts
export interface AppendResult<T> {
  inserted: boolean;
  row: T | null;
}

export type ProjectStatus = (typeof projects.status.enumValues)[number];
// = 'draft' | 'pending' | 'analyzing' | 'generating_characters' | 'generating_scenes'
//   | 'synthesizing_voice' | 'aligning_subtitles' | 'assembling_video' | 'completed' | 'failed'
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

### Database Schema (8 Enums)

```typescript
// src/lib/db/schema/projects.ts
export const projectStatusEnum = pgEnum('project_status', [
  'draft', 'pending', 'analyzing', 'generating_characters', 'generating_scenes',
  'synthesizing_voice', 'aligning_subtitles', 'assembling_video', 'completed', 'failed',
]);

export const visualStyleEnum = pgEnum('visual_style', [
  'ghibli', 'medieval', 'oil-painting', 'anime', 'japanese-animation',
  'realistic', 'cyberpunk', 'watercolor', 'comic',
]);

export const aspectRatioEnum = pgEnum('aspect_ratio', ['portrait', 'landscape']);

// src/lib/db/schema/media.ts
export const videoStatusEnum = pgEnum('video_status', ['pending', 'rendering', 'completed', 'failed']);
export const videoResolutionEnum = pgEnum('video_resolution', ['720p', '1080p', '4k']);

// src/lib/db/schema/billing.ts
export const planEnum = pgEnum('plan', ['free', 'creator', 'pro', 'studio']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid',
]);
export const usageEventTypeEnum = pgEnum('usage_event_type', [
  'analysis', 'character_generation', 'scene_generation', 'voiceover',
  'subtitle_alignment', 'video_assembly', 'moderation_check', 'stripe_webhook',
]);
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
// Total: 30 env vars (27 required + 3 optional: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, IMAGE_MODERATION_FAIL_OPEN)
```

---

## Appendix: ADRs (Architecture Decision Records)

The engineering blueprint (`PRODUCTION_READINESS_PLAN.md`) defines 11 ADRs. The 6 most-referenced:

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

## Appendix: The 6-Step AI Pipeline (Credit Costs)

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

*End of Skill Reference v7.0.0. For the complete remediation history, see `AUDIT_REPORT_v1.md` + `REMEDIATION_PLAN_v1.md` + `worklog.md`.*

---

## Appendix: Post-Audit-v1 Live-Site Validation (2026-06-29)

This appendix documents the live-site behavioral testing methodology used to validate the audit-v1 remediation against the actual deployment at `https://storyintovideo.jesspete.shop/`. It serves as a template for future post-deploy validations.

### Methodology: `agent-browser` E2E on Live Site

Use the `agent-browser` CLI to drive a headless Chromium against the live URL. This catches operational misconfigurations that unit tests (which run against the source code) cannot detect.

```bash
# Open the live site
agent-browser open https://storyintovideo.jesspete.shop/
agent-browser wait --load networkidle
agent-browser get title   # verify metadata
agent-browser snapshot -i # capture interactive elements

# Test public routes (should return 200)
for route in / /sign-in /sign-up /privacy /terms; do
  agent-browser open "https://storyintovideo.jesspete.shop${route}"
  agent-browser wait 2000
  agent-browser get url   # verify no redirect
  agent-browser get title # verify route-specific metadata
done

# Test protected routes (should 307 redirect to /sign-in on SAME host)
for route in /dashboard /create /billing /projects/abc123 /settings; do
  agent-browser open "https://storyintovideo.jesspete.shop${route}"
  agent-browser network requests --filter "sign-in" # inspect redirect target
done

# Test API health endpoint
agent-browser open https://storyintovideo.jesspete.shop/api/health
agent-browser eval "document.body.innerText"  # verify JSON response
```

### Validated Findings (2026-06-29)

| Test | Expected | Actual | Status |
|---|---|---|---|
| `GET /` marketing page | 10 sections render, H1 has 3-line `<br>` stack, Outfit 820 | All 10 sections render, H1 HTML is `Turn<br>Story Into Video<br>with AI Magic` with `style="font-weight:820"` | ✅ |
| `GET /sign-in` | AuthForm with Google + email/password | Renders correctly | ✅ |
| `GET /sign-up` | AuthForm in sign-up mode | Renders correctly | ✅ |
| `GET /privacy` | Server Component, AI-specific clauses | Returns 200 with correct title | ✅ |
| `GET /terms` | Server Component | Returns 200 with correct title | ✅ |
| `GET /api/health` | 200 JSON `{status:'healthy', services:{database, ffmpeg}}` (H9) | `{"status":"healthy","timestamp":"2026-06-29T22:49:21.817Z","services":{"database":"healthy","ffmpeg":"healthy"}}` | ✅ H9 fix deployed |
| `GET /dashboard` (unauth) | 307 redirect to `/sign-in?callbackUrl=%2Fdashboard` on canonical HTTPS host | **307 redirect to `http://localhost:3000/sign-in?callbackUrl=%2Fdashboard`** → browser `ERR_CONNECTION_REFUSED` | 🔴 Operational misconfig |
| `GET /create` (unauth) | Same as above | Same `localhost:3000` redirect | 🔴 Operational misconfig |
| `GET /billing` (unauth) | Same as above | Same `localhost:3000` redirect | 🔴 Operational misconfig |
| `GET /projects/abc123` (unauth) | Same as above | Same `localhost:3000` redirect | 🔴 Operational misconfig |
| `GET /settings` (unauth) | Same as above | Same `localhost:3000` redirect | 🔴 Operational misconfig |
| `GET /pricing`, `/blog`, `/contact` | 404 (documented as "not yet implemented") | Returns 200 with marketing-page title (no custom `not-found.tsx`) | ⚠️ Documented gap |

### Root-Cause Diagnosis: The `/dashboard` Failure

Network inspection reveals the proxy emits this redirect:

```
307 Location: http://localhost:3000/sign-in?callbackUrl=%2Fdashboard
```

This is **NOT** the C-2 code bug (`nextUrl.origin`). The codebase at `src/proxy.ts:71` correctly uses `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)` and the URL-encoded `callbackUrl=%2F...` query param proves the T2 fix is deployed.

**Root cause: operational misconfiguration of the `NEXT_PUBLIC_APP_URL` env var on the production server.** It's set to `http://localhost:3000` instead of `https://storyintovideo.jesspete.shop`.

This is precisely the failure mode the env module's host-mismatch warning at `src/lib/env/index.ts:217-226` was designed to surface — but since it's a `console.warn` (not a throw), the app still boots and the warning likely went unnoticed in server logs.

### The 5 New Findings (added to Outstanding Issues in v7.0.0)

1. **Privacy Policy publicly promises unimplemented GDPR endpoints** (Critical) — §4 Data Retention + §6 Your Rights promise `DELETE /api/user` + `GET /api/user/export` that don't exist. Compliance P0.
2. **Production env var misconfiguration goes silently undetected** (Critical) — `console.warn` is insufficient; needs fail-fast OR `/api/health` surface.
3. **Navbar + dashboard + hero use raw `<a href>` instead of `next/link`** (High) — 9 places across 3 files. Violates "never use `<a>` for internal routes" rule.
4. **No custom `not-found.tsx` page** (High) — default 404 inherits root layout metadata → 200 OK with marketing title on dead links.
5. **`/pricing`, `/blog`, `/contact` routes don't exist** (Medium) — linked from nav/footer but no handlers; without `not-found.tsx` they return 200 OK.

### Post-Deploy Smoke Test (add to CI/CD runbook)

After every deploy, run this 30-second smoke test:

```bash
# 1. Health check (DB + FFmpeg)
curl -s https://storyintovideo.jesspete.shop/api/health | jq .status
# Expected: "healthy"

# 2. Auth redirect check (must redirect to /sign-in on SAME host, NOT localhost)
curl -sI https://storyintovideo.jesspete.shop/dashboard | grep -i location
# Expected: Location: https://storyintovideo.jesspete.shop/sign-in?callbackUrl=%2Fdashboard
# If it says localhost:3000, NEXT_PUBLIC_APP_URL is misconfigured

# 3. Marketing page renders
curl -s https://storyintovideo.jesspete.shop/ | grep -c 'font-weight:820'
# Expected: 1 (the H1 hero headline)
```

If any check fails, roll back the deploy or fix the env var before announcing the release.
