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
| UI | React 19 | Strict TypeScript, zero `any` |
| Styling | Tailwind CSS v4 | CSS-first `@theme` block (no `tailwind.config.js`) |
| Components | shadcn/ui (Radix) | 4 hand-written primitives + app components |
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
| Video | FFmpeg | Scene + audio + subtitle composition → MP4 |
| Quality | ≥95 Lighthouse | Performance, Accessibility, Best Practices, SEO (marketing page) |

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
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
pnpm drizzle-kit generate    # Create migration SQL from schema
pnpm drizzle-kit migrate     # Apply migrations to Neon

# Run development server (Turbopack)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the marketing page loads with dark background (`#020202`), Outfit font on H1, and Geist Sans on body text. Auth-protected routes (`/dashboard`, `/create`, `/billing`) redirect to `/sign-in` if unauthenticated.

### Verification

```bash
# Type check — must pass with zero errors
pnpm typecheck

# Lint — must pass with zero warnings
pnpm lint

# Unit tests (Vitest) — 164 tests across 24 files
pnpm test

# E2E tests (Playwright) — 48 tests, auto-starts dev server
# (requires `pnpm exec playwright install` first)
pnpm test:e2e

# Format check — all files use Prettier code style
pnpm format:check
```

## Build & Quality Commands

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build (hybrid: static + dynamic)
pnpm start        # Serve built output
pnpm lint         # ESLint (flat config, next/core-web-vitals + typescript-eslint)
pnpm typecheck    # tsc --noEmit (strict mode, noUncheckedIndexedAccess)
pnpm test         # Vitest unit tests (jsdom env)
pnpm test:e2e     # Playwright E2E tests (Chromium)
pnpm format       # Prettier --write (auto-fix)
pnpm format:check # Prettier --check (verify only)
pnpm drizzle-kit generate   # Create migration SQL from schema changes
pnpm drizzle-kit migrate    # Apply migrations to database
pnpm drizzle-kit studio     # Open Drizzle Studio (schema browser)
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

This is a hybrid Next.js app. The marketing page (`/`) is statically prerendered; auth-protected app routes (`/dashboard`, `/create`, `/projects/[id]`, `/billing`) are dynamic; API routes (`/api/auth`, `/api/inngest`, `/api/stripe/webhook`) are `force-dynamic`. A middleware (Edge runtime) protects authenticated routes.

### The 5-Layer Architecture (Golden Rule)

```
Layer 0: src/middleware.ts        — Cookie check, redirect. NO DB. NO logic. Edge runtime.
Layer 1: src/app/                 — Route structure, metadata, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (auth, projects, pipeline, billing)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers. Side effects only.
```

**Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code.

### Routes (12 total)

| Route | Type | Purpose |
|---|---|---|
| `/` | ○ Static | Marketing page (10 sections, unchanged from clone) |
| `/sign-in`, `/sign-up` | ○ Static | Auth pages (Google OAuth + email/password) |
| `/dashboard` | ƒ Dynamic | Project list (auth-protected, Suspense + empty state) |
| `/create` | ○ Static | Project creation wizard (auth-protected) |
| `/projects/[id]` | ƒ Dynamic | Project detail + pipeline status (owner-checked) |
| `/billing` | ○ Static | 4-tier plan table + upgrade CTAs |
| `/api/auth/[...nextauth]` | ƒ Dynamic | Auth.js catch-all |
| `/api/inngest` | ƒ Dynamic | Inngest webhook (6-step pipeline) |
| `/api/stripe/webhook` | ƒ Dynamic | Stripe webhook (signature-verified, idempotent) |
| `/api/health` | ƒ Dynamic | Health check (returns `{ status: 'ok' }`) |
| Middleware | ƒ Proxy | Protects `/dashboard`, `/create`, `/settings`, `/billing` |

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

### The AI Pipeline (Inngest, 6 Steps)

The core product is a multi-step async pipeline that transforms a user's story into a finished video. Orchestrated by Inngest (per-step retries, idempotent, 5–15 min total):

```
Step 0: Moderate (OpenAI Moderation API — block if flagged)
Step 1: Analyze story (GPT-4o JSON mode → characters + scenes)
Step 2: Generate characters (Replicate SDXL → reference portraits)
Step 3: Generate scenes (Replicate SDXL + IP-Adapter → consistent faces)
Step 4: Synthesize voiceover (ElevenLabs TTS, chunked for long text)
Step 5: Align subtitles (Whisper ASR word timestamps → SRT)
Step 6: Assemble video (FFmpeg → MP4)
```

