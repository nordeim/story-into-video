# StoryIntoVideo — Master Project Architecture Document (PAD) v1.1

**Classification:** Internal Engineering Reference
**Status:** DEFINITIVE, PRODUCTION-LOCKED BLUEPRINT
**Companion Documents:**
- `Project_Requirements_Document.md` (v2.0, 2718 lines — marketing layer spec, field-verified from live DOM)
- `PRODUCTION_READINESS_PLAN.md` (engineering blueprint — 11 ADRs, 27 TDD task cards, risk register, pre-launch checklist)
- `README.md` (quick start + build state)
- `CLAUDE.md` (comprehensive agent briefing)
- `AGENTS.md` (compact agent instructions)
**Last Updated:** 2026-06-29 (v1.2 — post-audit-v1 remediation alignment)
**Audience:** Senior Engineers, Tech Leads, DevOps, and Onboarding Engineers
**Rule:** Every architectural decision in this document traces to a specific rationale.
           Nothing is here "because it's popular."

---

#### Revision Block

- **v1.2 (2026-06-29):** `[ALIGN]` Post-audit-v1 alignment. Updated test counts (377→396, 43→48 files), corrected brand color status (H2/T11 now COMPLETE — 0 violations, was "75+ bypassed"), added T1–T12 audit remediation entries to Known Issues (12 items closed), refreshed Outstanding Tasks (5 new findings: navbar `<a>` vs `<Link>` violation, Privacy Policy promises unimplemented GDPR endpoints, missing `not-found.tsx`, env host-mismatch only warns, missing `/pricing`/`/blog`/`/contact` routes confirmed), updated §9.2 env var table (IMAGE_MODERATION_FAIL_OPEN default is now context-dependent per H8), and refreshed live-site validation findings (C-2 code fix confirmed deployed via `/api/health` returning full DB+FFmpeg check — remaining `localhost:3000` redirect on `/dashboard` is operational env-var misconfiguration, not a code bug).
- **v1.1 (2026-06-28):** `[ALIGN]` Comprehensive alignment update after remediation sprint 3. Updated test counts (288→377, 36→43 files), env var count (28→30), removed `signed-download-wrapper.tsx` (DELETED in H4 fix), added `signUpAction`/`rate-limit.ts`/`api/projects/[id]/download` route, fixed Pattern 3 (LEFT JOIN), Pattern 4 (click-time signing), Pattern 5 (Inngest v4 `triggers` array), ADR-005 (click-time signing), ERD (idempotency_key, nullable userId, UNIQUE constraints), security section (H6 host header validation, C3 rate limiting, C5 idempotency), Known Issues (12 items closed in sprint 3), Key Files (removed wrapper, added new files), developer handbook commands (drizzle:generate/migrate/studio), and removed duplicate voiceovers ERD block.
- **v1.0:** `[SYN, CA]` Initial PAD generation from codebase analysis + 7 remediation sprints of documented decisions.

---

## Table of Contents

