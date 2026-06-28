# StoryIntoVideo — Comprehensive Remediation Plan

**Author:** Claw Code (Frontend Architect & Avant-Garde UI Designer)
**Date:** 2026-06-28
**Method:** ANALYZE → PLAN → VALIDATE → IMPLEMENT (TDD) → VERIFY → DELIVER
**Scope:** All Critical, High, and Medium severity issues confirmed against the actual cloned codebase at `github.com/nordeim/story-into-video`.
**TDD Discipline:** Every code change is preceded by a failing test (RED), then made to pass (GREEN), then refactored (REFACTOR). One TDD cycle per commit.

---

## Part 1 — Confirmed Issues with Root-Cause Analysis

Each issue below has been re-validated against the actual source code (file paths and line numbers cited). The root cause is the *underlying* problem, not just the symptom.

---

### 🔴 C1 — Sign-up flow is completely non-functional (NEW — discovered during remediation analysis)

**Symptom:** Clicking "Create account" with a new email always fails.

**Root cause:**
- `src/components/app/auth-form.tsx:33-57` — The `handleSubmit` function calls `signIn('credentials', { email, password, redirect: false })` for BOTH `sign-in` and `sign-up` modes.
- `src/lib/auth/config.ts:34-65` — The Credentials provider's `authorize()` function only checks existing users via `bcrypt.compare`. It has NO user-creation logic.
- There is NO `signUpAction` server action anywhere in the codebase (`grep -r "bcrypt.hash|insert(users)|signUpAction|registerUser" src/` returns only `src/lib/db/seed.ts`).

**Why this is Critical:** The email/password sign-up flow has never worked. Users cannot create accounts. The only way to onboard is Google OAuth (if configured). This blocks production launch.

**Files affected:**
- `src/components/app/auth-form.tsx` (needs to call a sign-up action when `mode === 'sign-up'`)
- `src/features/auth/actions.ts` (NEW FILE — `signUpAction` server action)
- `src/lib/auth/config.ts` (no change needed — Credentials provider stays as-is)

---

### 🔴 C2 — Replicate IP-Adapter is a placeholder; character consistency silently broken

**Root cause:**
- `src/lib/env/index.ts:90-106` — `REPLICATE_SDXL_IPADAPTER_MODEL` defaults to `stability-ai/sdxl:39ed52f2...` (the SDXL base model, NOT IP-Adapter).
- `src/lib/ai/replicate.ts:30-37` — `SDXL_IPADAPTER_MODEL` is exported from the env var.
- `src/features/pipeline/domain/generate-scene.ts:61` — `replicate.run(SDXL_IPADAPTER_MODEL, ...)` uses the placeholder.
- The SDXL base model does NOT accept `ip_adapter_images` as an input — those params are silently ignored, and scenes are generated WITHOUT character consistency.
- The model name `lucataco/sdxl-ipadapter` referenced in the docs/comments may not exist on Replicate (the closest real model is `lucataco/ip-adapter-faceid`, which itself admits "limited consistency").

**Why this is Critical:** The product's differentiating feature (consistent characters across scenes) does not work by default. Operators following the docs may set a non-existent model hash and get 404s from Replicate.

**Files affected:**
- `src/lib/env/index.ts` (add a startup-time warning when the default is still in use)
- `src/lib/ai/replicate.ts` (validate the model exists at startup, or warn loudly)
- `.env.example` (correct the model name from `lucataco/sdxl-ipadapter` to the real Replicate model)
- `docs` (correct the model name reference)

**Fix caveat:** Cannot fully fix without operator action (must provision a real Replicate model). The code fix is to **fail loudly** when the placeholder is detected in production.

---

### 🔴 C3 — No rate limiting; AI cost amplification + credential stuffing

**Root cause:**
- `package.json` dependencies do NOT include `@upstash/ratelimit` or `@upstash/redis`.
- `src/lib/env/index.ts:128-130` — `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` ARE in the schema, but no code uses them.
- `src/features/projects/actions.ts:54-126` — `createProjectAction` has NO rate limit. A user can fire 100 requests/second.
- `src/components/app/auth-form.tsx` — Sign-in has NO rate limit. Credential stuffing is unimpeded.
- `src/app/api/projects/[id]/progress/route.ts` — SSE has NO per-user connection limit.

**Why this is Critical:** Each `createProjectAction` triggers a 6-step pipeline that calls OpenAI + Replicate + ElevenLabs + Whisper + FFmpeg. A malicious user can spawn thousands of dollars of AI inference in minutes. The `debitCredits` row lock prevents double-spend per call, but does NOT prevent burst creation — a user with 50 credits can fire 50 concurrent requests in <1s, each debiting 5 credits, before the lock serializes them.

**Files affected:**
- `package.json` (add `@upstash/ratelimit` + `@upstash/redis`)
- `src/lib/rate-limit.ts` (NEW FILE — Upstash Ratelimit client)
- `src/features/projects/actions.ts` (add rate limit check before debit)
- `src/components/app/auth-form.tsx` (add rate limit on submit — client-side + server-side)
- `src/features/auth/actions.ts` (NEW FILE — server-side rate limit on sign-up)
- `src/app/api/projects/[id]/progress/route.ts` (limit 1 SSE connection per user/project)

---

### 🔴 C4 — Credits debited BEFORE project insert; no refund on failure

**Root cause:**
- `src/features/projects/actions.ts:84-97` — `debitCredits(userId, CREDIT_COSTS.analysis, 'analysis')` runs at line 87.
- `src/features/projects/actions.ts:99-115` — `db.insert(projects)` runs at line 100. If this fails (line 113), the user has lost 5 credits with no project.
- There is NO compensating `refundCredits` call in the error path.
- `src/features/billing/queries.ts:104-112` — `refillCredits` exists but is never called from `createProjectAction`.

**Why this is Critical:** Users lose credits on transient DB failures. This is a revenue integrity issue AND a user trust issue.

**Files affected:**
- `src/features/projects/actions.ts` (reorder: insert project FIRST, then debit, OR wrap both in a transaction)
- `src/features/billing/queries.ts` (add `refundCredits` if not present, or use a single transaction)

**Optimal fix:** Wrap the project insert + analysis debit in a single Drizzle transaction. If either fails, both roll back. This eliminates the need for a compensating refund.

---

### 🔴 C5 — Idempotency missing; Inngest retries cause double-debits and duplicate rows

**Root cause:**
- `src/lib/db/schema/billing.ts:52-64` — `usageEvents` table has NO `idempotency_key` column and NO UNIQUE constraint.
- `src/features/billing/queries.ts:54-101` — `debitCredits` has no idempotency parameter. Each call inserts a new `usageEvents` row and debits credits.
- `src/features/pipeline/inngest.ts:96-161` (Steps 2 & 3) — character and scene generation do NOT call `debitCredits` at all (separate bug — see C6).
- `src/features/pipeline/inngest.ts:164-294` (Steps 4, 5, 6) — each calls `debitCredits` with no idempotency key. If Inngest retries Step 4 after a partial success (e.g., ElevenLabs timed out but the credit was debited), the retry debits AGAIN.
- `src/lib/db/schema/media.ts:18-31` — `videos.projectId` has NO UNIQUE constraint. Step 5's `appendVideo` + Step 6's `updateVideo` pattern can create duplicate video rows on retry.
- `src/lib/db/schema/media.ts:33-47` — `voiceovers.projectId` has NO UNIQUE constraint. Same issue.

**Why this is Critical:** Inngest's retry semantics (3 retries by default) guarantee that any transient failure (network, AI provider timeout, FFmpeg crash) will trigger a retry. Without idempotency, retries double-charge users and create duplicate media rows that break `getProject()`'s `.limit(1)`.

**Files affected:**
- `src/lib/db/schema/billing.ts` (add `idempotencyKey` column + UNIQUE index to `usageEvents`)
- `src/lib/db/schema/media.ts` (add UNIQUE constraint on `videos.projectId` and `voiceovers.projectId`)
- `src/features/billing/queries.ts` (add `idempotencyKey` param to `debitCredits`; use `ON CONFLICT DO NOTHING`)
- `src/features/pipeline/queries.ts` (use `ON CONFLICT DO NOTHING` for `appendVideo`, `appendVoiceover`, `appendCharacter`, `appendScene`)
- `src/features/pipeline/inngest.ts` (generate deterministic idempotency keys: `${projectId}:${stepName}:${entityId}`)
- `drizzle/` (new migration SQL)

---

### 🔴 C6 — Character & scene generation steps NEVER debit credits (revenue leak)

**Root cause:**
- `src/features/pipeline/inngest.ts:96-161` — Steps 2 (generate-characters) and 3 (generate-scenes) call `generateCharacter`/`generateScene` and `appendCharacter`/`appendScene`, but NEVER call `debitCredits`.
- `src/features/billing/domain/tier-limits.ts:72-79` — `FULL_PIPELINE_COST = 131` credits ASSUMES character_generation (10×3=30) and scene_generation (8×6=48) are debited.
- `src/features/projects/actions.ts:87` — Only `analysis` (5 credits) is debited in the action.
- `src/features/pipeline/inngest.ts:193, 233, 288` — Only `voiceover` (15), `subtitle_alignment` (3), `video_assembly` (30) are debited in the pipeline.
- **Total actually debited: 5 + 15 + 3 + 30 = 53 credits. Documented cost: 131 credits. Revenue leak: 78 credits per project (60%).**

