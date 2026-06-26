# Production Readiness Plan — StoryIntoVideo

> **Document type:** Engineering Blueprint for a coding agent
> **Status:** Active — Decisions ACCEPTED, ready for implementation
> **Source codebase:** `story-into-video/` (remediated marketing clone, 2026-06-27)
> **Canonical spec:** `Project_Requirements_Document.md` (v2.0, 2718 lines)
> **Companion docs:** `CLAUDE.md`, `AGENTS.md`, `deviation_report_validation.md`
> **Plan date:** 2026-06-27

---

## How to Read This Document

This blueprint transforms the existing pixel-accurate marketing clone into a production SaaS application with real functionality. It is written for a coding agent (Claude, Gemini, Codex, or a human engineer) who will execute it. Every architectural decision is pinned as **ACCEPTED** — do not re-deliberate; implement. Every task is a **TDD card** with Red-Green-Refactor steps and acceptance criteria.

**Operating protocol (non-negotiable):**
1. Read `CLAUDE.md` and `AGENTS.md` first — they define the project's conventions, color system, and anti-patterns.
2. Consult the referenced `skills/` folder entries before implementing each domain — they contain copy-pasteable patterns.
3. Follow the Meticulous Approach: ANALYZE → PLAN → VALIDATE → IMPLEMENT → VERIFY → DELIVER for every task card.
4. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` before every commit. Zero warnings, zero errors.
5. Use TDD strictly: write the failing test first, then the minimal code to pass it, then refactor. One commit per Red-Green-Refactor cycle.
6. Never read `process.env.*` directly — use the Zod-validated `env` module (see ADR-003).
7. Never use `any` — use `unknown` and narrow with Zod or type guards. ESLint enforces this.
8. Preserve the existing design system verbatim: `#020202` background, `#febf00` amber, Outfit 820, 13 CSS keyframes, zero purple except the example-card hover gradient.

**What this document is NOT:**
- It is not a request to rebuild the marketing page. The marketing page is done and production-ready.
- It is not a free-form architecture exploration. Decisions are pinned. If you disagree with a decision, escalate to the stakeholder; do not silently override.
- It is not a complete code dump. Code snippets illustrate critical patterns; the implementing agent fills in the rest using the referenced skills.

---

## 1. Executive Summary

The remediated codebase is a production-ready **marketing surface** — visually polished, Lighthouse ≥95, accessible, SEO-tagged, with 45 passing unit tests and 11 E2E tests. However, it currently has **zero product functionality**: no authentication, no database, no AI pipeline, no billing, no dashboard, no actual video generation. Every "Start Creating" CTA routes to a sign-up page that does not exist, and the advertised 4-step workflow (create project → generate characters → AI storyboard → timeline editor) is entirely unimplemented.

Transforming this into a production SaaS is **not an incremental enhancement** — it is building a complete application behind the existing marketing facade. The marketing facade (the hardest part to get right aesthetically) is done. The work ahead is backend-heavy, AI-integration-heavy, and operationally complex. This blueprint defines a **4-sprint MVP** (≈12 weeks) that delivers a thin end-to-end slice: a user can sign up, paste a story, and receive a downloadable AI-generated video.

The blueprint is organized into eight production domains, eleven pinned Architectural Decision Records (ADRs), a 5-layer target architecture, a phased roadmap with TDD task cards, a risk register, and a pre-launch security/compliance checklist. All implementation patterns reference the bundled `skills/` folder, which contains validated templates for Auth.js v5, Prisma, Server Actions, security hardening, and more.

**Estimated effort:** 3–4 months of focused engineering for MVP. The AI pipeline (Sprint 3) is the highest-risk component and will consume 60%+ of the effort.

---

## 2. Current State Assessment

### 2.1 What's Production-Ready (Keep As-Is)

The following are complete and must not be regressed:

