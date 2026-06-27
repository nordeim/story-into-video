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
| UI | React (strict TypeScript) | ^19.2.0 |
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
| Video | FFmpeg (fluent-ffmpeg + @ffmpeg-installer/ffmpeg) | — |
| Package Manager | pnpm | >=9.0.0 |
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
Layer 0: src/proxy.ts             — Cookie check, redirect. NO DB. NO logic. Edge runtime.
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
| `pnpm test` | Vitest unit tests (227 tests, jsdom) | Before commit |
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
| Unit | Vitest + jsdom | `src/tests/unit/**/*.test.{ts,tsx}` | 227 (32 files) |
| E2E | Playwright (Chromium) | `src/tests/e2e/**/*.spec.ts` | 48 (9 files) |

### Unit Test Coverage (32 files, 227 tests)

**Marketing layer (inherited from clone):**
- `cn.test.ts` (8), `use-scrolled.test.ts` (7), `use-reveal.test.tsx` (7), `use-reduced-motion.test.ts` (4)
- `hero-chip-populate.test.tsx` (5), `hero-ratio-toggle.test.tsx` (3), `hero-character-counter.test.tsx` (4)
- `layout-hydration.test.tsx` (5), `metadata.test.ts` (2)

**Production app layer (Sprints 1-4):**
- `routing.test.ts` (2) — `force-static` removal verified
- `env.test.ts` (8) — Zod env validation (fail-fast, weak-secret rejection, build-context fallback)
- `schema.test.ts` (10) — Drizzle schema structural validation (all 11 tables + columns)
- `auth-config.test.ts` (9) — Auth.js v5 config (providers, adapter, JWT, AUTH_SECRET from env)
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
- `r2-putobject.test.ts` (4) — R2 `putObject` helper (Buffer → S3 via `PutObjectCommand`)
- `pipeline-queries.test.ts` (5) — `appendVoiceover`, `getProjectVoiceover`, `appendVideo`, `updateVideoSubtitle`
- `assemble-video.test.ts` (9) — FFmpeg rewrite: SRT temp file, inputOptions per image, output Buffer readback, cleanup, source-level guarantees (no placeholder, no `.find(includes('concat'))`)
- `pipeline-sprint5.test.ts` (8) — Steps 4-6 wiring: voiceover synthesis, subtitle alignment, video assembly, credit debits, final completion step
- `sse-progress.test.ts` (12) — SSE route source-level guarantees + `useProjectProgress` hook functional behavior with mocked `EventSource`
- `project-download.test.tsx` (9) — `getProject` LEFT JOIN videos, `ProjectDownloadButton` signed URL, `ProjectShareButton` clipboard fallback
- `moderate-image.test.ts` (5) — `moderateImage` parses Replicate `safety_concept` / `api_safety_concept`, fail-open for unknown shapes
- `legal-pages.test.ts` (10) — `/privacy` + `/terms` source-level guarantees (server components, required sections, AI-specific clauses)

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
│   ├── (marketing)/              # (planned) route group for marketing page
│   ├── (auth)/                   # Route group: auth pages
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (app)/                    # Route group: authenticated app (middleware-protected)
│   │   ├── dashboard/page.tsx
│   │   ├── create/page.tsx
│   │   ├── projects/[id]/page.tsx       # Server Component + ProjectProgressPanel (client)
│   │   └── billing/page.tsx
│   ├── (legal)/                  # Route group: legal pages (Server Components)
│   │   ├── privacy/page.tsx             # Privacy Policy (mandatory for launch)
│   │   └── terms/page.tsx               # Terms of Service (mandatory for launch)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # Auth.js catch-all (force-dynamic)
│   │   ├── inngest/route.ts              # Inngest webhook (force-dynamic)
│   │   ├── stripe/webhook/route.ts       # Stripe webhook (force-dynamic)
│   │   ├── projects/[id]/progress/route.ts  # SSE progress stream (force-dynamic)
│   │   └── health/route.ts               # Health check (force-dynamic)
│   ├── layout.tsx                # Root: fonts, metadata, Providers, skip-to-content
│   ├── page.tsx                  # Marketing page (composes 10 sections)
│   ├── globals.css               # @theme + 13 keyframes + @utility + scroll reveal + a11y
│   └── icon.tsx                  # Dynamic favicon
├── components/
│   ├── primitives/               # Shared marketing presentational (7 files)
│   ├── sections/                 # Marketing page sections (10 files)
│   ├── ui/                       # Hand-written shadcn primitives (4 files)
│   └── app/                      # App-specific components (8 files)
│       ├── auth-form.tsx                # 'use client' — Google OAuth + email/password
│       ├── create-wizard.tsx            # 'use client' — story input + style + ratio + counter
│       ├── empty-state.tsx              # Reusable empty-state primitive
│       ├── providers.tsx                # 'use client' — SessionProvider wrapper
│       ├── project-progress-panel.tsx   # 'use client' — SSE subscriber + progress bar
│       ├── project-download-button.tsx  # 'use client' — signed R2 URL download anchor
│       └── project-share-button.tsx     # 'use client' — Web Share API + clipboard fallback
├── features/                     # Layer 2 + 3: Feature modules with domain isolation
│   ├── auth/domain/verify-session.ts   # The DAL auth function (throws NEXT_REDIRECT)
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
│       ├── queries.ts            # getOrCreateSubscription, debitCredits (transactional)
│       ├── actions.ts            # 'use server' — checkoutAction, portalAction
│       └── domain/tier-limits.ts # TIER_LIMITS + CREDIT_COSTS
├── lib/                          # Layer 4: Infrastructure
│   ├── db/
│   │   ├── index.ts              # Drizzle client (Neon pooled connection)
│   │   ├── schema/               # auth.ts, projects.ts, media.ts, billing.ts + index.ts
│   │   └── (migrations in /drizzle)
│   ├── env/index.ts              # Zod-validated env (CRITICAL: never use process.env.* directly)
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
│   ├── storage/r2.ts             # S3-compatible R2 client + signed URLs + putObject(Buffer)
│   ├── stripe/client.ts          # Stripe SDK + PRICE_IDS
│   ├── data/                     # Static marketing data constants (10 files)
│   ├── hooks/                    # Custom React hooks (4 files: use-scrolled, use-reveal, use-reduced-motion, use-project-progress)
│   ├── fonts.ts                  # Font configuration
│   └── utils.ts                  # cn() utility
├── tests/
│   ├── unit/                     # Vitest unit tests (32 files, 227 tests)
│   ├── e2e/                      # Playwright E2E tests (9 files, 48 tests)
│   └── setup.ts                  # Test setup (jest-dom + test env vars)
├── types/
│   └── index.ts                  # TypeScript interfaces (12 marketing interfaces)
└── proxy.ts                      # Layer 0: Auth route protection (Edge runtime)

