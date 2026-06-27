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
FFmpeg (video assembly) · bcryptjs (password hashing)
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
Layer 0: src/middleware.ts        — Cookie check, redirect. NO DB. NO logic. Edge runtime.
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
│   ├── storage/r2.ts                       # R2 signed URLs (3 buckets)
│   ├── stripe/client.ts                    # Stripe SDK + PRICE_IDS
│   ├── data/                               # Static marketing data (10 files)
│   ├── hooks/                              # use-scrolled, use-reveal, use-reduced-motion
│   ├── fonts.ts · utils.ts
├── tests/
│   ├── unit/                     # 24 files, 164 tests
│   ├── e2e/                      # 9 files, 48 tests
│   └── setup.ts                  # jest-dom + test env vars
├── types/index.ts                # 12 marketing interfaces
└── middleware.ts                 # Layer 0: route protection (Edge runtime)
```

## Routes (12 total)

| Route | Type | Purpose |
|---|---|---|
| `/` | ○ Static | Marketing page (10 sections) |
| `/sign-in`, `/sign-up` | ○ Static | Auth (Google + email/password) |
| `/dashboard` | ƒ Dynamic | Project list (auth-protected) |
| `/create` | ○ Static | Create wizard (auth-protected) |
| `/projects/[id]` | ƒ Dynamic | Project detail + pipeline status |
| `/billing` | ○ Static | Plan table + upgrade |
| `/api/auth/[...nextauth]` | ƒ Dynamic | Auth.js catch-all |
| `/api/inngest` | ƒ Dynamic | Pipeline webhook |
| `/api/stripe/webhook` | ƒ Dynamic | Billing webhook |
| `/api/health` | ƒ Dynamic | Health check (returns `{ status: 'ok' }`) |
| Middleware | ƒ Proxy | Protects `/dashboard`, `/create`, `/settings`, `/billing` |

## Build & Quality Commands (Actual)

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build (hybrid: static + dynamic)
pnpm lint         # eslint . (flat config)
pnpm typecheck    # tsc --noEmit (strict + noUncheckedIndexedAccess)
pnpm test         # vitest run (164 unit tests, jsdom)
pnpm test:e2e     # playwright test (48 E2E tests, Chromium, auto-starts dev)
pnpm format       # prettier --write
pnpm format:check # prettier --check
pnpm drizzle-kit generate   # Create migration SQL from schema diff
pnpm drizzle-kit migrate    # Apply migrations (needs DATABASE_URL_UNPOOLED)
pnpm drizzle-kit studio     # Schema browser
```