1. [System Overview & Decisions](#1-system-overview--decisions)
2. [High-Level System Topology](#2-high-level-system-topology)
3. [Application Architecture](#3-application-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Design System Reference](#5-design-system-reference)
6. [Security Architecture](#6-security-architecture)
7. [Worker / Background Service Architecture](#7-worker--background-service-architecture)
8. [Testing Strategy](#8-testing-strategy)
9. [Build & Deployment](#9-build--deployment)
10. [Developer Handbook](#10-developer-handbook)
11. [Known Issues & Outstanding Tasks](#11-known-issues--outstanding-tasks)
12. [Key Files Reference](#12-key-files-reference)
13. [Glossary](#13-glossary)

---

## 1. System Overview & Decisions

### 1.1 Document Metadata & Purpose

This PAD is the single source of truth for the StoryIntoVideo codebase. It captures not just _what_ the system is, but _why_ every decision was made and _how_ every component fits together.

**How to use this document:**

| Audience | Sections to Focus On |
|---|---|
| New engineer onboarding | §3 (Application Architecture), §4 (Data Architecture), §10 (Developer Handbook) |
| Debugging a specific feature | §3.3 (Critical Code Patterns), §12 (Key Files Reference) |
| Reviewing tech choices | §1.3 (ADRs), §6 (Security Architecture) |
| Preparing for deployment | §9 (Build & Deployment), §11 (Known Issues) |
| Understanding the AI pipeline | §7 (Worker Architecture), §4.1 (Database Schema) |

### 1.2 Technology Stack Summary

Every version is pinned. Every choice has a rationale.

| Layer | Technology | Version | Key Rationale |
|---|---|---|---|
| Web Framework | Next.js (App Router, hybrid rendering) | ^16.2.0 | App Router with RSC streaming, PPR, Turbopack dev, hybrid static+dynamic |
| UI Runtime | React (strict TypeScript) | ^19.2.3 | Pinned above CVE-2025-55182 (React2Shell RCE, CVSS 10.0) |
| Language | TypeScript (strict, verbatimModuleSyntax) | ^5.9.0 | Zero `any`, explicit type imports, noUncheckedIndexedAccess |
| Styling | Tailwind CSS (CSS-first `@theme`) | ^4.3.0 | No `tailwind.config.ts`; all tokens in `globals.css` |
| Components | shadcn/ui (Radix, hand-written) | — | 4 primitives; CLI timed out, implemented manually |
| Fonts | Geist Sans + Geist Mono + Outfit 820 | self-hosted | Outfit 820 unavailable from Google Fonts API; must self-host |
| Icons | Lucide React | ^0.460.0 | Tree-shakable, consistent stroke width |
| Auth | Auth.js v5 (NextAuth) + Drizzle adapter | 5.0.0-beta.31 | Google OAuth + Credentials, JWT sessions, Drizzle-native |
| Database | PostgreSQL (Neon) | ^3.4.9 | Serverless-native, pooled + unpooled connections |
| ORM | Drizzle ORM | ^0.45.2 | SQL-first, lighter than Prisma, migration via drizzle-kit |
| Migrations | drizzle-kit | ^0.31.10 | generate → migrate workflow; never `db push` in production |
| Job Queue | Inngest | ^4.11.0 | Serverless-native step functions, no Redis needed |
| AI — LLM | OpenAI GPT-4o + Whisper + Moderation | ^6.45.0 | JSON mode analysis, ASR, content moderation |
| AI — Image | Replicate SDXL + IP-Adapter | ^1.4.0 | Character portraits + consistent scene generation |
| AI — TTS | ElevenLabs | ^1.59.0 | Voiceover synthesis, chunked for long text |
| Storage | Cloudflare R2 (S3-compatible) | @aws-sdk/client-s3 ^3.1075 | Zero egress, signed URLs, 3 buckets |
| Billing | Stripe | ^22.3.0 | Checkout + Portal + Webhooks, credit-based metering |
| Validation | Zod (env + Server Action inputs) | ^4.4.3 | Build-context fallback for `next build` |
| Video | FFmpeg (system binary) | — | `FFMPEG_PATH` env var; `@ffmpeg-installer/ffmpeg` incompatible with Turbopack |
| Package Manager | pnpm | >=10.26.0 | `allowBuilds` syntax for native build script approval |
| CI/CD | GitHub Actions | — | lint + typecheck + test + build on every PR |
| Testing | Vitest (jsdom) + Playwright (Chromium) | vitest ^4.0 / playwright ^1.61 | 396 unit (48 files) + 48 E2E (9 specs), all GREEN |

### 1.3 Architecture Decision Records (ADRs)

**ADR-001: 5-Layer Architecture with Golden Rule**

- **Context:** The project combines a pixel-accurate marketing frontend with a full production backend. Without strict layering, business logic leaks into UI components, making testing and future sw **Decision:** Implement a 5-layer architecture: proxy (Edge) → app (routes) → features (UI composition) → domain (pure logic) → lib (infrastructure). **Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code.
- **Rationale:** Isolates business logic from Next.js runtime and DB. Enables testing domain functions without mocking Next.js. Prevents circular dependencies by enforcing a unidirectional dependency flow.
- **Consequences:** (+) Clean separation enables independent testing of all domain functions. (+) Swapping a library (e.g., Drizzle → Prisma) only touches Layer 4. (−) Developers must discipline imports; ESLint alone cannot enforce the Golden Rule.
- **Alternatives Rejected:** Feature-sliced design (too many slice boundaries for this project size). Monolith with no layering (would make domain testing impossible).

---

**ADR-002: Hybrid Rendering (Static Marketing + Dynamic App)**

- **Context:** The marketing page is pure static HTML/CSS with no server-side data. App routes need authentication and database access. Both must coexist in the same Next.js deployment.
- **Decision:** Remove `force-static` from the route config. Marketing page (`/`) is statically prerendered. App routes (`/dashboard`, `/create`, `/projects/[id]`, `/billing`) are dynamic. API routes are `force-dynamic`.
- **Rationale:** Static prerendering gives the marketing page sub-second LCP and ≥95 Lighthouse. Dynamic app routes need server-side auth checks and DB access. Hybrid rendering gives the best of both worlds.
- **Consequences:** (+) Marketing page achieves Lighthouse ≥95. (+) App routes can access DB and auth. (−) Marketing and app routes have different caching characteristics.
- **Alternatives Rejected:** Full static (impossible — app routes need auth/DB). Full dynamic (marketing page would lose Lighthouse score from RSC latency).

---

**ADR-003: Stripe "Basil" API (2025-03-31) — Period-End Extraction**

- **Context:** Stripe's Basil API version (2025-03-31) removed `current_period_end` from the top-level Subscription object and moved it to `subscription.items.data[0].current_period_end`. The Stripe Node SDK has always used snake_case (mirroring the REST API) — there was never a camelCase conversion.
- **Decision:** Extract a pure helper `extractSubscriptionPeriodEnd(subscription): number | null` in `src/features/billing/domain/extract-period-end.ts`. The helper checks the Basil shape first (`items.data[0].current_period_end`), then falls back to the pre-Basil top-level field.
- **Rationale:** Pure helper enables unit testing without invoking the full webhook route (which requires signature verification + DB). Two-shape coverage ensures backward compatibility with older Stripe API versions.
- **Consequences:** (+) 8 new regression tests lock the behavior. (+) Pure function is testable without Stripe SDK. (−) Two code paths to maintain.
- **Alternatives Rejected:** Fictional `currentPeriodEnd ?? current_period_end` camelCase fallback (defended against a non-existent problem while missing the real Basil change). Reading only the top-level field (would break on Basil API).

---

**ADR-004: Build-Context Env Fallback for Zod Schema**

- **Context:** `next build` collects page data before any `.env.local` files are available. The Zod env schema throws on, causing the build to fail.
- **Decision:** The env module's `parseEnv()` uses `safeParse`. On failure, it checks if `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`. In these contexts, it returns placeholder values. In all other contexts, it throws with descriptive errors.
- **Rationale:** Allows `next build` to succeed in CI without real secrets. At runtime (dev server, production), real env vars must be present — the app fails fast if they're missing.
- **Consequences:** (+) Build works in CI without secrets. (+) Runtime misconfiguration fails fast. (−) Placeholders could mask issues if the fallback is accidentally triggered in production (impossible — requires `NEXT_PHASE` or `NODE_ENV=test`).
- **Alternatives Rejected:** Making all env vars optional (would silently disable features). Using `process.env` directly in routes (bypasses validation).

---

**ADR-005: Click-Time R2 URL Signing (H4 Fix)**

- **Context:** Client components (`'use client'`) cannot import `@/lib/storage/r2` at module level because the R2 module imports `env`, which validates all 30 env vars at module load. In the browser, server-only vars are `undefined`, causing "Invalid environment variables" crash. The previous approach (SSR-time signing in `SignedDownloadWrapper`) baked the 1h-expiry URL into the RSC payload, causing 403 Forbidden for users who left tabs open >1h.
- **Decision:** Replace `SignedDownloadWrapper` with a dedicated API route (`/api/projects/[id]/download`) that signs the URL at click time. `ProjectDownloadButton` receives `{ projectId, hasVideo }` (primitive props that never expire) and fetches the API route on click. `SignedDownloadWrapper` was DELETED.
- **Rationale:** The only safe pattern for client components that need data derived from server-only env vars. Click-time signing ensures every download gets a fresh URL (no 403). Follows Next.js 16 recommended patterns.
- **Consequences:** (+) Client components never crash on env validation. (+) URLs signed at click time (no stale 403). (+) No wrapper component needed. (−) One extra API call per download (negligible latency).
- **Alternatives Rejected:** Conditional env validation (would make the schema non-deterministic). Importing R2 in client-side effects (the crash happens at module load, before effects run). SSR-time signing (1h expiry trap — H4 bug).

---

**ADR-006: System FFmpeg Binary (Not npm Installer)**

- **Context:** `@ffmpeg-installer/ffmpeg` uses dynamic `require()` with runtime-constructed paths (`__dirname.indexOf('node_modules')`) that produce `/ROOT/node_modules/...` under Turbopack's virtual filesystem. Turbopack rejects this with "server relative imports are not implemented."
- **Decision:** Use system FFmpeg binary via `getFfmpegPath()` helper that reads `FFMPEG_PATH` env var with `/usr/bin/ffmpeg` default. No npm package dependency.
- **Rationale:** Turbopack-compatible. System FFmpeg is standard on Linux/macOS. The `FFMPEG_PATH` env var allows non-standard locations.
- **Consequences:** (+) Turbopack-compatible. (+) Simpler dependency tree. (−) Requires FFmpeg to be installed on the host concern for Docker deployments).
- **Alternatives Rejected:** `@ffmpeg-installer/ffmpeg` (Turbopack-incompatible). `@napi-rs/ffmpeg` (not available at time of decision). WASM FFmpeg (too slow for production use).

---

## 2. High-Level System Topology

```
                                    ┌─────────────────────────────────────┐
                                    │           CLIENT (Browser)           │
                                    │  Next.js App Router · React 19 · SPA │
                                    └──────────┬──────────────────────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
                    ┌─────▼─────�       ┌─────▼─────�       ┌─────▼─────�
                    │ Marketing │       │   App     │       │    API     │
                    │ (Static)  │       │ (Dynamic) │       │(force-dyn) │
                    └───────────┘       └─────�─────┘       └─────┬─────�
                                              │                    │
                          ┌───────────────────┼────────────────────┤
                          │                   │                    │
                    �─────▼─────┐      ┌─────▼─────�       �─────▼─────┐
                    │  Auth.js  │      │  Inngest   │       │  Stripe   │
                    │  (Edge +  │      │  (Worker)  │       │ Webhooks  │
                    │  DB sess) │      │ 6-step AI  │       │           │
                    └─────┬─────┘      └─────┬─────┘       └───────────�
                          │                  │
         ┌────────────────┼─────────�────────┼────────────────────┐
         │                │         │        │                    │
   ┌─────▼─────�  ┌──────▼──┌───▼───┐  ┌─▼────────�  �───────▼──────�
   │ PostgreSQL │  │Cloudfl. │  │OpenAI │  │ Replicate │  │ ElevenLabs  │
   │   (Neon)   │  │ R2 (3bk)│  │GPT-4o │  │   SDXL    │  │    TTS      │
   └────────────┘  └─────────┘  │Whisp. │  │IP-Adapter │  └─────────────┘
                               │Moder. │  └───────────┘
                               └───────┘
```

**Runtime characteristics:**

| Layer | Runtime | Scaling | Key Constraints |
|---|---|---|---|
| Client | Browser | Horizontal (CDN for static) | No server-only imports in `'use client'` files |
| Marketing pages | Edge (static) | Automatic | No auth, no DB |
| App routes | Node.js (Vercel Fluid) | Auto-scaling | `maxDuration` limits (800s Pro, 300s Hobby) |
| API routes | Node.js | Auto-scaling | `force-dynamic`, no prerendering |
| Inngest workers | Serverless functions | Per-step concurrency | Idempotent steps, retry on failure |
| Auth | Edge (cookie check) + Node.js (session) | Automatic | Edge can't access DB for session lookup |
| R2 | S3 API (Cloudflare edge) | Automatic | Signed URLs with 1h expiry |

---

## 3. Application Architecture

### 3.1 The Layer Model

```
Layer 0: src/proxy.ts             — Cookie check → redirect. NO DB. NO logic. Edge runtime.
Layer 1: src/app/                 — Route structure, metadata, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (auth, projects, pipeline, billing)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers.
```

**Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code.

### 3.2 Annotated Directory Structure

```
src/
├── app/                              # Layer 1: App Router
│   ├── (auth)/                       # Auth route group
│   │   ├── sign-in/page.tsx           # Sign-in (Google + credentials)
│   │   └── sign-up/page.tsx           # Sign-up
│   ├── (app)/                        # Authenticated app (middleware-protected)
│   │   ├── dashboard/page.tsx         # Project list (Suspense + empty state)
│   │   ├── create/page.tsx            # Create wizard
│   │/[id]/page.tsx     # Project detail + live pipeline status (SSE)
│   │   └── billing/page.tsx           # 4-tier plan table
│   ├── (legal)/                      # Legal pages (Server Components)
│   │   ├── privacy/page.tsx           # Privacy Policy
│   │   └── terms/page.tsx             # Terms of Service
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts          # Auth.js catch-all (force-dynamic)
│   │   ├── inngest/route.ts                     # Inngest webhook (force-dynamic)
│   │   ├── stripe/webhook/route.ts              # Stripe webhook (force-dynamic, idempotent)
│   │   ├── projects/[id]/progress/route.ts      # SSE progress (force-dynamic, rate-limited)
│   │   ├── projects/[id]/download/route.ts      # Click-time R2 URL signing (H4 fix)
│   │   └── health/route.ts                      # Health check (DB + FFmpeg)
│.tsx                    # Root: fonts, metadata, Providers, skip-to-content, JSON-LD
│   ├── page.tsx                      # Marketing page (composes 10 sections)
│   ├── globals.css                   # @theme + 13 keyframes + 7 @utility + a11y + reduced-motion
│   └── icon.tsx                      # Dynamic favicon
├── components/
│   ├── primitives/                   # Marketing presentational (7 files)
│   │   ├── cta-amber.tsx             # Solid amber CTA button
│   │   ├── cta-gradient.tsx          # Gradient pill CTA
│   │   ├── cta-ghost.tsx             # Ghost link CTA
│   │   ├── eyebrow.tsx               # Section eyebrow label
│   │   ├── scroll-reveal.tsx         # IntersectionObserver wrapper
│   │   ├── section-heading.tsx       # Section H2 heading
│   │   └── style-chip.tsx            # Hero marquee chip
│   ├── sections/                     # Marketing page sections (10 files)
│   │   ├── navbar.tsx                # Fixed overlay, scroll-aware bg, mobile Sheet
│   │   ├── hero.tsx                  # 4-layer: video + scrim + glow + fade. Glass input.
│   │   ├── examples.tsx              # Carousel with arrow scroll
│   │   ├── workflow.tsx              # 4 alternating rows + looping MP4
│   │   ├── features.tsx              # 4×2 grid, hairline borders
│   │   ├── testimonials.tsx           # 3×2 grid, initials avatars
│   │   ├── use-cases.tsx             # 2×2 grid, corner glow
│   │   ├── faq.tsx                   # Radix Accordion
│   │   ├── final-cta.tsx             # Dot-grid bg, amber CTA pill
│   │   └── footer.tsx                # 3 link columns + copyright
│   ├── ui/                           # Hand-written shadcn (4 files)
│   │   ├── button.tsx                # CVA variants + @radix-ui/react-slot
│   │   ├── accordion.tsx             # Radix Accordion + grid-template-rows animation
│   │   ├── sheet.tsx                 # Radix Dialog for mobile nav
│   │   └── dropdown-menu.tsx         # Radix DropdownMenu for language switcher
│   └── app/                          # App-specific components (7 files)
│       ├── auth-form.tsx             # Google OAuth + credentials form (C1: sign-up mode)
│       ├── create-wizard.tsx         # Story input + style selector + ratio + submit
│       ├── empty-state.tsx           # Reusable empty-state primitive
│       ├── providers.tsx             # SessionProvider wrapper
│       ├── project-progress-panel.tsx # SSE subscriber + progress bar
│       ├── project-download-button.tsx # Client: fetches /api/projects/[id]/download on click (H4)
│       └── project-share-button.tsx  # Web Share API + clipboard fallback
├── features/                         # Layer 2 + 3: Feature modules
│   ├── auth/
│   │   ├── actions.ts               # signUpAction (C1: bcrypt cost 12, user insert, subscription, auto sign-in)
│   │   └── domain/
│   │       └── verify-session.ts     # DAL: returns session or throws NEXT_REDIRECT
│   ├── projects/
│   │   ├── queries.ts               # getUserProjects, getProject (owner-checked, LEFT JOIN)
│   │   └── actions.ts               # createProjectAction: auth→Zod→moderation→credits→DB→Inngest
│   ├── pipeline/
│   │   ├── queries.ts               # appendCharacter/Scene/Voiceover/Video, updateProgress
│   │   ├── inngest.ts               # 6-step pipeline (createFunction, v4 signature)
│   │   └── domain/                  # 8 pure functions
│   │       ├── analyze-story.ts      # GPT-4o JSON mode
│   │       ├── moderate-content.ts   # OpenAI Moderation API
│   │       ├── moderate-image.ts     # Replicate safety_concept parser
│   │       ├── generate-character.ts # Replicate SDXL
│   │       ├── generate-scene.ts     # Replicate SDXL + IP-Adapter
│   │       ├── synthesize-voice.ts   # ElevenLabs TTS
│   │       ├── align-subtitles.ts    # Whisper ASR → SRT
│   │       └── assemble-video.ts     # FFmpeg compositor
│   └── billing/
│       ├── queries.ts               # getOrCreateSubscription, debitCredits
│       ├── actions.ts               # checkoutAction, portalAction
│       └── domain/
│           ├── tier-limits.ts        # TIER_LIMITS + CREDIT_COSTS
│           └── extract-period-end.ts # Stripe Basil API period-end extraction
├── lib/                              # Layer 4: Infrastructure
│   ├── db/
│   │   ├── index.ts                  # Drizzle client (Neon pooled, deferred connection)
│   │   ├── schema/                   # auth.ts, projects.ts, media.ts, billing.ts + index.ts
│   │   └── seed.ts                   # Development seed data
│   ├── env/index.ts                  # Zod env schema (31 vars) + build-context fallback + host-mismatch warning
│   ├── auth/
│   │   ├── config.ts                 # Auth.js v5 config (Google + Credentials + Drizzle + trustHost:true)
│   │   └── index.ts                  # Re-exports auth, handlers, signIn, signOut
│   ├── ai/
│   │   ├── openai.ts                 # GPT-4o, Whisper, Moderation clients
│   │   ├── replicate.ts              # SDXL + IP-Adapter client + placeholder warning (C2)
│   │   └── elevenlabs.ts             # TTS client + DEFAULT_VOICE_ID
│   ├── inngest/
│   │   ├── client.ts                 # Inngest client + PIPELINE_EVENT constant
│   │   └── functions.ts              # Function registrations
│   ├── storage/r2.ts                 # S3-compatible R2 + signed URLs + putObject + MAX_PUT_OBJECT_BYTES
│   ├── stripe/client.ts              # Stripe SDK + PRICE_IDS
│   ├── rate-limit.ts                 # Upstash Ratelimit (C3: auth/pipeline/SSE)
│   ├── data/                         # Static marketing data (10 files: style-chips, testimonials, etc.)
│   ├── hooks/
│   │   ├── use-scrolled.ts           # Scroll threshold → boolean
│   │   ├── use-reveal.ts             # IntersectionObserver → data-revealed
│   │   ├── use-reduced-motion.ts     # matchMedia → boolean
│   │   └── use-project-progress.ts   # EventSource + reconnect + state machine
│   ├── fonts.ts                      # Geist + Outfit font config
│   └── utils.ts                      # cn() utility (clsx + tailwind-merge)
├── tests/
│   ├── unit/                         # 43 files, 377 tests (Vitest + jsdom)
│   ├── e2e/                          # 9 files, 48 tests (Playwright + Chromium)
│   └── setup.ts                      # jest-dom + test env vars
├── types/
│   └── index.ts                      # 12 marketing interfaces
└── proxy.ts                          # Layer 0: Edge route protection (cookie check → redirect)

.husky/
└── pre-commit                        # Runs-staged` on staged files
```

### 3.

#### Pattern 1: Auth-First Server Action

Every Server Action starts with `verifySession()`. **Never wrap in try/catch.**

```typescript
// src/features/projects/actions.ts
'use server';

import { verifySession } from '@/features/auth/domain/verify-session';
import { z } from 'zod';

export async function createProjectAction(formData: FormData) {
  // 1. AUTH — throws NEXT_REDIRECT if not authenticated (never catch this)
  const session = await verifySession();
  if (!session?.user?.id) {
    throw new Error('Auth context invariant: verifySession returned without user');
  }
  const userId = session.user.id;

  // 2. VALIDATE — Zod on all user input
  const schema = z.object({
    story: z.string().min(10).max(500),
    style: z.enum(['anime', 'realistic', 'watercolor']),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('Invalid input');

  // 3. AUTHORIZE — check credits
  // 4. EXECUTE — DB insert
  // 5. TRIGGER — inngest.send({ name: PIPELINE_EVENT, data: { projectId } })
}
```

**Why this pattern:** `verifySession()` throws `NEXT_REDIRECT` which must propagate to the Next.js runtime. Wrapping it in try/catch silently swallows the redirect, causing the action to appear to succeed for unauthenticated users.

---

#### Pattern 2: Domain Pure Functions

No Next.js or DB runtime imports. `import type` only.

```typescript
// src/features/pipeline/domain/moderate-image.ts
import { env } from '@/lib/env';  // env is read at module load (constant)
// All other imports must be type-only

export interface ImageModerationResult {
  flagged: boolean;
  categories: string[];
  moderationSkipped: boolean;  // Observable bypass (T5)
}

const FAIL_OPEN = env.IMAGE_MODERATION_FAIL_OPEN === 'true';

export async function moderateImage(input: ModerateImageInput): Promise<ImageModerationResult> {
  // Pure logic: parse Replicate safety output → return result
  // No DB, no Next.js runtime, no http calls (except via injected deps for testing)
}
```

**Why this pattern:** Domain functions can be unit-tested without mocking Next.js or a database. They're the business logic contract — if this function changes, the product behavior changes. The `env` import is safe because env vars are read once at module load (constants in production).

---

#### Pattern 3: queries.ts Boundary

Components never call `db` directly. All DB access goes through feature-level `queries.ts`.

```typescript
// src/features/projects/queries.ts
import { db } from '@/lib/db';
import { projects, videos } from '@/lib/db/schema';
import { eq, leftJoin } from 'drizzle-orm';

export async function getProject(projectId: string, userId: string) {
  // LEFT JOIN videos so the project detail page can render a download button
  // when the video is ready. Returns videoKey + subtitleKey (both null if
  // the project hasn't reached the assembly step yet).
  const [row] = await db
    .select({
      ...projects,
      videoKey: videos.videoKey,
      subtitleKey: videos.subtitleKey,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .leftJoin(videos, eq(videos.projectId, projects.id))
    .limit(1);

  if (!row || row.userId !== userId) return null;
  return row;
}
```

**Why this pattern:** Components can be tested with mocked `queries.ts` instead of mocking the entire Drizzle ORM. Future ORM swaps (Drizzle → Prisma) only touch `queries.ts`. The LEFT JOIN avoids a second DB round-trip — the project detail page needs video data for the download button, and the JOIN adds <1ms vs 5-15ms for a second query.

---

#### Pattern 4: Click-Time R2 URL Signing (H4 Fix)

The previous `SignedDownloadWrapper` Server Component signed the R2 URL at SSR time, baking the 1h-expiry URL into the RSC payload. Users who left tabs open >1h got 403 Forbidden. **Replaced with click-time signing.**

```typescript
// src/app/api/projects/[id]/download/route.ts (API route — force-dynamic)
import { auth } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/storage/r2';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();  // Returns null → 401 JSON (not redirect)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ... owner check, then:
  const url = await getSignedDownloadUrl(videoKey);  // Fresh signed URL per request
  return NextResponse.json({ url });
}

// src/components/app/project-download-button.tsx ('use client')
'use client';
// NO import of r2.ts — would crash env validation in browser
export function ProjectDownloadButton({ projectId, hasVideo }: Props) {
  const handleClick = async () => {
    const res = await fetch(`/api/projects/${projectId}/download`);
    const { url } = await res.json();
    window.open(url, '_blank');  // Fresh URL every time — no 403
  };
  return <button onClick={handleClick} disabled={!hasVideo}>Download</button>;
}
```

**Why this pattern:** The `r2.ts` module imports `env` which validates all 30 env vars at module load. In the browser, server-only vars are `undefined`, causing "Invalid environment variables" crash. Click-time signing via API route ensures every download gets a fresh URL. `SignedDownloadWrapper` was DELETED.

---

#### Pattern 5: Inngest v4 Pipeline Function

Trigger is in the config object via `triggers` array (v4 signature).

```typescript
// src/features/pipeline/inngest.ts
import { inngest } from '@/lib/inngest/client';
import { PIPELINE_EVENT } from '@/lib/inngest/client';

export const pipelineFunction = inngest.createFunction(
  { id: 'story-to-video-pipeline', retries: 3, triggers: [{ event: PIPELINE_EVENT }] },
  async ({ event, step }) => {
    const projectId = event.data.projectId as string;

    // Each step is idempotent and debits credits with deterministic keys
    const analysis = await step.run('analyze', async () => {
      await debitCredits(userId, CREDIT_COSTS.analysis, 'analysis', `${projectId}:analysis`);
      return analyzeStory(projectId);
    });
    // ... Steps 2-6 (all debit credits with per-entity idempotency keys)

    await step.run('complete', () => completeProject(projectId));
  }
);
```

**Why this pattern:** Inngest v4 changed the `createFunction` signature. The trigger is now in the config object via `triggers: [{ event: '...' }]`, not a second argument. Steps are idempotent — Inngest retries on failure, so safe to re-execute. Each step debits credits with a deterministic idempotency key (`${projectId}:stepName`) to prevent double-charging on retry (C5/C6 fix).

---

## 4. Data Architecture

### 4.1 Database Schema

```mermaid
erDiagram
    users ||--o{ projects : "userId (UUID FK)"
    users ||--o{ accounts : "auth"
    users ||--o{ sessions : "auth"
    users ||--o{ verificationTokens : "auth"
    users ||--o{ subscriptions : "userId (UUID FK)"
    projects ||--o{ characters : "projectId (UUID FK)"
    projects ||--o{ scenes : "projectId (UUID FK)"
    projects ||--o{ videos : "projectId (UUID FK)"
    projects ||--o{ voiceovers : "projectId (UUID FK)"
    users ||--o{ usageEvents : "userId (UUID FK)"

    users {
        uuid id PK
        text email
        text name
        text image
        text passwordHash "nullable — null for OAuth-only"
        timestamptz createdAt
    }
    projects {
        uuid id PK
        uuid userId FK
        text title
        text story "user input"
        text status "enum: draft|pending|analyzing|...|completed|failed"
        integer progressPercent
        text progressDetail
        text errorMessage
        text style "enum"
        text aspectRatio "enum: 9:16|16:9"
        timestamptz createdAt
        timestamptz updatedAt
    }
    characters {
        uuid id PK
        uuid projectId FK
        text name
        text description
        text referenceImageKey "R2 key"
        UNIQUE(project_id, name) "C5/M1"
    }
    scenes {
        uuid id PK
        uuid projectId FK
        integer order
        text description
        text generatedImageKey "R2 key"
        integer duration
        UNIQUE(project_id, order) "C5/M1"
    }
    videos {
        uuid id PK
        uuid projectId FK
        text videoKey "R2 key"
        numeric duration
        text resolution "enum"
        text status "enum"
        text subtitleKey "R2 key"
        UNIQUE(project_id) "C5/M1"
    }
    voiceovers {
        uuid id PK
        uuid projectId FK
        text voiceId
        text voiceName
        text audioKey "R2 key"
        numeric duration
        text transcript
        UNIQUE(project_id) "C5/M1"
    }
    subscriptions {
        uuid id PK
        uuid userId FK
        text stripeCustomerId
        text stripeSubscriptionId
        text plan "enum: free|creator|pro|studio"
        text status "enum: active|past_due|canceled|unpaid"
        integer creditsRemaining
        timestamptz currentPeriodEnd
    }
    usageEvents {
        uuid id PK
        uuid userId FK "nullable — H7 fix for webhook events"
        uuid projectId FK
        text type "enum"
        integer cost
        text idempotencyKey "UNIQUE — C5 idempotency guard"
        text metadata "text — optional JSON"
    }
```

### 4.2 Data Models

**Projects** — The central entity. Status follows a linear progression:

```
draft → pending → analyzing → generating_characters → generating_scenes
→ synthesizing_voice → aligning_subtitles → assembling_video → completed
                                                        ↘ failed
```

**Billing**-based (prepaid). Costs:
| Step | Credits |
|---|---|
| Story analysis | 5 |
| Character generation | 10/each |
| Scene generation | 8/each |
| Voiceover synthesis | 15 |
| Subtitle alignment | 3 |
| Video assembly | 30 |

### 4.3 Persistence Strategy

- **Pooled connection** (`DATABASE_URL`): Neon's `-pooler` host. Used by the app runtime. Supports many concurrent connections.
- **Unpooled connection** (`DATABASE_URL_UNPOOLED`): Direct host. Used by `drizzle-kit` for DDL operations (pooling + DDL is unreliable).
- **Migrations:** `drizzle-kit generate` creates SQL files in `/drizzle`. `drizzle-kit migrate` applies them. Never `db push` in production.
- **Schema source of truth:** `src/lib/db/schema/*.ts` Drizzle definitions.
- **Seed data:** `src/lib/db/seed.ts` (development only).
- **No caching layer** — SSE progress polling (2s) is the only pseudo-real-time mechanism. Postgres LISTEN/NOTIFY avoided because serverless can't hold long-lived connections.

---

## 5. Design System Reference

### 5.1 Typographic System

| Role | Font | Weight | Tracking | Fallback |
|---|---|---|---|---|
| Display H1 | Outfit | **820** | -0.04em | Geist Sans (bold) |
| Display H2 | Outfit | 700 | -0.03em | Geist Sans (bold) |
| Body | Geist Sans | 400 | normal | system-ui |
| Accents | Geist Mono | 400 | — | ui-monospace |
| Ratio toggles | Geist Mono | 400 | — | ui-monospace |

Outfit weight 820 is self-hosted via `next/font/local` pointing to `public/fonts/Outfit-VariableFont.woff2`. Google Fonts API only serves discrete weights (400, 500, 600, 700, 800).

Font families are applied via CSS variables in `globals.css` `@theme` block:
- `--font-heading` → Outfit variable
- `--font-sans` → Geist Sans variable
- `--font-mono` → Geist Mono variable

### 5.2 Color Tokens

| Token | Hex | Usage | WCAG Contrast (on #020202) |
|---|---|---|---|
| `--background` | `#020202` | Page background (near-black, NOT pure #000) | — |
| `--primary` | `#febf00` | CTAs, active states, focus rings | 15.7:1 (AAA) |
| `--card` | `#060607` | Card surfaces | 1.1:1 (surface, not text) |
| `--muted-foreground` | `#8e8e95` | Secondary text, timestamps | 5.2:1 (AA) |
| `--foreground` | `#f8f8f8` | High-16.9:1 (AAA) |
| Body text | `#d4d4d8` | Paragraph/body text | 12.6:1 (AAA) |

⚠️ **Critical:** `#febf00` (PRD amber) ≠ Tailwind's `amber-400` (`#fbbf24`). These are different colors. Use the custom `--color-primary` token.

Full semantic token table lives in `Project_Requirements_Document.md` §1.2.

### 5.3 Component Primitives

4 hand-written shadcn/ui primitives in `src/components/ui/`:

| Component | Radix Base | Customization |
|---|---|---|
| Button | `@radix-ui/react-slot` | CVA variants (default, destructive, outline, ghost, link) |
| Accordion | `@radix-ui/react-accordion` | grid-template-rows 0fr→1fr animation |
| Sheet | `@radix-ui/react-dialog` | Slide-in from right for mobile nav |
| DropdownMenu | `@radix-ui/react-dropdown-menu` | Decorative language switcher (no i18n) |

All use `class-variance-authority` for variant management.

### 5.4 Motion / Animation

All 13 keyframes are pure CSS `@keyframes` in `src/app/globals.css`. **No Framer Motion. No GSAP.**

```
fade-in-up, float, glow-pulse, border-glow, composite-pulse-text,
shimmer, btn-shimmer, grid-shimmer, grid-sweep-h, grid-sweep-v,
scanline-scroll, lang-dropdown-in, marquee-scroll
```

Scroll reveal: `IntersectionObserver` via `useReveal` hook → `data-revealed` attribute → CSS transition.

Reduced motion: `@media (prefers-reduced-motion: reduce)` globally disables all animation including scroll reveal.

7 custom `@utility` classes:
- `scrollbar-hide` — Hide scrollbar (cross-browser)
- `marquee-mask` — Fade edges for infinite marquee
- `marquee-track` — translateX(-50%) for seamless loop
- `glass-input` — Frosted glass input wrapper with focus-within glow
- `eyebrow` — Section label with mono tracking
- `section-heading` — H2 with Outfit + tracking
- `cta-amber` — Solid amber CTA pill with hover state

---

## 6. Security Architecture

### 6.1 Security Rules

| Rule | Enforcement |
|---|---|
| Never `process.env.*` directly | Zod env schema validates all 30 vars; import `env` from `@/lib/env` |
| Never wrap `verifySession()` in try/catch | Throws `NEXT_REDIRECT` which must propagate |
| Never import `r2.ts` in `'use client'` files | Env validation crash in browser |
| Never use `any` | ESLint `@typescript-eslint/no-explicit-any: error` |
| Never `db push` in production | Migrations only: `drizzle-kit generate` + `migrate` |
| Never skip content moderation | Every story input must be moderated (ADR-011) |
| Stripe webhooks must verify signature | `stripe.webhooks.constructEvent()` with `env.STRIPE_WEBHOOK_SECRET` |
| R2 buckets are private | All access via signed URLs with time-limited expiry |
| Passwords hashed with bcryptjs | `bcrypt.hash(password, 12)` in Auth.js Credentials provider |
| Security headers | X-Frame-Options DENY, nosniff, strict referrer, Permissions-Policy |

### 6.2 Security Utilities

| Utility | Location | Purpose |
|---|---|---|
| Zod env validation | `src/lib/env/index.ts` | Fail-fast on misconfigured env vars |
| Weak secret detection | `src/lib/auth/config.ts` | Rejects `AUTH_SECRET` matching `dev-secret`, `test-secret`, etc. |
| `verifySession()` | `src/features/auth/domain/verify-session.ts` | Auth function with owner checks |
| SERVER proxy | `src/proxy.ts` | Edge cookie check + redirect |
| Stripe webhook signature | `src/app/api/stripe/webhook/route.ts` | `stripe.webhooks.constructEvent()` |
| Credit debit transactions | `src/features/billing/queriesrizzle transaction prevents race conditions |
| Image moderation | `src/features/pipeline/domain/moderate-image.ts` | Replicate safety parser (ADR-011) |
| Content moderation | `src/features/pipeline/domain/moderate-content.ts` | OpenAI Moderation API |
| R2 signed URLs | `src/lib/storage/r2.ts` | Time-limited access to private buckets |

### 6.3 Authentication & Authorization

- **Session model:** JWT stored in httpOnly cookie (Auth.js v5 default). Session data in `sessions` table (Drizzle adapter).
- **Providers:** Google OAuth (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`) + Credentials (email + bcrypt password).
- **Authorization:** Owner-checked at the query level. `getProject(projectId, userId)` returns null if not owner.
- **Edge proxy:** Checks cookie presence only (no DB access). Actual session validity verified by `verifySession()` in Server Actions/Components.
- **API routes:** Use `auth()` directly (returns null → 401 JSON). Do NOT use `verifySession()` (redirects — wrong for JSON).
- **`trustHost: true`:** Required for reverse-proxy deployments. Makes Auth.js use the incoming request's Host header instead of `AUTH_URL` for callback URLs.

### 6.4 Threat Model

| Attack Vector | Mitigation |
|---|---|
| Unauthenticated mutations | `verifySession()` first in every Server Action |
| SQL injection | Drizzle ORM parameterized queries (no raw SQL) |
| XSS via user content | React's built-in escaping; `dangerouslySetInnerHTML` only for JSON-LD |
| CSRF | SameSite cookies + `Referrer-Policy: strict-origin-when-cross-origin` |
| Credential stuffing | bcrypt (cost factor 12); rate limiting via Upstash (C3) |
| Credit race conditions | Drizzle `transaction()` + `.for('update')` row lock + idempotency key (C5) |
| Stale subscription data | Webhook-driven sync with Stripe "Basil" API shape |
| R2 bucket enumeration | Signed URLs with 1h expiry; no public bucket access |
| Environment variable leaks | Build-context fallback (placeholders only during `next build`) |
| Host Header Injection | `proxy.ts` validates Host header against whitelist (canonical + localhost + `.vercel.app`) (H6) |
| Stale download URLs (403) | Click-time R2 URL signing via API route (H4) |
| Double-charging on retry | Idempotency keys + `ON CONFLICT DO NOTHING` in `debitCredits()` (C5) |
| AI cost amplification | Rate limiting on pipeline creation (5/min/user) (C3) |

---

## 7. Worker / Background Service Architecture

### 7.1 Worker Directory Structure

```
src/lib/inngest/
├── client.ts                 # Inngest client + PIPELINE_EVENT constant
└── functions.ts              # Function registrations (pipeline function exported here)

src/features/pipeline/
├── queries.ts                # DB state updates (appendCharacter, appendScene, etc.)
├── inngest.ts                # 6-step pipeline function definition
└── domain/                   # Pure functions per step
    ├── analyze-story.ts      # Step 1
    ├── moderate-content.ts   # Step 0
    ├── moderate-image.ts     # Steps 2 & 3
    ├── generate-character.ts # Step 2
    ├── generate-scene.ts     # Step 3
    ├── synthesize-voice.ts   # Step 4
    ├── align-subtitles.ts    # Step 5
    └── assemble-video.ts     # Step 6
```

### 7.2 Job Queue Configuration

| Setting | Value | Why |
|---|---|---|
| Concurrency | 5 concurrent pipeline functions | Prevents rate-limit exhaustion on AI APIs |
| Retry policy | Inngest default (3 retries with backoff) | Each step is idempotent |
| Function timeout | Vercel Hobby: 300s / Pro: 800s | Steps run sequentially; each step < timeout |
| Event name | `pipeline/start` | Triggered by `createProjectAction` via `inngest.send()` |
| Batch size | 1 (no batching) | Each project has its own pipeline run |

### 7.3 Flow / Pipeline Patterns

```
createProjectAction (Server Action)
  → db.insert(projects)
  → inngest.send({ name: 'pipeline/start', data: { projectId } })
      │
      ▼
  Inngest Function: pipeline/start
      │
      ├─ Step 0: Moderate story ──→ OpenAI Moderation API
      │   ↓ (if not flagged)
      ├─ Step 1: Analyze story ──→ GPT-4o JSON mode → characters + scenes
      │   ↓
      ├─ Step 2: Generate characters ──→ Replicate SDXL → R2 putObject
      │   └─ moderateImage(char) ──→ Replicate safety_concept
      │   ↓
      ├─ Step 3: Generate scenes ──→ Replicate SDXL + IP-Adapter → R2
      │   └─ moderateImage(scene) ──→ Replicate safety_concept
      │   ↓
      ├─ Step 4: Synthesize voiceover ──→ ElevenLabs TTS → R2 → appendVoiceover
      │   ↓
      ├─ Step 5: Align subtitles ──→ fetch audio → Whisper ASR → SRT → R2
      │   ↓
      ├─ Step 6: Assemble video ──→ fetch all assets → FFmpeg → R2 videos
      │   ↓
      └─ Final: Mark status='completed', progressPercent=100
```

Each step is **idempotent** (Inngest may retry). Steps update `project.status` + `progressDetail` and debit credits via Drizzle transaction.

**Error handling:** Failed steps set `project.status = 'failed'` with `errorMessage`. Inngest retries, but terminal failures (e.g., content moderation block) are not retried.

---

## 8. Testing Strategy

### 8.1 Test Distribution

| Category | Files | Tests | Framework |
|---|---|---|---|
| Marketing (UI) | 9 | 32 | Vitest + jsdom |
| Auth + Env + Rate Limit | 8 | 85 | Vitest + jsdom |
| Pipeline domain | 8 | 75 | Vitest + jsdom |
| Billing + Storage + Concurrency | 7 | 44 | Vitest + jsdom |
| Progress (SSE) + Health | 3 | 24 | Vitest + jsdom |
| Schema + Routes + Brand | 4 | 26 | Vitest + jsdom |
| Post-review hardening | 3 | 18 | Vitest + jsdom |
| Download + Share + API | 3 | 41 | Vitest + jsdom |
| Pipeline integration + Credits | 4 | 32 | Vitest + jsdom |
| **Unit Total** | **43** | **377** | |
| **E2E** | **9** | **48** | Playwright (Chromium) |
| **Grand Total** | **52** | **425** | |

### 8.2 Test Patterns

| Pattern | Description | Example |
|---|---|---|
| Source-reading tests | Read source via `readFileSync`, regex-match patterns | `stripe-webhook.test.ts` verifies `extractSubscriptionPeriodEnd` exists |
| Functional tests | Render component, assert DOM output | `hero-headline.test.tsx` verifies 3-line H1 |
| Domain pure-function tests | Call function directly, assert result | `moderate-image.ts` tests all output shapes |
| Mock SDK tests | Mock OpenAI/Replicate/ElevenLabs SDKs | `analyze-story.test.ts` mocks OpenAI client |
| SSE source guarantees | Read source, assert `maxDuration = 800` | `sse-progress.test.ts` regex on source |
| Webhook helper tests | Call helper directly with fixtures | `extractSubscriptionPeriodEnd()` 5-branch coverage |

### 8.3 Pre-PR / Pre-bash
pnpm lint              # Zero warnings (ESLint flat config)
pnpm typecheck         # Zero errors (tsc --noEmit, strict + noUncheckedIndexedAccess)
pnpm test              # 396 unit tests pass (48 files)
pnpm test:e2e          # 48 E2E tests pass (9 specs, requires Playwright browsers)
pnpm format:check      # All files pass Prettier
pnpm build            # Zero errors (hybrid: static + dynamic)
```

For production: verification of marketing page at 1440×900, Lighthouse ≥95 across all categories.

---

## 9. Build & Deployment

### 9.1 Production Build

```bash
pnpm build            # next build (Turbopack)
```

Output structure:
- HTML files in `.next/server/app/` (static + dynamic routes)
- Client JS/CSS in `.next/static/chunks/`
- RSC payloads in `.next/server/app/`

The build exercises the build-context env fallback (NEXT_PHASE=phase-production-build). No real secrets needed.

### 9.2 Environment Variables

| Var | Required | Description | Validation |
|---|---|---|---|
| `DATABASE_URL` | ✅ | Neon pooled connection | `.url().refine()` → postgres: scheme |
| `DATABASE_URL_UNPOOLED` | ✅ | Neon direct connection (for migrations) | `.url().refine()` → postgres: scheme |
| `AUTH_SECRET` | ✅ | ≥32 chars, not known-weak | `min(32)` + weak-list rejection |
| `AUTH_URL` | ✅ | Auth.js callback base URL | `.url()` |
| `OPENAI_API_KEY` | ✅ | `sk-` prefix (accepts `sk-proj-`, `sk-svcacct-`, etc.) | `startsWith('sk-')` |
| `REPLICATE_API_TOKEN` | ✅ | `r8_` prefix | `startsWith('r8_')` |
| `ELEVENLABS_API_KEY` | ✅ | — | `min(1)` |
| `REPLICATE_SDXL_MODEL` | — | Override default (format: `owner/model:sha`) | Regex format |
| `REPLICATE_SDXL_IPADAPTER_MODEL` | — | Override default (⚠️ placeholder = SDXL base) | Regex format |
| `IMAGE_MODERATION_FAIL_OPEN` | — | `'true'`/`'false'` (default: `'false'` in production, `'true'` in dev/test) | `z.enum(['true','false'])` |
| `STRIPE_SECRET_KEY` | ✅ | `sk_` prefix | `startsWith('sk_')` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | `whsec_` prefix | `startsWith('whsec_')` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | `pk_` prefix | `startsWith('pk_')` |
| `R2_ACCOUNT_ID` | ✅ | Cloudflare account ID | `min(1)` |
| `R2_ACCESS_KEY_ID` | ✅ | R2 access key | `min(1)` |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 secret key | `min(1)` |
| `R2_BUCKET_UPLOADS` | ✅ | Upload bucket name | `min(1)` |
| `R2_BUCKET_GENERATED` | ✅ | Generated assets bucket | `min(1)` |
| `R2_BUCKET_VIDEOS` | ✅ | Video assets bucket | `min(1)` |
| `INNGEST_EVENT_KEY` | ✅ | Inngest event signing key | `min(1)` |
| `INNGEST_SIGNING_KEY` | ✅ | Inngest signing key | `min(1)` |
| `FFMPEG_PATH` | — | FFmpeg binary path (default: `/usr/bin/ffmpeg`) | `z.string().optional()` |
| `RESEND_API_KEY` | ✅ | `re_` prefix | `startsWith('re_')` |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis URL | `.url()` |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token | `min(1)` |
_DSN` | ✅ | Sentry error tracking | `.url()` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public-facing URL | `.url()` |
| `GOOGLE_CLIENT_ID` | — | Google OAuth (both required to enable) | `optional()` |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth (both required to enable) | `optional()` |

Total: 30 env vars in Zod schema (27 required + 3 optional: `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` as a pair, and `IMAGE_MODERATION_FAIL_OPEN`).

### 9.3 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
on: [push(main), pull_request(main)]
jobs:
  quality-gate:
    steps:
      - checkout
      - pnpm/action-setup (v10.26.0)    # allowBuilds syntax floor
      - actions/setup-node (v20)
      - pnpm install --frozen-lockfile
      - pnpm lint                        # ESLint (exit on warning)
      - pnpm typecheck                   # tsc --noEmit (exit on error)
      - pnpm test                        # Vitest (exit on failure)
      - pnpm build                       # next build (exit on error)
        env:
          NEXT_PHASE: phase-production-build  # Activates env fallback
          NODE_ENV: production
```

Not yet in CI: E2E tests (Playwright), rate limiting integration, visual regression testing.

---

## 10. Developer Handbook

### 10.1 Local Setup

```bash
# 1. Prerequisites: Node.js ≥20, pnpm ≥10.26

# 2. Install dependencies
pnpm install                    # Activates husky via prepare script

# 3. Configure environment
cp .env.example .env.local      # Fill in real credentials (see §9.2)
# For local development without AI pipeline, only AUTH_SECRET, AUTH_URL,
# and DATABASE_URL are needed. The rest have dev fallbacks.

# 4. Database setup
pnpm drizzle:generate          # Generate migration SQL from schema diff (loads .env.local)
pnpm drizzle:migrate           # Apply migrations to Neon (loads .env.local)
# Optional: pnpm db:seed          # Seed development data

# 5. Download marketing assets (optional)
./scripts/download-assets.sh    # Workflow videos + posters from R2

# 6. Start dev server
pnpm dev                        # Turbopack, port 3000
# → http://localhost:3000
```

### 10.2 Common Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` | Production build (hybrid: static + dynamic) |
| `pnpm start` | Serve built output |
| `pnpm lint` | ESLint (flat config, zero warnings) |
| `pnpm typecheck` | tsc --noEmit (strict + noUncheckedIndexedAccess) |
| `pnpm test` | Vitest unit tests (396 tests, 48 files, jsdom) |
| `pnpm test:e2e` | Playwright E2E tests (48 tests, Chromium) |
| `pnpm format` | Prettier auto-fix |
| `pnpm format:check` | Prettier verify |
| `pnpm drizzle:generate` | Create migration SQL from schema diff (loads .env.local) |
| `pnpm drizzle:migrate` | Apply migrations to database (loads .env.local) |
| `pnpm drizzle:studio` | Open Drizzle Studio (schema browser, loads .env.local) |
| `pnpm db:seed` | Seed development data |
| `pnpm db:reset` | Migrate + seed in one command |

### 10.3 Code Style Rules

| Rule | Mechanism |
|---|---|
| Zero `any` | ESLint `@typescript-eslint/no-explicit-any: error` |
| Explicit type imports | ESLint `@typescript-eslint/consistent-type-imports: error` |
| Named function exports only | ESLint `import/no-default-ex (implied by conventions) |
| Interface for object shapes | Convention + code review |
| `verbatimModuleSyntax` | TypeScript config enforces `import type` for type-only imports |
| `noUncheckedIndexedAccess` | TypeScript config prevents array index without narrowing |

Prettier: single quotes, trailing commas, 100 char width, 2-space indent, `prettier-plugin-tailwindcss` for class sorting.

### 10.4 Git Workflow

- **Branching:** `main` is protected. All changes via PRs.
- **Commit conventions:** Conventional commits (implied by CI quality gate).
- **PR checklist:** Full quality gate must pass (lint + typecheck + test + build).
- **Pre-commit hook:** husky + lint-staged runs ESLint + Prettier on staged files only. Always run the full chain before pushing.

---

## 11. Known Issues & Outstanding Tasks

| Priority | Issue | Impact | Status |
|---|---|---|---|
| **CRITICAL** | No real external service credentials | App cannot run full pipeline | Open — requires provisioning |
| **CRITICAL** | Database migrations not applied to production | App cannot connect to DB | Open — requires Neon account. **⚠️ 4 new migrations (0001–0004) from remediation sprint. Migration 0001 requires pre-cleanup of duplicate video/voiceover rows.** |
| **HIGH** | Replicate IP-Adapter model hash is placeholder | Scene generation won't apply character consistency | Open — requires `REPLICATE_SDXL_IPADAPTER_MODEL` env var |
| **HIGH** | Character consistency not validated end-to-end | Highest-risk component (Risk R1) | Open — requires real API keys |
| **HIGH** | No Stripe products configured | Billing page is non-functional | Open — requires Stripe Dashboard |
| **MEDIUM** | No monitoring (Sentry/Analytics/Axiom) | Production issues undetected | Open — env vars in schema |
| **MEDIUM** | E2E tests not in CI | Regressions can slip through CI | Open — needs Postgres service container |
| **MEDIUM** | No cookie consent banner | GDPR/CCPA non-compliant | Open — Privacy/Terms pages exist |
| **MEDIUM** | `/pricing`, `/blog`, `/contact` not implemented | Dead links from nav/footer | Open |
| **MEDIUM** | PostCSS `<8.5.10` moderate vuln (GHSA-qx2v-qp2m-jg93) | Non-exploitable transitive | Monitored — resolved when Next.js updates |
| ~~**MEDIUM**~~ | ~~Brand color system bypassed 75+ times~~ | ~~Visual inconsistency~~ | ✅ Closed (T11/H2: `sed` sweep across 45 files → `primary`/`background`/`card` tokens; `brand-tokens.test.ts` now ENFORCES 0 violations) |
| **LOW** | Visual regression testing is manual | Pixel drift undetected | Open — Playwright screenshot comparison planned |
| **LOW** | SSE disconnects on Vercel Hobby (300s cap) | UX degradation on cheapest plan | Client reconnect handles gracefully |

**Recently closed (remediation sprint 3):**
- ~~No rate limiting~~ → **Fixed** (C3: `src/lib/rate-limit.ts` with Upstash Ratelimit, 3 instances)
- ~~Sign-up flow completely broken~~ → **Fixed** (C1: `signUpAction` in `src/features/auth/actions.ts`)
- ~~Credits debited before project insert~~ → **Fixed** (C4: insert-before-debit ordering)
- ~~No idempotency on Inngest retries~~ → **Fixed** (C5: `idempotencyKey` column + UNIQUE index + `ON CONFLICT DO NOTHING`)
- ~~Steps 2 & 3 never debited credits (60% revenue leak)~~ → **Fixed** (C6: all 6 steps debit, total 131 credits)
- ~~`FFMPEG_PATH` bypassed Zod env validation~~ → **Fixed** (H1: added to Zod schema)
- ~~Style chip enum mismatch~~ → **Fixed** (H3: added `medieval` + `japanese-animation` to enum + Zod + STYLE_PROMPTS)
- ~~R2 URL 1h expiry trap (stale tabs get 403)~~ → **Fixed** (H4: click-time API route; `SignedDownloadWrapper` DELETED)
- ~~Host Header Injection risk~~ → **Fixed** (H6: `proxy.ts` validates Host header against whitelist)
- ~~`IMAGE_MODERATION_FAIL_OPEN` insecure default~~ → **Fixed** (H8: defaults to `'false'` in production)
- ~~Health endpoint bare~~ → **Fixed** (H9: checks DB `SELECT 1` + FFmpeg `fs.accessSync`)
- ~~Row lock untested~~ → **Fixed** (H10: `.for('update')` test-verified via concurrency test)

**Recently closed (audit v1 remediation — T1–T12):**
- ~~Billing form POST to non-existent `/api/stripe/checkout` route (C-1)~~ → **Fixed** (T1: `billingCheckoutAction` Server Action in `billing/actions.ts`)
- ~~Protected routes return ERR_CONNECTION_REFUSED for unauthenticated users (C-2)~~ → **Code Fixed** (T2: proxy uses `env.NEXT_PUBLIC_APP_URL` not `nextUrl.origin`). ⚠️ **Live site still exhibits the symptom** — confirmed via `https://storyintovideo.jesspete.shop/dashboard` redirecting to `http://localhost:3000/sign-in`. Root cause: production `NEXT_PUBLIC_APP_URL` env var is set to `http://localhost:3000` (operational misconfiguration, NOT a code bug). The `/api/health` endpoint returns healthy DB+FFmpeg, proving the deployed code is current (H9 fix is sprint-3 era, post-T2).
- ~~Orphan project rows on insufficient credits (H-1)~~ → **Fixed** (T3: `db.transaction()` via `debitCreditsTx`)
- ~~Stripe webhook idempotency INSERT-before-handler (H-2)~~ → **Fixed** (T4: INSERT after side effects + pre-check SELECT)
- ~~SSE rate limit never released on disconnect (H-3)~~ → **Fixed** (T5: `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern)
- ~~Download route generic 500 (M-1)~~ → **Fixed** (T6: error classification 502/504/500)
- ~~`inngest.send()` failure orphaned projects (M-2)~~ → **Fixed** (T7: try/catch → `setProjectFailed()`)
- ~~`appendVideo` set `status='completed'` before MP4 existed (M-3)~~ → **Fixed** (T8: `status='rendering'` at insert)
- ~~`FAIL_OPEN` read at module load (M-4)~~ → **Fixed** (T9: `getFailOpen()` reads per-call)
- ~~Dead `buildFfmpegCommand` export (M-5)~~ → **Fixed** (T10: deleted)
- ~~Brand color system bypassed 122+ times across 28 files (M-6)~~ → **Fixed** (T11: `sed` sweep across 45 files; `brand-tokens.test.ts` enforces 0 violations)
- ~~`useProjectProgress` double-close + `Date.now()` temp file collisions + hardcoded `metadataBase` (L-2/L-3/L-4)~~ → **Fixed** (T12: `eventSource=null` guard, `crypto.randomUUID()`, `env.NEXT_PUBLIC_APP_URL`)

**Newly identified outstanding issues (post-audit-v1 validation, 2026-06-29):**
- **Privacy Policy publicly promises unimplemented GDPR endpoints** — `src/app/(legal)/privacy/page.tsx` §4 (Data Retention: "You may delete your account at any time, which triggers a CASCADE deletion…") and §6 (Your Rights: Erasure + Portability) promise features the code does not implement. No `DELETE /api/user` endpoint, no `GET /api/user/export` endpoint. This is a compliance P0 — the live legal page is making promises the code can't keep. Schema already has `onDelete: 'cascade'` on every FK from `users` so DB-level cascade is wired; only the API surface is missing.
- **Navbar + dashboard + hero use raw `<a href>` instead of `next/link`** — `src/components/sections/navbar.tsx` (lines 60, 100, 108, 145, 156, 163), `src/app/(app)/dashboard/page.tsx` (lines 64, 95), `src/components/sections/hero.tsx` (line 167). Direct violation of CLAUDE.md "never use `<a>` for internal routes" rule. Causes full-page reloads on every nav click, degrading Lighthouse + UX.
- **No custom `not-found.tsx` page** — Next.js default 404 inherits root layout metadata, making any unknown URL return 200 OK with the marketing page title. Bad for SEO, hides broken links. Confirmed on live site: `/pricing`, `/blog`, `/contact` all return 200 with `StoryIntoVideo - Turn Stories Into Videos with AI` title.
- **Env host-mismatch warning is insufficient** — `src/lib/env/index.ts:217-226` only emits `console.warn` when `AUTH_URL` and `NEXT_PUBLIC_APP_URL` hosts differ. In production behind a reverse proxy, this warning was missed — causing the live `/dashboard` redirect to `http://localhost:3000`. Should be a thrown error in production (fail-fast at boot), or at minimum surfaced via `/api/health`.
- **`/pricing`, `/blog`, `/contact` routes don't exist** — linked from `nav-links.ts` (lines 5-7) and `footer-links.ts` (line 33) but no route handlers exist. Next.js falls back to default 404 page (which inherits root layout metadata → confusing 200 OK with marketing title).

---

## 12. Key Files Reference

| File | Purpose | Critical? |
|---|---|---|
| `src/lib/env/index.ts` | Zod env validation + build-context fallback | ✅ Security |
| `src/features/auth/domain/verify-session.ts` | Auth DAL (throws NEXT_REDIRECT) | ✅ Security |
| `src/proxy.ts` | Edge route protection | ✅ Security |
| `src/lib/auth/config.ts` | Auth.js v5 config (trustHost:true) | ✅ Security |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook (signature-verified) | ✅ Security |
| `src/app/api/projects/[id]/download/route.ts` | Click-time R2 URL signing (H4) | ✅ Security |
| `src/features/projects/actions.ts` | createProjectAction (auth→Zod→Inngest) | ✅ Pipeline trigger |
| `src/features/pipeline/inngest.ts` | 6-step pipeline function | ✅ Pipeline |
| `src/features/pipeline/domain/moderate-image.ts` | Image moderation (ADR-011) | ✅ Pipeline |
| `src/features/billing/domain/extract-period-end.ts` | Stripe Basil API helper | ✅ Billing |
| `src/lib/storage/r2.ts` | R2 signed URLs + putObject + size guard | ✅ Storage |
| `src/lib/db/index.ts` | Drizzle client (Neon pooled, deferred) | ✅ Data |
| `src/app/layout.tsx` | Root layout (fonts, metadata, Providers) | ✅ Core |
| `src/app/page.tsx` | Marketing page (10 sections) | ✅ Marketing |
| `src/components/sections/hero.tsx` | Hero (4-layer, glass input, SSE-driven) | ✅ Marketing |
| `package.json` | Tech stack (pinned versions) | ✅ Reference |
| `tsconfig.json` | Strict TypeScript config | ✅ Reference |
| `next.config.ts` | Next.js config (security headers, images) | ✅ Reference |
| `.github/workflows/ci.yml` | CI quality gate (lint+typecheck+test+build) | ✅ CI/CD |
| `src/app/api/projects/[id]/progress/route.ts` | SSE progress stream (maxDuration=800, rate-limited) | ✅ Performance |
| `src/lib/rate-limit.ts` | Upstash Ratelimit (C3: auth/pipeline/SSE) | ✅ Security |
| `src/features/auth/actions.ts` | signUpAction (C1: user creation + auto sign-in) | ✅ Auth |
| `src/app/api/health/route.ts` | Health check (DB + FFmpeg, 503 on failure — H9) | ✅ Reliability |

---

## 13. Glossary

| Term | Definition |
|---|---|
| **ADR** | Architecture Decision Record — a documented technical choice with context, decision, rationale, and consequences |
| **ADR-011** | Mandates content moderation on every AI-generated image |
| **Basil API** | Stripe API version 2025-03-31; moved `current_period_end` to `items.data[0]` |
| **CREDIT_COSTS** | Map of pipeline steps to credit costs (analysis=5, char=10, scene=8, etc.) |
| **DAL** | Data Access Layer — `verifySession()` and `queries.ts` files |
| **Drizzle** | ORM chosen for SQL-first approach and Turbopack compatibility |
| **Golden Rule** | Lower layers never import from higher layers (§3.1) |
| **Inngest** | Serverless job queue for the 6-step AI pipeline |
| **IP-Adapter** | Replicate model for character-consistent scene generation |
| **MAX_PUT_OBJECT_BYTES** | 500 MB size guard on R2 `putObject` (T7) |
| **moderationSkipped** | Observable flag when image moderation couldn't run (T5) |
| **PIPELINE_EVENT** | Inngest event name: `'pipeline/start'` |
| **PPR** | Partial Prerendering (Next.js 16 feature) |
| **R2** | Cloudflare R2 (S3-compatible storage, zero egress) |
| **RSC** | React Server Components |
| **SSE** | Server-Sent Events (live progress streaming) |
| **T0–T8** | Remediation sprint issue identifiers (T0=pnpm workspace, T1=SignedDownloadWrapper, etc.) |
| **Turbopack** | Next.js 16 Rust-based bundler (replaces Webpack) |
| **trustHost** | Auth.js v5 config for reverse-proxy Host header fallback (T2) |

---

**End of Master PAD v1.2**
