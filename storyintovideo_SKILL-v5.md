# StoryIntoVideo — Complete Skill Reference

> **Version:** 5.0.0 (Post-Remediation Sprint 3 — supersedes v1-v4)
> **Date:** 2026-06-28
> **Status:** Production-ready codebase. 377 unit tests + 48 E2E tests, all GREEN.
> **Maintainer:** Frontend Architect & Avant-Garde UI Designer

This document is the **canonical skill file** for the StoryIntoVideo project. It distills every design decision, architectural pattern, gotcha, lesson learned, and validation checkpoint into a single reference that any coding agent can use to replicate, extend, or debug this codebase with fidelity.

**Remediation Sprint 3 (v5.0.0) closed 17 issues across 6 phases:**
- 🔴 C1: Sign-up flow fixed (new `signUpAction` server action)
- 🔴 C2: IP-Adapter placeholder warning in production
- 🔴 C3: Rate limiting implemented (Upstash Ratelimit: auth, pipeline, SSE)
- 🔴 C4: `createProjectAction` now inserts project BEFORE debiting credits
- 🔴 C5: Idempotent `debitCredits()` via `ON CONFLICT DO NOTHING` + `.for('update')` row lock
- 🔴 C6: ALL 6 pipeline steps now debit credits (was 4/6 — 60% revenue leak fixed)
- 🟠 H1: `FFMPEG_PATH` moved into Zod env schema (was `process.env.*`)
- 🟠 H3: Style chip enum aligned with marketing marquee (added `medieval` + `japanese-animation`)
- 🟠 H4: Click-time R2 URL signing via `/api/projects/[id]/download` (replaced SSR-time `SignedDownloadWrapper`)
- 🟠 H6: Proxy host header validation + `/projects/:path*` matcher
- 🟠 H7: Stripe webhook idempotency via `ON CONFLICT` (replaced TOCTOU SELECT-then-INSERT)
- 🟠 H8: `IMAGE_MODERATION_FAIL_OPEN` defaults to `'false'` (fail-closed) in production
- 🟠 H9: Health endpoint now checks DB + FFmpeg
- 🟠 H10: Row lock `.for('update')` now test-verified
- 🟡 M1: UNIQUE constraints on `videos/voiceovers.projectId` + `characters(projectId,name)` + `scenes(projectId,order)`
- 🟡 M2: Hero story length 500→5000 (matches server schema)
- 🟡 M4: Whisper `language` param (defaults `'en'`)

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
4. **IMPLEMENT** — Modular, tested components. Test each before integration.
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
| Node | — | `>=20.0.0` | — |

### Environment Variables (31 total, Zod-validated)

The env module at `src/lib/env/index.ts` is the **single source of truth**. Never read `process.env.*` directly — always `import { env } from '@/lib/env'`. (H1 fix: `FFMPEG_PATH` is now in the Zod schema, not read via `process.env` directly.)

**Critical env rules:**
1. The Zod schema validates at module load. Typos like `GOOGLE_CLIENTID` (missing underscore) silently return `undefined` and disable OAuth.
2. Build-context fallback: when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`, the module returns placeholders instead of throwing. This allows `next build` to succeed without real env vars.
3. At runtime (dev server, production), real env vars MUST be set — the app fails fast with a descriptive error.
4. `IMAGE_MODERATION_FAIL_OPEN` is in the Zod schema as `z.enum(['true','false']).optional().default(process.env.NODE_ENV === 'production' ? 'false' : 'true')` — **H8 fix: defaults to fail-closed (`'false'`) in production; `'true'` in dev/test.** Case-sensitive, catches typos like "True" or "maybe".
5. `FFMPEG_PATH` is in the Zod schema as `z.string().optional().default('/usr/bin/ffmpeg')` — **H1 fix: was previously read via `process.env.FFMPEG_PATH` directly in `assemble-video.ts`, bypassing validation.**

**Env var categories:**
- Database (2): `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct, for migrations)
- Auth (3): `AUTH_SECRET` (≥32 chars, no known-weak values), `AUTH_URL`, `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (optional, both required to enable)
- AI Providers (3): `OPENAI_API_KEY` (starts with `sk-`), `REPLICATE_API_TOKEN` (starts with `r8_`), `ELEVENLABS_API_KEY`
- Replicate Models (2, optional): `REPLICATE_SDXL_MODEL`, `REPLICATE_SDXL_IPADAPTER_MODEL` — both validate `owner/model:sha` format. **C2 fix: `replicate.ts` emits `console.warn` in production when `REPLICATE_SDXL_IPADAPTER_MODEL` equals the SDXL base placeholder hash.**
- Image Moderation (1, optional): `IMAGE_MODERATION_FAIL_OPEN` — `z.enum(['true','false'])`, **H8 fix: default depends on `NODE_ENV`** (`'false'` in production, `'true'` in dev)
- Stripe (3): `STRIPE_SECRET_KEY` (starts with `sk_`), `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_`)
- R2 (6): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_UPLOADS`, `R2_BUCKET_GENERATED`, `R2_BUCKET_VIDEOS`
- Inngest (2): `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- Email (1): `RESEND_API_KEY` (starts with `re_`)
- Rate Limiting (2): `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — **C3 fix: now used by `src/lib/rate-limit.ts`** (was in schema but unused before)
- Monitoring (1): `SENTRY_DSN`
- App (2): `NEXT_PUBLIC_APP_URL`, `NODE_ENV`
- FFmpeg (1, optional): `FFMPEG_PATH` (default `/usr/bin/ffmpeg`) — **H1 fix: now in the Zod schema**

---

## 3. Bootstrapping & Configuration

### From-Scratch Setup

```bash
# Clone and install
git clone <repository-url>
cd story-into-video
pnpm install                    # Activates husky via `prepare` script

# Configure environment
cp .env.example .env.local      # Copy env template
# Edit .env.local with real credentials (31 env vars)

# Set up the database
pnpm drizzle:generate           # Create migration SQL from schema
pnpm drizzle:migrate            # Apply migrations to Neon (needs DATABASE_URL_UNPOOLED)
# ⚠️ 4 new migrations (0001-0004) from the remediation sprint must be applied.
# ⚠️ Migration 0001 requires pre-cleanup: DELETE duplicate video/voiceover rows first:
#   DELETE FROM videos WHERE id NOT IN (SELECT MIN(id) FROM videos GROUP BY project_id);
#   DELETE FROM voiceovers WHERE id NOT IN (SELECT MIN(id) FROM voiceovers GROUP BY project_id);

# Download marketing assets (NOT version-controlled)
./scripts/download-assets.sh    # Workflow videos + posters from R2 (idempotent)
./scripts/generate-thumbnails.sh # 6 example thumbnails (optional)

# Run development server (Turbopack, port 3000)
pnpm dev
```

### Configuration Files (Exact)

#### `tsconfig.json` — Strict Mode

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "incremental": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "exclude": ["node_modules", "skills", "docs"]
}
```

**Critical flags:**
- `strict: true` — all strict type checks
- `noUncheckedIndexedAccess: true` — `array[0]` returns `T | undefined` (forces null checks)
- `verbatimModuleSyntax: true` — `import type` required for type-only imports
- `noUnusedLocals` + `noUnusedParameters` — catches dead code at compile time

#### `next.config.ts` — Security Headers + Image Formats

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ['storyintovideo.jesspete.shop', '192.168.2.132'],
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

#### `eslint.config.mjs` — Flat Config (ESLint 9+)

Key rules:
- `@typescript-eslint/no-explicit-any: error` — zero `any`, use `unknown`
- `@typescript-eslint/consistent-type-imports: error` — `import type` enforced
- `react-hooks/exhaustive-deps: warn`
- `next lint` is deprecated in Next.js 16 — use `eslint .` directly

#### `drizzle.config.ts` — Migration Config

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

**Critical:** Uses `DATABASE_URL_UNPOOLED` (direct Neon connection) because DDL operations are unreliable over the pooled PgBouncer connection. NEVER use `drizzle-kit push` in production — always `generate` + review + `migrate`.

#### `postcss.config.mjs` — Tailwind v4

```javascript
const config = { plugins: { '@tailwindcss/postcss': {} } };
export default config;
```

No `tailwind.config.ts` — Tailwind v4 is CSS-first. All tokens live in `globals.css` `@theme` block.

#### `pnpm-workspace.yaml` — Build Script Approval (pnpm 10.26+)

```yaml
packages:
  - '.'
allowBuilds:
  esbuild: true
  protobufjs: true
  sharp: true
  unrs-resolver: true
```

**Critical:** Use `allowBuilds` (map syntax, pnpm 10.26+), NOT `onlyBuiltDependencies` (array syntax, removed in pnpm 11). The engine floor in `package.json` is `pnpm >=10.26.0` to match.

#### `components.json` — shadcn/ui Config

```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/app/globals.css", "baseColor": "zinc", "cssVariables": true },
  "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/lib/hooks" },
  "iconLibrary": "lucide"
}
```

Note: shadcn CLI timed out during initial setup — the 4 UI primitives (`button`, `accordion`, `sheet`, `dropdown-menu`) are hand-written following the new-york style.

### Build & Quality Commands

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build (hybrid: static + dynamic)
pnpm start        # Serve built output
pnpm lint         # eslint . (flat config)
pnpm typecheck    # tsc --noEmit (strict + noUncheckedIndexedAccess)
pnpm test         # vitest run — 377 tests across 43 files (jsdom env)
pnpm test:e2e     # playwright test — 48 tests (Chromium, auto-starts dev)
pnpm format       # prettier --write
pnpm format:check # prettier --check
pnpm drizzle:generate   # Create migration SQL from schema diff (uses dotenv -e .env.local)
pnpm drizzle:migrate    # Apply migrations (needs DATABASE_URL_UNPOOLED)
pnpm drizzle:studio     # Open schema browser
```

**Pre-commit chain:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

**husky + lint-staged:** automatically runs ESLint + Prettier on staged `.ts/.tsx` files via `.husky/pre-commit`. The `prepare: "husky || true"` script is intentional — the `|| true` prevents `pnpm install` from failing on first install.

---

## 4. The Design System (Code-First)

### The `@theme` Block (Complete)

All design tokens live in `src/app/globals.css` inside a single `@theme { ... }` block. This is Tailwind v4's CSS-first configuration — no `tailwind.config.ts` exists.

#### Color Palette (field-verified from live site)

```css
@theme {
  --color-background: #020202;          /* near-black, warm-neutral — NOT pure #000 */
  --color-foreground: #f8f8f8;
  --color-card: #060607;
  --color-card-foreground: #f8f8f8;
  --color-popover: #0b0b0d;
  --color-popover-foreground: #f8f8f8;
  --color-primary: #febf00;             /* amber — NOT Tailwind amber-400 (#fbbf24) */
  --color-primary-foreground: #020202;
  --color-secondary: #111114;
  --color-secondary-foreground: #f8f8f8;
  --color-muted: #1a1a1d;
  --color-muted-foreground: #8e8e95;    /* zinc-400 equivalent */
  --color-accent: #febf00;
  --color-accent-foreground: #020202;
  --color-destructive: #ff2d39;
  --color-destructive-foreground: #f8f8f8;
  --color-border: #1a1a1d;
  --color-input: #0b0b0d;
  --color-ring: #febf0080;              /* amber at 50% opacity */

  /* Chart palette (reserved for future dashboard) */
  --color-chart-1: #febf00;
  --color-chart-2: #00aa6f;
  --color-chart-3: #8d92f9;
  --color-chart-4: #f14d4c;
  --color-chart-5: #7bc27e;
}
```

⚠️ **Critical:** `#febf00` ≠ Tailwind's `amber-400` (`#fbbf24`). These are different colors. Use the custom `--color-primary` token, never `text-amber-400` for the brand amber.

#### Typography

```css
@theme {
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace;
  --font-heading: var(--font-outfit), ui-sans-serif, system-ui, sans-serif;
}
```

| Role | Font | Weight | Key Class | Source |
|---|---|---|---|---|
| H1 (hero) | Outfit | **820** | `font-heading text-[4.5rem] tracking-[-0.04em]` + `style={{ fontWeight: 820 }}` | `next/font/local` (self-hosted woff2) |
| H2 (sections) | Outfit | 700 | `font-heading` via `@utility section-heading` (clamp 2rem→3rem) | `next/font/local` |
| Body | Geist Sans | 400 | `font-sans text-lg` | `geist` npm package |
| Ratio toggles, counters | Geist Mono | 400 | `font-mono text-[10px]` | `geist` npm package |

**Outfit weight 820** is the critical detail. Google Fonts API only serves discrete weights (100, 200, ..., 900). Weight 820 is an intermediate value that requires the self-hosted variable font (`public/fonts/Outfit-VariableFont.woff2`, 45KB, weight range 100-900). The font config in `src/lib/fonts.ts`:

```typescript
const outfit = localFont({
  src: '../../public/fonts/Outfit-VariableFont.woff2',
  weight: '100 900',           // full variable range
  variable: '--font-outfit',
  display: 'swap',
});
```

