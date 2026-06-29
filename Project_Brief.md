● StoryIntoVideo — Codebase Explanation 
 
This is a production-grade SaaS that turns written stories into short videos using a multi-step AI pipeline. It started as a pixel-accurate marketing clone of storyintovideo.com and evolved into a fully functional hybrid Next.js 
application. 
 
What It Does (The Big Picture) 
 
User flow: 
1. Sign up (/sign-up)
2. Paste a story on /create (story text + visual style + aspect ratio) 
3. Backend runs a 6-step AI pipeline via Inngest 
4. Watch progress live on /projects/[id] (SSE streaming) 
5. Download finished MP4 from Cloudflare R2 
 
The pipeline per project: 
Story → [0: Moderation] → [1: GPT-4o story analysis → characters + scenes] 
     → [2: Replicate SDXL → character portraits] (with image safety moderation) 
     → [3: Replicate SDXL + IP-Adapter → scene images with consistent faces] 
     → [4: ElevenLabs TTS → voiceover MP3] 
     → [5: Whisper ASR → SRT subtitles] 
     → [6: FFmpeg compositor → final MP4] 
 
Every step is idempotent, debits credits, and is retried automatically on failure. Status flows through an enum: draft → pending → analyzing → generating_characters → generating_scenes → synthesizing_voice → aligning_subtitles → 
assembling_video → completed/failed. 
 
Architecture — Strict 5-Layer Rule 
 
The codebase enforces one architectural golden rule: lower layers never import from higher layers. 
 