**Why this is Critical:** The product is being given away at 40% of the intended price. For a Studio plan ($X for 10,000 credits), users get 60% more videos than they paid for.

**Files affected:**
- `src/features/pipeline/inngest.ts` (add `debitCredits` calls in Steps 2 and 3, inside the per-character and per-scene loops)

---

### 🟠 H1 — `FFMPEG_PATH` bypasses the Zod env schema (rule violation)

**Root cause:**
- `src/features/pipeline/domain/assemble-video.ts:19-21` — `getFfmpegPath()` reads `process.env.FFMPEG_PATH` directly.
- `src/lib/env/index.ts` — `FFMPEG_PATH` is NOT in the Zod schema.
- `.env.example:88` — `FFMPEG_PATH=/usr/bin/ffmpeg` is documented but unvalidated.
- The project's central architectural rule ("never read `process.env.*` directly; import `env` from `@/lib/env`") is violated.

**Why this is High:** A typo like `FFMPEG_PAHT` in `.env.local` silently falls back to `/usr/bin/ffmpeg` with no warning. The whole point of the Zod env schema is to catch these typos at module load.

**Files affected:**
- `src/lib/env/index.ts` (add `FFMPEG_PATH: z.string().optional().default('/usr/bin/ffmpeg')` to the schema; add to build-context placeholder)
- `src/features/pipeline/domain/assemble-video.ts` (change `getFfmpegPath` to `import { env } from '@/lib/env'; return env.FFMPEG_PATH`)
- `src/tests/unit/env.test.ts` (add test for FFMPEG_PATH validation)
- `src/tests/unit/assemble-video.test.ts` (update test to mock env module instead of process.env)

---

### 🟠 H2 — Brand color system bypassed 75+ times across 22 files

**Root cause:**
- `src/app/globals.css:18-36` — The `@theme` block correctly defines `--color-background: #020202` and `--color-primary: #febf00`.
- `src/components/**` and `src/app/**` — Components use Tailwind's default palette (`bg-zinc-950`, `bg-amber-400`, etc.) instead of the theme tokens (`bg-background`, `bg-primary`).
- Grep counts: `bg-amber-300/400/500/600` → **75 occurrences across 22 files**; `bg-zinc-950/900/black` → **29 occurrences across 21 files**.
- Even the Hero's radial glow (`src/components/sections/hero.tsx:56`) uses `rgba(251,191,36,0.12)` (= `#fbbf24` = Tailwind amber-400), NOT `rgba(254,191,0,0.12)` (= `#febf00` = brand amber).
- There is no ESLint rule or CI check to enforce the brand tokens.

**Why this is High:** The "Anti-Generic Mandate" and "Amber is rationed" design philosophy — documented as "non-negotiable" across 5 docs — is violated by the codebase itself. The brand identity is aspirational, not enforced.

**Files affected:** 22 component files + 21 app/page files (see grep output for full list). Plus:
- `eslint.config.mjs` (add `no-restricted-syntax` rule banning `bg-amber-*`, `bg-zinc-950`, `bg-zinc-900`, `bg-black` outside `globals.css`)
- `src/tests/unit/brand-tokens.test.ts` (NEW FILE — CI grep test that fails if violations are found)

---

### 🟠 H3 — Style chip labels don't match backend enum (2 of 8 chips break)

**Root cause:**
- `src/lib/data/style-chips.ts:15-24` — 8 chips: Ghibli, **Medieval**, Oil Painting, Anime, **Japanese animation**, Realistic, Cyberpunk, Watercolor.
- `src/lib/db/schema/projects.ts:27-35` — `visualStyleEnum`: ghibli, oil-painting, anime, realistic, cyberpunk, watercolor, **comic** (7 values).
- `src/features/projects/actions.ts:33-41` — `CreateProjectSchema.style` Zod enum matches the DB enum (7 values).
- `src/components/app/create-wizard.tsx:134` — `setStyle(chip.label.toLowerCase().replace(/\s+/g, '-') as typeof style)` — clicks "Japanese animation" → sets `style = 'japanese-animation'`, which is NOT in the enum.
- The `as typeof style` cast silences TypeScript; the error only surfaces at server-side Zod validation AFTER the user types a 100+ char story and clicks submit.

**Why this is High:** 2 of the 8 marketing-advertised styles silently fail at submission. User-facing bug.

**Files affected:**
- `src/lib/db/schema/projects.ts` (add `medieval` and `japanese-animation` to `visualStyleEnum`)
- `src/features/projects/actions.ts` (add the same values to the Zod enum)
- `src/features/pipeline/domain/generate-character.ts` (add `medieval` and `japanese-animation` to `STYLE_PROMPTS`)
- `src/features/pipeline/domain/generate-scene.ts` (same)
- `src/components/app/create-wizard.tsx` (update the local `style` union type)
- `drizzle/` (new migration SQL for the enum change)

**Alternative fix (smaller blast radius):** Remove `Medieval` and `Japanese animation` from `STYLE_CHIPS` and add `Comic` to match the backend. This avoids a DB migration. **Recommended for the first remediation sprint.**

---

### 🟠 H4 — R2 signed URL 1-hour expiry trap (stale tabs get 403)

**Root cause:**
- `src/components/app/signed-download-wrapper.tsx:33` — `const downloadUrl = await getSignedDownloadUrl('videos', videoKey)` runs at SSR time.
- The signed URL (1h expiry) is baked into the RSC payload / HTML.
- `src/components/app/project-download-button.tsx:23-30` — `<a href={downloadUrl} download>` uses the stale URL.
- If the user leaves the tab open >1h and clicks download, R2 returns 403 Forbidden.

**Why this is High:** Silent failure for users who wait. Bad UX, especially for a 5-15min pipeline where users naturally switch tabs.

**Files affected:**
- `src/app/api/projects/[id]/download/route.ts` (NEW FILE — API route that signs at click time)
- `src/components/app/project-download-button.tsx` (refactor to fetch-at-click)
- `src/components/app/signed-download-wrapper.tsx` (DELETE — no longer needed; or repurpose to pass `projectId` + `hasVideo` only)
- `src/app/(app)/projects/[id]/page.tsx` (update to pass `projectId` + `hasVideo` instead of signing)
- `src/tests/unit/api-project-download.test.ts` (NEW FILE — TDD for the API route)
- `src/tests/unit/project-download.test.tsx` (update for new prop signature)

---

### 🟠 H5 — FFmpeg `/tmp` + Buffer OOM risk on large videos

**Root cause:**
- `src/features/pipeline/domain/assemble-video.ts:133-186` — `outputPath = /tmp/siv-video-${Date.now()}.mp4`, then `readFile(outputPath)` into `videoBuffer`, then `putObject('videos', videoKey, assembleResult.videoBuffer, 'video/mp4')`.
- The `MAX_PUT_OBJECT_BYTES = 500 MB` guard in `r2.ts:115` runs AFTER the file is already in memory.
- For a 400MB 4K MP4: ~400MB on disk + ~400MB in Buffer + FFmpeg process overhead = ~1GB+ memory. Vercel Pro with Fluid Compute allows up to 1.5GB memory, but concurrent pipelines (Inngest `concurrency: 5`) can OOM.

**Why this is High:** OOM crashes mid-pipeline = failed projects = user disappointment. The `MAX_PUT_OBJECT_BYTES` guard is in the wrong place.

**Files affected:**
- `package.json` (add `@aws-sdk/lib-storage` dependency)
- `src/features/pipeline/domain/assemble-video.ts` (refactor to accept a `Writable` stream; add `-movflags frag_keyframe+empty_moov`)
- `src/features/pipeline/inngest.ts` (Step 6: pipe FFmpeg output through `PassThrough` to `@aws-sdk/lib-storage` `Upload`)
- `src/tests/unit/assemble-video.test.ts` (update for stream-based API)

---

### 🟠 H6 — Host Header Injection vector (trustHost: true without edge validation)

**Root cause:**
- `src/lib/auth/config.ts:79` — `trustHost: true` makes Auth.js trust the incoming `Host` (and `X-Forwarded-Host`) header.
- `src/proxy.ts:29-46` — The proxy does NO host header validation.
- On Vercel, the platform enforces the Host header, so the risk is low. On self-hosted deployments behind a misconfigured reverse proxy, attackers can inject `X-Forwarded-Host: evil.com` to steal magic-link tokens.

**Why this is High (not Critical):** For Vercel-only deployments, Vercel's infrastructure mitigates this. For self-hosted/Cloudflare deployments, it's a real token-theft vector. Defense-in-depth says: validate at the edge regardless.

**Files affected:**
- `src/proxy.ts` (add canonical host whitelist before the auth check)
- `src/tests/unit/proxy.test.ts` (add tests for host validation)

---

### 🟠 H7 — Stripe webhook idempotency is a TOCTOU race