- **Marketing page** — 10 sections, pixel-accurate to the PRD, Lighthouse ≥95, WCAG AAA color contrast, `prefers-reduced-motion` support, skip-to-content link, JSON-LD structured data, canonical URL (added 2026-06-27).
- **Design system** — color tokens (`#020202` / `#febf00` / `#060607`), typography (Outfit 820 / Geist Sans / Geist Mono), 13 kebab-case `@keyframes` in `globals.css`, `@utility` classes (`glass-input`, `eyebrow`, `cta-amber`, `marquee-track`), Tailwind v4 CSS-first `@theme` (no `tailwind.config.ts`).
- **Frontend stack** — Next.js 16.2, React 19.2, Tailwind v4.3, shadcn/ui (4 hand-written primitives: button, accordion, sheet, dropdown-menu), Lucide icons.
- **Testing foundation** — 45 Vitest unit tests (9 files), 11 Playwright E2E tests (3 specs), jsdom environment, `@testing-library/react`, mocked `@/lib/fonts`.
- **Code quality** — TypeScript strict mode (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`), ESLint flat config (zero warnings), Prettier with `prettier-plugin-tailwindcss`, zero `any` in source.
- **Security headers** — X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy camera/microphone/geolocation disabled.

### 2.2 What's Pure Placeholder (Must Be Built)

Validated against the codebase on 2026-06-27. Every claim below was confirmed by static analysis.

| Current State | Production Requirement | Domain |
|---|---|---|
| `export const dynamic = 'force-static'` in `page.tsx` | Hybrid rendering (static marketing + dynamic app) | Foundation |
| No `src/app/api/` directory | Full API route layer + Server Actions | Foundation |
| No `src/middleware.ts` | Auth middleware protecting `/dashboard`, `/create`, `/settings` | Auth |
| No auth/DB/Stripe/AI imports anywhere in `src/` | Auth.js v5, Prisma, Stripe, OpenAI, Replicate, ElevenLabs, Inngest | All |
| No `prisma/schema.prisma` | Full schema: User, Project, Character, Scene, Video, Subscription, UsageEvent | Database |
| No `.env` or `.env.example` | 15+ env vars, Zod-validated at module load | Foundation |
| `package.json` has only UI primitives (Radix, clsx, lucide, geist, tailwind-merge) | Add ~20 production deps (auth, db, ai, queue, storage, billing) | All |
| 14 placeholder links (8 `href="#"`, 4 `/auth/sign-up`, 2 hash anchors) | Real routing to authenticated app | All |
| `/auth/sign-up`, `/dashboard`, `/create/prompt`, `/pricing`, `/blog`, `/contact` all 404 | Real pages with real functionality | All |
| No Server Actions (`'use server'` absent) | Server Actions for every mutation (create project, generate, export) | All |
| No file storage | R2 buckets for uploads, generated images, rendered videos | Infrastructure |
| No job queue | Inngest orchestration for multi-step AI pipeline (5–15 min jobs) | AI Pipeline |
| No billing | Stripe Checkout + Customer Portal + Webhooks + usage metering | Billing |
| No content moderation | OpenAI Moderation API on every text input + generated image | Security |

---

## 3. Architectural Decision Records (ADRs)

All decisions are **ACCEPTED**. The implementing agent executes them without re-deliberation. To change a decision, escalate to the stakeholder and update this document with a superseding ADR.

### ADR-001: Authentication Provider — Auth.js v5 (NextAuth)

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** The app needs authentication (signup, login, OAuth, password reset, session management). The marketing page already routes "Get Started" to `/auth/sign-up`. The choice must integrate with Next.js 16 App Router, PostgreSQL, and support OAuth social login to reduce signup friction.

**Options considered.**
1. **Auth.js v5 (NextAuth)** — self-hosted, open-source, Prisma adapter, supports credentials + OAuth + magic links. Free. Most flexible.
2. **Clerk** — managed, $25/mo base + per-MAU, fastest setup, vendor lock-in, beautiful prebuilt UI.
3. **Supabase Auth** — bundled with Supabase Postgres, JWT-based, less customizable.
4. **Lucia** — lightweight, type-safe, but smaller ecosystem and more manual wiring.

**Decision.** **Auth.js v5** (`next-auth@5.0.0-beta`) with the `@auth/drizzle-adapter` (or Prisma adapter — see ADR-004). Google OAuth as the primary social provider; credentials (email/password) as fallback. Magic-link email sign-in via Resend as a secondary flow.

**Rationale.** Auth.js is the canonical Next.js auth library, has zero vendor lock-in, integrates cleanly with Drizzle/Prisma, and is free. The `nextjs16-react19-postgres17` skill (referenced by the stakeholder) documents the exact Auth.js v5 + Drizzle adapter pattern with the `verifySession()` DAL function, the `AdminGuard` layout-boundary pattern, and the Server Action auth-first pattern. Clerk's $25/mo base cost and lock-in are unjustified for an MVP.

**Consequences.**
- Positive: Full control over auth flows, no per-user cost, integrates with our Postgres, supports any OAuth provider.
- Negative: We own session security (must follow the security checklist rigorously), more setup code than Clerk, no prebuilt UI components (we build our own using the existing shadcn primitives).
- Mitigation: Follow the `AdminGuard` + `verifySession()` patterns from the skill exactly. Never wrap `verifySession()` in try/catch (it throws `NEXT_REDIRECT` which must propagate).

**Implementation reference:** `skills/nextjs16-react19-postgres17/SKILL.md` §5 "AdminGuard Pattern" and "Server Action Pattern — Every Action Starts with Auth".

---

### ADR-002: Database Host — Neon (Serverless PostgreSQL)

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** The app needs a PostgreSQL database for users, projects, characters, scenes, videos, subscriptions, and usage events. The database must support preview deployments (each PR gets its own data branch) and scale to zero for cost efficiency during development.

**Options considered.**
1. **Neon** — serverless Postgres, database branching (each PR gets a full data copy), scale-to-zero, generous free tier, standard Postgres wire protocol.
2. **Supabase** — bundled Postgres + Auth + Storage, simpler stack, fewer vendors, but larger lock-in and no native branching.
3. **Vercel Postgres** — Vercel-native, simplest if hosting on Vercel, but is Neon under the hood with less control and higher pricing at scale.
4. **Self-hosted Postgres on Railway/Render** — cheapest at scale, most ops burden, no branching.

**Decision.** **Neon** (serverless Postgres). Use the Neon branching feature so every Vercel preview deployment gets an isolated database branch with copied schema (and optionally copied data).

**Rationale.** Neon's database branching is invaluable for preview deployments — each PR gets a full, isolated database, eliminating the "shared staging database" anti-pattern. Scale-to-zero means no cost during idle development. Standard wire protocol means Prisma/Drizzle connect with no special config. The `nextjs16-react19-postgres17` skill uses Neon-style `DATABASE_URL=postgresql://...` connections.

**Consequences.**
- Positive: Free tier (0.5 GB, 100 compute hours/mo), branching for previews, serverless scaling, standard Postgres.
- Negative: Cold starts (~300ms) on first query after idle; mitigated by Neon's connection pooler (`-pooler` suffix on host).
- Mitigation: Use the Neon pooled connection string (`DATABASE_URL` with `-pooler`) for the app, and the direct connection for Prisma Migrate.

---

### ADR-003: ORM — Drizzle (with Zod env validation)

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** The app needs a type-safe ORM for PostgreSQL. The choice must integrate with Auth.js v5 (`@auth/drizzle-adapter` exists), support strict TypeScript, and have a migration story. Separately, environment variables need fail-fast validation.

**Options considered.**
1. **Drizzle ORM** — SQL-first, type-safe, lightweight, `@auth/drizzle-adapter` available, excellent TypeScript inference, `drizzle-kit` for migrations.
2. **Prisma** — most popular, mature, declarative schema, `@auth/prisma-adapter` available, heavier runtime, schema language is non-SQL.
3. **Kysely** — query-builder-only, no schema definition, most manual, lightest.

**Decision.** **Drizzle ORM** (`drizzle-orm@^0.45` + `drizzle-kit@^0.31` + `postgres@^3.4` driver). Schemas defined as TypeScript objects in `src/lib/db/schema/`. Migrations via `drizzle-kit generate` + `drizzle-kit migrate`. Env validation via Zod in `src/lib/env/index.ts`.

**Rationale.** The `nextjs16-react19-postgres17` skill — explicitly referenced by the stakeholder — is built on Drizzle + Auth.js v5 + `@auth/drizzle-adapter`. Following that skill's patterns directly minimizes integration risk. Drizzle's SQL-first approach aligns with the project's "no magic" ethos (the marketing clone already rejects `tailwind.config.ts` in favor of CSS-first). Drizzle's runtime is lighter than Prisma's. The skill also documents the Zod env-validation pattern (`src/lib/env/index.ts`) which the stakeholder's project should adopt wholesale.

**Note on the `fullstack-dev` skill:** The `skills/fullstack-dev/SKILL.md` mentions Prisma, but that skill is a generic Next.js scaffold. The `nextjs16-react19-postgres17` skill is more specific and more recent — it takes precedence. Use Drizzle, not Prisma.

**Consequences.**
- Positive: Type-safe, SQL-first, lightweight, `@auth/drizzle-adapter` compatible, matches the referenced skill exactly, Zod env validation catches missing/malformed secrets at module load.
- Negative: Drizzle's ecosystem is smaller than Prisma's; fewer community examples. Schema defined in TS (not a separate `.prisma` file) can feel less declarative.
- Mitigation: The referenced skill is a complete working example — follow its schema patterns. Use `drizzle-kit` for migrations from day one; never `db push` in production.

**Critical rule (from the skill):** Never read `process.env.*` directly in production code. Import `env` from `@/lib/env` and access `env.VAR_NAME`. The Zod schema validates everything at module load. Direct `process.env.*` reads bypass validation — typos like `GOOGLE_CLIENTID` (missing underscore) silently return `undefined` and disable OAuth with no error.

---

### ADR-004: Job Orchestration — Inngest

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** The AI video pipeline is a multi-step async process (story analysis → character generation → scene generation → voiceover → video assembly) that takes 5–15 minutes per project. It needs retries, timeouts, observability, concurrency control, and real-time progress updates to the client.

**Options considered.**
1. **Inngest** — serverless-native job orchestration, step functions, automatic retries, built-in dashboard, Next.js SDK, no infra to manage.
2. **Trigger.dev** — similar to Inngest, v3 is self-hostable, good DX, slightly more setup.
3. **BullMQ + Redis** — battle-tested, full control, requires managing Redis (Upstash), more boilerplate.
4. **Plain `setTimeout` + polling** — unacceptable for production; no retries, no observability.

**Decision.** **Inngest** (`inngest` package). Define the pipeline as a multi-step Inngest function. Use Inngest's built-in dashboard for observability during development.

**Rationale.** The AI pipeline is the core product and the highest-risk component. Inngest's step functions map naturally to the 4-step workflow (each step is a checkpoint with automatic retry on failure). Serverless-native means no Redis to manage. The built-in dashboard gives free observability during MVP. BullMQ would work but adds Redis as a dependency and more boilerplate; the operational simplicity of Inngest wins for MVP.

**Consequences.**
- Positive: No infra, step functions with per-step retries, free dashboard, scales automatically, Next.js integration via route handler.
- Negative: Vendor lock-in (Inngest-specific function definitions); migrating to BullMQ later would require rewriting functions. Free tier has concurrency limits.
- Mitigation: Keep pipeline logic in pure domain functions (`src/features/pipeline/domain/`) that Inngest calls — the Inngest function is a thin orchestrator, so swapping engines later is feasible.

---

### ADR-005: File Storage — Cloudflare R2

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** The app stores user-uploaded stories (text, small), AI-generated character portraits and scene images (PNG/WebP, ~1MB each), AI-generated voiceover audio (MP3, ~2MB), background music (MP3, ~3MB), and final rendered videos (MP4, 10–50MB). Egress costs matter — videos are downloaded by users and streamed for preview.

**Options considered.**
1. **Cloudflare R2** — S3-compatible, **zero egress fees**, $0.015/GB stored, generous free tier (10GB).
2. **Vercel Blob** — Vercel-native, simplest API, egress fees apply, pricier at scale.
3. **AWS S3** — industry standard, egress fees ($0.09/GB), most integrations.
4. **Supabase Storage** — bundled with Supabase, simpler, egress fees apply.

**Decision.** **Cloudflare R2** (S3-compatible API via `@aws-sdk/client-s3` or the `r2` SDK). Three buckets: `siv-uploads` (user inputs), `siv-generated` (AI images/audio), `siv-videos` (final MP4s). All private; access via signed URLs with 1-hour expiry.

**Rationale.** Zero egress fees are decisive for a video product. A user who generates and downloads a 50MB video daily would cost ~$1.50/month in S3 egress alone — R2 makes that free. The S3-compatible API means we use the standard AWS SDK, so no vendor lock-in at the code level. R2 integrates with Cloudflare's CDN for fast video preview streaming.

**Consequences.**
- Positive: Zero egress, S3-compatible, generous free tier, CDN-integrated.
- Negative: Slightly more setup than Vercel Blob; must manage signed URLs (don't make buckets public).
- Mitigation: Centralize all storage access in `src/lib/storage/r2.ts` with a typed API (`getSignedUploadUrl`, `getSignedDownloadUrl`). Never expose bucket names to the client.

---

### ADR-006: AI Provider Stack — OpenAI + Replicate + ElevenLabs

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** The pipeline needs: (1) an LLM for story analysis and scene breakdown, (2) an image generation model for character portraits and scene backgrounds with character consistency, (3) a TTS service for voiceover, (4) an ASR service for subtitle alignment, (5) a video compositor for final assembly.

**Options considered (per capability):**

*LLM:*
1. **OpenAI GPT-4o** — strongest general reasoning, JSON mode, broad capability.
2. **Anthropic Claude 3.5 Sonnet** — excellent for long-context narrative analysis.
3. **Both with fallback** — resilience but doubles integration work.

*Image generation:*
1. **Replicate (SDXL + IP-Adapter)** — open-source models, IP-Adapter enables character consistency via reference images, pay-per-second.
2. **DALL-E 3 (OpenAI)** — highest quality single images, no native character consistency.
3. **Midjourney API** — unofficial, unreliable, no consistency API.

*TTS:*
1. **ElevenLabs** — best quality, multilingual, voice cloning, named in the marketing copy.
2. **OpenAI TTS** — cheaper, lower quality, fewer voices.
3. **Play.ht** — comparable to ElevenLabs, smaller ecosystem.

*ASR:*
1. **OpenAI Whisper (API)** — best quality, multilingual, cheap, returns word-level timestamps.
2. **Local Whisper** — free, requires GPU, ops burden.

*Video assembly:*
1. **FFmpeg (serverless function)** — free, full control, cold-start and memory challenges.
2. **Shotstack / Creatomate** — managed video API, reliable, per-render cost ($0.05–$0.20).

**Decision.**
- **LLM:** OpenAI GPT-4o (primary), Anthropic Claude 3.5 Sonnet (fallback for long stories >12K tokens).
- **Image:** Replicate with SDXL + IP-Adapter for character consistency.
- **TTS:** ElevenLabs (matches marketing copy).
- **ASR:** OpenAI Whisper API (word-level timestamps for subtitle sync).
- **Video:** FFmpeg on a Vercel function with 300s timeout for MVP; move to Shotstack if reliability issues emerge.

**Rationale.** OpenAI + ElevenLabs are named in the marketing copy ("ElevenLabs" appears in the Features section), so using them maintains product/marketing alignment. Replicate + IP-Adapter is the current state-of-the-art for open-source character consistency (DALL-E 3 has no native consistency feature). FFmpeg is free and gives full control; Shotstack is the fallback if serverless FFmpeg proves unreliable.

**Consequences.**
- Positive: Best-in-class per capability, IP-Adapter for the hardest problem (consistency), marketing alignment.
- Negative: Four vendors = four API keys, four billing relationships, four failure modes. Per-video cost ~$0.50–$2.00 depending on length and re-rolls.
- Mitigation: Abstract each provider behind a domain interface (`src/features/pipeline/domain/llm.ts`, `image-gen.ts`, `tts.ts`, `asr.ts`) so swapping providers is localized. Implement usage metering from day one (track tokens, generations, minutes per user). Enforce hard per-tier limits.

---

### ADR-007: Billing — Stripe

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** The app needs subscription billing with usage limits. The marketing copy mentions "Free forever plan" and "No credit card required."

**Options considered.**
1. **Stripe** — industry standard, best Next.js integration, Checkout + Customer Portal + Webhooks, supports metered and seat-based billing.
2. **Lemon Squeezy** — Merchant of Record (handles global tax), simpler for solo founders, higher fees (5%+50¢ vs Stripe 2.9%+30¢), fewer features.
3. **Paddle** — also MoR, similar tradeoffs to Lemon Squeezy.

**Decision.** **Stripe** with Stripe Checkout (signup), Stripe Customer Portal (self-service management), and Stripe Webhooks (subscription state sync). Credit-based metering: users buy prepaid credits; each AI generation debits credits. Avoids metered billing complexity and overage surprises.

**Pricing tiers (initial):**
- **Free:** 50 credits/mo (≈1 short video), 720p, watermark, 2 min max.
- **Creator ($19/mo):** 500 credits/mo (≈10 videos), 1080p, no watermark, 10 min max.
- **Pro ($49/mo):** 2000 credits/mo, 4K, 30 min max, priority queue.
- **Studio ($199/mo):** 10000 credits/mo, team seats, API access, custom voices.

**Rationale.** Stripe's Next.js integration is unmatched (official `@stripe/stripe-js`, webhook helpers, customer portal embed). Credit-based metering is simplest for AI products — users prepay, no overage risk, predictable revenue. The "Free forever plan" claim in the marketing copy is honored by the Free tier.

**Consequences.**
- Positive: Industry standard, best DX, credit model is simple and predictable.
- Negative: Stripe doesn't handle global tax (you must register for VAT/MoR if selling to EU/UK); consider Lemon Squeezy for MoR if international tax burden grows.
- Mitigation: Start with Stripe + manual tax handling for US-only launch. If EU/UK demand grows, add Lemon Squeezy as a MoR layer or use Stripe Tax.

---

### ADR-008: Hosting — Vercel

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** The app needs hosting for Next.js 16 with serverless functions, preview deployments, edge middleware, and integrated CI/CD.

**Options considered.**
1. **Vercel** — native Next.js support, preview deployments per PR, edge functions, simplest DX, pricier at scale.
2. **Cloudflare Pages + Workers** — cheaper at scale, more config, Next.js support is improving but not first-class.
3. **Self-hosted on Railway/Render** — cheapest, most ops burden, no preview deployments out of the box.

**Decision.** **Vercel** (Pro plan, $20/mo) for MVP. Reconsider at scale (>100K MAU) when Vercel pricing becomes prohibitive.

**Rationale.** Vercel is the canonical Next.js host. Preview deployments per PR (with Neon database branching — see ADR-002) give isolated, reviewable environments. Edge middleware for auth runs globally with low latency. The DX is unmatched. At MVP scale, the $20/mo is negligible.

**Consequences.**
- Positive: Best Next.js DX, preview deployments, edge middleware, integrated analytics, zero config.
- Negative: Vendor lock-in (Next.js features like PPR work best on Vercel); function execution time limits (300s on Pro) may constrain long video renders; pricing scales steeply.
- Mitigation: Keep the app portable — avoid Vercel-specific APIs (use standard Next.js). Move long-running video assembly to Inngest functions (which run on Inngest's infra, not Vercel's) to bypass the 300s limit. Reconsider hosting at >100K MAU.

---

### ADR-009: Real-Time Updates — Server-Sent Events (SSE)

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** During the 5–15 minute AI pipeline, the user needs real-time progress feedback ("Analyzing story...", "Generating character 1 of 3...", "Rendering video..."). Polling is wasteful; WebSockets require a persistent server.

**Options considered.**
1. **Server-Sent Events (SSE)** — one-way server→client, HTTP-based, auto-reconnect, no special infra, works with Vercel functions (with caveats).
2. **WebSockets (Pusher/Ably)** — bidirectional, requires third-party service, more infra.
3. **Polling** — simplest, wasteful, high latency.

**Decision.** **Server-Sent Events** via a Next.js route handler (`src/app/api/projects/[id]/progress/route.ts`). Inngest writes progress to the database; the SSE stream polls the database every 2s and emits updates. Auto-reconnect handles connection drops.

**Rationale.** SSE is HTTP-based, needs no third-party service, and auto-reconnects natively. The progress data is server→client only (no client→server needed during generation), so SSE's one-way nature is fine. Polling the database every 2s within the SSE handler is simple and avoids Redis pub/sub complexity for MVP. If scale demands it later, swap to Pusher/Ably.

**Consequences.**
- Positive: No infra, auto-reconnect, simple implementation, works on Vercel (with streaming response).
- Negative: Vercel function timeout (300s) may terminate long streams; mitigated by client reconnect on disconnect. SSE has connection limits per browser (6 per domain) — not a concern for single-tab usage.
- Mitigation: Keep the SSE handler thin (poll DB, emit, sleep). Client reconnects on disconnect with exponential backoff. The pipeline itself runs in Inngest (no timeout), not in the SSE handler.

---

### ADR-010: Content Pages — MDX Blog + Static Pricing + Form Contact

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** The marketing page links to `/pricing`, `/blog`, `/contact` — all currently 404. These need to exist for SEO and trust.

**Options considered.**
1. **MDX blog + static pricing + Server Action contact form** — version-controlled content, no CMS, fastest.
2. **Headless CMS (Sanity/Contentful)** — non-technical authors can write, adds a vendor, overkill for MVP.
3. **Notion as CMS** — cheap, syncs to MDX, adds build complexity.

**Decision.**
- **Blog:** MDX files in `src/content/blog/*.mdx`, rendered via `@next/mdx`. Each post is a file, version-controlled, renders statically. No CMS for MVP.
- **Pricing:** Static page (`src/app/pricing/page.tsx`) with the tier table from ADR-007.
- **Contact:** Server Action form that emails via Resend. For MVP, embed a Tally form instead of building a custom form.

**Rationale.** MDX is the simplest blog approach for a version-controlled codebase — no CMS to manage, posts deploy with the code. Static pricing is fast and SEO-friendly. A Tally embed for contact avoids building form validation, spam protection, and email infrastructure for a low-traffic page.

**Consequences.**
- Positive: No CMS vendor, content deploys with code, fast and SEO-friendly.
- Negative: Non-technical authors can't write blog posts without a PR. Mitigated by keeping MDX simple and providing a post template.
- Mitigation: If blog cadence demands a CMS post-MVP, migrate to Sanity with MDX-compatible sync.

---

### ADR-011: Content Moderation — OpenAI Moderation API (Mandatory)

**Status:** ACCEPTED
**Date:** 2026-06-27

**Context.** The app generates AI images and video from user-submitted text. Users could submit prohibited content (CSAM, violence, copyright infringement). The app is legally liable for AI-generated output. OpenAI and Replicate will ban accounts that generate prohibited content.

**Options considered.**
1. **OpenAI Moderation API on all inputs + outputs** — free, fast, reliable, covers text and images.
2. **Manual review queue only** — doesn't scale, liability risk during review lag.
3. **Third-party (Azure Content Safety, AWS Rekognition)** — more coverage, more cost, more integration.

**Decision.** **OpenAI Moderation API** on every user-submitted story (before pipeline starts) and every generated image (before storing to R2). Flagged content is blocked; the user sees a generic error. Repeated violations auto-suspend the account. A manual review queue (admin-only) handles edge cases.

**Rationale.** Content moderation is non-optional for AI generation products. OpenAI Moderation is free, fast (<200ms), and covers the critical categories (hate, self-harm, sexual, violence). Running it on both input (story) and output (generated images) catches both prohibited prompts and model failures.

**Consequences.**
- Positive: Liability mitigation, platform-account protection, free, fast.
- Negative: False positives may block legitimate creative content (e.g., a violent mystery story). Adds latency to the pipeline.
- Mitigation: Set moderation thresholds conservatively for auto-block, route borderline cases to a manual review queue. Document the moderation policy in the Terms of Service (required for production — see Domain 6).

---

## 4. The 8 Production Domains

This section maps the eight functional domains a production SaaS requires. Each domain lists its scope, the ADRs that govern it, the skill references, and the key implementation patterns. Detailed TDD task cards are in Section 6 (Phased Roadmap).

### Domain 1: Foundation & Configuration

**Scope:** Convert the static marketing clone into a hybrid Next.js app. Remove `force-static`. Add Drizzle, Auth.js, Inngest, Stripe, R2, env validation, security headers, and the 5-layer architecture.

**ADRs:** ADR-001 (Auth.js), ADR-002 (Neon), ADR-003 (Drizzle), ADR-004 (Inngest), ADR-005 (R2), ADR-008 (Vercel).

**Skill references:**
- `skills/nextjs16-react19-postgres17/SKILL.md` — §2 (Tech Stack & Env Vars), §3 (Bootstrapping), §5 (5-Layer Architecture, Server Components, Suspense pattern, queries.ts boundary).
- `skills/security-and-hardening/SKILL.md` — §OWASP Top 10, Input Validation, Rate Limiting, Secrets Management.

**Key patterns:**
- **Env validation:** `src/lib/env/index.ts` — Zod schema validating all env vars at module load. App fails fast on missing/invalid. Never read `process.env.*` directly.
- **`next.config.ts` production flags:** `cacheComponents: true` (top-level), `cacheLife` profiles (top-level), `turbopack: {}` (top-level), full CSP/HSTS/XFO/XCTO headers. Flag placement is critical (see skill's placement table).
- **5-layer architecture:** Layer 0 (middleware) → Layer 1 (App Router) → Layer 2 (Feature Modules) → Layer 3 (Domain Services) → Layer 4 (Infrastructure). Lower layers never import from higher layers.
- **`queries.ts` boundary:** All DB access goes through feature-level `queries.ts` files. No raw Drizzle calls in components.

### Domain 2: Authentication & User Management

**Scope:** Signup, login, Google OAuth, password reset, email verification, session management, route protection via middleware.

**ADRs:** ADR-001 (Auth.js).

**Skill references:**
- `skills/nextjs16-react19-postgres17/SKILL.md` — §5 (AdminGuard Pattern, Server Action Pattern — Every Action Starts with Auth), §6 (verifySession / verifyAdminSession — The DAL Auth Pattern).
- `skills/security-and-hardening/SKILL.md` — §OWASP #2 (Broken Authentication), Security Review Checklist (Authentication).

**Key patterns:**
- **`verifySession()` DAL function:** Returns session or throws `NEXT_REDIRECT`. Never wrap in try/catch (it catches the redirect). API routes use `auth()` directly (returns null → 401 JSON).
- **`AdminGuard` at layout boundary:** Auth at the layout, not per-page. Per-page guards are forbidden — a forgotten guard exposes the page.
- **Server Action auth-first:** Every Server Action starts with `const session = await verifySession();` before any other logic.
- **Middleware:** `src/middleware.ts` checks for session cookie on `/dashboard`, `/create`, `/settings` and redirects to `/sign-in` if absent. NO DB access in middleware (Edge runtime).
- **Rate limiting:** Auth endpoints (login, signup, password reset) — 10 attempts per 15 minutes per IP (Upstash Ratelimit).

### Domain 3: Database & Data Layer

**Scope:** Drizzle schema, migrations, the `queries.ts` boundary, seed data.

**ADRs:** ADR-002 (Neon), ADR-003 (Drizzle).

**Skill references:**
- `skills/nextjs16-react19-postgres17/SKILL.md` — §5 (queries.ts boundary), §6 (cacheLife profile selector).

**Core schema (initial — full Drizzle definitions in Sprint 1 task cards):**
- `users` (Auth.js managed: id, email, name, image, emailVerified, createdAt)
- `accounts` (Auth.js OAuth: provider, providerAccountId, ...)
- `sessions` (Auth.js session: userId, expires, sessionToken)
- `projects` (id, userId, title, story, style, aspectRatio, status, creditsCost, createdAt, updatedAt)
- `characters` (id, projectId, name, description, referenceImageUrl, createdAt)
- `scenes` (id, projectId, order, description, generatedImageUrl, duration, createdAt)
- `videos` (id, projectId, url, duration, resolution, status, createdAt)
- `voiceovers` (id, projectId, voiceId, audioUrl, transcript, createdAt)
- `subscriptions` (id, userId, stripeCustomerId, stripeSubscriptionId, plan, status, creditsRemaining, currentPeriodEnd)
- `usage_events` (id, userId, type, tokens, cost, timestamp) — for metering and audit

**Key patterns:**
- **Migrations via `drizzle-kit`:** `drizzle-kit generate` (create migration from schema diff) → `drizzle-kit migrate` (apply). Never `db push` in production.
- **`queries.ts` per feature:** `src/features/projects/queries.ts` (getProject, getUserProjects, createProject), `src/features/pipeline/queries.ts` (updateProjectStatus, appendScene), etc. Components never call `db` directly.
- **Neon pooled connection:** Use the `-pooler` host for the app; direct host for migrations.

### Domain 4: The Core AI Pipeline (Highest Risk)

**Scope:** The 4-step workflow advertised on the marketing page: (1) project creation, (2) character & scene generation, (3) AI storyboard, (4) voiceover + video assembly.

**ADRs:** ADR-004 (Inngest), ADR-006 (AI providers), ADR-009 (SSE), ADR-011 (Moderation).

**Skill references:**
- `skills/nextjs16-react19-postgres17/SKILL.md` — §7 (BullMQ pipeline — adapt patterns to Inngest; the 4-stage pipeline structure maps directly).
- `skills/llm/SKILL.md`, `skills/video-generation/SKILL.md`, `skills/TTS/SKILL.md`, `skills/ASR/SKILL.md` — z-ai-web-dev-sdk reference implementations (adapt to OpenAI/Replicate/ElevenLabs APIs).
- `skills/storyboard-manager/SKILL.md` — creative writing structure (character development, story structures, consistency checking) — useful for designing the LLM prompt that analyzes stories.

**Pipeline architecture (Inngest multi-step function):**
```
Step 0: Content moderation (OpenAI Moderation API on story text) — block if flagged
Step 1: Story analysis (GPT-4o) — extract characters, scenes, narrative beats → JSON
Step 2: Character generation (Replicate SDXL + IP-Adapter) — for each character, generate a reference portrait; this portrait conditions all subsequent scene images
Step 3: Scene image generation (Replicate SDXL + IP-Adapter) — for each scene, generate an image conditioned on the character reference images
Step 4: Voiceover (ElevenLabs) — TTS the narrative; Whisper ASR for word-level timestamps
Step 5: Video assembly (FFmpeg) — composite images + audio + subtitles → MP4
Step 6: Upload to R2, update project status, notify user
```

**Key patterns:**
- **Domain isolation:** Each step is a pure function in `src/features/pipeline/domain/` (`analyzeStory.ts`, `generateCharacter.ts`, `generateScene.ts`, `synthesizeVoice.ts`, `assembleVideo.ts`). The Inngest function orchestrates; the domain functions do the work. This makes the pipeline testable and provider-swappable.
- **Per-step retry:** Inngest retries each step 3× with exponential backoff. Failed steps don't restart the whole pipeline.
- **Progress via DB + SSE:** Each step writes progress to `projects.status` and `projects.progressDetail`. The SSE stream polls and emits.
- **Usage metering:** Each step debits credits from `subscriptions.creditsRemaining`. If credits hit 0, the pipeline halts with a `PAYMENT_REQUIRED` status.
- **Character consistency (the hard problem):** IP-Adapter injects the character reference image as a condition into scene generation. Expect 2 weeks of R&D in Sprint 3. Set user expectations; offer re-generation.

### Domain 5: Billing & Subscriptions

**Scope:** Stripe Checkout, Customer Portal, Webhooks, credit-based metering, tier enforcement.

**ADRs:** ADR-007 (Stripe).

**Skill references:**
- `skills/security-and-hardening/SKILL.md` — §OWASP (webhook signature verification), Secrets Management.

**Key patterns:**
- **Stripe Webhook:** `src/app/api/stripe/webhook/route.ts` — verify signature with `stripe.webhooks.constructEvent()`, handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Idempotency: check event ID in `usage_events` before processing.
- **Credit metering:** `subscriptions.creditsRemaining` column. Each AI generation debits via a transaction. Free tier: 50 credits/mo, auto-refilled on the 1st. Paid tiers: credits purchased via Stripe Checkout (one-time) or included with subscription (monthly).
- **Tier enforcement:** Server Actions check `creditsRemaining > 0` and tier-specific limits (resolution, max duration) before starting the pipeline. Return `PAYMENT_REQUIRED` if exceeded.

### Domain 6: Dashboard & Project Management

**Scope:** Project list, creation wizard, project detail (read-only asset preview + download), empty/loading/error states.

**ADRs:** None specific (uses all).

**Skill references:**
- `skills/nextjs16-react19-postgres17/SKILL.md` — §5 (Suspense + Server Component pattern for dynamic data, `queries.ts` boundary, `useOptimistic` + `startTransition` for instant UI).

**Key patterns:**
- **Project list:** Server Component with `<Suspense fallback={<ProjectListSkeleton />}>` wrapping an async `<ProjectListData />` that calls `getUserProjects()`.
- **Creation wizard:** Reuse the Hero's glass-input widget (story textarea, style chips, ratio toggle, character counter) in a dedicated `/create` route. The Hero on the marketing page links here.
- **Project detail:** Read-only view of generated assets (characters, scenes, voiceover, video). Download button for the final MP4. Re-generate button (debits credits).
- **States:** Loading (skeleton), empty ("No projects yet — create your first"), error ("Something went wrong — retry"), success (project grid). Every list has an empty state.

**Out of MVP scope:** The interactive timeline editor (drag-and-drop scene reordering, voice selection, music upload). This is a major frontend undertaking (2–3 months) and is deferred to post-MVP. The MVP auto-generates; users re-roll, not edit.

### Domain 7: Content Pages (Blog, Pricing, Contact, Legal)

**Scope:** Real pages replacing the `#` placeholders.

**ADRs:** ADR-010 (MDX blog + static pricing + form contact).

**Skill references:**
- `skills/seo-content-writer/SKILL.md` — SEO-optimized content for blog and pricing.

**Key patterns:**
- **Pricing:** `src/app/pricing/page.tsx` — static, tier table from ADR-007, links to Stripe Checkout.
- **Blog:** `src/content/blog/*.mdx` + `src/app/blog/[slug]/page.tsx` — `generateStaticParams` for SSG, frontmatter for metadata, `@next/mdx` for rendering.
- **Contact:** Embed Tally form in `src/app/contact/page.tsx`. No custom form for MVP.
- **Legal (mandatory):** `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` — use Termly or a lawyer-drafted template. **Do not launch without these.** The marketing footer's `#` links to Privacy/Terms/Contact must route to real pages.

### Domain 8: Security, Compliance & Infrastructure

**Scope:** OWASP hardening, content moderation, GDPR/CCPA, monitoring, error tracking, CI/CD.

**ADRs:** ADR-011 (Moderation), ADR-008 (Vercel).

**Skill references:**
- `skills/security-and-hardening/SKILL.md` — full skill (OWASP Top 10, Input Validation, Rate Limiting, Secrets, Security Review Checklist).
- `skills/code-review-and-audit/SKILL.md` — audit pipeline.
- `skills/shipping-and-launch/SKILL.md` — pre-launch checklist.
- `skills/vulnerability-scanner/SKILL.md` — OWASP 2025, supply chain.

**Key patterns:**
- **Input validation:** Zod schema at every Server Action and API route boundary. `safeParse` → 422 on failure.
- **Rate limiting:** Upstash Ratelimit — auth (10/15min), AI generation (5/min per user), export (10/hour per user).
- **Secrets:** `.env.example` committed (placeholders), `.env` + `.env.local` gitignored. `git diff --cached | grep -i "password\|secret\|api_key\|token"` before every commit.
- **Content moderation:** OpenAI Moderation on all inputs + generated images (ADR-011).
- **GDPR/CCPA:** Cookie consent banner, data export endpoint (`/api/user/export` → JSON of all user data), data deletion endpoint (`/api/user/delete` → cascading delete). Privacy policy must disclose AI processing.
- **Monitoring:** Sentry (errors), Vercel Analytics (product), Axiom (logs). Alert on: error rate >1%, Stripe webhook failures, Inngest function failures, moderation flags.
- **CI/CD:** GitHub Actions — `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every PR. Playwright E2E on merge to main. Vercel preview deploy per PR. Deploy gate on main.

---

## 5. Target Architecture

### 5.1 The 5-Layer Request Model (Golden Rule)

Adopted verbatim from `skills/nextjs16-react19-postgres17/SKILL.md` §5. This is the single most important architectural principle. Deviation creates security and consistency bugs.

```
Layer 0: src/middleware.ts        — Cookie check, redirect. NO DB. NO logic. Edge runtime.
Layer 1: src/app/                 — Route structure, metadata, PPR, Suspense. Layouts must NOT fetch data.
Layer 2: src/features/            — UI composition, data binding, mutations (projects, pipeline, billing, auth)
Layer 3: src/features/*/domain/   — Pure business logic. No Next.js or DB runtime imports (import type only)
Layer 4: src/lib/                 — Infrastructure: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers. Side effects only.
```

**Golden Rule:** A lower layer may never import from a higher layer. Domain may import types from Infrastructure but never runtime code. Feature Modules may import from Domain and Infrastructure. App Router may import from Feature Modules.

### 5.2 Target Directory Structure

The existing `src/` structure (app, components, lib, tests, types) is preserved. New directories are added for the application layer. The marketing page (`src/app/page.tsx`, `src/components/sections/`) is untouched.

```
src/
├── app/                          # Layer 1: App Router
│   ├── (marketing)/              # Route group: marketing page (existing, unchanged)
│   │   └── page.tsx              #   The landing page — force-static REMOVED, becomes dynamic
│   ├── (auth)/                   # Route group: auth pages
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (app)/                    # Route group: authenticated app (protected by middleware)
│   │   ├── dashboard/page.tsx
│   │   ├── create/page.tsx
│   │   ├── projects/[id]/page.tsx
│   │   ├── settings/page.tsx
│   │   └── billing/page.tsx
│   ├── pricing/page.tsx          # Public
│   ├── blog/[slug]/page.tsx      # Public, MDX
│   ├── blog/page.tsx             # Public, index
│   ├── contact/page.tsx          # Public, Tally embed
│   ├── privacy/page.tsx          # Public, legal
│   ├── terms/page.tsx            # Public, legal
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # Auth.js catch-all
│   │   ├── inngest/route.ts              # Inngest webhook
│   │   ├── stripe/webhook/route.ts       # Stripe webhook
│   │   └── projects/[id]/progress/route.ts # SSE progress stream
│   ├── layout.tsx                # Root (existing, add SessionProvider)
│   ├── globals.css               # Existing (unchanged — design system preserved)
│   └── icon.tsx                  # Existing
├── components/
│   ├── sections/                 # Existing marketing sections (unchanged)
│   ├── primitives/               # Existing marketing primitives (unchanged)
│   ├── ui/                       # Existing shadcn primitives (extend with form, dialog, etc.)
│   └── app/                      # NEW: app-specific components (dashboard, editor, etc.)
│       ├── project-card.tsx
│       ├── create-wizard.tsx
│       ├── progress-stream.tsx
│       └── empty-state.tsx
├── features/                     # Layer 2 + 3: Feature modules with domain isolation
│   ├── auth/
│   │   ├── queries.ts            # getUserByEmail, createUser, linkAccount
│   │   └── domain/
│   │       └── verify-session.ts # The DAL auth function (throws NEXT_REDIRECT)
│   ├── projects/
│   │   ├── queries.ts            # getProject, getUserProjects, createProject, updateProjectStatus
│   │   ├── actions.ts            # Server Actions: createProjectAction, regenerateProjectAction
│   │   └── domain/
│   │       └── validate-story.ts # Story length, content rules
│   ├── pipeline/
│   │   ├── queries.ts            # appendCharacter, appendScene, setVideoUrl
│   │   ├── inngest.ts            # The Inngest function (orchestrator)
│   │   └── domain/               # Pure functions (no Next.js, no DB runtime)
│   │       ├── analyze-story.ts          # GPT-4o call
│   │       ├── generate-character.ts     # Replicate SDXL + IP-Adapter
│   │       ├── generate-scene.ts         # Replicate SDXL + IP-Adapter (conditioned)
│   │       ├── synthesize-voice.ts       # ElevenLabs TTS
│   │       ├── align-subtitles.ts        # Whisper ASR word timestamps
│   │       ├── assemble-video.ts         # FFmpeg compositor
│   │       └── moderate-content.ts       # OpenAI Moderation API
│   ├── billing/
│   │   ├── queries.ts            # getSubscription, debitCredits, refillCredits
│   │   ├── actions.ts            # Server Actions: checkoutAction, portalAction
│   │   └── domain/
│   │       ├── stripe-webhook.ts # Event handlers
│   │       └── tier-limits.ts    # Per-tier resolution/max/credit costs
│   └── usage/
│       ├── queries.ts            # logUsageEvent, getUsageSummary
│       └── domain/
│           └── credit-pricing.ts # Cost per operation
├── lib/                          # Layer 4: Infrastructure
│   ├── db/
│   │   ├── index.ts              # Drizzle client (Neon pooled connection)
│   │   ├── schema/               # Drizzle schema files (one per table group)
│   │   │   ├── auth.ts           # users, accounts, sessions
│   │   │   ├── projects.ts       # projects, characters, scenes
│   │   │   ├── media.ts          # videos, voiceovers
│   │   │   ├── billing.ts        # subscriptions, usage_events
│   │   │   └── index.ts          # Re-exports all
│   │   └── migrate.ts            # drizzle-kit migrate wrapper
│   ├── env/
│   │   └── index.ts              # Zod-validated env (CRITICAL: never use process.env.* directly)
│   ├── auth/
│   │   ├── config.ts             # Auth.js v5 config (providers, adapter, callbacks)
│   │   └── index.ts              # Re-exports handlers, signIn, signOut, auth
│   ├── inngest/
│   │   ├── client.ts             # Inngest client
│   │   └── functions.ts          # Function registrations
│   ├── storage/
│   │   └── r2.ts                 # getSignedUploadUrl, getSignedDownloadUrl
│   ├── stripe/
│   │   └── client.ts             # Stripe SDK client
│   ├── ai/
│   │   ├── openai.ts             # GPT-4o, Whisper, Moderation
│   │   ├── replicate.ts          # SDXL + IP-Adapter
│   │   └── elevenlabs.ts         # TTS
│   ├── ratelimit/
│   │   └── index.ts              # Upstash Ratelimit
│   ├── fonts.ts                  # Existing (unchanged)
│   ├── utils.ts                  # Existing (unchanged)
│   └── hooks/                    # Existing (extend with useProgressStream, useCredits)
├── content/
│   └── blog/                     # MDX blog posts (*.mdx)
├── tests/
│   ├── unit/                     # Existing (extend with domain tests)
│   ├── e2e/                      # Existing (extend with auth, dashboard, create flows)
│   ├── integration/              # NEW: DB integration tests (testcontainers)
│   └── setup.ts                  # Existing
├── types/
│   └── index.ts                  # Existing (extend with app types)
└── middleware.ts                 # Layer 0: Auth route protection (Edge runtime)
```

### 5.3 Configuration Files to Create/Modify

**`next.config.ts`** — Add `cacheComponents: true`, `cacheLife` profiles, `turbopack: {}` (all top-level), and full CSP/HSTS headers. See ADR-001's skill reference for the exact config and the critical flag-placement table. Remove nothing from the existing config (security headers, image formats, allowedDevOrigins stay).

**`src/lib/env/index.ts`** — Zod schema for all env vars. App fails fast at module load if any required var is missing or invalid. `AUTH_SECRET` rejects known-weak values in production via `superRefine`. Never read `process.env.*` directly in production code — import `env` from `@/lib/env`.

**`.env.example`** — Committed; placeholder values only. Required vars (15+): `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (for migrations), `AUTH_SECRET`, `AUTH_URL`, `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`, `ELEVENLABS_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_UPLOADS`, `R2_BUCKET_GENERATED`, `R2_BUCKET_VIDEOS`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SENTRY_DSN`.

**`drizzle.config.ts`** — Points to `src/lib/db/schema/index.ts`, uses `DATABASE_URL_UNPOOLED` for migrations.

---

## 6. Phased Roadmap with TDD Task Cards

Four sprints, each 2–3 weeks. Each task is a TDD card: write the failing test (RED), implement the minimal code to pass (GREEN), refactor (REFACTOR), commit. One commit per card. Run the full quality gate (`pnpm lint && pnpm typecheck && pnpm test && pnpm build`) before every commit.

### Sprint 1: Foundation & Auth (Weeks 1–3)

**Goal:** User can sign up, log in, see an empty dashboard. No AI yet.

**Exit criteria:**
- `force-static` removed; app is hybrid.
- Drizzle + Neon + migrations working; schema deployed.
- Auth.js v5 with Google OAuth + credentials; sessions work.
- Middleware protects `/dashboard`, `/create`, `/settings`, `/billing`.
- Marketing CTAs route to real auth pages.
- All existing 45 unit + 11 E2E tests still pass; new tests added.

---

#### Task Card S1-01: Remove `force-static` + restructure routes

**Sprint:** 1 | **Domain:** Foundation | **Files:** `src/app/page.tsx`, `src/app/(marketing)/page.tsx` (move), `src/app/layout.tsx`

**RED:** Write a test (`src/tests/unit/routing.test.ts`) asserting `page.tsx` does NOT export `dynamic = 'force-static'`. Run → fails (currently exports it).

**GREEN:** Remove `export const dynamic = 'force-static'` from `page.tsx`. Move `page.tsx` into `src/app/(marketing)/page.tsx` route group (URL stays `/`). Verify the marketing page still renders.

**REFACTOR:** Ensure `layout.tsx` still wraps all route groups (root layout).

**Acceptance criteria:**
- `pnpm test` passes (new test green, all 45 existing still pass).
- `pnpm build` succeeds — marketing page is still statically prerendered (it has no dynamic data), app routes are dynamic.
- Visiting `/` renders the marketing page unchanged.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §5 (Server Components by Default, Suspense pattern).

---

#### Task Card S1-02: Zod env validation module

**Sprint:** 1 | **Domain:** Foundation | **Files:** `src/lib/env/index.ts`, `.env.example`, `src/tests/unit/env.test.ts`

**RED:** Write tests asserting: (1) `env.DATABASE_URL` is accessible after import, (2) missing required var throws at module load with a descriptive message, (3) weak `AUTH_SECRET` is rejected in production. Run → fails (module doesn't exist).

**GREEN:** Create `src/lib/env/index.ts` with a Zod schema for all 15+ env vars. Use `z.string().url()` for URLs, `z.string().min(32)` for `AUTH_SECRET` with a `superRefine` rejecting known-weak values. Export a typed `env` object. Create `.env.example` with placeholder values.

**REFACTOR:** Ensure the error message names the missing var.

**Acceptance criteria:**
- App fails fast on `pnpm build` if `.env` is missing required vars.
- Importing `env` from `@/lib/env` gives typed access; `process.env.*` is never used elsewhere.
- `git diff --cached | grep process.env` returns nothing in `src/` (except `env/index.ts`).

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §2 (Environment Variables) + §3.

---

#### Task Card S1-03: Drizzle + Neon setup + initial schema

**Sprint:** 1 | **Domain:** Database | **Files:** `drizzle.config.ts`, `src/lib/db/index.ts`, `src/lib/db/schema/{auth,projects,media,billing}.ts`, `src/lib/db/schema/index.ts`, `src/tests/integration/db.test.ts`

**RED:** Write an integration test (`src/tests/integration/db.test.ts`) using `@testcontainers/postgresql` asserting: (1) `db` client connects, (2) `db.query.users.findMany()` returns an array (table exists), (3) `db.query.projects.findMany()` returns an array. Run → fails (no db, no schema).

**GREEN:** Install `drizzle-orm`, `postgres`, `drizzle-kit` (`pnpm add drizzle-orm@^0.45 postgres@^3.4 && pnpm add -D drizzle-kit@^0.31 @testcontainers/postgresql@^12`). Create `drizzle.config.ts`. Create schema files: `auth.ts` (users, accounts, sessions — Auth.js shape), `projects.ts` (projects, characters, scenes), `media.ts` (videos, voiceovers), `billing.ts` (subscriptions, usage_events). Create `src/lib/db/index.ts` exporting the Drizzle client (Neon pooled connection). Run `drizzle-kit generate` → migration SQL. Run `drizzle-kit migrate` against the test container.

**REFACTOR:** Ensure schema files use Drizzle's `pgTable` consistently; relations defined for joins.

**Acceptance criteria:**
- `pnpm test` passes including the new integration test.
- `drizzle-kit studio` opens and shows all tables.
- Migration SQL is committed in `drizzle/` directory.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §2 (Drizzle + postgres versions), §5 (queries.ts boundary).

---

#### Task Card S1-04: Auth.js v5 configuration + Google OAuth

**Sprint:** 1 | **Domain:** Auth | **Files:** `src/lib/auth/config.ts`, `src/lib/auth/index.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/lib/auth/adapter.ts` (Drizzle adapter wiring)

**RED:** Write a test (`src/tests/unit/auth-config.test.ts`) asserting: (1) `auth`, `handlers`, `signIn`, `signOut` are exported, (2) providers array includes GoogleProvider and CredentialsProvider, (3) the Drizzle adapter is wired. Run → fails (module doesn't exist).

**GREEN:** Install `next-auth@5.0.0-beta @auth/drizzle-adapter`. Create `src/lib/auth/config.ts` with Auth.js v5 config: Google provider (from `GOOGLE_CLIENT_ID`/`SECRET`), Credentials provider (email/password via `bcryptjs`), Drizzle adapter pointing to schema. Create `src/app/api/auth/[...nextauth]/route.ts` exporting `{ GET, POST }` from `handlers`. Create `src/lib/auth/index.ts` re-exporting.

**REFACTOR:** Ensure `AUTH_SECRET` is read from the validated `env` module, not `process.env`.

**Acceptance criteria:**
- `/api/auth/providers` returns JSON listing Google and Credentials.
- Google OAuth redirect works (requires real Google OAuth app credentials in `.env`).
- `pnpm test` passes.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §5 (AdminGuard Pattern, Server Action Pattern), §6 (verifySession).

---

#### Task Card S1-05: `verifySession()` DAL function

**Sprint:** 1 | **Domain:** Auth | **Files:** `src/features/auth/domain/verify-session.ts`, `src/tests/unit/verify-session.test.ts`

**RED:** Write tests asserting: (1) `verifySession()` returns the session object when authenticated, (2) it throws `NEXT_REDIRECT` when unauthenticated (mock `auth()` returning null + `redirect()` throwing). Run → fails.

**GREEN:** Implement `verifySession()`: call `auth()`; if null, call `redirect('/sign-in')` (which throws `NEXT_REDIRECT`); else return session. Document: never wrap in try/catch.

**REFACTOR:** Add JSDoc explaining the redirect-throw semantics.

**Acceptance criteria:**
- Test verifies both the authenticated and unauthenticated paths.
- No try/catch around `verifySession()` in the implementation.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §6 (verifySession — The DAL Auth Pattern).

---

#### Task Card S1-06: Auth pages (sign-in, sign-up, forgot-password)

**Sprint:** 1 | **Domain:** Auth | **Files:** `src/app/(auth)/sign-in/page.tsx`, `sign-up/page.tsx`, `forgot-password/page.tsx`, `src/components/app/auth-form.tsx`, `src/tests/e2e/auth.spec.ts`

**RED:** Write E2E tests (`src/tests/e2e/auth.spec.ts`): (1) visiting `/sign-in` shows email + password fields + Google button, (2) visiting `/sign-up` shows signup form, (3) successful signup redirects to `/dashboard`, (4) unauthenticated visit to `/dashboard` redirects to `/sign-in`. Run → fails (pages don't exist).

**GREEN:** Build the auth pages using existing shadcn/ui primitives (extend `src/components/ui/` with `input.tsx`, `label.tsx`, `form.tsx` via `pnpm dlx shadcn@latest add input label form`). Use the luxury-dark design system (bg `#020202`, amber accents, Geist Sans). Wire forms to `signIn`/`signUp` Server Actions.

**REFACTOR:** Extract shared `AuthForm` component for consistent styling.

**Acceptance criteria:**
- E2E tests pass.
- Auth pages match the marketing page's visual language (dark, amber, Outfit headings).
- Google OAuth button initiates the OAuth flow.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §5 (Server Components by Default, Suspense pattern).

---

#### Task Card S1-07: Middleware (route protection)

**Sprint:** 1 | **Domain:** Auth | **Files:** `src/middleware.ts`, `src/tests/unit/middleware.test.ts`

**RED:** Write tests asserting: (1) request to `/dashboard` without session cookie → 307 redirect to `/sign-in?callbackUrl=/dashboard`, (2) request to `/dashboard` with valid session cookie → passes through, (3) request to `/` (marketing) → passes through regardless. Run → fails (no middleware).

**GREEN:** Create `src/middleware.ts` using `next-auth`'s `withAuth` wrapper. Protect `/dashboard/:path*`, `/create/:path*`, `/settings/:path*`, `/billing/:path*`. NO DB access (Edge runtime). The middleware only checks cookie presence; actual session validity is checked by `verifySession()` in Server Components/Actions.

**REFACTOR:** Use the `config.matcher` to limit middleware to protected paths (don't run on static assets).

**Acceptance criteria:**
- Tests pass.
- Unauthenticated access to protected routes redirects.
- Marketing page and auth pages are unaffected.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §5 (Layer 0: proxy.ts — Cookie check, redirect. NO DB. NO logic.).

---

#### Task Card S1-08: Dashboard shell + empty state

**Sprint:** 1 | **Domain:** Dashboard | **Files:** `src/app/(app)/dashboard/page.tsx`, `src/components/app/project-card.tsx`, `src/components/app/empty-state.tsx`, `src/features/projects/queries.ts`, `src/tests/e2e/dashboard.spec.ts`

**RED:** Write E2E tests: (1) authenticated visit to `/dashboard` shows "No projects yet" empty state, (2) the empty state has a "Create your first video" CTA linking to `/create`. Run → fails.

**GREEN:** Create `src/features/projects/queries.ts` with `getUserProjects(userId)` (returns `[]` for new users). Create the dashboard page: Server Component wrapping `<Suspense fallback={<DashboardSkeleton />}>` around an async `<ProjectListData />` that calls `getUserProjects()`. If empty, render `<EmptyState>` with CTA.

**REFACTOR:** Extract `EmptyState` as a reusable primitive (icon + title + description + CTA).

**Acceptance criteria:**
- E2E tests pass.
- Dashboard renders the empty state for new users.
- Suspense fallback (skeleton) shows during load.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §5 (Suspense + Server Component Pattern, queries.ts boundary).

---

#### Task Card S1-09: Wire marketing CTAs to real routes

**Sprint:** 1 | **Domain:** Foundation | **Files:** `src/components/sections/navbar.tsx`, `hero.tsx`, `final-cta.tsx`, `features.tsx`, `testimonials.tsx`, `use-cases.tsx`, `workflow.tsx`, `src/lib/data/nav-links.ts`, `src/lib/data/footer-links.ts`

**RED:** Write a test (`src/tests/unit/cta-routes.test.ts`) asserting: (1) navbar "Sign in" links to `/sign-in`, (2) navbar "Get Started" links to `/sign-up`, (3) hero "Start Creating" links to `/create` (not `/auth/sign-up`), (4) nav "Pricing" links to `/pricing`, (5) nav "Blog" links to `/blog`, (6) nav "Contact" links to `/contact`. Run → fails (current links are `#` or `/auth/sign-up`).

**GREEN:** Update `nav-links.ts`: `Features → #features`, `Pricing → /pricing`, `Blog → /blog`, `Contact → /contact`. Update `navbar.tsx`: Sign in → `/sign-in`, Get Started → `/sign-up`. Update `hero.tsx`: Start Creating → `/create` (requires auth; middleware redirects to sign-in if unauthenticated). Update `final-cta.tsx`: CTA → `/create`. Update `features.tsx`, `testimonials.tsx`: CTAs → `/create`. Update `use-cases.tsx`: card links → `/create`. Update `workflow.tsx`: step CTAs → `/create`. Update `footer-links.ts`: Privacy → `/privacy`, Terms → `/terms`, Contact → `/contact`.

**REFACTOR:** Ensure `next/link` is used for all internal routes (not `<a>`).

**Acceptance criteria:**
- All 14 placeholder links are replaced with real routes.
- Test passes; E2E tests for hero CTA still pass (update expected href from `/auth/sign-up` to `/create`).

**Skill ref:** Project's existing `CLAUDE.md` (next/link rule, library discipline).

---

### Sprint 2: Project Creation + Story Analysis (Weeks 4–5)

**Goal:** User can paste a story and see AI-extracted characters/scenes. No images yet.

**Exit criteria:**
- Create wizard (story textarea, style picker, ratio toggle) reusing Hero UI.
- OpenAI GPT-4o integration for story analysis.
- Project saved to DB; analysis results displayed.
- Usage metering foundation (credits debited for analysis).
- Content moderation on story input.

---

#### Task Card S2-01: Create wizard page (reuse Hero UI)

**Sprint:** 2 | **Domain:** Dashboard | **Files:** `src/app/(app)/create/page.tsx`, `src/components/app/create-wizard.tsx`, `src/tests/e2e/create-wizard.spec.ts`

**RED:** E2E tests: (1) `/create` shows the story textarea + style chips + ratio toggle (reused from Hero), (2) the character counter works (from the remediated Hero), (3) "Generate" button is disabled when story is empty, (4) submitting redirects to `/projects/[id]`.

**GREEN:** Build `create-wizard.tsx` as a client component reusing the Hero's `glass-input`, style chips, ratio toggle, and character counter. On submit, call the `createProjectAction` Server Action. Redirect to the project detail page.

**REFACTOR:** Extract the shared input widget into `src/components/app/story-input.tsx` (used by both Hero and Create wizard).

**Acceptance criteria:**
- E2E tests pass.
- The create page visually matches the Hero's input (same glass, amber, counter).
- Empty story disables submit.

**Skill ref:** Project's existing `hero.tsx` (the widget to extract).

---

#### Task Card S2-02: `createProjectAction` Server Action

**Sprint:** 2 | **Domain:** Projects | **Files:** `src/features/projects/actions.ts`, `src/features/projects/domain/validate-story.ts`, `src/tests/unit/create-project-action.test.ts`

**RED:** Write tests asserting: (1) unauthenticated call throws (redirect), (2) story < 100 chars returns validation error, (3) story > 5000 chars returns validation error, (4) valid input creates a project (mock `db.insert`) and returns `{ projectId }`, (5) credits are debited (mock `debitCredits`). Run → fails.

**GREEN:** Implement `createProjectAction`: (1) `verifySession()`, (2) Zod validate input (`CreateProjectSchema`: story 100–5000 chars, style enum, ratio enum), (3) `moderateContent(story)` — if flagged, return error, (4) `debitCredits(userId, COST_ANALYSIS)` — if insufficient, return `PAYMENT_REQUIRED`, (5) `db.insert(projects)`, (6) trigger Inngest `pipeline.started` event, (7) `revalidatePath('/dashboard')`, (8) return `{ projectId }`.

**REFACTOR:** Extract `validate-story.ts` as a pure domain function (no Next.js/DB imports).

**Acceptance criteria:**
- All 5 test cases pass.
- The action follows the auth-first pattern (verifySession before any logic).

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §5 (Server Action Pattern — Every Action Starts with Auth), `skills/security-and-hardening/SKILL.md` (Input Validation).

---

#### Task Card S2-03: OpenAI integration + story analysis domain function

**Sprint:** 2 | **Domain:** Pipeline | **Files:** `src/lib/ai/openai.ts`, `src/features/pipeline/domain/analyze-story.ts`, `src/features/pipeline/domain/moderate-content.ts`, `src/tests/unit/analyze-story.test.ts`

**RED:** Write tests (mock OpenAI): (1) `analyzeStory(story)` returns `{ characters: [{name, description}], scenes: [{order, description, characters: [names]}] }`, (2) invalid API response throws, (3) `moderateContent(story)` returns `{ flagged: false }` for clean text, (4) `moderateContent` returns `{ flagged: true, categories: [...] }` for prohibited text. Run → fails.

**GREEN:** Install `openai` (`pnpm add openai`). Create `src/lib/ai/openai.ts` with a typed client. Create `analyze-story.ts`: GPT-4o call with a structured prompt (use the `storyboard-manager` skill's character development + story structure references for prompt design). Use JSON mode (`response_format: { type: 'json_object' }`). Create `moderate-content.ts`: call `openai.moderations.create()`.

**REFACTOR:** Define `AnalyzedStory` type in `src/features/pipeline/domain/types.ts`.

**Acceptance criteria:**
- Tests pass with mocked OpenAI.
- Real OpenAI call (manual test with `.env` key) returns valid JSON for a sample story.
- Moderation blocks a test prohibited prompt.

**Skill ref:** `skills/llm/SKILL.md` (LLM patterns — adapt to OpenAI SDK), `skills/storyboard-manager/SKILL.md` (character/story structure for prompt design).

---

#### Task Card S2-04: Project detail page (analysis results)

**Sprint:** 2 | **Domain:** Dashboard | **Files:** `src/app/(app)/projects/[id]/page.tsx`, `src/components/app/analysis-results.tsx`, `src/features/projects/queries.ts` (extend), `src/tests/e2e/project-detail.spec.ts`

**RED:** E2E tests: (1) project detail page shows the title + story, (2) shows the list of extracted characters with names + descriptions, (3) shows the scene breakdown, (4) shows "Continue to Generation" CTA (disabled — Sprint 3).

**GREEN:** Create the project detail page: Server Component with `<Suspense>` wrapping async `<ProjectDetailData />` calling `getProject(id)` (joins characters + scenes). Render analysis results read-only. Handle 404 (not found) and 403 (not owner).

**REFACTOR:** Add owner check to `getProject` (throw 403 if `project.userId !== session.user.id`).

**Acceptance criteria:**
- E2E tests pass.
- Non-owner access returns 403.
- Non-existent project returns 404.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §5 (queries.ts boundary, Suspense pattern).

---

#### Task Card S2-05: Inngest setup + pipeline skeleton

**Sprint:** 2 | **Domain:** Pipeline | **Files:** `src/lib/inngest/client.ts`, `src/lib/inngest/functions.ts`, `src/app/api/inngest/route.ts`, `src/features/pipeline/inngest.ts`, `src/tests/unit/inngest-pipeline.test.ts`

**RED:** Write tests asserting: (1) Inngest client is exported, (2) the pipeline function is registered with the correct event trigger (`pipeline.started`), (3) the function has 6 steps (moderation, analysis, characters, scenes, voiceover, assembly) — even if they're stubs. Run → fails.

**GREEN:** Install `inngest` (`pnpm add inngest`). Create the client. Create `src/features/pipeline/inngest.ts` defining the multi-step function with `inngest.createFunction`. Each step calls the corresponding domain function (stubs for S2; real in S3/S4). Create the Inngest webhook route handler. Register the function in `src/lib/inngest/functions.ts`.

**REFACTOR:** Ensure each step is idempotent (Inngest may retry).

**Acceptance criteria:**
- Tests pass.
- The Inngest dev server (`npx inngest-cli@latest dev`) shows the function.
- Triggering `pipeline.started` event runs the function (steps are stubs).

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §7 (BullMQ pipeline — adapt the 4-stage structure to Inngest step functions).

---

#### Task Card S2-06: Credit metering foundation

**Sprint:** 2 | **Domain:** Billing | **Files:** `src/features/billing/queries.ts`, `src/features/billing/domain/tier-limits.ts`, `src/features/usage/queries.ts`, `src/tests/unit/credit-metering.test.ts`

**RED:** Write tests: (1) `debitCredits(userId, amount)` decrements `subscriptions.creditsRemaining` in a transaction, (2) if `creditsRemaining < amount`, throws `InsufficientCreditsError`, (3) `logUsageEvent` records the event, (4) `getUsageSummary` aggregates by day. Run → fails.

**GREEN:** Implement `debitCredits` as a Drizzle transaction (SELECT current, check, UPDATE). Define `tier-limits.ts` with per-tier credit costs (`COST_ANALYSIS = 5`, `COST_CHARACTER = 10`, `COST_SCENE = 8`, `COST_VOICEOVER = 15`, `COST_VIDEO = 30`). Implement `logUsageEvent` and `getUsageSummary`.

**REFACTOR:** Use Drizzle transactions for atomic debit + log.

**Acceptance criteria:**
- Tests pass (integration test with testcontainers).
- Concurrent `debitCredits` calls don't cause race conditions (transaction isolation).

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §5 (queries.ts boundary).

---

### Sprint 3: Image Generation + Character Consistency (Weeks 6–8) — HIGHEST RISK

**Goal:** User generates a storyboard with consistent characters. No video yet.

**Exit criteria:**
- Replicate SDXL + IP-Adapter integration.
- Character portrait generation with reference-image conditioning.
- Scene image generation conditioned on character references.
- R2 storage for generated images.
- Real-time progress via SSE.
- ⚠️ Budget 2 weeks of R&D for character consistency.

---

#### Task Card S3-01: R2 storage layer

**Sprint:** 3 | **Domain:** Infrastructure | **Files:** `src/lib/storage/r2.ts`, `src/tests/unit/r2.test.ts`

**RED:** Write tests (mock S3 client): (1) `getSignedUploadUrl(key, contentType)` returns a URL string, (2) `getSignedDownloadUrl(key)` returns a URL string, (3) invalid bucket name throws. Run → fails.

**GREEN:** Install `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (`pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`). Create `src/lib/storage/r2.ts` with the R2 client (endpoint: `https://<account-id>.r2.cloudflarestorage.com`). Implement signed URL generation (1-hour expiry). Three buckets via env: `R2_BUCKET_UPLOADS`, `R2_BUCKET_GENERATED`, `R2_BUCKET_VIDEOS`.

**REFACTOR:** Type the bucket names as a union to prevent typos.

**Acceptance criteria:**
- Tests pass.
- Manual test: generate a signed upload URL, `curl -X PUT` a file, generate a signed download URL, `curl` it back.

**Skill ref:** `skills/security-and-hardening/SKILL.md` (Secrets Management for R2 keys).

---

#### Task Card S3-02: Replicate integration + character generation

**Sprint:** 3 | **Domain:** Pipeline | **Files:** `src/lib/ai/replicate.ts`, `src/features/pipeline/domain/generate-character.ts`, `src/tests/unit/generate-character.test.ts`

**RED:** Write tests (mock Replicate): (1) `generateCharacter({ name, description, style })` returns `{ imageUrl }`, (2) the prompt includes the style + description, (3) API failure throws with a typed error. Run → fails.

**GREEN:** Install `replicate` (`pnpm add replicate`). Create `src/lib/ai/replicate.ts` with the client. Create `generate-character.ts`: call Replicate's SDXL model with a prompt constructed from the character description + visual style. Upload the result to R2 (`R2_BUCKET_GENERATED`). Return the R2 key + signed URL.

**REFACTOR:** Extract prompt construction into a pure function for testability.

**Acceptance criteria:**
- Tests pass with mocked Replicate.
- Manual test: generate a character, verify the image appears in R2.

**Skill ref:** `skills/image-generation/SKILL.md` (adapt patterns to Replicate API).

---

#### Task Card S3-03: IP-Adapter character consistency (R&D — highest risk)

**Sprint:** 3 | **Domain:** Pipeline | **Files:** `src/features/pipeline/domain/generate-scene.ts`, `src/features/pipeline/domain/character-reference.ts`, `src/tests/unit/generate-scene.test.ts`

**RED:** Write tests (mock Replicate): (1) `generateScene({ description, characterReferences: [{imageUrl, name}] })` returns `{ imageUrl }`, (2) the Replicate call includes the reference images as IP-Adapter inputs, (3) multiple characters each contribute their reference. Run → fails.

**GREEN:** Research the current Replicate SDXL + IP-Adapter model (e.g., `lucataco/sdxl-ipadapter` or similar). Implement `generate-scene.ts`: for each character in the scene, pass their reference portrait as an IP-Adapter input. The model generates a scene image where the characters' faces match the references. Upload to R2.

**REFACTOR:** Extract the IP-Adapter input construction into `character-reference.ts`.

**Acceptance criteria:**
- Tests pass with mocked Replicate.
- **Manual R&D test (the hard part):** generate 3 character references, then generate 3 scenes featuring those characters. Manually verify the faces are consistent across scenes. Document the model ID, parameters, and quality assessment in `src/features/pipeline/domain/CHARACTER_CONSISTENCY_NOTES.md`.
- If consistency is poor after 2 weeks, escalate to stakeholder (decision: accept reduced quality, switch to a managed consistent-character service, or delay Sprint 3).

**Skill ref:** `skills/image-generation/SKILL.md`, `skills/storyboard-manager/SKILL.md` (consistency checking).

---

#### Task Card S3-04: Wire pipeline steps 2 + 3 into Inngest

**Sprint:** 3 | **Domain:** Pipeline | **Files:** `src/features/pipeline/inngest.ts` (extend), `src/features/pipeline/queries.ts`, `src/tests/unit/pipeline-steps-2-3.test.ts`

**RED:** Write tests asserting: (1) after step 2, characters are saved to DB with `referenceImageUrl`, (2) after step 3, scenes are saved with `generatedImageUrl`, (3) progress is updated to "Generating characters" then "Generating scenes". Run → fails.

**GREEN:** Implement the Inngest steps 2 and 3: call `generateCharacter` for each character from the analysis (Sprint 2), save to DB; call `generateScene` for each scene, save to DB. Update `projects.progressDetail` after each step.

**REFACTOR:** Ensure steps are idempotent (if retried, don't regenerate already-saved assets).

**Acceptance criteria:**
- Tests pass.
- Manual test: trigger `pipeline.started`, verify characters + scenes appear in the DB and R2.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §7 (pipeline step structure).

---

#### Task Card S3-05: SSE progress stream

**Sprint:** 3 | **Domain:** Pipeline | **Files:** `src/app/api/projects/[id]/progress/route.ts`, `src/lib/hooks/use-progress-stream.ts`, `src/components/app/progress-stream.tsx`, `src/tests/unit/progress-stream.test.ts`

**RED:** Write tests: (1) GET `/api/projects/[id]/progress` returns a `text/event-stream`, (2) the stream emits `data: {"step":"Generating characters","progress":0.4}` events, (3) unauthenticated request returns 401. Run → fails.

**GREEN:** Implement the SSE route: `verifySession()` (via `auth()` — returns 401 if null), poll `getProject(id)` every 2s, emit progress as SSE events, close when `project.status === 'completed' | 'failed'`. Create `use-progress-stream.ts` hook (client) that connects, auto-reconnects with backoff, and exposes `{ step, progress }`. Create `ProgressStream` component rendering the current step + a progress bar.

**REFACTOR:** Use the existing `eyebrow` + amber design for the progress UI.

**Acceptance criteria:**
- Tests pass.
- Manual test: start a pipeline, open the project page, observe live progress updates.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §5 (API routes use `auth()` directly, not `verifySession()`).

---

### Sprint 4: Voiceover, Assembly, Export, Billing (Weeks 9–12)

**Goal:** End-to-end MVP. User signs up, pastes story, gets a downloadable video.

**Exit criteria:**
- ElevenLabs TTS voiceover.
- Whisper ASR subtitle alignment.
- FFmpeg video assembly.
- Stripe billing (Free tier + one paid tier).
- Download/share functionality.
- Full pipeline works end-to-end.

---

#### Task Card S4-01: ElevenLabs TTS integration

**Sprint:** 4 | **Domain:** Pipeline | **Files:** `src/lib/ai/elevenlabs.ts`, `src/features/pipeline/domain/synthesize-voice.ts`, `src/tests/unit/synthesize-voice.test.ts`

**RED:** Tests (mock ElevenLabs): (1) `synthesizeVoice({ text, voiceId })` returns `{ audioUrl, duration }`, (2) long text (>5000 chars) is chunked and concatenated, (3) audio is uploaded to R2. Run → fails.

**GREEN:** Install `elevenlabs` SDK (`pnpm add elevenlabs`). Create the client. Implement `synthesizeVoice`: chunk text by sentence boundaries, call TTS per chunk, concatenate audio buffers, upload MP3 to R2 (`R2_BUCKET_GENERATED`), return URL + duration.

**REFACTOR:** Extract chunking into a pure function.

**Acceptance criteria:**
- Tests pass.
- Manual test: synthesize a sample, verify the MP3 plays.

**Skill ref:** `skills/TTS/SKILL.md` (adapt to ElevenLabs SDK).

---

#### Task Card S4-02: Whisper ASR subtitle alignment

**Sprint:** 4 | **Domain:** Pipeline | **Files:** `src/features/pipeline/domain/align-subtitles.ts`, `src/tests/unit/align-subtitles.test.ts`

**RED:** Tests (mock OpenAI Whisper): (1) `alignSubtitles(audioUrl)` returns `[{ word, start, end }]`, (2) the result is grouped into subtitle cues (max 7 words / 2 lines), (3) SRT format output. Run → fails.

**GREEN:** Implement `alignSubtitles`: download audio from R2, call OpenAI Whisper API with `response_format: 'verbose_json'` (includes word timestamps), group words into subtitle cues, generate SRT. Save SRT to R2.

**REFACTOR:** Extract SRT generation into a pure function.

**Acceptance criteria:**
- Tests pass.
- Manual test: align subtitles for a sample voiceover, verify the SRT syncs.

**Skill ref:** `skills/ASR/SKILL.md` (adapt to OpenAI Whisper API).

---

#### Task Card S4-03: FFmpeg video assembly

**Sprint:** 4 | **Domain:** Pipeline | **Files:** `src/features/pipeline/domain/assemble-video.ts`, `src/app/api/projects/[id]/render/route.ts` (or Inngest step), `src/tests/unit/assemble-video.test.ts`

**RED:** Tests (mock FFmpeg): (1) `assembleVideo({ sceneImages, audioUrl, subtitlesSrt, aspectRatio })` returns `{ videoUrl, duration }`, (2) the FFmpeg command concatenates images timed to audio, burns in subtitles, outputs MP4 H.264. Run → fails.

**GREEN:** Install `fluent-ffmpeg` + ensure FFmpeg binary available (Vercel uses the `@ffmpeg-installer/ffmpeg` package or a layer). Implement `assembleVideo`: download all assets from R2, construct the FFmpeg command (images as video stream with durations, audio track, subtitle burn-in via `subtitles` filter), run, upload MP4 to R2 (`R2_BUCKET_VIDEOS`). Run as an Inngest step (bypasses Vercel's 300s limit).

**REFACTOR:** Construct the FFmpeg command in a pure function (returns string[]) for testability.

**Acceptance criteria:**
- Tests pass with mocked FFmpeg.
- Manual test: assemble a 30-second video from 3 images + audio + SRT. Verify it plays correctly with synced subtitles.
- If FFmpeg on Vercel fails repeatedly, escalate to Shotstack (ADR-006 fallback).

**Skill ref:** `skills/video-generation/SKILL.md` (video assembly patterns).

---

#### Task Card S4-04: Wire pipeline steps 4 + 5 + 6 into Inngest

**Sprint:** 4 | **Domain:** Pipeline | **Files:** `src/features/pipeline/inngest.ts` (extend), `src/tests/unit/pipeline-complete.test.ts`

**RED:** Tests asserting: (1) after step 4, voiceover is saved, (2) after step 5, subtitles are saved, (3) after step 6, video is saved + project status is "completed", (4) credits are debited per step. Run → fails.

**GREEN:** Implement Inngest steps 4 (voiceover), 5 (subtitles), 6 (assembly + upload + status update). Each step debits credits. On any step failure, set `project.status = 'failed'` with an error message; offer re-generation.

**REFACTOR:** Ensure the entire pipeline is resumable from the last successful step (Inngest checkpoint).

**Acceptance criteria:**
- Tests pass.
- **End-to-end manual test:** sign up → paste a 500-char story → generate → receive a downloadable MP4 video with synced voiceover + subtitles. Total time < 15 minutes.

**Skill ref:** `skills/nextjs16-react19-postgres17/SKILL.md` §7 (pipeline structure, graceful shutdown).

---

#### Task Card S4-05: Stripe Checkout + Customer Portal

**Sprint:** 4 | **Domain:** Billing | **Files:** `src/lib/stripe/client.ts`, `src/features/billing/actions.ts`, `src/app/(app)/billing/page.tsx`, `src/app/api/stripe/webhook/route.ts`, `src/tests/unit/stripe-webhook.test.ts`

**RED:** Tests (mock Stripe): (1) `checkoutAction(tier)` returns a Checkout URL, (2) `portalAction()` returns a Portal URL, (3) webhook handler verifies signature, (4) `checkout.session.completed` event creates/updates subscription, (5) duplicate event (same ID) is idempotent. Run → fails.

**GREEN:** Install `stripe` (`pnpm add stripe`). Create the Stripe client. Implement `checkoutAction`: create a Stripe Checkout Session for the selected tier, return URL. Implement `portalAction`: create a Customer Portal session. Implement the webhook route: verify signature, handle `checkout.session.completed` / `customer.subscription.updated` / `customer.subscription.deleted` / `invoice.payment_failed`. Idempotency via checking `usage_events` for the event ID.

**REFACTOR:** Extract event handlers into `src/features/billing/domain/stripe-webhook.ts`.

**Acceptance criteria:**
- Tests pass.
- Manual test (Stripe CLI): `stripe trigger checkout.session.completed` → webhook updates subscription in DB.
- The billing page shows current plan + credits + "Upgrade" / "Manage subscription" buttons.

**Skill ref:** `skills/security-and-hardening/SKILL.md` (webhook signature verification, idempotency).

---

#### Task Card S4-06: Download + share

**Sprint:** 4 | **Domain:** Dashboard | **Files:** `src/app/(app)/projects/[id]/page.tsx` (extend), `src/features/projects/queries.ts` (extend), `src/tests/e2e/download.spec.ts`

**RED:** E2E tests: (1) completed project shows a "Download Video" button, (2) clicking it triggers a download (signed URL), (3) "Share" button copies a shareable link (read-only public view). Run → fails.

**GREEN:** Add download button: generates a signed R2 download URL (1-hour expiry), redirects. Add share: creates a `sharedProjects` record with a public UUID, the `/share/[uuid]` route renders a read-only view (no auth required, no download — preview only).

**REFACTOR:** Extract the signed-URL generation into `src/lib/storage/r2.ts` (already exists from S3-01).

**Acceptance criteria:**
- E2E tests pass.
- Manual test: download the MP4, verify it plays. Open the share link in an incognito window, verify it renders.

**Skill ref:** `skills/security-and-hardening/SKILL.md` (signed URLs, public access controls).

---

#### Task Card S4-07: Pre-launch hardening + content pages

**Sprint:** 4 | **Domain:** Security + Content | **Files:** `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/pricing/page.tsx`, `src/app/contact/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/content/blog/*.mdx`, rate limiting on all AI/auth routes, Sentry integration

**RED:** Tests: (1) `/privacy`, `/terms`, `/pricing`, `/contact` return 200, (2) rate limit on `/api/projects/[id]/progress` blocks after N requests/min, (3) Sentry captures a test error. Run → fails.

**GREEN:** Create legal pages (use Termly templates or lawyer-drafted — do not launch without real legal). Create pricing page with tier table. Create contact page with Tally embed. Set up MDX blog: `@next/mdx` config, `src/content/blog/` with 2-3 seed posts, `generateStaticParams` for SSG. Install Upstash Ratelimit + apply to auth (10/15min), AI generation (5/min), export (10/hour). Install Sentry (`@sentry/nextjs`), configure DSN.

**REFACTOR:** Centralize rate limit keys in `src/lib/ratelimit/index.ts`.

**Acceptance criteria:**
- All content pages return 200.
- Rate limiting blocks abusive requests.
- Sentry captures errors in production.

**Skill ref:** `skills/security-and-hardening/SKILL.md` (Rate Limiting), `skills/shipping-and-launch/SKILL.md` (pre-launch), `skills/seo-content-writer/SKILL.md` (blog content).

---

## 7. Risk Register

Top 10 risks, ranked by likelihood × impact. Each has a concrete mitigation and trigger condition. Review weekly during MVP sprints.

| # | Risk | L | I | L×I | Trigger | Mitigation |
|---|---|---|---|---|---|---|
| R1 | **Character consistency fails** (IP-Adapter quality insufficient) | High | High | **9** | Manual R&D test (S3-03) shows <70% face consistency across scenes | 2-week R&D budget in S3. If unmet: (a) accept reduced quality with user messaging, (b) switch to managed service (Replicate consistent-character), (c) delay S3. Escalate to stakeholder. |
| R2 | **AI unit economics sink margin** (per-video cost > revenue) | High | High | **9** | Gross margin per user <40% after 50 users | Hard usage limits from day one (S2-06). Monitor cost/user weekly. If unprofitable: raise prices, reduce free tier, switch to cheaper models (e.g., SDXL instead of DALL-E). |
| R3 | **FFmpeg on Vercel unreliable** (cold starts, memory, timeouts) | Medium | High | **6** | >5% of video assemblies fail with FFmpeg errors | Move assembly to Inngest (bypasses Vercel 300s limit). If still failing: switch to Shotstack (ADR-006 fallback). |
| R4 | **Content moderation liability** (prohibited AI output) | Medium | High | **6** | First user generates prohibited content, or OpenAI/Replicate account warning | OpenAI Moderation on all inputs + outputs (ADR-011). Manual review queue. Clear ToS. If account banned: have backup provider accounts ready. |
| R5 | **Stripe webhook reliability** (missed events = broken billing) | Low | High | **3** | Webhook delivery failures >1% | Idempotent handlers (S4-05). Stripe webhook retry (built-in). Monitor `invoice.payment_failed` events. Alert on webhook failure rate. |
| R6 | **Sprint 3 scope creep** (character consistency R&D eats Sprint 4) | Medium | Medium | **4** | S3 not complete by end of week 8 | Time-box S3-03 to 2 weeks. If unmet, ship with reduced consistency and iterate post-MVP. Do not let the editor (post-MVP) creep in. |
| R7 | **Neon cold starts hurt UX** (300ms first-query latency) | Medium | Low | **2** | User complaints about dashboard load time | Neon pooled connection. Vercel edge caching for static assets. If persistent: add a warming cron job, or move to dedicated Postgres. |
| R8 | **SSE connection limits** (6 per browser tab) | Low | Medium | **2** | Users with many tabs hit the limit | Single SSE connection per project page. Auto-reconnect on disconnect. If an issue: switch to Pusher/Ably (ADR-009 fallback). |
| R9 | **Auth.js v5 beta instability** (breaking changes) | Low | Medium | **2** | `next-auth` beta release breaks our config | Pin the exact version (`next-auth@5.0.0-beta.31`). Test on every upgrade. Auth.js v5 is widely used in production despite beta status. |
| R10 | **Legal compliance gap** (GDPR/CCPA enforcement) | Low | High | **3** | User data request, or regulator inquiry | Real Privacy Policy + Terms (S4-07). Data export + deletion endpoints. Cookie consent banner. If EU demand grows: appoint a DPO, consider EU data residency. |

**Likelihood (L):** Low / Medium / High. **Impact (I):** Low / Medium / High. **L×I:** 1–9 (higher = prioritize).

---

## 8. Pre-Launch Checklist (Go/No-Go)

Run every item before launch. **Any unchecked item = NO GO.** Uses the `shipping-and-launch` skill format.

### 8.1 Security (OWASP)
- [ ] All Server Actions start with `verifySession()` (auth-first pattern)
- [ ] All API routes use `auth()` and return 401 on null session
- [ ] Zod validation on every Server Action and API route input
- [ ] Rate limiting on auth (10/15min), AI (5/min), export (10/hour)
- [ ] CSP header includes no `unsafe-eval` (only `unsafe-inline` for Next.js)
- [ ] HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff configured
- [ ] `AUTH_SECRET` is ≥32 chars and not a known-weak value
- [ ] All secrets in `.env` (gitignored); `.env.example` has placeholders only
- [ ] `git diff --cached | grep -i "password\|secret\|api_key\|token"` returns clean
- [ ] No `process.env.*` reads outside `src/lib/env/index.ts`
- [ ] R2 buckets are private; all access via signed URLs
- [ ] Stripe webhook signature verification enabled
- [ ] CORS configured (only same-origin for API; Stripe webhooks exempt)

### 8.2 Compliance
- [ ] Privacy Policy live at `/privacy` (discloses AI processing, data retention)
- [ ] Terms of Service live at `/terms` (includes AI-generated content terms, content moderation policy)
- [ ] Cookie consent banner (if serving EU/UK users)
- [ ] Data export endpoint (`/api/user/export`) returns JSON of all user data
- [ ] Data deletion endpoint (`/api/user/delete`) cascades delete within 30 days
- [ ] Content moderation policy documented in ToS
- [ ] AI-generated content disclosure (per EU AI Act Art. 50 if serving EU)

### 8.3 Content Moderation
- [ ] OpenAI Moderation API runs on every story input (blocks flagged)
- [ ] OpenAI Moderation API runs on every generated image (blocks flagged)
- [ ] Manual review queue for borderline content (admin UI)
- [ ] Auto-suspend account after 3 violations
- [ ] Moderation logging (every check recorded in `usage_events`)

### 8.4 Performance
- [ ] Lighthouse Performance ≥95 on marketing page
- [ ] Lighthouse Performance ≥90 on dashboard (dynamic)
- [ ] JS bundle <150KB gzipped (was <100KB for marketing only; app adds more)
- [ ] CSS bundle <40KB gzipped
- [ ] Images use `next/image` with proper `sizes`
- [ ] Fonts self-hosted (no CDN)
- [ ] Database queries use indexes (verify with `EXPLAIN ANALYZE` on hot queries)

### 8.5 Operations
- [ ] Sentry error tracking installed and capturing
- [ ] Vercel Analytics enabled
- [ ] Axiom (or equivalent) log aggregation
- [ ] Alerts: error rate >1%, Stripe webhook failures, Inngest function failures, moderation flags
- [ ] On-call rotation defined (even if it's just you for MVP)
- [ ] Incident response runbook (what to do when the pipeline is down)
- [ ] Database backup verified (Neon automatic; test a restore)

### 8.6 Billing
- [ ] Stripe in production mode (not test)
- [ ] Webhook endpoint registered in Stripe dashboard
- [ ] Test: signup → checkout → webhook → subscription created in DB
- [ ] Test: failed payment → dunning email → subscription deactivated
- [ ] Test: customer portal → cancel → subscription ends at period end
- [ ] Credit metering: verify credits debit correctly per AI operation
- [ ] Free tier limits enforced (50 credits, 720p, watermark, 2 min max)

### 8.7 Functional (End-to-End)
- [ ] Sign up with Google OAuth → dashboard
- [ ] Sign up with email/password → verify email → dashboard
- [ ] Create project → story analysis → characters → scenes → voiceover → video → download
- [ ] Pipeline completes in <15 minutes for a 500-char story
- [ ] Re-generate a project (debits credits)
- [ ] Share link works (incognito, read-only)
- [ ] Rate limiting blocks abusive requests
- [ ] Content moderation blocks prohibited input
- [ ] All 45 existing unit tests + 11 existing E2E tests still pass
- [ ] New tests (auth, dashboard, create, pipeline, billing) pass

### 8.8 Documentation
- [ ] `README.md` updated with setup instructions for the full stack
- [ ] `CLAUDE.md` updated with new conventions (auth, db, pipeline)
- [ ] `AGENTS.md` updated with new architecture
- [ ] `.env.example` complete and accurate
- [ ] This `PRODUCTION_READINESS_PLAN.md` marked as "Implemented" with deviations noted

---

## 9. Skill References (Quick Index)

The `skills/` folder contains 134 skills. These are the ones referenced by this blueprint. Read the `SKILL.md` in each before implementing the relevant domain.

| Skill | Path | Used For |
|---|---|---|
| **nextjs16-react19-postgres17** | `skills/nextjs16-react19-postgres17/SKILL.md` | The primary implementation reference: 5-layer architecture, Auth.js v5 patterns, Drizzle setup, env validation, `next.config.ts` flags, Server Action auth pattern, `verifySession` DAL, Suspense pattern, `queries.ts` boundary. **Read sections 2, 3, 5, 6, 7 fully.** |
| **fullstack-dev** | `skills/fullstack-dev/SKILL.md` | Prisma/database setup, WebSocket patterns (if needed for real-time), code style. Note: this skill mentions Prisma, but we use Drizzle per ADR-003. |
| **security-and-hardening** | `skills/security-and-hardening/SKILL.md` | OWASP Top 10 prevention, input validation (Zod at boundaries), rate limiting, secrets management, file upload safety, security review checklist. **Read fully before Sprint 1.** |
| **api-patterns** | `skills/api-patterns/SKILL.md` | API design decisions (REST vs GraphQL vs tRPC), response formats, versioning. We use Next.js Server Actions + route handlers (REST-ish). |
| **spec-driven-development** | `skills/spec-driven-development/SKILL.md` | The gated workflow (Specify → Plan → Tasks → Implement). Use for complex features that need a spec before coding. |
| **test-driven-development** | `skills/test-driven-development/SKILL.md` | TDD principles: failing test first, then code. **Every task card in this blueprint follows TDD.** |
| **testing-patterns** | `skills/testing-patterns/SKILL.md` | Testing pyramid (unit, integration, E2E), mocking strategies. |
| **incremental-implementation** | `skills/incremental-implementation/SKILL.md` | Deliver changes incrementally when touching multiple files. Use for Sprint transitions. |
| **documentation-and-adrs** | `skills/documentation-and-adrs/SKILL.md` | ADR format (used for Section 3 of this document). |
| **planning-and-task-breakdown** | `skills/planning-and-task-breakdown/SKILL.md` | Task decomposition (used for Section 6's task cards). |
| **shipping-and-launch** | `skills/shipping-and-launch/SKILL.md` | Pre-launch checklist (used for Section 8). |
| **code-review-and-audit** | `skills/code-review-and-audit/SKILL.md` | Code review + security audit pipeline. Run before every merge. |
| **llm** | `skills/llm/SKILL.md` | LLM patterns (adapt z-ai-web-dev-sdk examples to OpenAI SDK). |
| **ASR** | `skills/ASR/SKILL.md` | Speech-to-text patterns (adapt to OpenAI Whisper). |
| **TTS** | `skills/TTS/SKILL.md` | Text-to-speech patterns (adapt to ElevenLabs). |
| **video-generation** | `skills/video-generation/SKILL.md` | Video generation + assembly patterns (adapt to FFmpeg). |
| **image-generation** | `skills/image-generation/SKILL.md` | Image generation patterns (adapt to Replicate SDXL). |
| **storyboard-manager** | `skills/storyboard-manager/SKILL.md` | Character development, story structures, consistency checking. Use for designing the LLM story-analysis prompt. |
| **seo-content-writer** | `skills/seo-content-writer/SKILL.md` | SEO content for blog + pricing pages. |
| **web-frameworks** | `skills/web-frameworks/SKILL.md` | Next.js App Router, RSC, PPR, SSR, SSG, ISR reference. |
| **nextjs-react-expert** | `skills/nextjs-react-expert/SKILL.md` | React/Next.js performance optimization. |
| **vulnerability-scanner** | `skills/vulnerability-scanner/SKILL.md` | OWASP 2025, supply chain security. Run before launch. |
| **git-workflow-and-versioning** | `skills/git-workflow-and-versioning/SKILL.md` | Git workflow (one commit per TDD cycle). |
| **ci-cd-and-automation** | `skills/ci-cd-and-automation/SKILL.md` | CI/CD pipeline (GitHub Actions). |
| **debugging-and-error-recovery** | `skills/debugging-and-error-recovery/SKILL.md` | Root-cause debugging when tests fail. |
| **source-driven-development** | `skills/source-driven-development/SKILL.md` | Every framework decision backed by official docs. Use when integrating new libraries. |

---

## 10. Agent Operating Protocol

This section is the contract between this blueprint and the implementing agent. Follow it exactly.

### 10.1 Before Starting Any Sprint
1. Read `CLAUDE.md` and `AGENTS.md` (the project's conventions).
2. Read the relevant `skills/` SKILL.md files for the sprint's domains.
3. Read this blueprint's sprint section fully.
4. Confirm the prior sprint's exit criteria are met.

### 10.2 For Every Task Card
1. **ANALYZE:** Read the card. Identify the files to create/modify. Check for existing patterns to reuse.
2. **PLAN:** If the card is ambiguous, write a brief plan and escalate to the stakeholder. Do not guess.
3. **VALIDATE:** Confirm the plan against the codebase and skills.
4. **IMPLEMENT (TDD):**
   - Write the failing test (RED). Run it. Confirm it fails for the right reason.
   - Write the minimal code to pass (GREEN). Run it. Confirm it passes.
   - Refactor (REFACTOR). Run again. Confirm still green.
   - Commit with message: `<sprint>-<card>: <description> (TDD)`.
5. **VERIFY:** Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. All must pass with zero warnings/errors.
6. **DELIVER:** The card is done when acceptance criteria are met and the quality gate is green.

### 10.3 Hard Rules (Non-Negotiable)
- **Never use `any`.** Use `unknown` and narrow with Zod or type guards. ESLint enforces this.
- **Never read `process.env.*` directly.** Use the Zod-validated `env` module.
- **Never wrap `verifySession()` in try/catch.** It throws `NEXT_REDIRECT` which must propagate.
- **Never put DB access in components.** Use the `queries.ts` boundary.
- **Never put DB access in middleware.** Middleware runs on Edge runtime.
- **Never make R2 buckets public.** Use signed URLs.
- **Never skip content moderation.** Every story input + generated image is moderated.
- **Never commit `.env`.** Only `.env.example` is tracked.
- **Never use `force-static` on app routes.** Only the marketing page can be static.
- **Never change the design system.** `#020202` bg, `#febf00` amber, Outfit 820, 13 keyframes, zero purple (except the example-card hover).
- **Never skip the quality gate.** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` before every commit.

### 10.4 Escalation Triggers
Escalate to the stakeholder (do not guess) when:
- A pinned ADR decision seems wrong for the context.
- A task card's acceptance criteria are unreachable with the given approach.
- A risk trigger fires (Section 7).
- Character consistency (S3-03) is insufficient after 2 weeks of R&D.
- The 4-sprint timeline is off-track by more than 1 week.
- A security concern emerges that isn't covered by the checklist.

### 10.5 Post-Implementation (After Sprint 4)
1. Run the full pre-launch checklist (Section 8). Every item must be checked.
2. Run `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all green.
3. Run a full end-to-end manual test: signup → create → generate → download.
4. Update `README.md`, `CLAUDE.md`, `AGENTS.md` with the new architecture.
5. Mark this blueprint as "Implemented" at the top, with any deviations noted.
6. Create a post-MVP roadmap (interactive editor, team accounts, API access, custom voices) as a separate document.

---

## Appendix A: Dependency Installation Commands

Run these in order during Sprint 1. Use `pnpm add` (never edit `package.json` directly).

```bash
# Foundation
pnpm add drizzle-orm@^0.45 postgres@^3.4
pnpm add next-auth@5.0.0-beta.31 @auth/drizzle-adapter@^1.11
pnpm add zod@^4
pnpm add bcryptjs@^3
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
pnpm add inngest
pnpm add stripe
pnpm add openai
pnpm add replicate
pnpm add elevenlabs
pnpm add fluent-ffmpeg @ffmpeg-installer/ffmpeg
pnpm add resend
pnpm add @upstash/ratelimit @upstash/redis
pnpm add @sentry/nextjs
pnpm add @next/mdx gray-matter

# Dev dependencies
pnpm add -D drizzle-kit@^0.31
pnpm add -D @testcontainers/postgresql@^12
pnpm add -D @types/bcryptjs @types/fluent-ffmpeg
pnpm add -D husky@^9 lint-staged@^17

# shadcn/ui primitives to add (extend the existing 4)
pnpm dlx shadcn@latest add input label form dialog tabs card avatar badge sonner
```

## Appendix B: Environment Variables (Complete)

Create `.env.example` with these placeholders. The Zod schema in `src/lib/env/index.ts` validates all.

```bash
# Database (Neon)
DATABASE_URL=postgresql://user:pass@ep-pooled.region.aws.neon.tech/db?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-direct.region.aws.neon.tech/db?sslmode=require

# Auth (Auth.js v5)
AUTH_SECRET=                          # min 32 chars; generate with: openssl rand -base64 32
AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI Providers
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
ELEVENLABS_API_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_UPLOADS=siv-uploads
R2_BUCKET_GENERATED=siv-generated
R2_BUCKET_VIDEOS=siv-videos

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Email (Resend)
RESEND_API_KEY=

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring (Sentry)
SENTRY_DSN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

*End of Production Readiness Plan. Implement sprints in order. Follow the TDD task cards. Run the quality gate before every commit. Escalate when uncertain. Preserve the design system.*