┌───────┬────────────────────────┬────────────────────────────────────────────────────────────────────────────────────┐ 
│ Layer │         Folder         │                                        Job                                         │
├───────┼────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤ 
│ 0     │ src/proxy.ts           │ Cookie check + redirects. Edge runtime.                                            │
├───────┼────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤ 
│ 1     │ src/app/               │ Route structure, metadata, layouts, API handlers                                   │ 
├───────┼────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤ 
│ 2     │ src/features/          │ UI composition + data binding + Server Actions (auth, projects, pipeline, billing) │ 
├───────┼────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤ 
│ 3     │ src/features/*/domain/ │ Pure business logic. No Next.js or DB imports — only types                         │
├───────┼────────────────────────┼────────────────────────────────────────────────────────────────────────────────────┤ 
│ 4     │ src/lib/               │ Infrastructure side effects: Drizzle, Auth.js, Inngest, R2, Stripe, AI providers   │
└───────┴────────────────────────┴────────────────────────────────────────────────────────────────────────────────────┘ 
 
This is why you'll see src/features/pipeline/domain/assemble-video.ts containing pure FFmpeg orchestration logic that doesn't import db, @/lib/env, or anything Next-specific. The pipeline Inngest function at 
src/features/pipeline/inngest.ts is the only place runtime infrastructure meets the domain.
 
Tech Stack (Locked) 
    
- Next.js 16 App Router, hybrid rendering (marketing page static, app routes dynamic) 
- React 19.2.3+ (pinned minimum — CVE-2025-55182 floor)
- TypeScript strict (noUncheckedIndexedAccess, verbatimModuleSyntax, zero any enforced by ESLint) 
- Tailwind CSS v4 CSS-first config — all design tokens live in globals.css inside @theme, no tailwind.config.ts 
- shadcn/ui primitives hand-written (CLI timed out), built on Radix UI 
- Auth.js v5 beta with Drizzle adapter — Google OAuth + email/password credentials 
- PostgreSQL (Neon) + Drizzle ORM, 11 tables including auth, projects, characters, scenes, voiceovers, videos, subscriptions, usage events 
- Inngest for the multi-step AI pipeline (retry + observability + idempotency built-in) 
- Cloudflare R2 S3-compatible storage (zero egress, signed URLs) 
- Stripe Checkout + Portal + Webhooks for the 4-tier billing (Free/Creator/Pro/Studio) 
- Upstash Ratelimit on auth (10/15min), pipeline (5/min/user), SSE (1/user/project) — Redis SET-NX-EX slot pattern for SSE because the old fixedWindow didn't release on disconnect 
 
The Marketing Frontend 
 
The marketing site at / was originally a field-verified pixel clone of storyintovideo.com. It's now preserved 1:1 — the spec (Project_Requirements_Document.md, 2,718 lines) reads the live DOM and locks every color/spacing/typography  
value. Core design rules:
 
- Background #020202 (near-black, warm-neutral — not pure #000) 
- Accent #febf00 (brand amber — not Tailwind's amber-400 #fbbf24)
- One allowed purple — singular yellow→purple gradient on example-card hover only 
- H1 uses Outfit weight 820, self-hosted (Google Fonts API only serves discrete weights) 
- CSS-only animation — 13 @keyframes in globals.css, no Framer Motion / GSAP 
- Scroll reveals via IntersectionObserver + data-revealed attribute 
 
10 sections in fixed order: Navbar → Hero → Examples → Workflow → Features → Testimonials → Use Cases → FAQ → Final CTA → Footer. 
 
Notable Engineering Decisions 
 
A few worth flagging because they shaped the current code: 
 
1. verifySession() is a redirect thrower — every Server Action starts with it, never wrapped in try/catch (wrapping silently swallows NEXT_REDIRECT). API routes use auth() directly instead, because they need JSON 401s not redirects.  
2. The /dashboard redirect bug (C-2 / T2) — under a TLS-terminating reverse proxy (Cloudflare Tunnel), nextUrl.origin reports http://localhost:3000. Fixed by always using new URL('/sign-in', env.NEXT_PUBLIC_APP_URL). trustHost: true
is now also set on NextAuth. 
3. Inngest triggers → HTTP fetches for Step 5 & 6 — steps don't share in-memory state, so audio and SRT are round-tripped through R2 between steps. Tests must stub global fetch or they hit real DNS.
4. Server-side URL signing is the only safe pattern — client components never import @/lib/storage/r2 at module level (env validates 30 server-only vars at module load and crashes in browser). The Server Component signs the R2 URL,   
passes as prop. This was P0 once. 
5. temp file collision in FFmpeg — /tmp/siv-srt-<Date.now()>.srt would collide under concurrent runs. Fixed with crypto.randomUUID(). 
6. Two recent critical-adjacent findings: 
  - Stripe Basil API (2025-03-31) moved current_period_end from top-level Subscription → items.data[0].current_period_end. Helper extractSubscriptionPeriodEnd() handles both shapes. 
  - React 19.2.0 was vulnerable to a React2Shell RCE (CVE-2025-55182) — pinned ^19.2.3. 
 
Test Strategy 
 
- 396 unit tests across 48 files (Vitest, jsdom) 
- 48 E2E tests across 9 files (Playwright Chromium)
- Mocks for AI SDKs (OpenAI, Replicate, ElevenLabs) — no real API calls in tests 
- vi.hoisted() for any vi.fn() referenced inside vi.mock(...) factories (hoisting would leave them undefined) 
- Source-reading tests for legal pages / Stripe webhook / proxy — readFileSync + comment-stripped regex for patterns you can't easily render 
- putObject mocked with class syntax, not arrow functions, because real S3Client does new S3Client() 
 
CI/CD 
 
.github/workflows/ci.yml runs pnpm lint && pnpm typecheck && pnpm test && pnpm build. Husky pre-commit runs ESLint + Prettier on staged files only. E2E tests aren't in CI yet (need Postgres service + Playwright browsers). 
 
What's Still Open 
 
- No real external credentials provisioned — code is wired, but running E2E needs real Neon/Google/OpenAI/Replicate/ElevenLabs/R2/Stripe/Inngest/Resend/Upstash/Sentry 
- IP-Adapter character consistency is unvalidated R&D — the highest risk
- FFmpeg /tmp OOM for 4K output — stream-to-R2 via @aws-sdk/lib-storage deferred 
- Privacy/Terms pages exist (/privacy, /terms), but cookie consent banner + data export/deletion endpoints are missing for full GDPR 
- Monitoring (Sentry, Vercel Analytics) not integrated 
 
--- 
If you want, I can dive deeper into any specific subsystem — the Inngest pipeline wiring, the billing/Stripe Basil shape handling, the FFmpeg assembly rewrite, the 5-layer architecture in practice, or the test mocking patterns. 
 
※ recap: StoryIntoVideo production SaaS turns written stories into AI-generated videos — marketing clone on Next.js 16, full auth/billing/AI pipeline backend. Next action: await your direction on whether to deep-dive into a subsystem or
 move on to a new task. (disable recaps in /config)

