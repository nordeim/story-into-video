# StoryIntoVideo

> Production SaaS for an AI-powered story-into-video generator. Originally a pixel-accurate marketing clone of [storyintovideo.com](https://storyintovideo.com/) — now a hybrid Next.js app with full backend: auth, database, AI pipeline, and billing.

## Overview

StoryIntoVideo transforms written stories into fully produced video content. This repository contains:

1. **A pixel-accurate marketing front end** — every color token (field-verified from the live DOM), all 13 CSS keyframes, and every hover micro-interaction reproduced to within ~5px tolerance. Lighthouse ≥95.
2. **A full production backend** — Auth.js v5 authentication, Drizzle/PostgreSQL database, a 6-step Inngest AI pipeline (story analysis → character generation → scene generation → voiceover → subtitles → video assembly), Stripe billing with credit metering, and Cloudflare R2 storage.

The marketing page is preserved verbatim from the clone; the production app layer is built behind it using a 5-layer architecture (middleware → app → features → domain → infrastructure).

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 | App Router, hybrid rendering (static marketing + dynamic app) |
| UI | React 19.2.3+ | Strict TypeScript, zero `any`. Pinned above CVE-2025-55182 (React2Shell RCE) — never downgrade below 19.2.3. |
| Styling | Tailwind CSS v4 | CSS-first `@theme` block (no `tailwind.config.js`) |
| Components | shadcn/ui (Radix) | 4 hand-written primitives + 8 app components |
| Fonts | Geist Sans + Geist Mono + Outfit 820 | Self-hosted via `next/font` (no CDN) |
| Auth | Auth.js v5 (NextAuth) | Google OAuth + Credentials, Drizzle adapter, JWT sessions |
| Database | PostgreSQL (Neon) + Drizzle ORM | 11 tables, 8 enums, migration via `drizzle-kit` |
| Job Queue | Inngest | 6-step AI pipeline, per-step retries, idempotent |
| AI — LLM | OpenAI GPT-4o + Whisper + Moderation | Story analysis, ASR, content moderation |
| AI — Image | Replicate SDXL + IP-Adapter | Character portraits + consistent scene generation |
| AI — TTS | ElevenLabs | Voiceover synthesis (chunked for long text) |
| Storage | Cloudflare R2 | S3-compatible, zero egress, signed URLs |
| Billing | Stripe | Checkout + Customer Portal + Webhooks, credit-based metering |
| Validation | Zod | Env vars + all Server Action inputs |
| Video | FFmpeg (system binary) | Scene + audio + subtitle composition → MP4. Path via `FFMPEG_PATH` env var (default `/usr/bin/ffmpeg`). No npm installer dependency. |
| CI/CD | GitHub Actions | `.github/workflows/ci.yml` — lint + typecheck + test + build on every PR + e2e job (Postgres service container, continue-on-error) |
| Quality | ≥95 Lighthouse | Performance, Accessibility, Best Practices, SEO (marketing page) |

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 10.26 (`allowBuilds` syntax floor in `pnpm-workspace.yaml`)
- A Neon PostgreSQL database (or any Postgres instance)
- External service accounts (see `.env.example` for the full list)

### Setup

```bash
# Clone and install
git clone <repository-url>
cd story-into-video
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your real credentials

# Set up the database
pnpm drizzle:generate       # Create migration SQL from schema (loads .env.local)
pnpm drizzle:migrate        # Apply migrations to Neon (loads .env.local)

# Run development server (Turbopack)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the marketing page loads with dark background (`#020202`), Outfit font on H1, and Geist Sans on body text. Auth-protected routes (`/dashboard`, `/create`, `/billing`) redirect to `/sign-in` if unauthenticated. Public content pages `/pricing`, `/blog`, `/contact` (Sprint 3 T6) render as Server Components alongside the existing `/privacy` + `/terms`. A `CookieBanner` (Sprint 3 T8) is mounted in the root layout for GDPR/CCPA consent collection on every page.

### Production Deployment Checklist (Action 2 + 3)

Before any production deployment, ensure the following are set correctly in your production env:

1. **Set the production host** (critical — T1 will throw if wrong):
   ```bash
   AUTH_URL=https://storyintovideo.jesspete.shop
   NEXT_PUBLIC_APP_URL=https://storyintovideo.jesspete.shop
   ```
2. **Validate the env file** before deploying:
   ```bash
   ENV_FILE=.env.production node scripts/check-env.js
   ```
3. **Deploy and verify** using the post-deployment script:
   ```bash
   DEPLOYMENT_URL=https://storyintovideo.jesspete.shop node scripts/verify-deployment.js
   ```

> ⚠️ **If the app returns 502 after deploy**, T1 detected a host mismatch and threw at boot. Check the `AUTH_URL` and `NEXT_PUBLIC_APP_URL` values.

### Verification

```bash
# Type check — must pass with zero errors
pnpm typecheck

# Lint — must pass with zero warnings
pnpm lint

# Unit tests (Vitest) — 479 tests across 53 files
pnpm test

# E2E tests (Playwright) — 48 tests, auto-starts dev server
# (requires `pnpm exec playwright install` first)
pnpm test:e2e

# Format check — all files use Prettier code style
pnpm format:check

# Pre-deployment env validation (catches host-mismatch that would break T1)
# Run before any production deployment to verify env configuration
node scripts/check-env.js

# Post-deployment live site verification (Action 3 checklist)
# Run after deploying to production to verify the deployment
node scripts/verify-deployment.js
```

## Build & Quality Commands

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build (hybrid: static + dynamic)
pnpm start        # Serve built output
pnpm lint         # ESLint (flat config, next/core-web-vitals + typescript-eslint)
pnpm typecheck    # tsc --noEmit (strict mode, noUncheckedIndexedAccess)
pnpm test         # Vitest unit tests (jsdom env) — 479 tests across 53 files
pnpm test:e2e     # Playwright E2E tests (Chromium)
pnpm format       # Prettier --write (auto-fix)
pnpm format:check # Prettier --check (verify only)
pnpm drizzle:generate      # Create migration SQL from schema changes (loads .env.local)
pnpm drizzle:migrate       # Apply migrations to database (loads .env.local)
pnpm drizzle:studio        # Open Drizzle Studio (schema browser, loads .env.local)
```

**Pre-commit chain:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

**Lighthouse targets (marketing page):**

| Category | Target |
|---|---|
| Performance | ≥ 95 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |

## Architecture

This is a hybrid Next.js app. The marketing page (`/`) is statically prerendered; auth-protected app routes (`/dashboard`, `/create`, `/projects/[id]`, `/billing`) are dynamic; API routes (`/api/auth`, `/api/inngest`, `/api/stripe/webhook`) are `force-dynamic`. A proxy (Edge runtime) protects authenticated routes. Routes are organized into 3 groups: `(auth)/` (sign-in, sign-up), `(app)/` (authenticated dashboard, create, projects, billing), and `(legal)/` (privacy, terms).

### The 5-Layer Architecture (Golden Rule)

```
Layer 0: src/proxy.ts             — Cookie check, redirect. NO DB. NO logic. Edge runtime. (Renamed from middleware.ts in Next.js 16 migration.)
Layer 1: src/app/                 — Route structure, metadata, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (auth, projects, pipeline, billing)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers. Side effects only.
```

**Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code.

### Routes (22 total)

| Route | Type | Purpose |
|---|---|---|
| `/` | ○ Static | Marketing page (10 sections, unchanged from clone) |
| `/sign-in`, `/sign-up` | ○ Static | Auth pages (Google OAuth + email/password) |
| `/dashboard` | ƒ Dynamic | Project list (auth-protected, Suspense + empty state) |
| `/create` | ○ Static | Project creation wizard (auth-protected) |
| `/projects/[id]` | ƒ Dynamic | Project detail + live pipeline status (SSE, owner-checked) |
| `/billing` | ○ Static | 4-tier plan table + upgrade CTAs (audit-v1 T1: wired to `billingCheckoutAction` Server Action) |
| `/privacy` | ○ Static | Privacy Policy (mandatory for launch) |
| `/terms` | ○ Static | Terms of Service (mandatory for launch) |
| `/pricing` | ○ Static | Pricing page (Server Component, Sprint 3 T6) |
| `/blog` | ○ Static | Blog index (Server Component, Sprint 3 T6) |
| `/contact` | ○ Static | Contact page (Server Component, Sprint 3 T6) |
| `/api/auth/[...nextauth]` | ƒ Dynamic | Auth.js catch-all |
| `/api/inngest` | ƒ Dynamic | Inngest webhook (6-step pipeline) |
| `/api/stripe/webhook` | ƒ Dynamic | Stripe webhook (signature-verified, idempotent) |
| `/api/projects/[id]/progress` | ƒ Dynamic | SSE progress stream (2s polling, owner-checked, rate-limited) |
| `/api/projects/[id]/download` | ƒ Dynamic | Click-time R2 URL signing (H4 fix — fresh signed URL per request; **audit-v1 T6 fix: classifies R2 errors as 502/504/500**) |
| `/api/user/export` | ƒ Dynamic | GDPR data export (Sprint 3 T3; uses `auth()` not `verifySession()`) |
| `/api/user` (DELETE) | ƒ Dynamic | GDPR account deletion + R2 best-effort cleanup (Sprint 3 T4) |
| `/api/health` | ƒ Dynamic | Health check (DB `SELECT 1` + FFmpeg `accessSync`, returns 503 if unhealthy — H9 fix; Sprint 3 T2: response now includes config + configErrors for env-mismatch surfacing) |
| `/_not-found` | ○ Static | Custom 404 page (Sprint 3 T7) |
| Middleware | ƒ Proxy | Protects `/dashboard`, `/create`, `/settings`, `/billing`, `/projects` + Host header validation (H6) |

### Marketing Page — Component Rendering Strategy

The marketing page composes 10 sections in `src/app/page.tsx`. Five are client-side (interactivity), five are server components (static HTML).

```mermaid
flowchart TB
    Layout["src/app/layout.tsx<br/>Fonts · Metadata · Providers · Skip-to-content"]
    Page["src/app/page.tsx<br/>Marketing page (10 sections)"]

    Layout --> Page

    subgraph Server Components (static)
        Footer["footer.tsx"]
        FinalCTA["final-cta.tsx"]
        Features["features.tsx"]
        Testimonials["testimonials.tsx"]
        UseCases["use-cases.tsx"]
    end

    subgraph Client Components (interactive)
        Navbar["navbar.tsx<br/>scroll-aware"]
        Hero["hero.tsx<br/>textarea + chips + counter"]
        Examples["examples.tsx<br/>carousel arrows"]
        Faq["faq.tsx<br/>Radix Accordion"]
        Workflow["workflow.tsx<br/>video loading state"]
    end
```

| Component | Type | Reason |
|---|---|---|
| Navbar | `'use client'` | Scroll state, mobile Sheet toggle |
| Hero | `'use client'` | Textarea, chip click, ratio toggle, character counter |
| Examples | `'use client'` | Carousel arrow click handlers |
| Faq | `'use client'` | Radix Accordion (stateful) |
| Workflow | `'use client'` | `useState` for poster→video fade-in choreography |
| Features, Testimonials, UseCases, FinalCTA, Footer | Server | Pure static HTML/CSS |

### Marketing Section Order (Fixed)

```
Navbar (fixed)
 → Hero (video bg + glass input + style marquee)
 → Examples carousel
 → 4-Step Workflow
 → Features grid
 → Testimonials
 → Use Cases
 → FAQ
 → Final CTA
 → Footer
```

### The AI Pipeline (Inngest, 6 Steps — fully wired)

The core product is a multi-step async pipeline that transforms a user's story into a finished video. Orchestrated by Inngest (per-step retries, idempotent, 5–15 min total). Triggered automatically by `createProjectAction` via `inngest.send({ name: PIPELINE_EVENT, data: { projectId } })`:

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

Each step is a pure domain function in `src/features/pipeline/domain/` (no Next.js or DB runtime imports), debits credits via a Drizzle transaction with deterministic idempotency keys (**C5/C6 fix: ALL 6 steps now debit** — analysis=5, char=10/each, scene=8/each, voiceover=15, subtitle_alignment=3, video_assembly=30; total=131 for 3 chars + 6 scenes), and updates `project.status` + `progressDetail`. `debitCredits()` uses `ON CONFLICT (idempotency_key) DO NOTHING` + `.for('update')` row lock — race-condition-proof. **T3 fix: `createProjectAction` wraps the project INSERT + analysis debit in a single `db.transaction()` via the new `debitCreditsTx(tx, ...)` variant** — if the debit throws `InsufficientCreditsError`, the INSERT rolls back (no orphan project rows). **T7 fix: `inngest.send()` is wrapped in try/catch → `setProjectFailed()` on failure** (no pending-orphan when Inngest is unreachable). Image moderation (Steps 2 & 3) parses Replicate's `safety_concept` / `api_safety_concept` fields (**H8 fix: defaults to fail-closed in production**; **T9 fix: `getFailOpen()` reads per-call, testable without module re-import**). **T8 fix: `appendVideo` inserts with `status: 'rendering'`; `updateVideo` sets `status: 'completed'`** (no more contradictory completed+null-videoKey state). Rate limiting (C3) prevents abuse. Live progress is streamed to the project detail page via SSE at `/api/projects/[id]/progress` (**T5 fix: SSE uses `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern instead of fixed-window rate limit — releases on disconnect for immediate reconnection**).