**Pre-commit chain:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build`

## Component Contracts (TypeScript)

All components use `interface` (not `type` for object shapes), zero `any`. Critical rules:

- `'use client'` only for: Navbar, Hero, Examples, Faq, Workflow, ScrollReveal (marketing); AuthForm, CreateWizard, Providers (app)
- Server components by default: Features, Testimonials, UseCases, FinalCta, Footer (marketing); dashboard, project detail, billing pages (app)
- `next/image` for all raster images, `next/font` for all fonts
- **Auth-first Server Actions:** every action starts with `verifySession()` before any logic
- **`queries.ts` boundary:** all DB access through feature-level queries files; components never call `db`
- **Domain isolation:** `src/features/*/domain/` contains pure functions — no Next.js or DB runtime imports

## Auth Patterns (CRITICAL)

- **`verifySession()`** — `src/features/auth/domain/verify-session.ts`. Returns session or throws `NEXT_REDIRECT`. **Never wrap in try/catch.**
- **API routes use `auth()` directly** — returns null → 401 JSON. Do NOT use `verifySession()` in API routes.
- **Middleware** — `src/middleware.ts` exports `auth` as default (Auth.js v5 pattern). Checks cookie presence only; Edge runtime can't access DB.
- **`AUTH_SECRET`** — read from `env` module, never `process.env.AUTH_SECRET`.

## AI Pipeline (Inngest, 6 Steps)

```
Step 0: Moderate (OpenAI Moderation API — block if flagged)
Step 1: Analyze story (GPT-4o JSON mode → characters + scenes)
Step 2: Generate characters (Replicate SDXL → reference portraits)
Step 3: Generate scenes (Replicate SDXL + IP-Adapter → consistent faces)
Step 4: Synthesize voiceover (ElevenLabs TTS, chunked for long text)
Step 5: Align subtitles (Whisper ASR word timestamps → SRT)
Step 6: Assemble video (FFmpeg → MP4)
```

Each step is idempotent (Inngest retries), debits credits, updates `project.status` + `progressDetail`.

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
| CreateWizard | Submit → createProjectAction | Server Action (auth-first, Zod, moderation, credits) |
| Dashboard | Project list | Suspense + Server Component + `getUserProjects()` |

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

## What's Implemented vs. Outstanding

### ✅ Implemented (code layer)
- Auth.js v5 (Google OAuth + Credentials, Drizzle adapter, JWT sessions)
- Drizzle schema (11 tables, 8 enums) + migration config
- `verifySession()` DAL + middleware route protection
- Sign-in / sign-up pages with shared AuthForm
- Dashboard with Suspense + empty state
- Create wizard (reuses Hero's glass-input pattern)
- `createProjectAction` Server Action (auth-first, Zod, moderation, credits)
- OpenAI integration (GPT-4o analysis, Moderation, Whisper ASR)
- Replicate integration (SDXL character + scene generation, IP-Adapter)
- ElevenLabs TTS (chunked for long text)
- FFmpeg video assembly (domain function)
- Inngest 6-step pipeline function
- R2 storage layer (signed URLs, 3 buckets)
- Stripe (Checkout, Portal, webhook with signature verification + idempotency)
- Credit metering (transactional `debitCredits`, `InsufficientCreditsError`)
- Billing page (4-tier plan table)
- All 14 marketing CTAs wired to real routes
- 164 unit tests + 48 E2E tests (all GREEN)

### ⚠️ Outstanding (requires external resources / not yet done)
- **External service credentials** — Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2, Stripe, Inngest, Resend, Upstash, Sentry (fill `.env.local` from `.env.example`)
- **Database migrations applied** — run `pnpm drizzle-kit generate && migrate` against real Neon
- **Stripe products configured** — `PRICE_IDS` in `src/lib/stripe/client.ts` are placeholders
- **Replicate model IDs verified** — `SDXL_MODEL` / `SDXL_IPADAPTER_MODEL` need real version hashes
- **Character consistency validated** — manual R&D test (Risk R1, highest-risk component)
- **FFmpeg assembly validated** — real end-to-end test with scene images + audio + SRT
- **Inngest pipeline trigger wired** — `inngest.send()` in `createProjectAction` is commented out
- **SSE progress stream** — `src/app/api/projects/[id]/progress/route.ts` not yet implemented
- **Download/share** — project detail page has no download button
- **Content pages** — `/pricing`, `/blog`, `/contact`, `/privacy`, `/terms` not yet implemented (Privacy + Terms mandatory for launch)
- **Rate limiting** — Upstash Ratelimit on auth/AI/export (specified in blueprint, not implemented)
- **Content moderation on generated images** — currently only story input is moderated (ADR-011 specifies both)
- **Monitoring** — Sentry, Vercel Analytics, Axiom not integrated
- **CI/CD** — GitHub Actions not configured
- **GDPR/CCPA** — cookie consent, data export/deletion not implemented
- **Pre-commit hooks** — `husky` + `lint-staged` not added

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

## Lessons Learned

1. **`suppressHydrationWarning` on `<body>`** — Browser extensions inject attributes before React hydrates. `<html>` alone is insufficient.
2. **Workflow is `'use client'`** — Uses `useState` for video loading choreography. Don't assume server components for "mostly static" sections.
3. **Test counts drift from plans** — MEP planned 6+3, actual is now 164+11. Always verify against `pnpm test` output.
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

## Asset Pipeline

```bash
./scripts/download-assets.sh        # Download R2 workflow videos + posters (idempotent)
./scripts/generate-thumbnails.sh    # Generate 6 example thumbnails via z-ai CLI
pnpm drizzle-kit generate           # Create migration SQL from schema changes
pnpm drizzle-kit migrate            # Apply migrations to Neon (needs DATABASE_URL_UNPOOLED)
pnpm drizzle-kit studio             # Open schema browser
```
