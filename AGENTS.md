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
Upstash Ratelimit + Redis (rate limiting: auth, pipeline, SSE)
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
| Server-side URL signing → Click-time signing | Client components NEVER import `r2.ts`; H4 fix: download URL signed at click time via `/api/projects/[id]/download` API route (not SSR-time) |
| Idempotent credit debiting (C5) | `debitCredits()` requires `idempotencyKey` param; uses `ON CONFLICT DO NOTHING` + `.for('update')` row lock |
| Rate limiting (C3) | Upstash Ratelimit on auth (10/15min/IP), pipeline (5/min/user), SSE (1/user/project) |
| Secure defaults (H8) | `IMAGE_MODERATION_FAIL_OPEN` defaults to `'false'` (fail-closed) in production; `'true'` in dev |

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
│   │   ├── stripe/webhook/route.ts         # Stripe webhook (force-dynamic, idempotent via ON CONFLICT)
│   │   ├── projects/[id]/progress/route.ts # SSE progress stream (force-dynamic, rate-limited)
│   │   ├── projects/[id]/download/route.ts # Click-time R2 URL signing (H4 fix)
│   │   └── health/route.ts                 # Health check (DB + FFmpeg, H9 fix)
│   ├── layout.tsx                # Root: fonts, metadata, Providers, skip-to-content
│   ├── page.tsx                  # Marketing page (10 sections, unchanged)
│   ├── globals.css               # @theme + 13 keyframes + @utility + a11y
│   └── icon.tsx
├── components/
│   ├── primitives/               # Marketing presentational (7 files)
│   ├── sections/                 # Marketing page sections (10 files)
│   ├── ui/                       # Hand-written shadcn (4: button, accordion, sheet, dropdown-menu)
│   └── app/                      # App components (7: auth-form, create-wizard, empty-state, providers, project-progress-panel, project-download-button, project-share-button) — SignedDownloadWrapper DELETED (H4: replaced by click-time API route)
├── features/                     # Layer 2 + 3: Feature modules
│   ├── auth/{actions,domain/verify-session}.ts  # signUpAction (C1) + DAL auth function
│   ├── projects/{queries,actions}.ts       # getUserProjects, createProjectAction
│   ├── pipeline/
│   │   ├── queries.ts                      # appendCharacter, appendScene, updateProjectProgress
│   │   ├── inngest.ts                      # 6-step pipeline function
│   │   └── domain/                         # Pure functions (8 files: analyze, moderate-content, moderate-image, generate-character, generate-scene, synthesize-voice, align-subtitles, assemble-video)
│   └── billing/{queries,actions,domain/}  # queries: debitCredits + debitCreditsTx (T3); actions: checkoutAction + billingCheckoutAction (T1); domain: tier-limits.ts + extract-period-end.ts
├── lib/                          # Layer 4: Infrastructure
│   ├── db/{index,schema/*}.ts              # Drizzle client + schema (11 tables, 8 enums)
│   ├── env/index.ts                        # Zod-validated env (CRITICAL: never process.env.*)
│   ├── auth/{config,index}.ts              # Auth.js v5 (Google + Credentials + Drizzle adapter)
│   ├── ai/{openai,replicate,elevenlabs}.ts # AI provider clients
│   ├── inngest/{client,functions}.ts       # Inngest client + registrations
│   ├── storage/r2.ts                       # R2 signed URLs (3 buckets) — NEVER import in client components
│   ├── rate-limit.ts                       # Upstash Ratelimit clients (C3: auth, pipeline, SSE)
│   ├── stripe/client.ts                    # Stripe SDK + PRICE_IDS
│   ├── data/                               # Static marketing data (10 files)
│   ├── hooks/                              # use-scrolled, use-reveal, use-reduced-motion, use-project-progress
│   ├── fonts.ts · utils.ts
├── tests/
│   ├── unit/                     # 48 files, 396 tests
│   ├── e2e/                      # 9 files, 48 tests
│   └── setup.ts                  # jest-dom + test env vars
├── types/index.ts                # 12 marketing interfaces
└── proxy.ts                      # Layer 0: route protection (Edge runtime)

.husky/
└── pre-commit                    # Runs `pnpm lint-staged` on staged files
```

## Routes (15 total)

| Route | Type | Purpose |
|---|---|---|
| `/` | ○ Static | Marketing page (10 sections) |
| `/sign-in`, `/sign-up` | ○ Static | Auth (Google + email/password) |
| `/dashboard` | ƒ Dynamic | Project list (auth-protected) |
| `/create` | ○ Static | Create wizard (auth-protected) |
| `/projects/[id]` | ƒ Dynamic | Project detail + live pipeline status (SSE) |
| `/billing` | ○ Static | Plan table + upgrade (**T1: wired to `billingCheckoutAction` Server Action**) |
| `/privacy` | ○ Static | Privacy Policy (mandatory for launch) |
| `/terms` | ○ Static | Terms of Service (mandatory for launch) |
| `/api/auth/[...nextauth]` | ƒ Dynamic | Auth.js catch-all |
| `/api/inngest` | ƒ Dynamic | Pipeline webhook |
| `/api/stripe/webhook` | ƒ Dynamic | Billing webhook |
| `/api/projects/[id]/progress` | ƒ Dynamic | SSE progress stream (2s polling, owner-checked, **T5: `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` slot pattern**) |
| `/api/projects/[id]/download` | ƒ Dynamic | Click-time R2 URL signing (H4 fix — fresh signed URL per request; **T6: classifies R2 errors 502/504/500**) |
| `/api/health` | ƒ Dynamic | Health check (DB `SELECT 1` + FFmpeg `accessSync`, returns 503 if unhealthy — H9 fix) |
| Proxy | ƒ Proxy | Protects `/dashboard`, `/create`, `/settings`, `/billing`, `/projects` + Host header validation (H6) |

## Build & Quality Commands (Actual)

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build (hybrid: static + dynamic)
pnpm lint         # eslint . (flat config)
pnpm typecheck    # tsc --noEmit (strict + noUncheckedIndexedAccess)
pnpm test         # vitest run (396 unit tests, jsdom)
pnpm test:e2e     # playwright test (48 E2E tests, Chromium, auto-starts dev)
pnpm format       # prettier --write
pnpm format:check # prettier --check
pnpm drizzle:generate   # Create migration SQL from schema diff
pnpm drizzle:migrate    # Apply migrations (needs DATABASE_URL_UNPOOLED)
# NOTE: 4 new migrations (0001-0004) from the remediation sprint must be applied.
# ⚠️ Migration 0001 requires pre-cleanup: DELETE duplicate video/voiceover rows first.
pnpm drizzle-kit studio     # Schema browser
```

**Pre-commit chain:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. **husky + lint-staged** auto-runs ESLint + Prettier on staged `.ts/.tsx` files via `.husky/pre-commit` (activated by `pnpm install` via the `prepare` script).

## Component Contracts (TypeScript)

All components use `interface` (not `type` for object shapes), zero `any`. Critical rules:

- `'use client'` only for: Navbar, Hero, Examples, Faq, Workflow, ScrollReveal (marketing); AuthForm (C1: now calls signUpAction in sign-up mode), CreateWizard, Providers, ProjectProgressPanel, ProjectDownloadButton (H4: now fetches /api/projects/[id]/download at click time), ProjectShareButton (app)
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

Each step is idempotent (Inngest retries), debits credits via `debitCredits()` with deterministic idempotency keys (C5/C6 fix — ALL 6 steps now debit: analysis=5, char=10/each, scene=8/each, voiceover=15, subtitle_alignment=3, video_assembly=30; total=131 for 3 chars + 6 scenes). `debitCredits()` uses `ON CONFLICT (idempotency_key) DO NOTHING` + `.for('update')` row lock — race-condition-proof. **T3 fix: `createProjectAction` wraps INSERT + analysis debit in a single `db.transaction()` via `debitCreditsTx(tx, ...)`** — if the debit throws `InsufficientCreditsError`, the INSERT rolls back (no orphan project rows). The standalone `debitCredits(userId, ...)` is now a thin wrapper that opens its own transaction and delegates to `debitCreditsTx`. **T7 fix: `inngest.send()` is wrapped in try/catch → `setProjectFailed()` on failure** (no pending-orphan when Inngest is unreachable). Image moderation (Steps 2 & 3) parses Replicate's `safety_concept` / `api_safety_concept` fields. Fail-open policy is env-configurable via `IMAGE_MODERATION_FAIL_OPEN` (H8 fix: defaults to `'false'` (fail-closed) in production; `'true'` in dev). **T9 fix: `getFailOpen()` reads `env.IMAGE_MODERATION_FAIL_OPEN` inside the function body** (was module-load const — not testable per-call). The `moderationSkipped` field makes bypasses observable. **T8 fix: `appendVideo` inserts with `status: 'rendering'`**; `updateVideo` sets `status: 'completed'`. **T4 fix: Stripe webhook idempotency INSERT happens AFTER side effects succeed** (was before — if the handler threw, retries were silently swallowed). (T5)

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
| Hero | Character counter | `{story.length} / 5000`, amber at ≥4500 (M2 fix: was 500/450 — matched server schema) |
| Hero | Aspect ratio toggle | `aria-pressed` toggle buttons |
| Examples | Carousel arrow scroll | `scrollBy` / `scrollLeft` |
| FAQ | Expand/collapse | Radix Accordion (grid-template-rows: 0fr→1fr) |
| All sections | Scroll reveal | IntersectionObserver → `data-revealed` attr |
| AuthForm | Google OAuth + credentials | `signIn('google')` / `signIn('credentials')` — C1 fix: sign-up mode now calls `signUpAction()` then auto-signs-in |
| AuthForm | Sign-up (C1 fix) | `signUpAction()` → bcrypt hash (cost 12) → insert user → `getOrCreateSubscription()` → `signIn('credentials')` |
| CreateWizard | Submit → createProjectAction | Server Action (auth-first, Zod, moderation, credits, **Inngest trigger**) |
| Dashboard | Project list | Suspense + Server Component + `getUserProjects()` |
| ProjectDetail | Live pipeline status | `ProjectProgressPanel` client component → SSE `/api/projects/[id]/progress` |
| ProjectDetail | Download completed video | H4 fix: `ProjectDownloadButton` (Client) fetches `/api/projects/[id]/download` at click time → gets fresh signed URL → triggers download. No more `SignedDownloadWrapper` (DELETED). |
| ProjectDetail | Share project | `ProjectShareButton` → Web Share API + clipboard fallback |

## 13 Keyframes (All CSS, in globals.css)

```
fade-in-up, float, glow-pulse, border-glow, composite-pulse-text,
shimmer, btn-shimmer, grid-shimmer, grid-sweep-h, grid-sweep-v,
scanline-scroll, lang-dropdown-in, marquee-scroll
```

## Accessibility Requirements

- Focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary` (T11: was `outline-amber-400` — now uses the brand `--color-primary: #febf00` token)
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
10. **Zod v4 `.url()` accepts any scheme** — compose `.url()` (validates URL format) with `.refine()` (restricts protocol to `postgres:`/`postgresql:`) for `DATABASE_URL`. The Zod v3 limitation where `.url()` rejected `postgresql://` no longer applies in v4.
11. **Build fails without env vars** — env module has a build-context fallback (placeholders when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`)
12. **Auth route handler must be `force-dynamic`** — prevents prerender failure (DrizzleAdapter needs env vars)
13. **Inngest v4 `createFunction` signature** — trigger is in config object (`triggers: [{ event: '...' }]`), NOT a second argument
14. **Stripe "Basil" API (2025-03-31) moved `current_period_end`** — the field was removed from the top-level Subscription object and moved to `subscription.items.data[0].current_period_end`. The Stripe Node SDK has always used snake_case (no camelCase conversion). The webhook handler uses the `extractSubscriptionPeriodEnd()` pure helper which checks both shapes.
15. **ElevenLabs returns `Readable`, not `ReadableStream`** — `streamToBuffer` duck-types the input
16. **Buffer → Blob requires `new Uint8Array(buffer)`** — `new File([audioBuffer], ...)` fails TypeScript strict
17. **`NODE_ENV` is read-only in tests** — use `vi.stubEnv('NODE_ENV', 'test')`
18. **Middleware runs on Edge** — no DB access, no Node.js APIs
19. **esbuild build scripts need approval** — add `esbuild: true` to the `allowBuilds` map in `pnpm-workspace.yaml` (pnpm 10.26+ syntax; the older `onlyBuiltDependencies` array was removed in pnpm 11)

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
41. **SSE needs both server-side and client-side resilience** — `maxDuration = 800` (T6, corrected) is the Vercel Pro/Enterprise GA ceiling under Fluid Compute (now default). The previous value of 900 exceeded the GA limit. Client-side reconnect with exponential backoff (1s → 2s → 4s, max 3 attempts) handles Vercel Hobby's 300s cap. (T6)
42. **`pnpm-workspace.yaml` requires `packages:` field** — pnpm 9+ enforces this even for single-package repos. Fresh clones fail with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION`. Fix: `packages: ['.']`. The engine floor is now `pnpm >=10.26.0` to match the `allowBuilds` syntax. (T0)
43. **CI runs the full quality gate** — `.github/workflows/ci.yml` runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every PR. lint-staged only checks staged files; CI catches whole-codebase regressions. (T8)

### Remediation Sprint 3 (revenue integrity + auth + security + design)
44. **`debitCredits()` signature changed (C5)** — now requires `idempotencyKey` as the 4th arg and returns `DebitResult { idempotent, eventId, creditsRemaining }`. Old callers that pass 3 args will fail to compile. Use deterministic keys like `${projectId}:voiceover`.
45. **`append*` queries return `AppendResult<T>` (C5)** — `appendCharacter/appendScene/appendVoiceover/appendVideo` now return `{ inserted: boolean, row: T | null }` instead of `T` directly. They use `onConflictDoNothing` on UNIQUE constraints. Check `result.inserted` before proceeding.
46. **Sign-up was completely broken (C1)** — `AuthForm` called `signIn('credentials')` for BOTH sign-in and sign-up modes. The Credentials provider's `authorize()` only checks existing users — no user-creation logic existed. Now fixed via `signUpAction` in `src/features/auth/actions.ts`.
47. **Steps 2 & 3 never debited credits (C6)** — a 60% revenue leak. `FULL_PIPELINE_COST = 131` credits assumes all 6 steps debit, but only 4 did (5+15+3+30=53). Now all 6 steps call `debitCredits()` with per-entity idempotency keys.
48. **`FFMPEG_PATH` violated the "never `process.env.*`" rule (H1)** — `assemble-video.ts:20` read `process.env.FFMPEG_PATH` directly. Now goes through the Zod env schema (`env.FFMPEG_PATH`).
49. **`IMAGE_MODERATION_FAIL_OPEN` default was insecure (H8)** — defaulted to `'true'` (fail-open), violating the secure-defaults principle. Now defaults to `'false'` (fail-closed) in production; `'true'` in dev/test.
50. **Host Header Injection risk (H6)** — `trustHost: true` makes Auth.js trust `X-Forwarded-Host`. Without edge validation, an attacker behind a misconfigured reverse proxy can inject `evil.com` to steal magic-link tokens. `proxy.ts` now validates the Host header against a whitelist (canonical domain + localhost + `.vercel.app`).
51. **Stripe webhook idempotency was a TOCTOU race (H7)** — the old SELECT-then-INSERT pattern on `metadata` (no UNIQUE index) allowed concurrent webhooks to both pass the check. Now uses INSERT-first `ON CONFLICT (idempotency_key) DO NOTHING`. `usageEvents.userId` is now nullable (removed hardcoded system user UUID that violated FK constraints).
52. **Download button stale-tab 403 (H4)** — `SignedDownloadWrapper` signed the R2 URL at SSR time, baking the 1h-expiry URL into the RSC payload. Users who left tabs open >1h got 403. Now: `ProjectDownloadButton` fetches `/api/projects/[id]/download` at click time → gets a fresh URL. `SignedDownloadWrapper` DELETED.
53. **Style chip enum mismatch (H3)** — clicking "Medieval" or "Japanese animation" set `style='medieval'` / `'japanese-animation'` which were NOT in the backend enum → Zod rejected the submission after the user typed a 100+ char story. Fixed by adding both values to `visualStyleEnum` + Zod + `STYLE_PROMPTS` (migration `0004`).
54. **Health endpoint was bare (H9)** — returned `{ status: 'ok' }` unconditionally. Now checks DB (`SELECT 1`) + FFmpeg (`fs.accessSync`), returns 503 when unhealthy.
55. **Brand color system fully replaced (H2 + T11)** — `sed` sweep across 45 files replaced `amber-300/400/500/600` → `primary`, `bg-zinc-950` → `bg-background`, `bg-zinc-900` → `bg-card`, `bg-black` → `bg-background`. `brand-tokens.test.ts` now **ENFORCES 0 violations** (was baseline measurement of 122 amber + 27 zinc/black). The custom `--color-primary: #febf00` token is now used everywhere; Tailwind's `amber-400` (`#fbbf24`) is fully eliminated.
56. **Rate limiting now implemented (C3)** — Upstash Ratelimit on auth (10/15min/IP), pipeline (5/min/user), SSE (1/user/project). New deps: `@upstash/ratelimit`, `@upstash/redis`. New error code `RATE_LIMITED` on `createProjectAction` and `signUpAction`.
57. **`createProjectAction` order fix (C4)** — was: debit → insert → trigger. If insert failed, user lost credits. Now: insert → debit → trigger. Idempotency key uses `${project.id}:analysis`.
58. **IP-Adapter placeholder warning (C2)** — `replicate.ts` now emits `console.warn` in production when `REPLICATE_SDXL_IPADAPTER_MODEL` equals the SDXL base hash. Character consistency silently does not work without a real IP-Adapter model.

## What's Implemented vs. Outstanding

### ✅ Implemented (code layer — 396 unit tests + 48 E2E tests, all GREEN)
- Auth.js v5 (Google OAuth + Credentials, Drizzle adapter, JWT sessions, **`trustHost: true`** for reverse-proxy compatibility — T2)
- Drizzle schema (11 tables, 8 enums) + migration config
- `verifySession()` DAL + middleware route protection
- Sign-in / sign-up pages with shared AuthForm **(C1 fix: sign-up now works via `signUpAction` — bcrypt cost 12, user insert, subscription creation, auto sign-in)**
- Dashboard with Suspense + empty state
- Create wizard (reuses Hero's glass-input pattern)
- `createProjectAction` Server Action (auth-first, Zod, moderation, **C4 fix: insert BEFORE debit**, **C3 fix: rate-limited (5/min/user)**, **T3 fix: INSERT + debit wrapped in `db.transaction()` via `debitCreditsTx`** (no orphan on InsufficientCreditsError), **T7 fix: `inngest.send()` try/catch → `setProjectFailed()`**, **Inngest trigger**)
- OpenAI integration (GPT-4o analysis, Moderation, Whisper ASR with **M4 fix: language param defaults to 'en'**)
- Replicate integration (SDXL character + scene generation, IP-Adapter, **env-configurable model IDs** — T4, **C2 fix: production warning when placeholder detected**)
- ElevenLabs TTS (chunked for long text)
- FFmpeg video assembly (rewritten — SRT temp file, inputOptions per image, Buffer readback, cleanup, **H1 fix: `FFMPEG_PATH` via env module not `process.env`**)
- Inngest 6-step pipeline function (**fully wired: Steps 0-6 + final completion**, **C5/C6 fix: ALL 6 steps now debit credits with idempotency keys — total 131 credits for 3 chars + 6 scenes**)
- Image moderation on generated characters + scenes (ADR-011, **H8 fix: `IMAGE_MODERATION_FAIL_OPEN` defaults to `'false'` in production**)
- R2 storage layer (signed URLs + `putObject` for pipeline Buffer uploads, 3 buckets, **`MAX_PUT_OBJECT_BYTES = 500 MB` size guard**)
- Stripe (Checkout, Portal, webhook with signature verification + **H7 fix: idempotent via `ON CONFLICT (idempotency_key) DO NOTHING`**, **T4 fix: idempotency INSERT moved to AFTER side effects** + pre-check SELECT)
- Credit metering (transactional `debitCredits` with **C5 fix: `ON CONFLICT DO NOTHING` + `.for('update')` row lock + `DebitResult` return type**)
- Billing page (4-tier plan table)
- SSE progress stream (`/api/projects/[id]/progress` — 2s polling, owner-checked, **T5 fix: `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern** (replaces `sseRateLimit.fixedWindow` — releases on disconnect for immediate reconnection), **`maxDuration = 800`** + client-side reconnect)
- `useProjectProgress` client hook + `ProjectProgressPanel` (live progress bar, **reconnect UI state**)
- **H4 fix: Click-time R2 URL signing** via `/api/projects/[id]/download` API route. `ProjectDownloadButton` fetches fresh URL at click time. `SignedDownloadWrapper` DELETED.
- `getProject()` LEFT JOINs videos — returns `videoKey` for conditional download render
- `getFfmpegPath()` helper — resolves FFmpeg binary from `env.FFMPEG_PATH` (**H1 fix: via env module, not `process.env`**)
- **C3 + T5 fix: Rate limiting** — `src/lib/rate-limit.ts` with `authRateLimit` (10/15min/IP), `pipelineRateLimit` (5/min/user), `sseRateLimit` (1/user/project — kept for backward compat but no longer used in SSE route). **T5: SSE route now uses `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern** (SET NX EX 30 + DEL on abort + EXPIRE on poll). New deps: `@upstash/ratelimit`, `@upstash/redis`.
- **H6 fix: Proxy host header validation** — rejects requests with unauthorized Host headers (canonical + localhost + `.vercel.app`). `/projects/:path*` added to matcher.
- **H9 fix: Robust health endpoint** — `/api/health` checks DB (`SELECT 1`) + FFmpeg (`fs.accessSync`), returns 503 when unhealthy.
- **H3 fix: Style chip enum** — `medieval` and `japanese-animation` added to `visualStyleEnum` + Zod + `STYLE_PROMPTS` (migration `0004`).
- **M2 fix: Story length** — Hero textarea `maxLength` 500→5000, counter `/ 5000`, amber threshold ≥4500.
- **C5 fix: Idempotency** — `usageEvents.idempotencyKey` column + UNIQUE index. All `append*` queries use `onConflictDoNothing`. UNIQUE constraints on `videos/voiceovers.projectId`, `characters(projectId,name)`, `scenes(projectId,order)`.
- **Client components never import `r2.ts` at module level** — prevents env validation crash in browser
- Privacy Policy + Terms of Service pages (Server Components, AI-specific clauses)
- All 14 marketing CTAs wired to real routes
- husky + lint-staged pre-commit hook (`.husky/pre-commit`)
- **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch warning** at module load
- **GitHub Actions CI** (`.github/workflows/ci.yml`) running lint + typecheck + test + build on every PR
- **`pnpm-workspace.yaml` fixed** with `packages: ['.']` field
- 396 unit tests (48 files) + 48 E2E tests (9 files)

### ⚠️ Outstanding (requires external resources / not yet done)
- **External service credentials** — Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2, Stripe, Inngest, Resend, Upstash, Sentry (fill `.env.local` from `.env.example`)
- **Database migrations applied** — run `pnpm drizzle:generate && pnpm drizzle:migrate` against real Neon. **⚠️ 4 new migrations (0001-0004) from the remediation sprint. Migration 0001 requires pre-cleanup of duplicate video/voiceover rows.**
- **Stripe products configured** — `PRICE_IDS` in `src/lib/stripe/client.ts` are placeholders
- **Replicate IP-Adapter model hash** — `REPLICATE_SDXL_IPADAPTER_MODEL` env var must be set to a real `lucataco/sdxl-ipadapter:<sha>` hash before character consistency will work. The default is the SDXL base model (a documented placeholder). **C2 fix: `replicate.ts` now emits a `console.warn` in production when the placeholder is detected.** (T4)
- **Character consistency validated end-to-end** — manual R&D test (Risk R1, highest-risk component). Code is wired; needs real API keys.
- **FFmpeg assembly validated end-to-end** — rewritten + unit-tested with mocked fluent-ffmpeg; needs real-world test with actual scene images + audio + SRT. **H5 (FFmpeg stream-to-R2) deferred** — requires `@aws-sdk/lib-storage` refactor to eliminate `/tmp` OOM risk.
- **Monitoring** — Sentry, Vercel Analytics, Axiom not integrated (env var `SENTRY_DSN` in schema)
- **E2E tests in CI** — Playwright E2E not yet in the GitHub Actions workflow (needs Postgres service container + browser binaries + seeded data)
- **GDPR/CCPA** — cookie consent banner + data export/deletion endpoints not implemented (Privacy/Terms pages exist)
- **Other content pages** — `/pricing`, `/blog`, `/contact` linked but not implemented
- ~~**H2 — Brand color full replacement**~~ → **DONE (T11)** — `sed` sweep across 45 files replaced `amber-300/400/500/600` → `primary`, `bg-zinc-950` → `bg-background`, `bg-zinc-900` → `bg-card`, `bg-black` → `bg-background`. `brand-tokens.test.ts` now enforces 0 violations.
- **M3 — Character image R2 upload** — `referenceImageKey` currently stores Replicate CDN URLs, not R2 keys. Uploading to R2 matches the docs' intent but requires pipeline Step 2 refactor.

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
- ~~SSE disconnects mid-pipeline (300s Vercel cap)~~ → Fixed (`maxDuration = 800` (corrected from 900) + client reconnect with exponential backoff — T6)
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

### ✅ Recently Closed (remediation sprint 3 — revenue integrity + auth + security + design)
- ~~Sign-up flow completely broken (no `signUpAction` existed)~~ → Fixed (C1: new `src/features/auth/actions.ts` with `signUpAction` — bcrypt cost 12, user insert, subscription, auto sign-in)
- ~~IP-Adapter placeholder silently broken~~ → Fixed (C2: `replicate.ts` emits `console.warn` in production when placeholder detected)
- ~~No rate limiting~~ → Fixed (C3: `src/lib/rate-limit.ts` with auth/pipeline/SSE limits; new deps `@upstash/ratelimit` + `@upstash/redis`)
- ~~Credits debited before project insert~~ → Fixed (C4: `createProjectAction` now inserts project FIRST, then debits with `${project.id}:analysis` key)
- ~~No idempotency on Inngest retries~~ → Fixed (C5: `idempotencyKey` column + UNIQUE index + `ON CONFLICT DO NOTHING` in `debitCredits` + all `append*` queries + `.for('update')` row lock)
- ~~Steps 2 & 3 never debited credits (60% revenue leak)~~ → Fixed (C6: ALL 6 steps now call `debitCredits` with per-entity idempotency keys — total 131 credits for 3 chars + 6 scenes)
- ~~`FFMPEG_PATH` bypassed Zod env validation~~ → Fixed (H1: added to Zod schema; `assemble-video.ts` reads `env.FFMPEG_PATH` not `process.env.*`)
- ~~Brand color system bypassed 75+ times~~ → Fixed (H2 + T11: `sed` sweep across 45 files → `primary`/`background`/`card` tokens; `brand-tokens.test.ts` enforces 0 violations)
- ~~Style chip enum mismatch (2 of 8 chips broke Zod)~~ → Fixed (H3: added `medieval` + `japanese-animation` to enum + Zod + STYLE_PROMPTS — migration `0004`)
- ~~R2 URL 1h expiry trap (stale tabs get 403)~~ → Fixed (H4: new `/api/projects/[id]/download` API route; `ProjectDownloadButton` fetches fresh URL at click time; `SignedDownloadWrapper` DELETED)
- ~~Host Header Injection risk~~ → Fixed (H6: `proxy.ts` validates Host header against whitelist; `/projects/:path*` added to matcher)
- ~~Stripe webhook TOCTOU race~~ → Fixed (H7: INSERT-first `ON CONFLICT DO NOTHING`; removed hardcoded system user UUID; `usageEvents.userId` nullable). **T4: idempotency INSERT moved to AFTER side effects** + pre-check SELECT (prevents permanently-lost subscription updates on transient DB errors).
- ~~`IMAGE_MODERATION_FAIL_OPEN` insecure default~~ → Fixed (H8: default flipped from `'true'` to `'false'` in production)
- ~~Health endpoint bare~~ → Fixed (H9: checks DB `SELECT 1` + FFmpeg `fs.accessSync`, returns 503 when unhealthy)
- ~~Row lock untested~~ → Fixed (H10: `.for('update')` now test-verified via source-reading + concurrency test)
- ~~Story length 500 vs 5000 mismatch~~ → Fixed (M2: Hero `maxLength` 500→5000, counter `/ 5000`, threshold ≥4500)
- ~~Whisper no language param~~ → Fixed (M4: `alignSubtitles` accepts `{ audioBuffer, language? }`, defaults `'en'`)
- ~~Stale "900s" comments~~ → Fixed (M5: updated to "800s Pro/Enterprise GA; 1800s beta")
- ~~`package.json` description stale~~ → Fixed (M6: updated to reflect full SaaS, not just marketing clone)

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
| `pnpm install` warns "Ignored build scripts: esbuild" | `pnpm-workspace.yaml` missing approval | Add `esbuild: true` to the `allowBuilds` map in `pnpm-workspace.yaml` (pnpm 10.26+ syntax; the older `onlyBuiltDependencies` array was removed in pnpm 11) |
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
| SSE stream disconnects after 300s (Vercel Hobby) | `maxDuration = 800` (T6, corrected) is the Vercel Pro/Enterprise GA ceiling under Fluid Compute. Hobby caps at 300s. | Upgrade to Vercel Pro OR rely on client-side reconnect (T6) which reopens after 1s/2s/4s backoff. UI shows "Reconnecting to live updates…" during reconnect. NOTE: the previous value of 900 exceeded the Pro GA limit. |
| Replicate scene generation 404s | `REPLICATE_SDXL_IPADAPTER_MODEL` is the SDXL base placeholder (T4 default) | Set `REPLICATE_SDXL_IPADAPTER_MODEL` env var to a real `lucataco/sdxl-ipadapter:<sha>` hash from replicate.com/explorer |
| Server log shows `[env] AUTH_URL host ("localhost:3000") differs from NEXT_PUBLIC_APP_URL host` | AUTH_URL and NEXT_PUBLIC_APP_URL point to different hosts | Set both to the same production URL. With `trustHost: true` (T2) this is no longer fatal, but should still be fixed (AUTH_URL is used for email magic links, etc.). |
| Billing upgrade buttons return 404 | Form posted to non-existent `/api/stripe/checkout` route (C-1 bug, fixed in T1) | Fixed: billing page now uses `<form action={billingCheckoutAction}>` Server Action. Ensure `billingCheckoutAction` is imported from `@/features/billing/actions` (has `"use server"`). |
| `/dashboard` returns `ERR_CONNECTION_REFUSED` for unauthenticated users | Proxy redirect used `nextUrl.origin` which resolves to `http://` behind TLS-terminating reverse proxy (C-2 bug, fixed in T2) | Fixed: proxy now uses `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)`. Verify `NEXT_PUBLIC_APP_URL` is set to the public HTTPS URL in `.env.local`. |
| Dashboard shows ghost "pending" projects the user never completed | `createProjectAction` inserted the project before debiting credits; InsufficientCreditsError left an orphan row (H-1 bug, fixed in T3) | Fixed: INSERT + debit now wrapped in `db.transaction()` via `debitCreditsTx`. To clean up existing orphans: `DELETE FROM projects WHERE status = 'pending' AND progress_percent = 0;` |
| Stripe webhook retries don't update the subscription after a transient DB error | Idempotency INSERT happened BEFORE the event handler; retries hit `onConflictDoNothing` and returned `{ duplicate: true }` without re-processing (H-2 bug, fixed in T4) | Fixed: idempotency INSERT now happens AFTER side effects succeed + pre-check SELECT. If you have affected events, delete the `usageEvents` rows with `type='stripe_webhook'` for those event IDs so Stripe retries can re-process. |
| SSE returns 429 "Too many concurrent connections" after closing and reopening within 60s | `sseRateLimit.fixedWindow(1, '1 m')` never released the counter on disconnect (H-3 bug, fixed in T5) | Fixed: SSE now uses `claimSseSlot`/`releaseSseSlot`/`refreshSseSlot` Redis slot pattern (SET NX EX 30 + DEL on abort). Slot auto-expires after 30s if the server crashes. |
| Download returns generic 500 for all R2 failures | Single catch block didn't distinguish error types (M-1 bug, fixed in T6) | Fixed: download route now classifies errors — S3/NoSuchKey/NoSuchBucket → 502, Timeout/Networking/Connection → 504, other → 500. Check server logs for the specific `errorName`. |
| Project stuck in "pending" after Inngest outage | `inngest.send()` threw but the project row was already committed (M-2 bug, fixed in T7) | Fixed: `inngest.send()` is now wrapped in try/catch → `setProjectFailed()`. The project status will be 'failed' with an error message; the user can retry. |
| `pnpm build` fails: "Functions cannot be passed directly to Client Components" | Server Action defined inline in a Server Component page (not in a `"use server"` module) (T1 lesson) | Move the Server Action to a module with `"use server"` at the top (e.g., `src/features/billing/actions.ts`). Import it into the page. |
| `tsc` error: "Argument of type 'string \| undefined' is not assignable to parameter of type 'string'" inside a closure | TypeScript doesn't preserve `session.user.id` narrowing inside closures (T5 lesson) | Capture `const userId: string = session.user.id` BEFORE the closure so the type is narrowed. |

## Lessons Learned

1. **`suppressHydrationWarning` on `<body>`** — Browser extensions inject attributes before React hydrates. `<html>` alone is insufficient.
2. **Workflow is `'use client'`** — Uses `useState` for video loading choreography. Don't assume server components for "mostly static" sections.
3. **Test counts drift from plans** — MEP planned 6+3, actual is now 396 unit + 48 E2E. Always verify against `pnpm test` output.
4. **File structure evolves** — `features/`, `lib/db/`, `lib/ai/`, `lib/auth/`, `lib/storage/`, `lib/inngest/`, `lib/stripe/`, `lib/env/` were created during production build. Update docs as you build.
5. **Playwright needs separate install** — `pnpm install` doesn't install browser binaries.
6. **Zod v4 `.url()` accepts any scheme** — compose `.url()` (validates URL format) with `.refine()` (restricts protocol to `postgres:`/`postgresql:`) for `DATABASE_URL`. The Zod v3 limitation where `.url()` rejected `postgresql://` no longer applies in v4.
7. **Env validation needs build-context fallback** — without it, `next build` fails during page-data collection.
8. **`postgres()` defers connection until first query** — allows eager db instantiation without breaking the build.
9. **DrizzleAdapter validates db object structure** — a Proxy-based lazy db was rejected; use a real Drizzle client.
10. **Inngest v4 changed `createFunction` signature** — trigger is now in the config object, not a second argument.
11. **Auth unit tests must mock `next-auth` + `next/navigation`** — jsdom can't load `next/server`.
12. **Source-reading tests are valid** for server-only modules (auth config, middleware, route handlers) that can't be rendered in jsdom.
13. **Stripe "Basil" API (2025-03-31) moved `current_period_end`** — the field was removed from the top-level Subscription object and moved to `subscription.items.data[0].current_period_end`. The Stripe Node SDK has always used snake_case (no camelCase conversion). The webhook handler uses the `extractSubscriptionPeriodEnd()` pure helper which checks both shapes.
14. **ElevenLabs returns `Readable`, not `ReadableStream`** — duck-type the input in `streamToBuffer`.
15. **TDD with mocked AI providers works well** — all 6 pipeline domain functions are fully unit-tested; real API calls only needed for manual E2E validation.
16. **Client components must NEVER import `r2.ts` at module level** — the `r2.ts` module imports `env` which validates all 30 env vars at module load. In the browser, only `NEXT_PUBLIC_*` vars exist — all server-only vars are `undefined`, causing "Invalid environment variables" crash. The fix: Server Component signs the URL, passes as prop to client component. This is a P0 bug that completely breaks the project detail page.
17. **Server-side URL signing pattern** — for any client component that needs data from server-only env vars (R2 signed URLs, Stripe secrets, etc.), the Server Component should fetch/compute the value and pass it as a prop. This is the recommended Next.js 16 pattern.
18. **`@ffmpeg-installer/ffmpeg` incompatible with Turbopack** — the package uses dynamic `require()` with runtime-constructed paths that produce `/ROOT/node_modules/...` under Turbopack. Replaced with system FFmpeg binary via `getFfmpegPath()` helper.
19. **`middleware.ts` renamed to `proxy.ts` in Next.js 16** — the file convention changed. Functionality identical, only filename changes.
20. **Vitest mock hoisting is the #1 test bug** — `vi.mock()` factories are hoisted above imports. Use `vi.hoisted()` for shared `vi.fn()` state. Symptom: `Cannot access 'X' before initialization`.
21. **Mock constructors must be `class`, not arrow fns** — `new S3Client(...)` requires `new`-able mock. Arrow fns throw `"X is not a constructor"`.
22. **SSE in Next.js 16** — `ReadableStream` + `text/event-stream` content-type + 2s DB polling. Simpler than Postgres LISTEN/NOTIFY for serverless.
23. **`auth()` vs `verifySession()` for API routes** — `verifySession()` throws redirect (wrong for JSON). API routes use `auth()` → null → 401 JSON.
24. **`EventSource` cleanup is non-negotiable** — `useEffect` must return `() => eventSource.close()`. Otherwise connection leaks.
25. **Image moderation via Replicate safety output** — zero extra API calls vs. OpenAI vision moderation. Fail-open policy is env-configurable via `IMAGE_MODERATION_FAIL_OPEN` (H8: defaults to `'false'` (fail-closed) in production; `'true'` in dev/test). The `moderationSkipped` field makes bypasses observable. **T9: `getFailOpen()` reads inside the function body** (was module-load const — not testable per-call).
26. **`getProject()` LEFT JOIN videos** — cheaper than two queries. UI uses `videoKey` for conditional download button render.
27. **`putObject` (pipeline) vs `getSignedUploadUrl` (client)** — pipeline has Buffer in memory → direct PUT. Client uploads use presigned URL.
28. **TDD exposed 4 latent defects in `assemble-video.ts`** — placeholder Buffer, missing SRT write, missing input options, brittle filter extraction. All discoverable only by writing tests first.
29. **Source-reading tests must strip comments** — `src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')` before regex, else docblocks trigger false positives.
30. **husky `prepare` script with `|| true` is intentional** — prevents `pnpm install` failure on first install. Don't remove.
31. **`middleware.ts` renamed to `proxy.ts` in Next.js 16** — the file convention changed to better reflect its role as a network boundary. Functionality is identical; only the filename changes. Run `npx @next/codemod@canary middleware-to-proxy .` or rename manually.
32. **`trustHost: true` is mandatory for reverse-proxy deployments** — without it, Auth.js v5 falls back to `AUTH_URL` for callback URLs. If `AUTH_URL=http://localhost:3000` leaks to production, auth redirects resolve to localhost → `ERR_CONNECTION_REFUSED`. This was a P0 production outage. (T2)
33. **Hardcoded third-party model IDs are an operational liability** — the placeholder `SDXL_IPADAPTER_MODEL` hash was a UUID-format string, not Replicate's 64-char hex SHA. Scene generation would have 404'd. Model IDs are now env-configurable with format validation. (T4)
34. **SSE needs both server-side and client-side resilience** — `maxDuration = 800` (T6, corrected) is the Vercel Pro/Enterprise GA ceiling under Fluid Compute. The previous value of 900 exceeded the GA limit. Client-side reconnect with exponential backoff (1s → 2s → 4s, max 3 attempts) handles Vercel Hobby's 300s cap. (T6)
35. **`putObject` needs a size guard** — `MAX_PUT_OBJECT_BYTES = 500 MB` + `PayloadTooLargeError`. R2's limit is 5 GB, but function memory is the real constraint. (T7)
36. **`pnpm-workspace.yaml` requires `packages:` field** — pnpm 9+ enforces this even for single-package repos. Fresh clones fail with `ERR_PNPM_INVALID_WORKSPACE_CONFIGURATION`. Fix: `packages: ['.']`. The engine floor is now `pnpm >=10.26.0` to match the `allowBuilds` syntax. (T0)
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
12. **Stripe webhook uses `extractSubscriptionPeriodEnd()` helper** — the Stripe "Basil" API (2025-03-31) moved `current_period_end` from the top-level Subscription object to `subscription.items.data[0].current_period_end`. The Stripe Node SDK has always used snake_case (no camelCase conversion). The helper checks the Basil shape first, then falls back to the pre-Basil top-level field.

### Remediation Sprint 2 (post-review hardening)
13. **`trustHost: true` on NextAuth config** — Auth.js v5 now uses the incoming request's Host header instead of `AUTH_URL`. Fixes the P0 production outage where auth redirects resolved to `localhost:3000`. (T2)
14. **AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch warning** — the env module emits a `console.warn` at module load when the two hosts differ. Not fatal with `trustHost: true`, but still a misconfiguration that should be fixed. (T2)
15. **`SignedDownloadWrapper` extracted to its own file (T1), then DELETED in H4** — was inline in `projects/[id]/page.tsx`. T1 (remediation sprint 2) extracted it to `src/components/app/signed-download-wrapper.tsx` for independent testability + reuse (app component count went 7→8). H4 (remediation sprint 3) replaced it entirely with the click-time `/api/projects/[id]/download` API route — `SignedDownloadWrapper` was DELETED, app component count went back to 7. **The current count is 7 app components** (auth-form, create-wizard, empty-state, providers, project-progress-panel, project-download-button, project-share-button).
16. **SDXL model IDs moved to env vars** — `REPLICATE_SDXL_MODEL` and `REPLICATE_SDXL_IPADAPTER_MODEL` are now read from the validated `env` module. The Zod schema validates the `owner/model:sha` format. The placeholder IP-Adapter hash was replaced with the SDXL base model + an explicit operator warning. (T4)
17. **`moderationSkipped` field on `ImageModerationResult`** — the fail-open bypass is now observable. A `console.warn` is emitted on every skip. The policy is env-configurable via `IMAGE_MODERATION_FAIL_OPEN` (default `true`; set to `false` for production fail-closed). (T5)
18. **SSE reconnect with exponential backoff** — `useProjectProgress` reopens the EventSource after errors, with 1s → 2s → 4s backoff, up to 3 attempts. New `connectionState: 'reconnecting'` value surfaces in the UI as "Reconnecting to live updates…". `maxDuration` on the SSE route set to 800 (Vercel Pro/Enterprise GA ceiling under Fluid Compute; the earlier value of 900 exceeded the GA limit and silently fell back to the platform default). (T6)
19. **`putObject` size guard** — `MAX_PUT_OBJECT_BYTES = 500 MB` constant + `PayloadTooLargeError` thrown when exceeded. R2's hard limit is 5 GB, but function memory is the real constraint. (T7)
20. **GitHub Actions CI** — `.github/workflows/ci.yml` runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every push to main and every PR. pnpm store cache keyed on lockfile hash. E2E tests not yet in CI (need Postgres service + Playwright browsers). (T8)
21. **`pnpm-workspace.yaml` fixed** — added the missing `packages: ['.']` field + standardized on `allowBuilds` syntax (removed deprecated `onlyBuiltDependencies` array); engine floor bumped to `pnpm >=10.26.0`. (T0)

### Post-Review Hardening (design_critique.md remediation)
22. **`extractSubscriptionPeriodEnd()` pure helper** — extracted from the webhook route into `src/features/billing/domain/extract-period-end.ts`. Handles the Stripe "Basil" API (2025-03-31) shape change (`items.data[0].current_period_end`) with a pre-Basil top-level fallback. Replaced the fictional `currentPeriodEnd ?? current_period_end` camelCase cast. 8 new tests.
23. **SSE `maxDuration` corrected 900 → 800** — the previous value of 900 exceeded the Vercel Pro/Enterprise GA ceiling under Fluid Compute (now default on all plans). 800 is the correct GA ceiling; 1800s is available in beta only. 1 test updated.
24. **React pinned at `^19.2.3`** — the previous `^19.2.0` allowed versions 19.2.0–19.2.2 which are vulnerable to CVE-2025-55182 ("React2Shell", CVSS 10.0 RCE). For Next.js apps the runtime fix comes via `next@16.0.10+`, but the direct React pins are raised to document the security floor.
25. **Zod v4 `DATABASE_URL` validation** — replaced the bare `.refine()` with `startsWith()` (a Zod v3 workaround) with `.url().refine()` composition. Zod v4's `.url()` uses `new URL()` which accepts any scheme — so `.url()` validates URL format AND `.refine()` restricts the protocol to `postgres:`/`postgresql:`. Catches MORE typos than the old approach. 4 new tests.
26. **`IMAGE_MODERATION_FAIL_OPEN` moved into the Zod env schema** — was previously read via `process.env` directly in `moderate-image.ts`, bypassing validation. Now validated as `z.enum(['true','false']).optional().default('true')` and read from `env.IMAGE_MODERATION_FAIL_OPEN`. 6 new env tests + 1 new moderate-image test.
27. **`STYLE_CHIPS` restored to spec** — the hero marquee had drifted to 7 chips with different labels. Restored the spec-mandated 8-chip set verbatim from `deviation_report_v3.md` §1.6: Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, Watercolor. 5 new tests.
28. **Hero headline restored to 3-line cinematic stack** — the H1 had collapsed to 2 lines. Restored the 3-line stack: "Turn" / "Story Into Video" / "with AI Magic". Subtitle copy changed from PROCESS ("subtitles, all generated in minutes") to OUTPUT ("a finished video in minutes"). 5 new tests.

## Asset Pipeline

```bash
./scripts/download-assets.sh        # Download R2 workflow videos + posters (idempotent)
./scripts/generate-thumbnails.sh    # Generate 6 example thumbnails via z-ai CLI
pnpm drizzle-kit generate           # Create migration SQL from schema changes
pnpm drizzle-kit migrate            # Apply migrations to Neon (needs DATABASE_URL_UNPOOLED)
pnpm drizzle-kit studio             # Open schema browser
```