The H1 applies the weight via inline style: `style={{ fontWeight: 820 }}`.

#### Border Radius

```css
--radius: 0.75rem;
--radius-sm: calc(0.75rem - 4px);
--radius-md: calc(0.75rem - 2px);
--radius-lg: 0.75rem;
--radius-xl: 1rem;
--radius-2xl: 1.25rem;   /* used by glass-input */
```

#### Shadows

```css
--shadow-hero-input: 0 20px 80px rgba(0, 0, 0, 0.6);        /* glass-input base */
--shadow-eyebrow-glow: 0 0 30px rgba(234, 179, 8, 0.1);     /* eyebrow badge */
--shadow-cta-glow: 0 0 40px rgba(251, 191, 36, 0.3);        /* CTA hover */
```

### The 13 Keyframes (All CSS, All Kebab-Case)

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

  @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes float { 0%, 100% { transform: translateY(0) rotate(var(--card-rotate, 0deg)); } 50% { transform: translateY(-12px) rotate(var(--card-rotate, 0deg)); } }
  @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); } 50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.5); } }
  @keyframes border-glow { 0%, 100% { border-color: rgba(245, 184, 0, 0.08); } 50% { border-color: rgba(245, 184, 0, 0.2); } }
  @keyframes composite-pulse-text { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes btn-shimmer { 0% { transform: translate(-100%); } 100% { transform: translate(100%); } }
  @keyframes grid-shimmer { 0% { transform: translate(-20%, -30%); } 50% { transform: translate(70%, 40%); } 100% { transform: translate(-20%, -30%); } }
  @keyframes grid-sweep-h { 0% { transform: translate(-600px); } 100% { transform: translate(calc(600px + 100vw)); } }
  @keyframes grid-sweep-v { 0% { transform: translateY(-500px); } 100% { transform: translateY(calc(500px + 100vh)); } }
  @keyframes scanline-scroll { 0% { background-position-x: 0; } 100% { background-position-x: 30px; } }
  @keyframes lang-dropdown-in { 0% { opacity: 0; transform: translateY(-4px) scale(0.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
}
```

**Critical:** All keyframe names are kebab-case (not camelCase). The `@keyframes` blocks MUST be nested inside `@theme {}` for Tailwind v4 to emit them as CSS.

### The 7 `@utility` Classes

Tailwind v4's `@utility` directive replaces v3's `@layer components` + `@layer utilities` pattern.

#### 1. `scrollbar-hide` — Hide scrollbar for carousels

```css
@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
```

#### 2. `marquee-mask` — Fade edges of the style chips ticker

```css
@utility marquee-mask {
  -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}
```

#### 3. `marquee-track` — Infinite horizontal scroll, pauses on hover

```css
@utility marquee-track {
  display: flex;
  gap: 0.5rem;
  width: max-content;
  animation: var(--animate-marquee-scroll);
  &:hover { animation-play-state: paused; }
  @media (max-width: 640px) { animation-duration: 30s; }
}
```

#### 4. `glass-input` — Hero story textarea wrapper (the signature widget)

```css
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

  @media (min-width: 640px) { padding: 1.5rem; }
  &:hover { border-color: rgb(255 255 255 / 0.12); }
  &:focus-within {
    border-color: rgb(251 191 36 / 0.3);
    box-shadow: var(--shadow-hero-input), 0 0 30px rgb(251 191 36 / 0.1);
  }
}
```

#### 5. `eyebrow` — Amber badge with ambient glow

```css
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
```

#### 6. `section-heading` — H2 fluid clamp

```css
@utility section-heading {
  font-family: var(--font-heading);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #ffffff;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.1;
}
```

#### 7. `cta-amber` — Tier-4 solid amber pill (the conversion crescendo)

```css
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
```

### CTA Hierarchy (4 Tiers — Amber is Rationed)

The design system has a deliberate 4-tier CTA hierarchy. Amber assertiveness increases with conversion intent:

| Tier | Component | Class | Usage | Amber Usage |
|---|---|---|---|---|
| 1 (most restrained) | `CtaGhost` | `text-amber-400 hover:text-amber-300` | Workflow steps, Features, Testimonials, UseCases | Text only |
| 2 | Glass pill (Hero) | `bg-gradient-to-r from-zinc-800 to-zinc-900 text-amber-300` | Hero "Start Creating" | Text only |
| 3 | `CtaGradient` | `bg-gradient-to-r from-amber-400 to-amber-500` | Examples "Clone this project for free" | Gradient fill |
| 4 (most assertive) | `CtaAmber` | `cta-amber` @utility (solid `bg-amber-400`) | FinalCTA "Start Creating — It's Free" | Solid fill |

**Rule:** `cta-amber` (solid amber) appears ONLY on the FinalCTA. Using it elsewhere dilutes the conversion crescendo.

### The `@source` Directives

```css
@source '../components/**/*.{ts,tsx}';
@source '../lib/**/*.{ts,tsx}';
```

These tell Tailwind v4 to scan `components/` and `lib/` for class usage. The `app/` directory is auto-scanned. These directives are technically optional in Tailwind v4 (automatic content detection handles standard paths), but keeping them is harmless and explicit.

### Reduced Motion Override

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;   /* NOT 0ms — preserves animationend events */
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .marquee-track { animation: none !important; }
  video[autoplay] { display: none; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

**Critical:** Use `0.01ms`, NOT `0ms`. The reason: `0ms` can cause some browsers to skip `animationend`/`transitionend` events, breaking JavaScript that listens for animation completion. The `0.01ms` value is effectively instantaneous but preserves event dispatch.

---

## 5. Component Architecture & Patterns

### Marketing Page Composition (10 Sections, Fixed Order)

The marketing page (`src/app/page.tsx`) composes 10 sections in a fixed top-to-bottom order:

```
1. Navbar     ('use client' — scroll-aware + mobile Sheet)
2. Hero       ('use client' — video bg + glass input + style marquee)
3. Examples   ('use client' — carousel with arrow handlers)
4. Workflow   ('use client' — video loading state + 4 alternating rows)
5. Features   (server — 4×2 hairline grid, hover accent bar)
6. Testimonials (server — 3×2 grid, initials avatars)
7. Use Cases  (server — 2×2 grid, corner glow on hover)
8. FAQ        ('use client' — Radix Accordion)
9. Final CTA  (server — dot-grid bg, amber CTA pill)
10. Footer    (server — 3 link columns + copyright)
```

### Client vs. Server Component Decision Tree

A component is `'use client'` ONLY when it needs:
- `useState`, `useEffect`, or browser APIs
- Event handlers (`onClick`, `onChange`, etc.)
- Custom hooks that use browser APIs (`useScrolled`, `useReveal`, `useReducedMotion`, `useProjectProgress`)

Everything else is a Server Component by default. Note: **composing a client component makes the parent client too** — `Features`, `Testimonials`, `UseCases` are technically server components but become client via composing `ScrollReveal`.

### Hero — The 4-Layer Cinematic Composition

The Hero (`src/components/sections/hero.tsx`) is the signature component. It has 4 stacked layers:

```tsx
<section className="relative flex flex-col overflow-hidden bg-zinc-950">
  {/* Layer 1: Background video + overlays */}
  <div className="absolute inset-0 z-0" aria-hidden="true">
    <video autoPlay muted loop playsInline preload="metadata" poster="/hero-poster.webp"
      className="h-full w-full object-cover opacity-100 transition-opacity duration-1000">
      <source src="/hero-bg.mp4" type="video/mp4" />
    </video>
    {/* Vertical scrim */}
    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-zinc-950/70 to-zinc-950/80" />
    {/* Radial amber glow */}
    <div className="absolute top-[20%] left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full opacity-30 blur-[60px]"
      style={{ background: 'radial-gradient(rgba(251,191,36,0.12),rgba(0,0,0,0) 65%)' }} />
  </div>

  {/* Layer 2: Content */}
  <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-32 pb-6 text-center">
    <span className="eyebrow mb-8 animate-[fade-in-up_0.6s_ease-out_0.05s_both]">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      AI-Powered Story Into Video
    </span>
    <h1 className="font-heading mb-6 animate-[fade-in-up_0.6s_ease-out_0.1s_both] text-4xl ... lg:text-[4.5rem]"
      style={{ fontWeight: 820 }}>
      Turn<br />
      Story Into Video<br />
      with AI Magic
    </h1>
    <p className="mb-10 ...">
      Paste your story and AI handles the rest — characters, storyboards, voiceover, and a
      finished video in minutes.
    </p>
    <div className="glass-input">...</div>
  </div>

  {/* Layer 3: Style tags marquee */}
  <div className="relative z-10 mt-10 ...">
    <div className="marquee-mask overflow-hidden py-4">
      <div className="marquee-track">
        {[...STYLE_CHIPS, ...STYLE_CHIPS].map(...)}
      </div>
    </div>
  </div>

  {/* Layer 4: Bottom fade */}
  <div className="relative z-0 h-8 bg-gradient-to-b from-transparent to-zinc-950 sm:h-12" aria-hidden="true" />
</section>
```

**Critical details:**
1. The H1 is a **3-line cinematic stack** ("Turn" / "Story Into Video" / "with AI Magic") using 2 `<br />` tags. A prior implementation collapsed this to 2 lines, losing the poster-quality effect.
2. The subtitle emphasizes OUTPUT ("a finished video in minutes"), not PROCESS ("subtitles, all generated"). This is the stronger value proposition.
3. The style chips marquee duplicates the array (`[...STYLE_CHIPS, ...STYLE_CHIPS]`) for a seamless `translateX(-50%)` infinite loop.
4. The character counter uses `font-mono text-[10px]` and turns amber at ≥450 chars (90% of the 500-char cap).

### Features — The Hairline Grid (Anti-Card-Grid)

The Features section (`src/components/sections/features.tsx`) explicitly rejects boxed cards:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {FEATURES.map((feature, idx) => {
    const isLgRightColumn = (idx + 1) % 4 === 0;
    const isLgBottomRow = idx >= 4;
    const isMdRightColumn = (idx + 1) % 2 === 0;
    return (
      <ScrollReveal key={feature.id} delay={Math.min(idx * 80, 400)}
        className={cn(
          'group relative border-r border-b border-neutral-800 px-8 py-10',
          'transition-colors duration-300',
          isLgRightColumn && 'lg:border-r-0',
          isLgBottomRow && 'lg:border-b-0',
          isMdRightColumn && 'md:border-r-0',
        )}>
        {/* Left accent bar — neutral→amber on hover */}
        <div aria-hidden="true"
          className="absolute start-0 top-8 bottom-8 w-[3px] rounded-e-full bg-neutral-800 transition-colors duration-300 group-hover:bg-amber-400" />
        {/* Icon, title, description, bottom gradient sheen */}
      </ScrollReveal>
    );
  })}
</div>
```

**Critical:** The edge cleanup logic (`isLgRightColumn`, `isLgBottomRow`, `isMdRightColumn`) removes the outer borders so the grid forms a continuous shared surface with internal hairlines only. No `bg-card`, no `shadow-*`, no `rounded-*` on individual cells.

### Examples — The Carousel with the Singular Purple Exception

```tsx
<article key={card.id} className="group relative w-[260px] shrink-0 cursor-pointer snap-start ...">
  {/* Hover glow — yellow→purple gradient (the SINGULAR purple exception) */}
  <div aria-hidden="true"
    className="absolute inset-0 -z-10 rounded-[20px] bg-gradient-to-r from-yellow-500 to-purple-500 opacity-50 blur-md transition-opacity duration-300 group-hover:opacity-80" />
  <a href={card.href} className="relative block aspect-[9/16] overflow-hidden rounded-[20px] ...">
    <Image src={card.thumbnail} alt={card.title} fill sizes="260px"
      className="object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
  </a>
</article>
```

**Critical:** `from-yellow-500 to-purple-500` is the ONLY purple on the entire site. This is intentional — the deviation is documented as a deliberate design choice. Do not add purple anywhere else.

### Workflow — Alternating Video/Text Rows with Poster Fade-In

```tsx
function WorkflowVideo({ src, poster }: { src: string; poster: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <video className={cn(
      'absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 lg:object-contain',
      loaded ? 'opacity-100' : 'opacity-0',
    )} autoPlay muted loop playsInline preload="metadata" poster={poster}
      onCanPlay={() => setLoaded(true)} aria-hidden="true">
      <source src={src} type="video/mp4" />
    </video>
  );
}
```

The `WorkflowVideo` inner component handles the poster→video fade-in choreography via `onCanPlay` (not `onLoadedData`). The 1000ms opacity transition creates a cinematic crossfade. Alternating layout uses `lg:order-1` / `lg:order-2` based on `step.mediaPosition`.

### FAQ — Radix Accordion with `grid-template-rows` Animation

```tsx
<Accordion type="single" collapsible className="w-full">
  {FAQ_ITEMS.map((item) => (
    <AccordionItem key={item.id} value={item.id} className="border-b border-white/10 last:border-0">
      <AccordionTrigger className="...">
        <span className="...">{item.question}</span>
        <span className="... [[data-state=open]>&]:rotate-45" aria-hidden="true">
          <Plus className="h-5 w-5" />
        </span>
      </AccordionTrigger>
      <AccordionContent className="overflow-hidden text-zinc-400">
        <p className="pb-6 ...">{item.answer}</p>
      </AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

The accordion content animation uses the modern CSS Grid `grid-template-rows: 0fr → 1fr` trick (defined in `globals.css` via `.radix-accordion-content` class). This is GPU-accelerated and doesn't require JavaScript height calculations. The Plus icon rotates 45° on open via `[[data-state=open]>&]:rotate-45`.

### ProjectProgressPanel — SSE Subscriber with Reconnect

The project detail page (`src/app/(app)/projects/[id]/page.tsx`) is a Server Component that renders `<ProjectProgressPanel projectId={id} />` — a client component that subscribes to the SSE progress stream via the `useProjectProgress` hook. See §6 for the hook implementation.

### Click-Time R2 URL Signing Pattern (H4 fix — replaces SSR-time signing)

**Never import `@/lib/storage/r2` in client components.** The `r2.ts` module imports `env` which validates all 31 env vars at module load. In the browser, only `NEXT_PUBLIC_*` vars exist — all server-only vars are `undefined`, causing "Invalid environment variables" crash.

**H4 fix:** The previous `SignedDownloadWrapper` (Server Component) signed the R2 URL at SSR time, baking the 1h-expiry URL into the RSC payload. Users who left tabs open >1h got 403 Forbidden. The fix: a new API route signs the URL at **click time**, so each download gets a fresh URL.

**`SignedDownloadWrapper` has been DELETED.** The new pattern:

```tsx
// Server Component (projects/[id]/page.tsx) — passes primitive props only
import { ProjectDownloadButton } from '@/components/app/project-download-button';

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;
  const session = await verifySession({ redirectTo: `/projects/${id}` });
  const project = await getProject(id, session.user.id);
  // Pass ONLY primitives (projectId + hasVideo) — never a signed URL
  return <ProjectDownloadButton projectId={project.id} hasVideo={!!project.videoKey} />;
}

// API Route (app/api/projects/[id]/download/route.ts) — signs URL at click time
export const dynamic = 'force-dynamic';
export async function GET(_req, { params }) {
  const session = await auth();           // API pattern: auth() not verifySession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: projectId } = await params;
  const project = await getProject(projectId, session.user.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!project.videoKey) return NextResponse.json({ error: 'Video not ready' }, { status: 409 });
  const signedUrl = await getSignedDownloadUrl('videos', project.videoKey);
  return NextResponse.json({ url: signedUrl }, { status: 200 });
}

// ProjectDownloadButton (Client Component — fetches fresh URL at click time)
'use client';
export function ProjectDownloadButton({ projectId, hasVideo }: { projectId: string; hasVideo: boolean }) {
  if (!hasVideo) return null;
  const handleDownload = async () => {
    const res = await fetch(`/api/projects/${projectId}/download`);
    if (!res.ok) { /* handle error */ return; }
    const { url } = await res.json();
    const a = document.createElement('a');
    a.href = url; a.download = `story-${projectId}.mp4`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  return <button onClick={handleDownload}>Download Video</button>;
}
```

---

## 6. Custom Hooks Deep Dive

### `useScrolled(threshold)` — Scroll-Aware Navbar

```typescript
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

**Usage:** Navbar toggles `bg-zinc-950/70 backdrop-blur-[24px] border-b border-white/10` when `scrolled` is true. The `{ passive: true }` option is critical for scroll performance — it tells the browser the handler won't call `preventDefault()`, allowing smooth scrolling.

### `useReveal<T>(options)` — IntersectionObserver Scroll Reveal

```typescript
'use client';
import { useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  threshold?: number;      // default 0.15
  rootMargin?: string;     // default '0px 0px -50px 0px' (triggers 50px before entering)
  once?: boolean;          // default true (disconnect after first intersection)
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(options: UseRevealOptions = {}) {
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

**Usage:** The `ScrollReveal` primitive wraps this hook and sets `data-reveal` + `data-revealed` attributes. The CSS in `globals.css` handles the actual opacity + translateY transition:

```css
[data-reveal] { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; transition-delay: var(--reveal-delay, 0s); }
[data-reveal][data-revealed='true'] { opacity: 1; transform: translateY(0); }
```

**Staggered delays** are set via the `delay` prop → `--reveal-delay` CSS var: `delay={Math.min(idx * 80, 400)}` (capped at 400ms).

### `useReducedMotion()` — OS-Level Motion Preference

```typescript
'use client';
import { useEffect, useState } from 'react';

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

**Usage:** The global CSS `@media (prefers-reduced-motion: reduce)` block handles most cases declaratively. This hook is for cases where JS needs to know the preference (e.g., skipping a video autoplay, disabling a JS-driven animation).

### `useProjectProgress(projectId)` — SSE Subscriber with Exponential Backoff Reconnect

This is the most complex hook. It subscribes to `/api/projects/[id]/progress` via `EventSource`, parses JSON events, and reconnects with exponential backoff when the stream drops.

```typescript
'use client';
import { useEffect, useState } from 'react';

export interface ProjectProgressState {
  status: string | null;
  progressPercent: number | null;
  progressDetail: string | null;
  errorMessage: string | null;
  connectionState: 'connecting' | 'open' | 'closed' | 'error' | 'reconnecting';
}

const INITIAL_STATE: ProjectProgressState = {
  status: null, progressPercent: null, progressDetail: null,
  errorMessage: null, connectionState: 'connecting',
};

const TERMINAL_STATUSES = new Set(['completed', 'failed']);
const MAX_RECONNECT_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1000;

function backoffDelay(attempt: number): number {
  return BASE_BACKOFF_MS * Math.pow(2, attempt);  // 1000 → 2000 → 4000
}

export function useProjectProgress(projectId: string): ProjectProgressState {
  const [state, setState] = useState<ProjectProgressState>(INITIAL_STATE);

  useEffect(() => {
    if (!projectId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;
    let isCancelled = false;

    const openStream = () => {
      if (isCancelled) return;
      eventSource = new EventSource(`/api/projects/${projectId}/progress`);

      eventSource.onopen = () => {
        reconnectAttempt = 0;
        setState((prev) => ({ ...prev, connectionState: 'open' }));
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState({ ...data, connectionState: 'open' });
          if (TERMINAL_STATUSES.has(data.status)) {
            eventSource?.close();
            setState((prev) => ({ ...prev, connectionState: 'closed' }));
          }
        } catch { /* Malformed JSON — ignore */ }
      };

      eventSource.onerror = () => {
        if (!eventSource) return;
        eventSource.close();
        eventSource = null;
        if (isCancelled) return;
        if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
          setState((prev) => ({ ...prev, connectionState: 'error' }));
          return;
        }
        const delay = backoffDelay(reconnectAttempt);
        reconnectAttempt += 1;
        setState((prev) => ({ ...prev, connectionState: 'reconnecting' }));
        reconnectTimer = setTimeout(() => {
          if (!isCancelled) openStream();
        }, delay);
      };
    };

    openStream();

    return () => {
      isCancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) eventSource.close();
    };
  }, [projectId]);

  return state;
}
```

**Critical details:**
1. The `isCancelled` flag prevents reconnect attempts after unmount — without it, the hook would try to call `setState` on an unmounted component.
2. The cleanup function returns `() => { isCancelled = true; ... }` — this is non-negotiable. Forgetting `eventSource.close()` leaks the connection across navigations.
3. The backoff is exponential: 1s → 2s → 4s, max 3 attempts. After max attempts, `connectionState` becomes `'error'` and the UI shows "Reconnect failed".
4. Terminal statuses (`completed`/`failed`) close the EventSource immediately — no point reopening a stream for a finished project.

---

## 7. Content Management: Static Data + Pipeline Queries

### Static Marketing Data (10 files in `src/lib/data/`)

All marketing content lives in static TypeScript files — no CMS, no database queries for the marketing page:

| File | Exports | Content |
|---|---|---|
| `nav-links.ts` | `NAV_LINKS`, `NAV_LANGUAGES` | 4 nav links + 3 language codes |
| `story-seeds.ts` | `STORY_SEEDS`, `DEFAULT_STORY_EXAMPLES` | 4 multi-paragraph story seeds (300-500 chars each) |
| `style-chips.ts` | `STYLE_CHIPS` | 8 spec-mandated chips (Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, Watercolor) |
| `examples.ts` | `EXAMPLE_CARDS` | 6 portrait example cards (9:16 thumbnails) |
| `workflow-steps.ts` | `WORKFLOW_STEPS` | 4 alternating media/text rows |
| `features.ts` | `FEATURES` | 8 features (4×2 grid) with Lucide icons |
| `testimonials.ts` | `TESTIMONIALS` | 6 testimonials (3×2 grid) with initials avatars |
| `use-cases.ts` | `USE_CASES` | 4 use cases (2×2 grid) |
| `faq-items.ts` | `FAQ_ITEMS` | 6 FAQ items |
| `footer-links.ts` | `FOOTER_COLUMNS`, `FOOTER_BRAND`, `FOOTER_COPYRIGHT` | 3 link columns + brand block |

### STYLE_CHIPS — Spec-Locked (8 chips)

The STYLE_CHIPS array is locked to the spec-mandated 8-chip set from the original storyintovideo.com site. A prior implementation drifted to 7 chips with different labels. The `src/tests/unit/style-chips.test.ts` file enforces the exact label set:

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

### The `queries.ts` Boundary (Production App Layer)

All DB access goes through feature-level `queries.ts` files. Components NEVER call `db` directly. This enables testing + future DB swaps.

```
src/features/
├── auth/domain/verify-session.ts       # DAL auth function
├── projects/{queries,actions}.ts       # getUserProjects, getProject, createProjectAction
├── pipeline/
│   ├── queries.ts                      # appendCharacter, appendScene, updateProjectProgress, etc.
│   ├── inngest.ts                      # 6-step pipeline function
│   └── domain/                         # Pure functions (8 files)
└── billing/{queries,actions,domain/}.ts
```

### The AI Pipeline (Inngest, 6 Steps — Fully Wired)

```
Step 0: Moderate story (OpenAI Moderation API — block if flagged)
Step 1: Analyze story (GPT-4o JSON mode → characters + scenes)
Step 2: Generate characters (Replicate SDXL → moderateImage per ADR-011)
Step 3: Generate scenes (Replicate SDXL + IP-Adapter → moderateImage per ADR-011)
Step 4: Synthesize voiceover (ElevenLabs TTS → R2 putObject → appendVoiceover row)
Step 5: Align subtitles (fetch audio from R2 → Whisper ASR → SRT → R2 → updateVideoSubtitle)
Step 6: Assemble video (FFmpeg → R2 putObject('videos') → appendVideo row)
Final: Mark project status='completed', progressPercent=100
```

Each step:
- Is idempotent (Inngest may retry)
- Debits credits via `debitCredits()` (Drizzle transaction): analysis=5, char=10, scene=8, voiceover=15, subtitle_alignment=3, video_assembly=30
- Updates `project.status` + `progressDetail`
- On failure, sets `project.status = 'failed'` with error message

The pipeline is triggered by `createProjectAction` via `inngest.send({ name: PIPELINE_EVENT, data: { projectId } })` after the DB insert.

### Inngest v4 `createFunction` Signature

```typescript
export const pipelineFunction = inngest.createFunction(
  { id: 'story-to-video-pipeline', retries: 3, triggers: [{ event: PIPELINE_EVENT }] },
  async ({ event, step }) => { ... }
);
```

**Critical:** In Inngest v4, the trigger is part of the config object (`triggers: [{ event: '...' }]`), NOT a second argument. Older docs show `createFunction(config, trigger, handler)` which is wrong for v4.

---

## 8. Accessibility (WCAG AAA) Implementation

### Focus Rings (Amber, Visible)

All interactive elements use:
```
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400
```

The `:focus-visible` pseudo-class (not `:focus`) ensures the ring only appears for keyboard users, not mouse clicks.

### Skip-to-Content Link

The layout (`src/app/layout.tsx`) includes a skip link as the first focusable element:

```tsx
<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-amber-400 focus:px-4 focus:py-2 focus:font-medium focus:text-zinc-950 focus:shadow-lg">
  Skip to content
</a>
```

This is an accessibility enhancement over the original site — keep it.

### Hero Video `aria-hidden`

```tsx
<video autoPlay muted loop playsInline ... aria-hidden="true">
```

The hero background video is decorative (no audio, no informational content). `aria-hidden="true"` prevents screen readers from announcing it.

### `prefers-reduced-motion: reduce`

The global CSS override (in `globals.css`) disables ALL animations when the user has OS-level reduced-motion enabled:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;   /* NOT 0ms */
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .marquee-track { animation: none !important; }
  video[autoplay] { display: none; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

### Touch Targets ≥ 44×44px

The Hero aspect ratio toggle buttons use `min-h-[44px] min-w-[44px]`:

```tsx
<button className="flex min-h-[44px] min-w-[44px] items-center justify-center ...">
```

### Color Contrast (WCAG AAA — Qualified)

- **Primary body text** (`#d4d4d8` zinc-300 on `#020202`): ~13.5:1 ratio — exceeds AAA (7:1)
- **Muted/secondary text** (`#8e8e95` on `#020202`): ~6.1:1 — passes AA (4.5:1) but **fails AAA** for normal text. Do not claim blanket "WCAG AAA" — qualify: "Primary body text meets AAA; secondary/muted text meets AA."
- **Amber on dark** (`#febf00` on `#020202`): high contrast — passes AAA

### `aria-pressed` on Toggle Buttons

```tsx
<button onClick={() => setActiveRatio(ratio)} aria-pressed={isActive} ...>
```

### Heading Hierarchy

- One `<h1>` per page (Hero headline)
- Sequential `<h2>` for section headings (via `SectionHeading` primitive)
- `<h3>` for card titles within sections

### `aria-labelledby` on Sections

Every `<section>` has `aria-labelledby` pointing to its heading's `id`:

```tsx
<section aria-labelledby="features-heading">
  <SectionHeading id="features-heading">...</SectionHeading>
</section>
```

---

## 9. Anti-Patterns & Common Bugs

### Bug #1: Fictional Stripe SDK v22 camelCase Fallback (FIXED)

**The bug:** The webhook handler had a fictional `currentPeriodEnd ?? current_period_end` fallback defending against a non-existent Stripe SDK v22 camelCase conversion. The Stripe Node SDK has always used snake_case. The REAL breaking change is the Stripe "Basil" API (2025-03-31) which moved `current_period_end` from the top-level Subscription object to `subscription.items.data[0].current_period_end`.

**The fix:** Extracted `extractSubscriptionPeriodEnd()` pure helper (`src/features/billing/domain/extract-period-end.ts`) that checks the Basil shape first, then falls back to the pre-Basil top-level field. 8 tests.

**Lesson:** Docs drift into code as bugs. Validate doc claims against official changelogs before implementing.

### Bug #2: SSE `maxDuration = 900` Exceeded Vercel Pro GA Limit (FIXED)

**The bug:** The SSE route had `maxDuration = 900`, which exceeded the Vercel Pro/Enterprise GA ceiling under Fluid Compute (now default on all plans). Setting 900 caused silent fallback to the platform default (~60s), causing mid-pipeline disconnects WORSE than the original 300s baseline.

**The fix:** Changed to `maxDuration = 800` (Pro GA ceiling). 1800s is available in beta only — not stable for production. The client-side reconnect handles Hobby's 300s cap.

**Lesson:** Vercel Fluid Compute changed the maxDuration landscape. Always check current platform limits before setting `maxDuration`.

### Bug #3: React `^19.2.0` Vulnerable to CVE-2025-55182 (FIXED)

**The bug:** The `^19.2.0` pin allowed versions 19.2.0–19.2.2, all vulnerable to CVE-2025-55182 ("React2Shell", CVSS 10.0 pre-auth RCE via React Server Components).

**The fix:** Bumped to `^19.2.3`. For Next.js apps the runtime fix comes via `next@16.0.10+`, but the direct React pins should also be raised to document the security floor.

### Bug #4: Obsolete Zod v3 `.refine()` Workaround for DATABASE_URL (FIXED)

**The bug:** The env module used a bare `.refine()` with `startsWith('postgresql://')` — a Zod v3 workaround. In Zod v4, `.url()` uses `new URL()` which accepts any scheme, so the workaround was obsolete.

**The fix:** Replaced with `.url().refine()` composition: `.url()` validates URL format, `.refine()` restricts the protocol to `postgres:`/`postgresql:`. This catches MORE typos than the old approach (e.g., `postgresql://not a url with spaces` is now correctly rejected).

### Bug #5: `IMAGE_MODERATION_FAIL_OPEN` Bypassed Zod Env Validation (FIXED)

**The bug:** `moderate-image.ts` read `process.env.IMAGE_MODERATION_FAIL_OPEN` directly, bypassing the Zod schema. Typos like `IMAGE_MOD_FAIL_OPEN` would silently fall back to the default with no error.

**The fix:** Added `IMAGE_MODERATION_FAIL_OPEN` to the Zod schema as `z.enum(['true','false']).optional().default('true')`. Changed `moderate-image.ts` to `import { env } from '@/lib/env'` and read `env.IMAGE_MODERATION_FAIL_OPEN`.

**Lesson:** Every env var must go through the Zod schema. The reasoning "it's deliberate, not dynamic" conflated runtime mutability with validation.

### Bug #6: `pnpm-workspace.yaml` Mixed Deprecated + Current Syntax (FIXED)

**The bug:** The file had both `allowBuilds` (pnpm 10.26+ map syntax) and `onlyBuiltDependencies` (pnpm 9 array syntax, removed in pnpm 11). Also listed `@ffmpeg-installer/linux-x64` which was removed from deps.

**The fix:** Standardized on `allowBuilds` only. Removed stale `@ffmpeg-installer/linux-x64`. Bumped engine to `pnpm >=10.26.0`.

### Bug #7: STYLE_CHIPS Drifted from Spec (FIXED)

**The bug:** The hero marquee had drifted to 7 chips with different labels (added "Comic" + "Futuristic neon"; dropped "Medieval" + "Japanese animation"). No tests caught this because no tests asserted the spec copy.

**The fix:** Restored the spec-mandated 8-chip set verbatim. Added `src/tests/unit/style-chips.test.ts` with regression guards.

**Lesson:** Content drift is silent. Lock spec-mandated content with regression tests.

### Bug #8: Hero Headline Collapsed to 2-Line (FIXED)

**The bug:** The H1 had collapsed from the 3-line cinematic stack ("Turn" / "Story Into Video" / "with AI Magic") to 2 lines, losing the poster-quality title card. The subtitle had also drifted from OUTPUT ("a finished video") to PROCESS ("subtitles, all generated").

**The fix:** Restored the 3-line stack with 2 `<br />` tags. Changed subtitle back to "a finished video in minutes."

### Bug #9: `verifySession()` Wrapped in try/catch (AVOID)

**The bug:** If you wrap `verifySession()` in try/catch, it catches the `NEXT_REDIRECT` error and silently swallows the redirect. The user sees a blank page instead of being redirected to `/sign-in`.

**The fix:** Never wrap `verifySession()` in try/catch. It throws `NEXT_REDIRECT` which must propagate.

### Bug #10: Client Component Imports `r2.ts` at Module Level (AVOID)

**The bug:** The `r2.ts` module imports `env` which validates all 31 env vars at module load. In the browser, only `NEXT_PUBLIC_*` vars exist — all server-only vars are `undefined`, causing "Invalid environment variables" crash. This completely breaks the project detail page.

**The fix:** Server Component signs the URL via `getSignedDownloadUrl()`, passes as prop to client component. See §5 "Server-Side URL Signing Pattern."

### Bug #11: `@ffmpeg-installer/ffmpeg` Incompatible with Turbopack (AVOID)

**The bug:** The `@ffmpeg-installer/ffmpeg` package uses dynamic `require()` calls with runtime-constructed paths that Turbopack's static analyzer cannot resolve ("server relative imports are not implemented").

**The fix:** Replaced with system FFmpeg binary via `getFfmpegPath()` helper that reads `FFMPEG_PATH` env var with `/usr/bin/ffmpeg` default.

### Bug #12: Vitest Mock Factory Hoisting (AVOID)

**The bug:** `vi.mock()` factories are hoisted above imports by the transformer. Referencing an outer `const mockFn = vi.fn()` from inside `vi.mock(...)` throws `Cannot access 'mockFn' before initialization`.

**The fix:** Use `vi.hoisted()`:
```typescript
const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }));
vi.mock('mod', () => ({ x: mockFn }));
```

### Bug #13: Mock Constructors Need `class` Syntax (AVOID)

**The bug:** `vi.fn().mockImplementation(() => ({ ... }))` returns an arrow function that cannot be `new`-ed. The real code does `new S3Client(...)`, so the mock throws `TypeError: () => ({...}) is not a constructor`.

**The fix:** Use `class` syntax in the mock factory:
```typescript
class MockS3Client { send = sendMock; }
```

### Bug #14: `.tsx` Extension Required for JSX Tests (AVOID)

**The bug:** Test files with `render(<Component />)` JSX but `.test.ts` extension produce `[PARSE_ERROR] Expected '>' but found 'Identifier'` from oxc.

**The fix:** Rename to `*.test.tsx`. This is a transformer-level requirement, not a TypeScript one.

### Bug #15: Sign-up flow was completely broken (C1 — FIXED)

**The bug:** `AuthForm` called `signIn('credentials', ...)` for BOTH sign-in and sign-up modes. The Credentials provider's `authorize()` only checks existing users — no user-creation logic existed. `grep -r "bcrypt.hash|insert(users)|signUpAction" src/` returned only `seed.ts`.

**The fix:** New `src/features/auth/actions.ts` with `signUpAction` server action (Zod validate, check email exists, bcrypt hash cost 12, insert user, create free-tier subscription, return `{ success, userId }`). `AuthForm.handleSubmit` now branches on `isSignUp` — sign-up mode calls `signUpAction` then auto-signs-in via `signIn('credentials')`.

### Bug #16: Steps 2 & 3 never debited credits — 60% revenue leak (C6 — FIXED)

**The bug:** `FULL_PIPELINE_COST = 131` credits assumes all 6 steps debit. But Steps 2 (character_generation) and 3 (scene_generation) in `inngest.ts` NEVER called `debitCredits`. Actually debited: 5+15+3+30 = 53 credits. Revenue leak: 78 credits per project (60%).

**The fix:** Added `debitCredits()` calls inside Steps 2 & 3 with per-entity idempotency keys (`${projectId}:character:${char.name}`, `${projectId}:scene:${scene.order}`). If a retry is detected (`debitCredits` returns `{ idempotent: true }`), the step skips generation (the entity already exists).

### Bug #17: `FFMPEG_PATH` bypassed Zod env validation (H1 — FIXED)

**The bug:** `assemble-video.ts:20` read `process.env.FFMPEG_PATH` directly, violating the project's central "never `process.env.*`" rule. A typo like `FFMPEG_PAHT` would silently fall back to `/usr/bin/ffmpeg` with no warning.

**The fix:** Added `FFMPEG_PATH: z.string().optional().default('/usr/bin/ffmpeg')` to the Zod schema. Changed `getFfmpegPath()` to `import { env } from '@/lib/env'; return env.FFMPEG_PATH`.

### Bug #18: Download button 403 on stale tabs (H4 — FIXED)

**The bug:** `SignedDownloadWrapper` signed the R2 URL at SSR time, baking the 1h-expiry URL into the RSC payload. Users who left tabs open >1h and clicked "Download" got 403 Forbidden.

**The fix:** New `/api/projects/[id]/download` API route signs the URL at click time. `ProjectDownloadButton` now receives `{ projectId, hasVideo }` (primitives that never expire) and fetches the API route on click. `SignedDownloadWrapper` DELETED.

### Bug #19: Style chip enum mismatch (H3 — FIXED)

**The bug:** STYLE_CHIPS has 8 labels including "Medieval" and "Japanese animation". `CreateWizard` normalizes via `toLowerCase().replace(/\s+/g, '-')` → `medieval` and `japanese-animation`. These were NOT in the `visualStyleEnum` (7 values). Zod rejected the submission after the user typed a 100+ char story.

**The fix:** Added `medieval` and `japanese-animation` to `visualStyleEnum` + Zod + `STYLE_PROMPTS` maps (migration `0004_add_medieval_japanese_animation_styles.sql`).

### Bug #20: Stripe webhook TOCTOU race (H7 — FIXED)

**The bug:** The webhook idempotency check was `SELECT ... WHERE metadata = event.id` followed by `INSERT`. Two concurrent webhooks for the same `event.id` both pass the SELECT and both INSERT. Also: `userId: '00000000-...'` (hardcoded system user) violated the FK constraint.

**The fix:** Replaced with INSERT-first `ON CONFLICT (idempotency_key) DO NOTHING` pattern. `usageEvents.userId` is now nullable (migration `0003`). Removed hardcoded system user UUID.

### Bug #21: Brand color system bypassed 75+ times (H2 — PARTIALLY FIXED)

**The bug:** Components use `bg-amber-400` (Tailwind `#fbbf24`) instead of `bg-primary` (brand `#febf00`), and `bg-zinc-950` instead of `bg-background` (`#020202`). 75+ amber violations across 22 files; 29+ zinc-950 violations across 21 files.

**The fix:** CI guard test (`brand-tokens.test.ts`) measures the baseline. Full replacement deferred to a design sprint. When done, flip the test assertions to `expect(0)`.

---

## 10. Debugging Guide

### Issue: Build fails with "Invalid environment variables"

**Cause:** Real env vars not set in `.env.local`. The env module's Zod schema validates at module load and fails fast.

**Fix:**
1. Copy `.env.example` → `.env.local`
2. Fill in real values for all 31 env vars
3. The build-context fallback only applies when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`. At runtime, real env vars MUST be set.

### Issue: Build fails "Failed to collect page data for /api/auth/[...nextauth]"

**Cause:** The auth route tries to prerender DrizzleAdapter, which needs env vars at module load.

**Fix:** Ensure `export const dynamic = 'force-dynamic'` in `src/app/api/auth/[...nextauth]/route.ts`.

### Issue: `pnpm install` warns "Ignored build scripts: esbuild"

**Cause:** `pnpm-workspace.yaml` missing esbuild approval.

**Fix:** Add `esbuild: true` to the `allowBuilds` map in `pnpm-workspace.yaml`.

### Issue: `pnpm install` fails with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION`

**Cause:** `pnpm-workspace.yaml` missing `packages:` field.

**Fix:** Add `packages: ['.']` to `pnpm-workspace.yaml`.

### Issue: Tests fail "Cannot find module 'next/server'"

**Cause:** jsdom can't load Next.js server modules.

**Fix:** Mock `next-auth`, `next/navigation`, and `@/lib/db` in tests that transitively import them.

### Issue: Tests fail "Cannot access 'X' before initialization"

**Cause:** `vi.mock()` factory references a `vi.fn()` defined in the test body.

**Fix:** Use `vi.hoisted()`: `const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))`.

### Issue: Tests fail "X is not a constructor"

**Cause:** Mock factory returns an arrow function, but real code does `new X()`.

**Fix:** Use `class` syntax: `class MockS3Client { send = sendMock; }`.

### Issue: Tests fail "[PARSE_ERROR] Expected '>' but found 'Identifier'"

**Cause:** Test file has JSX but `.test.ts` extension.

**Fix:** Rename to `*.test.tsx`.

### Issue: Pipeline tests fail "fetch failed: ENOTFOUND r2.example.com"

**Cause:** Steps 5 & 6 use `fetch()` for R2 downloads, which hits real DNS in tests.

**Fix:** `vi.stubGlobal('fetch', fetchMock)`.

### Issue: SSE route returns 307 redirect instead of 401 JSON

**Cause:** Used `verifySession()` (redirects) instead of `auth()` (returns null).

**Fix:** API routes use `auth()` directly: `const session = await auth(); if (!session?.user?.id) return NextResponse.json({error:'Unauthorized'},{status:401});`

### Issue: SSE stream hangs / never closes

**Cause:** `controller.close()` not called on terminal status.

**Fix:** Poll DB every 2s; close when `status ∈ {completed, failed}`.

### Issue: `EventSource` leaks across navigations

**Cause:** `useEffect` cleanup missing `eventSource.close()`.

**Fix:** Return cleanup fn from `useEffect`: `return () => { isCancelled = true; if (eventSource) eventSource.close(); }`.

### Issue: Project detail page shows "This page couldn't load"

**Cause:** Client component imports `r2.ts` at module level, triggering env validation crash in browser.

**Fix:** Never import `@/lib/storage/r2` in `'use client'` files. Sign URLs in Server Components, pass as props.

### Issue: Auth redirects to `http://localhost:3000` in production

**Cause:** `AUTH_URL` env var set to localhost, OR reverse proxy doesn't forward `X-Forwarded-Host`.

**Fix:** Set `AUTH_URL` to the production URL. The `trustHost: true` config makes Auth.js use the request's Host header as a fallback. The env module emits a `console.warn` when AUTH_URL and NEXT_PUBLIC_APP_URL hosts differ.

### Issue: `assemble-video` can't find FFmpeg binary

**Cause:** `@ffmpeg-installer/ffmpeg` removed (Turbopack-incompatible); system FFmpeg not installed.

**Fix:** `sudo apt install ffmpeg` (Ubuntu) or `brew install ffmpeg` (macOS). Set `FFMPEG_PATH` env var if non-standard location.

### Issue: Stripe webhook returns 400 "Invalid signature"

**Cause:** `STRIPE_WEBHOOK_SECRET` mismatch or body parsed as JSON.

**Fix:** Use `await req.text()` (not `.json()`); verify `STRIPE_WEBHOOK_SECRET` matches the Stripe Dashboard webhook endpoint.

### Issue: Replicate scene generation 404s

**Cause:** `REPLICATE_SDXL_IPADAPTER_MODEL` is the SDXL base placeholder (not IP-Adapter).

**Fix:** Set `REPLICATE_SDXL_IPADAPTER_MODEL` env var to a real `lucataco/sdxl-ipadapter:<sha>` hash from replicate.com/explorer.

### Issue: Outfit weight 820 not rendering

**Cause:** Google Fonts API doesn't serve weight 820.

**Fix:** Must self-host via `next/font/local` (already done in `src/lib/fonts.ts`).

### Issue: Tailwind classes not applying

**Cause:** Missing `@source` directives.

**Fix:** Check `globals.css` has `@source '../components/**/*.{ts,tsx}'` and `@source '../lib/**/*.{ts,tsx}'`.

### Issue: Hydration mismatch console error

**Cause:** Browser extension (Grammarly) injects attributes into `<body>` before React hydrates.

**Fix:** Already fixed — `suppressHydrationWarning` on both `<html>` and `<body>`.

---

## 11. Pre-Ship Checklist

Before claiming completion, verify ALL of the following:

### Code Quality Gate

```bash
pnpm lint         # zero warnings, zero errors
pnpm typecheck    # zero errors (strict + noUncheckedIndexedAccess)
pnpm test         # 377 tests pass across 43 files
pnpm test:e2e     # 48 E2E tests pass (requires Playwright browsers: pnpm exec playwright install)
pnpm format:check # all files use Prettier code style
pnpm build        # zero errors, all 14 routes compile
```

### Visual Verification

- [ ] Background is `#020202` (NOT pure `#000`)
- [ ] Amber is `#febf00` (NOT Tailwind `amber-400` = `#fbbf24`)
- [ ] H1 hero headline is 3-line stack: "Turn" / "Story Into Video" / "with AI Magic"
- [ ] H1 uses Outfit weight 820 (visually heavier than standard bold)
- [ ] Hero subtitle says "a finished video in minutes" (NOT "subtitles, all generated")
- [ ] Hero video autoplays muted; poster shown while loading
- [ ] Amber radial glow visible in hero upper area
- [ ] Style chips marquee has exactly 8 chips: Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, Watercolor
- [ ] Features section: continuous hairline grid (no boxed cards)
- [ ] Testimonials: 3-column grid with initials avatar circles
- [ ] Examples carousel: yellow→purple gradient glow on hover (the ONLY purple)
- [ ] FAQ: clicking a question expands with `grid-template-rows` animation
- [ ] Final CTA: dot-grid background + solid amber pill (`cta-amber` utility)
- [ ] Navbar: scroll-aware (transparent → `bg-zinc-950/70 backdrop-blur-[24px]`)
- [ ] Mobile nav: Radix Sheet opens; Tab focus trapped; Escape closes it

### Animation Audit

- [ ] All 13 `@keyframes` blocks present in compiled CSS bundle
- [ ] `fade-in-up` scroll reveal fires on all sections entering viewport
- [ ] `marquee-scroll` runs and pauses on hover; no jump on loop
- [ ] `prefers-reduced-motion: reduce` disables all animations
- [ ] `video[autoplay]` hidden under reduced motion

### Accessibility (WCAG AAA — Qualified)

- [ ] Skip-to-content link is first focusable element (Tab from page load)
- [ ] All icon-only buttons have `aria-label`
- [ ] One `<h1>`, sequential `<h2>`, `<h3>` heading hierarchy
- [ ] Ratio toggles have `aria-pressed` attribute
- [ ] Focus ring (amber) visible on all interactive elements
- [ ] FAQ `AccordionTrigger` has correct `aria-expanded` state
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] Primary body text meets WCAG AAA (zinc-300 on zinc-950 = ~13.5:1)
- [ ] Muted text meets WCAG AA (zinc-400 on zinc-950 = ~6.1:1)

### Production Hygiene

- [ ] "Open Next.js Dev Tools" panel absent (NODE_ENV=production, `next start` not `next dev`)
- [ ] No dead `#` links in footer or examples CTA
- [ ] Footer tool links resolve to real routes
- [ ] Auth callback does not redirect to 404 after OAuth
- [ ] `console.log` / debug output absent in production browser console
- [ ] No `any` types (ESLint enforces `@typescript-eslint/no-explicit-any: error`)

### Security

- [ ] `AUTH_SECRET` is ≥32 chars and not a known-weak value
- [ ] `trustHost: true` on NextAuth config
- [ ] AUTH_URL and NEXT_PUBLIC_APP_URL point to the same host (no `console.warn` at module load)
- [ ] React is `^19.2.3` or higher (CVE-2025-55182 floor)
- [ ] Security headers present (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, etc.)
- [ ] Stripe webhook verifies signature
- [ ] R2 buckets are private (signed URLs only, never public)

### Operational (Before First Deploy)

- [ ] All 30 env vars set in `.env.local` from `.env.example`
- [ ] `pnpm drizzle:generate && pnpm drizzle:migrate` run against real Neon
- [ ] Stripe products configured (4 tiers: Free/Creator/Pro/Studio)
- [ ] `REPLICATE_SDXL_IPADAPTER_MODEL` set to a real `lucataco/sdxl-ipadapter:<sha>` hash
- [ ] `FFMPEG_PATH` set (default `/usr/bin/ffmpeg`)
- [ ] `IMAGE_MODERATION_FAIL_OPEN=false` for production (fail-closed recommended)
- [ ] `pnpm install` activated husky (`.husky/pre-commit` exists and is executable)

---

## 12. Lessons Learnt & How to Avoid Them

### Marketing Layer (Inherited)

1. **`suppressHydrationWarning` belongs on `<body>`, not just `<html>`** — Browser extensions like Grammarly inject attributes into `<body>` before React hydrates.
2. **Workflow component needs `'use client'`** — Uses `useState` for poster→video fade-in choreography.
3. **Test counts drift from plans** — MEP planned 6+3; actual is 377 unit + 48 E2E. Always verify against `pnpm test` output.
4. **File structure evolves during implementation** — Update docs as you build.
5. **Playwright requires browser binary installation** — `pnpm install` doesn't install browser binaries.

### Production App Layer

6. **Zod v4 `.url()` accepts any scheme (including `postgresql://`)** — compose `.url()` with `.refine()` for protocol restriction.
7. **Env validation needs build-context fallback** — without it, `next build` fails during page-data collection.
8. **`postgres()` defers connection until first query** — allows eager db instantiation without breaking the build.
9. **DrizzleAdapter validates db object structure** — a Proxy-based lazy db was rejected; use a real Drizzle client.
10. **Inngest v4 changed `createFunction` signature** — trigger is now in the config object, not a second argument.
11. **Auth unit tests must mock `next-auth` + `next/navigation`** — jsdom can't load `next/server`.
12. **Source-reading tests are valid** for server-only modules that can't be rendered in jsdom.
13. **Stripe "Basil" API (2025-03-31) moved `current_period_end`** — from top-level Subscription to `subscription.items.data[0].current_period_end`. Use the `extractSubscriptionPeriodEnd()` helper.
14. **ElevenLabs returns `Readable`, not `ReadableStream`** — duck-type the input in `streamToBuffer`.
15. **TDD with mocked AI providers works well** — all 8 pipeline domain functions are fully unit-tested.

### Remediation Sprint 1 (Pipeline Wiring + UX + Compliance)

16. **Vitest mock hoisting is the #1 test bug** — use `vi.hoisted()` for shared `vi.fn()` state.
17. **Mock constructors must be `class`, not arrow fns** — `new S3Client(...)` requires `new`-able mock.
18. **`.tsx` extension is mandatory for JSX tests** — oxc throws parse error for JSX in `*.test.ts`.
19. **SSE in Next.js 16** — `ReadableStream` + `text/event-stream` + 2s DB polling. Simpler than LISTEN/NOTIFY for serverless.
20. **`auth()` vs `verifySession()` for API routes** — `verifySession()` throws redirect (wrong for JSON). API routes use `auth()` → null → 401 JSON.
21. **`EventSource` cleanup is non-negotiable** — `useEffect` must return `() => eventSource.close()`.
22. **Image moderation via Replicate safety output is preferred** — zero extra API calls vs. OpenAI vision moderation.
23. **`getProject()` LEFT JOIN videos is cheaper than two queries** — LEFT JOIN adds <1ms; second query adds 5-15ms.
24. **`putObject` (pipeline) vs `getSignedUploadUrl` (client)** — pipeline has Buffer in memory → direct PUT. Client uploads use presigned URL.
25. **TDD exposed 4 latent defects in `assemble-video.ts`** — placeholder Buffer, missing SRT write, missing input options, brittle filter extraction.
26. **Source-reading tests must strip comments** — `src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')` before regex.
27. **husky `prepare` script with `|| true` is intentional** — prevents `pnpm install` failure on first install.
28. **Client components must NEVER import `r2.ts` at module level** — env validation throws in browser.
29. **Server-side URL signing pattern** — Server Component signs URL, passes as prop to client component.
30. **`@ffmpeg-installer/ffmpeg` is incompatible with Turbopack** — replaced with system FFmpeg binary.
31. **`middleware.ts` renamed to `proxy.ts` in Next.js 16** — functionality identical, only filename changes.

### Remediation Sprint 2 (Post-Review Hardening)

32. **`trustHost: true` is mandatory for reverse-proxy deployments** — without it, auth redirects resolve to AUTH_URL (often localhost).
33. **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch is a leading indicator** — the env module emits a `console.warn`.
34. **`OPENAI_API_KEY.startsWith('sk-')` is NOT too strict** — `sk-proj-*`, `sk-svcacct-*`, `sk-admin-*` all start with `sk-`.
35. **Hardcoded third-party model IDs are an operational liability** — move to env vars with format validation.
36. **Silent fail-open policies are dangerous** — the `moderationSkipped` field + `console.warn` makes bypasses observable.
37. **SSE on Vercel needs both server-side and client-side resilience** — `maxDuration = 800` (Pro GA) + client reconnect for Hobby's 300s cap.
38. **`putObject` needs a size guard** — `MAX_PUT_OBJECT_BYTES = 500 MB` fails fast instead of opaque OOM.
39. **`pnpm-workspace.yaml` requires `packages:` field** — pnpm 9+ enforces this even for single-package repos.
40. **CI should run the full quality gate** — lint-staged only checks staged files; CI catches whole-codebase regressions.

### Post-Review Hardening (design_critique.md Remediation)

41. **Docs drift into code as bugs** — the fictional "Stripe SDK v22 camelCase" claim was implemented as a fallback that defended against a non-existent problem. Validate doc claims against official changelogs.
42. **Vercel Fluid Compute changed the maxDuration landscape** — Pro/Enterprise GA caps at 800s (1800s in beta only). Always check current platform limits.
43. **CVE-2025-55182 ("React2Shell") affects React 19.0.0–19.2.2** — CVSS 10.0 pre-auth RCE. The fix is React 19.2.3+.
44. **Zod v4 `.url()` uses `new URL()` (not regex)** — accepts any scheme. Compose `.url().refine()` for both format validation AND protocol restriction.
45. **Every env var must go through the Zod schema** — `IMAGE_MODERATION_FAIL_OPEN` was read via `process.env` directly, bypassing validation. Typos would silently fall back to default.
46. **`pnpm-workspace.yaml` syntax evolved** — `allowBuilds` (map, pnpm 10.26+) replaced `onlyBuiltDependencies` (array, removed in pnpm 11). Pick one syntax and set the engine floor to match.
47. **Content drift is silent** — STYLE_CHIPS drifted from 8 spec chips to 7, and Hero headline collapsed from 3-line to 2-line. Neither broke tests. Lock spec-mandated content with regression tests.
48. **TDD on legacy code documents the contract** — the 29 new tests added during post-review hardening serve as living documentation of intended behavior.

---

## 13. Pitfalls to Avoid

- **Do not add `tailwind.config.ts`** — all tokens belong in `globals.css` `@theme`
- **Do not use `next/font/google` for Outfit** — it can't serve weight 820
- **Do not use Framer Motion or GSAP** — all animation is CSS-only
- **Do not use camelCase keyframes** — kebab-case is the convention
- **Do not read `process.env.*` directly** — use the Zod-validated `env` module
- **Do not wrap `verifySession()` in try/catch** — it throws `NEXT_REDIRECT` which must propagate
- **Do not put DB access in components** — use the `queries.ts` boundary
- **Do not put DB access in middleware/proxy** — it runs on Edge runtime
- **Do not make R2 buckets public** — use signed URLs
- **Do not skip content moderation** — every story input must be moderated (ADR-011)
- **Do not use `force-static` on app routes** — only the marketing page can be static
- **Do not use `any`** — ESLint will error. Use `unknown` or proper types
- **Do not add CDN links** — all assets are self-hosted
- **Do not use default exports for components** — use named exports
- **Do not skip the verification chain** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Do not use `db push` in production** — always `drizzle-kit generate` + `migrate`
- **Do not use `onlyBuiltDependencies` in `pnpm-workspace.yaml`** — use `allowBuilds` (pnpm 10.26+ syntax)
- **Do not use `maxDuration = 900`** — Vercel Pro GA ceiling under Fluid Compute is 800s
- **Do not pin React below `^19.2.3`** — CVE-2025-55182 (React2Shell RCE) affects 19.2.0–19.2.2
- **Do not claim blanket "WCAG AAA"** — primary body text meets AAA; muted/secondary text meets AA only

---

## 14. Best Practices

### Architecture

- **5-layer architecture** (proxy → app → features → domain → lib) — lower layers never import from higher layers
- **Auth-first Server Actions** — every action starts with `verifySession()` before any logic
- **`queries.ts` boundary** — all DB access through feature-level queries files
- **Domain isolation** — pure business logic in `src/features/*/domain/` (no Next.js or DB runtime imports, `import type` only)
- **Server-side URL signing** — Server Components sign R2 URLs, pass as props to client components

### TypeScript

- **Strict mode** — `strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`
- **`interface` for object shapes**, `type` for unions/intersections
- **`import type` for type-only imports** (ESLint enforces `consistent-type-imports: error`)
- **Early returns** over deeply nested conditionals
- **Composition over inheritance**
- **Never use `any`** — use `unknown` instead

### Testing

- **TDD mandate** — Red → Green → Refactor → Commit. One cycle per commit.
- **`vi.hoisted()`** for shared mock state referenced in `vi.mock()` factories
- **`class` syntax** for mock constructors (arrow fns can't be `new`-ed)
- **`.tsx` extension** for test files containing JSX
- **Source-reading tests** are valid for server-only modules — strip comments before regex-matching
- **Mock AI provider SDKs** — never make real API calls in tests
- **Stub global `fetch`** for pipeline tests (Steps 5 & 6 download from R2 via `fetch()`)

### Design System

- **CSS-first Tailwind v4** — all tokens in `@theme` block, no `tailwind.config.ts`
- **Kebab-case keyframes** — all 13 `@keyframes` use kebab-case
- **Hex color tokens preserved verbatim** — no OKLCH conversion
- **Amber is rationed** — `#febf00` appears only on CTAs, focus rings, active states, and the hero glow
- **`0.01ms` for reduced-motion** — NOT `0ms` (preserves `animationend` events)

### Operations

- **Zod env validation** — fail fast at module load on missing/invalid vars
- **Build-context fallback** — return placeholders when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`
- **husky + lint-staged** — pre-commit hook runs ESLint + Prettier on staged files
- **GitHub Actions CI** — full quality gate on every PR (lint + typecheck + test + build)
- **Pooled + unpooled DB connections** — pooled for app, unpooled for migrations

---

## 15. Coding Patterns

### Pattern: Server Component Signs URL, Client Component Receives as Prop

```tsx
// Server Component
import { getSignedDownloadUrl } from '@/lib/storage/r2';
export async function ProjectDetailPage({ params }) {
  const { id } = await params;
  const project = await getProject(id, session.user.id);
  const downloadUrl = project.videoKey
    ? await getSignedDownloadUrl('videos', project.videoKey)
    : null;
  return <ProjectDownloadButton downloadUrl={downloadUrl} />;
}

// Client Component — NO r2.ts import
'use client';
export function ProjectDownloadButton({ downloadUrl }: { downloadUrl: string | null }) {
  if (!downloadUrl) return null;
  return <a href={downloadUrl}>Download</a>;
}
```

### Pattern: `verifySession()` for Server Components/Actions, `auth()` for API Routes

```tsx
// Server Component / Server Action — throws NEXT_REDIRECT to /sign-in
import { verifySession } from '@/features/auth/domain/verify-session';
export async function myServerAction() {
  const session = await verifySession(); // redirects if unauthenticated
  // ... action logic
}

// API Route — returns null, respond with 401 JSON
import { auth } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ... route logic
}
```

### Pattern: Scroll Reveal via IntersectionObserver + CSS Data Attributes

```tsx
// Hook sets data-revealed attribute; CSS handles the transition
<ScrollReveal delay={Math.min(idx * 80, 400)}>
  <h3>...</h3>
</ScrollReveal>

// globals.css
[data-reveal] { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; transition-delay: var(--reveal-delay, 0s); }
[data-reveal][data-revealed='true'] { opacity: 1; transform: translateY(0); }
```

### Pattern: Marquee with Duplicated Array for Seamless Loop

```tsx
{/* Duplicate the array so translateX(-50%) creates a seamless infinite loop */}
{[...STYLE_CHIPS, ...STYLE_CHIPS].map((chip, idx) => (
  <StyleChipComponent key={`${chip.label}-${idx}`} label={chip.label} sublabel={chip.sublabel} />
))}
```

### Pattern: `extractSubscriptionPeriodEnd()` Pure Helper

```typescript
// src/features/billing/domain/extract-period-end.ts
export function extractSubscriptionPeriodEnd(subscription: StripeSubscriptionLike): number | null {
  // 1. Prefer the Basil API shape (canonical going forward)
  const itemPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
  if (typeof itemPeriodEnd === 'number') return itemPeriodEnd;
  // 2. Fall back to the pre-Basil top-level field
  const topLevelPeriodEnd = subscription.current_period_end;
  if (typeof topLevelPeriodEnd === 'number') return topLevelPeriodEnd;
  // 3. Neither present
  return null;
}
```

### Pattern: Zod Env Schema with Build-Context Fallback

```typescript
const envSchema = z.object({ /* 29 fields */ });

function parseEnv(): EnvData {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    // Host-mismatch warning for AUTH_URL ↔ NEXT_PUBLIC_APP_URL
    return result.data;
  }
  // Build/test fallback
  const isBuildContext = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'test';
  if (isBuildContext) return placeholders;
  // Real runtime with missing vars — fail fast
  throw new Error(`❌ Invalid environment variables:\n${errors.join('\n')}`);
}

export const env = parseEnv();
```

### Pattern: SSE Route with 2s Polling + Terminal Close

```typescript
export async function GET(req, { params }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: projectId } = await params;
  const project = await getProject(projectId, session.user.id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const stream = new ReadableStream({
    async start(controller) {
      const initial = await readProjectProgress(projectId);
      if (initial) {
        controller.enqueue(encoder.encode(formatSseMessage(initial)));
        if (TERMINAL_STATUSES.has(initial.status)) { controller.close(); return; }
      }
      const interval = setInterval(async () => {
        const current = await readProjectProgress(projectId);
        if (!current) { controller.close(); clearInterval(interval); return; }
        controller.enqueue(encoder.encode(formatSseMessage(current)));
        if (TERMINAL_STATUSES.has(current.status)) { controller.close(); clearInterval(interval); }
      }, 2000);
      req.signal.addEventListener('abort', () => { clearInterval(interval); controller.close(); });
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', ... } });
}
```

---

## 16. Coding Anti-Patterns

### Anti-Pattern: Importing `r2.ts` in a Client Component (H4 updated)

```tsx
// ❌ WRONG — env validation crashes in browser
'use client';
import { getSignedDownloadUrl } from '@/lib/storage/r2'; // CRASH
export function BadComponent() { ... }

// ✅ CORRECT (H4 fix) — Client component fetches a fresh signed URL at click time
// via an API route. The signed URL is never baked into the RSC payload.
// Client Component:
'use client';
export function ProjectDownloadButton({ projectId, hasVideo }: { projectId: string; hasVideo: boolean }) {
  if (!hasVideo) return null;
  const handleDownload = async () => {
    const res = await fetch(`/api/projects/${projectId}/download`);
    const { url } = await res.json();
    // trigger download with the fresh URL
  };
  return <button onClick={handleDownload}>Download</button>;
}

// The OLD pattern (SignedDownloadWrapper — DELETED in H4 fix):
// Server Component signed at SSR time → URL baked into RSC → expired after 1h → 403
```

### Anti-Pattern: Wrapping `verifySession()` in try/catch

```tsx
// ❌ WRONG — catches NEXT_REDIRECT, silently swallows redirect
try {
  const session = await verifySession();
} catch (e) {
  // User sees blank page instead of redirect
}

// ✅ CORRECT — let NEXT_REDIRECT propagate
const session = await verifySession(); // throws if unauthenticated
```

### Anti-Pattern: Using `process.env.*` Directly

```tsx
// ❌ WRONG — bypasses validation, typos silently return undefined
const key = process.env.OPENAI_API_KEY; // typo: OPENAI_APIKEY → undefined

// ✅ CORRECT — Zod-validated env module
import { env } from '@/lib/env';
const key = env.OPENAI_API_KEY; // typo caught at module load
```

### Anti-Pattern: Boxed Cards in Features Section

```tsx
// ❌ WRONG — generic Bootstrap-style card grid
<div className="grid grid-cols-4 gap-4">
  {FEATURES.map(f => (
    <div className="rounded-xl border bg-card shadow p-6">...</div>
  ))}
</div>

// ✅ CORRECT — continuous hairline grid, no boxed cards
<div className="grid grid-cols-4">
  {FEATURES.map((f, idx) => (
    <div className={cn(
      'border-r border-b border-neutral-800 px-8 py-10',
      (idx + 1) % 4 === 0 && 'lg:border-r-0',
      idx >= 4 && 'lg:border-b-0',
    )}>...</div>
  ))}
</div>
```

### Anti-Pattern: Using `any`

```tsx
// ❌ WRONG — ESLint errors, loses type safety
function handle(data: any) { return data.results; }

// ✅ CORRECT — use unknown + narrow
function handle(data: unknown) {
  if (typeof data === 'object' && data !== null && 'results' in data) {
    return (data as { results: unknown[] }).results;
  }
  return [];
}
```

### Anti-Pattern: Arrow Function Mock Constructor

```tsx
// ❌ WRONG — arrow fn can't be `new`-ed
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: sendMock })),
}));