Each step is a pure domain function in `src/features/pipeline/domain/` (no Next.js or DB runtime imports), debits credits via a Drizzle transaction, and updates `project.status` + `progressDetail`.

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

- Focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400`
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
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # Auth.js (force-dynamic)
│   │   ├── inngest/route.ts              # Inngest webhook
│   │   └── stripe/webhook/route.ts       # Stripe webhook
│   ├── layout.tsx                # Root: fonts, metadata, Providers, skip-to-content
│   ├── page.tsx                  # Marketing page (10 sections)
│   ├── globals.css               # @theme + 13 keyframes + @utility + a11y
│   └── icon.tsx                  # Dynamic favicon
├── components/
│   ├── primitives/               # Marketing presentational (7 files)
│   ├── sections/                 # Marketing page sections (10 files)
│   ├── ui/                       # Hand-written shadcn (4: button, accordion, sheet, dropdown-menu)
│   └── app/                      # App components (4: auth-form, create-wizard, empty-state, providers)
├── features/                     # Layer 2 + 3: Feature modules
│   ├── auth/domain/verify-session.ts       # DAL auth function
│   ├── projects/{queries,actions}.ts       # DB access + Server Actions
│   ├── pipeline/
│   │   ├── queries.ts                      # Pipeline state updates
│   │   ├── inngest.ts                      # 6-step pipeline function
│   │   └── domain/                         # Pure functions (6 files)
│   └── billing/{queries,actions,domain/}.ts
├── lib/                          # Layer 4: Infrastructure
│   ├── db/{index,schema/*}.ts              # Drizzle client + 11 tables
│   ├── env/index.ts                        # Zod-validated env
│   ├── auth/{config,index}.ts              # Auth.js v5
│   ├── ai/{openai,replicate,elevenlabs}.ts # AI clients
│   ├── inngest/{client,functions}.ts
│   ├── storage/r2.ts                       # R2 signed URLs
│   ├── stripe/client.ts
│   ├── data/                               # Static marketing data (10 files)
│   ├── hooks/                              # 3 hooks (use-scrolled, use-reveal, use-reduced-motion)
│   ├── fonts.ts · utils.ts
├── tests/
│   ├── unit/                     # 24 files, 164 tests
│   ├── e2e/                      # 9 files, 48 tests
│   └── setup.ts                  # jest-dom + test env vars
├── types/index.ts                # 12 marketing interfaces
└── middleware.ts                 # Layer 0: route protection (Edge runtime)
```

## Database Schema

11 tables across 4 schema files (`src/lib/db/schema/`), with 8 enums:

- **Auth** (`auth.ts`): `users` (with `passwordHash` for credentials), `accounts`, `sessions`, `verificationTokens`
- **Projects** (`projects.ts`): `projects` (with `status` enum: draft→pending→analyzing→...→completed/failed), `characters`, `scenes`
- **Media** (`media.ts`): `videos`, `voiceovers`
- **Billing** (`billing.ts`): `subscriptions` (with `plan` enum, `creditsRemaining`), `usageEvents`

**Enums (8):** `project_status`, `visual_style`, `aspect_ratio`, `video_status`, `video_resolution`, `plan`, `subscription_status`, `usage_event_type`

Run `pnpm drizzle-kit studio` to browse the schema visually.

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

164 tests across 24 files, all GREEN:

**Marketing layer (inherited from clone):**

| Test file | Tests | What it covers |
|---|---|---|
| `cn.test.ts` | 8 | `cn()` utility: string merge, conditionals, tailwind-merge dedup, arrays/objects |
| `use-scrolled.test.ts` | 7 | Scroll threshold detection, boundary cases, scroll event updates |
| `use-reveal.test.tsx` | 7 | IntersectionObserver integration, once/toggle modes, disconnect behavior |
| `use-reduced-motion.test.ts` | 4 | matchMedia integration, change event handling |
| `hero-chip-populate.test.tsx` | 5 | Chip → textarea seed population for all 4 chips + replace behavior |
| `hero-ratio-toggle.test.tsx` | 3 | Ratio toggle single-selection enforcement (9:16 ↔ 16:9) |
| `hero-character-counter.test.tsx` | 4 | Counter renders `0 / 500`, updates on type, amber warning at ≥450 chars |
| `layout-hydration.test.tsx` | 5 | `suppressHydrationWarning` on `<body>`, skip-to-content, JSON-LD, children |
| `metadata.test.ts` | 2 | Canonical URL (`alternates.canonical`) presence + clone-domain resolution |

**Production app layer (new):**