## Design System

### Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#020202` | Page background (near-black, NOT pure #000) |
| `--primary` | `#febf00` | CTAs, active states, focus rings (NOT Tailwind amber-400) |
| `--card` | `#060607` | Card surfaces |
| `--muted-foreground` | `#8e8e95` | Secondary text |
| `--foreground` | `#f8f8f8` | Default foreground text |
| Body text | `#d4d4d8` | Paragraph/body text (zinc-300, used via Tailwind utility) |

### Typography

| Role | Font | Weight | Key Class |
|---|---|---|---|
| Display headings | Outfit | **820** | `font-heading` |
| Body, UI | Geist Sans | 400–600 | `font-sans` |
| Accents, toggles | Geist Mono | 400 | `font-mono` |

Outfit weight 820 is self-hosted via `next/font/local` (Google Fonts API only serves discrete weights).

### Animation

All motion is pure CSS `@keyframes` — no Framer Motion, no GSAP. 13 keyframes defined in `app/globals.css`:

```
fade-in-up, float, glow-pulse, border-glow, composite-pulse-text,
shimmer, btn-shimmer, grid-shimmer, grid-sweep-h, grid-sweep-v,
scanline-scroll, lang-dropdown-in, marquee-scroll
```

Scroll-reveal uses `IntersectionObserver` + a `data-revealed` attribute pattern.

### Responsive Breakpoints

| Token | Min Width | Target |
|---|---|---|
| (default) | 0 | Mobile portrait 375px |
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / laptop |
| `xl` | 1280px | Desktop (matches `max-w-7xl`) |
| `2xl` | 1536px | Large desktop |

### Accessibility

- Focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary` (T11: was `outline-amber-400` — now uses the brand `--color-primary: #febf00` token)
- Skip-to-content link at page top
- Hero video: `aria-hidden="true"` (decorative, no audio)
- `prefers-reduced-motion: reduce` globally disables all animation
- Color contrast: zinc-300 on zinc-950 = 12.6:1 (WCAG AAA)
- Touch targets ≥ 44×44px on mobile

## Project Structure

```
src/
├── app/                          # Layer 1: App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (app)/                    # Authenticated app (middleware-protected)
│   │   ├── dashboard/page.tsx
│   │   ├── create/page.tsx
│   │   ├── projects/[id]/page.tsx
│   │   └── billing/page.tsx
│   ├── (legal)/                  # Public legal/content pages
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── pricing/page.tsx              # Sprint 3 T6
│   │   ├── blog/page.tsx                 # Sprint 3 T6
│   │   └── contact/page.tsx              # Sprint 3 T6
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # Auth.js (force-dynamic)
│   │   ├── inngest/route.ts              # Inngest webhook
│   │   ├── stripe/webhook/route.ts       # Stripe webhook
│   │   ├── projects/[id]/download/route.ts  # Click-time R2 URL signing (H4)
│   │   ├── user/route.ts                 # GDPR DELETE account (Sprint 3 T4)
│   │   └── user/export/route.ts          # GDPR data export (Sprint 3 T3)
│   ├── layout.tsx                # Root: fonts, metadata, Providers, skip-to-content + CookieBanner mount (Sprint 3 T8)
│   ├── page.tsx                  # Marketing page (10 sections)
│   ├── not-found.tsx             # Custom 404 page (Sprint 3 T7)
│   ├── globals.css               # @theme + 13 keyframes + @utility + a11y
│   └── icon.tsx                  # Dynamic favicon
├── components/
│   ├── primitives/               # Marketing presentational (7 files)
│   ├── sections/                 # Marketing page sections (10 files)
│   ├── ui/                       # Hand-written shadcn (4: button, accordion, sheet, dropdown-menu)
│   └── app/                      # App components (8 files — SignedDownloadWrapper DELETED in H4; +cookie-banner.tsx Sprint 3 T8)
│       ├── auth-form.tsx
│       ├── create-wizard.tsx
│       ├── empty-state.tsx
│       ├── providers.tsx
│       ├── project-progress-panel.tsx
│       ├── project-download-button.tsx
│       ├── project-share-button.tsx
│       └── cookie-banner.tsx
├── features/                     # Layer 2 + 3: Feature modules
│   ├── auth/domain/verify-session.ts       # DAL auth function
│   ├── auth/queries.ts                     # Auth DB queries (Sprint 3 T3/T4: account export + delete helpers)
│   ├── projects/{queries,actions}.ts       # DB access + Server Actions
│   ├── pipeline/
│   │   ├── queries.ts                      # Pipeline state updates
│   │   ├── inngest.ts                      # 6-step pipeline function
│   │   └── domain/                         # Pure functions (8 files)
│   └── billing/{queries,actions,domain/}.ts  # domain/ has tier-limits.ts + extract-period-end.ts
├── lib/                          # Layer 4: Infrastructure
│   ├── db/{index,schema/*}.ts              # Drizzle client + 11 tables
│   ├── env/index.ts                        # Zod-validated env
│   ├── auth/{config,index}.ts              # Auth.js v5
│   ├── ai/{openai,replicate,elevenlabs}.ts # AI clients
│   ├── inngest/{client,functions}.ts
│   ├── storage/r2.ts                       # R2 signed URLs + deleteUserMedia() (Sprint 3 T4)
│   ├── stripe/client.ts
│   ├── data/                               # Static marketing data (10 files)
│   ├── hooks/                              # 4 hooks (use-scrolled, use-reveal, use-reduced-motion, use-project-progress)
│   ├── fonts.ts · utils.ts
├── tests/
│   ├── unit/                     # 53 files, 479 tests
│   ├── e2e/                      # 9 files, 48 tests
│   └── setup.ts                  # jest-dom + test env vars
├── types/index.ts                # 12 marketing interfaces
└── proxy.ts                      # Layer 0: route protection (Edge runtime)

.husky/
└── pre-commit                    # Runs `pnpm lint-staged` on staged files
```

## Database Schema

11 tables across 4 schema files (`src/lib/db/schema/`), with 8 enums:

- **Auth** (`auth.ts`): `users` (with `passwordHash` for credentials), `accounts`, `sessions`, `verificationTokens`
- **Projects** (`projects.ts`): `projects` (with `status` enum: draft→pending→analyzing→...→completed/failed), `characters`, `scenes`
- **Media** (`media.ts`): `videos`, `voiceovers`
- **Billing** (`billing.ts`): `subscriptions` (with `plan` enum, `creditsRemaining`), `usageEvents`

**Enums (8):** `project_status`, `visual_style`, `aspect_ratio`, `video_status`, `video_resolution`, `plan`, `subscription_status`, `usage_event_type`

Run `pnpm drizzle:studio` to browse the schema visually.

## Asset Requirements

Marketing media assets are **not version-controlled** — they must be downloaded or generated separately.

| Category | Count | Total Size | Source |
|---|---|---|---|
| Workflow videos + posters | 5 | ~8MB | Download from `r2.storyintovideo.com` |
| Hero background video | 1 | ~2MB | Self-source cinematic footage |
| Example card thumbnails | 6 | ~600KB | Generate or source from stock |

See `Project_Requirements_Document.md` §10 for the full asset manifest with download URLs.

## Key Conventions

| Convention | Detail |
|---|---|
| TypeScript | Strict mode, zero `any`, `interface` for object shapes |
| Client components | Only when state/browser APIs are needed |
| Animation | CSS-only (no Framer Motion, no GSAP) |
| Fonts | Self-hosted via `next/font` (no Google Fonts CDN) |
| Styling | Tailwind v4 CSS-first `@theme` (no `tailwind.config.js`) |
| Env vars | Zod-validated at module load; never `process.env.*` directly |
| Auth | `verifySession()` first in every Server Action; never wrap in try/catch |
| DB access | Through `queries.ts` boundary; components never call `db` directly |
| Migrations | `drizzle-kit generate` + `migrate`; never `db push` in production |
| External deps | No CDN links — all bundled |
| R2 in client | **Never import `@/lib/storage/r2` in client components** — env validation throws in browser. Sign URLs server-side, pass as props. |
| FFmpeg | System binary via `FFMPEG_PATH` env var (default `/usr/bin/ffmpeg`). No `@ffmpeg-installer/ffmpeg` npm package. |

## Asset Pipeline

Media assets are **not version-controlled** in their source form (only the generated files in `/public/` are). To regenerate:

```bash
# Download workflow videos + posters from R2 (idempotent)
./scripts/download-assets.sh

# Generate 6 example thumbnails via z-ai CLI (requires z-ai-web-dev-sdk)
./scripts/generate-thumbnails.sh
```

The Outfit variable font (`public/fonts/Outfit-VariableFont.woff2`, 45KB) was downloaded from the [Google Fonts GitHub repo](https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf) and converted to woff2 via `fonttools`. This is required for weight 820 access (see Decision C in `MASTER_EXECUTION_PLAN.md`).

The hero background video (`public/hero-bg.mp4`, 46KB) was generated from `hero-poster.webp` via ffmpeg's `zoompan` filter (10s, 1920×1080, H.264, subtle 1.0→1.05 zoom).

## Testing

### Unit Tests (Vitest)

479 tests across 53 files, all GREEN:

**Marketing layer (inherited from clone):**

| Test file | Tests | What it covers |
|---|---|---|
| `cn.test.ts` | 8 | `cn()` utility: string merge, conditionals, tailwind-merge dedup, arrays/objects |
| `use-scrolled.test.ts` | 7 | Scroll threshold detection, boundary cases, scroll event updates |
| `use-reveal.test.tsx` | 7 | IntersectionObserver integration, once/toggle modes, disconnect behavior |
| `use-reduced-motion.test.ts` | 4 | matchMedia integration, change event handling |
| `hero-chip-populate.test.tsx` | 5 | Chip → textarea seed population for all 4 chips + replace behavior |
| `hero-ratio-toggle.test.tsx` | 3 | Ratio toggle single-selection enforcement (9:16 ↔ 16:9) |
| `hero-character-counter.test.tsx` | 4 | Counter renders `0 / 5000`, updates on type, amber warning at ≥4500 chars (T11: `text-amber-400` → `text-primary`) |
| `layout-hydration.test.tsx` | 5 | `suppressHydrationWarning` on `<body>`, skip-to-content, JSON-LD, children |
| `metadata.test.ts` | 2 | Canonical URL (`alternates.canonical`) presence + clone-domain resolution |

**Production app layer (Sprints 1-4):**

| Test file | Tests | What it covers |
|---|---|---|
| `routing.test.ts` | 2 | `force-static` removal verified |
| `env.test.ts` | 28 | Zod env validation (fail-fast, weak-secret rejection, build-context fallback, AUTH_URL host-mismatch: warn in dev/test, THROW in production runtime (Sprint 3 T1), OPENAI_API_KEY prefix variants, REPLICATE_SDXL_*_MODEL format validation, **DATABASE_URL `.url().refine()` composition** (Zod v4), **IMAGE_MODERATION_FAIL_OPEN enum validation**) |
| `schema.test.ts` | 15 | Drizzle schema structural validation (all 11 tables + columns) |
| `auth-config.test.ts` | 10 | Auth.js v5 config (providers, adapter, JWT, AUTH_SECRET from env, `trustHost: true`) |
| `verify-session.test.ts` | 4 | `verifySession()` DAL (returns session or throws NEXT_REDIRECT) |
| `proxy.test.ts` | 8 | Route protection, Edge-runtime constraint (no DB), host header validation (H6) |
| `auth-pages.test.ts` | 11 | Sign-in/sign-up pages + AuthForm component (incl. C1 sign-up mode) |
| `dashboard.test.ts` | 8 | Dashboard shell, Suspense, EmptyState, queries.ts boundary |
| `cta-routes.test.ts` | 11 | All 14 marketing CTAs wired to real routes |
| `create-wizard.test.ts` | 9 | Create page, textarea, style selector, ratio toggle, submit |
| `create-project-action.test.ts` | 12 | Server Action (auth-first, Zod, moderation, credits, DB insert, **Inngest trigger**, **T3: INSERT + debit wrapped in `db.transaction()` via `debitCreditsTx`** (no orphan on InsufficientCreditsError), **T7: `inngest.send()` try/catch → `setProjectFailed()`**, C4 insert-before-debit, C3 rate-limiting) |
| `analyze-story.test.ts` | 7 | GPT-4o story analysis + Moderation API (mocked OpenAI) |
| `credit-metering.test.ts` | 12 | Tier limits, credit costs, `debitCredits` transaction (incl. C5 idempotency + `DebitResult`) |
| `pipeline-sprint3.test.ts` | 10 | R2 storage, Replicate character/scene generation, IP-Adapter |
| `sprint4.test.ts` | 12 | ElevenLabs TTS, Whisper ASR, Stripe config + webhook + billing page |

