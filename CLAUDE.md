---
IMPORTANT: File is read fresh for every conversation. Be brief and practical.
---

# StoryIntoVideo — Production SaaS

AI-powered story-into-video generator with a luxury-dark, cinematic marketing front end and a full production backend (auth, database, AI pipeline, billing). Originally a pixel-accurate static clone of [storyintovideo.com](https://storyintovideo.com/); now a hybrid Next.js app with real functionality.

**Maintainer:** Frontend Architect & Avant-Garde UI Designer
**Canonical Specs:**
- `Project_Requirements_Document.md` (v2.0, 2718 lines, field-verified from live DOM — marketing layer)
- `PRODUCTION_READINESS_PLAN.md` (engineering blueprint — backend/app layer, 11 ADRs, 27 TDD task cards)

## Tech Stack (Locked)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, hybrid) | ^16.2.0 |
| UI | React (strict TypeScript) | ^19.2.3 ⚠️ CVE-2025-55182 floor — never downgrade below 19.2.3 |
| Styling | Tailwind CSS (CSS-first `@theme`) | ^4.3.0 |
| Components | shadcn/ui (Radix primitives, hand-written) | — |
| Fonts | Geist Sans + Geist Mono + Outfit 820 | self-hosted |
| Icons | Lucide React | ^0.460.0 |
| Auth | Auth.js v5 (NextAuth) + `@auth/drizzle-adapter` | 5.0.0-beta.31 |
| Database | PostgreSQL (Neon) + Drizzle ORM | drizzle ^0.45 |
| Job Queue | Inngest (multi-step AI pipeline) | ^4.11.0 |
| AI — LLM | OpenAI GPT-4o + Whisper + Moderation | openai ^6.45 |
| AI — Image | Replicate SDXL + IP-Adapter | replicate ^1.4.0 |
| AI — TTS | ElevenLabs | ^1.59.0 |
| Storage | Cloudflare R2 (S3-compatible, zero egress) | @aws-sdk/client-s3 |
| Billing | Stripe (Checkout + Portal + Webhooks) | ^22.3.0 |
| Validation | Zod (env + all Server Action inputs) | ^4.4.3 |
| Video | FFmpeg (fluent-ffmpeg + system binary) | `FFMPEG_PATH` env var (default `/usr/bin/ffmpeg`) |
| CI/CD | GitHub Actions | `.github/workflows/ci.yml` — `quality-gate` job (lint + typecheck + test + build) + `e2e` job (Playwright with Postgres 17 service container, `continue-on-error: true` initially) |
| Package Manager | pnpm | >=10.26.0 (`allowBuilds` syntax floor) |
| Node | — | >=20.0.0 |

## Foundational Principles

### Meticulous Approach (Six-Phase Workflow)

Follow this workflow for all implementation tasks:

1. **ANALYZE** — Deep requirement mining. Never assume. Check existing patterns before writing new code.
2. **PLAN** — Structured roadmap. Present plan for confirmation before coding.
3. **VALIDATE** — Get explicit approval before implementation.
4. **IMPLEMENT** — Modular, tested components. Test each before integration.
5. **VERIFY** — Run full quality gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
6. **DELIVER** — Confirm all checks pass. Document deviations.

### Project-Specific Principles

- **5-layer architecture** (Golden Rule) — middleware → app → features → domain → lib. Lower layers never import from higher layers.
- **Auth-first Server Actions** — every Server Action starts with `verifySession()` before any other logic.
- **`queries.ts` boundary** — all DB access goes through feature-level `queries.ts` files. No raw Drizzle calls in components.
- **Domain isolation** — pure business logic in `src/features/*/domain/` (no Next.js or DB runtime imports, `import type` only).
- **Zod env validation** — never read `process.env.*` directly. Import `env` from `@/lib/env`.
- **Clone fidelity preserved** — the marketing page's colors, pixels, and keyframes remain field-verified from the live site.
- **CSS-only animations** — no Framer Motion, no GSAP. All 13 keyframes are `@keyframes` in `globals.css`.
- **Anti-generic design** — reject template aesthetics. This is a luxury-dark cinematic experience.
- **Amber is rationed** — `#febf00` is the only hue permitted to assert itself. The singular yellow→purple gradient on example-card hover is the ONLY purple on the entire site.

## Implementation Standards

### TypeScript Strict Mode

`tsconfig.json` enables maximum strictness:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "verbatimModuleSyntax": true
}
```

- **Never use `any`** — use `unknown` instead. ESLint enforces `@typescript-eslint/no-explicit-any: error`
- **`interface` for object shapes**, `type` for unions/intersections
- **Explicit `type` imports** — ESLint enforces `@typescript-eslint/consistent-type-imports: error`
- **Early returns** over deeply nested conditionals
- **Composition over inheritance**

### Next.js 16 Specific

- **App Router** — all code in `src/app/`
- **Hybrid rendering** (was `force-static`, now removed) — marketing page is still statically prerendered; app routes (`/dashboard`, `/create`, `/projects/[id]`, `/billing`) are dynamic; API routes (`/api/auth`, `/api/inngest`, `/api/stripe/webhook`) are `force-dynamic`
- **Server Components by default** — add `'use client'` only when using `useState`, `useEffect`, event handlers, or browser APIs
- **`next/font` for fonts** — Geist Sans/Mono from `geist` package, Outfit via `next/font/local` (self-hosted woff2)
- **`next/link` for all internal navigation** — never use `<a>` for internal routes
- **Security headers** configured in `next.config.ts` (X-Frame-Options DENY, nosniff, strict referrer)
- **`next lint` is deprecated** — use `eslint .` directly (ESLint 9 flat config)
- **Async `params` / `searchParams` / `cookies()`** — in Next.js 16 all three are `Promise<T>`. Always `await` them.
- **Suspense required for dynamic data** — wrap async Server Components in `<Suspense>` per `cacheComponents` requirement.

### React 19 Patterns

- **Named function exports** — `export function ComponentName()`, never default exports for components
- **`'use client'` directive** — only on files that need it (Navbar, Hero, Examples, Faq, Workflow, ScrollReveal, AuthForm, CreateWizard, Providers)
- **`interface` for all props** — defined in `src/types/index.ts` or co-located
- **`cn()` utility** for conditional class merging (`clsx` + `tailwind-merge`)
- **`suppressHydrationWarning`** on `<html>` and `<body>` in `layout.tsx` (Grammarly extension compatibility)
- **Handle all UI states** — loading, error, empty, success (where applicable)

### Tailwind CSS v4 (CSS-First)

- **No `tailwind.config.ts`** — all tokens in `src/app/globals.css` inside `@theme { ... }`
- **Custom `@utility` classes** — `scrollbar-hide`, `marquee-mask`, `marquee-track`, `glass-input`, `eyebrow`, `section-heading`, `cta-amber`
- **`@source` directives** for content scanning:
  ```css
  @source '../components/**/*.{ts,tsx}';
  @source '../lib/**/*.{ts,tsx}';
  ```
- **Kebab-case keyframes** — all 13 `@keyframes` use kebab-case (not camelCase)
- **Hex color tokens** — PRD's hex values preserved verbatim (no OKLCH conversion)

### Color System (Non-Negotiable)

```
Background:    #020202  (near-black, warm-neutral — NOT pure #000)
Primary/Amber: #febf00  (CTAs, active states, focus rings, accents)
Surface:       #060607  (cards)
Muted text:    #8e8e95  (zinc-400 equivalent)
Body text:     #d4d4d8  (zinc-300)
```

⚠️ **Critical:** `#febf00` ≠ Tailwind's `amber-400` (`#fbbf24`). Use the custom `--color-primary` token.

### Typography

| Element | Font | Weight | Key Class |
|---|---|---|---|
| H1 (hero) | Outfit | **820** | `font-heading text-[4.5rem] tracking-[-0.04em]` |
| H2 (sections) | Outfit | 700 | `font-heading text-4xl lg:text-6xl tracking-[-0.03em]` |
| Body | Geist Sans | 400 | `font-sans text-lg` |
| Ratio toggles | Geist Mono | 400 | `font-mono text-[10px]` |

Outfit weight 820 is self-hosted via `next/font/local` (Google Fonts API only serves discrete weights).

### Animation (CSS-Only, 13 Keyframes)

All in `src/app/globals.css`. No JS animation libraries.

```
fade-in-up, float, glow-pulse, border-glow, composite-pulse-text,
shimmer, btn-shimmer, grid-shimmer, grid-sweep-h, grid-sweep-v,
scanline-scroll, lang-dropdown-in, marquee-scroll
```

Scroll reveal: `IntersectionObserver` via `useReveal` hook → `data-revealed` attribute → CSS transition.

## The 5-Layer Architecture (Golden Rule)

```
Layer 0: src/proxy.ts             — Cookie check, redirect. NO DB. NO logic. Edge runtime. (Renamed from `middleware.ts` in Next.js 16 migration.)
Layer 1: src/app/                 — Route structure, metadata, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (auth, projects, pipeline, billing)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers. Side effects only.
```

**Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code.

## Development Workflow

### Environment Setup

```bash
pnpm install                    # Install dependencies
cp .env.example .env.local      # Copy env template, fill in real values
./scripts/download-assets.sh    # Download workflow videos + posters from R2
./scripts/generate-thumbnails.sh # Generate example thumbnails (optional)
pnpm drizzle-kit generate       # Create migration SQL from schema
pnpm drizzle-kit migrate        # Apply migrations to Neon (needs DATABASE_URL_UNPOOLED)
pnpm dev                        # Start dev server (Turbopack, port 3000)
```

### Build & Quality Commands

| Command | Purpose | Required |
|---|---|---|
| `pnpm dev` | Development server (Turbopack) | — |
| `pnpm build` | Production build (hybrid: static + dynamic) | Before deploy |
| `pnpm lint` | ESLint (flat config, zero warnings) | Before commit |
| `pnpm typecheck` | `tsc --noEmit` (zero errors) | Before commit |
| `pnpm test` | Vitest unit tests (479 tests, jsdom) | Before commit |
| `pnpm test:e2e` | Playwright E2E tests (48 tests, Chromium) | Before deploy |
| `pnpm format` | Prettier auto-fix | — |
| `pnpm format:check` | Prettier verify | CI |
| `pnpm drizzle-kit generate` | Create migration SQL from schema diff | After schema changes |
| `pnpm drizzle-kit migrate` | Apply migrations to database | After generate |
| `pnpm drizzle-kit studio` | Open Drizzle Studio (schema browser) | Debugging |

### Pre-Commit Verification Chain

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All four must pass with zero warnings/errors before any commit. **husky + lint-staged** automatically run ESLint + Prettier on staged `.ts/.tsx` files via the `.husky/pre-commit` hook. Run the full chain manually before pushing — lint-staged only checks staged files, not the whole codebase.

## Testing Strategy

### Test Pyramid

| Type | Framework | Location | Count |
|---|---|---|---|
| Unit | Vitest + jsdom | `src/tests/unit/**/*.test.{ts,tsx}` | 479 (53 files) |
| E2E | Playwright (Chromium) | `src/tests/e2e/**/*.spec.ts` | 48 (9 files) |

### Unit Test Coverage (53 files, 479 tests)

**Marketing layer (inherited from clone):**
- `cn.test.ts` (8), `use-scrolled.test.ts` (7), `use-reveal.test.tsx` (7), `use-reduced-motion.test.ts` (4)
- `hero-chip-populate.test.tsx` (5), `hero-ratio-toggle.test.tsx` (3), `hero-character-counter.test.tsx` (4)
- `layout-hydration.test.tsx` (5), `metadata.test.ts` (2)

**Production app layer (Sprints 1-4):**
- `routing.test.ts` (2) — `force-static` removal verified
- `env.test.ts` (29) — Zod env validation (fail-fast, weak-secret rejection, build-context fallback, AUTH_URL host-mismatch warning, OPENAI_API_KEY prefix variants, REPLICATE_SDXL_*_MODEL format validation, DATABASE_URL `.url().refine()` composition, IMAGE_MODERATION_FAIL_OPEN enum validation)
- `schema.test.ts` (10) — Drizzle schema structural validation (all 11 tables + columns)
- `auth-config.test.ts` (10) — Auth.js v5 config (providers, adapter, JWT, AUTH_SECRET from env, `trustHost: true`)
- `verify-session.test.ts` (4) — `verifySession()` DAL (returns session or throws NEXT_REDIRECT)
- `middleware.test.ts` (5) — route protection, Edge-runtime constraint (no DB)
- `auth-pages.test.ts` (9) — sign-in/sign-up pages + AuthForm component
- `dashboard.test.ts` (8) — dashboard shell, Suspense, EmptyState, queries.ts boundary
- `cta-routes.test.ts` (11) — all 14 marketing CTAs wired to real routes
- `create-wizard.test.ts` (9) — create page, textarea, style selector, ratio toggle, submit
- `create-project-action.test.ts` (8) — Server Action (auth-first, Zod, moderation, credits, DB insert, **Inngest trigger**)
- `analyze-story.test.ts` (7) — GPT-4o story analysis + Moderation API (mocked OpenAI)
- `credit-metering.test.ts` (8) — tier limits, credit costs, `debitCredits` transaction
- `pipeline-sprint3.test.ts` (10) — R2 storage, Replicate character/scene generation, IP-Adapter
- `sprint4.test.ts` (12) — ElevenLabs TTS, Whisper ASR, Stripe config + webhook + billing page