// ✅ CORRECT — use class syntax
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class MockS3Client { send = sendMock; },
}));
```

### Anti-Pattern: JSX in `.test.ts` Files

```tsx
// ❌ WRONG — oxc parse error: "Expected '>' but found 'Identifier'"
// File: src/tests/unit/my-test.test.ts
import { render } from '@testing-library/react';
render(<Component />); // PARSE_ERROR

// ✅ CORRECT — rename to .test.tsx
// File: src/tests/unit/my-test.test.tsx
```

### Anti-Pattern: Framer Motion / GSAP

```tsx
// ❌ WRONG — JS animation library, breaks Lighthouse ≥95
import { motion } from 'framer-motion';
<motion.div animate={{ opacity: 1 }} />

// ✅ CORRECT — CSS-only animation via @keyframes in @theme
<div className="animate-[fade-in-up_0.6s_ease-out_both]" />
```

### Anti-Pattern: `next/font/google` for Outfit

```tsx
// ❌ WRONG — Google Fonts API only serves discrete weights (100, 200, ..., 900)
import { Outfit } from 'next/font/google';
const outfit = Outfit({ weight: '820' }); // ERROR: 820 not available

// ✅ CORRECT — self-hosted variable font via next/font/local
import localFont from 'next/font/local';
const outfit = localFont({
  src: '../../public/fonts/Outfit-VariableFont.woff2',
  weight: '100 900',
  variable: '--font-outfit',
  display: 'swap',
});
// Apply via: style={{ fontWeight: 820 }}
```

---

## 17. Responsive Breakpoint Reference

Tailwind v4 default breakpoints (unchanged):

| Token | Min Width | Target Device |
|---|---|---|
| (default) | 0 | Mobile portrait 375px |
| `sm` | 640px | Mobile landscape / small tablet |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / laptop |
| `xl` | 1280px | Desktop (matches `max-w-7xl`) |
| `2xl` | 1536px | Large desktop |

### Section-Specific Responsive Patterns

**Navbar:**
- `<sm`: hamburger → Sheet (right-side, 300px)
- `≥sm`: logo + 4 nav links + EN dropdown + Sign in + Get Started

**Hero:**
- H1: `text-4xl` (mobile) → `sm:text-5xl` → `md:text-6xl` → `lg:text-[4.5rem]`
- Glass input padding: `1.25rem` (mobile) → `sm:1.5rem`
- Marquee duration: `40s` (desktop) → `30s` (`max-width: 640px`)

**Features:**
- `grid-cols-1` (mobile) → `md:grid-cols-2` → `lg:grid-cols-4`

**Testimonials:**
- `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3`

**Use Cases:**
- `grid-cols-1` → `lg:grid-cols-2`

**Workflow:**
- Stacked (mobile) → `lg:grid-cols-2` alternating (desktop)

**Final CTA:**
- H2: `text-3xl` → `sm:text-5xl` → `md:text-7xl`

---

## 18. Z-Index Layer Map

| Z-Index | Element | Location |
|---|---|---|
| `z-50` | Navbar (fixed header) | `navbar.tsx` |
| `z-50` | Skip-to-content link (when focused) | `layout.tsx` |
| `z-50` | Mobile Sheet (Radix Dialog overlay) | `sheet.tsx` |
| `z-10` | Hero content layer (above video bg) | `hero.tsx` |
| `z-10` | Hero style chips marquee | `hero.tsx` |
| `z-0` | Hero background video + overlays | `hero.tsx` |
| `z-0` | Hero bottom fade | `hero.tsx` |
| `-z-10` | Examples carousel hover glow (behind card) | `examples.tsx` |

**Rule:** The Navbar is always `z-50` (highest). Hero content is `z-10` (above background `z-0`). The Examples hover glow is `-z-10` (behind the card body).

---

## 19. Color Reference (Complete)

### Semantic Color Tokens (from `@theme`)

| Token | Hex | RGB | Usage |
|---|---|---|---|
| `--color-background` | `#020202` | `rgb(2, 2, 2)` | Page background (near-black, warm-neutral — NOT pure #000) |
| `--color-foreground` | `#f8f8f8` | `rgb(248, 248, 248)` | Default foreground text |
| `--color-card` | `#060607` | `rgb(6, 6, 7)` | Card surfaces |
| `--color-card-foreground` | `#f8f8f8` | `rgb(248, 248, 248)` | Card text |
| `--color-popover` | `#0b0b0d` | `rgb(11, 11, 13)` | Dropdown/Sheet background |
| `--color-popover-foreground` | `#f8f8f8` | `rgb(248, 248, 248)` | Popover text |
| `--color-primary` | `#febf00` | `rgb(254, 191, 0)` | Amber — CTAs, focus rings, active states |
| `--color-primary-foreground` | `#020202` | `rgb(2, 2, 2)` | Text on amber background |
| `--color-secondary` | `#111114` | `rgb(17, 17, 20)` | Secondary surfaces |
| `--color-secondary-foreground` | `#f8f8f8` | `rgb(248, 248, 248)` | Secondary text |
| `--color-muted` | `#1a1a1d` | `rgb(26, 26, 29)` | Muted backgrounds |
| `--color-muted-foreground` | `#8e8e95` | `rgb(142, 142, 149)` | Muted text (zinc-400 equivalent) |
| `--color-accent` | `#febf00` | `rgb(254, 191, 0)` | Accent (same as primary) |
| `--color-accent-foreground` | `#020202` | `rgb(2, 2, 2)` | Text on accent |
| `--color-destructive` | `#ff2d39` | `rgb(255, 45, 57)` | Error/destructive actions |
| `--color-destructive-foreground` | `#f8f8f8` | `rgb(248, 248, 248)` | Text on destructive |
| `--color-border` | `#1a1a1d` | `rgb(26, 26, 29)` | Default borders |
| `--color-input` | `#0b0b0d` | `rgb(11, 11, 13)` | Input backgrounds |
| `--color-ring` | `#febf0080` | `rgba(254, 191, 0, 0.5)` | Focus ring (amber at 50%) |