.husky/
└── pre-commit                    # Runs `pnpm lint-staged` on staged files
```

### Routes (14 total)

| Route | Type | Purpose |
|---|---|---|
| `/` | ○ Static | Marketing page (10 sections, unchanged from clone) |
| `/sign-in`, `/sign-up` | ○ Static | Auth pages (AuthForm with Google + email/password) |
| `/dashboard` | ƒ Dynamic | Project list (auth-protected, Suspense + empty state) |
| `/create` | ○ Static | Project creation wizard (auth-protected) |
| `/projects/[id]` | ƒ Dynamic | Project detail + pipeline status (owner-checked) |
| `/billing` | ○ Static | 4-tier plan table + upgrade CTAs |
| `/privacy` | ○ Static | Privacy Policy (mandatory for launch) |
| `/terms` | ○ Static | Terms of Service (mandatory for launch) |
| `/api/auth/[...nextauth]` | ƒ Dynamic | Auth.js catch-all (Google OAuth, credentials) |
| `/api/inngest` | ƒ Dynamic | Inngest webhook (6-step pipeline) |
| `/api/stripe/webhook` | ƒ Dynamic | Stripe webhook (signature-verified, idempotent) |
| `/api/projects/[id]/progress` | ƒ Dynamic | SSE progress stream (auth + owner-checked, 2s polling) |
| `/api/health` | ƒ Dynamic | Health check endpoint (returns `{ status: 'ok' }`) |
| Middleware | ƒ Proxy | Protects `/dashboard`, `/create`, `/settings`, `/billing` |

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

- **`verifySession()`** — DAL function in `src/features/auth/domain/verify-session.ts`. Returns session or throws `NEXT_REDIRECT` (via `redirect('/sign-in')`). **Never wrap in try/catch** — it catches the redirect and silently swallows it.
- **API routes use `auth()` directly** — returns null → 401 JSON. Do NOT use `verifySession()` in API routes (it redirects — wrong for JSON).
- **Server Actions start with `verifySession()`** — before any other logic.
- **Middleware uses `auth` as default export** — Auth.js v5's `auth` function from `NextAuth()` is used directly as middleware. It checks cookie presence; actual session validity is verified by `verifySession()` in Server Components/Actions.
- **`AUTH_SECRET` read from `env` module** — never `process.env.AUTH_SECRET` directly.

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
- Each step debits credits via `debitCredits()` (Drizzle transaction): analysis=5, char=10/each, scene=8/each, voiceover=15, subtitle_alignment=3, video_assembly=30.
- Failed steps set `project.status = 'failed'` with error message.
- Image moderation (Steps 2 & 3): parses Replicate's `safety_concept` / `api_safety_concept` fields. Fail-open for unknown output shapes (deliberate tradeoff — fail-closed would block all generations from models that don't expose safety metadata).
- Step 5 downloads audio from R2 via `fetch()` (signed URL) — Inngest steps don't share in-memory state, so we round-trip through R2 between Steps 4 and 5.
- Step 6 writes SRT to `/tmp/siv-srt-<ts>.srt`, reads output MP4 from `/tmp/siv-video-<ts>.mp4` into a Buffer, then cleans up both temp files.
- `createProjectAction` triggers the pipeline via `inngest.send({ name: PIPELINE_EVENT, data: { projectId } })` after the DB insert.
- Real API keys required to run end-to-end. The pipeline is fully wired at the code layer; remaining validation is operational (provision credentials + manual R&D on IP-Adapter consistency + FFmpeg assembly).

### Accessibility Requirements

- **Focus rings:** `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400`
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
14. **`process.env.*` is forbidden** — always import `env` from `@/lib/env`. The Zod schema validates at module load; typos like `GOOGLE_CLIENTID` (missing underscore) would silently return `undefined` and disable OAuth.
15. **Zod `.url()` rejects `postgresql://`** — the `DATABASE_URL` validation uses `.refine()` with a postgres scheme check, not `.url()` (Zod's URL validator rejects non-standard schemes).
16. **Build fails without env vars** — the env module has a build-context fallback (returns placeholders when `NEXT_PHASE === 'phase-production-build'` or `NODE_ENV === 'test'`). At runtime, real env vars MUST be set or the app fails fast.
17. **DrizzleAdapter rejects Proxy-based db** — `DrizzleAdapter(db)` validates the db object's structure. The db must be a real Drizzle client, not a Proxy. The `postgres()` client doesn't connect until a query runs, so eager instantiation is safe.
18. **Auth route handler must be `force-dynamic`** — `export const dynamic = 'force-dynamic'` in `src/app/api/auth/[...nextauth]/route.ts` prevents Next.js from trying to prerender it (which fails because DrizzleAdapter can't be instantiated without env vars).
19. **Inngest v4 `createFunction` signature changed** — the trigger is part of the config object (`triggers: [{ event: '...' }]`), NOT a second argument. Older examples show `createFunction(config, trigger, handler)` which is wrong for v4.
20. **Stripe SDK v22+ uses camelCase** — `subscription.current_period_end` is now `subscription.currentPeriodEnd`. The webhook handler uses a fallback cast to support both.
21. **ElevenLabs `textToSpeech.convert()` returns a `Readable`** — not a `ReadableStream`. The `streamToBuffer` helper handles both via duck-typing (`getReader` check + async iteration fallback).
22. **Buffer → Blob requires `new Uint8Array(buffer)`** — `new File([audioBuffer], ...)` fails TypeScript's strict types because `Buffer<ArrayBufferLike>` is not assignable to `BlobPart`. Wrap with `new Uint8Array(audioBuffer)`.
23. **`NODE_ENV` is read-only in tests** — use `vi.stubEnv('NODE_ENV', 'test')` instead of direct assignment.
24. **Middleware runs on Edge runtime** — no Node.js APIs, no DB access. It only checks cookie presence; actual session validity is verified by `verifySession()` in Server Components/Actions.
25. **esbuild build scripts need approval** — `pnpm-workspace.yaml` must list `esbuild` under `onlyBuiltDependencies` or `pnpm install` skips the postinstall (drizzle-kit, vitest depend on esbuild).

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
36. **`moderateImage` fail-open policy** — when Replicate's output shape is unknown (e.g., a model that doesn't expose `safety_concept`), `moderateImage` returns `flagged:false`. This is a deliberate tradeoff: fail-closed would block all generations from such models, which is worse UX than accepting the small risk. Document this in your launch readiness review.
37. **husky `prepare` script uses `|| true`** — `package.json` has `"prepare": "husky || true"`. The `|| true` prevents `pnpm install` from failing if husky isn't yet installed (first install on a fresh clone). Don't remove it.
38. **`lint-staged` runs on staged files only** — not the whole codebase. Configured in `package.json` under `lint-staged`. Staged `.ts/.tsx` files get `eslint --fix` + `prettier --write`; `.json/.md/.css/.mjs` get `prettier --write` only.
39. **Source-reading tests must strip comments before regex** — when asserting "code does not contain X", strip comments first: `src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')`. Otherwise the docblock (which may mention the old pattern by name) triggers a false positive.

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
| `pnpm install` warns "Ignored build scripts: esbuild" | `pnpm-workspace.yaml` missing esbuild approval | Add `esbuild` to `onlyBuiltDependencies` array |
| Tests fail: "Cannot find module 'next/server'" | jsdom can't load Next.js server modules | Mock `next-auth`, `next/navigation`, and `@/lib/db` in tests that transitively import them |
| `replicate.run()` returns wrong shape | Model output type varies | Cast via `as unknown as string[]` and check length before indexing |
| Tests fail: "Cannot access 'X' before initialization" | `vi.mock()` factory references a `vi.fn()` defined in the test body | Use `vi.hoisted()`: `const { mockFn } = vi.hoisted(() => ({ mockFn: vi.fn() }))` then reference `mockFn` inside the factory |
| Tests fail: "X is not a constructor" | Mock factory returns an arrow function, but real code does `new X()` | Use `class` syntax in the mock factory: `class MockS3Client { send = sendMock; }` |
| Tests fail: "[PARSE_ERROR] Expected '>' but found 'Identifier'" | Test file uses JSX (`render(<Comp />)`) but has `.test.ts` extension | Rename to `*.test.tsx` (oxc needs the `.tsx` extension to parse JSX) |
| Pipeline tests fail: "fetch failed: ENOTFOUND r2.example.com" | Steps 5 & 6 download audio/SRT via `fetch()` which hits real DNS | Stub global `fetch`: `const fetchMock = vi.fn().mockResolvedValue({arrayBuffer:..., text:...}); vi.stubGlobal('fetch', fetchMock);` |
| SSE route returns 307 redirect instead of 401 JSON | Used `verifySession()` (throws redirect) instead of `auth()` (returns null) | API routes use `auth()` directly: `const session = await auth(); if (!session?.user?.id) return NextResponse.json({error:'Unauthorized'},{status:401});` |
| SSE stream hangs / never closes | `controller.close()` not called on terminal status | Poll DB every 2s; when `status ∈ {completed, failed}`, call `controller.close()` + `clearInterval(interval)` |
| `EventSource` leaks across navigations | `useEffect` cleanup missing `eventSource.close()` | Return a cleanup function from `useEffect` that calls `eventSource.close()` |
| husky pre-commit hook doesn't run | `pnpm install` didn't run the `prepare` script (first install) | Run `pnpm install` (activates `prepare: husky`); ensure `.husky/pre-commit` is executable (`chmod +x`) |
| `assemble-video` returns `Buffer.from('placeholder')` | (Legacy bug, now fixed) Old impl didn't read the output file | Fixed in T3 rewrite — function now reads `/tmp/siv-video-<ts>.mp4` into a Buffer before resolving |
| `moderateImage` returns `flagged:false` for unknown Replicate output | Fail-open policy for models that don't expose `safety_concept` | Deliberate tradeoff. If your model supports safety fields, verify the field name matches one of: `safety_concept`, `api_safety_concept`, `safety` |