**Remediation sprint (pipeline wiring + UX + compliance):**
- `r2-putobject.test.ts` (6) — R2 `putObject` helper (Buffer → S3 via `PutObjectCommand`) + `MAX_PUT_OBJECT_BYTES` size guard + `PayloadTooLargeError`
- `pipeline-queries.test.ts` (6) — `appendVoiceover`, `getProjectVoiceover`, `appendVideo`, `updateVideoSubtitle`, `updateProjectProgress`
- `assemble-video.test.ts` (11) — FFmpeg rewrite: SRT temp file, inputOptions per image, output Buffer readback, cleanup, temp file lifecycle, source-level guarantees (no placeholder, no `.find(includes('concat'))`
- `pipeline-sprint5.test.ts` (8) — Steps 4-6 wiring: voiceover synthesis, subtitle alignment, video assembly, credit debits, final completion step
- `sse-progress.test.ts` (15) — SSE route source-level guarantees + `useProjectProgress` hook functional behavior with mocked `EventSource` + reconnect with exponential backoff (T6)
- `project-download.test.tsx` (15) — `getProject` LEFT JOIN videos, `ProjectDownloadButton` with server-side `downloadUrl` prop (no `r2.ts` import in client), `SignedDownloadWrapper` extracted to its own file (T1), `ProjectShareButton` clipboard fallback, source-level guarantee
- `moderate-image.test.ts` (8) — `moderateImage` parses Replicate `safety_concept` / `api_safety_concept`, `moderationSkipped` field, env-configurable fail-open policy via `IMAGE_MODERATION_FAIL_OPEN` (T5)
- `legal-pages.test.ts` (10) — `/privacy` + `/terms` source-level guarantees (server components, required sections, AI-specific clauses)

**Post-review hardening (design_critique.md remediation):**
- `stripe-webhook.test.ts` (8) — `extractSubscriptionPeriodEnd()` pure helper: Basil API `items.data[0].current_period_end` shape, pre-Basil top-level fallback, missing/null handling
- `style-chips.test.ts` (5) — 8-chip spec fidelity: exact labels, uniqueness, regression guards against drifted labels ("Comic", "Futuristic neon")
- `hero-headline.test.tsx` (5) — 3-line cinematic H1 stack (2 `<br>` tags), Outfit weight 820 inline style, subtitle copy emphasizes OUTPUT ("finished video") over PROCESS ("subtitles, all generated")

### E2E Tests

- **Config:** `playwright.config.ts` (Chromium only, auto-starts `pnpm dev`)
- **Base URL:** `http://localhost:3000`
- **Coverage:** Hero CTA links (now `/create` + `/sign-up`), mobile nav Sheet, FAQ accordion behavior

### Testing Conventions

- Test files co-located in `src/tests/` (not alongside components)
- Mock `@/lib/fonts` in layout tests (jsdom can't resolve `next/font/local`)
- Mock `@/lib/db` in tests that transitively import Drizzle (jsdom can't reach Postgres)
- Mock `next-auth`, `next/navigation` for auth unit tests (avoid loading `next/server` in jsdom)
- Mock AI provider SDKs (OpenAI, Replicate, ElevenLabs) — never make real API calls in tests
- Mock `fetch` globally for tests that exercise the Inngest pipeline (Steps 5 & 6 download audio/SRT from R2 via `fetch()`)
- **`vi.hoisted()` for shared mock state** — when a mock factory needs to reference a `vi.fn()` defined in the test body, wrap it: `const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }))`. `vi.mock()` factories are hoisted above imports; without `vi.hoisted`, the variable is `undefined` at factory execution time.
- **Mock constructors require `class` syntax** — `vi.fn().mockImplementation(() => ({ ... }))` cannot be `new`-ed. Use `class MockS3Client { send = sendMock; }` for SDK client mocks. Arrow functions throw `"X is not a constructor"`.
- **`.tsx` extension required for JSX in tests** — files with `render(<Component />)` must be named `*.test.tsx`, not `*.test.ts`, or oxc throws a parse error.
- Source-reading tests: some tests read the source file (e.g., `readFileSync`) to verify structural patterns that can't be asserted via rendering (auth config, middleware, route handlers, legal page content). Strip comments before regex-matching to avoid false positives on docblock text.
- E2E tests use `page.getByRole()` and `page.getByText()` for selectors

## Code Quality Standards

### ESLint (Flat Config, ESLint 9+)

- **Config:** `eslint.config.mjs` (direct plugin imports, no FlatCompat)
- **`next lint` is deprecated** — run `eslint .` directly
- **Zero warnings** before commit

Key rules:
| Rule | Value |
|---|---|
| `@typescript-eslint/no-explicit-any` | `error` |
| `@typescript-eslint/consistent-type-imports` | `error` |
| `react-hooks/exhaustive-deps` | `warn` |

### Prettier

- **Config:** `.prettierrc.json`
- **Plugin:** `prettier-plugin-tailwindcss` (automatic class sorting)
- **Settings:** single quotes, trailing commas, 100 char width, 2-space indent

## File Organization

```
src/
├── app/                          # Layer 1: App Router
│   ├── (auth)/                   # Route group: auth pages
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (app)/                    # Route group: authenticated app (middleware-protected)
│   │   ├── dashboard/page.tsx
│   │   ├── create/page.tsx
│   │   ├── projects/[id]/page.tsx       # Server Component + ProjectProgressPanel (client)
│   │   └── billing/page.tsx
│   ├── (legal)/                  # Route group: legal + content pages (Server Components)
│   │   ├── privacy/page.tsx             # Privacy Policy (mandatory for launch)
│   │   ├── terms/page.tsx               # Terms of Service (mandatory for launch)
│   │   ├── pricing/page.tsx             # Sprint 3 T6: 4-tier plan table (reuses TIER_LIMITS)
│   │   ├── blog/page.tsx                # Sprint 3 T6: Blog index placeholder + newsletter CTA
│   │   └── contact/page.tsx             # Sprint 3 T6: Support email + 5-business-day SLA
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # Auth.js catch-all (force-dynamic)
│   │   ├── inngest/route.ts              # Inngest webhook (force-dynamic)
│   │   ├── stripe/webhook/route.ts       # Stripe webhook (force-dynamic)
│   │   ├── projects/[id]/progress/route.ts  # SSE progress stream (force-dynamic)
│   │   ├── projects/[id]/download/route.ts  # Click-time R2 URL signing (force-dynamic)
│   │   ├── user/route.ts                 # Sprint 3 T4: GDPR account deletion (DELETE, force-dynamic)
│   │   ├── user/export/route.ts          # Sprint 3 T3: GDPR data export (GET, force-dynamic)
│   │   └── health/route.ts               # Health check (force-dynamic) — Sprint 3 T2: config + configErrors
│   ├── layout.tsx                # Root: fonts, metadata, Providers, skip-to-content, CookieBanner (Sprint 3 T8)
│   ├── not-found.tsx             # Sprint 3 T7: Custom 404 (Server Component, on-brand UX, proper metadata)
│   ├── page.tsx                  # Marketing page (composes 10 sections)
│   ├── globals.css               # @theme + 13 keyframes + @utility + scroll reveal + a11y
│   └── icon.tsx                  # Dynamic favicon
├── components/
│   ├── primitives/               # Shared marketing presentational (7 files)
│   ├── sections/                 # Marketing page sections (10 files)
│   ├── ui/                       # Hand-written shadcn primitives (4 files)
│   └── app/                      # App-specific components (8 files — Sprint 3 T8 added cookie-banner.tsx)
│       ├── auth-form.tsx                # 'use client' — Google OAuth + email/password
│       ├── cookie-banner.tsx            # 'use client' — Sprint 3 T8: GDPR cookie banner (useSyncExternalStore, SSR-safe; dismissible, NOT a consent gate)
│       ├── create-wizard.tsx            # 'use client' — story input + style + ratio + counter
│       ├── empty-state.tsx              # Reusable empty-state primitive
│       ├── providers.tsx                # 'use client' — SessionProvider wrapper
│       ├── project-progress-panel.tsx   # 'use client' — SSE subscriber + progress bar
│       ├── project-download-button.tsx  # 'use client' — H4 fix: fetches /api/projects/[id]/download at click time (NO r2.ts import, NO downloadUrl prop)
│       └── project-share-button.tsx     # 'use client' — Web Share API + clipboard fallback
├── features/                     # Layer 2 + 3: Feature modules with domain isolation
│   ├── auth/{actions,queries,domain/verify-session}.ts  # signUpAction (C1 fix) + queries.ts (Sprint 3 T3 getUserExportData, T4 deleteUserAccount) + DAL verifySession
│   ├── projects/
│   │   ├── queries.ts            # getUserProjects, getProject (owner-checked, LEFT JOIN videos)
│   │   └── actions.ts            # 'use server' — createProjectAction (triggers Inngest)
│   ├── pipeline/
│   │   ├── queries.ts            # appendCharacter/Scene/Voiceover/Video + getProject* + updateProgress
│   │   ├── inngest.ts            # 6-step pipeline function (full wiring: Steps 0-6)
│   │   └── domain/               # Pure functions (no Next.js, no DB runtime)
│   │       ├── analyze-story.ts          # GPT-4o JSON mode → characters + scenes
│   │       ├── moderate-content.ts       # OpenAI Moderation API on story (mandatory)
│   │       ├── moderate-image.ts         # Replicate safety_concept parser (ADR-011)
│   │       ├── generate-character.ts     # Replicate SDXL (returns raw output for moderation)
│   │       ├── generate-scene.ts         # Replicate SDXL + IP-Adapter (returns raw output)
│   │       ├── synthesize-voice.ts       # ElevenLabs TTS (chunked)
│   │       ├── align-subtitles.ts        # Whisper ASR → SRT
│   │       └── assemble-video.ts         # FFmpeg compositor (SRT temp file + Buffer readback)
│   └── billing/
│       ├── queries.ts            # getOrCreateSubscription, debitCredits, debitCreditsTx (transactional — T3)
│       ├── actions.ts            # 'use server' — checkoutAction, portalAction, billingCheckoutAction (T1)
│       └── domain/
│           ├── tier-limits.ts         # TIER_LIMITS + CREDIT_COSTS
│           └── extract-period-end.ts  # Stripe Basil API period-end extraction
├── lib/                          # Layer 4: Infrastructure
│   ├── db/
│   │   ├── index.ts              # Drizzle client (Neon pooled connection)
│   │   ├── schema/               # auth.ts, projects.ts, media.ts, billing.ts + index.ts
│   │   └── (migrations in /drizzle)
│   ├── env/index.ts              # Zod-validated env (CRITICAL: never use process.env.* directly). **Sprint 3 T1: AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch THROWS in production runtime (warns in dev/test; build context never reaches the check — placeholders match)**
│   ├── auth/
│   │   ├── config.ts             # Auth.js v5 config (Google + Credentials, Drizzle adapter)
│   │   └── index.ts              # Re-exports auth, handlers, signIn, signOut
│   ├── ai/
│   │   ├── openai.ts             # GPT-4o, Whisper, Moderation client
│   │   ├── replicate.ts          # SDXL + IP-Adapter client
│   │   └── elevenlabs.ts         # TTS client + DEFAULT_VOICE_ID
│   ├── inngest/
│   │   ├── client.ts             # Inngest client + PIPELINE_EVENT constant
│   │   └── functions.ts          # Function registrations
│   ├── storage/r2.ts             # S3-compatible R2 client + signed URLs + putObject(Buffer) + deleteUserMedia (Sprint 3 T4: bulk DeleteObjectsCommand, best-effort, 1000-key batches)
│   ├── rate-limit.ts             # Upstash Ratelimit clients (C3: auth, pipeline, SSE)
│   ├── stripe/client.ts          # Stripe SDK + PRICE_IDS
│   ├── data/                     # Static marketing data constants (10 files)
│   ├── hooks/                    # Custom React hooks (4 files: use-scrolled, use-reveal, use-reduced-motion, use-project-progress)
│   ├── fonts.ts                  # Font configuration
│   └── utils.ts                  # cn() utility
├── tests/
│   ├── unit/                     # Vitest unit tests (53 files, 479 tests)
│   ├── e2e/                      # Playwright E2E tests (9 files, 48 tests)
│   └── setup.ts                  # Test setup (jest-dom + test env vars)
├── types/
│   └── index.ts                  # TypeScript interfaces (12 marketing interfaces)
└── proxy.ts                      # Layer 0: Auth route protection (Edge runtime)

.husky/
└── pre-commit                    # Runs `pnpm lint-staged` on staged files
```

### Routes (22 total)

| Route | Type | Purpose |
|---|---|---|
| `/` | ○ Static | Marketing page (10 sections, unchanged from clone) |
| `/sign-in`, `/sign-up` | ○ Static | Auth pages (AuthForm with Google + email/password) |
| `/dashboard` | ƒ Dynamic | Project list (auth-protected, Suspense + empty state) |
| `/create` | ○ Static | Project creation wizard (auth-protected) |
| `/projects/[id]` | ƒ Dynamic | Project detail + pipeline status (owner-checked) |
| `/billing` | ○ Static | 4-tier plan table + upgrade CTAs (**T1: wired to `billingCheckoutAction` Server Action**) |
| `/pricing` | ○ Static | **Sprint 3 T6: Pricing page** — 4-tier plan table (Server Component, reuses `TIER_LIMITS` from billing domain) |
| `/blog` | ○ Static | **Sprint 3 T6: Blog index placeholder** — metadata-bearing Server Component, newsletter CTA (mailto:) |
| `/contact` | ○ Static | **Sprint 3 T6: Contact page** — support email + 5-business-day SLA (Server Component) |
| `/privacy` | ○ Static | Privacy Policy (mandatory for launch) |
| `/terms` | ○ Static | Terms of Service (mandatory for launch) |
| `/api/auth/[...nextauth]` | ƒ Dynamic | Auth.js catch-all (Google OAuth, credentials) |
| `/api/inngest` | ƒ Dynamic | Inngest webhook (6-step pipeline) |
| `/api/stripe/webhook` | ƒ Dynamic | Stripe webhook (signature-verified, idempotent) |
| `/api/projects/[id]/progress` | ƒ Dynamic | SSE progress stream (auth + owner-checked, 2s polling, **T5: `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern**) |
| `/api/projects/[id]/download` | ƒ Dynamic | **H4 fix: Click-time R2 URL signing** (fresh signed URL per request; **T6: classifies R2 errors 502/504/500**) |
| `/api/user/export` | ƒ Dynamic | **Sprint 3 T3: GDPR data export** (GET — auth-first via `auth()`, returns JSON: profile + subscription + projects + nested media + usage events; `passwordHash` excluded) |
| `/api/user` | ƒ Dynamic | **Sprint 3 T4: GDPR account deletion** (DELETE — auth-first, collects R2 keys BEFORE DB CASCADE, then best-effort `deleteUserMedia` via `DeleteObjectsCommand`) |
| `/api/health` | ƒ Dynamic | **H9 fix: Health check** (DB `SELECT 1` + FFmpeg `accessSync`, returns 503 if DB/FFmpeg unhealthy). **Sprint 3 T2: now also returns `config` ({healthy, authUrl, appUrl}) + `configErrors` array — `config.healthy=false` does NOT trigger 503 (config is observability, not liveness)** |
| `/_not-found` | ○ Static | **Sprint 3 T7: Custom 404** (Server Component, on-brand UX, proper metadata — prevents default 404 from inheriting marketing title) |
| Proxy | ƒ Proxy | Protects `/dashboard`, `/create`, `/settings`, `/billing`, **`/projects`** + **H6: Host header validation** |

### Database Schema (11 tables + 8 enums)

**Auth (Auth.js v5 shape):** `users` (with `passwordHash` for credentials), `accounts`, `sessions`, `verificationTokens`

**Projects:** `projects` (with `status` enum: draft→pending→analyzing→generating_characters→generating_scenes→synthesizing_voice→aligning_subtitles→assembling_video→completed/failed), `characters` (with `referenceImageKey`), `scenes` (with `generatedImageKey`, `order`, `duration`)

**Media:** `videos` (with `videoKey`, `subtitleKey`, `resolution` enum), `voiceovers` (with `audioKey`, `transcript`)

**Billing:** `subscriptions` (with `stripeCustomerId`, `plan` enum, `creditsRemaining`), `usageEvents` (with `type` enum, `cost`, `metadata` for idempotency)

**Enums:** `project_status`, `visual_style`, `aspect_ratio`, `video_status`, `video_resolution`, `plan`, `subscription_status`, `usage_event_type` (8 total)

### Marketing Section Order (Fixed, Top → Bottom)

1. Navbar (`'use client'` — scroll-aware + mobile Sheet)
2. Hero (`'use client'` — video bg + glass input + style marquee)
3. Examples (`'use client'` — carousel with arrow handlers)
4. Workflow (`'use client'` — video loading state + 4 alternating media/text rows + looping MP4)
5. Features (server — 4×2 grid, hover accent bar)
6. Testimonials (server — 3×2 grid, initials avatars)
7. Use Cases (server — 2×2 grid, corner glow on hover)
8. FAQ (`'use client'` — Radix Accordion)
9. Final CTA (server — dot-grid bg, amber CTA pill)
10. Footer (server — 3 link columns + copyright)

## Project-Specific Standards

### Component Contracts

- All components use `interface` (not `type` for object shapes)
- Zero `any` — ESLint enforces this
- `'use client'` only when state/browser APIs are needed
- `next/image` for all raster images
- `next/font` for all fonts (no CDN links)

### shadcn/ui Primitives

Four hand-written components in `src/components/ui/`:
- `button.tsx` — `class-variance-authority` variants, `@radix-ui/react-slot`
- `accordion.tsx` — Radix Accordion with grid-template-rows animation
- `sheet.tsx` — Radix Dialog for mobile nav drawer
- `dropdown-menu.tsx` — Radix DropdownMenu for language switcher

These are NOT from the `shadcn` CLI (it timed out). They follow canonical new-york style.

### Auth.js v5 Patterns (CRITICAL)

- **`verifySession()`** — DAL function in `src/features/auth/domain/verify-session.ts`. Returns session or throws `NEXT_REDIRECT` (via `redirect('/sign-in')`). **Never wrap in try/catch** — it catches the redirect and silently swallows it. Accepts optional `{ redirectTo?: string }` to customize the callback URL.
- **`signUpAction()`** — C1 fix: Server Action in `src/features/auth/actions.ts`. Creates a new user account (bcrypt cost 12, user insert, free-tier subscription). Returns `{ success: true, userId }` or `{ success: false, code: 'VALIDATION'|'EMAIL_EXISTS'|'INTERNAL'|'RATE_LIMITED' }`. Rate-limited via `authRateLimit` (10/15min/IP). `AuthForm` calls this in sign-up mode, then auto-signs-in via `signIn('credentials')`.
- **API routes use `auth()` directly** — returns null → 401 JSON. Do NOT use `verifySession()` in API routes (it redirects — wrong for JSON).
- **Server Actions start with `verifySession()`** — before any other logic.
- **Middleware uses `auth` as default export** — Auth.js v5's `auth` function from `NextAuth()` is used directly as middleware. It checks cookie presence; actual session validity is verified by `verifySession()` in Server Components/Actions.
- **`AUTH_SECRET` read from `env` module** — never `process.env.AUTH_SECRET` directly.
- **H6: Proxy host header validation** — `proxy.ts` validates the Host header against a whitelist (canonical domain + localhost + `.vercel.app`) before Auth.js runs. Prevents Host Header Injection when `trustHost: true` is enabled.

### Drizzle ORM Patterns

- **Migrations via `drizzle-kit`** — `generate` (create SQL) → `migrate` (apply). Never `db push` in production.
- **Pooled connection for app** — `DATABASE_URL` uses Neon's `-pooler` host.
- **Unpooled connection for migrations** — `DATABASE_URL_UNPOOLED` uses direct host (pooling + DDL is unreliable).
- **`queries.ts` boundary** — all DB access through feature-level `queries.ts` files. Components never call `db` directly.
- **Lazy client** — `postgres()` creates the client object but does NOT connect until a query runs. This allows the module to be imported during Next.js build without a live DB.

### AI Pipeline (Inngest, 6 Steps — fully wired)

```
Step 0: Moderate story (OpenAI Moderation API — block if flagged)
Step 1: Analyze story (GPT-4o JSON mode → characters + scenes)
Step 2: Generate characters (Replicate SDXL → reference portraits → moderateImage per ADR-011)
Step 3: Generate scenes (Replicate SDXL + IP-Adapter → consistent faces → moderateImage per ADR-011)
Step 4: Synthesize voiceover (ElevenLabs TTS, chunked → R2 putObject → appendVoiceover row)
Step 5: Align subtitles (fetch audio from R2 → Whisper ASR → SRT → R2 putObject → updateVideoSubtitle)
Step 6: Assemble video (fetch scenes+audio+SRT → FFmpeg → R2 putObject('videos') → appendVideo row)
Final: Mark project status='completed', progressPercent=100
```

- Each step is idempotent (Inngest may retry).
- Each step debits credits via `debitCredits()` (Drizzle transaction): analysis=5, char=10/each, scene=8/each, voiceover=15, subtitle_alignment=3, video_assembly=30. **T3 fix: `createProjectAction` wraps the project INSERT + analysis debit in a single `db.transaction()` via the new `debitCreditsTx(tx, ...)` variant** — if the debit throws `InsufficientCreditsError`, the INSERT rolls back (no orphan project rows). The standalone `debitCredits(userId, ...)` is now a thin wrapper that opens its own transaction and delegates to `debitCreditsTx`.
- **T7 fix: `createProjectAction` wraps `inngest.send()` in try/catch** → calls `setProjectFailed(projectId, ...)` and returns `{ code: 'INTERNAL' }` on failure (no pending-orphan when Inngest is unreachable).
- Failed steps set `project.status = 'failed'` with error message.
- Image moderation (Steps 2 & 3): parses Replicate's `safety_concept` / `api_safety_concept` fields. Fail-open for unknown output shapes (deliberate tradeoff — fail-closed would block all generations from models that don't expose safety metadata). **T9 fix: `getFailOpen()` reads `env.IMAGE_MODERATION_FAIL_OPEN` inside the function body** (was module-load const — not testable per-call).
- Step 5 downloads audio from R2 via `fetch()` (signed URL) — Inngest steps don't share in-memory state, so we round-trip through R2 between Steps 4 and 5.
- Step 6 writes SRT to `/tmp/siv-srt-<uuid>.srt`, reads output MP4 from `/tmp/siv-video-<uuid>.mp4` into a Buffer, then cleans up both temp files. **T12 fix: temp file names use `crypto.randomUUID()` instead of `Date.now()`** (prevents collision on concurrent runs).
- **T8 fix: `appendVideo` inserts with `status: 'rendering'`** (not `'completed'`); `updateVideo` sets `status: 'completed'` alongside `videoKey` + `duration`. No more contradictory `status='completed'` with `videoKey=null`.
- `createProjectAction` triggers the pipeline via `inngest.send({ name: PIPELINE_EVENT, data: { projectId } })` after the DB insert (inside try/catch per T7).
- **T4 fix: Stripe webhook idempotency INSERT happens AFTER side effects succeed** (was before — if the handler threw, the row was committed and Stripe retries were silently swallowed). Now uses a pre-check SELECT + post-side-effect INSERT.
- Real API keys required to run end-to-end. The pipeline is fully wired at the code layer; remaining validation is operational (provision credentials + manual R&D on IP-Adapter consistency + FFmpeg assembly).

### Accessibility Requirements

- **Focus rings:** `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary` (T11: was `outline-amber-400` — now uses the brand `--color-primary: #febf00` token)
- **Skip-to-content** link at page top (`<a href="#main" className="sr-only ...">`)
- **Hero video:** `aria-hidden="true"` (decorative, no audio)
- **`prefers-reduced-motion: reduce`** — global override disables all animation
- **Touch targets:** ≥44×44px on mobile
- **Color contrast:** zinc-300 on zinc-950 = 12.6:1 (WCAG AAA)

### Performance Budget

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥95 (marketing page) |
| JS bundle | <150KB gzipped (was <100KB for marketing; app adds auth/db/ai client code) |
| CSS bundle | <30KB gzipped |
| Above-fold images | <500KB total |
| Videos preload | `metadata` only (not `auto`) |

### Asset Pipeline

- **Workflow videos:** `public/workflow/showcase-step{1-4}.mp4` + poster WebPs
- **Hero background:** `public/hero-bg.mp4` (generated from poster via ffmpeg zoompan)
- **Example thumbnails:** `public/examples/example-{1-6}.webp` (9:16 portrait)
- **Outfit font:** `public/fonts/Outfit-VariableFont.woff2` (45KB, weight 100-900)
- **Download script:** `./scripts/download-assets.sh` (idempotent, R2 bucket)

## Common Pitfalls

### Marketing Layer (inherited)
1. **Pure black vs near-black:** Background is `#020202`, NOT `#000` or `#0a0a0a`
2. **Amber shade mismatch:** PRD amber `#febf00` ≠ Tailwind `amber-400` (`#fbbf24`)
3. **Outfit 820 unavailable from Google Fonts API** — must self-host via `next/font/local`
4. **Feature grid uses hairline borders, not cards** — continuous surface separated by `border-neutral-800`
5. **Examples hover gradient is the ONLY purple** — `bg-gradient-to-r from-yellow-500 to-purple-500` on card hover only
6. **CTA hierarchy is deliberate** — ghost link → glass pill → gradient pill → solid amber (ration the accent)
7. **Geist Mono for ratio toggles, NOT Geist Sans** — `font-mono text-[10px]`
8. **`next lint` deprecated in Next.js 16** — use `eslint .` directly
9. **shadcn CLI times out** — primitives are hand-written, not CLI-generated
10. **Grammarly extension** — `suppressHydrationWarning` required on both `<html>` and `<body>`
11. **Workflow is `'use client'`** — uses `useState` for poster→video fade-in choreography
12. **Playwright browsers** — `pnpm install` doesn't install browser binaries; run `pnpm exec playwright install`

### Production App Layer (new)
13. **`verifySession()` must not be wrapped in try/catch** — it throws `NEXT_REDIRECT` which must propagate. Wrapping it silently swallows the redirect.
14. **`process.env.*` is forbidden** — always import `env` from `@/lib/env`. The Zod schema validates at module load; typos like `GOOGLE_CLIENTID` (missing underscore) would silently return `undefined` and disable OAuth. The `IMAGE_MODERATION_FAIL_OPEN` var is now in the Zod schema (was previously read via `process.env` directly in `moderate-image.ts` — that bypassed validation and let typos like `IMAGE_MOD_FAIL_OPEN` silently fall back to the default). Additionally, **Sprint 3 T1** promotes the AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch from `console.warn` to a thrown error in production runtime (fail-fast at boot); dev/test keep the warn-only behavior so operators can debug with mismatched URLs locally.
15. **Zod v4 `.url()` accepts `postgresql://`** — Zod v4 switched from regex-based URL validation to `new URL()`, which accepts any scheme. The `DATABASE_URL` validation composes `.url()` (validates URL format) with `.refine()` (restricts the protocol to `postgres:`/`postgresql:`). This catches MORE typos than the old bare `.refine()` with `startsWith()` — e.g., `postgresql://not a url with spaces` is now correctly rejected as a malformed URL. (In Zod v3, `.url()` rejected non-standard schemes; that limitation no longer applies in v4.)
16. **Build fails without env vars** — the env module has a build-context fallback (returns placeholders when `NEXT_PHASE === 'phase-production-build'` or `NODE_ENV === 'test'`). At runtime, real env vars MUST be set or the app fails fast.
17. **DrizzleAdapter rejects Proxy-based db** — `DrizzleAdapter(db)` validates the db object's structure. The db must be a real Drizzle client, not a Proxy. The `postgres()` client doesn't connect until a query runs, so eager instantiation is safe.
18. **Auth route handler must be `force-dynamic`** — `export const dynamic = 'force-dynamic'` in `src/app/api/auth/[...nextauth]/route.ts` prevents Next.js from trying to prerender it (which fails because DrizzleAdapter can't be instantiated without env vars).
19. **Inngest v4 `createFunction` signature changed** — the trigger is part of the config object (`triggers: [{ event: '...' }]`), NOT a second argument. Older examples show `createFunction(config, trigger, handler)` which is wrong for v4.
20. **Stripe "Basil" API (2025-03-31) moved `current_period_end`** — the field was REMOVED from the top-level Subscription object and moved to `subscription.items.data[0].current_period_end`. The Stripe Node SDK has always mirrored the REST API's snake_case convention — there was NEVER a camelCase conversion (`currentPeriodEnd` does not exist). The webhook handler uses the `extractSubscriptionPeriodEnd()` pure helper (`src/features/billing/domain/extract-period-end.ts`) which checks the Basil shape first, then falls back to the pre-Basil top-level field for backward compatibility.
21. **ElevenLabs `textToSpeech.convert()` returns a `Readable`** — not a `ReadableStream`. The `streamToBuffer` helper handles both via duck-typing (`getReader` check + async iteration fallback).
22. **Buffer → Blob requires `new Uint8Array(buffer)`** — `new File([audioBuffer], ...)` fails TypeScript's strict types because `Buffer<ArrayBufferLike>` is not assignable to `BlobPart`. Wrap with `new Uint8Array(audioBuffer)`.
23. **`NODE_ENV` is read-only in tests** — use `vi.stubEnv('NODE_ENV', 'test')` instead of direct assignment.
24. **Middleware runs on Edge runtime** — no Node.js APIs, no DB access. It only checks cookie presence; actual session validity is verified by `verifySession()` in Server Components/Actions.
25. **esbuild build scripts need approval** — `pnpm-workspace.yaml` must list `esbuild: true` under the `allowBuilds` map (pnpm 10.26+ syntax) or `pnpm install` skips the postinstall (drizzle-kit, vitest depend on esbuild). The older `onlyBuiltDependencies` array syntax was removed in pnpm 11.

### Remediation Sprint (pipeline wiring + UX + compliance)
26. **Vitest mock factories are hoisted above imports** — `vi.mock()` calls are lifted to the top of the file by the transformer. Any variable referenced inside the factory must use `vi.hoisted()` or be defined inline. Referencing an outer `const mockFn = vi.fn()` from inside `vi.mock(...)` throws `Cannot access 'mockFn' before initialization`.
27. **Mocked SDK constructors need `class` syntax** — `vi.fn().mockImplementation(() => ({ ... }))` returns an arrow function that cannot be `new`-ed. The real code does `new S3Client(...)`, so the mock must be a class: `class MockS3Client { send = sendMock; }`. Otherwise: `TypeError: () => ({...}) is not a constructor`.
28. **`.tsx` extension is mandatory for test files containing JSX** — `render(<Component />)` in a `*.test.ts` file produces `[PARSE_ERROR] Expected '>' but found 'Identifier'` from oxc. Rename to `*.test.tsx`.
29. **`fetch()` in the Inngest pipeline hits real DNS in tests** — Steps 5 and 6 download audio/SRT from R2 via `fetch(signedUrl)`. In tests, the signed URL is `https://r2.example.com/...` which fails with `ENOTFOUND`. Stub `fetch` globally: `vi.stubGlobal('fetch', fetchMock)`.
30. **SSE routes use `auth()` not `verifySession()`** — `verifySession()` throws `NEXT_REDIRECT` (a redirect), which is wrong for an API/SSE endpoint that should return 401 JSON. Use `auth()` directly: `const session = await auth(); if (!session?.user?.id) return NextResponse.json({error:'Unauthorized'},{status:401});`.
31. **SSE polling vs. Postgres LISTEN/NOTIFY** — serverless SSE can't hold a long-lived Postgres connection for LISTEN/NOTIFY. The progress route polls the DB every 2s and closes the stream on terminal status (`completed`/`failed`). 2s is fast enough for a 5-15min pipeline without hammering the DB.
32. **`EventSource` cleanup is critical** — `useEffect` must return a cleanup function that calls `eventSource.close()`. Forgetting this leaks the connection when the user navigates away. The hook also closes the EventSource when status reaches a terminal state.
33. **`getProject()` LEFT JOINs videos** — the query returns `videoKey`, `subtitleKey`, `videoDuration`, `videoResolution` (all nullable). The project detail page uses `project.videoKey` to conditionally render the download button. Don't add a second DB round-trip — the join is cheap.
34. **`putObject` for pipeline vs. `getSignedUploadUrl` for client uploads** — Inngest pipeline steps already have the Buffer in memory (TTS audio, FFmpeg output), so they use `putObject()` (direct S3 PUT). Client uploads (e.g., user avatar) use `getSignedUploadUrl()` so the browser uploads directly to R2 without round-tripping through the server.
35. **`assemble-video.ts` temp file lifecycle** — the rewritten function writes SRT to `/tmp/siv-srt-<ts>.srt`, runs FFmpeg to `/tmp/siv-video-<ts>.mp4`, reads the MP4 into a Buffer, then `unlink`s both. If FFmpeg errors mid-run, the `on('error')` handler still cleans up. Never leak temp files.
36. **`moderateImage` fail-open policy** — when Replicate's output shape is unknown (e.g., a model that doesn't expose `safety_concept`), `moderateImage` returns `flagged:false` with `moderationSkipped:true`. This is a deliberate tradeoff: fail-closed would block all generations from such models, which is worse UX than accepting the small risk. The policy is now env-configurable via `IMAGE_MODERATION_FAIL_OPEN` (default `true`; set to `false` for production fail-closed). A `console.warn` is emitted on every skip so operators can detect the bypass. (T5)
37. **husky `prepare` script uses `|| true`** — `package.json` has `"prepare": "husky || true"`. The `|| true` prevents `pnpm install` from failing if husky isn't yet installed (first install on a fresh clone). Don't remove it.
38. **`lint-staged` runs on staged files only** — not the whole codebase. Configured in `package.json` under `lint-staged`. Staged `.ts/.tsx` files get `eslint --fix` + `prettier --write`; `.json/.md/.css/.mjs` get `prettier --write` only.
39. **Source-reading tests must strip comments before regex** — when asserting "code does not contain X", strip comments first: `src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')`. Otherwise the docblock (which may mention the old pattern by name) triggers a false positive.
40. **Client components must NEVER import `@/lib/storage/r2` at module level** — the `r2.ts` module imports `env` which validates all 30 env vars at module load. In the browser, only `NEXT_PUBLIC_*` vars are available — all server-only vars are `undefined`, causing "Invalid environment variables" crash. Pattern: Server Component signs the URL via `getSignedDownloadUrl()`, passes as prop to the client component. This is a P0 bug that completely breaks the project detail page.
41. **`@ffmpeg-installer/ffmpeg` is incompatible with Turbopack** — the package uses dynamic `require()` with runtime-constructed paths (`__dirname.indexOf('node_modules')`) that produce `/ROOT/node_modules/...` under Turbopack's virtual filesystem. Turbopack rejects this with "server relative imports are not implemented". Replaced with system FFmpeg binary via `getFfmpegPath()` helper.

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| E2E tests fail with "Executable doesn't exist" | Playwright browsers not installed | `pnpm exec playwright install` |
| Hydration mismatch console error | Browser extension (Grammarly) injects attributes into `<body>` | `suppressHydrationWarning` on both `<html>` and `<body>` (already applied) |
| `next lint` command not found | Deprecated in Next.js 16 | Use `eslint .` directly |
| `shadcn` CLI times out | Registry fetch failure | Primitives are hand-written in `src/components/ui/` |
| Outfit weight 820 not rendering | Google Fonts API doesn't serve weight 820 | Must self-host via `next/font/local` (already done) |
| Tailwind classes not applying | Missing `@source` directives | Check `globals.css` has `@source '../components/**/*.{ts,tsx}'` |
| Cross-origin dev resource blocked | Next.js blocks `/_next/webpack-hmr` from non-localhost origins | Add origin to `allowedDevOrigins` in `next.config.ts` |
| Build fails: "Invalid environment variables" | Real env vars not set in `.env.local` | Copy `.env.example` → `.env.local`, fill in real values. Build-context fallback only applies when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`. |
| Build fails: "Failed to collect page data for /api/auth/[...nextauth]" | Auth route tries to prerender DrizzleAdapter | Ensure `export const dynamic = 'force-dynamic'` in the route handler |
| `drizzle-kit generate` errors | `DATABASE_URL_UNPOOLED` not set | Drizzle Kit needs the unpooled (direct) connection for DDL. Set in `.env.local`. |
| Inngest function not triggering | Function not registered in `src/lib/inngest/functions.ts` | Add new functions to the `functions` array exported from that file |
| Stripe webhook returns 400 "Invalid signature" | `STRIPE_WEBHOOK_SECRET` mismatch or body not raw | Use `await req.text()` (not `.json()`) and verify the secret matches the Stripe Dashboard webhook endpoint |
| `pnpm install` warns "Ignored build scripts: esbuild" | `pnpm-workspace.yaml` missing esbuild approval | Add `esbuild: true` to the `allowBuilds` map in `pnpm-workspace.yaml` (pnpm 10.26+ syntax; the older `onlyBuiltDependencies` array was removed in pnpm 11) |
| Tests fail: "Cannot find module 'next/server'" | jsdom can't load Next.js server modules | Mock `next-auth`, `next/navigation`, and `@/lib/db` in tests that transitively import them |
| `replicate.run()` returns wrong shape | Model output type varies | Cast via `as unknown as string[]` and check length before indexing |
| Tests fail: "Cannot access 'X' before initialization" | `vi.mock()` factory references a `vi.fn()` defined in the test body | Use `vi.hoisted()`: `const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))` then reference `mockFn` inside the factory |
| Tests fail: "X is not a constructor" | Mock factory returns an arrow function, but real code does `new X()` | Use `class` syntax in the mock factory: `class MockS3Client { send = sendMock; }` |
| Tests fail: "[PARSE_ERROR] Expected '>' but found 'Identifier'" | Test file uses JSX (`render(<Comp />)`) but has `.test.ts` extension | Rename to `*.test.tsx` (oxc needs the `.tsx` extension to parse JSX) |
| Pipeline tests fail: "fetch failed: ENOTFOUND r2.example.com" | Steps 5 & 6 download audio/SRT via `fetch()` which hits real DNS | Stub global `fetch`: `const fetchMock = vi.fn().mockResolvedValue({arrayBuffer:..., text:...}); vi.stubGlobal('fetch', fetchMock);` |
| SSE route returns 307 redirect instead of 401 JSON | Used `verifySession()` (throws redirect) instead of `auth()` (returns null) | API routes use `auth()` directly: `const session = await auth(); if (!session?.user?.id) return NextResponse.json({error:'Unauthorized'},{status:401});` |
| SSE stream hangs / never closes | `controller.close()` not called on terminal status | Poll DB every 2s; when `status ∈ {completed, failed}`, call `controller.close()` + `clearInterval(interval)` |
| `EventSource` leaks across navigations | `useEffect` cleanup missing `eventSource.close()` | Return a cleanup function from `useEffect` that calls `eventSource.close()` |
| Project detail page shows "This page couldn't load" | Client component imports `r2.ts` at module level, triggering env validation crash in browser | **Never import `@/lib/storage/r2` in `'use client'` files.** Sign URLs in Server Components, pass as props. |
| `assemble-video` can't find FFmpeg binary | `@ffmpeg-installer/ffmpeg` removed; system FFmpeg not installed | `sudo apt install ffmpeg` (Ubuntu) or `brew install ffmpeg` (macOS). Set `FFMPEG_PATH` env var if non-standard. |
| `FFMPEG_PATH` not set | Env var missing from `.env.local` | Add `FFMPEG_PATH=/usr/bin/ffmpeg` to `.env.local` |
| husky pre-commit hook doesn't run | `pnpm install` didn't run the `prepare` script (first install) | Run `pnpm install` (activates `prepare: husky`); ensure `.husky/pre-commit` is executable (`chmod +x`) |
| `assemble-video` returns `Buffer.from('placeholder')` | (Legacy bug, now fixed) Old impl didn't read the output file | Fixed in T3 rewrite — function now reads `/tmp/siv-video-<ts>.mp4` into a Buffer before resolving |
| `moderateImage` returns `flagged:false` for unknown Replicate output | Fail-open policy for models that don't expose `safety_concept` | Deliberate tradeoff (T5). The `moderationSkipped:true` field now makes the bypass observable. Set `IMAGE_MODERATION_FAIL_OPEN=false` in `.env.local` for production fail-closed. |
| Auth redirects to `http://localhost:3000` in production | `AUTH_URL` env var set to localhost, OR reverse proxy doesn't forward `X-Forwarded-Host` | Set `AUTH_URL` to the production URL. The `trustHost: true` config (T2) makes Auth.js use the request's Host header as a fallback. The env module now **THROWS** at boot in production runtime when AUTH_URL and NEXT_PUBLIC_APP_URL hosts differ (Sprint 3 T1 — was `console.warn` only). In dev/test the warn-only behavior is preserved. |
| `pnpm install` fails with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION  packages field missing or empty` | `pnpm-workspace.yaml` missing `packages:` field (T0) | Add `packages: ['.']` to `pnpm-workspace.yaml` (already done in this repo) |
| `putObject` throws `PayloadTooLargeError` | Body exceeds `MAX_PUT_OBJECT_BYTES` (500 MB) | Use multipart upload via `CreateMultipartUploadCommand` for larger files. The 500 MB cap is intentional — function memory is the real constraint, not R2's 5 GB limit. (T7) |
| SSE stream disconnects after 300s (Vercel Hobby) | `maxDuration = 800` (T6, corrected) is the Vercel Pro/Enterprise GA ceiling under Fluid Compute. Hobby caps at 300s. | Upgrade to Vercel Pro OR rely on client-side reconnect (T6) which reopens after 1s/2s/4s backoff. The UI shows "Reconnecting to live updates…" during reconnect. NOTE: the previous value of 900 EXCEEDED the Pro GA limit and silently fell back to the platform default — 800 is correct. |
| Replicate scene generation 404s | `REPLICATE_SDXL_IPADAPTER_MODEL` is the SDXL base placeholder (T4 default) | Set `REPLICATE_SDXL_IPADAPTER_MODEL` env var to a real `lucataco/sdxl-ipadapter:<sha>` hash from replicate.com/explorer |
| Server log shows `[env] AUTH_URL host ("localhost:3000") differs from NEXT_PUBLIC_APP_URL host` | AUTH_URL and NEXT_PUBLIC_APP_URL point to different hosts | Set both to the same production URL. With `trustHost: true` (T2) auth redirects no longer crash, but the env module now **THROWS** at module load in production runtime (Sprint 3 T1). In dev/test this is warn-only. If the log appears without a crash in production, T1's fail-fast may have been disabled — investigate immediately. |
| Billing upgrade buttons return 404 | Form posted to non-existent `/api/stripe/checkout` route (C-1 bug, fixed in T1) | Fixed: billing page now uses `<form action={billingCheckoutAction}>` Server Action. Ensure `billingCheckoutAction` is imported from `@/features/billing/actions` (has `"use server"`). |
| `/dashboard` returns `ERR_CONNECTION_REFUSED` for unauthenticated users | Proxy redirect used `nextUrl.origin` which resolves to `http://` behind TLS-terminating reverse proxy (C-2 bug, fixed in T2) | Fixed: proxy now uses `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)`. Verify `NEXT_PUBLIC_APP_URL` is set to the public HTTPS URL in `.env.local`. |
| Dashboard shows ghost "pending" projects the user never completed | `createProjectAction` inserted the project before debiting credits; InsufficientCreditsError left an orphan row (H-1 bug, fixed in T3) | Fixed: INSERT + debit now wrapped in `db.transaction()` via `debitCreditsTx`. To clean up existing orphans: `DELETE FROM projects WHERE status = 'pending' AND progress_percent = 0;` |
| Stripe webhook retries don't update the subscription after a transient DB error | Idempotency INSERT happened BEFORE the event handler; retries hit `onConflictDoNothing` and returned `{ duplicate: true }` without re-processing (H-2 bug, fixed in T4) | Fixed: idempotency INSERT now happens AFTER side effects succeed + pre-check SELECT. If you have affected events, delete the `usageEvents` rows with `type='stripe_webhook'` for those event IDs so Stripe retries can re-process. |
| SSE returns 429 "Too many concurrent connections" after closing and reopening within 60s | `sseRateLimit.fixedWindow(1, '1 m')` never released the counter on disconnect (H-3 bug, fixed in T5) | Fixed: SSE now uses `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern (SET NX EX 30 + DEL on abort). Slot auto-expires after 30s if the server crashes. |
| Download returns generic 500 for all R2 failures | Single catch block didn't distinguish error types (M-1 bug, fixed in T6) | Fixed: download route now classifies errors — S3/NoSuchKey/NoSuchBucket → 502, Timeout/Networking/Connection → 504, other → 500. Check server logs for the specific `errorName`. |
| Project stuck in "pending" after Inngest outage | `inngest.send()` threw but the project row was already committed (M-2 bug, fixed in T7) | Fixed: `inngest.send()` is now wrapped in try/catch → `setProjectFailed()`. The project status will be 'failed' with an error message; the user can retry. |
| `pnpm build` fails: "Functions cannot be passed directly to Client Components" | Server Action defined inline in a Server Component page (not in a `"use server"` module) (T1 lesson) | Move the Server Action to a module with `"use server"` at the top (e.g., `src/features/billing/actions.ts`). Import it into the page. |
| `tsc` error: "Argument of type 'string \| undefined' is not assignable to parameter of type 'string'" inside a closure | TypeScript doesn't preserve `session.user.id` narrowing inside closures (T5 lesson) | Capture `const userId: string = session.user.id` BEFORE the closure so the type is narrowed. |
| Live site `/dashboard` redirects to `http://localhost:3000/sign-in` → ERR_CONNECTION_REFUSED | Production `NEXT_PUBLIC_APP_URL` env var is set to `http://localhost:3000` instead of the public HTTPS URL. | Set `NEXT_PUBLIC_APP_URL=https://storyintovideo.jesspete.shop` (and `AUTH_URL` to the same host) in the production environment, then redeploy. **Sprint 3 T1** now makes the app refuse to boot if the two hosts differ in production runtime — this class of misconfiguration is now caught at boot, not at runtime. |
| Live site `/pricing`, `/blog`, `/contact` return 200 OK with marketing page title | No route handlers existed for these paths AND no custom `not-found.tsx` | **Fixed (Sprint 3 T6 + T7)** — all 3 pages now exist as Server Components with proper metadata (T6). Custom `not-found.tsx` (T7) covers any future dead links with on-brand 404 UX. |
| Nav clicks cause full-page reloads (visible flash, Lighthouse regression) | Navbar/dashboard/hero/CTAs used raw `<a href>` instead of `<Link>` | **Fixed (Sprint 3 T5)** — all internal `<a href>` replaced with `<Link>` across 9 files (navbar, hero, dashboard/page, examples, use-cases, footer, cta-amber, cta-gradient, cta-ghost). `mailto:` and hash anchors (`#main`, `#` placeholder) intentionally kept as `<a>`. |
| `/api/health` returns 200 healthy but auth-protected routes still broken | DB + FFmpeg healthy, but env is misconfigured | **Fixed (Sprint 3 T2)** — `/api/health` now returns a `config` object ({healthy, authUrl, appUrl}) + `configErrors` array. Operators must check `config.healthy` (NOT just HTTP status) — a config mismatch does NOT trigger 503 (config is observability, not liveness; restarting a healthy container would be wrong). With Sprint 3 T1 also deployed, the production app would have refused to boot before `/api/health` could even return 200. |

## Lessons Learned

### Marketing Layer (inherited)
1. **`suppressHydrationWarning` on `<body>`** — Browser extensions inject attributes before React hydrates. `<html>` alone is insufficient.
2. **Workflow is `'use client'`** — Uses `useState` for video loading choreography. Don't assume server components for "mostly static" sections.
3. **Test counts drift from plans** — MEP planned 6+3, actual is now 479 unit + 48 E2E. Always verify against `pnpm test` output.
4. **File structure evolves** — `components/primitives/`, `lib/hooks/`, `lib/data/` were created during build. Update docs as you build.
5. **Playwright needs separate install** — `pnpm install` doesn't install browser binaries.

### Production App Layer (new)
6. **Zod v4 `.url()` accepts any scheme (including `postgresql://`)** — Zod v4 switched from regex-based URL validation to `new URL()`. The env module composes `.url()` (validates URL format) with `.refine()` (restricts the protocol to `postgres:`/`postgresql:`). This catches more typos than the old bare `.refine()` with `startsWith()` did. (The Zod v3 limitation where `.url()` rejected `postgresql://` no longer applies.)
7. **Env validation must have a build-context fallback** — without it, `next build` fails during page-data collection because the auth route handler imports DrizzleAdapter which accesses `env.DATABASE_URL`. The fallback returns placeholders when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`.
8. **`postgres()` doesn't connect until a query runs** — this allows eager db instantiation in `src/lib/db/index.ts` without breaking the build. The connection is established only on first query at request time.
9. **DrizzleAdapter validates the db object's structure** — a Proxy-based lazy db was rejected ("Unsupported database type (object)"). The solution is a real Drizzle client with a `postgres()` client that defers connection.
10. **Inngest v4 changed `createFunction` signature** — the trigger moved into the config object as `triggers: [{ event: '...' }]`. Older docs and examples show a 3-argument form that no longer works.
11. **Auth unit tests must mock `next-auth` and `next/navigation`** — jsdom can't load `next/server` (imported transitively by `next-auth`). Mocking these modules isolates the test and avoids the "Cannot find module 'next/server'" error.
12. **Source-reading tests are valid for server-only modules** — some tests read the source file via `readFileSync` to verify structural patterns (auth config, middleware, route handlers) that can't be asserted via rendering. This is intentional and documented in each test file.
13. **Stripe "Basil" API (2025-03-31) moved `current_period_end`** — the field was removed from the top-level Subscription object and moved to `subscription.items.data[0].current_period_end`. The Stripe Node SDK has always used snake_case (mirroring the REST API); there was never a camelCase conversion. The webhook handler uses the `extractSubscriptionPeriodEnd()` pure helper which checks the Basil shape first, then falls back to the pre-Basil top-level field.
14. **ElevenLabs SDK returns `Readable`, not `ReadableStream`** — the `streamToBuffer` helper duck-types the input (checks for `getReader`) and falls back to async iteration for Node Readable streams.
15. **TDD with mocked AI providers works well** — all 6 pipeline domain functions (analyze, moderate, generate-character, generate-scene, synthesize-voice, align-subtitles) are fully unit-tested with mocked OpenAI/Replicate/ElevenLabs SDKs. Real API calls are only needed for manual end-to-end validation.

### Remediation Sprint (pipeline wiring + UX + compliance)
16. **Vitest mock hoisting is the #1 test bug** — `vi.mock()` factories are hoisted above imports. Any `vi.fn()` referenced inside must be wrapped in `vi.hoisted()` or it's `undefined` at factory execution time. Symptom: `Cannot access 'X' before initialization`. Pattern: `const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() })); vi.mock('mod', () => ({ x: mockFn }));`.
17. **Mock constructors must be `class`, not arrow fns** — `new S3Client(...)` requires the mock to be `new`-able. Arrow functions throw `"X is not a constructor"`. Use `class MockS3Client { send = sendMock; }` in the mock factory.
18. **`.tsx` extension is mandatory for JSX tests** — oxc throws `[PARSE_ERROR] Expected '>' but found 'Identifier'` for JSX in `*.test.ts`. Rename to `*.test.tsx`. This is a transformer-level requirement, not a TypeScript one.
19. **SSE in Next.js 16 works with `ReadableStream` + `text/event-stream`** — return `new Response(stream, { headers: { 'Content-Type': 'text/event-stream', ... }})` where `stream` is a `ReadableStream` that enqueues `data: JSON\n\n` messages. Polling every 2s is simpler than Postgres LISTEN/NOTIFY for serverless (no long-lived connection).
20. **`auth()` vs `verifySession()` for API routes** — `verifySession()` throws `NEXT_REDIRECT` (a redirect), which is wrong for JSON/SSE endpoints that should return 401. API routes use `auth()` directly: returns null → 401 JSON. Server Components/Actions use `verifySession()` (redirects to `/sign-in`).
21. **`EventSource` cleanup is non-negotiable** — `useEffect` must return `() => eventSource.close()`. Otherwise the connection leaks when the user navigates away. The hook also closes on terminal status to avoid reconnect attempts.
22. **Image moderation via Replicate's safety output is preferred** — parsing `safety_concept` / `api_safety_concept` from the model response adds zero latency/cost vs. a second OpenAI vision moderation API call. Tradeoff: fail-open for unknown output shapes (deliberate — fail-closed would block all generations from models that don't expose safety metadata).
23. **`getProject()` LEFT JOIN videos is cheaper than two queries** — the project detail page needs video data for the download button. Doing a LEFT JOIN in the existing query adds <1ms; doing a second `getProjectVideo()` round-trip adds 5-15ms. Always prefer the join when the UI needs both.
24. **`putObject` for pipeline vs. `getSignedUploadUrl` for client uploads** — pipeline steps have the Buffer in memory (TTS audio, FFmpeg output), so direct PUT is faster. Client uploads (browser → R2) use presigned URLs to avoid round-tripping through the server. Don't mix the two patterns.
25. **TDD exposed 4 latent defects in `assemble-video.ts`** — the original implementation returned `Buffer.from('placeholder')`, never wrote the SRT file, never passed `-loop -t` input options, and extracted the filter via a brittle `.find(includes('concat'))`. All four were only discoverable by writing tests first. This is the strongest argument for TDD on legacy code: the tests document the contract the code should have been meeting.
26. **Source-reading tests must strip comments** — when asserting "code does not contain X" via regex on source, strip comments first. Docblocks that explain the old pattern (e.g., "this replaces the placeholder Buffer.from pattern") trigger false positives. Pattern: `src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')`.
27. **husky `prepare` script with `|| true` is intentional** — `package.json` has `"prepare": "husky || true"`. The `|| true` prevents `pnpm install` from failing on first install (when husky isn't yet installed). Don't "fix" this by removing the fallback.
28. **Client components must NEVER import `r2.ts` at module level** — the `r2.ts` module imports `env` which validates all 30 env vars at module load. In the browser, only `NEXT_PUBLIC_*` vars exist — all server-only vars are `undefined`, causing "Invalid environment variables" crash. The fix: Server Component signs the URL, passes as prop to client component. This is a P0 bug that completely breaks the project detail page.
29. **Server-side URL signing pattern** — for any client component that needs data from server-only env vars (R2 signed URLs, Stripe secrets, etc.), the Server Component should fetch/compute the value and pass it as a prop. This is the recommended Next.js 16 pattern and avoids the client-side env validation crash entirely.
30. **`@ffmpeg-installer/ffmpeg` is incompatible with Turbopack** — the package uses dynamic `require()` calls with runtime-constructed paths that produce `/ROOT/node_modules/...` under Turbopack's virtual filesystem. Turbopack rejects this with "server relative imports are not implemented". Replaced with system FFmpeg binary via `getFfmpegPath()` helper.
31. **`middleware.ts` renamed to `proxy.ts` in Next.js 16** — the file convention changed to better reflect its role as a network boundary. Functionality is identical; only the filename changes. Run `npx @next/codemod@canary middleware-to-proxy .` to migrate.

### Remediation Sprint 2 (post-review hardening)
32. **`trustHost: true` is mandatory for reverse-proxy deployments** — without it, Auth.js v5 falls back to `AUTH_URL` for callback URLs. If `AUTH_URL=http://localhost:3000` leaks to production (common copy-paste error), auth redirects resolve to localhost and the browser shows `ERR_CONNECTION_REFUSED`. This was a P0 production outage on the live deployment. (T2)
33. **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch is a leading indicator of misconfiguration** — the env module **now THROWS at boot in production runtime** (Sprint 3 T1) when the two hosts differ; dev/test keep the warn-only behavior so operators can debug locally. `trustHost: true` (T2) covers auth callbacks, but AUTH_URL is still used for email magic links etc., so the mismatch must be fixed. The promotion from warn → throw was driven by the live-site incident documented in §"Post-Audit-v1 Validation" #56.
34. **`OPENAI_API_KEY.startsWith('sk-')` is NOT too strict** — investigation revealed that `sk-proj-*`, `sk-svcacct-*`, `sk-admin-*` all literally start with `sk-`. The original concern was unfounded. 5 regression-guard tests were added to lock this behavior in. (T3)
35. **Hardcoded third-party model IDs are an operational liability** — the placeholder `SDXL_IPADAPTER_MODEL` hash (`6f288a8d-7e5e-4f0c-8b3f-3e1f3e6e3e3e`) was a UUID-format string, not Replicate's 64-char hex SHA. Scene generation would have 404'd in production. Moving model IDs to env vars with format validation catches this class of bug at module load. (T4)
36. **Silent fail-open policies are dangerous** — the original `moderateImage` returned `flagged:false` with no log when the output shape was unknown. Operators had no way to detect the bypass. Adding the `moderationSkipped` field + `console.warn` makes the bypass observable. The policy is now env-configurable (`IMAGE_MODERATION_FAIL_OPEN=false` for production fail-closed). (T5)
37. **SSE on Vercel needs both server-side and client-side resilience** — setting `maxDuration = 800` covers Vercel Pro/Enterprise GA under Fluid Compute (now default on all plans). 1800s is available in beta only — not stable for production. Vercel Hobby still caps at 300s. The client-side reconnect with exponential backoff (1s → 2s → 4s, max 3 attempts) handles the Hobby case gracefully. Both layers are needed. NOTE: the previous value of 900 exceeded the Pro GA limit and silently fell back to the default — 800 is correct. (T6)
38. **`putObject` needs a size guard** — R2's hard limit is 5 GB, but function memory is the real constraint (typically 1-8 GB). A 4K FFmpeg output (~4 GB) would OOM the function before reaching R2. The `MAX_PUT_OBJECT_BYTES = 500 MB` cap fails fast with a clear `PayloadTooLargeError` instead of an opaque OOM. (T7)
39. **`pnpm-workspace.yaml` requires `packages:` field even for single-package repos** — pnpm 9+ enforces this. Fresh clones fail with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION  packages field missing or empty`. The fix is `packages: ['.']`. (T0)
40. **CI should run the full quality gate, not just lint-staged** — lint-staged only checks staged files. A bad commit to `main` can pass locally and break production. The GitHub Actions workflow runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every PR. (T8)

### Audit v1 Remediation (T1–T12 — see `AUDIT_REPORT_v1.md` + `REMEDIATION_PLAN_v1.md`)
41. **Server Action forms must live in a `"use server"` module** — the initial T1 fix put `billingCheckoutAction` inline in the billing page component (a Server Component). `pnpm build` failed with "Functions cannot be passed directly to Client Components". Server Actions must be in a module with `"use server"` at the top. Moved `billingCheckoutAction` to `src/features/billing/actions.ts` (already has `"use server"`). Build passed. (T1)
42. **Behind a TLS-terminating reverse proxy, `nextUrl.origin` lies** — Cloudflare Tunnel terminates TLS, so `nextUrl.protocol` is `http:` and/or the Host header may not match the public domain. Constructing redirects with `new URL('/sign-in', nextUrl.origin)` sent the browser to `http://public-domain:80` → `ERR_CONNECTION_REFUSED`. Always use `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)` for redirects that must reach the user's browser. (T2)
43. **Idempotency-key-too-early is a silent data-loss anti-pattern** — the Stripe webhook idempotency INSERT happened BEFORE the event handler. If the handler threw (transient DB error), the row was committed, and Stripe retries hit `onConflictDoNothing` returning `{ duplicate: true }` without re-processing. The subscription update was permanently lost. Fix: INSERT the idempotency row AFTER side effects succeed; use a pre-check SELECT for the common duplicate case. (T4)
44. **Upstash `fixedWindow` rate limiters can't release on disconnect** — `sseRateLimit.fixedWindow(1, '1 m')` incremented a counter on connection open and let it expire after 60s. When the client disconnected cleanly, the counter was NOT decremented. Users who closed and reopened within 60s got 429 despite zero active connections. Fix: use Redis `SET NX EX` (atomic claim with TTL) + `DEL` on disconnect + `EXPIRE` on every poll interval. The `sseRateLimit` export is kept for backward compat but no longer used in the SSE route. (T5)
45. **Drizzle transactions can't be nested** — `debitCredits` opened its own transaction. To wrap INSERT + debit in a shared transaction (T3, so InsufficientCreditsError rolls back the INSERT), we needed a `debitCreditsTx(tx, ...)` variant that accepts an existing transaction handle. The standalone `debitCredits` is now a thin wrapper: `db.transaction((tx) => debitCreditsTx(tx, ...))`. Pipeline steps that don't need a shared transaction keep using `debitCredits`. (T3)
46. **Source-reading tests must search for `.method()` not `db.method()`** — when verifying that `db.insert(usageEvents)` appears after a `switch` block, the source has `db\n  .insert(usageEvents)` across lines. `indexOf('db.insert(usageEvents)')` returns -1 (no contiguous match). Use `indexOf('.insert(usageEvents)')` instead. (T4 test)
47. **TypeScript doesn't preserve `session.user.id` narrowing inside closures** — the SSE route's `req.signal.addEventListener('abort', () => releaseSseSlot(session.user.id, projectId))` failed typecheck because `session.user.id` is `string | undefined` inside the closure (even though we checked it earlier). Fix: capture `const userId: string = session.user.id` before the closure so the type is narrowed to `string`. (T5)
48. **`appendVideo` setting `status='completed'` at insert time is a state-machine lie** — the video row is created in Step 5 (subtitles) with `videoKey=null`. Setting `status='completed'` at insert means any query between Step 5 and Step 6 sees `status='completed'` with `videoKey=null` — a contradictory state. Fix: use the existing `'rendering'` enum value at insert; `updateVideo` sets `'completed'` alongside `videoKey`. The `video_status` enum already had `pending, rendering, completed, failed` — no migration needed. (T8)
49. **Module-load constants make env-configurable behavior untestable per-call** — `const FAIL_OPEN = env.IMAGE_MODERATION_FAIL_OPEN === 'true'` at module top level means tests can't verify both policies in the same run without re-importing the module. Fix: move the read into a `getFailOpen()` function called inside the function body. Tests can now mock `env` per-call. (T9)
50. **Dead exported functions create a second source of truth** — `buildFfmpegCommand` was exported "for unit testing" but never called in production (the real `assembleVideo` uses fluent-ffmpeg's API directly). If someone updated one and not the other, the test passed but production broke. Fix: delete dead code. Tests should verify the real code path, not a parallel implementation. (T10)
51. **Large mechanical sweeps need scripted `sed`, not manual edits** — the T11 brand-token replacement touched 45 files with 149 violations. Per `skills/code-simplification` §3 "Rule of 500": if a refactor touches >500 lines, use automation. Manual edits at that scale are error-prone and exhausting to review. Script saved at `/home/z/my-project/scripts/t11-brand-token-sweep.sh`. (T11)
52. **`metadataBase` hardcoded to a placeholder breaks social sharing** — `new URL('https://storyintovideo-clone.example.com')` made OG image URLs resolve to a non-existent domain. Always use `env.NEXT_PUBLIC_APP_URL` so metadata URLs match the deployment. (T12/L-4)
53. **`Date.now()` temp file names collide under concurrency** — two Inngest pipeline runs finishing at the same millisecond would write to the same `/tmp/siv-srt-<ts>.srt` file. Fix: use `crypto.randomUUID()` for temp file names. Atomic, no collision risk. (T12/L-3)
54. **`EventSource.close()` is idempotent but sloppy** — calling `close()` twice doesn't crash, but it's sloppy. The `useProjectProgress` hook now sets `eventSource = null` after `close()` in the terminal-status handler so the cleanup function's `if (eventSource)` guard skips the redundant close. (T12/L-2)
55. **R2 error classification matters for operators** — a generic 500 for all R2 failures hides whether the issue is transient (retry) or permanent (contact support). Classifying by `err.name` (S3/NoSuchKey/NoSuchBucket → 502, Timeout/Networking/Connection → 504, other → 500) lets operators distinguish and lets the UI show appropriate retry guidance. (T6)

### Post-Audit-v1 Validation (2026-06-29)
56. **`console.warn` is insufficient for env misconfigurations in production** — the AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch warning at `src/lib/env/index.ts:217-226` only emits `console.warn`. Behind a reverse proxy, server logs are easily missed. The live site at `storyintovideo.jesspete.shop` exhibited exactly this failure: `NEXT_PUBLIC_APP_URL=http://localhost:3000` caused every auth-protected route (`/dashboard`, `/create`, `/billing`, `/projects/[id]`, `/settings`) to redirect to `http://localhost:3000/sign-in` → `ERR_CONNECTION_REFUSED`. The T2 code fix was correctly deployed (proven by `/api/health` returning the H9 DB+FFmpeg check), but the env var was wrong. Lesson: production env misconfigurations should fail fast (throw at module load) OR be surfaced via `/api/health` so monitoring catches them. **✅ Both halves now implemented — Sprint 3 T1 promotes the warn to a thrown error in production runtime; T2 surfaces the mismatch in `/api/health`'s `config` + `configErrors` fields.**
57. **Legal pages must not promise features the code doesn't implement** — the Privacy Policy at `src/app/(legal)/privacy/page.tsx` §4 publicly states "You may delete your account at any time, which triggers a CASCADE deletion of all your projects, characters, scenes, voiceovers, videos, and usage events from our database." and §6 lists GDPR rights to Erasure + Portability. No `DELETE /api/user` or `GET /api/user/export` endpoint exists. This is a compliance P0 — the public legal page is making promises the code can't keep. Lesson: every right promised in legal copy must trace to a working endpoint. The DB schema already has `onDelete: 'cascade'` on every FK from `users`, so the cascade is wired — only the API surface is missing. **✅ Fixed — Sprint 3 T3 implements `GET /api/user/export` (portability) and T4 implements `DELETE /api/user` (erasure + R2 cleanup via `deleteUserMedia`). The legal page now matches the code.**
58. **`<a href>` vs `<Link>` drift is easy to miss in source-reading tests** — `src/components/sections/navbar.tsx`, `src/app/(app)/dashboard/page.tsx`, and `src/components/sections/hero.tsx` all use raw `<a href>` for internal routes, directly violating CLAUDE.md's "never use `<a>` for internal routes" rule. The existing `cta-routes.test.ts` verifies the href VALUES (e.g., `/sign-in`, `/create`) but not whether they're rendered as `<a>` or `<Link>`. Lesson: source-reading tests should assert both the route AND the component type when the distinction matters for performance (full-page reload vs client-side navigation). **✅ Fixed (Sprint 3 T5) — the 9 affected files now use `<Link>`; `cta-routes.test.ts` was extended with source-reading assertions for `<Link` usage so this drift can't return.**
59. **Next.js default 404 inherits root layout metadata** — without a custom `src/app/not-found.tsx`, any unknown URL (e.g., `/pricing`, `/blog`, `/contact` — all linked from nav/footer) returns 200 OK with the marketing page title. This hides broken links from operators and is bad for SEO. Lesson: always ship a custom `not-found.tsx` with proper metadata + on-brand UX. Confirmed on live site: `https://storyintovideo.jesspete.shop/pricing` returns 200 with title `StoryIntoVideo - Turn Stories Into Videos with AI`.
60. **Live-site behavioral testing catches what unit tests can't** — the `/dashboard` ERR_CONNECTION_REFUSED issue was only discoverable by hitting the live URL with a browser. Unit tests verify the proxy code uses `env.NEXT_PUBLIC_APP_URL` (correct), but can't catch the operational misconfiguration of that env var on the production server. Lesson: add a smoke test that hits `/api/health` + `/dashboard` (expecting redirect to `/sign-in` on the SAME host) after every deploy.

## Outstanding Issues

### Critical (blocks production launch)
1. **No real external service credentials** — the app builds and tests pass with placeholders, but running the full pipeline requires real Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2, Stripe, Inngest, Resend, Upstash, and Sentry accounts. Fill in `.env.local` from `.env.example`.
2. **Database migrations not applied** — `pnpm drizzle-kit generate` + `pnpm drizzle-kit migrate` must be run against a real Neon database before the app can function.
3. **No real Stripe products configured** — the `PRICE_IDS` in `src/lib/stripe/client.ts` are placeholders (`price_creator_monthly`, etc.). Real Stripe price IDs must be created in the Stripe Dashboard and set as env vars.
4. **Replicate IP-Adapter model hash is a placeholder default** — `REPLICATE_SDXL_IPADAPTER_MODEL` defaults to the SDXL base model hash (not IP-Adapter). Operators MUST set this env var to a real `lucataco/sdxl-ipadapter:<sha>` hash before character consistency will work. The env schema validates the `owner/model:sha` format to catch typos. (T4)
5. **Character consistency (IP-Adapter) is unvalidated end-to-end** — the highest-risk component (Risk R1 in the Production Readiness Plan). Code is wired; requires manual R&D with real API keys: generate 3 character references, then 3 scenes, verify faces match. May need model/parameter iteration.
6. **FFmpeg video assembly is unvalidated end-to-end** — `src/features/pipeline/domain/assemble-video.ts` was rewritten (T3) and is unit-tested with mocked fluent-ffmpeg, but needs real-world validation with actual scene images + audio + SRT. May need to fall back to Shotstack if serverless FFmpeg is unreliable (ADR-006).
7. ~~**Privacy Policy publicly promises unimplemented GDPR endpoints**~~ → **FIXED (Sprint 3 T3 + T4)** — `GET /api/user/export` (T3) and `DELETE /api/user` (T4) now exist. T4 collects R2 keys BEFORE the DB CASCADE (since CASCADE would wipe the projects table and lose the keys), then best-effort deletes them via `deleteUserMedia` (R2 errors are logged but don't fail the request — DB deletion is the source of truth, and the Privacy Policy §4's "within 30 days" promise covers transient R2 outages).
8. ~~**Production env var misconfiguration goes silently undetected**~~ → **FIXED (Sprint 3 T1 + T2)** — T1 promotes the warn to a thrown error in production runtime; T2 surfaces the mismatch in `/api/health`'s `config`/`configErrors` fields. Remaining operational task: set `NEXT_PUBLIC_APP_URL` + `AUTH_URL` correctly on the production host (the code now refuses to boot if they differ).

### High (degrades UX)
9. **No visual regression testing** — pixel-perfect verification against the live marketing site is manual.
10. ~~**No rate limiting**~~ → **FIXED (C3)** — Upstash Ratelimit on auth (10/15min/IP), pipeline (5/min/user), SSE (1/user/project). New deps: `@upstash/ratelimit`, `@upstash/redis`.
11. **No monitoring** — Sentry, Vercel Analytics, Axiom are not yet integrated. Env var `SENTRY_DSN` is in the schema.
12. ~~**E2E tests not in CI**~~ → **FIXED (Sprint 3 T9)** — `.github/workflows/ci.yml` now has a second `e2e` job that runs Playwright against a live dev server + seeded Postgres 17 service container. `continue-on-error: true` initially so flakiness doesn't block PRs — flip to required once stable. The job installs FFmpeg, runs `pnpm drizzle:migrate` + `pnpm db:seed`, installs Playwright Chromium with deps, and uploads the report as an artifact.
13. ~~**H2 — Brand color violations**~~ → **FIXED (T11)** — full replacement across 45 files; `brand-tokens.test.ts` now enforces 0 violations.
14. **H5 — FFmpeg `/tmp` OOM risk** — `assemble-video.ts` writes to `/tmp` + reads into Buffer (**T12: temp files now use `crypto.randomUUID()` instead of `Date.now()`**). For large 4K videos, this can OOM. Stream-to-R2 via `@aws-sdk/lib-storage` deferred (dep installed but refactor not done).
15. **M3 — Character image R2 upload** — `referenceImageKey` stores Replicate CDN URLs, not R2 keys. Uploading to R2 requires pipeline Step 2 refactor.
16. ~~**Navbar + dashboard + hero use raw `<a href>` instead of `next/link`**~~ → **FIXED (Sprint 3 T5)** — all 9 affected files (navbar, hero, dashboard/page, examples, use-cases, footer, cta-amber, cta-gradient, cta-ghost) now use `<Link>` from `next/link`. `mailto:` and hash anchors (`#main`, `#` placeholder in examples.tsx) intentionally kept as `<a>` per Next.js conventions.
17. ~~**No custom `not-found.tsx` page**~~ → **FIXED (Sprint 3 T7)** — `src/app/not-found.tsx` is a Server Component with proper metadata, on-brand 404 UX, and `<Link>` CTAs to `/` and `/create`. Dead links now show a real 404 instead of the marketing page title.

### Medium (polish + compliance)
18. **PostCSS vulnerability** — `postcss <8.5.10` has a moderate vuln (transitive via `next`). Not exploitable. Will resolve when Next.js updates its lockfile.
19. ~~**No GDPR/CCPA compliance**~~ → **FIXED (Sprint 3 T3 + T4 + T8)** — data export endpoint (T3), account deletion endpoint + R2 cleanup (T4), and cookie consent banner (T8) all implemented. Privacy Policy + Terms of Service pages existed previously and now match the code.
20. ~~**Other content pages missing**~~ → **FIXED (Sprint 3 T6 + T7)** — `/pricing`, `/blog`, `/contact` all now exist as Server Components with metadata (T6). Combined with the custom `not-found.tsx` (T7), any remaining dead links now show a real 404 instead of the marketing page title.
21. **SSE on Vercel Hobby** — `maxDuration = 800` (T6, corrected) is the Vercel Pro/Enterprise GA ceiling under Fluid Compute. On Hobby, the cap is 300s; the client-side reconnect (also T6) handles this gracefully with a brief "Reconnecting…" message.

### ✅ Recently Closed (remediation sprint 1 — pipeline wiring + UX + compliance)
- ~~Steps 4-6 not wired into Inngest~~ → Fixed (T4+T5+T7)
- ~~`inngest.send()` commented out in `createProjectAction`~~ → Fixed (T8)
- ~~FFmpeg `assemble-video.ts` placeholder implementation~~ → Fixed (T3 rewrite)
- ~~No SSE progress stream~~ → Fixed (T9)
- ~~No download/share on project detail~~ → Fixed (T10, then T1: server-side signing to fix env crash)
- ~~No content moderation on generated images (ADR-011)~~ → Fixed (T11)
- ~~No legal pages (Privacy/Terms)~~ → Fixed (T12)
- ~~No pre-commit hooks~~ → Fixed (T14 — husky + lint-staged)
- ~~Documentation drifts (E2E count, /api/health route, FK count)~~ → Fixed (T13)

### ✅ Recently Closed (remediation sprint 2 — post-review hardening)
- ~~P0: Auth redirects to `localhost:3000` in production~~ → Fixed (`trustHost: true` + AUTH_URL host-mismatch warning — T2)
- ~~`SignedDownloadWrapper` inline in page.tsx~~ → Fixed (extracted to its own file — T1)
- ~~`SDXL_IPADAPTER_MODEL` fake placeholder hash~~ → Fixed (env-configurable with format validation — T4)
- ~~`moderateImage` fail-open is silent~~ → Fixed (`moderationSkipped` field + env-configurable policy via `IMAGE_MODERATION_FAIL_OPEN` — T5)
- ~~SSE disconnects mid-pipeline (300s Vercel cap)~~ → Fixed (`maxDuration = 800` (corrected from 900 — Pro GA ceiling under Fluid Compute is 800s, not 900s) + client reconnect with exponential backoff — T6)
- ~~`putObject` accepts any buffer size~~ → Fixed (`MAX_PUT_OBJECT_BYTES = 500 MB` + `PayloadTooLargeError` — T7)
- ~~No CI/CD~~ → Fixed (GitHub Actions workflow — T8)
- ~~`pnpm-workspace.yaml` missing `packages:` field~~ → Fixed (T0)
- ~~`OPENAI_API_KEY` validation too strict~~ → Investigated, found unfounded (`sk-` prefix already accepts `sk-proj-`, `sk-svcacct-`, `sk-admin-`); 5 regression-guard tests added (T3)

### ✅ Recently Closed (post-review hardening — design_critique.md remediation)
- ~~Fictional Stripe SDK v22 camelCase fallback in webhook~~ → Fixed (`extractSubscriptionPeriodEnd()` pure helper handles the real Basil API 2025-03-31 shape change — 8 tests)
- ~~SSE `maxDuration = 900` exceeded Vercel Pro GA limit~~ → Fixed (`maxDuration = 800` — Pro/Enterprise GA ceiling under Fluid Compute)
- ~~React `^19.2.0` vulnerable to CVE-2025-55182 (React2Shell RCE)~~ → Fixed (pinned `^19.2.3`)
- ~~Obsolete Zod v3 `.refine()` workaround for `DATABASE_URL`~~ → Fixed (`.url().refine()` composition — Zod v4 `.url()` accepts any scheme — 4 tests)
- ~~`IMAGE_MODERATION_FAIL_OPEN` bypassed Zod env validation~~ → Fixed (moved into schema as `z.enum(['true','false'])`, read from `env` module not `process.env` — 7 tests)
- ~~`pnpm-workspace.yaml` mixed deprecated + current syntax~~ → Fixed (standardized on `allowBuilds`, removed stale `@ffmpeg-installer/linux-x64`, bumped engine to `>=10.26.0`)
- ~~`STYLE_CHIPS` drifted from spec (7 chips, wrong labels)~~ → Fixed (restored 8-chip spec set verbatim — 5 tests)
- ~~Hero headline collapsed to 2-line~~ → Fixed (restored 3-line cinematic stack + subtitle emphasizes OUTPUT over PROCESS — 5 tests)

### ✅ Recently Closed (audit v1 remediation — T1–T12, see `AUDIT_REPORT_v1.md` + `REMEDIATION_PLAN_v1.md`)
- ~~Billing upgrade buttons POST to non-existent `/api/stripe/checkout` route (C-1)~~ → Fixed (T1: `billingCheckoutAction` Server Action in `billing/actions.ts`, wired via `<form action={billingCheckoutAction}>`)
- ~~All protected routes return `ERR_CONNECTION_REFUSED` for unauthenticated users (C-2)~~ → Fixed (T2: proxy redirect uses `env.NEXT_PUBLIC_APP_URL` not `nextUrl.origin`)
- ~~Orphan project rows on insufficient credits (H-1)~~ → Fixed (T3: INSERT + debit wrapped in `db.transaction()` via `debitCreditsTx`)
- ~~Stripe webhook idempotency INSERT-before-handler lost updates on transient DB errors (H-2)~~ → Fixed (T4: INSERT moved to AFTER side effects + pre-check SELECT)
- ~~SSE rate limit never released on disconnect — 60s lockout (H-3)~~ → Fixed (T5: `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern)
- ~~Download route generic 500 for all R2 failures (M-1)~~ → Fixed (T6: error classification 502/504/500)
- ~~`inngest.send()` failure orphaned projects (M-2)~~ → Fixed (T7: try/catch → `setProjectFailed()`)
- ~~`appendVideo` set `status='completed'` before MP4 existed (M-3)~~ → Fixed (T8: `status='rendering'` at insert, `updateVideo` sets `'completed'`)
- ~~`FAIL_OPEN` read at module load — not testable per-call (M-4)~~ → Fixed (T9: `getFailOpen()` reads inside function body)
- ~~Dead `buildFfmpegCommand` export — second source of truth (M-5)~~ → Fixed (T10: deleted)
- ~~Brand color system bypassed 122+ times across 28 files (M-6)~~ → Fixed (T11: `sed` sweep across 45 files → `primary`/`background`/`card` tokens; `brand-tokens.test.ts` enforces 0 violations)
- ~~`useProjectProgress` double-close risk + `Date.now()` temp file collisions + hardcoded `metadataBase` placeholder (L-2/L-3/L-4)~~ → Fixed (T12: `eventSource=null` guard, `crypto.randomUUID()`, `env.NEXT_PUBLIC_APP_URL`)

### ✅ Recently Closed (Sprint 3 — T1–T9 compliance + UX + CI hardening)
- ~~AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch only `console.warn`s in production~~ → Fixed (T1: throws at boot in production runtime; dev/test keep the warn)
- ~~`/api/health` doesn't surface env misconfigurations~~ → Fixed (T2: returns `config` + `configErrors`; 503 still only on DB/FFmpeg failure)
- ~~No GDPR data export endpoint~~ → Fixed (T3: `GET /api/user/export` + `getUserExportData(userId)` in `src/features/auth/queries.ts`)
- ~~No GDPR account deletion endpoint~~ → Fixed (T4: `DELETE /api/user` + `deleteUserAccount(userId)` + `deleteUserMedia(keys[])` in `src/lib/storage/r2.ts` via `DeleteObjectsCommand`)
- ~~Navbar/dashboard/hero/CTAs use raw `<a href>`~~ → Fixed (T5: all 9 files migrated to `<Link>`; `mailto:` + hash anchors kept as `<a>`)
- ~~`/pricing`, `/blog`, `/contact` return 200 with marketing title~~ → Fixed (T6: 3 new Server Component pages with proper metadata)
- ~~No custom `not-found.tsx`~~ → Fixed (T7: Server Component 404 with on-brand UX + `<Link>` CTAs)
- ~~No cookie consent banner~~ → Fixed (T8: `src/components/app/cookie-banner.tsx` mounted in `src/app/layout.tsx`; uses `useSyncExternalStore` for SSR safety)
- ~~E2E tests not in CI~~ → Fixed (T9: second `e2e` job in `.github/workflows/ci.yml` with Postgres 17 service container; `continue-on-error: true` initially)

**Sprint 3 test count: 396 → 479 unit tests (+83 new, 0 regressions). Route count: 15 → 22. All 9 tasks TDD with RED → GREEN → VERIFY.**

## Recommendations

### Immediate (before any deploy)
1. **Provision all external services** — Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2 (3 buckets), Stripe, Inngest, Resend, **Upstash** (required for rate limiting), Sentry.
2. **Run `pnpm drizzle:generate && pnpm drizzle:migrate`** — create the database schema. **⚠️ 4 new migrations (0001-0004) from the remediation sprint. Migration 0001 requires pre-cleanup of duplicate video/voiceover rows.**
3. **Configure Stripe products** — create 4 tiers (Free/Creator/Pro/Studio), update `PRICE_IDS`.
4. **Set `REPLICATE_SDXL_IPADAPTER_MODEL` env var** — the default is the SDXL base placeholder. Without a real `lucataco/sdxl-ipadapter:<sha>` hash, scene generation won't apply character consistency. **C2 fix: `replicate.ts` now emits a `console.warn` in production when the placeholder is detected.** (T4)
5. **Set `AUTH_URL` AND `NEXT_PUBLIC_APP_URL` to the production URL** — both must point to `https://storyintovideo.jesspete.shop` (or your production domain). The `trustHost: true` config (T2) makes Auth.js use the request's Host header as a fallback, but the proxy redirect uses `env.NEXT_PUBLIC_APP_URL` directly. If `NEXT_PUBLIC_APP_URL=http://localhost:3000` leaks to production, every auth-protected route redirect will go to localhost → `ERR_CONNECTION_REFUSED`. ⚠️ **Sprint 3 T1 now fail-fast prevents this**: if the two hosts differ in production runtime, the app refuses to boot with `❌ Host mismatch in environment variables`. The live-site incident is no longer reproducible after T1 deploys.
6. **Test the AI pipeline end-to-end** — sign up (C1 fix: now works via `signUpAction`), paste a story, verify characters/scenes/video generate. This is the highest-risk validation.
7. **Run `pnpm install` to activate husky** — the `prepare` script sets up `.husky/pre-commit`. Verify the hook fires on your first commit.
8. **Add a post-deploy smoke test** — hit `/api/health` and assert (a) HTTP 200, (b) `status === 'healthy'`, AND (c) `config.healthy === true` with empty `configErrors` (Sprint 3 T2 surfaces AUTH_URL ↔ NEXT_PUBLIC_APP_URL mismatch here — it does NOT trigger 503). Also hit `/dashboard` while unauthenticated (expect 307 redirect to `/sign-in` on the SAME host, NOT `localhost:3000`). With Sprint 3 T1 deployed, a host mismatch would refuse to boot — so reaching `/api/health` at all implies T1 passed.

### Short-term (first sprint post-launch)
9. ~~**Add rate limiting**~~ → **DONE (C3)** — Upstash Ratelimit on auth, pipeline, SSE. Env vars in schema; `src/lib/rate-limit.ts` implemented.
10. ~~**Implement GDPR endpoints**~~ → **DONE (Sprint 3 T3 + T4)** — `GET /api/user/export` (T3) + `DELETE /api/user` (T4) implemented. `deleteUserAccount(userId)` lives in `src/features/auth/queries.ts`; `deleteUserMedia(keys[])` lives in `src/lib/storage/r2.ts` (uses `DeleteObjectsCommand`, 1000-key batches, tries all 3 buckets per key). DB cascade was already wired; the API surface is now in place.
11. ~~**Implement `/pricing`, `/blog`, `/contact`** pages~~ → **DONE (Sprint 3 T6 + T7)** — all 3 pages implemented as Server Components with metadata (T6). Custom `not-found.tsx` (T7) covers any future dead links.
12. ~~**Add cookie consent banner**~~ → **DONE (Sprint 3 T8)** — `src/components/app/cookie-banner.tsx` mounted in `src/app/layout.tsx`. Uses `useSyncExternalStore` (SSR-safe — server snapshot returns false to avoid hydration mismatch). Dismissible informational banner (NOT a consent gate — the app uses only essential cookies: session + CSRF). Persists acknowledgement to `localStorage` under `siv-cookie-consent`.
13. ~~**H2 — Brand color full replacement**~~ → **DONE (T11)** — `sed` sweep across 45 files replaced `amber-300/400/500/600` → `primary`, `bg-zinc-950` → `bg-background`, `bg-zinc-900` → `bg-card`, `bg-black` → `bg-background`. `brand-tokens.test.ts` now enforces 0 violations.
14. **H5 — FFmpeg stream-to-R2** — refactor `assemble-video.ts` to pipe FFmpeg output directly to R2 via `@aws-sdk/lib-storage` `Upload` class. Eliminates `/tmp` OOM risk. Dep installed.
15. ~~**Replace internal `<a href>` with `<Link>`**~~ → **DONE (Sprint 3 T5)** — all 9 affected files now use `<Link>`. `mailto:` + hash anchors intentionally kept as `<a>`.
16. ~~**Promote env host-mismatch warning to a thrown error in production**~~ → **DONE (Sprint 3 T1 + T2)** — `src/lib/env/index.ts` now throws at boot when `AUTH_URL` and `NEXT_PUBLIC_APP_URL` hosts differ in production runtime (dev/test keep the warn-only behavior). `/api/health` also surfaces the mismatch via `config` + `configErrors` (T2).

### Medium-term (scale + compliance)
17. ~~**Add E2E tests to CI**~~ → **DONE (Sprint 3 T9)** — `e2e` job added to `.github/workflows/ci.yml` with Postgres 17-alpine service container, FFmpeg install, drizzle migrations + seed, Playwright Chromium install, and report upload artifact. `continue-on-error: true` initially — flip to required once stable.
18. **Add monitoring** — Sentry (errors), Vercel Analytics (product), Axiom (logs).
19. **Visual regression testing** — Playwright screenshot comparison against live site.
20. **Bundle size monitoring** — `next/bundle-analyzer`.
21. **Add the interactive timeline editor** — the post-MVP feature (Remotion-based). Deferred per the blueprint.
22. **Run the pre-launch checklist** — `PRODUCTION_READINESS_PLAN.md` §8 before going live.

## Anti-Patterns to Avoid

- **Do not add `tailwind.config.ts`** — all tokens belong in `globals.css` `@theme`
- **Do not use `next/font/google` for Outfit** — it can't serve weight 820
- **Do not use Framer Motion or GSAP** — all animation is CSS-only
- **Do not use camelCase keyframes** — kebab-case is the modern convention
- **Do not read `process.env.*` directly** — use the Zod-validated `env` module
- **Do not wrap `verifySession()` in try/catch** — it throws `NEXT_REDIRECT` which must propagate
- **Do not put DB access in components** — use the `queries.ts` boundary
- **Do not put DB access in middleware** — middleware runs on Edge runtime
- **Do not make R2 buckets public** — use signed URLs
- **Do not skip content moderation** — every story input must be moderated (ADR-011)
- **Do not use `force-static` on app routes** — only the marketing page can be static
- **Do not use `any`** — ESLint will error. Use `unknown` or proper types
- **Do not add CDN links** — all assets are self-hosted
- **Do not use default exports for components** — use named exports
- **Do not skip the verification chain** — `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
- **Do not use `db push` in production** — always `drizzle-kit generate` + `migrate`

## Remediation Sprint 2 (Post-Review Hardening)

The following changes were applied after a meticulous code review identified
critical/high/medium gaps. Every change follows TDD (RED → GREEN → REFACTOR)
and the verification chain passes clean.

### New Environment Variables (all optional)

| Var | Default | Purpose |
|---|---|---|
| `REPLICATE_SDXL_MODEL` | `stability-ai/sdxl:39ed52f2...` | Override the SDXL base model used for character portraits |
| `REPLICATE_SDXL_IPADAPTER_MODEL` | `stability-ai/sdxl:39ed52f2...` (PLACEHOLDER) | Override the IP-Adapter model used for scene generation. **⚠️ Operators must set this to a real `lucataco/sdxl-ipadapter:<sha>` before character consistency will work.** |
| `IMAGE_MODERATION_FAIL_OPEN` | `true` | When `false`, `moderateImage` fails CLOSED on unknown output shapes (returns `flagged:true` with `categories:['unknown-output-shape']`). Recommended for production launches. |

### Code-Level Fixes

1. **`trustHost: true` on NextAuth config** — Auth.js v5 now uses the
   incoming request's Host header instead of `AUTH_URL`. Fixes the P0
   production outage where the live site redirected auth callbacks to
   `http://localhost:3000`. (T2)
2. **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch warning** — The env
   module emits a `console.warn` at module load when the two hosts differ
   in dev/test. **In production runtime (Sprint 3 T1), the warning is
   promoted to a thrown error — the app refuses to boot.** With
   `trustHost: true` (T2) the auth callbacks themselves aren't broken,
   but AUTH_URL is still used for email magic links etc. — operators
   should ensure both env vars point to the same production host.
3. **`SignedDownloadWrapper` deleted (H4 fix)** — Was inline in
   `projects/[id]/page.tsx`, then extracted to its own file, then DELETED
   entirely when the H4 fix replaced server-side URL signing with click-time
   signing via `/api/projects/[id]/download`. The client component
   (`project-download-button.tsx`) now fetches the signed URL at click time.
   App component count is 8 (Sprint 3 T8 added `cookie-banner.tsx`). (T1 → H4 → T8)
4. **SDXL model IDs moved to env vars** — Both `SDXL_MODEL` and
   `SDXL_IPADAPTER_MODEL` are now read from the validated `env` module.
   The Zod schema validates the `owner/model:sha` format — typos fail fast
   at module load. The placeholder IP-Adapter hash
   (`6f288a8d-7e5e-4f0c-8b3f-3e1f3e6e3e3e`) was replaced with the SDXL
   base model + an explicit operator warning. (T4)
5. **`moderationSkipped` field on `ImageModerationResult`** — The fail-open
   bypass is now observable. A `console.warn` is emitted on every skip.
   The policy is env-configurable via `IMAGE_MODERATION_FAIL_OPEN`. (T5)
6. **SSE reconnect with exponential backoff** — `useProjectProgress` now
   reopens the EventSource after errors, with 1s → 2s → 4s backoff, up to
   3 attempts. New `connectionState: 'reconnecting'` value surfaces in the
   UI as "Reconnecting to live updates…". `maxDuration` on the SSE route
   set to 800 (Vercel Pro/Enterprise GA ceiling under Fluid Compute; the
   earlier value of 900 exceeded the GA limit and silently fell back to
   the platform default). (T6)
7. **`putObject` size guard** — `MAX_PUT_OBJECT_BYTES = 500 MB` constant +
   `PayloadTooLargeError` thrown when exceeded. R2's hard limit is 5 GB,
   but function memory is the real constraint. The guard fails fast with
   a clear message instead of an opaque OOM. (T7)
8. **GitHub Actions CI** — `.github/workflows/ci.yml` runs
   `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every push
   to main and every PR. pnpm store cache keyed on lockfile hash. **Sprint 3
   T9 added a second `e2e` job (Playwright + Postgres 17 service container,
   `continue-on-error: true` initially) gated on the quality-gate job passing.**
   (T8 + T9)
9. **`pnpm-workspace.yaml` fixed** — Added the missing `packages: ['.']`
   field. Fresh clones with pnpm 9+ were failing with
   `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION  packages field missing or empty`.
   (T0)

### What Was Investigated But Not Fixed (No Code Change Needed)

- **`OPENAI_API_KEY` Zod validation too strict** — Investigation revealed
   that `startsWith('sk-')` already accepts all modern OpenAI key prefixes
   (`sk-proj-`, `sk-svcacct-`, `sk-admin-`) since they all literally start
   with `sk-`. The original concern was unfounded. 5 regression-guard tests
   were added to lock this behavior in. (T3)

## Reference Documents

| Document | Role |
|---|---|
| `Project_Requirements_Document.md` | Canonical marketing spec (v2.0, 2718 lines, field-verified) |
| `PRODUCTION_READINESS_PLAN.md` | Engineering blueprint (11 ADRs, 27 TDD task cards, risk register, pre-launch checklist) |
| `MASTER_EXECUTION_PLAN.md` | Marketing clone execution record (8 phases, 15 decisions, 20 risks) |
| `AGENTS.md` | Compact agent instructions (stack, colors, interactions) |
| `README.md` | Quick start, architecture, design system summary |
| `deviation_report_validation.md` | Validation of the deviation report (1 genuine gap + 1 enhancement) |

## Success Criteria

You are successful when:

- `pnpm lint` exits with 0 warnings
- `pnpm typecheck` exits with 0 errors
- `pnpm test` passes all 479 unit tests
- `pnpm test:e2e` passes all 48 E2E tests (requires Playwright browsers installed)
- `pnpm build` exits with 0 errors
- Lighthouse scores ≥95 across Performance, Accessibility, Best Practices, SEO (marketing page)
- The marketing page is visually indistinguishable from `storyintovideo.com` at 1440×900
- The full pipeline works end-to-end: signup → paste story → AI generates video → download
- All external services are provisioned and `.env.local` is complete
- The pre-launch checklist (`PRODUCTION_READINESS_PLAN.md` §8) is fully checked