| Test file | Tests | What it covers |
|---|---|---|
| `routing.test.ts` | 2 | `force-static` removal verified |
| `env.test.ts` | 8 | Zod env validation (fail-fast, weak-secret rejection, build-context fallback) |
| `schema.test.ts` | 10 | Drizzle schema structural validation (all 11 tables + columns) |
| `auth-config.test.ts` | 9 | Auth.js v5 config (providers, adapter, JWT, AUTH_SECRET from env) |
| `verify-session.test.ts` | 4 | `verifySession()` DAL (returns session or throws NEXT_REDIRECT) |
| `middleware.test.ts` | 5 | Route protection, Edge-runtime constraint (no DB) |
| `auth-pages.test.ts` | 9 | Sign-in/sign-up pages + AuthForm component |
| `dashboard.test.ts` | 8 | Dashboard shell, Suspense, EmptyState, queries.ts boundary |
| `cta-routes.test.ts` | 11 | All 14 marketing CTAs wired to real routes |
| `create-wizard.test.ts` | 9 | Create page, textarea, style selector, ratio toggle, submit |
| `create-project-action.test.ts` | 7 | Server Action (auth-first, Zod, moderation, credits, DB insert) |
| `analyze-story.test.ts` | 7 | GPT-4o story analysis + Moderation API (mocked OpenAI) |
| `credit-metering.test.ts` | 8 | Tier limits, credit costs, `debitCredits` transaction |
| `pipeline-sprint3.test.ts` | 10 | R2 storage, Replicate character/scene generation, IP-Adapter |
| `sprint4.test.ts` | 12 | ElevenLabs TTS, Whisper ASR, Stripe config + webhook + billing page |

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
5. **Stripe webhook dual camelCase/snake_case support** — `subscription.currentPeriodEnd ?? subscription.current_period_end` for SDK v22+ compatibility.
6. **Inngest v4 `createFunction` signature** — trigger is in the config object (`triggers: [{ event: '...' }]`), not a second argument. The blueprint's pseudocode used the v3 signature.

### What's Implemented vs. Outstanding