### Chart Palette (Reserved)

| Token | Hex | Usage |
|---|---|---|
| `--color-chart-1` | `#febf00` | Amber |
| `--color-chart-2` | `#00aa6f` | Green |
| `--color-chart-3` | `#8d92f9` | Periwinkle |
| `--color-chart-4` | `#f14d4c` | Red |
| `--color-chart-5` | `#7bc27e` | Light green |

### Tailwind Utility Color Usage (Direct)

| Tailwind Class | Hex | Where Used |
|---|---|---|
| `bg-zinc-950` | `#09090b` | Navbar (scrolled), section backgrounds |
| `bg-zinc-900` | `#18181b` | Card backgrounds, video containers |
| `bg-zinc-800` | `#27272a` | Initials avatar fallback |
| `text-zinc-300` | `#d4d4d8` | Body text (~13.5:1 on #020202 — AAA) |
| `text-zinc-400` | `#a1a1aa` | Secondary text |
| `text-zinc-500` | `#71717a` | Tertiary text, footer links |
| `text-zinc-600` | `#52525b` | Muted counters, step numbers |
| `text-amber-400` | `#fbbf24` | Active ratio toggle, hover states (NOT the brand amber) |
| `text-amber-300` | `#fcd34d` | CTA hover text |
| `border-neutral-800` | `#262626` | Features hairline grid dividers |
| `border-white/10` | `rgba(255,255,255,0.1)` | Navbar border, FAQ item borders |
| `border-white/[0.06]` | `rgba(255,255,255,0.06)` | Footer border, Use Cases cards |
| `border-white/5` | `rgba(255,255,255,0.05)` | Examples card borders |
| `bg-white/[0.02]` | `rgba(255,255,255,0.02)` | Style chips inactive bg |
| `bg-white/[0.04]` | `rgba(255,255,255,0.04)` | Nav link hover bg |
| `bg-white/[0.06]` | `rgba(255,255,255,0.06)` | Story example chips bg |

### The Singular Purple Exception

The ONLY purple on the entire site is the Examples carousel hover glow:

```css
bg-gradient-to-r from-yellow-500 to-purple-500
```

- `from-yellow-500`: `#eab308`
- `to-purple-500`: `#a855f7`

This is a deliberate design choice documented in the deviation report. Do not add purple anywhere else.

### Amber Gradient (Testimonials Avatar)

```css
background: linear-gradient(to bottom right, #fbbf24, #d97706);
```

- `#fbbf24`: amber-400 (lighter)
- `#d97706`: amber-600 (darker)

### Glass Input RGBA Colors

```css
background-color: rgb(9 9 11 / 0.6);           /* #09090b at 60% opacity */
border: 1px solid rgb(255 255 255 / 0.08);     /* white at 8% */
&:hover { border-color: rgb(255 255 255 / 0.12); }  /* white at 12% */
&:focus-within {
  border-color: rgb(251 191 36 / 0.3);         /* amber at 30% */
  box-shadow: var(--shadow-hero-input), 0 0 30px rgb(251 191 36 / 0.1);  /* amber at 10% */
}
```

### WCAG Contrast Ratios (Measured)

| Foreground | Background | Ratio | Standard |
|---|---|---|---|
| `#d4d4d8` (zinc-300) | `#020202` | ~13.5:1 | AAA ✓ |
| `#8e8e95` (muted-foreground) | `#020202` | ~6.1:1 | AA ✓, AAA ✗ |
| `#febf00` (amber primary) | `#020202` | ~13.4:1 | AAA ✓ |
| `#71717a` (zinc-500) | `#020202` | ~4.5:1 | AA ✓ (large text only) |

---

## 20. The Complete TypeScript Interface Reference

All shared interfaces live in `src/types/index.ts`. Components import these rather than defining inline types.

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

### Domain-Specific Interfaces (in feature files)

#### Pipeline Domain

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
  moderationSkipped: boolean;
}
```

#### Billing Domain

```typescript
// src/features/billing/domain/tier-limits.ts
export const TIER_LIMITS = {
  free: { monthlyCredits: 50 },
  creator: { monthlyCredits: 500 },
  pro: { monthlyCredits: 2000 },
  studio: { monthlyCredits: 10000 },
} as const;

