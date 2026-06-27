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

# Unit tests (Vitest) — 227 tests across 32 files
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
Layer 0: src/proxy.ts             — Cookie check, redirect. NO DB. NO logic. Edge runtime.
Layer 1: src/app/                 — Route structure, metadata, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (auth, projects, pipeline, billing)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers. Side effects only.
```

**Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code.

### Routes (14 total)

| Route | Type | Purpose |
|---|---|---|
| `/` | ○ Static | Marketing page (10 sections, unchanged from clone) |
| `/sign-in`, `/sign-up` | ○ Static | Auth pages (Google OAuth + email/password) |
| `/dashboard` | ƒ Dynamic | Project list (auth-protected, Suspense + empty state) |
| `/create` | ○ Static | Project creation wizard (auth-protected) |
| `/projects/[id]` | ƒ Dynamic | Project detail + live pipeline status (SSE, owner-checked) |
| `/billing` | ○ Static | 4-tier plan table + upgrade CTAs |
| `/privacy` | ○ Static | Privacy Policy (mandatory for launch) |
| `/terms` | ○ Static | Terms of Service (mandatory for launch) |
| `/api/auth/[...nextauth]` | ƒ Dynamic | Auth.js catch-all |
| `/api/inngest` | ƒ Dynamic | Inngest webhook (6-step pipeline) |
| `/api/stripe/webhook` | ƒ Dynamic | Stripe webhook (signature-verified, idempotent) |
| `/api/projects/[id]/progress` | ƒ Dynamic | SSE progress stream (2s polling, owner-checked) |
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

Each step is a pure domain function in `src/features/pipeline/domain/` (no Next.js or DB runtime imports), debits credits via a Drizzle transaction (analysis=5, char=10, scene=8, voiceover=15, subtitle_alignment=3, video_assembly=30), and updates `project.status` + `progressDetail`. Image moderation (Steps 2 & 3) parses Replicate's `safety_concept` / `api_safety_concept` fields (fail-open for unknown shapes — deliberate tradeoff). Live progress is streamed to the project detail page via SSE at `/api/projects/[id]/progress`.

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
│   ├── hooks/                              # 4 hooks (use-scrolled, use-reveal, use-reduced-motion, use-project-progress)
│   ├── fonts.ts · utils.ts
├── tests/
│   ├── unit/                     # 32 files, 227 tests
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

227 tests across 32 files, all GREEN:

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

**Production app layer (Sprints 1-4):**

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
| `create-project-action.test.ts` | 8 | Server Action (auth-first, Zod, moderation, credits, DB insert, **Inngest trigger**) |
| `analyze-story.test.ts` | 7 | GPT-4o story analysis + Moderation API (mocked OpenAI) |
| `credit-metering.test.ts` | 8 | Tier limits, credit costs, `debitCredits` transaction |
| `pipeline-sprint3.test.ts` | 10 | R2 storage, Replicate character/scene generation, IP-Adapter |
| `sprint4.test.ts` | 12 | ElevenLabs TTS, Whisper ASR, Stripe config + webhook + billing page |

**Remediation sprint (pipeline wiring + UX + compliance):**

| Test file | Tests | What it covers |
|---|---|---|
| `r2-putobject.test.ts` | 4 | R2 `putObject` helper (Buffer → S3 via `PutObjectCommand`) |
| `pipeline-queries.test.ts` | 5 | `appendVoiceover`, `getProjectVoiceover`, `appendVideo`, `updateVideoSubtitle` |
| `assemble-video.test.ts` | 9 | FFmpeg rewrite: SRT temp file, inputOptions per image, Buffer readback, cleanup |
| `pipeline-sprint5.test.ts` | 8 | Steps 4-6 wiring: voiceover, subtitles, video assembly, credit debits, completion |
| `sse-progress.test.ts` | 12 | SSE route source guarantees + `useProjectProgress` hook with mocked EventSource |
| `project-download.test.tsx` | 9 | `getProject` LEFT JOIN videos, download button, share button clipboard fallback |
| `moderate-image.test.ts` | 5 | `moderateImage` parses Replicate safety output, fail-open for unknown shapes |
| `legal-pages.test.ts` | 10 | `/privacy` + `/terms` source guarantees (server components, required sections) |

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

### Deviations from Blueprint (Remediation Sprint)

The remediation sprint closed 9 of the blueprint's outstanding gaps. The following implementation choices were made:

1. **`assemble-video.ts` full rewrite** — the blueprint specified a placeholder FFmpeg integration; the rewrite writes SRT to `/tmp`, uses `inputOptions` per image, reads the output MP4 into a Buffer, and cleans up temp files. The `buildFfmpegCommand` helper is exported for unit testing.
2. **SSE progress via DB polling (not LISTEN/NOTIFY)** — the blueprint suggested either approach. Polling every 2s was chosen because serverless can't hold long-lived Postgres connections for LISTEN/NOTIFY. 2s is fast enough for a 5-15min pipeline without DB load concerns.
3. **Image moderation via Replicate safety output (not OpenAI vision)** — ADR-011 specified moderation on generated images but didn't prescribe the provider. Parsing Replicate's `safety_concept` / `api_safety_concept` fields adds zero latency/cost vs. a second OpenAI vision API call. Fail-open for unknown output shapes (deliberate tradeoff).
4. **`getProject()` LEFT JOIN videos** — the blueprint didn't specify how the download button should fetch video data. LEFT JOIN in the existing query is cheaper than a second `getProjectVideo()` round-trip.
5. **`putObject` for pipeline uploads** — the blueprint only specified `getSignedUploadUrl` (presigned URLs). `putObject` was added for Inngest pipeline steps that already have the Buffer in memory (TTS audio, FFmpeg output) — direct S3 PUT is faster than round-tripping through a presigned URL.
6. **husky `prepare` script with `|| true`** — prevents `pnpm install` from failing on first install (when husky isn't yet installed). This is a common pattern; the `|| true` is intentional.

### What's Implemented vs. Outstanding

**✅ Fully implemented (code layer — 227 unit tests + 48 E2E tests, all GREEN):**
- Auth.js v5 (Google OAuth + Credentials, Drizzle adapter, JWT sessions, middleware)
- Drizzle schema (11 tables, 8 enums) + migration config
- `verifySession()` DAL + route protection
- Sign-in / sign-up pages + AuthForm
- Dashboard with Suspense + empty state
- Create wizard (reuses Hero's glass-input pattern)
- `createProjectAction` Server Action (auth-first, Zod, moderation, credits, **Inngest trigger**)
- All 7 AI pipeline domain functions (analyze, moderate-content, moderate-image, generate-character, generate-scene, synthesize-voice, align-subtitles, assemble-video)
- Inngest 6-step pipeline function (**fully wired: Steps 0-6 + final completion**)
- Image moderation on generated characters + scenes (ADR-011 — `moderateImage` parses Replicate safety output)
- R2 storage layer (signed URLs + `putObject` for pipeline Buffer uploads, 3 buckets)
- Stripe (Checkout, Portal, webhook with signature verification + idempotency)
- Credit metering (transactional `debitCredits`)
- Billing page (4-tier plan table)
- SSE progress stream (`/api/projects/[id]/progress` — 2s polling, owner-checked)
- `useProjectProgress` client hook + `ProjectProgressPanel` (live progress bar)
- Download button (signed R2 URL) + Share button (Web Share API + clipboard fallback)
- `getProject()` LEFT JOINs videos — returns `videoKey` for conditional download render
- Privacy Policy + Terms of Service pages (Server Components, AI-specific clauses)
- All 14 marketing CTAs wired to real routes
- husky + lint-staged pre-commit hook (`.husky/pre-commit`)

**⚠️ Outstanding (requires external resources or not yet done):**
- **External service credentials** — Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2, Stripe, Inngest, Resend, Upstash, Sentry (fill `.env.local` from `.env.example`)
- **Database migrations applied** — run `pnpm drizzle-kit generate && migrate` against real Neon
- **Stripe products configured** — `PRICE_IDS` are placeholders
- **Replicate model IDs verified** — `SDXL_MODEL` / `SDXL_IPADAPTER_MODEL` need real version hashes
- **Character consistency validated end-to-end** — manual R&D test (Risk R1, highest-risk component). Code is wired; needs real API keys.
- **FFmpeg assembly validated end-to-end** — rewritten + unit-tested with mocked fluent-ffmpeg; needs real-world test with actual scene images + audio + SRT
- **Rate limiting** — Upstash Ratelimit not implemented (env vars already in schema)
- **Monitoring** — Sentry, Vercel Analytics, Axiom not integrated (env var `SENTRY_DSN` in schema)
- **CI/CD** — GitHub Actions not configured
- **GDPR/CCPA** — cookie consent banner + data export/deletion endpoints not implemented (Privacy/Terms pages exist)
- **Other content pages** — `/pricing`, `/blog`, `/contact` linked but not implemented

**✅ Recently closed (remediation sprint):**
- ~~Steps 4-6 not wired into Inngest~~ → Fixed
- ~~`inngest.send()` commented out~~ → Fixed
- ~~FFmpeg placeholder implementation~~ → Fixed (rewrite)
- ~~No SSE progress stream~~ → Fixed
- ~~No download/share~~ → Fixed
- ~~No image moderation (ADR-011)~~ → Fixed
- ~~No legal pages~~ → Fixed
- ~~No pre-commit hooks~~ → Fixed (husky + lint-staged)

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
| Tests fail: "Cannot access 'X' before initialization" | `vi.mock()` factory references outer `vi.fn()` | Use `vi.hoisted()`: `const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))` |
| Tests fail: "X is not a constructor" | Mock factory returns arrow fn, real code does `new X()` | Use `class` syntax: `class MockS3Client { send = sendMock; }` |
| Tests fail: "[PARSE_ERROR] Expected '>' but found 'Identifier'" | Test file has JSX but `.test.ts` extension | Rename to `*.test.tsx` |
| Pipeline tests fail: "fetch failed: ENOTFOUND r2.example.com" | Steps 5 & 6 use `fetch()` for R2 downloads | `vi.stubGlobal('fetch', fetchMock)` |
| SSE route returns 307 redirect instead of 401 JSON | Used `verifySession()` (redirects) instead of `auth()` | API routes use `auth()` directly: returns null → 401 JSON |
| SSE stream hangs / never closes | `controller.close()` not called on terminal status | Poll DB every 2s; close when `status ∈ {completed, failed}` |
| `EventSource` leaks across navigations | `useEffect` cleanup missing `eventSource.close()` | Return cleanup fn from `useEffect` |
| husky pre-commit hook doesn't run | `pnpm install` didn't run `prepare` script | Run `pnpm install`; ensure `.husky/pre-commit` is executable |

### Lessons Learned

**Marketing layer (inherited):**
1. **`suppressHydrationWarning` belongs on `<body>`, not just `<html>`** — Browser extensions like Grammarly inject attributes into `<body>` before React hydrates.
2. **Workflow component needs `'use client'`** — Uses `useState` for poster→video fade-in choreography.
3. **Test counts drift from plans** — The MEP planned 6 unit + 3 E2E; actual is now 227 unit + 48 E2E. Always verify against `pnpm test` output.
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

**Remediation sprint (pipeline wiring + UX + compliance):**
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

### Recommendations

1. **Run `pnpm exec playwright install` after fresh clone** — Required for E2E tests to work.
2. **Run `pnpm install` to activate husky** — the `prepare` script sets up `.husky/pre-commit`. Verify the hook fires on your first commit.
3. **Provision all external services** before first run — see `.env.example` for the full list.
4. **Run `pnpm drizzle-kit generate && migrate`** to create the database schema.
5. **Validate the AI pipeline end-to-end** — sign up, paste a story, verify characters/scenes/video generate. Steps 4-6 are wired but untested with real API keys. This is the highest-risk validation.
6. **Add rate limiting** — Upstash Ratelimit on auth, AI, export endpoints. Env vars already in schema.
7. **Add CI/CD** — GitHub Actions with the quality gate on every PR.
8. **Add monitoring** — Sentry (errors), Vercel Analytics (product), Axiom (logs).
9. **Add cookie consent banner** — required for GDPR/CCPA. Privacy Policy page exists; the banner is the missing piece.
10. **Run the pre-launch checklist** — `PRODUCTION_READINESS_PLAN.md` §8 before going live.
11. **Visual regression testing** — Playwright screenshot comparison against the live marketing site.
12. **Bundle size monitoring** — `next/bundle-analyzer` to track against the <150KB JS / <30KB CSS budget.

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
3. `pnpm test` — 227 unit tests pass
4. `pnpm test:e2e` — 48 E2E tests pass (requires Playwright browsers)
5. `pnpm format:check` — all files use Prettier code style
6. `pnpm build` — zero errors
7. Visual verification of marketing page against live site at 1440×900
8. Lighthouse ≥ 95 across all categories (marketing page)
9. For production app changes: follow the 5-layer architecture and auth-first Server Action pattern

**Pre-commit hook:** husky + lint-staged automatically runs ESLint + Prettier on staged `.ts/.tsx` files via `.husky/pre-commit`. Run `pnpm install` to activate (the `prepare` script sets up the hook). The hook only checks staged files — run the full quality gate manually before pushing.

## License

MIT