**Remediation sprint (pipeline wiring + UX + compliance):**

| Test file | Tests | What it covers |
|---|---|---|
| `r2-putobject.test.ts` | 6 | R2 `putObject` helper (Buffer → S3 via `PutObjectCommand`) + `MAX_PUT_OBJECT_BYTES` size guard + `PayloadTooLargeError` |
| `pipeline-queries.test.ts` | 10 | `appendVoiceover`, `getProjectVoiceover`, `appendVideo`, `updateVideoSubtitle`, `updateProjectProgress` (incl. C5 `onConflictDoNothing` + `AppendResult`) |
| `assemble-video.test.ts` | 11 | FFmpeg rewrite: SRT temp file, inputOptions per image, Buffer readback, cleanup, temp file lifecycle |
| `pipeline-sprint5.test.ts` | 9 | Steps 4-6 wiring: voiceover, subtitles, video assembly, credit debits, completion |
| `sse-progress.test.ts` | 18 | SSE route source guarantees + `useProjectProgress` hook with mocked EventSource + reconnect with exponential backoff (T6) |
| `project-download.test.tsx` | 14 | `getProject` LEFT JOIN videos, `ProjectDownloadButton` click-time fetch (H4: no `r2.ts` import in client), `ProjectShareButton` clipboard fallback, source-level guarantees |
| `moderate-image.test.ts` | 8 | `moderateImage` parses Replicate safety output, `moderationSkipped` field, env-configurable fail-open policy via `IMAGE_MODERATION_FAIL_OPEN` (read from validated `env` module, not `process.env` directly) (T5) — 7 domain tests + 1 env integration test |
| `legal-pages.test.ts` | 10 | `/privacy` + `/terms` source guarantees (server components, required sections) |

**Remediation Sprint 3 (revenue integrity + auth + security + design):**

| Test file | Tests | What it covers |
|---|---|---|
| `sign-up-action.test.ts` | 12 | C1: `signUpAction` server action — Zod validation, bcrypt hash (cost 12), user insert, subscription creation, auto sign-in, rate limiting |
| `rate-limit.test.ts` | 8 | C3: Upstash Ratelimit — auth (10/15min/IP), pipeline (5/min/user), SSE (1/user/project), `RATE_LIMITED` error code. **T5: also verifies `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` exports** |
| `api-project-download.test.ts` | 12 | H4: `/api/projects/[id]/download` route — auth, owner check, R2 URL signing, error handling. **T6: error classification (502/504/500)** |
| `billing-concurrency.test.ts` | 4 | H10: `.for('update')` row lock concurrency test — 10 parallel `debitCredits` calls, exactly-one semantics |
| `pipeline-credits.test.ts` | 9 | C5/C6: All 6 pipeline steps debit credits with deterministic idempotency keys, `FULL_PIPELINE_COST = 131` formula verification |
| `health.test.ts` | 6 | H9: `/api/health` route — DB `SELECT 1`, FFmpeg `fs.accessSync`, 200/503 status codes. **Sprint 3 T2: response now includes `config` (env-derived runtime config snapshot) + `configErrors` (AUTH_URL host-mismatch, missing required vars) for env-mismatch surfacing** |

**Audit v1 Remediation (T1–T12 — see `AUDIT_REPORT_v1.md` + `REMEDIATION_PLAN_v1.md`):**

| Test file | Tests | What it covers |
|---|---|---|
| `billing-action-wiring.test.ts` | 4 | T1 (C-1): Billing page imports `billingCheckoutAction` Server Action (not broken POST to `/api/stripe/checkout`) |
| `proxy-redirect-url.test.ts` | 3 | T2 (C-2): Proxy redirect uses `env.NEXT_PUBLIC_APP_URL` (not `nextUrl.origin` — fixes ERR_CONNECTION_REFUSED behind reverse proxy) |
| `create-project-action-orphan.test.ts` | 4 | T3 (H-1): `createProjectAction` wraps INSERT + debit in `db.transaction()` via `debitCreditsTx` (no orphan project rows) |
| `stripe-webhook-idempotency.test.ts` | 3 | T4 (H-2): Webhook idempotency INSERT happens AFTER side effects (not before) — prevents permanently-lost subscription updates on transient DB errors |
| `sse-slot-release.test.ts` | 5 | T5 (H-3): SSE route uses `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern (replaces `sseRateLimit.fixedWindow` that never released on disconnect) |
| `brand-tokens.test.ts` | 3 | T11 (M-6): Brand color system — **now ENFORCES 0 violations** (was baseline measurement). Replaced 122 `amber-*` + 27 `bg-zinc-950/900/black` across 45 files with `primary`/`background`/`card` tokens |

**Remediation Sprint 2 (post-review hardening):**

| Test file | Tests | What it covers |
|---|---|---|
| `replicate-models.test.ts` | 3 | Source-level guarantees that `SDXL_MODEL` and `SDXL_IPADAPTER_MODEL` are read from `env` (not hardcoded) (T4) |

**Post-review hardening (design_critique.md remediation):**

| Test file | Tests | What it covers |
|---|---|---|
| `stripe-webhook.test.ts` | 12 | `extractSubscriptionPeriodEnd()` pure helper: Basil API `items.data[0].current_period_end` shape, pre-Basil top-level fallback, missing/null handling, **H7 idempotency** |
| `style-chips.test.ts` | 9 | 8-chip spec fidelity: exact labels (Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, Watercolor), uniqueness, regression guards against drifted labels (H3) |
| `hero-headline.test.tsx` | 5 | 3-line cinematic H1 stack (2 `<br>` tags), Outfit weight 820 inline style, subtitle emphasizes OUTPUT ("finished video") over PROCESS ("subtitles, all generated") |

### E2E Tests (Playwright)

48 tests across 9 spec files, all GREEN (Chromium):

| Spec file | Tests | What it covers |
|---|---|---|
| `hero-cta.spec.ts` | 3 | Hero CTA + Final CTA → `/create`, Navbar Get Started → `/sign-up` |
| `mobile-nav.spec.ts` | 5 | Hamburger opens Sheet, all links present, close button works, desktop links hidden on mobile |
| `faq-accordion.spec.ts` | 3 | Expand/collapse, single-open behavior, all 6 questions present |
| `auth-flow.spec.ts` | 8 | Sign-in, sign-out, middleware redirects |
| `dashboard.spec.ts` | 6 | Project list, navigation |
| `project-detail.spec.ts` | 6 | Story, status, metadata |
| `create-project.spec.ts` | 8 | Form elements, validation, counter |
| `billing.spec.ts` | 6 | Plan tiers, buttons |
| `seed-data.spec.ts` | 6 | Seed data accessibility |

## Implementation Notes

### Deviations from PRD (Marketing Layer)

The canonical marketing spec is `Project_Requirements_Document.md` (v2.0, 2718 lines). The following intentional deviations were made during the original clone implementation (documented in `MASTER_EXECUTION_PLAN.md` §3):

1. **Tailwind v4 CSS-first `@theme`** — all design tokens live in `src/app/globals.css` inside a single `@theme { … }` block. No `tailwind.config.ts` file exists. Aligns with PRD §8.2 future direction.
2. **Kebab-case keyframes** — all 13 `@keyframes` normalized to kebab-case. PRD §9 camelCase and §8.1 kebab conflict; kebab wins.
3. **Outfit variable font self-hosted** — `next/font/local` (not `next/font/google`) for weight 820 access.
4. **`src/` directory convention** — app code in `src/`, not repo root.
5. **ESLint flat config** — direct plugin imports instead of `eslint-config-next` FlatCompat (broken with ESLint 9.39+).
6. **shadcn/ui hand-written** — 4 components; CLI timed out.

### Deviations from Blueprint (Production App Layer)

The engineering blueprint is `PRODUCTION_READINESS_PLAN.md` (11 ADRs, 27 TDD task cards). The following deviations were made during production implementation:

1. **Hybrid rendering** (was `force-static`) — marketing page still static; app routes dynamic; API routes `force-dynamic`. The blueprint specified removing `force-static`; the implementation keeps the marketing page static (it has no dynamic data) while making app routes dynamic.
2. **Lazy env validation with build-context fallback** — the Zod schema returns placeholder values when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`, allowing `next build` to succeed without real env vars. At runtime, fails fast on missing/invalid vars. This wasn't in the blueprint; it was discovered necessary because the auth route handler imports DrizzleAdapter which accesses `env.DATABASE_URL` at module load.
3. **Eager Drizzle client with deferred connection** — `postgres()` doesn't connect until first query, so `src/lib/db/index.ts` exports a real (non-Proxy) Drizzle client that DrizzleAdapter accepts. The blueprint suggested a lazy Proxy; that was rejected by DrizzleAdapter's structure validation.
4. **Auth route as `force-dynamic`** — prevents prerender failure (DrizzleAdapter needs env vars at module load).
5. **Stripe "Basil" API (2025-03-31) `current_period_end` migration** — the field was removed from the top-level Subscription object and moved to `subscription.items.data[0].current_period_end`. The Stripe Node SDK has always used snake_case (no camelCase conversion). The webhook handler uses the `extractSubscriptionPeriodEnd()` pure helper (`src/features/billing/domain/extract-period-end.ts`) which checks the Basil shape first, then falls back to the pre-Basil top-level field.
6. **Inngest v4 `createFunction` signature** — trigger is in the config object (`triggers: [{ event: '...' }]`), not a second argument. The blueprint's pseudocode used the v3 signature.

### Deviations from Blueprint (Remediation Sprint)

The remediation sprint closed 9 of the blueprint's outstanding gaps. The following implementation choices were made:

1. **`assemble-video.ts` full rewrite** — the blueprint specified a placeholder FFmpeg integration; the rewrite writes SRT to `/tmp`, uses `inputOptions` per image, reads the output MP4 into a Buffer, and cleans up temp files. The `buildFfmpegCommand` helper is exported for unit testing.
2. **SSE progress via DB polling (not LISTEN/NOTIFY)** — the blueprint suggested either approach. Polling every 2s was chosen because serverless can't hold long-lived Postgres connections for LISTEN/NOTIFY. 2s is fast enough for a 5-15min pipeline without DB load concerns.
3. **Image moderation via Replicate safety output (not OpenAI vision)** — ADR-011 specified moderation on generated images but didn't prescribe the provider. Parsing Replicate's `safety_concept` / `api_safety_concept` fields adds zero latency/cost vs. a second OpenAI vision API call. Fail-open for unknown output shapes (deliberate tradeoff).
4. **`getProject()` LEFT JOIN videos** — the blueprint didn't specify how the download button should fetch video data. LEFT JOIN in the existing query is cheaper than a second `getProjectVideo()` round-trip.
5. **`putObject` for pipeline uploads** — the blueprint only specified `getSignedUploadUrl` (presigned URLs). `putObject` was added for Inngest pipeline steps that already have the Buffer in memory (TTS audio, FFmpeg output) — direct S3 PUT is faster than round-tripping through a presigned URL.
6. **husky `prepare` script with `|| true`** — prevents `pnpm install` from failing on first install (when husky isn't yet installed). This is a common pattern; the `|| true` is intentional.

### Deviations from Blueprint (Post-Review Hardening — design_critique.md remediation)

A meticulous code review (documented in `design_critique.md`) identified 5 inaccuracies in the docs that had propagated into the codebase. All were fixed via TDD (RED → GREEN → REFACTOR), adding 29 new tests:

1. **Stripe webhook `extractSubscriptionPeriodEnd()` pure helper** — the previous code had a fictional `currentPeriodEnd ?? current_period_end` fallback defending against a non-existent Stripe SDK v22 camelCase conversion. The REAL breaking change is the Stripe "Basil" API (2025-03-31) which moved `current_period_end` from the top-level Subscription object to `subscription.items.data[0].current_period_end`. The new helper (`src/features/billing/domain/extract-period-end.ts`) checks the Basil shape first, then falls back to the pre-Basil top-level field. 8 new tests.
2. **SSE `maxDuration` corrected from 900 → 800** — the previous value of 900 exceeded the Vercel Pro/Enterprise GA ceiling under Fluid Compute (now default on all plans), causing silent fallback to the platform default. 800 is the correct GA ceiling; 1800s is available in beta only. The client-side reconnect handles Hobby's 300s cap. 1 test updated.
3. **React pinned at `^19.2.3`** — the previous `^19.2.0` allowed versions 19.2.0–19.2.2 which are vulnerable to CVE-2025-55182 ("React2Shell", CVSS 10.0 RCE). For Next.js apps the runtime fix comes via `next@16.0.10+`, but the direct React pins are raised to document the security floor.
4. **Zod v4 `DATABASE_URL` validation** — replaced the bare `.refine()` with `startsWith()` (a Zod v3 workaround) with `.url().refine()` composition. Zod v4's `.url()` uses `new URL()` which accepts any scheme — so `.url()` validates URL format AND `.refine()` restricts the protocol to `postgres:`/`postgresql:`. This catches MORE typos than the old approach (e.g., `postgresql://not a url with spaces` is now correctly rejected). 4 new tests.
5. **`IMAGE_MODERATION_FAIL_OPEN` moved into the Zod env schema** — was previously read via `process.env.IMAGE_MODERATION_FAIL_OPEN` directly in `moderate-image.ts`, bypassing validation. Typos like `IMAGE_MOD_FAIL_OPEN` would silently fall back to the default. Now validated as `z.enum(['true','false']).optional().default('true')` — case-sensitive, catches "True"/"maybe" at module load. 6 new env tests + 1 new moderate-image test.
6. **`pnpm-workspace.yaml` syntax standardized** — removed the stale `@ffmpeg-installer/linux-x64` entry (package was removed from deps), removed the redundant `onlyBuiltDependencies` array (deprecated in pnpm 11), kept `protobufjs` (still a transitive dep with postinstall). Engine floor bumped from `pnpm >=9.0.0` → `>=10.26.0` to match the `allowBuilds` syntax.
7. **`STYLE_CHIPS` restored to spec** — the hero marquee had drifted to 7 chips with different labels (added "Comic" + "Futuristic neon"; dropped "Medieval" + "Japanese animation"). Restored the spec-mandated 8-chip set verbatim from `deviation_report_v3.md` §1.6. 5 new tests.
8. **Hero headline restored to 3-line cinematic stack** — the H1 had collapsed to 2 lines ("Turn Story Into Video / with AI Magic"), losing the poster-quality title card. Restored the 3-line stack: "Turn" / "Story Into Video" / "with AI Magic". Subtitle copy changed from PROCESS ("subtitles, all generated in minutes") to OUTPUT ("a finished video in minutes") — the stronger value proposition. 5 new tests.

### What's Implemented vs. Outstanding

**✅ Fully implemented (code layer — 479 unit tests + 48 E2E tests, all GREEN):**

*Authentication & Authorization:*
- Auth.js v5 (Google OAuth + Credentials, Drizzle adapter, JWT sessions, `trustHost: true` for reverse-proxy — T2)
- **C1 fix: `signUpAction` server action** — `src/features/auth/actions.ts` creates new users (bcrypt cost 12, user insert, free-tier subscription). `AuthForm` branches on `isSignUp` → calls `signUpAction` then auto-signs-in.
- **C3 fix: Rate limiting** — `src/lib/rate-limit.ts` with 3 Upstash Ratelimit instances: `authRateLimit` (10/15min/IP for sign-up), `pipelineRateLimit` (5/min/user for `createProjectAction`), `sseRateLimit` (1/user/project for SSE). New deps: `@upstash/ratelimit`, `@upstash/redis`.
- `verifySession()` DAL (accepts `{ redirectTo?: string }`) + proxy route protection
- **H6 fix: Proxy host header validation** — rejects requests with unauthorized Host headers (canonical domain + localhost + `.vercel.app`). `/projects/:path*` added to matcher.

*Database & Schema:*
- Drizzle schema (11 tables, 8 enums) + migration config + **4 new migrations (0001–0004) from remediation sprint**
- **C5 fix: `usageEvents.idempotencyKey` column + UNIQUE index** — enables `ON CONFLICT DO NOTHING` for idempotent credit debiting
- **C5/M1 fix: UNIQUE constraints** on `videos.projectId`, `voiceovers.projectId`, `characters(projectId, name)`, `scenes(projectId, order)` — prevents duplicate rows from Inngest retries
- **H7 fix: `usageEvents.userId` is now nullable** — webhook events no longer need a hardcoded system user UUID (FK violation risk eliminated)

*AI Pipeline (Inngest, 6 Steps — fully wired):*
- All 8 AI pipeline domain functions (analyze, moderate-content, moderate-image, generate-character, generate-scene, synthesize-voice, align-subtitles, assemble-video)
- Inngest 6-step pipeline function (fully wired: Steps 0–6 + final completion)
- **C5/C6 fix: ALL 6 steps now debit credits** with deterministic idempotency keys — analysis=5, char=10/each, scene=8/each, voiceover=15, subtitle_alignment=3, video_assembly=30. Total = 131 credits for 3 chars + 6 scenes (was 53 — a 60% revenue leak)
- **C5 fix: `debitCredits()` is idempotent** — uses `ON CONFLICT (idempotency_key) DO NOTHING` + `.for('update')` row lock. Returns `DebitResult { idempotent, eventId, creditsRemaining }`. Race-condition-proof (verified by concurrency test with 10 parallel calls).
- **C5 fix: All `append*` queries use `onConflictDoNothing`** — `appendCharacter/appendScene/appendVoiceover/appendVideo` return `AppendResult { inserted, row }`.
- **C4 fix: `createProjectAction` inserts the project FIRST**, then debits analysis credits with key `${project.id}:analysis`. If the DB insert fails, the user loses nothing.
- Image moderation on generated characters + scenes (ADR-011 — `moderateImage` parses Replicate safety output, `moderationSkipped` field, env-configurable fail-open policy)
- **H8 fix: `IMAGE_MODERATION_FAIL_OPEN` defaults to `'false'` (fail-closed) in production** — `'true'` in dev/test. Follows the secure-defaults principle.
- **C2 fix: `replicate.ts` emits `console.warn` in production** when `REPLICATE_SDXL_IPADAPTER_MODEL` equals the SDXL base placeholder hash. Character consistency silently does not work without a real IP-Adapter model — this warning is the only way operators will know.
- **M4 fix: `alignSubtitles` accepts `{ audioBuffer, language? }`** — defaults to `'en'` for Whisper API accuracy on non-English audio.
- OpenAI integration (GPT-4o analysis, Moderation, Whisper ASR)
- Replicate integration (SDXL character + scene generation, IP-Adapter, env-configurable model IDs with `owner/model:sha` format validation — T4)
- ElevenLabs TTS (chunked for long text)
- FFmpeg video assembly (rewritten — SRT temp file, inputOptions per image, Buffer readback, cleanup)

*Billing & Credits:*
- Stripe (Checkout, Portal, webhook with signature verification)
- **T1 fix: Billing page upgrade buttons wired to `billingCheckoutAction` Server Action** — `src/features/billing/actions.ts` exports `billingCheckoutAction(formData)` which extracts `plan` and delegates to `checkoutAction(plan)`. The previous `<form action="/api/stripe/checkout">` posted to a non-existent route (100% of paid conversions were blocked).
- **H7 fix: Stripe webhook idempotency** — replaced TOCTOU SELECT-then-INSERT with INSERT-first `ON CONFLICT (idempotency_key) DO NOTHING`. Uses `event.id` as the idempotency key. No more hardcoded system user UUID. **T4 fix: idempotency INSERT moved to AFTER side effects succeed** (was before the event handler — if the handler threw, the row was committed and Stripe retries were silently swallowed, permanently losing subscription updates). Now uses a pre-check SELECT + post-side-effect INSERT.
- Credit metering (transactional `debitCredits` with `InsufficientCreditsError`, `DebitResult` return type). **T3 fix: `debitCreditsTx(tx, ...)` variant accepts an existing transaction handle** — `createProjectAction` wraps INSERT + debit in a single `db.transaction()` so InsufficientCreditsError rolls back the INSERT (no orphan project rows).
- `extractSubscriptionPeriodEnd()` pure helper for Stripe "Basil" API (2025-03-31) shape change
- Billing page (4-tier plan table)

*Storage & Downloads:*
- R2 storage layer (signed URLs + `putObject` for pipeline Buffer uploads, 3 buckets, `MAX_PUT_OBJECT_BYTES = 500 MB` size guard)
- **H4 fix: Click-time R2 URL signing** — new `/api/projects/[id]/download` API route signs the URL at click time (not SSR time). `ProjectDownloadButton` receives `{ projectId, hasVideo }` (primitives that never expire) and fetches the API route on click. `SignedDownloadWrapper` DELETED. Users who leave tabs open >1h no longer get 403 Forbidden.
- `getProject()` LEFT JOINs videos — returns `videoKey` for conditional download render
- **Client components never import `r2.ts` at module level** — env validation only runs in Node.js

*SSE & Real-time:*
- SSE progress stream (`/api/projects/[id]/progress` — 2s polling, owner-checked, **T5 fix: uses `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern (SET NX EX 30)** — replaces `sseRateLimit.fixedWindow(1, '1 m')` which never released on disconnect. Slot is claimed on open, refreshed every 2s poll, released on abort. Users can reconnect immediately after disconnect (no 60s lockout). `maxDuration = 800`, client-side reconnect with exponential backoff)
- `useProjectProgress` client hook + `ProjectProgressPanel` (live progress bar, reconnect UI state). **T12 fix: double-close guard** — sets `eventSource = null` after `close()` in the terminal-status handler so the cleanup function's `if (eventSource)` guard skips the redundant close.

*Infrastructure & Security:*
- **H1 fix: `FFMPEG_PATH` in Zod env schema** — `assemble-video.ts` reads `env.FFMPEG_PATH` (not `process.env.*`). Added `z.string().optional().default('/usr/bin/ffmpeg')` to the schema.
- **H9 fix: Robust health endpoint** — `/api/health` checks DB connectivity (`SELECT 1`) + FFmpeg accessibility (`fs.accessSync`). Returns 200 + `{ status, services: { database, ffmpeg } }` when healthy; 503 + `{ status: 'unhealthy', errors }` when not. **Sprint 3 T2: response now includes `config` (env-derived runtime config snapshot) + `configErrors` (AUTH_URL host-mismatch, missing required vars) for env-mismatch surfacing.**
- `getFfmpegPath()` helper — resolves FFmpeg binary from `env.FFMPEG_PATH`
- Zod env validation (30 env vars, build-context fallback, AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch THROW in production (Sprint 3 T1))
- Env-configurable Replicate model IDs with `owner/model:sha` format validation — T4
- husky + lint-staged pre-commit hook (`.husky/pre-commit`)
- GitHub Actions CI (`.github/workflows/ci.yml`) — lint + typecheck + test + build on every PR
- `pnpm-workspace.yaml` with `packages: ['.']` + `allowBuilds` syntax (pnpm 10.26+)

*Design System & UX:*
- **H3 fix: Style chip enum aligned with marketing marquee** — added `medieval` + `japanese-animation` to `visualStyleEnum` + Zod + `STYLE_PROMPTS` (migration `0004`). All 8 marketing chips now work.
- **M2 fix: Hero story length 500→5000** — `maxLength={5000}`, counter `/ 5000`, amber threshold ≥4500 (matches server Zod schema `min(100).max(5000)`)
- **H2 + T11 fix: Brand color full replacement COMPLETE** — `sed` sweep across 45 files replaced `amber-300/400/500/600` → `primary`, `bg-zinc-950` → `bg-background`, `bg-zinc-900` → `bg-card`, `bg-black` → `bg-background`. `brand-tokens.test.ts` now **ENFORCES 0 violations** (was baseline measurement of 122 amber + 27 zinc/black violations). The custom `--color-primary: #febf00` token is now used everywhere; Tailwind's `amber-400` (#fbbf24) is fully eliminated.
- **T12 fix: `layout.tsx` `metadataBase` uses `env.NEXT_PUBLIC_APP_URL`** (was hardcoded `storyintovideo-clone.example.com` placeholder — broke OG previews). `openGraph.url` also uses `env.NEXT_PUBLIC_APP_URL`.
- Privacy Policy + Terms of Service pages (Server Components, AI-specific clauses)
- All 14 marketing CTAs wired to real routes
- CSS-only animations (13 keyframes, no Framer Motion/GSAP)
- WCAG AAA color contrast (body text 12.6:1), focus rings (`outline-primary`), skip-to-content, reduced-motion override

**⚠️ Outstanding (requires external resources or not yet done):**

*Critical (blocks production launch):*
- **External service credentials** — Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2, Stripe, Inngest, Resend, **Upstash** (required for rate limiting C3), Sentry. Fill `.env.local` from `.env.example` (31 env vars).
- **Database migrations applied** — run `pnpm drizzle:generate && pnpm drizzle:migrate` against real Neon. **⚠️ 4 new migrations (0001–0004) from the remediation sprint. Migration 0001 requires pre-cleanup of duplicate video/voiceover rows** — see SKILL.md §3 for the cleanup SQL.
- **Stripe products configured** — `PRICE_IDS` in `src/lib/stripe/client.ts` are placeholders
- **Replicate IP-Adapter model hash** — `REPLICATE_SDXL_IPADAPTER_MODEL` env var must be set to a real `lucataco/sdxl-ipadapter:<sha>` hash before character consistency will work. The default is the SDXL base model (a documented placeholder). **C2 fix: `replicate.ts` now emits a `console.warn` in production when the placeholder is detected.** (T4)
- **Character consistency validated end-to-end** — manual R&D test (Risk R1, highest-risk component). Code is wired; needs real API keys.
- **FFmpeg assembly validated end-to-end** — rewritten + unit-tested with mocked fluent-ffmpeg; needs real-world test with actual scene images + audio + SRT
- ~~**Privacy Policy publicly promises unimplemented GDPR endpoints**~~ → **Fixed (Sprint 3 T3 + Sprint 3 T4)**. Original note: `src/app/(legal)/privacy/page.tsx` §4 (Data Retention: "You may delete your account at any time, which triggers a CASCADE deletion…") and §6 (Your Rights: Erasure + Portability) promise features the code does not implement. No `DELETE /api/user` endpoint, no `GET /api/user/export` endpoint exists. This was a compliance P0 — the live legal page was making promises the code can't keep. Schema already has `onDelete: 'cascade'` on every FK from `users` so DB-level cascade is wired. Now shipped: `GET /api/user/export` (Sprint 3 T3) + `DELETE /api/user` (Sprint 3 T4, includes R2 best-effort cleanup via `deleteUserMedia()`).
- ~~**Production env var misconfiguration goes silently undetected**~~ → **Fixed (Sprint 3 T1 promotes warn to throw in prod; T2 surfaces configErrors via /api/health)**. Original note: `src/lib/env/index.ts:217-226` only emitted `console.warn` when `AUTH_URL` and `NEXT_PUBLIC_APP_URL` hosts differ. In production behind a reverse proxy, this warning was missed — causing the live `/dashboard` redirect to `http://localhost:3000` (ERR_CONNECTION_REFUSED). The T2 code fix IS deployed (proven by `/api/health` returning the H9 DB+FFmpeg check), but `NEXT_PUBLIC_APP_URL` on the production server is set to `http://localhost:3000` instead of `https://storyintovideo.jesspete.shop`. Fix: (a) set the env var correctly on the production host, (b) promote the warning to a thrown error in production, (c) surface env misconfigurations via `/api/health`.

*High (degrades UX or introduces technical debt):*
- **H5 — FFmpeg `/tmp` OOM risk** — `assemble-video.ts` writes to `/tmp` + reads into Buffer (**T12: temp files now use `crypto.randomUUID()` instead of `Date.now()` to prevent collision**). For large 4K videos, this can OOM the function. Stream-to-R2 via `@aws-sdk/lib-storage` `Upload` class deferred (dep installed but refactor not done).
- **M3 — Character image R2 upload** — `referenceImageKey` currently stores Replicate CDN URLs, not R2 keys. Uploading to R2 matches the docs' intent but requires pipeline Step 2 refactor.
- **Monitoring** — Sentry, Vercel Analytics, Axiom not integrated (env var `SENTRY_DSN` in schema)
- ~~**E2E tests in CI**~~ → **Fixed (Sprint 3 T9)** — Playwright E2E now runs in the GitHub Actions workflow via a Postgres service container + browser binaries + seeded data. The e2e job is set to `continue-on-error` so transient flakiness doesn't block the main quality gate.
- ~~**Navbar + dashboard + hero use raw `<a href>` instead of `next/link`**~~ → **Fixed (Sprint 3 T5)**. Original note: `src/components/sections/navbar.tsx` (6 places), `src/app/(app)/dashboard/page.tsx` (2 places), `src/components/sections/hero.tsx` (1 place) used raw `<a href>` for internal routes, violating the "never use `<a>` for internal routes" rule and causing full-page reloads on every nav click. All internal `<a href>` now replaced with `<Link href>` from `next/link`.
- ~~**No custom `not-found.tsx` page**~~ → **Fixed (Sprint 3 T7)**. Original note: Next.js default 404 inherited root layout metadata, making any unknown URL return 200 OK with the marketing page title. Bad for SEO, hides broken links. Confirmed on live site: `/pricing`, `/blog`, `/contact` all returned 200 with `StoryIntoVideo - Turn Stories Into Videos with AI` title. Now shipped: `src/app/not-found.tsx` returns a real 404 status.

*Medium (polish + compliance):*
- ~~**GDPR/CCPA**~~ → **Fixed (Sprint 3 T3 + T4 + T8)**. Original note: cookie consent banner + data export/deletion endpoints not implemented (Privacy/Terms pages existed). ⚠️ The Privacy Policy ALREADY promised these features (see Critical above) — the gap was a compliance P0, not just a polish item. Now shipped: `GET /api/user/export` (T3) + `DELETE /api/user` with R2 cleanup (T4) + `CookieBanner` mounted in root layout (T8).
- ~~**Other content pages**~~ → **Fixed (Sprint 3 T6)**. Original note: `/pricing`, `/blog`, `/contact` linked but not implemented. ⚠️ Without a custom `not-found.tsx` (see High above), these dead links returned 200 OK with the marketing page title, hiding the problem from operators. Now shipped: all three pages render as Server Components under `(legal)/`.
- **PostCSS moderate vulnerability** (GHSA-qx2v-qp2m-jg93): `postcss <8.5.10` (transitive via `next`). Not exploitable. Will resolve when Next.js updates its lockfile.
- **SSE on Vercel Hobby** — `maxDuration = 800` is the Pro/Enterprise GA ceiling. On Hobby, the cap is 300s; the client-side reconnect handles this gracefully with a brief "Reconnecting…" message.

**✅ Recently closed (audit v1 remediation — T1–T12, see `AUDIT_REPORT_v1.md` + `REMEDIATION_PLAN_v1.md`):**
- ~~Billing upgrade buttons POST to non-existent `/api/stripe/checkout` route~~ → Fixed (T1/C-1: `billingCheckoutAction` Server Action wired to `<form action={...}>`)
- ~~All protected routes return ERR_CONNECTION_REFUSED for unauthenticated users~~ → Fixed (T2/C-2: proxy redirect uses `env.NEXT_PUBLIC_APP_URL` not `nextUrl.origin`)
- ~~Orphan project rows on insufficient credits~~ → Fixed (T3/H-1: INSERT + debit wrapped in `db.transaction()` via `debitCreditsTx`)
- ~~Stripe webhook idempotency INSERT-before-handler lost updates on transient DB errors~~ → Fixed (T4/H-2: INSERT moved to AFTER side effects + pre-check SELECT)
- ~~SSE rate limit never released on disconnect (60s lockout)~~ → Fixed (T5/H-3: `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern)
- ~~Download route generic 500 error for all R2 failures~~ → Fixed (T6/M-1: error classification 502/504/500)
- ~~`inngest.send()` failure orphaned projects~~ → Fixed (T7/M-2: try/catch → `setProjectFailed()`)
- ~~`appendVideo` set `status='completed'` before MP4 existed~~ → Fixed (T8/M-3: `status='rendering'` at insert, `updateVideo` sets `'completed'`)
- ~~`FAIL_OPEN` read at module load (not testable per-call)~~ → Fixed (T9/M-4: `getFailOpen()` reads inside function body)
- ~~Dead `buildFfmpegCommand` export (second source of truth)~~ → Fixed (T10/M-5: deleted)
- ~~Brand color system bypassed 122+ times across 28 files~~ → Fixed (T11/M-6: `sed` sweep across 45 files → `primary`/`background`/`card` tokens; `brand-tokens.test.ts` enforces 0 violations)
- ~~`useProjectProgress` double-close risk + `Date.now()` temp file collisions + hardcoded `metadataBase` placeholder~~ → Fixed (T12/L-2/L-3/L-4: `eventSource=null` guard, `crypto.randomUUID()`, `env.NEXT_PUBLIC_APP_URL`)

**✅ Recently closed (remediation sprint 1 — pipeline wiring + UX + compliance):**
- ~~Steps 4-6 not wired into Inngest~~ → Fixed
- ~~`inngest.send()` commented out~~ → Fixed
- ~~FFmpeg placeholder implementation~~ → Fixed (rewrite)
- ~~No SSE progress stream~~ → Fixed
- ~~No download/share~~ → Fixed
- ~~No image moderation (ADR-011)~~ → Fixed
- ~~No legal pages~~ → Fixed
- ~~No pre-commit hooks~~ → Fixed (husky + lint-staged)

**✅ Recently closed (remediation sprint 2 — post-review hardening):**
- ~~P0: Auth redirects to `localhost:3000` in production~~ → Fixed (`trustHost: true` + AUTH_URL host-mismatch warning — T2; now hardened further: throws in production — Sprint 3 T1)
- ~~`SignedDownloadWrapper` inline in page.tsx~~ → Fixed (extracted to its own file — T1)
- ~~`SDXL_IPADAPTER_MODEL` fake placeholder hash~~ → Fixed (env-configurable with format validation — T4)
- ~~`moderateImage` fail-open is silent~~ → Fixed (`moderationSkipped` field + env-configurable policy — T5)
- ~~SSE disconnects mid-pipeline (300s Vercel cap)~~ → Fixed (`maxDuration = 800` + client reconnect — T6)
- ~~`putObject` accepts any buffer size~~ → Fixed (`MAX_PUT_OBJECT_BYTES = 500 MB` + `PayloadTooLargeError` — T7)
- ~~No CI/CD~~ → Fixed (GitHub Actions workflow — T8)
- ~~`pnpm-workspace.yaml` missing `packages:` field~~ → Fixed (T0)
- ~~`OPENAI_API_KEY` validation too strict~~ → Investigated, found unfounded (T3)

**✅ Recently closed (post-review hardening — design_critique.md remediation):**
- ~~Fictional Stripe SDK v22 camelCase fallback~~ → Fixed (`extractSubscriptionPeriodEnd()` — 8 tests)
- ~~SSE `maxDuration = 900` exceeded Vercel Pro GA limit~~ → Fixed (`maxDuration = 800`)
- ~~React `^19.2.0` vulnerable to CVE-2025-55182~~ → Fixed (pinned `^19.2.3`)
- ~~Obsolete Zod v3 `.refine()` workaround~~ → Fixed (`.url().refine()` composition — 4 tests)
- ~~`IMAGE_MODERATION_FAIL_OPEN` bypassed Zod env validation~~ → Fixed (moved into schema — 7 tests)
- ~~`pnpm-workspace.yaml` mixed deprecated + current syntax~~ → Fixed (standardized on `allowBuilds`)
- ~~`STYLE_CHIPS` drifted from spec~~ → Fixed (restored 8-chip spec set — 5 tests)
- ~~Hero headline collapsed to 2-line~~ → Fixed (restored 3-line cinematic stack — 5 tests)

**✅ Recently closed (remediation sprint 3 — revenue integrity + auth + security + design):**
- ~~Sign-up flow completely broken (no `signUpAction` existed)~~ → Fixed (C1: new `src/features/auth/actions.ts` — bcrypt cost 12, user insert, subscription, auto sign-in)
- ~~IP-Adapter placeholder silently broken~~ → Fixed (C2: `replicate.ts` emits `console.warn` in production when placeholder detected)
- ~~No rate limiting~~ → Fixed (C3: `src/lib/rate-limit.ts` with auth/pipeline/SSE limits; new deps `@upstash/ratelimit` + `@upstash/redis`)
- ~~Credits debited before project insert~~ → Fixed (C4: `createProjectAction` now inserts project FIRST, then debits with `${project.id}:analysis` key)
- ~~No idempotency on Inngest retries~~ → Fixed (C5: `idempotencyKey` column + UNIQUE index + `ON CONFLICT DO NOTHING` in `debitCredits` + all `append*` queries + `.for('update')` row lock)
- ~~Steps 2 & 3 never debited credits (60% revenue leak)~~ → Fixed (C6: ALL 6 steps now call `debitCredits` with per-entity idempotency keys — total 131 credits)
- ~~`FFMPEG_PATH` bypassed Zod env validation~~ → Fixed (H1: added to Zod schema; `assemble-video.ts` reads `env.FFMPEG_PATH` not `process.env.*`)
- ~~Brand color system bypassed 75+ times~~ → Partially fixed (H2: CI guard test `brand-tokens.test.ts` measures baseline; full replacement deferred)
- ~~Style chip enum mismatch (2 of 8 chips broke Zod)~~ → Fixed (H3: added `medieval` + `japanese-animation` to enum + Zod + STYLE_PROMPTS — migration `0004`)
- ~~R2 URL 1h expiry trap (stale tabs get 403)~~ → Fixed (H4: new `/api/projects/[id]/download` API route; `ProjectDownloadButton` fetches fresh URL at click time; `SignedDownloadWrapper` DELETED)
- ~~Host Header Injection risk~~ → Fixed (H6: `proxy.ts` validates Host header against whitelist; `/projects/:path*` added to matcher)
- ~~Stripe webhook TOCTOU race~~ → Fixed (H7: INSERT-first `ON CONFLICT DO NOTHING`; removed hardcoded system user UUID; `usageEvents.userId` nullable)
- ~~`IMAGE_MODERATION_FAIL_OPEN` insecure default~~ → Fixed (H8: default flipped from `'true'` to `'false'` in production)
- ~~Health endpoint bare~~ → Fixed (H9: checks DB `SELECT 1` + FFmpeg `fs.accessSync`, returns 503 when unhealthy)
- ~~Row lock untested~~ → Fixed (H10: `.for('update')` now test-verified via source-reading + concurrency test with 10 parallel calls)
- ~~Story length 500 vs 5000 mismatch~~ → Fixed (M2: Hero `maxLength` 500→5000, counter `/ 5000`, threshold ≥4500)
- ~~Whisper no language param~~ → Fixed (M4: `alignSubtitles` accepts `{ audioBuffer, language? }`, defaults `'en'`)
- ~~Stale "900s" comments~~ → Fixed (M5: updated to "800s Pro/Enterprise GA; 1800s beta")
- ~~`package.json` description stale~~ → Fixed (M6: updated to reflect full SaaS, not just marketing clone)

**✅ Recently closed (Sprint 3 T1–T9 — env hardening + GDPR + content pages + CI):**
- ~~AUTH_URL host-mismatch only emits `console.warn` in production (silently missed behind reverse proxy)~~ → Fixed (Sprint 3 T1: env module now THROWS in production runtime, warns only in dev/test — prevents the `/dashboard → localhost:3000` ERR_CONNECTION_REFUSED class of bug at module load)
- ~~`/api/health` couldn't surface env-misconfiguration (operators had no programmatic signal)~~ → Fixed (Sprint 3 T2: response now includes `config` (env-derived runtime config snapshot) + `configErrors` (AUTH_URL host-mismatch, missing required vars) for env-mismatch surfacing)
- ~~No `GET /api/user/export` endpoint (Privacy Policy promised GDPR portability)~~ → Fixed (Sprint 3 T3: new `/api/user/export` route uses `auth()` (not `verifySession()`) — returns null → 401 JSON, owner-checked, serializes user + projects + media to a downloadable JSON archive)
- ~~No `DELETE /api/user` endpoint (Privacy Policy promised GDPR erasure; CASCADE wired at DB level but no API surface)~~ → Fixed (Sprint 3 T4: new `DELETE /api/user` route + `deleteUserMedia()` best-effort R2 cleanup (deletes user's voiceover/video objects from R2 buckets before the CASCADE delete); `auth()` for JSON 401s)
- ~~Navbar + dashboard + hero used raw `<a href>` for internal routes (full-page reloads, Lighthouse + UX hit)~~ → Fixed (Sprint 3 T5: all internal `<a href>` replaced with `<Link href>` from `next/link` across `navbar.tsx` (6 places), `dashboard/page.tsx` (2 places), `hero.tsx` (1 place))
- ~~`/pricing`, `/blog`, `/contact` linked but not implemented (dead links returning marketing 200)~~ → Fixed (Sprint 3 T6: three new Server Components under `(legal)/` — `pricing/page.tsx`, `blog/page.tsx`, `contact/page.tsx`; resolve the dead-link problem from the SEO perspective once `/_not-found` (T7) is also in place)
- ~~No custom `not-found.tsx` (unknown URLs returned 200 OK with marketing title — SEO + broken-link-hiding)~~ → Fixed (Sprint 3 T7: new `src/app/not-found.tsx` returns a real 404 status with a branded "page not found" UI; previously `/pricing`, `/blog`, `/contact` all returned 200 with `StoryIntoVideo - Turn Stories Into Videos with AI` title)
- ~~No GDPR/CCPA cookie consent banner (Privacy Policy promised consent collection; only the policy + endpoints existed)~~ → Fixed (Sprint 3 T8: new `CookieBanner` component (`src/components/app/cookie-banner.tsx`) mounted in the root layout (`src/app/layout.tsx`); 8th app component — total app component count goes from 7 → 8)
- ~~Playwright E2E not in CI (only the main lint/typecheck/test/build job ran on PRs)~~ → Fixed (Sprint 3 T9: GitHub Actions workflow now has a dedicated e2e job with a Postgres service container + browser binaries + seeded data; the e2e job is `continue-on-error` so transient flakiness doesn't block the main quality gate)

See `PRODUCTION_READINESS_PLAN.md` §8 for the complete pre-launch checklist.

### Known Issues

- **PostCSS moderate vulnerability** (GHSA-qx2v-qp2m-jg93): 1 moderate vuln in `postcss <8.5.10` (transitive via `next`). Not exploitable. Will resolve when Next.js updates its lockfile. `pnpm audit --audit-level=high` passes clean.
- **`next-auth@5.0.0-beta.31`** — Auth.js v5 is technically beta but widely used in production. Pin the exact version; test on upgrade.
- **Replicate IP-Adapter model hash is a placeholder default** — `REPLICATE_SDXL_IPADAPTER_MODEL` defaults to the SDXL base model hash (not IP-Adapter). Operators MUST set this env var to a real `lucataco/sdxl-ipadapter:<sha>` hash before character consistency will work. The env schema validates the `owner/model:sha` format to catch typos. (T4)
- **FFmpeg on serverless** — Vercel's function timeout (60s Hobby / 300s Pro) may be exceeded for long videos. The SSE route's `maxDuration` is set to 800s (T6, corrected from 900 — Pro GA ceiling under Fluid Compute) to cover 5-15min pipelines, but the FFmpeg assembly step itself is bound by Inngest's function timeout (not the SSE route). The blueprint (ADR-006) specifies moving to Shotstack if this occurs.
- **SSE on Vercel Hobby** — the `maxDuration = 800` (T6, corrected) is the Vercel Pro/Enterprise GA ceiling under Fluid Compute (now default on all plans). On Hobby, the cap is 300s; the client-side reconnect (also T6) will reopen the stream after the 300s drop, but the user will see a brief "Reconnecting…" message. NOTE: the previous value of 900 exceeded the Pro GA limit and silently fell back to the platform default — 800 is correct.

### Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| E2E tests fail with "Executable doesn't exist" | Playwright browsers not installed | Run `pnpm exec playwright install` |
| Hydration mismatch console error | Browser extension (Grammarly) injects attributes into `<body>` | Already fixed: `suppressHydrationWarning` on both `<html>` and `<body>` |
| `next lint` command not found | Deprecated in Next.js 16 | Use `eslint .` directly |
| `shadcn` CLI times out | Registry fetch failure | Primitives are hand-written in `src/components/ui/` |
| Outfit weight 820 not rendering | Google Fonts API doesn't serve weight 820 | Must self-host via `next/font/local` (already done) |
| Tailwind classes not applying | Missing `@source` directives | Check `globals.css` has `@source '../components/**/*.{ts,tsx}'` |
| Cross-origin dev resource blocked | Next.js blocks `/_next/webpack-hmr` from non-localhost origins | Add the origin to `allowedDevOrigins` in `next.config.ts` and restart the dev server |
| Build fails: "Invalid environment variables" | Real env vars not set in `.env.local` | Copy `.env.example` → `.env.local`, fill in real values |
| Build fails: "Failed to collect page data for /api/auth/[...nextauth]" | Auth route tries to prerender DrizzleAdapter | Ensure `export const dynamic = 'force-dynamic'` in the route handler |
| `drizzle-kit generate` errors | `DATABASE_URL_UNPOOLED` not set | Set in `.env.local` (direct Neon connection for DDL) |
| Inngest function not triggering | Not registered in `src/lib/inngest/functions.ts` | Add to the `functions` array |
| Stripe webhook 400 "Invalid signature" | Wrong secret or body parsed as JSON | Use `await req.text()` (not `.json()`); verify `STRIPE_WEBHOOK_SECRET` |
| `pnpm install` warns "Ignored build scripts: esbuild" | `pnpm-workspace.yaml` missing approval | Add `esbuild: true` to the `allowBuilds` map in `pnpm-workspace.yaml` (pnpm 10.26+ syntax; the older `onlyBuiltDependencies` array was removed in pnpm 11) |
| `pnpm install` fails with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION  packages field missing or empty` | `pnpm-workspace.yaml` missing `packages:` field (T0) | Add `packages: ['.']` to `pnpm-workspace.yaml` (already done in this repo) |
| Tests fail: "Cannot find module 'next/server'" | jsdom can't load Next.js server modules | Mock `next-auth`, `next/navigation`, `@/lib/db` in tests |
| Tests fail: "Cannot access 'X' before initialization" | `vi.mock()` factory references outer `vi.fn()` | Use `vi.hoisted()`: `const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))` |
| Tests fail: "X is not a constructor" | Mock factory returns arrow fn, real code does `new X()` | Use `class` syntax: `class MockS3Client { send = sendMock; }` |
| Tests fail: "[PARSE_ERROR] Expected '>' but found 'Identifier'" | Test file has JSX but `.test.ts` extension | Rename to `*.test.tsx` |
| Pipeline tests fail: "fetch failed: ENOTFOUND r2.example.com" | Steps 5 & 6 use `fetch()` for R2 downloads | `vi.stubGlobal('fetch', fetchMock)` |
| SSE route returns 307 redirect instead of 401 JSON | Used `verifySession()` (redirects) instead of `auth()` | API routes use `auth()` directly: returns null → 401 JSON |
| SSE stream hangs / never closes | `controller.close()` not called on terminal status | Poll DB every 2s; close when `status ∈ {completed, failed}` |
| `EventSource` leaks across navigations | `useEffect` cleanup missing `eventSource.close()` | Return cleanup fn from `useEffect` |
| SSE stream disconnects after 300s (Vercel Hobby) | `maxDuration = 800` (Pro/Enterprise GA under Fluid Compute) doesn't apply on Hobby (cap = 300s) | Upgrade to Vercel Pro OR rely on client-side reconnect (T6) which reopens after 1s/2s/4s backoff. UI shows "Reconnecting to live updates…" during reconnect. |
| Project detail page shows "This page couldn't load" | Client component imports `r2.ts` at module level, triggering env validation in browser where server-only env vars are undefined | **Never import `@/lib/storage/r2` in `'use client'` files.** Sign URLs in Server Components, pass as props to client components. |
| Auth redirects to `http://localhost:3000` in production | `AUTH_URL` env var set to localhost, OR reverse proxy doesn't forward `X-Forwarded-Host` | Set `AUTH_URL` to the production URL. The `trustHost: true` config (T2) makes Auth.js use the request's Host header as a fallback. The env module throws in production (Sprint 3 T1) and warns in dev/test when AUTH_URL and NEXT_PUBLIC_APP_URL hosts differ. |
| `assemble-video` can't find FFmpeg binary | `@ffmpeg-installer/ffmpeg` removed; system FFmpeg not installed | `sudo apt install ffmpeg` (Ubuntu) or `brew install ffmpeg` (macOS). Set `FFMPEG_PATH` env var if non-standard location. |
| `FFMPEG_PATH` not set | Env var missing from `.env.local` | Add `FFMPEG_PATH=/usr/bin/ffmpeg` to `.env.local` (or your system's path) |
| husky pre-commit hook doesn't run | `pnpm install` didn't run `prepare` script | Run `pnpm install`; ensure `.husky/pre-commit` is executable |
| `putObject` throws `PayloadTooLargeError` | Body exceeds `MAX_PUT_OBJECT_BYTES` (500 MB) | Use multipart upload via `CreateMultipartUploadCommand` for larger files. The 500 MB cap is intentional — function memory is the real constraint, not R2's 5 GB limit. (T7) |
| Replicate scene generation 404s | `REPLICATE_SDXL_IPADAPTER_MODEL` is the SDXL base placeholder (T4 default) | Set `REPLICATE_SDXL_IPADAPTER_MODEL` env var to a real `lucataco/sdxl-ipadapter:<sha>` hash from replicate.com/explorer |
| Billing upgrade buttons return 404 | Form posted to non-existent `/api/stripe/checkout` route (C-1 bug, fixed in T1) | Fixed: billing page now uses `<form action={billingCheckoutAction}>` Server Action. If you see this, ensure `billingCheckoutAction` is imported from `@/features/billing/actions` (has `"use server"`). |
| `/dashboard` returns `ERR_CONNECTION_REFUSED` for unauthenticated users | Proxy redirect used `nextUrl.origin` which resolves to `http://` behind TLS-terminating reverse proxy (C-2 bug, fixed in T2) | Fixed: proxy now uses `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)`. Verify `NEXT_PUBLIC_APP_URL` is set to the public HTTPS URL in `.env.local`. |
| Dashboard shows ghost "pending" projects the user never completed | `createProjectAction` inserted the project before debiting credits; InsufficientCreditsError left an orphan row (H-1 bug, fixed in T3) | Fixed: INSERT + debit now wrapped in `db.transaction()` via `debitCreditsTx`. To clean up existing orphans: `DELETE FROM projects WHERE status = 'pending' AND progress_percent = 0;` |
| Stripe webhook retries don't update the subscription after a transient DB error | Idempotency INSERT happened BEFORE the event handler; retries hit `onConflictDoNothing` and returned `{ duplicate: true }` without re-processing (H-2 bug, fixed in T4) | Fixed: idempotency INSERT now happens AFTER side effects succeed + pre-check SELECT. If you have affected events, delete the `usageEvents` rows with `type='stripe_webhook'` for those event IDs so Stripe retries can re-process. |
| SSE returns 429 "Too many concurrent connections" after closing and reopening within 60s | `sseRateLimit.fixedWindow(1, '1 m')` never released the counter on disconnect (H-3 bug, fixed in T5) | Fixed: SSE now uses `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern (SET NX EX 30 + DEL on abort). Slot auto-expires after 30s if the server crashes. |
| Download returns generic 500 for all R2 failures | Single catch block didn't distinguish error types (M-1 bug, fixed in T6) | Fixed: download route now classifies errors — S3/NoSuchKey/NoSuchBucket → 502, Timeout/Networking/Connection → 504, other → 500. Check server logs for the specific `errorName`. |
| Project stuck in "pending" after Inngest outage | `inngest.send()` threw but the project row was already committed (M-2 bug, fixed in T7) | Fixed: `inngest.send()` is now wrapped in try/catch → `setProjectFailed()`. The project status will be 'failed' with an error message; the user can retry. |
| `pnpm build` fails: "Functions cannot be passed directly to Client Components" | Server Action defined inline in a Server Component page (not in a `"use server"` module) (T1 lesson) | Move the Server Action to a module with `"use server"` at the top (e.g., `src/features/billing/actions.ts`). Import it into the page. |
| `tsc` error: "Argument of type 'string \| undefined' is not assignable to parameter of type 'string'" inside a closure | TypeScript doesn't preserve `session.user.id` narrowing inside closures (T5 lesson) | Capture `const userId: string = session.user.id` BEFORE the closure so the type is narrowed. |

### Lessons Learned

**Marketing layer (inherited):**
1. **`suppressHydrationWarning` belongs on `<body>`, not just `<html>`** — Browser extensions like Grammarly inject attributes into `<body>` before React hydrates.
2. **Workflow component needs `'use client'`** — Uses `useState` for poster→video fade-in choreography.
3. **Test counts drift from plans** — The MEP planned 6 unit + 3 E2E; actual is now 479 unit + 48 E2E. Always verify against `pnpm test` output.
4. **File structure evolves during implementation** — Update docs as you build.
5. **Playwright requires browser binary installation** — `pnpm install` doesn't install browser binaries.

**Production app layer (new):**
6. **Zod v4 `.url()` accepts any scheme (including `postgresql://`)** — compose `.url()` (validates URL format) with `.refine()` (restricts protocol to `postgres:`/`postgresql:`) for `DATABASE_URL`. The Zod v3 limitation where `.url()` rejected `postgresql://` no longer applies in v4.
7. **Env validation needs build-context fallback** — without it, `next build` fails during page-data collection.
8. **`postgres()` defers connection until first query** — allows eager db instantiation without breaking the build.
9. **DrizzleAdapter validates db object structure** — a Proxy-based lazy db was rejected; use a real Drizzle client.
10. **Inngest v4 changed `createFunction` signature** — trigger is now in the config object, not a second argument.
11. **Auth unit tests must mock `next-auth` + `next/navigation`** — jsdom can't load `next/server`.
12. **Source-reading tests are valid** for server-only modules (auth config, middleware, route handlers) that can't be rendered in jsdom.
13. **Stripe "Basil" API (2025-03-31) moved `current_period_end`** — the field was removed from the top-level Subscription object and moved to `subscription.items.data[0].current_period_end`. The Stripe Node SDK has always used snake_case (no camelCase conversion). The webhook handler uses the `extractSubscriptionPeriodEnd()` pure helper which checks both shapes.
14. **ElevenLabs returns `Readable`, not `ReadableStream`** — duck-type the input in `streamToBuffer`.
15. **TDD with mocked AI providers works well** — all 6 pipeline domain functions are fully unit-tested; real API calls only needed for manual E2E validation.

**Remediation sprint 1 (pipeline wiring + UX + compliance):**
16. **Vitest mock hoisting is the #1 test bug** — `vi.mock()` factories are hoisted above imports. Use `vi.hoisted()` for shared `vi.fn()` state. Symptom: `Cannot access 'X' before initialization`.
17. **Mock constructors must be `class`, not arrow fns** — `new S3Client(...)` requires `new`-able mock. Arrow fns throw `"X is not a constructor"`.
18. **`.tsx` extension is mandatory for JSX tests** — oxc throws parse error for JSX in `*.test.ts`. Rename to `*.test.tsx`.
19. **SSE in Next.js 16** — `ReadableStream` + `text/event-stream` content-type + 2s DB polling. Simpler than Postgres LISTEN/NOTIFY for serverless (no long-lived connection).
20. **`auth()` vs `verifySession()` for API routes** — `verifySession()` throws redirect (wrong for JSON). API routes use `auth()` → null → 401 JSON. Server Components/Actions use `verifySession()` (redirects to `/sign-in`).
21. **`EventSource` cleanup is non-negotiable** — `useEffect` must return `() => eventSource.close()`. Otherwise the connection leaks when the user navigates away.
22. **Image moderation via Replicate safety output is preferred** — parsing `safety_concept` / `api_safety_concept` adds zero latency/cost vs. a second OpenAI vision moderation API call. Fail-open for unknown shapes (deliberate tradeoff).
23. **`getProject()` LEFT JOIN videos is cheaper than two queries** — the project detail page needs video data for the download button. LEFT JOIN adds <1ms; second query adds 5-15ms.
24. **`putObject` (pipeline) vs `getSignedUploadUrl` (client)** — pipeline steps have Buffer in memory → direct PUT. Client uploads use presigned URL → browser uploads directly to R2.
25. **TDD exposed 4 latent defects in `assemble-video.ts`** — placeholder Buffer, missing SRT write, missing input options, brittle filter extraction. All discoverable only by writing tests first.
26. **Source-reading tests must strip comments** — `src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')` before regex, else docblocks trigger false positives.
27. **husky `prepare` script with `|| true` is intentional** — prevents `pnpm install` failure on first install. Don't remove.
28. **Client components must NEVER import `r2.ts` at module level** — the `r2.ts` module imports `env` which validates all 30 env vars at module load. In the browser, only `NEXT_PUBLIC_*` vars exist — all others are `undefined`, causing "Invalid environment variables" crash. Pattern: Server Component signs the URL, passes as prop to client component. This is a P0 bug that completely breaks the project detail page.
29. **Server-side URL signing pattern** — for any client component that needs data from server-only env vars (R2 signed URLs, Stripe secrets, etc.), the Server Component should fetch/compute the value and pass it as a prop. This is the recommended Next.js 16 pattern and avoids the client-side env validation crash entirely.
30. **`@ffmpeg-installer/ffmpeg` is incompatible with Turbopack** — the package uses dynamic `require()` calls with runtime-constructed paths that Turbopack's static analyzer cannot resolve ("server relative imports are not implemented"). Replaced with system FFmpeg binary via `getFfmpegPath()` helper that reads `FFMPEG_PATH` env var with `/usr/bin/ffmpeg` default.
31. **`middleware.ts` renamed to `proxy.ts` in Next.js 16** — the file convention changed to better reflect its role as a network boundary. The functionality is identical; only the filename changes. Run `npx @next/codemod@canary middleware-to-proxy .` to migrate.

**Remediation sprint 2 (post-review hardening):**
32. **`trustHost: true` is mandatory for reverse-proxy deployments** — without it, Auth.js v5 falls back to `AUTH_URL` for callback URLs. If `AUTH_URL=http://localhost:3000` leaks to production (common copy-paste error), auth redirects resolve to localhost and the browser shows `ERR_CONNECTION_REFUSED`. This was a P0 production outage. (T2)
33. **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch is a leading indicator of misconfiguration** — the env module now throws in production (Sprint 3 T1) and warns in dev/test at module load when the two hosts differ. With `trustHost: true` it's no longer fatal, but it should still be fixed (AUTH_URL is used for email magic links, etc.). (T2 / Sprint 3 T1)
34. **`OPENAI_API_KEY.startsWith('sk-')` is NOT too strict** — investigation revealed that `sk-proj-*`, `sk-svcacct-*`, `sk-admin-*` all literally start with `sk-`. The original concern was unfounded. 5 regression-guard tests were added to lock this behavior in. (T3)
35. **Hardcoded third-party model IDs are an operational liability** — the placeholder `SDXL_IPADAPTER_MODEL` hash was a UUID-format string, not Replicate's 64-char hex SHA. Scene generation would have 404'd in production. Moving model IDs to env vars with format validation catches this class of bug at module load. (T4)
36. **Silent fail-open policies are dangerous** — the original `moderateImage` returned `flagged:false` with no log when the output shape was unknown. Operators had no way to detect the bypass. Adding the `moderationSkipped` field + `console.warn` makes the bypass observable. The policy is now env-configurable (`IMAGE_MODERATION_FAIL_OPEN=false` for production fail-closed). (T5)
37. **SSE on Vercel needs both server-side and client-side resilience** — setting `maxDuration = 800` covers Vercel Pro/Enterprise GA under Fluid Compute (now default on all plans). 1800s is available in beta only — not stable for production. The previous value of 900 exceeded the Pro GA limit and silently fell back to the default. Vercel Hobby still caps at 300s. The client-side reconnect with exponential backoff (1s → 2s → 4s, max 3 attempts) handles the Hobby case gracefully. Both layers are needed. (T6)
38. **`putObject` needs a size guard** — R2's hard limit is 5 GB, but function memory is the real constraint (typically 1-8 GB). A 4K FFmpeg output (~4 GB) would OOM the function before reaching R2. The `MAX_PUT_OBJECT_BYTES = 500 MB` cap fails fast with a clear `PayloadTooLargeError` instead of an opaque OOM. (T7)
39. **`pnpm-workspace.yaml` requires `packages:` field even for single-package repos** — pnpm 9+ enforces this. Fresh clones fail with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION  packages field missing or empty`. The fix is `packages: ['.']`. (T0)
40. **CI should run the full quality gate, not just lint-staged** — lint-staged only checks staged files. A bad commit to `main` can pass locally and break production. The GitHub Actions workflow runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every PR. (T8)

**Post-review hardening (design_critique.md remediation):**
41. **Docs drift into code as bugs** — the fictional "Stripe SDK v22 camelCase" claim in CLAUDE.md/AGENTS.md was implemented as a `currentPeriodEnd ?? current_period_end` fallback in the webhook handler. The code defended against a non-existent problem while missing the REAL Stripe "Basil" API (2025-03-31) shape change. Lesson: validate doc claims against official changelogs before implementing.
42. **Vercel Fluid Compute changed the maxDuration landscape** — with Fluid Compute now default on all plans, Pro/Enterprise GA caps at 800s (1800s in beta only). The previous "Vercel Pro = 900s" assumption was stale. Always check current platform limits before setting `maxDuration`.
43. **CVE-2025-55182 ("React2Shell") affects React 19.0.0–19.2.2** — CVSS 10.0 pre-auth RCE via React Server Components. The fix is React 19.2.3+. For Next.js apps the runtime fix comes via `next@16.0.10+`, but direct React pins should also be raised to document the security floor.
44. **Zod v4 `.url()` uses `new URL()` (not regex)** — Zod v3's `.url()` used regex validation that rejected non-standard schemes like `postgresql://`. Zod v4 switched to `new URL()` which accepts any scheme. The old `.refine()` workaround is obsolete; compose `.url().refine()` for both format validation AND protocol restriction.
45. **Every env var must go through the Zod schema** — `IMAGE_MODERATION_FAIL_OPEN` was read via `process.env` directly "because it's deliberate, not dynamic". That reasoning conflated runtime mutability with validation. Typos like `IMAGE_MOD_FAIL_OPEN` would silently fall back to the default with no error — exactly the failure mode the env module exists to prevent.
46. **`pnpm-workspace.yaml` syntax evolved** — `allowBuilds` (map syntax, pnpm 10.26+) replaced `onlyBuiltDependencies` (array syntax, removed in pnpm 11). Having both is contradictory. Pick one syntax and set the engine floor to match.
47. **Content drift is silent** — the STYLE_CHIPS array drifted from 8 spec chips to 7 with different labels, and the Hero headline collapsed from 3-line to 2-line. Neither broke tests because no tests asserted the spec copy. Lesson: lock spec-mandated content with regression tests.
48. **TDD on legacy code documents the contract** — the 29 new tests added during post-review hardening serve as living documentation of the intended behavior. The `extractSubscriptionPeriodEnd()` tests document the Basil API shape; the `style-chips.test.ts` tests document the spec label set; the `hero-headline.test.tsx` tests document the 3-line stack.

**Audit v1 remediation (T1–T12):**
49. **Server Action forms must live in a `"use server"` module** — the initial T1 fix put `billingCheckoutAction` inline in the billing page component (a Server Component). `pnpm build` failed with "Functions cannot be passed directly to Client Components". Server Actions must be in a module with `"use server"` at the top. Moved `billingCheckoutAction` to `src/features/billing/actions.ts` (already has `"use server"`). Build passed.
50. **Behind a TLS-terminating reverse proxy, `nextUrl.origin` lies** — Cloudflare Tunnel terminates TLS, so `nextUrl.protocol` is `http:` and/or the Host header may not match the public domain. Constructing redirects with `new URL('/sign-in', nextUrl.origin)` sent the browser to `http://public-domain:80` → `ERR_CONNECTION_REFUSED`. Always use `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)` for redirects that must reach the user's browser. (T2)
51. **Idempotency-key-too-early is a silent data-loss anti-pattern** — the Stripe webhook idempotency INSERT happened BEFORE the event handler. If the handler threw (transient DB error), the row was committed, and Stripe retries hit `onConflictDoNothing` returning `{ duplicate: true }` without re-processing. The subscription update was permanently lost. Fix: INSERT the idempotency row AFTER side effects succeed; use a pre-check SELECT for the common duplicate case. (T4)
52. **Upstash `fixedWindow` rate limiters can't release on disconnect** — `sseRateLimit.fixedWindow(1, '1 m')` incremented a counter on connection open and let it expire after 60s. When the client disconnected cleanly, the counter was NOT decremented. Users who closed and reopened within 60s got 429 despite zero active connections. Fix: use Redis `SET NX EX` (atomic claim with TTL) + `DEL` on disconnect + `EXPIRE` on every poll interval. (T5)
53. **Drizzle transactions can't be nested** — `debitCredits` opened its own transaction. To wrap INSERT + debit in a shared transaction (T3, so InsufficientCreditsError rolls back the INSERT), we needed a `debitCreditsTx(tx, ...)` variant that accepts an existing transaction handle. The standalone `debitCredits` is now a thin wrapper: `db.transaction((tx) => debitCreditsTx(tx, ...))`. Pipeline steps that don't need a shared transaction keep using `debitCredits`.
54. **Source-reading tests must search for `.method()` not `db.method()`** — when verifying that `db.insert(usageEvents)` appears after a `switch` block, the source has `db
  .insert(usageEvents)` across lines. `indexOf('db.insert(usageEvents)')` returns -1 (no contiguous match). Use `indexOf('.insert(usageEvents)')` instead. (T4 test)
55. **TypeScript doesn't preserve `session.user.id` narrowing inside closures** — the SSE route's `req.signal.addEventListener('abort', () => releaseSseSlot(session.user.id, projectId))` failed typecheck because `session.user.id` is `string | undefined` inside the closure (even though we checked it earlier). Fix: capture `const userId: string = session.user.id` before the closure so the type is narrowed to `string`. (T5)
56. **`appendVideo` setting `status='completed'` at insert time is a state-machine lie** — the video row is created in Step 5 (subtitles) with `videoKey=null`. Setting `status='completed'` at insert means any query between Step 5 and Step 6 sees `status='completed'` with `videoKey=null` — a contradictory state. Fix: use the existing `'rendering'` enum value at insert; `updateVideo` sets `'completed'` alongside `videoKey`. The `video_status` enum already had `pending, rendering, completed, failed` — no migration needed. (T8)
57. **Module-load constants make env-configurable behavior untestable per-call** — `const FAIL_OPEN = env.IMAGE_MODERATION_FAIL_OPEN === 'true'` at module top level means tests can't verify both policies in the same run without re-importing the module. Fix: move the read into a `getFailOpen()` function called inside the function body. Tests can now mock `env` per-call. (T9)
58. **Dead exported functions create a second source of truth** — `buildFfmpegCommand` was exported "for unit testing" but never called in production (the real `assembleVideo` uses fluent-ffmpeg's API directly). If someone updated one and not the other, the test passed but production broke. Fix: delete dead code. Tests should verify the real code path, not a parallel implementation. (T10)
59. **Large mechanical sweeps need scripted `sed`, not manual edits** — the T11 brand-token replacement touched 45 files with 149 violations. Per `skills/code-simplification` §3 "Rule of 500": if a refactor touches >500 lines, use automation. Manual edits at that scale are error-prone and exhausting to review. Script saved at `/home/z/my-project/scripts/t11-brand-token-sweep.sh`. (T11)
60. **`metadataBase` hardcoded to a placeholder breaks social sharing** — `new URL('https://storyintovideo-clone.example.com')` made OG image URLs resolve to a non-existent domain. Always use `env.NEXT_PUBLIC_APP_URL` so metadata URLs match the deployment. (T12/L-4)

### Recommendations

1. **Run `pnpm exec playwright install` after fresh clone** — Required for E2E tests to work.
2. **Run `pnpm install` to activate husky** — the `prepare` script sets up `.husky/pre-commit`. Verify the hook fires on your first commit.
3. **Provision all external services** before first run — see `.env.example` for the full list (30 env vars in the Zod schema: 27 required + 3 optional — `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` as a pair, and `IMAGE_MODERATION_FAIL_OPEN`).
4. **Run `pnpm drizzle:generate && pnpm drizzle:migrate`** to create the database schema (these load `.env.local` automatically).
5. **Set `REPLICATE_SDXL_IPADAPTER_MODEL` env var** — the default is a placeholder. Without a real `lucataco/sdxl-ipadapter:<sha>` hash, scene generation won't apply character consistency. (T4)
6. **Validate the AI pipeline end-to-end** — sign up, paste a story, verify characters/scenes/video generate. Steps 4-6 are wired but untested with real API keys. This is the highest-risk validation.
7. ~~Add rate limiting~~ — **Already implemented** (C3: `src/lib/rate-limit.ts` with Upstash Ratelimit on auth, pipeline, SSE). Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in `.env.local`.
8. **Add monitoring** — Sentry (errors), Vercel Analytics (product), Axiom (logs).
9. ~~**Add cookie consent banner**~~ → **Done (Sprint 3 T8)** — `CookieBanner` is now mounted in the root layout (`src/app/layout.tsx`) and exposed via `src/components/app/cookie-banner.tsx`. Privacy Policy page + GDPR endpoints (Sprint 3 T3/T4) + banner (T8) together close the GDPR/CCPA compliance gap.
10. **Run the pre-launch checklist** — `PRODUCTION_READINESS_PLAN.md` §8 before going live.
11. **Visual regression testing** — Playwright screenshot comparison against the live marketing site.
12. **Bundle size monitoring** — `next/bundle-analyzer` to track against the <150KB JS / <30KB CSS budget.
13. ~~**Add E2E tests to CI**~~ → **Done (Sprint 3 T9)** — the GitHub Actions workflow now runs a dedicated e2e job with a Postgres service container + browser binaries + seeded data. The e2e job is set to `continue-on-error` so transient flakiness doesn't block the main lint/typecheck/test/build quality gate.
14. **Set `IMAGE_MODERATION_FAIL_OPEN=false` for production** — fail-closed is the recommended setting once the model output shape is known and stable. (T5)
15. **Deploy + verify the T1–T12 fixes on the live site** — the code changes are committed but the live deployment at `storyintovideo.jesspete.shop` still runs the old code. After deploy, verify: (a) `/dashboard` redirects to `/sign-in` for unauthenticated users (T2), (b) billing upgrade buttons redirect to Stripe Checkout (T1), (c) SSE progress allows immediate reconnection after close (T5).

### Document Hierarchy

| Document | Role |
|---|---|
| `Project_Requirements_Document.md` | Canonical marketing spec (v2.0, 2718 lines, field-verified) |
| `PRODUCTION_READINESS_PLAN.md` | Engineering blueprint (11 ADRs, 27 TDD task cards, risk register, pre-launch checklist) |
| `MASTER_EXECUTION_PLAN.md` | Marketing clone execution record (8 phases, 15 decisions, 20 risks) |
| `CLAUDE.md` | Agent briefing document (stack, conventions, pitfalls, anti-patterns) |
| `AGENTS.md` | Compact agent instructions |
| `README.md` | This file — quick start + architecture + build state |
| `PRD_2.md`, `draft_PRD.md` | Historical drafts (do not reference during implementation) |
| `bundled_skills_to_use.md` | Skill routing reference |
| `storyintovideo_deviation_report.md` | External gap analysis (live-site comparison — 26 claimed deviations) |
| `deviation_report_validation.md` | Validation of the deviation report against codebase + PRD (only 1 genuine gap + 1 enhancement found) |
| `AUDIT_REPORT_v1.md` | Audit v1 findings (2 Critical + 3 High + 6 Medium + 4 Low) — code review per `skills/code-review-and-audit` + `skills/vulnerability-scanner` |
| `REMEDIATION_PLAN_v1.md` | 12-task TDD remediation plan (T1–T12) with RED/GREEN/REFACTOR steps, validation against codebase |

## Contributing

This project has a fixed marketing spec (`Project_Requirements_Document.md`) and a pinned engineering blueprint (`PRODUCTION_READINESS_PLAN.md` with 11 ACCEPTED ADRs). Changes should reference both. Before submitting:

1. `pnpm lint` — zero warnings
2. `pnpm typecheck` — zero errors
3. `pnpm test` — 479 unit tests pass
4. `pnpm test:e2e` — 48 E2E tests pass (requires Playwright browsers)
5. `pnpm format:check` — all files use Prettier code style
6. `pnpm build` — zero errors
7. Visual verification of marketing page against live site at 1440×900
8. Lighthouse ≥ 95 across all categories (marketing page)
9. For production app changes: follow the 5-layer architecture and auth-first Server Action pattern

**Pre-commit hook:** husky + lint-staged automatically runs ESLint + Prettier on staged `.ts/.tsx` files via `.husky/pre-commit`. Run `pnpm install` to activate (the `prepare` script sets up the hook). The hook only checks staged files — run the full quality gate manually before pushing.

## License

MIT