export const CREDIT_COSTS = {
  analysis: 5,
  character_generation: 10,
  scene_generation: 8,
  voiceover: 15,
  subtitle_alignment: 3,
  video_assembly: 30,
} as const;
```

#### SSE Progress

```typescript
// src/lib/hooks/use-project-progress.ts
export interface ProjectProgressState {
  status: string | null;
  progressPercent: number | null;
  progressDetail: string | null;
  errorMessage: string | null;
  connectionState: 'connecting' | 'open' | 'closed' | 'error' | 'reconnecting';
}
```

#### Stripe Webhook Helper

```typescript
// src/features/billing/domain/extract-period-end.ts
interface StripeSubscriptionLike {
  current_period_end?: number | null;
  items?: {
    data?: Array<{ current_period_end?: number | null }>;
  };
}

export function extractSubscriptionPeriodEnd(
  subscription: StripeSubscriptionLike
): number | null;
```

---

## Appendix A: File Structure (Complete)

```
story-into-video/
├── src/
│   ├── app/                          # Layer 1: App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   ├── (app)/                    # Authenticated app (proxy-protected)
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── create/page.tsx
│   │   │   ├── projects/[id]/page.tsx
│   │   │   └── billing/page.tsx
│   │   ├── (legal)/
│   │   │   ├── privacy/page.tsx
│   │   │   └── terms/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   # force-dynamic
│   │   │   ├── inngest/route.ts              # force-dynamic
│   │   │   ├── stripe/webhook/route.ts       # force-dynamic
│   │   │   ├── projects/[id]/progress/route.ts  # SSE, maxDuration=800
│   │   │   └── health/route.ts               # force-dynamic
│   │   ├── layout.tsx                # Root: fonts, metadata, Providers, skip-to-content
│   │   ├── page.tsx                  # Marketing page (10 sections)
│   │   ├── globals.css               # @theme + 13 keyframes + 7 @utility + a11y
│   │   └── icon.tsx                  # Dynamic favicon
│   ├── components/
│   │   ├── primitives/               # Marketing presentational (7 files)
│   │   │   ├── cta-amber.tsx         # Tier-4 solid amber pill
│   │   │   ├── cta-gradient.tsx      # Tier-3 amber gradient pill
│   │   │   ├── cta-ghost.tsx         # Tier-1 ghost link with arrow
│   │   │   ├── eyebrow.tsx           # Amber badge with glow
│   │   │   ├── scroll-reveal.tsx     # IntersectionObserver wrapper
│   │   │   ├── section-heading.tsx   # H2 fluid clamp
│   │   │   └── style-chip.tsx        # Marquee chip (div or button)
│   │   ├── sections/                 # Marketing page sections (10 files)
│   │   │   ├── navbar.tsx            # 'use client' — scroll-aware + Sheet
│   │   │   ├── hero.tsx              # 'use client' — 4-layer cinematic
│   │   │   ├── examples.tsx          # 'use client' — carousel
│   │   │   ├── workflow.tsx          # 'use client' — alternating video/text
│   │   │   ├── features.tsx          # server — 4×2 hairline grid
│   │   │   ├── testimonials.tsx      # server — 3×2 grid
│   │   │   ├── use-cases.tsx         # server — 2×2 grid
│   │   │   ├── faq.tsx               # 'use client' — Radix Accordion
│   │   │   ├── final-cta.tsx         # server — dot-grid + amber pill
│   │   │   └── footer.tsx            # server — 3 columns + legal
│   │   ├── ui/                       # Hand-written shadcn (4 files)
│   │   │   ├── button.tsx            # cva variants + Radix Slot
│   │   │   ├── accordion.tsx         # Radix Accordion + grid-rows
│   │   │   ├── sheet.tsx             # Radix Dialog (mobile nav)
│   │   │   └── dropdown-menu.tsx     # Radix DropdownMenu (language)
│   │   └── app/                      # App components (7 files)
│   │       ├── auth-form.tsx         # 'use client' — Google + credentials (C1: sign-up mode)
│   │       ├── create-wizard.tsx     # 'use client' — story input + style + ratio
│   │       ├── empty-state.tsx       # Reusable empty-state
│   │       ├── providers.tsx         # 'use client' — SessionProvider
│   │       ├── project-progress-panel.tsx  # 'use client' — SSE subscriber
│   │       ├── project-download-button.tsx # 'use client' — H4: fetches /api/projects/[id]/download at click time
│   │       └── project-share-button.tsx    # 'use client' — Web Share API
│   ├── features/                     # Layer 2 + 3: Feature modules
│   │   ├── auth/
│   │   │   ├── actions.ts            # C1 fix: signUpAction server action
│   │   │   └── domain/verify-session.ts   # DAL auth (throws NEXT_REDIRECT)
│   │   ├── projects/
│   │   │   ├── queries.ts            # getUserProjects, getProject (LEFT JOIN videos)
│   │   │   └── actions.ts            # 'use server' — createProjectAction
│   │   ├── pipeline/
│   │   │   ├── queries.ts            # appendCharacter/Scene/Voiceover/Video
│   │   │   ├── inngest.ts            # 6-step pipeline function
│   │   │   └── domain/               # Pure functions (8 files)
│   │   │       ├── analyze-story.ts          # GPT-4o JSON mode
│   │   │       ├── moderate-content.ts       # OpenAI Moderation API
│   │   │       ├── moderate-image.ts         # Replicate safety_concept parser
│   │   │       ├── generate-character.ts     # Replicate SDXL
│   │   │       ├── generate-scene.ts         # Replicate SDXL + IP-Adapter
│   │   │       ├── synthesize-voice.ts       # ElevenLabs TTS (chunked)
│   │   │       ├── align-subtitles.ts        # Whisper ASR → SRT
│   │   │       └── assemble-video.ts         # FFmpeg compositor
│   │   └── billing/
│   │       ├── queries.ts            # getOrCreateSubscription, debitCredits
│   │       ├── actions.ts            # 'use server' — checkoutAction, portalAction
│   │       └── domain/
│   │           ├── tier-limits.ts    # TIER_LIMITS + CREDIT_COSTS
│   │           └── extract-period-end.ts  # Stripe Basil API helper
│   ├── lib/                          # Layer 4: Infrastructure
│   │   ├── db/
│   │   │   ├── index.ts              # Drizzle client (Neon pooled)
│   │   │   ├── seed.ts               # Dev seed data
│   │   │   └── schema/               # 4 files, 11 tables, 8 enums
│   │   │       ├── index.ts          # Barrel re-export
│   │   │       ├── auth.ts           # users, accounts, sessions, verificationTokens
│   │   │       ├── projects.ts       # projects, characters, scenes
│   │   │       ├── media.ts          # videos, voiceovers
│   │   │       └── billing.ts        # subscriptions, usageEvents
│   │   ├── env/index.ts              # Zod-validated env (31 vars + FFMPEG_PATH)
│   │   ├── auth/
│   │   │   ├── config.ts             # Auth.js v5 (Google + Credentials, trustHost)
│   │   │   └── index.ts              # Re-exports auth, handlers, signIn, signOut
│   │   ├── ai/
│   │   │   ├── openai.ts             # GPT-4o, Whisper, Moderation
│   │   │   ├── replicate.ts          # SDXL + IP-Adapter (env-configurable models)
│   │   │   └── elevenlabs.ts         # TTS + DEFAULT_VOICE_ID
│   │   ├── inngest/
│   │   │   ├── client.ts             # Inngest client + PIPELINE_EVENT
│   │   │   └── functions.ts          # Function registrations
│   │   ├── storage/r2.ts             # S3-compatible R2 client + putObject + signed URLs
│   │   ├── rate-limit.ts             # C3: Upstash Ratelimit (auth, pipeline, SSE)
│   │   ├── stripe/client.ts          # Stripe SDK + PRICE_IDS
│   │   ├── data/                     # Static marketing data (10 files)
│   │   ├── hooks/                    # Custom React hooks (4 files)
│   │   │   ├── use-scrolled.ts
│   │   │   ├── use-reveal.ts
│   │   │   ├── use-reduced-motion.ts
│   │   │   └── use-project-progress.ts
│   │   ├── fonts.ts                  # Geist + Outfit variable font config
│   │   └── utils.ts                  # cn() utility (clsx + tailwind-merge)
│   ├── tests/
│   │   ├── unit/                     # 43 files, 377 tests
│   │   ├── e2e/                      # 9 spec files, 48 tests
│   │   └── setup.ts                  # jest-dom + test env vars
│   ├── types/index.ts                # 12 marketing interfaces
│   └── proxy.ts                      # Layer 0: route protection (Edge runtime)
├── .github/workflows/ci.yml          # lint + typecheck + test + build
├── .husky/pre-commit                 # lint-staged on staged files
├── public/
│   ├── fonts/Outfit-VariableFont.woff2  # 45KB, weight 100-900
│   ├── examples/example-{1-6}.webp      # 9:16 portrait thumbnails
│   ├── workflow/showcase-step{1-4}.mp4  # Looping demo videos
│   ├── workflow/showcase-step{1-4}-poster.webp
│   ├── hero-bg.mp4                      # Background video
│   ├── hero-poster.webp                 # Background poster
│   └── og-image.png                     # Open Graph image
├── scripts/
│   ├── download-assets.sh            # Download R2 workflow videos + posters
│   ├── generate-thumbnails.sh        # Generate example thumbnails
│   └── init-extensions.sql           # Postgres extensions
├── drizzle/                          # Migration SQL files
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
├── drizzle.config.ts
├── components.json                   # shadcn/ui config (new-york style)
├── pnpm-workspace.yaml               # allowBuilds (pnpm 10.26+)
├── vitest.config.ts
├── playwright.config.ts
└── .env.example                      # 30 env vars documented
```

---

## Appendix B: Routes (15 total)

| Route | Type | Purpose |
|---|---|---|
| `/` | ○ Static | Marketing page (10 sections) |
| `/sign-in`, `/sign-up` | ○ Static | Auth pages (Google OAuth + email/password + **C1: signUpAction**) |
| `/dashboard` | ƒ Dynamic | Project list (auth-protected, Suspense + empty state) |
| `/create` | ○ Static | Project creation wizard (auth-protected, **C3: rate-limited**) |
| `/projects/[id]` | ƒ Dynamic | Project detail + live pipeline status (SSE, owner-checked) |
| `/billing` | ○ Static | 4-tier plan table + upgrade CTAs |
| `/privacy` | ○ Static | Privacy Policy (mandatory for launch) |
| `/terms` | ○ Static | Terms of Service (mandatory for launch) |
| `/api/auth/[...nextauth]` | ƒ Dynamic | Auth.js catch-all |
| `/api/inngest` | ƒ Dynamic | Inngest webhook (6-step pipeline) |
| `/api/stripe/webhook` | ƒ Dynamic | Stripe webhook (signature-verified, **H7: idempotent via ON CONFLICT**) |
| `/api/projects/[id]/progress` | ƒ Dynamic | SSE progress stream (2s polling, owner-checked, **C3: rate-limited**, maxDuration=800) |
| `/api/projects/[id]/download` | ƒ Dynamic | **H4 fix: Click-time R2 URL signing** (fresh signed URL per request) |
| `/api/health` | ƒ Dynamic | **H9 fix: Health check** (DB `SELECT 1` + FFmpeg `accessSync`, 503 if unhealthy) |
| Proxy | ƒ Proxy | Protects `/dashboard`, `/create`, `/settings`, `/billing`, **`/projects`** + **H6: Host header validation** |

---

## Appendix C: Database Schema (11 tables, 8 enums)

### Auth Tables (`auth.ts`)
- `users` (id, email, emailVerified, name, image, passwordHash, createdAt)
- `accounts` (userId, type, provider, providerAccountId, refresh_token, access_token, ...)
- `sessions` (sessionToken, userId, expires)
- `verificationTokens` (identifier, token, expires)

### Project Tables (`projects.ts`)
- `projects` (id, userId, title, story, style, aspectRatio, status, progressDetail, progressPercent, creditsCost, errorMessage, createdAt, updatedAt)
- `characters` (id, projectId, name, description, referenceImageKey, createdAt)
- `scenes` (id, projectId, order, description, generatedImageKey, duration, createdAt)

### Media Tables (`media.ts`)
- `videos` (id, projectId, videoKey, subtitleKey, duration, resolution, status, createdAt)
- `voiceovers` (id, projectId, voiceId, voiceName, audioKey, duration, transcript, createdAt)

### Billing Tables (`billing.ts`)
- `subscriptions` (id, userId, stripeCustomerId, stripeSubscriptionId, plan, status, creditsRemaining, currentPeriodEnd, createdAt, updatedAt)
- `usageEvents` (id, userId, projectId, type, cost, metadata, timestamp)

### Enums (8)
1. `project_status`: draft, pending, analyzing, generating_characters, generating_scenes, synthesizing_voice, aligning_subtitles, assembling_video, completed, failed
2. `visual_style`: ghibli, medieval, oil-painting, anime, japanese-animation, realistic, cyberpunk, watercolor, comic
3. `aspect_ratio`: portrait, landscape
4. `video_status`: pending, rendering, completed, failed
5. `video_resolution`: 720p, 1080p, 4k
6. `plan`: free, creator, pro, studio
7. `subscription_status`: active, trialing, past_due, canceled, incomplete, incomplete_expired, unpaid
8. `usage_event_type`: analysis, character_generation, scene_generation, voiceover, subtitle_alignment, video_assembly, moderation_check, stripe_webhook

---

## Appendix D: The AI Pipeline (6 Steps)

```
Step 0: Moderate story (OpenAI Moderation API — block if flagged)
Step 1: Analyze story (GPT-4o JSON mode → characters + scenes)
Step 2: Generate characters (Replicate SDXL → moderateImage per ADR-011)
Step 3: Generate scenes (Replicate SDXL + IP-Adapter → moderateImage per ADR-011)
Step 4: Synthesize voiceover (ElevenLabs TTS → R2 putObject → appendVoiceover row)
Step 5: Align subtitles (fetch audio from R2 → Whisper ASR → SRT → R2 → updateVideoSubtitle)
Step 6: Assemble video (FFmpeg → R2 putObject('videos') → appendVideo row)
Final: Mark project status='completed', progressPercent=100
```

### Credit Costs

| Step | Operation | Credits |
|---|---|---|
| 1 | analysis (GPT-4o) | 5 |
| 2 | character_generation (per character) | 10 |
| 3 | scene_generation (per scene) | 8 |
| 4 | voiceover (ElevenLabs) | 15 |
| 5 | subtitle_alignment (Whisper) | 3 |
| 6 | video_assembly (FFmpeg) | 30 |
| — | moderation_check | 0 (free, logged for audit) |
| — | stripe_webhook | 0 (free, logged for audit) |

### Tier Limits

| Plan | Monthly Credits |
|---|---|
| Free | 50 |
| Creator | 500 |
| Pro | 2,000 |
| Studio | 10,000 |

---

*End of SKILL.md — Version 4.0.0*