**✅ Fully implemented (code layer, 164 tests passing):**
- Auth.js v5 (Google OAuth + Credentials, Drizzle adapter, JWT sessions, middleware)
- Drizzle schema (11 tables, 8 enums) + migration config
- `verifySession()` DAL + route protection
- Sign-in / sign-up pages + AuthForm
- Dashboard with Suspense + empty state
- Create wizard (reuses Hero's glass-input pattern)
- `createProjectAction` Server Action (auth-first, Zod, moderation, credits)
- All 6 AI pipeline domain functions (analyze, moderate, generate-character, generate-scene, synthesize-voice, align-subtitles, assemble-video)
- Inngest 6-step pipeline function
- R2 storage layer (signed URLs, 3 buckets)
- Stripe (Checkout, Portal, webhook with signature verification + idempotency)
- Credit metering (transactional `debitCredits`)
- Billing page (4-tier plan table)
- All 14 marketing CTAs wired to real routes

**⚠️ Outstanding (requires external resources or not yet done):**
- **External service credentials** — Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2, Stripe, Inngest, Resend, Upstash, Sentry (fill `.env.local` from `.env.example`)
- **Database migrations applied** — run `pnpm drizzle-kit generate && migrate` against real Neon
- **Stripe products configured** — `PRICE_IDS` are placeholders
- **Replicate model IDs verified** — `SDXL_MODEL` / `SDXL_IPADAPTER_MODEL` need real version hashes
- **Character consistency validated** — manual R&D test (Risk R1, highest-risk component)
- **FFmpeg assembly validated** — real end-to-end test needed
- **Inngest pipeline trigger wired** — `inngest.send()` in `createProjectAction` is commented out
- **SSE progress stream** — not yet implemented
- **Download/share** — project detail page has no download button
- **Content pages** — `/pricing`, `/blog`, `/contact`, `/privacy`, `/terms` not yet implemented (Privacy + Terms mandatory for launch)
- **Rate limiting** — Upstash Ratelimit not implemented
- **Content moderation on generated images** — currently only story input is moderated
- **Monitoring** — Sentry, Vercel Analytics, Axiom not integrated
- **CI/CD** — GitHub Actions not configured
- **GDPR/CCPA** — cookie consent, data export/deletion not implemented

See `PRODUCTION_READINESS_PLAN.md` §8 for the complete pre-launch checklist.

### Known Issues

- **PostCSS moderate vulnerability** (GHSA-qx2v-qp2m-jg93): 1 moderate vuln in `postcss <8.5.10` (transitive via `next`). Not exploitable. Will resolve when Next.js updates its lockfile. `pnpm audit --audit-level=high` passes clean.
- **`next-auth@5.0.0-beta.31`** — Auth.js v5 is technically beta but widely used in production. Pin the exact version; test on upgrade.
- **Replicate model IDs are placeholders** — `SDXL_MODEL` and `SDXL_IPADAPTER_MODEL` in `src/lib/ai/replicate.ts` need verification with current Replicate model versions.
- **FFmpeg on serverless** — may hit Vercel's 300s function timeout for long videos. The blueprint (ADR-006) specifies moving to Shotstack if this occurs.

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
| `pnpm install` warns "Ignored build scripts: esbuild" | `pnpm-workspace.yaml` missing approval | Add `esbuild` to `onlyBuiltDependencies` |
| Tests fail: "Cannot find module 'next/server'" | jsdom can't load Next.js server modules | Mock `next-auth`, `next/navigation`, `@/lib/db` in tests |

### Lessons Learned

**Marketing layer (inherited):**
1. **`suppressHydrationWarning` belongs on `<body>`, not just `<html>`** — Browser extensions like Grammarly inject attributes into `<body>` before React hydrates.
2. **Workflow component needs `'use client'`** — Uses `useState` for poster→video fade-in choreography.
3. **Test counts drift from plans** — The MEP planned 6 unit + 3 E2E; actual is now 164 unit + 48 E2E. Always verify against `pnpm test` output.
4. **File structure evolves during implementation** — Update docs as you build.
5. **Playwright requires browser binary installation** — `pnpm install` doesn't install browser binaries.

**Production app layer (new):**
6. **Zod `.url()` rejects `postgresql://`** — use `.refine()` for non-standard URL schemes.
7. **Env validation needs build-context fallback** — without it, `next build` fails during page-data collection.
8. **`postgres()` defers connection until first query** — allows eager db instantiation without breaking the build.
9. **DrizzleAdapter validates db object structure** — a Proxy-based lazy db was rejected; use a real Drizzle client.
10. **Inngest v4 changed `createFunction` signature** — trigger is now in the config object, not a second argument.
11. **Auth unit tests must mock `next-auth` + `next/navigation`** — jsdom can't load `next/server`.
12. **Source-reading tests are valid** for server-only modules (auth config, middleware, route handlers) that can't be rendered in jsdom.
13. **Stripe SDK v22 camelCase breaking change** — `currentPeriodEnd` not `current_period_end`.
14. **ElevenLabs returns `Readable`, not `ReadableStream`** — duck-type the input in `streamToBuffer`.
15. **TDD with mocked AI providers works well** — all 6 pipeline domain functions are fully unit-tested; real API calls only needed for manual E2E validation.

### Recommendations

1. **Run `pnpm exec playwright install` after fresh clone** — Required for E2E tests to work.
2. **Provision all external services** before first run — see `.env.example` for the full list.
3. **Run `pnpm drizzle-kit generate && migrate`** to create the database schema.
4. **Validate the AI pipeline end-to-end** — sign up, paste a story, verify characters/scenes/video generate. This is the highest-risk validation.
5. **Implement legal pages** — Privacy Policy and Terms of Service are mandatory before launch.
6. **Add pre-commit hooks** — `husky` + `lint-staged` enforcing `pnpm lint && pnpm typecheck && pnpm test`.
7. **Add CI/CD** — GitHub Actions with the quality gate on every PR.
8. **Add monitoring** — Sentry (errors), Vercel Analytics (product), Axiom (logs).
9. **Run the pre-launch checklist** — `PRODUCTION_READINESS_PLAN.md` §8 before going live.
10. **Visual regression testing** — Playwright screenshot comparison against the live marketing site.
11. **Bundle size monitoring** — `next/bundle-analyzer` to track against the <150KB JS / <30KB CSS budget.

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

## Contributing

This project has a fixed marketing spec (`Project_Requirements_Document.md`) and a pinned engineering blueprint (`PRODUCTION_READINESS_PLAN.md` with 11 ACCEPTED ADRs). Changes should reference both. Before submitting:

1. `pnpm lint` — zero warnings
2. `pnpm typecheck` — zero errors
3. `pnpm test` — 164 unit tests pass
4. `pnpm test:e2e` — 48 E2E tests pass (requires Playwright browsers)
5. `pnpm format:check` — all files use Prettier code style
6. `pnpm build` — zero errors
7. Visual verification of marketing page against live site at 1440×900
8. Lighthouse ≥ 95 across all categories (marketing page)
9. For production app changes: follow the 5-layer architecture and auth-first Server Action pattern

## License

MIT
