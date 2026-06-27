# StoryIntoVideo — Agent Instructions

## Project Overview

Production SaaS for an AI-powered story-into-video generator. Originally a pixel-accurate static clone of `https://storyintovideo.com/` (luxury-dark, cinematic marketing site); now a hybrid Next.js app with full backend: **auth, database, AI pipeline, billing.** The marketing front end is preserved verbatim; the production app layer is built behind it.

## Stack (Locked)

```
Next.js 16 · React 19 · Tailwind CSS v4 (CSS-first @theme) · shadcn/ui · next/font
Geist Sans (body) + Geist Mono (accents) + Outfit (display headings, weight 820)
Lucide React icons · class-variance-authority + clsx + tailwind-merge
Auth.js v5 (NextAuth) + @auth/drizzle-adapter · Drizzle ORM + PostgreSQL (Neon)
Inngest (job queue) · OpenAI GPT-4o + Whisper + Moderation · Replicate SDXL + IP-Adapter
ElevenLabs (TTS) · Cloudflare R2 (storage) · Stripe (billing) · Zod (validation)
FFmpeg (system binary, `FFMPEG_PATH` env var) · bcryptjs (password hashing)
```

## Critical Design Decisions

| Decision | Why |
|---|---|
| Tailwind v4 `@theme` block in `globals.css`, NOT `tailwind.config.ts` | CSS-first is the future direction; PRD ships both, prefer `@theme` |
| Outfit weight **820** via `next/font/local` (not `/google`) | `/google` only serves discrete weights; PRD specifies 820 explicitly |
| Amber is `#febf00` (not Tailwind's `amber-400` = `#fbbf24`) | These are different colors; use custom `--color-primary: #febf00` |
| All animation is CSS `@keyframes` only — no Framer Motion | Matches live site; critical for Lighthouse ≥95 |
| Hybrid rendering (was `force-static`, now removed) | Marketing page stays static; app routes are dynamic; API routes are `force-dynamic` |
| 5-layer architecture (middleware → app → features → domain → lib) | Security + consistency. Lower layers never import from higher layers. |
| Auth-first Server Actions (`verifySession()` before any logic) | Prevents unauthenticated mutations. Never wrap in try/catch. |
| `queries.ts` boundary (all DB access through feature-level queries) | Components never call `db` directly. Enables testing + future swap. |
| Drizzle ORM (not Prisma) | Matches `nextjs16-react19-postgres17` skill; SQL-first; lighter runtime |
| Zod env validation (never `process.env.*` directly) | Catches typos at module load; fails fast on misconfigured deploys |
| Credit-based billing (prepaid credits, not metered) | Simplest for AI products; no overage risk; predictable revenue |
| Inngest for pipeline orchestration (not BullMQ) | Serverless-native; step functions map to 6-step workflow; no Redis |
| System FFmpeg (not `@ffmpeg-installer/ffmpeg`) | Turbopack-incompatible; `FFMPEG_PATH` env var with `/usr/bin/ffmpeg` default |
| Server-side URL signing | Client components NEVER import `r2.ts`; Server Components sign URLs, pass as props |

## Color System (Non-Negotiable)

```
Background:    #020202  (near-black, warm-neutral — NOT pure #000)
Primary/Amber: #febf00  (CTAs, active states, focus rings, accents)
Surface:       #060607  (cards)
Muted text:    #8e8e95  (zinc-400 equivalent)
Body text:     #d4d4d8  (zinc-300)
```

Full semantic token table lives in `Project_Requirements_Document.md` §1.2.

## Typography

| Element | Class | Weight | Tracking |
|---|---|---|---|
| H1 (hero desktop) | `font-heading text-[4.5rem]` | **820** | `-0.04em` |
| H1 (hero mobile) | `text-4xl` | 820 | scales with `em` |
| H2 (sections) | `font-heading text-4xl lg:text-6xl` | 700 | `-0.03em` |
| Body | `font-sans text-lg` | 400 | normal |
| Ratio toggles | `font-mono text-[10px]` | 400 | — |

## The 5-Layer Architecture (Golden Rule)

```
Layer 0: src/proxy.ts             — Cookie check, redirect. NO DB. NO logic. Edge runtime.
Layer 1: src/app/                 — Route structure, metadata, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (auth, projects, pipeline, billing)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers. Side effects only.
```

**Golden Rule:** A lower layer may never import from a higher layer.

## File Structure

```
src/
├── app/                          # Layer 1: App Router
│   ├── (auth)/sign-in|sign-up/page.tsx     # Auth pages (AuthForm)
│   ├── (app)/                              # Authenticated app (middleware-protected)
│   │   ├── dashboard/page.tsx              # Project list (Suspense + empty state)
│   │   ├── create/page.tsx                 # Create wizard (story input)
│   │   ├── projects/[id]/page.tsx          # Project detail + pipeline status
│   │   └── billing/page.tsx                # 4-tier plan table
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts     # Auth.js (force-dynamic)
│   │   ├── inngest/route.ts                # Inngest webhook (force-dynamic)
│   │   └── stripe/webhook/route.ts         # Stripe webhook (force-dynamic)
│   ├── layout.tsx                # Root: fonts, metadata, Providers, skip-to-content
│   ├── page.tsx                  # Marketing page (10 sections, unchanged)
│   ├── globals.css               # @theme + 13 keyframes + @utility + a11y
│   └── icon.tsx
├── components/
│   ├── primitives/               # Marketing presentational (7 files)
│   ├── sections/                 # Marketing page sections (10 files)
│   ├── ui/                       # Hand-written shadcn (4: button, accordion, sheet, dropdown-menu)
│   └── app/                      # App components (4: auth-form, create-wizard, empty-state, providers)
├── features/                     # Layer 2 + 3: Feature modules
│   ├── auth/domain/verify-session.ts       # DAL auth function (throws NEXT_REDIRECT)
│   ├── projects/{queries,actions}.ts       # getUserProjects, createProjectAction
│   ├── pipeline/
│   │   ├── queries.ts                      # appendCharacter, appendScene, updateProjectProgress
│   │   ├── inngest.ts                      # 6-step pipeline function
│   │   └── domain/                         # Pure functions (6 files: analyze, moderate, generate-*, synthesize, align, assemble)
│   └── billing/{queries,actions,domain/tier-limits}.ts
├── lib/                          # Layer 4: Infrastructure
│   ├── db/{index,schema/*}.ts              # Drizzle client + schema (11 tables, 8 enums)
│   ├── env/index.ts                        # Zod-validated env (CRITICAL: never process.env.*)
│   ├── auth/{config,index}.ts              # Auth.js v5 (Google + Credentials + Drizzle adapter)
│   ├── ai/{openai,replicate,elevenlabs}.ts # AI provider clients
│   ├── inngest/{client,functions}.ts       # Inngest client + registrations
│   ├── storage/r2.ts                       # R2 signed URLs (3 buckets) — NEVER import in client components
│   ├── stripe/client.ts                    # Stripe SDK + PRICE_IDS
│   ├── data/                               # Static marketing data (10 files)
│   ├── hooks/                              # use-scrolled, use-reveal, use-reduced-motion, use-project-progress
│   ├── fonts.ts · utils.ts
├── tests/
│   ├── unit/                     # 33 files, 259 tests
│   ├── e2e/                      # 9 files, 48 tests
│   └── setup.ts                  # jest-dom + test env vars
├── types/index.ts                # 12 marketing interfaces
└── proxy.ts                      # Layer 0: route protection (Edge runtime)

.husky/
└── pre-commit                    # Runs `pnpm lint-staged` on staged files
```

## Routes (14 total)

| Route | Type | Purpose |
|---|---|---|
| `/` | ○ Static | Marketing page (10 sections) |
| `/sign-in`, `/sign-up` | ○ Static | Auth (Google + email/password) |
| `/dashboard` | ƒ Dynamic | Project list (auth-protected) |
| `/create` | ○ Static | Create wizard (auth-protected) |
| `/projects/[id]` | ƒ Dynamic | Project detail + live pipeline status (SSE) |
| `/billing` | ○ Static | Plan table + upgrade |
| `/privacy` | ○ Static | Privacy Policy (mandatory for launch) |
| `/terms` | ○ Static | Terms of Service (mandatory for launch) |
| `/api/auth/[...nextauth]` | ƒ Dynamic | Auth.js catch-all |
| `/api/inngest` | ƒ Dynamic | Pipeline webhook |
| `/api/stripe/webhook` | ƒ Dynamic | Billing webhook |
| `/api/projects/[id]/progress` | ƒ Dynamic | SSE progress stream (2s polling, owner-checked) |
| `/api/health` | ƒ Dynamic | Health check (returns `{ status: 'ok' }`) |
| Middleware | ƒ Proxy | Protects `/dashboard`, `/create`, `/settings`, `/billing` |

## Build & Quality Commands (Actual)

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build (hybrid: static + dynamic)
pnpm lint         # eslint . (flat config)
pnpm typecheck    # tsc --noEmit (strict + noUncheckedIndexedAccess)
pnpm test         # vitest run (259 unit tests, jsdom)
pnpm test:e2e     # playwright test (48 E2E tests, Chromium, auto-starts dev)
pnpm format       # prettier --write
pnpm format:check # prettier --check
pnpm drizzle-kit generate   # Create migration SQL from schema diff
pnpm drizzle-kit migrate    # Apply migrations (needs DATABASE_URL_UNPOOLED)
pnpm drizzle-kit studio     # Schema browser
```

**Pre-commit chain:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. **husky + lint-staged** auto-runs ESLint + Prettier on staged `.ts/.tsx` files via `.husky/pre-commit` (activated by `pnpm install` via the `prepare` script).

## Component Contracts (TypeScript)

All components use `interface` (not `type` for object shapes), zero `any`. Critical rules:

- `'use client'` only for: Navbar, Hero, Examples, Faq, Workflow, ScrollReveal (marketing); AuthForm, CreateWizard, Providers, ProjectProgressPanel, ProjectDownloadButton, ProjectShareButton (app)
- Server components by default: Features, Testimonials, UseCases, FinalCta, Footer (marketing); dashboard, project detail, billing, privacy, terms pages (app)
- `next/image` for all raster images, `next/font` for all fonts
- **Auth-first Server Actions:** every action starts with `verifySession()` before any logic
- **`queries.ts` boundary:** all DB access through feature-level queries files; components never call `db`
- **Domain isolation:** `src/features/*/domain/` contains pure functions — no Next.js or DB runtime imports

## Auth Patterns (CRITICAL)

- **`verifySession()`** — `src/features/auth/domain/verify-session.ts`. Returns session or throws `NEXT_REDIRECT`. **Never wrap in try/catch.**
- **API routes use `auth()` directly** — returns null → 401 JSON. Do NOT use `verifySession()` in API routes.
- **Middleware** — `src/proxy.ts` exports `auth` as default (Auth.js v5 pattern). Checks cookie presence only; Edge runtime can't access DB.
- **`AUTH_SECRET`** — read from `env` module, never `process.env.AUTH_SECRET`.

## AI Pipeline (Inngest, 6 Steps — fully wired)

```
Step 0: Moderate story (OpenAI Moderation API — block if flagged)
Step 1: Analyze story (GPT-4o JSON mode → characters + scenes)
Step 2: Generate characters (Replicate SDXL → moderateImage per ADR-011)
Step 3: Generate scenes (Replicate SDXL + IP-Adapter → moderateImage per ADR-011)
Step 4: Synthesize voiceover (ElevenLabs TTS → R2 putObject → appendVoiceover)
Step 5: Align subtitles (fetch audio from R2 → Whisper ASR → SRT → R2 → updateVideoSubtitle)
Step 6: Assemble video (FFmpeg via `getFfmpegPath()` → R2 putObject('videos') → appendVideo)
Final: Mark status='completed', progressPercent=100
```

Each step is idempotent (Inngest retries), debits credits (analysis=5, char=10, scene=8, voiceover=15, subtitle_alignment=3, video_assembly=30), updates `project.status` + `progressDetail`. `createProjectAction` triggers the pipeline via `inngest.send({ name: PIPELINE_EVENT, data: { projectId } })` after the DB insert. Image moderation (Steps 2 & 3) parses Replicate's `safety_concept` / `api_safety_concept` fields. Fail-open policy is env-configurable via `IMAGE_MODERATION_FAIL_OPEN` (default `true`; set to `false` for production fail-closed). The `moderationSkipped` field makes bypasses observable. (T5)

## Marketing Section Order (Top → Bottom, Fixed)

1. Navbar (fixed overlay) → 2. Hero → 3. Examples → 4. Workflow → 5. Features → 6. Testimonials → 7. Use Cases → 8. FAQ → 9. Final CTA → 10. Footer

## Interaction Inventory

| Component | Interaction | Mechanism |
|---|---|---|
| Navbar | Scroll-aware bg | `useScrolled` hook → `bg-zinc-950/70 backdrop-blur-[24px]` |
| Navbar | Mobile hamburger → Sheet | shadcn Sheet (right-side) |
| Navbar | Language switcher → Dropdown | shadcn DropdownMenu (decorative — no i18n) |
| Hero | Textarea focus glow | `focus-within:` on parent wrapper |
| Hero | Story chip click → populate textarea | `useState` |
| Hero | Character counter | `{story.length} / 500`, amber at ≥450 |
| Hero | Aspect ratio toggle | `aria-pressed` toggle buttons |
| Examples | Carousel arrow scroll | `scrollBy` / `scrollLeft` |
| FAQ | Expand/collapse | Radix Accordion (grid-template-rows: 0fr→1fr) |
| All sections | Scroll reveal | IntersectionObserver → `data-revealed` attr |
| AuthForm | Google OAuth + credentials | `signIn('google')` / `signIn('credentials')` |
| CreateWizard | Submit → createProjectAction | Server Action (auth-first, Zod, moderation, credits, **Inngest trigger**) |
| Dashboard | Project list | Suspense + Server Component + `getUserProjects()` |
| ProjectDetail | Live pipeline status | `ProjectProgressPanel` client component → SSE `/api/projects/[id]/progress` |
| ProjectDetail | Download completed video | `SignedDownloadWrapper` (Server) → `ProjectDownloadButton` (Client, receives `downloadUrl` prop) |
| ProjectDetail | Share project | `ProjectShareButton` → Web Share API + clipboard fallback |
| ProjectDetail | Download completed video | `ProjectDownloadButton` → signed R2 URL (1h expiry) |
| ProjectDetail | Share project | `ProjectShareButton` → Web Share API + clipboard fallback |

## 13 Keyframes (All CSS, in globals.css)

```
fade-in-up, float, glow-pulse, border-glow, composite-pulse-text,
shimmer, btn-shimmer, grid-shimmer, grid-sweep-h, grid-sweep-v,
scanline-scroll, lang-dropdown-in, marquee-scroll
```

## Accessibility Requirements

- Focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400`
- Skip-to-content link at page top
- Hero video: `aria-hidden="true"` (decorative)
- `prefers-reduced-motion: reduce` global override disables all animation
- Touch targets ≥44×44px on mobile (ratio toggle needs hit-area expansion)
- Color contrast: body text zinc-300 on zinc-950 = 12.6:1 (AAA)

## Performance Budget

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥95 (marketing page) |
| JS bundle | <150KB gzipped (app adds auth/db/ai client code) |
| CSS bundle | <30KB gzipped |
| Above-fold images | <500KB total |
| Videos preload | `metadata` only (not `auto`) |

## Common Pitfalls

### Marketing Layer (inherited)
1. **Pure black vs near-black:** Background is `#020202`, NOT `#000` or `#0a0a0a`
2. **Amber shades:** PRD amber (`#febf00`) ≠ Tailwind amber-400 (`#fbbf24`) — use custom token
3. **Outfit 820 missing from Google Fonts API:** Self-host via `next/font/local`
4. **Feature grid uses hairline borders, not cards:** Cards share a continuous surface separated by `border-neutral-800`
5. **Examples hover gradient is the ONLY purple on the entire site:** `bg-gradient-to-r from-yellow-500 to-purple-500` on card hover
6. **CTA hierarchy is deliberate:** Ghost link → glass pill → gradient pill → solid amber (ration the amber accent)
7. **Geist Mono for ratio toggles, NOT Geist Sans:** `font-mono text-[10px]` for 9:16/16:9 buttons

### Production App Layer (new)
8. **`verifySession()` must not be wrapped in try/catch** — it throws `NEXT_REDIRECT` which must propagate
9. **`process.env.*` is forbidden** — always import `env` from `@/lib/env`
10. **Zod `.url()` rejects `postgresql://`** — use `.refine()` with postgres scheme check for `DATABASE_URL`
11. **Build fails without env vars** — env module has a build-context fallback (placeholders when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`)
12. **Auth route handler must be `force-dynamic`** — prevents prerender failure (DrizzleAdapter needs env vars)
13. **Inngest v4 `createFunction` signature** — trigger is in config object (`triggers: [{ event: '...' }]`), NOT a second argument
14. **Stripe SDK v22+ uses camelCase** — `currentPeriodEnd` not `current_period_end`
15. **ElevenLabs returns `Readable`, not `ReadableStream`** — `streamToBuffer` duck-types the input
16. **Buffer → Blob requires `new Uint8Array(buffer)`** — `new File([audioBuffer], ...)` fails TypeScript strict
17. **`NODE_ENV` is read-only in tests** — use `vi.stubEnv('NODE_ENV', 'test')`
18. **Middleware runs on Edge** — no DB access, no Node.js APIs
19. **esbuild build scripts need approval** — add to `onlyBuiltDependencies` in `pnpm-workspace.yaml`

### Remediation Sprint (pipeline wiring + UX + compliance)
20. **Vitest mock factories are hoisted** — `vi.mock()` factories are lifted above imports. Use `vi.hoisted()` for any `vi.fn()` referenced inside the factory. Symptom: `Cannot access 'X' before initialization`.
21. **Mock constructors need `class` syntax** — `new S3Client(...)` requires the mock to be `new`-able. Arrow functions throw `"X is not a constructor"`. Use `class MockS3Client { send = sendMock; }`.
22. **`.tsx` extension required for JSX tests** — oxc throws parse error for JSX in `*.test.ts`. Rename to `*.test.tsx`.
23. **`fetch()` in pipeline tests hits real DNS** — Steps 5 & 6 download audio/SRT from R2 via `fetch()`. Stub globally: `vi.stubGlobal('fetch', fetchMock)`.
24. **SSE routes use `auth()` not `verifySession()`** — `verifySession()` throws redirect (wrong for JSON/SSE). API routes use `auth()` → returns null → 401 JSON.
25. **SSE polling (2s) over LISTEN/NOTIFY** — serverless can't hold long-lived Postgres connections. Poll DB every 2s; close stream on terminal status (`completed`/`failed`).
26. **`EventSource` cleanup is mandatory** — `useEffect` must return `() => eventSource.close()`. Otherwise connection leaks across navigations.
27. **`getProject()` LEFT JOINs videos** — returns `videoKey`, `subtitleKey` (nullable). UI conditionally renders download button. Don't add a second DB round-trip.
28. **Client components must NEVER import `r2.ts` at module level** — env validation throws in browser where server-only env vars are undefined. Sign URLs in Server Components (`SignedDownloadWrapper`), pass as props. This is a P0 bug that breaks `/projects/[id]`.
29. **`@ffmpeg-installer/ffmpeg` incompatible with Turbopack** — replaced with system FFmpeg binary via `getFfmpegPath()`. Set `FFMPEG_PATH` env var if non-standard location.
30. **`middleware.ts` renamed to `proxy.ts` in Next.js 16** — functionality identical, only filename changes.
31. **`putObject` (pipeline) vs `getSignedUploadUrl` (client)** — pipeline steps have Buffer in memory → direct PUT. Client uploads use presigned URL → browser uploads directly to R2.
32. **`assemble-video.ts` temp file lifecycle** — writes SRT to `/tmp/siv-srt-<ts>.srt`, runs FFmpeg to `/tmp/siv-video-<ts>.mp4`, reads MP4 into Buffer, `unlink`s both. Never leak temp files.
33. **`moderateImage` fail-open policy** — unknown Replicate output shapes return `flagged:false` with `moderationSkipped:true`. Env-configurable via `IMAGE_MODERATION_FAIL_OPEN` (default `true`; set to `false` for production fail-closed). A `console.warn` is emitted on every skip so operators can detect the bypass. (T5)
34. **husky `prepare` script uses `|| true`** — prevents `pnpm install` from failing on first install. Don't remove.
35. **Source-reading tests must strip comments** — `src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')` before regex-matching, else docblocks trigger false positives.

### Remediation Sprint 2 (post-review hardening)
36. **`trustHost: true` is mandatory for reverse-proxy deployments** — without it, Auth.js v5 falls back to `AUTH_URL` for callback URLs. If `AUTH_URL=http://localhost:3000` leaks to production, auth redirects resolve to localhost → `ERR_CONNECTION_REFUSED`. This was a P0 production outage. (T2)
37. **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch warning** — the env module emits a `console.warn` at module load when the two hosts differ. With `trustHost: true` it's no longer fatal, but it should still be fixed. (T2)
38. **`OPENAI_API_KEY.startsWith('sk-')` is NOT too strict** — `sk-proj-*`, `sk-svcacct-*`, `sk-admin-*` all literally start with `sk-`. Investigation revealed the original concern was unfounded. 5 regression-guard tests added. (T3)
39. **Hardcoded third-party model IDs are an operational liability** — the placeholder `SDXL_IPADAPTER_MODEL` hash was a UUID-format string, not Replicate's 64-char hex SHA. Scene generation would have 404'd. Model IDs are now env-configurable with format validation. (T4)
40. **`putObject` needs a size guard** — `MAX_PUT_OBJECT_BYTES = 500 MB` + `PayloadTooLargeError`. R2's limit is 5 GB, but function memory is the real constraint. (T7)
41. **SSE needs both server-side and client-side resilience** — `maxDuration` raised 300 → 900 (T6) covers Vercel Pro. Client-side reconnect with exponential backoff (1s → 2s → 4s, max 3 attempts) handles Vercel Hobby's 300s cap. (T6)
42. **`pnpm-workspace.yaml` requires `packages:` field** — pnpm 9+ enforces this even for single-package repos. Fresh clones fail with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION`. Fix: `packages: ['.']`. (T0)
43. **CI runs the full quality gate** — `.github/workflows/ci.yml` runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every PR. lint-staged only checks staged files; CI catches whole-codebase regressions. (T8)

## What's Implemented vs. Outstanding

### ✅ Implemented (code layer — 259 unit tests + 48 E2E tests, all GREEN)
- Auth.js v5 (Google OAuth + Credentials, Drizzle adapter, JWT sessions, **`trustHost: true`** for reverse-proxy compatibility — T2)
- Drizzle schema (11 tables, 8 enums) + migration config
- `verifySession()` DAL + middleware route protection
- Sign-in / sign-up pages with shared AuthForm
- Dashboard with Suspense + empty state
- Create wizard (reuses Hero's glass-input pattern)
- `createProjectAction` Server Action (auth-first, Zod, moderation, credits, **Inngest trigger**)
- OpenAI integration (GPT-4o analysis, Moderation, Whisper ASR)
- Replicate integration (SDXL character + scene generation, IP-Adapter, **env-configurable model IDs** — T4)
- ElevenLabs TTS (chunked for long text)
- FFmpeg video assembly (rewritten — SRT temp file, inputOptions per image, Buffer readback, cleanup)
- Inngest 6-step pipeline function (**fully wired: Steps 0-6 + final completion**)
- Image moderation on generated characters + scenes (ADR-011 — `moderateImage` parses Replicate safety output, **`moderationSkipped` field + env-configurable fail-open via `IMAGE_MODERATION_FAIL_OPEN`** — T5)
- R2 storage layer (signed URLs + `putObject` for pipeline Buffer uploads, 3 buckets, **`MAX_PUT_OBJECT_BYTES = 500 MB` size guard + `PayloadTooLargeError`** — T7)
- Stripe (Checkout, Portal, webhook with signature verification + idempotency)
- Credit metering (transactional `debitCredits`, `InsufficientCreditsError`)
- Billing page (4-tier plan table)
- SSE progress stream (`/api/projects/[id]/progress` — 2s polling, owner-checked, **`maxDuration = 900` + client-side reconnect with exponential backoff** — T6)
- `useProjectProgress` client hook + `ProjectProgressPanel` (live progress bar, **reconnect UI state** — T6)
- Download button (signed R2 URL, **server-side signing via `SignedDownloadWrapper` Server Component extracted to its own file** — T1) + Share button (Web Share API + clipboard fallback)
- `getProject()` LEFT JOINs videos — returns `videoKey` for conditional download render
- `getFfmpegPath()` helper — resolves FFmpeg binary from `FFMPEG_PATH` env var (default `/usr/bin/ffmpeg`)
- **Client components never import `r2.ts` at module level** — prevents env validation crash in browser
- Privacy Policy + Terms of Service pages (Server Components, AI-specific clauses)
- All 14 marketing CTAs wired to real routes
- husky + lint-staged pre-commit hook (`.husky/pre-commit`)
- **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch warning** at module load — T2
- **GitHub Actions CI** (`.github/workflows/ci.yml`) running lint + typecheck + test + build on every PR — T8
- **`pnpm-workspace.yaml` fixed** with `packages: ['.']` field for pnpm 9+ compatibility — T0
- 259 unit tests (33 files) + 48 E2E tests (9 files)

### ⚠️ Outstanding (requires external resources / not yet done)
- **External service credentials** — Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2, Stripe, Inngest, Resend, Upstash, Sentry (fill `.env.local` from `.env.example`)
- **Database migrations applied** — run `pnpm drizzle-kit generate && migrate` against real Neon
- **Stripe products configured** — `PRICE_IDS` in `src/lib/stripe/client.ts` are placeholders
- **Replicate IP-Adapter model hash** — `REPLICATE_SDXL_IPADAPTER_MODEL` env var must be set to a real `lucataco/sdxl-ipadapter:<sha>` hash before character consistency will work. The default is the SDXL base model (a documented placeholder). (T4)
- **Character consistency validated end-to-end** — manual R&D test (Risk R1, highest-risk component). Code is wired; needs real API keys.
- **FFmpeg assembly validated end-to-end** — rewritten + unit-tested with mocked fluent-ffmpeg; needs real-world test with actual scene images + audio + SRT
- **Rate limiting** — Upstash Ratelimit on auth/AI/export (env vars already in schema; integration not done)
- **Monitoring** — Sentry, Vercel Analytics, Axiom not integrated (env var `SENTRY_DSN` in schema)
- **E2E tests in CI** — Playwright E2E not yet in the GitHub Actions workflow (needs Postgres service container + browser binaries + seeded data)
- **GDPR/CCPA** — cookie consent banner + data export/deletion endpoints not implemented (Privacy/Terms pages exist)
- **Other content pages** — `/pricing`, `/blog`, `/contact` linked but not implemented

### ✅ Recently Closed (remediation sprint 1 — pipeline wiring + UX + compliance)
- ~~Steps 4-6 not wired into Inngest~~ → Fixed
- ~~`inngest.send()` commented out~~ → Fixed
- ~~FFmpeg placeholder implementation~~ → Fixed (rewrite)
- ~~No SSE progress stream~~ → Fixed
- ~~No download/share~~ → Fixed
- ~~No image moderation (ADR-011)~~ → Fixed
- ~~No legal pages~~ → Fixed
- ~~No pre-commit hooks~~ → Fixed (husky + lint-staged)

### ✅ Recently Closed (remediation sprint 2 — post-review hardening)
- ~~P0: Auth redirects to `localhost:3000` in production~~ → Fixed (`trustHost: true` + AUTH_URL host-mismatch warning — T2)
- ~~`SignedDownloadWrapper` inline in page.tsx~~ → Fixed (extracted to its own file — T1)
- ~~`SDXL_IPADAPTER_MODEL` fake placeholder hash~~ → Fixed (env-configurable with format validation — T4)
- ~~`moderateImage` fail-open is silent~~ → Fixed (`moderationSkipped` field + env-configurable policy — T5)
- ~~SSE disconnects mid-pipeline (300s Vercel cap)~~ → Fixed (`maxDuration = 900` + client reconnect with exponential backoff — T6)
- ~~`putObject` accepts any buffer size~~ → Fixed (`MAX_PUT_OBJECT_BYTES = 500 MB` + `PayloadTooLargeError` — T7)
- ~~No CI/CD~~ → Fixed (GitHub Actions workflow — T8)
- ~~`pnpm-workspace.yaml` missing `packages:` field~~ → Fixed (T0)
- ~~`OPENAI_API_KEY` validation too strict~~ → Investigated, found unfounded (`sk-` prefix already accepts `sk-proj-`, `sk-svcacct-`, `sk-admin-`); 5 regression-guard tests added (T3)

## Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| E2E tests fail with "Executable doesn't exist" | Playwright browsers not installed | `pnpm exec playwright install` |
| Hydration mismatch console error | Grammarly extension injects `<body>` attributes | `suppressHydrationWarning` on `<html>` + `<body>` (already applied) |
| `next lint` command not found | Deprecated in Next.js 16 | Use `eslint .` directly |
| `shadcn` CLI times out | Registry fetch failure | Primitives are hand-written in `src/components/ui/` |
| Outfit weight 820 not rendering | Google Fonts API doesn't serve weight 820 | Must self-host via `next/font/local` (already done) |
| Tailwind classes not applying | Missing `@source` directives | Check `globals.css` has `@source '../components/**/*.{ts,tsx}'` |
| Cross-origin dev resource blocked | Next.js blocks `/_next/webpack-hmr` from non-localhost origins | Add origin to `allowedDevOrigins` in `next.config.ts` |
| Build fails: "Invalid environment variables" | Real env vars not in `.env.local` | Copy `.env.example` → `.env.local`, fill in real values |
| Build fails: "Failed to collect page data for /api/auth/[...nextauth]" | Auth route tries to prerender DrizzleAdapter | Ensure `export const dynamic = 'force-dynamic'` in route handler |
| `drizzle-kit generate` errors | `DATABASE_URL_UNPOOLED` not set | Set in `.env.local` (direct Neon connection, not pooled) |
| Inngest function not triggering | Not registered in `src/lib/inngest/functions.ts` | Add to the `functions` array |
| Stripe webhook 400 "Invalid signature" | Wrong secret or body parsed as JSON | Use `await req.text()` (not `.json()`); verify `STRIPE_WEBHOOK_SECRET` |
| `pnpm install` warns "Ignored build scripts: esbuild" | `pnpm-workspace.yaml` missing approval | Add `esbuild` to `onlyBuiltDependencies` |
| Tests fail: "Cannot find module 'next/server'" | jsdom can't load Next.js server modules | Mock `next-auth`, `next/navigation`, `@/lib/db` in tests |
| `replicate.run()` returns wrong shape | Model output type varies | Cast `as unknown as string[]`, check length before indexing |
| Tests fail: "Cannot access 'X' before initialization" | `vi.mock()` factory references outer `vi.fn()` | Use `vi.hoisted()`: `const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))` |
| Tests fail: "X is not a constructor" | Mock factory returns arrow fn, real code does `new X()` | Use `class` syntax: `class MockS3Client { send = sendMock; }` |
| Tests fail: "[PARSE_ERROR] Expected '>' but found 'Identifier'" | Test file has JSX but `.test.ts` extension | Rename to `*.test.tsx` |
| Pipeline tests fail: "fetch failed: ENOTFOUND r2.example.com" | Steps 5 & 6 use `fetch()` for R2 downloads | `vi.stubGlobal('fetch', fetchMock)` |
| SSE route returns 307 redirect instead of 401 JSON | Used `verifySession()` (redirects) instead of `auth()` | API routes use `auth()` directly: returns null → 401 JSON |
| SSE stream hangs / never closes | `controller.close()` not called on terminal status | Poll DB every 2s; close when `status ∈ {completed, failed}` |
| `EventSource` leaks across navigations | `useEffect` cleanup missing `eventSource.close()` | Return cleanup fn from `useEffect` |
| Project detail page shows "This page couldn't load" | Client component imports `r2.ts` at module level, triggering env validation crash in browser | **Never import `@/lib/storage/r2` in `'use client'` files.** Sign URLs in Server Components, pass as props. |
| `assemble-video` can't find FFmpeg binary | `@ffmpeg-installer/ffmpeg` removed; system FFmpeg not installed | `sudo apt install ffmpeg` (Ubuntu) or `brew install ffmpeg` (macOS). Set `FFMPEG_PATH` env var if non-standard. |
| husky pre-commit hook doesn't run | `pnpm install` didn't run `prepare` script | Run `pnpm install`; ensure `.husky/pre-commit` is executable |
| Auth redirects to `http://localhost:3000` in production | `AUTH_URL` env var set to localhost, OR reverse proxy doesn't forward `X-Forwarded-Host` | Set `AUTH_URL` to the production URL. The `trustHost: true` config (T2) makes Auth.js use the request's Host header as a fallback. The env module emits a `console.warn` when AUTH_URL and NEXT_PUBLIC_APP_URL hosts differ. |
| `pnpm install` fails with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION  packages field missing or empty` | `pnpm-workspace.yaml` missing `packages:` field (T0) | Add `packages: ['.']` to `pnpm-workspace.yaml` (already done in this repo) |
| `putObject` throws `PayloadTooLargeError` | Body exceeds `MAX_PUT_OBJECT_BYTES` (500 MB) | Use multipart upload via `CreateMultipartUploadCommand` for larger files. The 500 MB cap is intentional — function memory is the real constraint. (T7) |
| SSE stream disconnects after 300s (Vercel Hobby) | `maxDuration = 900` (T6) requires Vercel Pro | Upgrade to Vercel Pro OR rely on client-side reconnect (T6) which reopens after 1s/2s/4s backoff. UI shows "Reconnecting to live updates…" during reconnect. |
| Replicate scene generation 404s | `REPLICATE_SDXL_IPADAPTER_MODEL` is the SDXL base placeholder (T4 default) | Set `REPLICATE_SDXL_IPADAPTER_MODEL` env var to a real `lucataco/sdxl-ipadapter:<sha>` hash from replicate.com/explorer |
| Server log shows `[env] AUTH_URL host ("localhost:3000") differs from NEXT_PUBLIC_APP_URL host` | AUTH_URL and NEXT_PUBLIC_APP_URL point to different hosts | Set both to the same production URL. With `trustHost: true` (T2) this is no longer fatal, but should still be fixed (AUTH_URL is used for email magic links, etc.). |

## Lessons Learned

1. **`suppressHydrationWarning` on `<body>`** — Browser extensions inject attributes before React hydrates. `<html>` alone is insufficient.
2. **Workflow is `'use client'`** — Uses `useState` for video loading choreography. Don't assume server components for "mostly static" sections.
3. **Test counts drift from plans** — MEP planned 6+3, actual is now 259 unit + 48 E2E. Always verify against `pnpm test` output.
4. **File structure evolves** — `features/`, `lib/db/`, `lib/ai/`, `lib/auth/`, `lib/storage/`, `lib/inngest/`, `lib/stripe/`, `lib/env/` were created during production build. Update docs as you build.
5. **Playwright needs separate install** — `pnpm install` doesn't install browser binaries.
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
16. **Client components must NEVER import `r2.ts` at module level** — the `r2.ts` module imports `env` which validates all 28 env vars at module load. In the browser, only `NEXT_PUBLIC_*` vars exist — all server-only vars are `undefined`, causing "Invalid environment variables" crash. The fix: Server Component signs the URL, passes as prop to client component. This is a P0 bug that completely breaks the project detail page.
17. **Server-side URL signing pattern** — for any client component that needs data from server-only env vars (R2 signed URLs, Stripe secrets, etc.), the Server Component should fetch/compute the value and pass it as a prop. This is the recommended Next.js 16 pattern.
18. **`@ffmpeg-installer/ffmpeg` incompatible with Turbopack** — the package uses dynamic `require()` with runtime-constructed paths that produce `/ROOT/node_modules/...` under Turbopack. Replaced with system FFmpeg binary via `getFfmpegPath()` helper.
19. **`middleware.ts` renamed to `proxy.ts` in Next.js 16** — the file convention changed. Functionality identical, only filename changes.
20. **Vitest mock hoisting is the #1 test bug** — `vi.mock()` factories are hoisted above imports. Use `vi.hoisted()` for shared `vi.fn()` state. Symptom: `Cannot access 'X' before initialization`.
21. **Mock constructors must be `class`, not arrow fns** — `new S3Client(...)` requires `new`-able mock. Arrow fns throw `"X is not a constructor"`.
22. **SSE in Next.js 16** — `ReadableStream` + `text/event-stream` content-type + 2s DB polling. Simpler than Postgres LISTEN/NOTIFY for serverless.
23. **`auth()` vs `verifySession()` for API routes** — `verifySession()` throws redirect (wrong for JSON). API routes use `auth()` → null → 401 JSON.
24. **`EventSource` cleanup is non-negotiable** — `useEffect` must return `() => eventSource.close()`. Otherwise connection leaks.
25. **Image moderation via Replicate safety output** — zero extra API calls vs. OpenAI vision moderation. Fail-open policy is env-configurable via `IMAGE_MODERATION_FAIL_OPEN` (default `true`; set to `false` for production fail-closed). The `moderationSkipped` field makes bypasses observable. (T5)
26. **`getProject()` LEFT JOIN videos** — cheaper than two queries. UI uses `videoKey` for conditional download button render.
27. **`putObject` (pipeline) vs `getSignedUploadUrl` (client)** — pipeline has Buffer in memory → direct PUT. Client uploads use presigned URL.
28. **TDD exposed 4 latent defects in `assemble-video.ts`** — placeholder Buffer, missing SRT write, missing input options, brittle filter extraction. All discoverable only by writing tests first.
29. **Source-reading tests must strip comments** — `src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')` before regex, else docblocks trigger false positives.
30. **husky `prepare` script with `|| true` is intentional** — prevents `pnpm install` failure on first install. Don't remove.
31. **`middleware.ts` renamed to `proxy.ts` in Next.js 16** — the file convention changed to better reflect its role as a network boundary. Functionality is identical; only the filename changes. Run `npx @next/codemod@canary middleware-to-proxy .` or rename manually.
32. **`trustHost: true` is mandatory for reverse-proxy deployments** — without it, Auth.js v5 falls back to `AUTH_URL` for callback URLs. If `AUTH_URL=http://localhost:3000` leaks to production, auth redirects resolve to localhost → `ERR_CONNECTION_REFUSED`. This was a P0 production outage. (T2)
33. **Hardcoded third-party model IDs are an operational liability** — the placeholder `SDXL_IPADAPTER_MODEL` hash was a UUID-format string, not Replicate's 64-char hex SHA. Scene generation would have 404'd. Model IDs are now env-configurable with format validation. (T4)
34. **SSE needs both server-side and client-side resilience** — `maxDuration` raised 300 → 900 (T6) covers Vercel Pro. Client-side reconnect with exponential backoff (1s → 2s → 4s, max 3 attempts) handles Vercel Hobby's 300s cap. (T6)
35. **`putObject` needs a size guard** — `MAX_PUT_OBJECT_BYTES = 500 MB` + `PayloadTooLargeError`. R2's limit is 5 GB, but function memory is the real constraint. (T7)
36. **`pnpm-workspace.yaml` requires `packages:` field** — pnpm 9+ enforces this even for single-package repos. Fresh clones fail with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION`. Fix: `packages: ['.']`. (T0)
37. **CI runs the full quality gate** — `.github/workflows/ci.yml` runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every PR. lint-staged only checks staged files; CI catches whole-codebase regressions. (T8)

## Reference

- **Marketing spec:** `Project_Requirements_Document.md` (v2.0, 2718 lines, field-verified from live DOM)
- **Engineering blueprint:** `PRODUCTION_READINESS_PLAN.md` (11 ADRs, 27 TDD task cards, risk register, pre-launch checklist)
- **Marketing execution record:** `MASTER_EXECUTION_PLAN.md` (8 phases, 15 decisions, 20 risks)
- **Deviation validation:** `deviation_report_validation.md` (1 genuine gap + 1 enhancement found in the 26-claim report)

## Implementation Deviations (Post-Build)

### Marketing Layer (inherited from clone)
1. **`src/` directory convention** — app code in `src/` (per skill), not repo root as in PRD §6.1.
2. **Tailwind v4 `@theme` block** — all design tokens in `globals.css`. No `tailwind.config.ts`. Aligns with PRD §8.2.
3. **Kebab-case keyframes** — all 13 `@keyframes` normalized to kebab-case. PRD §9 camelCase and §8.1 kebab conflict; kebab wins.
4. **Outfit variable font self-hosted** — `next/font/local` pointing to `public/fonts/Outfit-VariableFont.woff2`. NOT `next/font/google`.
5. **ESLint flat config** — direct plugin imports, no FlatCompat (broken with ESLint 9.39+).
6. **shadcn/ui hand-written** — 4 components, CLI timed out.
7. **`next lint` deprecated** — `lint` script runs `eslint .` directly.

### Production App Layer (new)
8. **Hybrid rendering** (was `force-static`) — marketing page still static; app routes dynamic; API routes `force-dynamic`.
9. **Lazy env validation with build-context fallback** — Zod schema with placeholders when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`. At runtime, fails fast on missing/invalid vars.
10. **Eager Drizzle client with deferred connection** — `postgres()` doesn't connect until first query, so `src/lib/db/index.ts` can export a real (non-Proxy) db that DrizzleAdapter accepts.
11. **Auth route as `force-dynamic`** — prevents prerender failure (DrizzleAdapter needs env vars at module load).
12. **Stripe webhook dual camelCase/snake_case support** — `subscription.currentPeriodEnd ?? subscription.current_period_end` for SDK v22+ compatibility.

### Remediation Sprint 2 (post-review hardening)
13. **`trustHost: true` on NextAuth config** — Auth.js v5 now uses the incoming request's Host header instead of `AUTH_URL`. Fixes the P0 production outage where auth redirects resolved to `localhost:3000`. (T2)
14. **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch warning** — the env module emits a `console.warn` at module load when the two hosts differ. Not fatal with `trustHost: true`, but still a misconfiguration that should be fixed. (T2)
15. **`SignedDownloadWrapper` extracted to its own file** — was inline in `projects/[id]/page.tsx`. Now in `src/components/app/signed-download-wrapper.tsx` for independent testability + reuse. App component count is now 8 (matches documented count). (T1)
16. **SDXL model IDs moved to env vars** — `REPLICATE_SDXL_MODEL` and `REPLICATE_SDXL_IPADAPTER_MODEL` are now read from the validated `env` module. The Zod schema validates the `owner/model:sha` format. The placeholder IP-Adapter hash was replaced with the SDXL base model + an explicit operator warning. (T4)
17. **`moderationSkipped` field on `ImageModerationResult`** — the fail-open bypass is now observable. A `console.warn` is emitted on every skip. The policy is env-configurable via `IMAGE_MODERATION_FAIL_OPEN` (default `true`; set to `false` for production fail-closed). (T5)
18. **SSE reconnect with exponential backoff** — `useProjectProgress` reopens the EventSource after errors, with 1s → 2s → 4s backoff, up to 3 attempts. New `connectionState: 'reconnecting'` value surfaces in the UI as "Reconnecting to live updates…". `maxDuration` on the SSE route raised from 300 → 900 (Vercel Pro ceiling). (T6)
19. **`putObject` size guard** — `MAX_PUT_OBJECT_BYTES = 500 MB` constant + `PayloadTooLargeError` thrown when exceeded. R2's hard limit is 5 GB, but function memory is the real constraint. (T7)
20. **GitHub Actions CI** — `.github/workflows/ci.yml` runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every push to main and every PR. pnpm store cache keyed on lockfile hash. E2E tests not yet in CI (need Postgres service + Playwright browsers). (T8)
21. **`pnpm-workspace.yaml` fixed** — added the missing `packages: ['.']` field. Fresh clones with pnpm 9+ were failing with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION  packages field missing or empty`. (T0)

## Asset Pipeline

```bash
./scripts/download-assets.sh        # Download R2 workflow videos + posters (idempotent)
./scripts/generate-thumbnails.sh    # Generate 6 example thumbnails via z-ai CLI
pnpm drizzle-kit generate           # Create migration SQL from schema changes
pnpm drizzle-kit migrate            # Apply migrations to Neon (needs DATABASE_URL_UNPOOLED)
pnpm drizzle-kit studio             # Open schema browser
```