## Lessons Learned

### Marketing Layer (inherited)
1. **`suppressHydrationWarning` on `<body>`** — Browser extensions inject attributes before React hydrates. `<html>` alone is insufficient.
2. **Workflow is `'use client'`** — Uses `useState` for video loading choreography. Don't assume server components for "mostly static" sections.
3. **Test counts drift from plans** — MEP planned 6+3, actual is now 227 unit + 48 E2E. Always verify against `pnpm test` output.
4. **File structure evolves** — `components/primitives/`, `lib/hooks/`, `lib/data/` were created during build. Update docs as you build.
5. **Playwright needs separate install** — `pnpm install` doesn't install browser binaries.

### Production App Layer (new)
6. **Zod `.url()` rejects `postgresql://`** — discovered when the env module threw "DATABASE_URL must be a postgresql:// URL" at build time. Fixed by replacing `.url()` with `.min(1).refine(...)` for database URLs.
7. **Env validation must have a build-context fallback** — without it, `next build` fails during page-data collection because the auth route handler imports DrizzleAdapter which accesses `env.DATABASE_URL`. The fallback returns placeholders when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`.
8. **`postgres()` doesn't connect until a query runs** — this allows eager db instantiation in `src/lib/db/index.ts` without breaking the build. The connection is established only on first query at request time.
9. **DrizzleAdapter validates the db object's structure** — a Proxy-based lazy db was rejected ("Unsupported database type (object)"). The solution is a real Drizzle client with a `postgres()` client that defers connection.
10. **Inngest v4 changed `createFunction` signature** — the trigger moved into the config object as `triggers: [{ event: '...' }]`. Older docs and examples show a 3-argument form that no longer works.
11. **Auth unit tests must mock `next-auth` and `next/navigation`** — jsdom can't load `next/server` (imported transitively by `next-auth`). Mocking these modules isolates the test and avoids the "Cannot find module 'next/server'" error.
12. **Source-reading tests are valid for server-only modules** — some tests read the source file via `readFileSync` to verify structural patterns (auth config, middleware, route handlers) that can't be asserted via rendering. This is intentional and documented in each test file.
13. **Stripe SDK v22 camelCase breaking change** — `subscription.current_period_end` became `subscription.currentPeriodEnd`. The webhook handler uses a union cast to support both.
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

## Outstanding Issues

### Critical (blocks production launch)
1. **No real external service credentials** — the app builds and tests pass with placeholders, but running the full pipeline requires real Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2, Stripe, Inngest, Resend, Upstash, and Sentry accounts. Fill in `.env.local` from `.env.example`.
2. **Database migrations not applied** — `pnpm drizzle-kit generate` + `pnpm drizzle-kit migrate` must be run against a real Neon database before the app can function.
3. **No real Stripe products configured** — the `PRICE_IDS` in `src/lib/stripe/client.ts` are placeholders (`price_creator_monthly`, etc.). Real Stripe price IDs must be created in the Stripe Dashboard and set as env vars.
4. **Replicate model IDs are placeholders** — `SDXL_MODEL` and `SDXL_IPADAPTER_MODEL` in `src/lib/ai/replicate.ts` need to be verified/updated with current model version hashes from Replicate.
5. **Character consistency (IP-Adapter) is unvalidated end-to-end** — the highest-risk component (Risk R1 in the Production Readiness Plan). Code is wired; requires manual R&D with real API keys: generate 3 character references, then 3 scenes, verify faces match. May need model/parameter iteration.
6. **FFmpeg video assembly is unvalidated end-to-end** — `src/features/pipeline/domain/assemble-video.ts` was rewritten (T3) and is unit-tested with mocked fluent-ffmpeg, but needs real-world validation with actual scene images + audio + SRT. May need to fall back to Shotstack if serverless FFmpeg is unreliable (ADR-006).

### High (degrades UX)
7. **No visual regression testing** — pixel-perfect verification against the live marketing site is manual.
8. **No rate limiting** — the blueprint specifies Upstash Ratelimit on auth (10/15min), AI (5/min), export (10/hour). Not yet implemented. Env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) are already in the Zod schema.
9. **No monitoring** — Sentry, Vercel Analytics, Axiom are not yet integrated. Env var `SENTRY_DSN` is in the schema.

### Medium (polish + compliance)
10. **PostCSS vulnerability** — `postcss <8.5.10` has a moderate vuln (transitive via `next`). Not exploitable. Will resolve when Next.js updates its lockfile.
11. **No CI/CD pipeline** — GitHub Actions for `lint && typecheck && test && build` on PRs not configured.
12. **No GDPR/CCPA compliance** — cookie consent banner, data export, data deletion endpoints not implemented. Privacy Policy + Terms of Service pages exist, but the cookie banner + data export API are still needed.
13. **Other content pages missing** — `/pricing`, `/blog`, `/contact` are linked from nav/footer but not yet implemented. `/privacy` and `/terms` are now live.

### ✅ Recently Closed (remediation sprint)
- ~~Steps 4-6 not wired into Inngest~~ → Fixed (T4+T5+T7)
- ~~`inngest.send()` commented out in `createProjectAction`~~ → Fixed (T8)
- ~~FFmpeg `assemble-video.ts` placeholder implementation~~ → Fixed (T3 rewrite)
- ~~No SSE progress stream~~ → Fixed (T9)
- ~~No download/share on project detail~~ → Fixed (T10)
- ~~No content moderation on generated images (ADR-011)~~ → Fixed (T11)
- ~~No legal pages (Privacy/Terms)~~ → Fixed (T12)
- ~~No pre-commit hooks~~ → Fixed (T14 — husky + lint-staged)
- ~~Documentation drifts (E2E count, /api/health route, FK count)~~ → Fixed (T13)

## Recommendations

### Immediate (before any deploy)
1. **Provision all external services** — Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2 (3 buckets), Stripe, Inngest, Resend, Upstash, Sentry.
2. **Run `pnpm drizzle-kit generate && pnpm drizzle-kit migrate`** — create the database schema.
3. **Configure Stripe products** — create 4 tiers (Free/Creator/Pro/Studio), update `PRICE_IDS`.
4. **Validate Replicate model IDs** — verify `SDXL_MODEL` and `SDXL_IPADAPTER_MODEL` are current.
5. **Test the AI pipeline end-to-end** — sign up, paste a story, verify characters/scenes/video generate. This is the highest-risk validation. Steps 4-6 are wired but untested with real API keys.
6. **Run `pnpm install` to activate husky** — the `prepare` script sets up `.husky/pre-commit`. Verify the hook fires on your first commit.

### Short-term (first sprint post-launch)
7. **Add rate limiting** — Upstash Ratelimit on auth, AI, export endpoints. Env vars already in schema.
8. **Implement `/pricing`, `/blog`, `/contact`** pages.
9. **Add cookie consent banner** — required for GDPR/CCPA. The Privacy Policy page exists; the banner is the missing piece.
10. **Add data export endpoint** — `GET /api/user/export` returns user data as JSON (GDPR right to portability).

### Medium-term (scale + compliance)
11. **Add CI/CD** — GitHub Actions with quality gate on PRs.
12. **Add monitoring** — Sentry (errors), Vercel Analytics (product), Axiom (logs).
13. **Add data deletion endpoint** — `DELETE /api/user` cascades to all user data (GDPR right to erasure).
14. **Visual regression testing** — Playwright screenshot comparison against live site.
15. **Bundle size monitoring** — `next/bundle-analyzer`.
16. **Add the interactive timeline editor** — the post-MVP feature (Remotion-based). Deferred per the blueprint.
17. **Run the pre-launch checklist** — `PRODUCTION_READINESS_PLAN.md` §8 before going live.

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
- `pnpm test` passes all 227 unit tests
- `pnpm test:e2e` passes all 48 E2E tests (requires Playwright browsers installed)
- `pnpm build` exits with 0 errors
- Lighthouse scores ≥95 across Performance, Accessibility, Best Practices, SEO (marketing page)
- The marketing page is visually indistinguishable from `storyintovideo.com` at 1440×900
- The full pipeline works end-to-end: signup → paste story → AI generates video → download
- All external services are provisioned and `.env.local` is complete
- The pre-launch checklist (`PRODUCTION_READINESS_PLAN.md` §8) is fully checked