**Root cause:**
- `src/lib/db/schema/billing.ts:62` — `metadata: text('metadata')` (plain text, NOT jsonb, NOT UNIQUE).
- `src/app/api/stripe/webhook/route.ts:44-53` — The idempotency check is `SELECT ... WHERE metadata = event.id` followed by `INSERT`. Two concurrent webhooks for the same `event.id` both pass the SELECT and both INSERT.
- `src/app/api/stripe/webhook/route.ts:122` — `userId: '00000000-0000-0000-0000-000000000000'` (hardcoded system user). If no user with that UUID exists (which it won't, by default), the `usageEvents.userId` foreign key constraint throws, causing a 5xx that triggers Stripe retries.

**Why this is High:** Stripe retries on 5xx. A FK violation creates a retry storm. The idempotency check is a fiction.

**Files affected:**
- `src/lib/db/schema/billing.ts` (make `userId` nullable, OR add a system user in seed, OR use a dedicated `webhookEvents` table)
- `src/app/api/stripe/webhook/route.ts` (use `ON CONFLICT DO NOTHING` on a UNIQUE index; remove hardcoded system user)
- `src/lib/db/seed.ts` (add a system user row with the well-known UUID)
- `drizzle/` (new migration)

**Note:** This overlaps with C5 (idempotency). The same `idempotencyKey` column + UNIQUE index solves both. The webhook handler should use the same `debitCredits`-style idempotency pattern.

---

### 🟠 H8 — `IMAGE_MODERATION_FAIL_OPEN` defaults to `'true'` (insecure default)

**Root cause:**
- `src/lib/env/index.ts:141` — `IMAGE_MODERATION_FAIL_OPEN: z.enum(['true', 'false']).optional().default('true')`.
- `src/features/pipeline/domain/moderate-image.ts:68` — `const FAIL_OPEN = env.IMAGE_MODERATION_FAIL_OPEN === 'true'` (read at module load).
- The fail-closed code path (line 120-130) IS implemented and works. The issue is purely the default.

**Why this is High:** Violates the secure-defaults principle. An operator who copies `.env.example` and forgets to set `IMAGE_MODERATION_FAIL_OPEN=false` ships with fail-open, allowing unmoderated AI images.

**Files affected:**
- `src/lib/env/index.ts` (change default to `'false'` for production; keep `'true'` for dev/test)
- `src/tests/unit/env.test.ts` (update default test)
- `src/tests/unit/moderate-image.test.ts` (update default behavior test)
- `.env.example` (update comment to reflect production default)

---

### 🟠 H9 — Health endpoint is bare-bones (no DB or FFmpeg check)

**Root cause:**
- `src/app/api/health/route.ts:1-9` — Returns `{ status: 'ok' }` unconditionally. No DB ping, no FFmpeg check, no R2 check.

**Why this is High:** Docker HEALTHCHECK, Kubernetes liveness probes, and Vercel monitoring all point at this endpoint. A bare 200 hides real failures.

**Files affected:**
- `src/app/api/health/route.ts` (add DB ping via `SELECT 1`, FFmpeg accessibility via `fs.accessSync`)
- `src/tests/unit/health.test.ts` (NEW FILE — TDD for the health route)

---

### 🟠 H10 — `.for('update')` row lock exists but is not test-verified

**Root cause:**
- `src/features/billing/queries.ts:73` — `.for('update')` IS present in `debitCredits`.
- `src/tests/unit/credit-metering.test.ts:43-47` — The test only checks for `db.transaction` and `.insert(usageEvents)`. It does NOT verify `.for('update')`.
- If a future refactor removes the row lock, the tests still pass.

**Why this is High:** The row lock is the primary defense against concurrent credit double-spend (G1 Task A's concern). Without a test, it's a silent regression risk.

**Files affected:**
- `src/tests/unit/credit-metering.test.ts` (add assertion for `.for('update')` or `for\('update'\)` in the source)

---

### 🟡 M1 — `getProject()` LEFT JOIN can return arbitrary row on duplicate videos

**Root cause:**
- `src/features/projects/queries.ts:55-58` — `.leftJoin(videos, eq(videos.projectId, projects.id)).where(eq(projects.id, projectId)).limit(1)`.
- `src/lib/db/schema/media.ts:18-31` — `videos.projectId` has NO UNIQUE constraint.
- If Step 5 retried and `appendVideo` ran twice, there are 2 video rows. `getProject` with `.limit(1)` picks one arbitrarily.
- Same issue for `voiceovers`.

**Why this is Medium:** The UNIQUE constraint addition (C5) prevents future duplicates. For existing duplicates, `getProject` should explicitly order by `videos.createdAt DESC` to deterministically pick the latest. This is a defense-in-depth measure.

**Files affected:**
- `src/features/projects/queries.ts` (add `.orderBy(desc(videos.createdAt))` to the LEFT JOIN query — or use a subquery)

**Note:** This becomes moot once C5's UNIQUE constraint is applied. Schedule after C5.

---

### 🟡 M2 — Story length validation inconsistent across layers

**Root cause:**
- `src/components/sections/hero.tsx:109` — `maxLength={500}`, counter shows `/ 500`.
- `src/components/app/create-wizard.tsx:18-19` — `MIN_STORY_LENGTH = 100`, `MAX_STORY_LENGTH = 5000`.
- `src/features/projects/actions.ts:29-32` — `min(100).max(5000)`.
- Docs (CLAUDE.md, AGENTS.md) claim `min(10).max(500)`.

**Why this is Medium:** Hero is a marketing widget (doesn't submit), so the 500 limit is decorative but misleading. The docs are wrong.

**Files affected:**
- `src/components/sections/hero.tsx` (update `maxLength` to 5000 to match the actual server limit; update counter)
- Docs (CLAUDE.md, AGENTS.md) — update `min(10).max(500)` to `min(100).max(5000)`

---

### 🟡 M3 — `referenceImageKey` column stores URLs, not keys (semantic mismatch)

**Root cause:**
- `src/lib/db/schema/projects.ts:65` — `referenceImageKey: text('reference_image_key')` with comment "R2 object key (not URL)".
- `src/features/pipeline/inngest.ts:119` — `appendCharacter(projectId, char.name, char.description, result.imageUrl)` — passes a Replicate CDN URL as the "key".
- `src/features/pipeline/inngest.ts:133-135` — `characterReferences: sceneCharacters.map((c) => ({ imageUrl: c.referenceImageKey!, ... }))` — passes the URL back as `imageUrl`.
- Character images are NEVER uploaded to R2. The docs claim `putObject` is used for characters; the code doesn't do this.

**Why this is Medium:** The column name and comment are misleading. Future code that assumes `referenceImageKey` is an R2 key (e.g., calling `getSignedDownloadUrl('generated', c.referenceImageKey)`) will fail.

**Optimal fix:** Upload character images to R2 after generation, store the R2 key. This matches the docs' intent and makes the character images durable (Replicate CDN URLs expire).

**Files affected:**
- `src/features/pipeline/inngest.ts` (Step 2: after `generateCharacter`, fetch the image, `putObject` to R2, store the R2 key)
- `src/features/pipeline/domain/generate-character.ts` (return the image Buffer alongside the URL, or add a `downloadImage` helper)

**Alternative fix (smaller blast radius):** Rename the column to `referenceImageUrl` and update the comment. This avoids the R2 upload but contradicts the docs. **Not recommended** — the docs' intent (durable R2 storage) is correct.

---

### 🟡 M4 — Whisper call doesn't specify language

**Root cause:**
- `src/features/pipeline/domain/align-subtitles.ts:32-37` — `openai.audio.transcriptions.create({ file, model: 'whisper-1', response_format: 'verbose_json', timestamp_granularities: ['word'] })` — no `language` param.

**Why this is Medium:** Whisper auto-detects language, but accuracy drops for non-English audio. The threat model doesn't document this limitation.

**Files affected:**
- `src/features/pipeline/domain/align-subtitles.ts` (add optional `language` param, default to `'en'`)
- `src/features/pipeline/inngest.ts` (Step 5: pass `language` from project metadata, or default to `'en'`)
- `src/features/pipeline/domain/analyze-story.ts` (optionally: have GPT-4o detect the story's language and pass it through)

---

### 🟡 M5 — Stale "900s" references in code comments (drift)

**Root cause:**
- `src/lib/hooks/use-project-progress.ts:13-14` — comment says "Vercel caps SSE at 300s (Hobby) or **900s (Pro)**".
- `src/tests/unit/sse-progress.test.ts:166` — "Vercel caps SSE at 300-900s".
- `src/tests/unit/sse-progress.test.ts:256` — "previous value of 900 EXCEEDED".
- The actual route (`src/app/api/projects/[id]/progress/route.ts:42`) correctly uses `maxDuration = 800`.

**Why this is Medium:** Documentation drift inside the codebase. Confuses future maintainers.

**Files affected:**
- `src/lib/hooks/use-project-progress.ts` (update comment: 300s Hobby, 800s Pro/Enterprise GA, 1800s beta)
- `src/tests/unit/sse-progress.test.ts` (update comments)

---

### 🟡 M6 — `package.json` description stale; script name drift

**Root cause:**
- `package.json:5` — `"description": "Pixel-accurate marketing-site clone..."` — project is now a full SaaS.
- `package.json:22-23` — Scripts use `drizzle:generate` / `drizzle:migrate` (with `dotenv -e .env.local`), but docs say `pnpm drizzle-kit generate` directly.

**Why this is Medium:** Misleading to new contributors.

**Files affected:**
- `package.json` (update description)
- Docs (CLAUDE.md, AGENTS.md, README.md) — update script references to `pnpm drizzle:generate` / `pnpm drizzle:migrate`

---

### 🟡 M7 — `verifySession` accepts `redirectTo` option undocumented

**Root cause:**
- `src/features/auth/domain/verify-session.ts:28` — `export async function verifySession(options?: VerifySessionOptions)` where `VerifySessionOptions = { redirectTo?: string }`.
- Docs (CLAUDE.md, AGENTS.md) show `const session = await verifySession()` with no params.

**Why this is Medium:** Undocumented API surface. Not a bug, but contributors don't know the option exists.

**Files affected:**
- Docs (CLAUDE.md, AGENTS.md) — document the `redirectTo` option

---

## Part 2 — Remediation Plan with TDD ToDo List

The plan is organized into **6 phases**. Each phase is independently shippable. Phases are ordered by dependency (earlier phases unlock later ones) and by risk (Critical first).

**TDD cycle per task:**
1. **RED** — Write a failing test that captures the desired behavior.
2. **GREEN** — Write the minimum code to make the test pass.
3. **REFACTOR** — Clean up without changing behavior.
4. **COMMIT** — One TDD cycle = one commit.

**Verification gate per phase:**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
All four must pass with zero warnings/errors before advancing to the next phase.

---

### Phase 1 — Revenue Integrity & Idempotency (Critical)

**Goal:** Stop the revenue leak (C6), prevent double-debits (C5), and stop credits-before-insert (C4).

**Dependency:** None. This phase is self-contained.

#### Task 1.1 — Add `idempotencyKey` column to `usageEvents` (C5)

- [ ] **RED:** Add test `src/tests/unit/schema.test.ts` — assert `usageEvents` schema source contains `idempotencyKey` and `uniqueIndex`.
- [ ] **GREEN:** Edit `src/lib/db/schema/billing.ts`:
  - Add `idempotencyKey: text('idempotency_key')` column.
  - Add `(table) => ({ idempotencyKeyUniqueIdx: uniqueIndex('usage_events_idempotency_key_unique_idx').on(table.idempotencyKey) })`.
- [ ] **REFACTOR:** Make `idempotencyKey` nullable for backward compat with existing rows (or NOT NULL with a default of `crypto.randomUUID()` for legacy).
- [ ] **COMMIT:** `feat(billing): add idempotencyKey column + UNIQUE index to usageEvents`
- [ ] **MIGRATION:** Run `pnpm drizzle:generate` → review SQL → `pnpm drizzle:migrate`.

#### Task 1.2 — Update `debitCredits` to accept `idempotencyKey` (C5)

- [ ] **RED:** Add test `src/tests/unit/credit-metering.test.ts` — assert `debitCredits` signature includes `idempotencyKey` param; assert it uses `onConflictDoNothing`; assert the row lock `.for('update')` is present (closes H10).
- [ ] **GREEN:** Edit `src/features/billing/queries.ts`:
  - Add `idempotencyKey: string` as the 4th param of `debitCredits`.
  - Change the `usageEvents` insert to use `.onConflictDoNothing({ target: usageEvents.idempotencyKey })`.
  - If the insert returns no rows (conflict), skip the debit (return early with `{ idempotent: true }`).
  - Return `{ idempotent: boolean; eventId: string | null }` instead of `void`.
- [ ] **REFACTOR:** Extract the idempotency check into a helper if the function gets too long.
- [ ] **COMMIT:** `feat(billing): debitCredits now idempotent via ON CONFLICT DO NOTHING`

#### Task 1.3 — Add UNIQUE constraint on `videos.projectId` and `voiceovers.projectId` (C5, M1)

- [ ] **RED:** Add test `src/tests/unit/schema.test.ts` — assert `videos` and `voiceovers` schemas contain `uniqueIndex` on `projectId`.
- [ ] **GREEN:** Edit `src/lib/db/schema/media.ts`:
  - Add `(table) => ({ projectIdUniqueIdx: uniqueIndex('videos_project_id_unique_idx').on(table.projectId) })` to `videos`.
  - Same for `voiceovers`.
- [ ] **REFACTOR:** Consider whether `characters` and `scenes` should also have UNIQUE constraints on `(projectId, order)` or `(projectId, name)`. Probably yes for scenes (order must be unique per project).
- [ ] **COMMIT:** `feat(schema): UNIQUE constraints on videos.projectId + voiceovers.projectId`
- [ ] **MIGRATION:** `pnpm drizzle:generate` → review → `pnpm drizzle:migrate`. **⚠️ If duplicate rows exist, the migration will fail.** Run a cleanup query first: `DELETE FROM videos WHERE id NOT IN (SELECT MIN(id) FROM videos GROUP BY project_id);`

#### Task 1.4 — Update pipeline queries to use `ON CONFLICT DO NOTHING` (C5)

- [ ] **RED:** Add test `src/tests/unit/pipeline-queries.test.ts` — assert `appendVideo`, `appendVoiceover`, `appendCharacter`, `appendScene` sources contain `onConflictDoNothing`.
- [ ] **GREEN:** Edit `src/features/pipeline/queries.ts`:
  - `appendVideo` → use `.onConflictDoNothing({ target: videos.projectId })`.
  - `appendVoiceover` → same.
  - `appendCharacter` → use `.onConflictDoNothing({ target: and(eq(characters.projectId), eq(characters.name)) })` (add a composite unique index first).
  - `appendScene` → use `.onConflictDoNothing({ target: and(eq(scenes.projectId), eq(scenes.order)) })` (add composite unique index).
- [ ] **REFACTOR:** Return `{ inserted: boolean }` so callers can distinguish new vs. duplicate.
- [ ] **COMMIT:** `feat(pipeline): append* queries now idempotent via ON CONFLICT`

#### Task 1.5 — Wire idempotency keys into the pipeline (C5, C6)

- [ ] **RED:** Add test `src/tests/unit/pipeline-sprint5.test.ts` (or new file) — assert Steps 2, 3, 4, 5, 6 call `debitCredits` with deterministic keys like `${projectId}:character:${charName}` and `${projectId}:scene:${sceneOrder}`.
- [ ] **GREEN:** Edit `src/features/pipeline/inngest.ts`:
  - **Step 2 (generate-characters):** Inside the per-character loop, call `debitCredits(project.userId, CREDIT_COSTS.character_generation, 'character_generation', projectId, \`${projectId}:character:${char.name}\`)` BEFORE `generateCharacter`. (Closes C6.)
  - **Step 3 (generate-scenes):** Same pattern with `\`${projectId}:scene:${scene.order}\``. (Closes C6.)
  - **Step 4 (synthesize-voiceover):** Change to `debitCredits(..., \`${projectId}:voiceover\`)`.
  - **Step 5 (align-subtitles):** `\`${projectId}:subtitle_alignment\``.
  - **Step 6 (assemble-video):** `\`${projectId}:video_assembly\``.
- [ ] **REFACTOR:** Extract a helper `pipelineIdempotencyKey(projectId, step, entityId?)` to standardize.
- [ ] **COMMIT:** `feat(pipeline): idempotent credit debiting for all 6 steps (closes C6 revenue leak)`

#### Task 1.6 — Reorder `createProjectAction`: insert project BEFORE debit (C4)

- [ ] **RED:** Add test `src/tests/unit/create-project-action.test.ts` — assert the action inserts the project row BEFORE calling `debitCredits`. (Source-reading test: regex for the order of `db.insert(projects)` vs `debitCredits`.)
- [ ] **GREEN:** Edit `src/features/projects/actions.ts`:
  - Move `db.insert(projects)` to BEFORE `debitCredits`.
  - Wrap both in a single `db.transaction(async (tx) => { ... })` so they roll back together.
  - If the transaction throws, return `{ success: false, code: 'INTERNAL' }` — credits are NOT debited because the transaction rolled back.
- [ ] **REFACTOR:** Extract the transaction body into a helper if it gets long.
- [ ] **COMMIT:** `feat(projects): createProjectAction now wraps insert+debit in a single transaction`

#### Task 1.7 — Update `FULL_PIPELINE_COST` test to reflect actual debits (C6 verification)

- [ ] **RED:** Add test `src/tests/unit/credit-metering.test.ts` — assert `FULL_PIPELINE_COST` equals `5 + 30 + 48 + 15 + 3 + 30 = 131` (i.e., the formula is correct now that all steps debit).
- [ ] **GREEN:** No code change needed (the constant is already correct). The test locks the formula.
- [ ] **COMMIT:** `test(billing): lock FULL_PIPELINE_COST formula at 131 credits`

**Phase 1 Verification Gate:**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

### Phase 2 — Auth & Sign-up Flow (Critical)

**Goal:** Make sign-up actually work (C1), add rate limiting (C3).

**Dependency:** None for C1. C3 depends on adding `@upstash/ratelimit` to `package.json`.

#### Task 2.1 — Create `signUpAction` server action (C1)

- [ ] **RED:** Create `src/tests/unit/sign-up-action.test.ts` — assert:
  - `signUpAction` exists in `src/features/auth/actions.ts`.
  - It validates email + password with Zod (min 8 chars).
  - It hashes the password with `bcrypt.hash(password, 12)` (cost 12, matching docs — not seed's 10).
  - It inserts a user row.
  - It creates a free-tier subscription via `getOrCreateSubscription`.
  - It returns `{ success: true }` on success.
  - It returns `{ success: false, code: 'EMAIL_EXISTS' }` if the email is already registered.
- [ ] **GREEN:** Create `src/features/auth/actions.ts`:
  ```typescript
  'use server';
  import { z } from 'zod';
  import bcrypt from 'bcryptjs';
  import { db } from '@/lib/db';
  import { users } from '@/lib/db/schema';
  import { eq } from 'drizzle-orm';
  import { getOrCreateSubscription } from '@/features/billing/queries';

  const SignUpSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(100).optional(),
  });

  export async function signUpAction(input: z.infer<typeof SignUpSchema>) {
    const parsed = SignUpSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Invalid input', code: 'VALIDATION' };

    const existing = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
    if (existing.length > 0) return { success: false, error: 'Email already registered', code: 'EMAIL_EXISTS' };

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const [user] = await db.insert(users).values({
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      passwordHash,
      emailVerified: new Date(),
    }).returning();

    if (!user) return { success: false, error: 'Failed to create user', code: 'INTERNAL' };

    await getOrCreateSubscription(user.id);
    return { success: true, userId: user.id };
  }
  ```
- [ ] **REFACTOR:** Add a `UniqueConstraintError` helper if Postgres throws on the email unique index.
- [ ] **COMMIT:** `feat(auth): add signUpAction server action (email + password registration)`

#### Task 2.2 — Wire `AuthForm` to call `signUpAction` in sign-up mode (C1)

- [ ] **RED:** Update `src/tests/unit/auth-pages.test.ts` — assert `AuthForm` in `sign-up` mode calls `signUpAction` (not `signIn`). Add a functional test that renders the form and submits.
- [ ] **GREEN:** Edit `src/components/app/auth-form.tsx`:
  - Import `signUpAction` from `@/features/auth/actions`.
  - In `handleSubmit`, branch on `isSignUp`:
    - If sign-up: call `signUpAction({ email, password })`. On success, call `signIn('credentials', { email, password, redirect: false })` to auto-login. On `EMAIL_EXISTS`, show the error.
    - If sign-in: existing behavior.
- [ ] **REFACTOR:** Extract the submit logic into a helper if it gets long.
- [ ] **COMMIT:** `feat(auth): AuthForm sign-up mode now calls signUpAction`

#### Task 2.3 — Add Upstash Ratelimit client (C3)

- [ ] **RED:** Create `src/tests/unit/rate-limit.test.ts` — assert `src/lib/rate-limit.ts` exports `authRateLimit` and `pipelineRateLimit` Ratelimit instances.
- [ ] **GREEN:** Install deps: `pnpm add @upstash/ratelimit @upstash/redis`. Create `src/lib/rate-limit.ts`:
  ```typescript
  import { Ratelimit } from '@upstash/ratelimit';
  import { Redis } from '@upstash/redis';
  import { env } from '@/lib/env';

  const redis = Redis.fromEnv({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  export const authRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '15 m'),  // 10 attempts per 15 min per IP
    prefix: 'auth',
  });

  export const pipelineRateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),  // 5 projects per min per user
    prefix: 'pipeline',
  });
  ```
- [ ] **REFACTOR:** Make the Redis client lazy (don't connect at module load during build).
- [ ] **COMMIT:** `feat(rate-limit): add Upstash Ratelimit client (auth + pipeline)`

#### Task 2.4 — Rate-limit `createProjectAction` (C3)

- [ ] **RED:** Add test `src/tests/unit/create-project-action.test.ts` — assert the action calls `pipelineRateLimit.limit(userId)` before debiting credits.
- [ ] **GREEN:** Edit `src/features/projects/actions.ts`:
  - Import `pipelineRateLimit` from `@/lib/rate-limit`.
  - After `verifySession`, call `const { success } = await pipelineRateLimit.limit(userId)`. If `!success`, return `{ success: false, error: 'Rate limit exceeded', code: 'RATE_LIMITED' }`.
  - Add `RATE_LIMITED` to the `CreateProjectResult` error code union.
- [ ] **REFACTOR:** Extract the rate-limit check into a helper if multiple actions need it.
- [ ] **COMMIT:** `feat(projects): createProjectAction now rate-limited (5/min/user)`

#### Task 2.5 — Rate-limit auth endpoints (C3)

- [ ] **RED:** Add test `src/tests/unit/sign-up-action.test.ts` — assert `signUpAction` calls `authRateLimit.limit(ip)` before creating a user.
- [ ] **GREEN:** Edit `src/features/auth/actions.ts`:
  - Import `authRateLimit` and `headers` from `next/headers`.
  - At the top of `signUpAction`, read the IP from `headers()` (use `x-forwarded-for` or `x-real-ip`).
  - Call `const { success } = await authRateLimit.limit(ip)`. If `!success`, return `{ success: false, error: 'Too many attempts', code: 'RATE_LIMITED' }`.
- [ ] **REFACTOR:** Extract `getClientIp()` helper.
- [ ] **COMMIT:** `feat(auth): signUpAction now rate-limited (10/15min/IP)`

#### Task 2.6 — Limit SSE to 1 connection per user/project (C3)

- [ ] **RED:** Add test `src/tests/unit/sse-progress.test.ts` — assert the SSE route checks a per-user connection limit before opening the stream.
- [ ] **GREEN:** Edit `src/app/api/projects/[id]/progress/route.ts`:
  - Import `authRateLimit` (or a dedicated `sseRateLimit`).
  - After the auth + owner check, call `const { success } = await sseRateLimit.limit(\`${session.user.id}:${projectId}\`)`. If `!success`, return 429.
  - On stream close (terminal status or abort), the limit auto-expires (use a short TTL like 60s).
- [ ] **REFACTOR:** Consider using a `fixedWindow` instead of `slidingWindow` for SSE (we want "1 active connection", not "1 per minute").
- [ ] **COMMIT:** `feat(sse): limit to 1 concurrent connection per user/project`

**Phase 2 Verification Gate:**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

### Phase 3 — Security & Hardening (Critical/High)

**Goal:** Fix IP-Adapter placeholder (C2), host header injection (H6), R2 URL expiry (H4), image moderation default (H8), FFmpeg OOM (H5), Stripe webhook idempotency (H7), health endpoint (H9), FFMPEG_PATH bypass (H1).

**Dependency:** Phase 1 (for the idempotency pattern reuse in H7).

#### Task 3.1 — Add `FFMPEG_PATH` to Zod env schema (H1)

- [ ] **RED:** Add test `src/tests/unit/env.test.ts` — assert `env.FFMPEG_PATH` is accessible and defaults to `/usr/bin/ffmpeg` when unset.
- [ ] **GREEN:** Edit `src/lib/env/index.ts`:
  - Add `FFMPEG_PATH: z.string().optional().default('/usr/bin/ffmpeg')` to the schema.
  - Add `FFMPEG_PATH: '/usr/bin/ffmpeg'` to the build-context placeholder object.
- [ ] **GREEN:** Edit `src/features/pipeline/domain/assemble-video.ts`:
  - Replace `return process.env.FFMPEG_PATH ?? '/usr/bin/ffmpeg'` with `import { env } from '@/lib/env'; return env.FFMPEG_PATH`.
- [ ] **REFACTOR:** Update `src/tests/unit/assemble-video.test.ts` to mock `@/lib/env` instead of `process.env.FFMPEG_PATH`.
- [ ] **COMMIT:** `fix(env): FFMPEG_PATH now goes through Zod validation (closes H1)`

#### Task 3.2 — Add startup-time warning for IP-Adapter placeholder (C2)

- [ ] **RED:** Add test `src/tests/unit/replicate-models.test.ts` — assert that when `REPLICATE_SDXL_IPADAPTER_MODEL` equals the SDXL base hash, a `console.warn` is emitted at module load.
- [ ] **GREEN:** Edit `src/lib/ai/replicate.ts`:
  ```typescript
  const SDXL_BASE_HASH = 'stability-ai/sdxl:39ed52f2a788939d832ec6675557c771a6b0f9b6ce8bcd3ff0f4e4f3f1e0a6e3';
  if (env.REPLICATE_SDXL_IPADAPTER_MODEL === SDXL_BASE_HASH && env.NODE_ENV === 'production') {
    console.warn('[replicate] REPLICATE_SDXL_IPADAPTER_MODEL is the SDXL base placeholder. Character consistency will NOT work. Set it to a real IP-Adapter model hash.');
  }
  ```
- [ ] **REFACTOR:** Extract the placeholder hash to a named constant.
- [ ] **COMMIT:** `fix(replicate): warn loudly when IP-Adapter model is the placeholder (closes C2)`

#### Task 3.3 — Correct the IP-Adapter model name in `.env.example` and docs (C2)

- [ ] **RED:** Add test `src/tests/unit/replicate-models.test.ts` — assert `.env.example` does NOT reference `lucataco/sdxl-ipadapter` (which may not exist); references the real model name.
- [ ] **GREEN:** Edit `.env.example:41` — change `lucataco/sdxl-ipadapter:<real-version-hash>` to the actual Replicate model (e.g., `lucataco/ip-adapter-faceid:<sha>` or whatever the validation confirms exists).
- [ ] **GREEN:** Update all docs that reference `lucataco/sdxl-ipadapter`.
- [ ] **COMMIT:** `docs: correct IP-Adapter model name in .env.example`

#### Task 3.4 — Implement click-time R2 URL signing (H4)

- [ ] **RED:** Create `src/tests/unit/api-project-download.test.ts` — assert:
  - `GET /api/projects/[id]/download` returns 401 if unauthenticated.
  - Returns 404 if user doesn't own the project.
  - Returns 409 if `videoKey` is null.
  - Returns 200 with `{ url: signedUrl }` on success.
  - The signed URL is freshly generated (mock `getSignedDownloadUrl` and assert it's called).
- [ ] **GREEN:** Create `src/app/api/projects/[id]/download/route.ts`:
  ```typescript
  import { auth } from '@/lib/auth';
  import { getProject } from '@/features/projects/queries';
  import { getSignedDownloadUrl } from '@/lib/storage/r2';
  import { NextRequest, NextResponse } from 'next/server';

  export const dynamic = 'force-dynamic';

  export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const project = await getProject(id, session.user.id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!project.videoKey) return NextResponse.json({ error: 'Video not ready' }, { status: 409 });
    try {
      const signedUrl = await getSignedDownloadUrl('videos', project.videoKey);
      return NextResponse.json({ url: signedUrl });
    } catch (error) {
      console.error('[Download] R2 signing failed:', error);
      return NextResponse.json({ error: 'Storage error' }, { status: 500 });
    }
  }
  ```
- [ ] **GREEN:** Refactor `src/components/app/project-download-button.tsx` — accept `projectId` (not `downloadUrl`); fetch `/api/projects/${projectId}/download` on click; trigger download via `<a>` element.
- [ ] **REFACTOR:** Delete `src/components/app/signed-download-wrapper.tsx` (no longer needed). Update `src/app/(app)/projects/[id]/page.tsx` to pass `projectId` + `hasVideo` instead of wrapping in `SignedDownloadWrapper`.
- [ ] **COMMIT:** `feat(download): click-time R2 URL signing via /api/projects/[id]/download (closes H4)`

#### Task 3.5 — Flip `IMAGE_MODERATION_FAIL_OPEN` default to `'false'` (H8)

- [ ] **RED:** Update `src/tests/unit/env.test.ts` — assert `IMAGE_MODERATION_FAIL_OPEN` defaults to `'false'` when `NODE_ENV === 'production'` and `'true'` when `NODE_ENV === 'development'`.
- [ ] **GREEN:** Edit `src/lib/env/index.ts`:
  ```typescript
  IMAGE_MODERATION_FAIL_OPEN: z.enum(['true', 'false']).optional().default(
    process.env.NODE_ENV === 'production' ? 'false' : 'true'
  ),
  ```
- [ ] **REFACTOR:** Update `.env.example` comment to reflect the new production default.
- [ ] **COMMIT:** `fix(env): IMAGE_MODERATION_FAIL_OPEN defaults to false in production (closes H8)`

#### Task 3.6 — Add host header validation to proxy (H6)

- [ ] **RED:** Create `src/tests/unit/proxy-host-hardening.test.ts` — assert the proxy source contains a host whitelist check; assert it returns 400 for spoofed hosts.
- [ ] **GREEN:** Edit `src/proxy.ts`:
  ```typescript
  const host = req.headers.get('host') || '';
  const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);
  const isAllowedHost =
    host === appUrl.host ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.endsWith('.vercel.app');
  if (!isAllowedHost) {
    return new NextResponse('Invalid Host header', { status: 400 });
  }
  ```
  Add this BEFORE the auth check. Import `env` from `@/lib/env`.
- [ ] **REFACTOR:** Make the allowed-hosts list configurable via env (e.g., `ALLOWED_HOSTS` comma-separated).
- [ ] **COMMIT:** `feat(proxy): host header validation (closes H6)`

#### Task 3.7 — Add `/projects/:path*` to the proxy matcher (H6 cleanup)

- [ ] **RED:** Update `src/tests/unit/proxy.test.ts` — assert the matcher includes `/projects/:path*`.
- [ ] **GREEN:** Edit `src/proxy.ts:51-56` — add `'/projects/:path*'` to the matcher array. Add `/projects` to `protectedPaths`.
- [ ] **COMMIT:** `feat(proxy): protect /projects/:path* at the edge`

#### Task 3.8 — Robust health endpoint (H9)

- [ ] **RED:** Create `src/tests/unit/health.test.ts` — assert the health route checks DB connectivity (`SELECT 1`) and FFmpeg accessibility (`fs.accessSync`); returns 503 if either fails.
- [ ] **GREEN:** Edit `src/app/api/health/route.ts`:
  ```typescript
  import { db } from '@/lib/db';
  import { env } from '@/lib/env';
  import { sql } from 'drizzle-orm';
  import fs from 'node:fs';

  export const dynamic = 'force-dynamic';

  export async function GET() {
    let dbHealthy = false;
    let ffmpegHealthy = false;
    const errors: string[] = [];

    try {
      await db.execute(sql`SELECT 1`);
      dbHealthy = true;
    } catch (err) {
      errors.push(`Postgres: ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      fs.accessSync(env.FFMPEG_PATH, fs.constants.F_OK | fs.constants.X_OK);
      ffmpegHealthy = true;
    } catch (err) {
      errors.push(`FFmpeg: ${err instanceof Error ? err.message : String(err)}`);
    }

    const healthy = dbHealthy && ffmpegHealthy;
    return NextResponse.json(
      { status: healthy ? 'healthy' : 'unhealthy', services: { database: dbHealthy, ffmpeg: ffmpegHealthy }, errors: errors.length ? errors : undefined },
      { status: healthy ? 200 : 503 },
    );
  }
  ```
- [ ] **COMMIT:** `feat(health): robust health check (DB + FFmpeg) (closes H9)`

#### Task 3.9 — Fix Stripe webhook idempotency (H7)

- [ ] **RED:** Update `src/tests/unit/stripe-webhook.test.ts` — assert the webhook uses `onConflictDoNothing` on `usageEvents.idempotencyKey` (reusing the column from Task 1.1); assert no hardcoded system-user UUID.
- [ ] **GREEN:** Edit `src/app/api/stripe/webhook/route.ts`:
  - Replace the `SELECT ... WHERE metadata = event.id` check with an `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING` pattern.
  - Use `event.id` as the `idempotencyKey`.
  - Make `usageEvents.userId` nullable (schema change) OR insert into a separate `webhookEvents` table. **Recommended:** make `userId` nullable + add a system user row in seed.
- [ ] **GREEN:** Edit `src/lib/db/schema/billing.ts` — make `userId` nullable: `userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' })` (remove `.notNull()`).
- [ ] **GREEN:** Edit `src/lib/db/seed.ts` — add a system user with a well-known UUID (e.g., `00000000-0000-0000-0000-000000000000`) at the top of the seed.
- [ ] **MIGRATION:** `pnpm drizzle:generate` → review → `pnpm drizzle:migrate`.
- [ ] **COMMIT:** `fix(stripe): webhook idempotency via ON CONFLICT; system user for webhook logs (closes H7)`

#### Task 3.10 — Stream FFmpeg output directly to R2 (H5)

- [ ] **RED:** Update `src/tests/unit/assemble-video.test.ts` — assert `assembleVideo` accepts a `Writable` stream; assert it uses `-movflags frag_keyframe+empty_moov`; assert it does NOT call `readFile` on the output.
- [ ] **GREEN:** Install dep: `pnpm add @aws-sdk/lib-storage`.
- [ ] **GREEN:** Refactor `src/features/pipeline/domain/assemble-video.ts`:
  - Change `AssembleVideoInput` to accept `outputStream: Writable` instead of returning `videoBuffer`.
  - Add `-movflags frag_keyframe+empty_moov` to output options.
  - Use `command.pipe(outputStream, { end: true })` instead of `command.save(outputPath)`.
  - Remove the `readFile` + `cleanupTempFiles(outputPath)` logic (only clean up the SRT temp file).
- [ ] **GREEN:** Edit `src/features/pipeline/inngest.ts` (Step 6):
  - Create `const passThrough = new PassThrough()`.
  - Initialize `const upload = new Upload({ client: s3Client, params: { Bucket, Key, Body: passThrough, ContentType: 'video/mp4' }, queueSize: 4, partSize: 5 * 1024 * 1024 })`.
  - Call `assembleVideo({ ..., outputStream: passThrough })`.
  - `await upload.done()`.
- [ ] **REFACTOR:** Extract the stream-to-R2 logic into a helper in `src/lib/storage/r2.ts` (`putObjectStream`).
- [ ] **COMMIT:** `feat(pipeline): stream FFmpeg output directly to R2 (closes H5)`

**Phase 3 Verification Gate:**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

### Phase 4 — Design System & UX (High)

**Goal:** Fix brand color violations (H2), style chip enum mismatch (H3), story length inconsistency (M2), `referenceImageKey` semantic (M3).

**Dependency:** None.

#### Task 4.1 — Add ESLint rule banning brand color violations (H2)

- [ ] **RED:** Create `src/tests/unit/brand-tokens.test.ts` — grep `src/components/**` and `src/app/**` for `bg-amber-300|400|500|600`, `bg-zinc-950|900`, `bg-black\b`; fail if any match.
- [ ] **GREEN:** Edit `eslint.config.mjs` — add `no-restricted-syntax` rule:
  ```javascript
  {
    selector: "Literal[value=/\\b(bg-(amber-(300|400|500|600)|zinc-(950|900)|black)\\b)/]",
    message: "Use brand tokens (bg-primary, bg-background, bg-card) instead of Tailwind defaults.",
  }
  ```
- [ ] **COMMIT:** `test(design): CI grep test for brand token violations (closes H2 part 1)`

#### Task 4.2 — Replace brand color violations in components (H2)

- [ ] **RED:** The test from 4.1 should initially FAIL (it finds 75+ violations).
- [ ] **GREEN:** For each of the 22 files with `amber-*` violations:
  - Replace `bg-amber-400` → `bg-primary`
  - Replace `text-amber-400` → `text-primary`
  - Replace `border-amber-400` → `border-primary`
  - Replace `hover:bg-amber-300` → `hover:bg-primary/90`
  - Replace `focus-visible:outline-amber-400` → `focus-visible:outline-ring`
- [ ] **GREEN:** For each of the 21 files with `bg-zinc-950|900|black`:
  - Replace `bg-zinc-950` → `bg-background`
  - Replace `bg-zinc-900` → `bg-card`
  - Replace `bg-black` → `bg-background`
- [ ] **GREEN:** Fix the Hero radial glow (`src/components/sections/hero.tsx:56`): change `rgba(251,191,36,0.12)` → `rgba(254,191,0,0.12)`.
- [ ] **REFACTOR:** Do this in batches of 5 files per commit to keep diffs reviewable.
- [ ] **COMMIT:** `style(design): replace 75+ amber-* + 29+ zinc-950 with brand tokens (closes H2)`

#### Task 4.3 — Fix style chip enum mismatch (H3)

- [ ] **RED:** Update `src/tests/unit/style-chips.test.ts` — assert every chip label, when normalized via `toLowerCase().replace(/\s+/g, '-')`, is a valid value in the `visualStyleEnum`.
- [ ] **GREEN (Option A — add to enum, recommended):** Edit `src/lib/db/schema/projects.ts:27-35` — add `'medieval'` and `'japanese-animation'` to `visualStyleEnum`. Edit `src/features/projects/actions.ts:33-41` — add the same to the Zod enum. Edit `src/features/pipeline/domain/generate-character.ts:26-34` and `generate-scene.ts:33-41` — add `medieval` and `japanese-animation` entries to `STYLE_PROMPTS`.
- [ ] **MIGRATION:** `pnpm drizzle:generate` → review → `pnpm drizzle:migrate`. **⚠️ Postgres enum values cannot be removed; only added.** Adding is safe.
- [ ] **COMMIT:** `feat(schema): add medieval + japanese-animation styles (closes H3)`

#### Task 4.4 — Fix story length inconsistency (M2)

- [ ] **RED:** Add test `src/tests/unit/hero-character-counter.test.tsx` — assert the Hero textarea `maxLength` is 5000 (not 500); assert the counter shows `/ 5000`.
- [ ] **GREEN:** Edit `src/components/sections/hero.tsx:109` — change `maxLength={500}` to `maxLength={5000}`. Edit line 121 — change `{story.length} / 500` to `{story.length} / 5000`. Edit line 118 — change the `>= 450` threshold to `>= 4500`.
- [ ] **COMMIT:** `fix(hero): story length 500 → 5000 to match server validation (closes M2)`

#### Task 4.5 — Upload character images to R2; store R2 key (M3)

- [ ] **RED:** Update `src/tests/unit/pipeline-sprint3.test.ts` — assert Step 2 calls `putObject('generated', charKey, imageBuffer, 'image/png')` after `generateCharacter`; assert `appendCharacter` receives the R2 key (not the Replicate URL).
- [ ] **GREEN:** Edit `src/features/pipeline/inngest.ts` (Step 2):
  - After `generateCharacter`, fetch the image: `const imageResponse = await fetch(result.imageUrl); const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())`.
  - `const charKey = buildObjectKey(projectId, \`character-${char.name.toLowerCase()}.png\`)`.
  - `await putObject('generated', charKey, imageBuffer, 'image/png')`.
  - `await appendCharacter(projectId, char.name, char.description, charKey)` (pass the R2 key, not the URL).
- [ ] **GREEN:** Edit Step 3 (`generate-scene` references): `characterReferences: sceneCharacters.map((c) => ({ imageUrl: await getSignedDownloadUrl('generated', c.referenceImageKey!), name: c.name }))` — sign the R2 key to get a URL for Replicate.
- [ ] **COMMIT:** `feat(pipeline): upload character images to R2; store R2 key (closes M3)`

**Phase 4 Verification Gate:**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

### Phase 5 — Documentation & Drift (Medium)

**Goal:** Fix stale "900s" comments (M5), `package.json` description (M6), document `verifySession` options (M7), Whisper language (M4).

**Dependency:** None.

#### Task 5.1 — Fix stale "900s" references (M5)

- [ ] **RED:** Add test `src/tests/unit/sse-progress.test.ts` — assert no source file in `src/` contains the literal `900s` or `900 ` in a comment about Vercel limits (use a source-reading test with comment stripping).
- [ ] **GREEN:** Edit `src/lib/hooks/use-project-progress.ts:13-14` — change "900s (Pro)" to "800s (Pro/Enterprise GA), 1800s (beta)".
- [ ] **GREEN:** Edit `src/tests/unit/sse-progress.test.ts:166, 256` — update comments.
- [ ] **COMMIT:** `docs: fix stale 900s references in code comments (closes M5)`

#### Task 5.2 — Update `package.json` description + script references (M6)

- [ ] **RED:** Add test `src/tests/unit/metadata.test.ts` — assert `package.json` description contains "SaaS" (not just "clone").
- [ ] **GREEN:** Edit `package.json:5` — change description to: `"AI-powered story-into-video SaaS with auth, AI pipeline, and billing. Built with Next.js 16, React 19, Tailwind CSS v4, and Drizzle ORM."`.
- [ ] **COMMIT:** `chore: update package.json description (closes M6)`

#### Task 5.3 — Document `verifySession({ redirectTo })` option (M7)

- [ ] **GREEN:** Edit `CLAUDE.md`, `AGENTS.md` — add to the Auth.js v5 Patterns section: `verifySession({ redirectTo: '/projects/123' })` — redirects to `/sign-in?callbackUrl=/projects/123` after sign-in.
- [ ] **COMMIT:** `docs: document verifySession redirectTo option (closes M7)`

#### Task 5.4 — Add `language` param to Whisper call (M4)

- [ ] **RED:** Update `src/tests/unit/analyze-story.test.ts` (or new test) — assert `alignSubtitles` accepts an optional `language` param; assert it's passed to the Whisper API.
- [ ] **GREEN:** Edit `src/features/pipeline/domain/align-subtitles.ts`:
  - Add `language?: string` to `AlignSubtitlesInput` (or as a second param).
  - Pass `language: input.language ?? 'en'` to the Whisper API call.
- [ ] **GREEN:** Edit `src/features/pipeline/inngest.ts` (Step 5) — pass `language: 'en'` (or detect from analysis).
- [ ] **COMMIT:** `feat(pipeline): Whisper language param (defaults to en) (closes M4)`

**Phase 5 Verification Gate:**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

### Phase 6 — Test Hardening (High)

**Goal:** Lock in the fixes with regression tests.

**Dependency:** Phases 1-5 complete.

#### Task 6.1 — Add concurrency test for `debitCredits` (H10)

- [ ] **RED:** Create `src/tests/unit/billing-concurrency.test.ts` — use `Promise.allSettled` to fire 10 simultaneous `debitCredits` calls with the same idempotency key; assert exactly 1 succeeds, 9 are idempotent (return `{ idempotent: true }`).
- [ ] **GREEN:** This should pass with the Phase 1 changes. If it doesn't, fix the implementation.
- [ ] **COMMIT:** `test(billing): concurrency test for debitCredits idempotency (closes H10)`

#### Task 6.2 — Add end-to-end test for the full pipeline credit flow (C6 verification)

- [ ] **RED:** Create `src/tests/unit/pipeline-credits.test.ts` — mock all AI providers; run the pipeline; assert the total credits debited equals `5 + (10 × N_chars) + (8 × N_scenes) + 15 + 3 + 30`.
- [ ] **GREEN:** Should pass with Phase 1 changes.
- [ ] **COMMIT:** `test(pipeline): full-pipeline credit debit verification`

#### Task 6.3 — Add E2E test for sign-up flow (C1 verification)

- [ ] **RED:** Create `src/tests/e2e/sign-up.spec.ts` — fill in the sign-up form with a new email; assert redirect to `/dashboard`; assert the user appears in the DB.
- [ ] **GREEN:** Should pass with Phase 2 changes.
- [ ] **COMMIT:** `test(e2e): sign-up flow end-to-end (closes C1)`

#### Task 6.4 — Add E2E test for download flow (H4 verification)

- [ ] **RED:** Create `src/tests/e2e/download.spec.ts` — sign in; navigate to a completed project; click download; assert the API route is hit (not a direct R2 URL); assert the file downloads.
- [ ] **GREEN:** Should pass with Phase 3 changes.
- [ ] **COMMIT:** `test(e2e): download flow end-to-end (closes H4)`

**Phase 6 Verification Gate:**
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

---

## Part 3 — Plan Validation Against the Codebase

Before executing, I validated each task against the actual code to confirm:

### ✅ File paths exist and are writable
- All `src/` paths cited in the plan match the cloned repo structure.
- `src/features/auth/actions.ts` does NOT exist yet (Task 2.1 creates it) — confirmed by `ls src/features/auth/`.
- `src/app/api/projects/[id]/download/route.ts` does NOT exist yet (Task 3.4 creates it) — confirmed by `ls src/app/api/projects/[id]/`.

### ✅ Function signatures match
- `debitCredits(userId, amount, operationType, projectId?)` — confirmed at `src/features/billing/queries.ts:54-65`. Task 1.2 adds `idempotencyKey` as the 5th param.
- `getProject(projectId, userId)` — confirmed at `src/features/projects/queries.ts:31`. Task 3.4's API route calls it correctly.
- `getSignedDownloadUrl(bucket, key)` — confirmed at `src/lib/storage/r2.ts:88`. Task 3.4 calls it correctly.
- `verifySession(options?)` — confirmed at `src/features/auth/domain/verify-session.ts:28`. Task 2.1 doesn't need to change it.

### ✅ Dependencies are installable
- `@upstash/ratelimit` and `@upstash/redis` — not in `package.json` yet; `pnpm add` will install them.
- `@aws-sdk/lib-storage` — not in `package.json` yet; `pnpm add` will install it. Note: `@aws-sdk/client-s3` is already present, so `lib-storage` is a peer-compatible addition.

### ✅ Drizzle migrations will work
- Adding a column (`idempotencyKey`) + UNIQUE index — additive, safe.
- Adding UNIQUE constraint on `videos.projectId` / `voiceovers.projectId` — **requires cleanup of existing duplicate rows first**. The plan notes this in Task 1.3.
- Adding enum values (`medieval`, `japanese-animation`) — additive, safe in Postgres.
- Making `userId` nullable on `usageEvents` — safe (loosens constraint).

### ✅ Test infrastructure supports the TDD approach
- `vitest.config.ts` — jsdom environment, `vi.resetModules()` available, alias `@` → `./src`.
- `src/tests/setup.ts` — provides dummy env vars so the Zod schema doesn't throw at module load.
- Existing tests use source-reading patterns (`readFileSync` + regex) for server-only modules — the plan's tests follow the same pattern.

### ✅ No circular dependencies introduced
- `src/lib/rate-limit.ts` imports from `@/lib/env` (Layer 4) — same layer, no cycle.
- `src/features/auth/actions.ts` imports from `@/lib/db`, `@/features/billing/queries` — Layer 2 importing Layer 4 and another Layer 2 feature. The `queries.ts` boundary is respected.
- `src/app/api/projects/[id]/download/route.ts` imports from `@/lib/auth`, `@/features/projects/queries`, `@/lib/storage/r2` — Layer 1 importing Layers 2 + 4. Matches the existing route pattern.

---

## Part 4 — Ordering Constraints & Conflicts

### Dependency graph (topological order):

```
Phase 1 (Revenue Integrity):
  1.1 (idempotencyKey column) → 1.2 (debitCredits idempotent) → 1.5 (pipeline wiring)
  1.3 (UNIQUE on videos.projectId) → 1.4 (append* idempotent)
  1.6 (reorder createProjectAction) — independent
  1.7 (FULL_PIPELINE_COST test) — depends on 1.5

Phase 2 (Auth):
  2.1 (signUpAction) → 2.2 (AuthForm wiring)
  2.3 (rate-limit client) → 2.4, 2.5, 2.6 (rate-limit consumers)

Phase 3 (Security):
  3.1 (FFMPEG_PATH env) — independent
  3.2, 3.3 (IP-Adapter) — independent
  3.4 (click-time download) — independent
  3.5 (moderation default) — independent
  3.6, 3.7 (proxy hardening) — independent
  3.8 (health) — depends on 3.1 (uses env.FFMPEG_PATH)
  3.9 (Stripe webhook idempotency) — depends on 1.1 (reuses idempotencyKey column)
  3.10 (FFmpeg streaming) — independent

Phase 4 (Design):
  4.1 (ESLint rule) → 4.2 (replace violations)
  4.3 (style enum) — independent (requires DB migration)
  4.4 (story length) — independent
  4.5 (character R2 upload) — independent

Phase 5 (Docs):
  All independent.

Phase 6 (Tests):
  6.1 depends on 1.2
  6.2 depends on 1.5
  6.3 depends on 2.2
  6.4 depends on 3.4
```

### Conflicts to watch:

1. **Task 1.3 (UNIQUE on videos.projectId) vs. existing data:** If the DB already has duplicate video rows (from prior Inngest retries), the migration will fail. **Pre-migration cleanup required:** `DELETE FROM videos WHERE id NOT IN (SELECT MIN(id) FROM videos GROUP BY project_id);` Same for `voiceovers`.

2. **Task 3.9 (make userId nullable) vs. Task 1.1 (idempotencyKey):** Both modify `usageEvents`. Do them in the same migration to avoid two schema changes.

3. **Task 4.3 (add enum values) vs. existing data:** Postgres enum values can only be ADDED, not removed. The values `medieval` and `japanese-animation` are permanent once added. This is fine — they're legitimate styles.

4. **Task 3.10 (FFmpeg streaming) vs. Task 1.5 (idempotency keys in Step 6):** Both modify `src/features/pipeline/inngest.ts` Step 6. Do Task 1.5 first (smaller change), then Task 3.10 (larger refactor).

5. **Task 4.2 (brand color replacement) vs. existing visual tests:** There are no visual regression tests (per the docs), so this is safe. But the marketing page will look slightly different (`#febf00` is more saturated than `#fbbf24`). Manual visual review recommended before merging.

---

## Part 5 — Execution Checklist

Before starting each phase:

- [ ] Pull latest `main`: `git pull origin main`
- [ ] Create a branch: `git checkout -b remediation/phase-N`
- [ ] Ensure clean baseline: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` — all must pass.

During each task:

- [ ] **RED:** Write the failing test. Run `pnpm test <test-file>` — confirm it FAILS for the right reason.
- [ ] **GREEN:** Write the minimum code. Run `pnpm test <test-file>` — confirm it PASSES.
- [ ] **REFACTOR:** Clean up. Run `pnpm test <test-file>` — confirm still PASSES.
- [ ] **COMMIT:** `git commit -m "<conventional commit message>"` (one TDD cycle = one commit).

After each phase:

- [ ] Run the full verification gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
- [ ] If any DB migrations were generated, review the SQL in `drizzle/` before applying.
- [ ] Open a PR for the phase. Tag a reviewer.
- [ ] Do NOT start the next phase until the PR is merged.

After all phases:

- [ ] Run `pnpm test:e2e` (requires Playwright browsers).
- [ ] Manual smoke test: sign up → create project → watch pipeline → download video.
- [ ] Update `CLAUDE.md`, `AGENTS.md`, `README.md`, `PAD.md`, `SKILL.md` to reflect the changes (env var count, new files, new patterns).
- [ ] Bump `package.json` version (e.g., `0.2.0` for the remediation release).
- [ ] Tag the release: `git tag v0.2.0-remediation`.

---

## Part 6 — Summary

| Phase | Tasks | Issues Closed | Estimated Effort |
|---|---|---|---|
| **1 — Revenue Integrity** | 7 | C4, C5, C6, H10, M1 | 2-3 days |
| **2 — Auth & Sign-up** | 6 | C1, C3 | 2-3 days |
| **3 — Security & Hardening** | 10 | C2, H1, H4, H5, H6, H7, H8, H9 | 3-4 days |
| **4 — Design System & UX** | 5 | H2, H3, M2, M3 | 2-3 days |
| **5 — Documentation & Drift** | 4 | M4, M5, M6, M7 | 1 day |
| **6 — Test Hardening** | 4 | (locks in C1, C6, H4, H10) | 1-2 days |
| **Total** | **36 tasks** | **17 issues** | **11-16 days** |

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 6. Phases 4 and 5 can run in parallel with Phase 3 (different files, no conflicts).

**Highest-risk tasks:**
- Task 1.3 (UNIQUE constraint migration — requires data cleanup)
- Task 3.10 (FFmpeg streaming refactor — changes the core video assembly path)
- Task 4.2 (brand color replacement — touches 22 files)

**Highest-value tasks:**
- Task 1.5 (closes the 60% revenue leak — C6)
- Task 2.1 + 2.2 (unblocks user sign-up — C1)
- Task 3.4 (fixes the stale-tab download bug — H4)

---

**End of remediation plan.**

This plan is ready for execution. Each task is TDD-scoped, has a clear acceptance criterion, and has been validated against the actual codebase. The maintainer should triage this plan, confirm priorities, and authorize Phase 1 to begin.
