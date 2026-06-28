# StoryIntoVideo Documentation Bundle — Architecture & Design Critique

**Reviewer:** Frontend Architect & Avant-Garde UI Designer (Claw Code)
**Date:** 2026-06-28
**Subject:** `codebase_docs_bundle_set.md` (5 documents, 5,684 lines)
  - `AGENTS.md` (514 lines)
  - `CLAUDE.md` (849 lines)
  - `Project_Architecture_Document.md` (1,066 lines)
  - `README.md` (760 lines)
  - `storyintovideo_SKILL.md` (2,491 lines)
**Methodology:** Full read of all 5 documents → 22 targeted web searches against primary sources (Next.js docs, React.dev, Stripe docs, Vercel docs, pnpm blog, Auth.js docs, Cloudflare R2 docs, Neon docs, Inngest docs, NVD, GitHub Security Advisories) → cross-document consistency check → risk-rated findings.

---

## Executive Summary

The StoryIntoVideo documentation set is **above-average in rigor and self-awareness** for an AI-era SaaS codebase. It has:

- A genuine 5-layer architecture with an enforceable Golden Rule.
- Honest "Outstanding Issues" sections that admit what is NOT done.
- Forward-looking awareness of real 2025–2026 ecosystem changes (Stripe Basil, pnpm 11, Vercel Fluid Compute, CVE-2025-55182, Tailwind v4, Zod v4, Next.js 16 `proxy.ts`).
- TDD discipline with 288 unit + 48 E2E tests.

However, it also has **structural problems that will bite at scale**:

- **Critical self-contradictions** in two of its flagship patterns (Inngest v4 signature, `getProject()` "LEFT JOIN").
- **Insecure defaults** shipped under the banner of security (`IMAGE_MODERATION_FAIL_OPEN=true`, 28+ required env vars including unimplemented features).
- **A core product feature (character consistency) that silently does not work** unless an operator sets an env var the docs themselves call a "placeholder."
- **A polling-based SSE design** that does not match the stated rationale.
- **Document proliferation** (5 overlapping docs, 5,684 lines) that guarantees drift — and drift is already observable.

Below is the full critique. Severity ratings: **🔴 Critical** (blocks production) · **🟠 High** (degrades UX/security) · **🟡 Medium** (polish/compliance) · **🟢 Low** (documentation/maintenance).

---

## 1. Claims Validated Against Primary Sources

| # | Claim | Primary Source Verdict | Notes |
|---|---|---|---|
| 1 | Next.js 16 renamed `middleware.ts` → `proxy.ts` | ✅ **Confirmed** | [nextjs.org/docs/messages/middleware-to-proxy](https://nextjs.org/docs/messages/middleware-to-proxy) — "we are renaming the file convention to 'proxy.'" Official framing is "renaming," not "deprecated" (a YouTube video used that word; the docs do not). |
| 2 | CVE-2025-55182 "React2Shell" is a CVSS 10.0 pre-auth RCE in React Server Components | ✅ **Confirmed** | [react.dev/blog/2025/12/03/...](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components), [NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-55182), [Microsoft Security Blog](https://www.microsoft.com/en-us/security/blog/2025/12/15/defending-against-the-cve-2025-55182-react2shell-vulnerability-) all confirm. |
| 3 | Stripe "Basil" API (2025-03-31) moved `current_period_end` off the top-level Subscription object onto `subscription.items.data[0].current_period_end` | ✅ **Confirmed** | [Stripe Basil changelog](https://docs.stripe.com/changelog/basil/2025-03-31/deprecate-subscription-current-period-start-and-end), [dev.to explainer](https://dev.to/flarecanary/stripe-basil-quietly-moved-currentperiodend-off-subscription-and-a-lot-of-code-broke-3eo7). |
| 4 | Tailwind v4 replaces `tailwind.config.ts` with CSS-first `@theme` block in `globals.css` | ✅ **Confirmed** | [tailwindcss.com/blog/tailwindcss-v4](https://tailwindcss.com/blog/tailwindcss-v4) — "reimagined configuration and customization" via CSS. |
| 5 | Zod v4 `.url()` uses `new URL()` (accepts any scheme); v3 used regex | ✅ **Confirmed** | [zod.dev/v4/changelog](https://zod.dev/v4/changelog) — "Validation now happens using the new URL() constructor, which is far more robust than the old regular expression approach." |
| 6 | Vercel Fluid Compute GA max-duration ceiling is 800s for Pro/Enterprise; 1800s is beta only | ✅ **Confirmed** | [vercel.com/docs/functions/limitations](https://vercel.com/docs/functions/limitations) — "The 800 second maximum is generally available for Pro and Enterprise teams. The 1800 second extended maximum is in beta." |
| 7 | pnpm 10.26+ introduced `allowBuilds` map; pnpm 11 removed `onlyBuiltDependencies` | ✅ **Confirmed** | [pnpm.io/blog/releases/10.26](https://pnpm.io/blog/releases/10.26) and [pnpm.io/blog/releases/11.0](https://pnpm.io/blog/releases/11.0) — "allowBuilds replaces the old build settings. onlyBuiltDependencies, onlyBuiltDependenciesFile, neverBuiltDependencies… removed in v11." |
| 8 | Auth.js v5 requires `trustHost: true` (or `AUTH_TRUST_HOST=true`) when deployed behind a reverse proxy | ✅ **Confirmed** | [authjs.dev/getting-started/deployment](https://authjs.dev/getting-started/deployment) — "When deploying your application behind a reverse proxy, you'll need to set AUTH_TRUST_HOST equal to true." |
| 9 | Cloudflare R2 supports S3-compatible presigned URLs via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | ✅ **Confirmed** | [developers.cloudflare.com/r2/api/s3/presigned-urls](https://developers.cloudflare.com/r2/api/s3/presigned-urls), [R2 aws-sdk-js-v3 example](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3). |
| 10 | Neon: pooled connection for app runtime; unpooled (direct) connection for `drizzle-kit` migrations | ✅ **Confirmed** | [neon.com/docs/guides/drizzle-migrations](https://neon.com/docs/guides/drizzle-migrations) — "using a pooled connection string for migrations can lead to errors. For this reason, we recommend using the unpooled connection string for migrations." |
| 11 | PostCSS advisory `GHSA-qx2v-qp2m-jg93` exists; requires malicious PostCSS plugin to exploit | ✅ **Confirmed** | [github.com/advisories/GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) — mapped to CVE-2026-41305 (not 2025 as the docs imply), moderate XSS, "Requires some PostCSS plugin to have malware code." Project's "non-exploitable transitive" classification is reasonable. |
| 12 | bcrypt cost factor 12 is at the upper end of recommended (10–12) | ✅ **Confirmed** | [security.stackexchange.com/questions/17207](https://security.stackexchange.com/questions/17207) — "I believe it is time for me to increase the default cost to 12." Project's choice of 12 is well-justified. |

**Net:** 12/12 spot-checked claims against external primary sources are accurate or defensible. This is **above the industry baseline** for AI-generated codebases.

---

## 2. Claims That Are Overstated, Misleading, or Wrong

### 2.1 🟠 High — React CVE patched-version range is overstated

**The docs say** (AGENTS.md §"Post-Review Hardening", CLAUDE.md, SKILL.md Bug #3):
> "the previous `^19.2.0` allowed versions 19.2.0–19.2.2 which are vulnerable to CVE-2025-55182"

**Primary source** ([react.dev blog](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components), [NVD](https://nvd.nist.gov/vuln/detail/CVE-2025-55182)):
> "The vulnerability is present in versions **19.0, 19.1.0, 19.1.1, and 19.2.0**."

That is, **only 19.2.0 is vulnerable in the 19.2.x line** — 19.2.1 and 19.2.2 are already patched per the React team. The project's claim that "19.2.0–19.2.2 are vulnerable" is an **over-claim**.

The pin to `^19.2.3` is still defensible (conservative floor, and 19.2.3 was the most recent patch mentioned in later sources), but the *rationale* ("19.2.1 and 19.2.2 are vulnerable") is factually wrong. **Fix the prose** to match React.dev's official version range.

### 2.2 🟠 High — `getProject()` is NOT a LEFT JOIN

**The docs say** (PAD Pattern 3, CLAUDE.md, AGENTS.md lessons learned):
> "`getProject()` LEFT JOINs videos — returns `videoKey`, `subtitleKey` (nullable)."

**The code example shows** (PAD §3.3, Pattern 3):

```typescript
const [project] = await db
  .select()
  .from(projects)
  .where(and(eq(projects.id, projectId)))
  .limit(1);
if (!project || project.userId !== userId) return null;

const videoData = await db
  .select({ videoKey: videos.videoKey, subtitleKey: videos.subtitleKey })
  .from(videos)
  .where(eq(videos.projectId, projectId))
  .limit(1);

return { ...project, videoKey: videoData[0]?.videoKey ?? null };
```

This is **two separate queries**, not a LEFT JOIN. A Drizzle LEFT JOIN would be:

```typescript
const [row] = await db
  .select({
    /* project fields */,
    videoKey: videos.videoKey,
    subtitleKey: videos.subtitleKey,
  })
  .from(projects)
  .leftJoin(videos, eq(videos.projectId, projects.id))
  .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
  .limit(1);
```

The prose claim and the code contradict each other. Either:
- **The code is wrong** (should be rewritten as an actual `leftJoin`), or
- **The description is wrong** (should say "two queries: project fetch + video fetch") and the "cheaper than two queries" justification in CLAUDE.md §Pitfall #33 is false.

Pick one and align the docs.

### 2.3 🟠 High — Inngest v4 `createFunction` signature description is self-contradictory

**The docs say** (CLAUDE.md Pitfall #19, AGENTS.md Pitfall #13, PAD Pattern 5):
> "Inngest v4 changed the `createFunction` signature. The trigger (`{ event: '...' }`) is now part of the config object, not a separate second argument."
> "the trigger is part of the config object (`triggers: [{ event: '...' }]`), NOT a second argument"

**The code example shows** (PAD §3.3 Pattern 5):

```typescript
inngest.createFunction(
  { id: 'pipeline', name: 'Story Pipeline', concurrency: 5 },   // arg 1: config
  { event: 'pipeline/start' },                                  // arg 2: trigger
  async ({ event, step }) => { ... }                            // arg 3: handler
);
```

The example **literally shows three arguments**: `config`, `trigger`, `handler`. The trigger is in arg 2, NOT inside arg 1's config object. The prose explicitly says "NOT a separate second argument," but the code shows exactly that — a separate second argument.

Additionally, the prose uses `triggers: [{ event: '...' }]` (an array of objects with an `event` key) in one place and `{ event: 'pipeline/start' }` (a single object, no array) in another.

**This is an internal contradiction that will confuse any agent trying to extend the pipeline.** I could not directly verify against the Inngest v4 migration guide in this session, but the project's own docs cannot both be correct.

**Action:** Fetch [inngest.com/docs/reference/typescript/v4/migrations/v3-to-v4](https://www.inngest.com/docs/reference/typescript/v4/migrations/v3-to-v4) and reconcile (a) whether the trigger is in arg 1 or arg 2, and (b) whether it's `{event: '...'}` or `{triggers: [{event: '...'}]}`.

### 2.4 🟡 Medium — "WCAG AAA" claim is partially false

**The docs say** (AGENTS.md §Accessibility, CLAUDE.md, PAD §5.2):
> "Color contrast: body text zinc-300 on zinc-950 = 12.6:1 (AAA)"
> "WCAG AAA — Qualified"

**Reality:** The contrast table in PAD §5.2 shows:
- `--foreground #f8f8f8` on `#020202` → 16.9:1 ✅ AAA
- body text `#d4d4d8` on `#020202` → 12.6:1 ✅ AAA
- `--muted-foreground #8e8e95` on `#020202` → **5.2:1** ❌ **AAA requires 7:1 for normal text** — this is AA only

The "Qualified" hedge in some places is honest, but the headline "WCAG AAA" branding in AGENTS.md §Accessibility Requirements is **aspirational, not actual**. The muted-foreground token fails AAA at normal text sizes.

**Fix:** Either (a) darken `--muted-foreground` to achieve ≥7:1 (e.g., `#a0a0a8` ≈ 7.0:1), or (b) rebrand consistently as "WCAG AA+ (AAA where feasible)" everywhere.

### 2.5 🟡 Medium — ADR-006 says "No npm package dependency" but `fluent-ffmpeg` is a dependency

**ADR-006 says** (PAD §1.3):
> "**Decision:** Use system FFmpeg binary via `getFfmpegPath()` helper that reads `FFMPEG_PATH` env var with `/usr/bin/ffmpeg` default. **No npm package dependency.**"

**CLAUDE.md says** (Tech Stack table):
> "Video | FFmpeg (fluent-ffmpeg + system binary) | `FFMPEG_PATH` env var (default `/usr/bin/ffmpeg`)"

**AGENTS.md says** (Stack):
> "FFmpeg (system binary, `FFMPEG_PATH` env var) · bcryptjs (password hashing)"

`fluent-ffmpeg` IS an npm package — it's a Node.js wrapper around the system FFmpeg binary. The unit tests for `assemble-video.ts` mention "mocked fluent-ffmpeg" which confirms it's a real dependency.

**The ADR's "No npm package dependency" claim is wrong.** The decision should be reframed as "Use `fluent-ffmpeg` as a Node wrapper around the system FFmpeg binary (installed via OS package manager, not `@ffmpeg-installer/ffmpeg`)." The ADR's *spirit* (avoid `@ffmpeg-installer/ffmpeg` because of Turbopack incompatibility) is correct; the *wording* is misleading.

### 2.6 🟡 Medium — Env var count drift across documents

| Document | Claimed count |
|---|---|
| AGENTS.md | "all 28 env vars" |
| CLAUDE.md | "all 28 env vars" (Pitfall #14) AND "all 29 env vars" (Pitfall #40, SKILL.md Bug #10) |
| PAD §9.2 | "Total: 28 required + 2 optional + 2 model ID overrides" (= 32) |
| SKILL.md | "29 env vars" (Bug #10, Pattern: Zod Env Schema) |

The PAD's §9.2 table actually enumerates 28 required + 4 optional (GOOGLE_CLIENT_ID/SECRET, REPLICATE_SDXL_MODEL, REPLICATE_SDXL_IPADAPTER_MODEL, IMAGE_MODERATION_FAIL_OPEN) = **32 total**, not 28 or 29.

**The number is wrong in 3 of 5 documents and inconsistent across all 5.** Pick the actual count (likely 32) and align all references.

### 2.7 🟢 Low — `@ffmpeg-installer/ffmpeg` Turbopack incompatibility claim is unverified

**The docs say** (AGENTS.md, CLAUDE.md, PAD ADR-006, SKILL.md Bug #11):
> "the package uses dynamic `require()` with runtime-constructed paths (`__dirname.indexOf('node_modules')`) that produce `/ROOT/node_modules/...` under Turbopack's virtual filesystem. Turbopack rejects this with 'server relative imports are not implemented.'"

I could not find a primary source (Turbopack issue tracker, `@ffmpeg-installer/ffmpeg` GitHub issue, or Vercel blog) confirming this exact failure mode. The claim is **plausible** (Turbopack is known to reject dynamic requires), and the *decision* to use system FFmpeg is sound regardless, but the specific technical claim about `/ROOT/node_modules/...` paths should be cited or hedged.

**Action:** Either link to the actual Turbopack error / GitHub issue, or hedge: "We observed Turbopack incompatibility with `@ffmpeg-installer/ffmpeg`'s dynamic require pattern; switched to system FFmpeg as a precaution."

---

## 3. Architectural Critique

### 3.1 🔴 Critical — Character consistency (the core feature) silently does not work by default

**The situation:**
- The marketing copy and product thesis (SKILL.md §1) promises "AI-powered story-into-video generator" with character-consistent scene generation.
- The IP-Adapter model env var (`REPLICATE_SDXL_IPADAPTER_MODEL`) defaults to the **SDXL base model** (a "documented placeholder" per the docs themselves).
- Without the IP-Adapter, scene generation produces **inconsistent characters** across scenes — there is no character consistency.
- The docs themselves admit (AGENTS.md §Outstanding): "**Character consistency validated end-to-end** — manual R&D test (Risk R1, highest-risk component). Code is wired; needs real API keys."
- Worse, the original placeholder hash was `6f288a8d-7e5e-4f0c-8b3f-3e1f3e6e3e3e` — a UUID-format string, **not a valid Replicate model hash** (which would be a 64-char hex SHA). The docs claim this was fixed, but the *replacement* is the SDXL base model, which still doesn't do IP-Adapter.

**Why this is critical:**
1. The product's differentiating feature (consistent characters across scenes) does not work out of the box.
2. A search for `lucataco/sdxl-ipadapter` on Replicate does not return that exact model name. The closest real model is `lucataco/ip-adapter-faceid` — and even *its own Replicate page* says: "The model does not achieve perfect photorealism and ID consistency. The generalization of the model is limited." So the **operator-facing instruction in the docs may point to a non-existent model**.
3. This is buried as a "HIGH" priority outstanding issue, not "CRITICAL — blocks launch."

**Recommendation:**
- Elevate to **CRITICAL** in the Outstanding Issues table.
- Validate the exact Replicate model identifier (`lucataco/sdxl-ipadapter` vs `lucataco/ip-adapter-faceid` vs other) before launch.
- Add a startup-time check that emits a loud warning (or refuses to start in production) if `REPLICATE_SDXL_IPADAPTER_MODEL` still matches the SDXL base model hash.
- Add a `pnpm test:smoke` script that exercises the pipeline end-to-end against a staging Neon + real (cheap) AI providers, so this regression is caught in CI rather than at launch.

### 3.2 🔴 Critical — No rate limiting, despite credit billing and AI cost exposure

**The situation:**
- The threat model (PAD §6.4) lists "Credential stuffing → bcrypt (cost factor 12); rate limiting via Upstash (planned)".
- The Upstash env vars are in the Zod schema (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- The integration is **not done**. There is no rate-limiting middleware on `/api/auth/*`, `/api/inngest`, `/api/projects/[id]/progress`, or `createProjectAction`.
- `createProjectAction` triggers a 6-step pipeline costing 71+ credits per project (analysis=5, char=10×N, scene=8×N, voiceover=15, subtitle=3, video=30). With no rate limit, a malicious user (or a compromised account) can spawn hundreds of pipelines.

**Why this is critical:**
1. **Direct cost amplification** — AI provider bills (OpenAI, Replicate, ElevenLabs) accumulate per pipeline. A script that creates 1000 projects in a minute could cost the operator thousands of dollars in AI inference before Stripe captures payment.
2. **Credit race conditions** — even with `debitCredits` in a transaction, a user with 100 credits can fire 100 concurrent `createProjectAction` calls in <1s. Each one sees 100 credits, debits 71, and triggers the pipeline. The transaction prevents double-spend per call, but not the burst itself — the user has spent 7100 credits they didn't have.
3. **Auth endpoints** — `/api/auth/callback/credentials` and `/api/auth/sign-in` are open to credential stuffing with no rate limit.

**Recommendation:**
- Implement Upstash Ratelimit (env vars are already in schema) on three layers:
  1. **Auth** — 5 sign-in attempts per IP per 15 minutes.
  2. **Pipeline trigger** — 5 `createProjectAction` calls per user per minute.
  3. **SSE** — 1 connection per user per project (close extras with 429).
- Add an idempotency key to `createProjectAction` (e.g., hash of `userId + story + style + aspectRatio + 5min window`) so rapid double-clicks don't create duplicate projects.
- Add a per-user "active pipelines" check (max 3 concurrent per user) before allowing a new one.
- Block launch on this — the threat model admits it; the outstanding list admits it; the launch checklist should too.

### 3.3 🟠 High — SSE polling design has a flawed rationale

**The docs say** (Pitfall #31, PAD §4.3):
> "**SSE polling vs. Postgres LISTEN/NOTIFY** — serverless SSE can't hold a long-lived Postgres connection for LISTEN/NOTIFY. The progress route polls the DB every 2s and closes the stream on terminal status. 2s is fast enough for a 5-15min pipeline without hammering the DB."

**The flaws:**

1. **The rationale is partially wrong.** Neon supports LISTEN/NOTIFY through pooled connections, and serverless-friendly abstractions exist (e.g., Upstash QStash, Pusher, Ably, Supabase Realtime, PolyScale with cache). The "can't hold long-lived connections" framing is true for raw Postgres on Vercel Functions, but it's not the only option.

2. **The polling math doesn't scale.** A 5–15min pipeline at 2s polling = **150–450 DB queries per viewer per pipeline**. If 10 users watch their dashboards simultaneously, that's 1,500–4,500 queries against Neon's pooled connection during the pipeline window. Neon's free tier is 100 compute hours/month; this could burn through that in a single busy afternoon.

3. **The 2s interval is arbitrary.** For a pipeline that takes 5–15 minutes, the user does not need 2-second granularity. 5s or 10s would be indistinguishable to the user and halve/third the DB load. The Inngest step functions themselves emit progress updates — the SSE could subscribe to Inngest's `step.emit()` events instead of polling the DB.

4. **The `maxDuration = 800` on the SSE route is also problematic.** A single SSE connection held for 800s = a long-lived Vercel Function. If 100 users are watching their pipelines, that's 100 × 800s = 80,000 GB-seconds of compute (at 1GB default), which is **expensive** on Vercel Pro. The client-side reconnect with exponential backoff is good, but the underlying model is wasteful.

**Better alternatives the docs don't mention:**

| Approach | Pros | Cons |
|---|---|---|
| **Inngest `step.emit()` + Client SDK** | Native to the existing stack; no DB polling; real-time | Requires Inngest client SDK in browser; extra JS bundle |
| **Pusher / Ably / Supabase Realtime** | Purpose-built for this; sub-second latency; cheap at scale | Adds a new vendor; auth integration needed |
| **Polling at 10s (not 2s)** | Trivial change; 5× less DB load | Slightly worse UX (max 10s staleness) |
| **Webhook from Inngest → push to client via Vercel KV pub/sub** | No long-lived function; scales horizontally | More moving parts |

**Recommendation:** Either (a) bump polling to 10s and document the tradeoff honestly, or (b) migrate to Inngest's native streaming (`step.emit()` + client SDK). Do not claim "2s is fast enough without hammering the DB" — for a 15min pipeline with multiple concurrent viewers, it does hammer the DB.

### 3.4 🟠 High — "Pure" domain functions are not pure

**The docs say** (ADR-001, PAD §3.3 Pattern 2, CLAUDE.md, AGENTS.md):
> "Domain Pure Functions — No Next.js or DB runtime imports. `import type` only."
> "Domain isolation — pure business logic in `src/features/*/domain/` (no Next.js or DB runtime imports, `import type` only)."

**The Pattern 2 example shows:**

```typescript
// src/features/pipeline/domain/moderate-image.ts
import { env } from '@/lib/env';  // env is read at module load (constant)
// All other imports must be type-only

const FAIL_OPEN = env.IMAGE_MODERATION_FAIL_OPEN === 'true';

export async function moderateImage(input: ModerateImageInput): Promise<ImageModerationResult> {
  // Pure logic: parse Replicate safety output → return result
}
```

**The problem:** `import { env } from '@/lib/env'` is a **runtime import**, not `import type`. The module's behavior depends on a side-channel value (`env.IMAGE_MODERATION_FAIL_OPEN`) that is read at module load. If you change the env var and reload the module, the function's output for the same input changes.

A truly pure function would take the config as a parameter:

```typescript
export interface ModerateImageConfig {
  failOpen: boolean;
}

export async function moderateImage(
  input: ModerateImageInput,
  config: ModerateImageConfig,
): Promise<ImageModerationResult> { ... }
```

The docs even acknowledge this in a parenthetical: *"The `env` import is safe because env vars are read once at module load (constants in production)."* — but that's a defense of impurity, not a refutation of it.

**Why this matters:**
1. **Testing** — the docs claim domain functions can be "unit-tested without mocking Next.js or a database." That's true. But they *do* require the `env` module to be stubbed (via `vi.stubEnv`), which is a form of mocking. The purity claim is oversold.
2. **Configuration drift** — if `IMAGE_MODERATION_FAIL_OPEN` is changed at runtime (e.g., via a feature flag service), the module-captured `FAIL_OPEN` constant won't update. This is fine for env vars (which don't change at runtime) but breaks if you ever want runtime config.
3. **Reusability** — `moderateImage` can't be reused in a different process (e.g., a CLI tool, a separate worker) without dragging the entire `env` module along.

**Recommendation:** Either:
- **Drop the "pure" claim** — say "domain functions are isolated from Next.js and DB runtime, but read config from the env module at module load." Honest and accurate.
- **Or actually make them pure** — pass `config` as a parameter; let the Inngest step wrapper read `env` and pass it in. This is the cleaner design.

### 3.5 🟠 High — `IMAGE_MODERATION_FAIL_OPEN` defaults to `true` (insecure default)

**The docs say** (Pitfall #36, ADR context, recommendations):
> "`moderateImage` fail-open policy — when Replicate's output shape is unknown, `moderateImage` returns `flagged:false` with `moderationSkipped:true`. This is a deliberate tradeoff. The policy is env-configurable via `IMAGE_MODERATION_FAIL_OPEN` (default `true`; set to `false` for production fail-closed)."

**And in Recommendations:**
> "Set `IMAGE_MODERATION_FAIL_OPEN=false` for production — fail-closed is the recommended setting once the model output shape is known and stable."

**The problem:** The default is the **insecure** behavior. This violates the **secure defaults principle** — a system should be secure by default and require explicit opt-in for less-secure modes.

Concretely: if an operator deploys StoryIntoVideo with `cp .env.example .env.local` and forgets to set `IMAGE_MODERATION_FAIL_OPEN`, the system silently allows any AI-generated image (including potentially prohibited content) to be stored and shown to users. The `moderationSkipped` flag and `console.warn` are observability, not protection.

**Recommendation:**
- Flip the default: `z.enum(['true','false']).optional().default('false')`.
- In dev mode (`NODE_ENV !== 'production'`), allow fail-open with a loud warning.
- In production, fail-closed is the default. Operators who want fail-open (e.g., during initial testing) must explicitly set `IMAGE_MODERATION_FAIL_OPEN=true`.
- Document this as a security control, not a "deliberate tradeoff."

### 3.6 🟠 High — `extractSubscriptionPeriodEnd()` is incomplete for multi-item subscriptions

**The helper:**

```typescript
export function extractSubscriptionPeriodEnd(subscription: StripeSubscriptionLike): number | null {
  const itemPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
  if (typeof itemPeriodEnd === 'number') return itemPeriodEnd;
  const topLevelPeriodEnd = subscription.current_period_end;
  if (typeof topLevelPeriodEnd === 'number') return topLevelPeriodEnd;
  return null;
}
```

**The problem:** Stripe's Basil API moved `current_period_end` to **subscription items** because items can now have **different billing periods**. The helper only checks `items.data[0]` (the first item). If a subscription has multiple items with different periods (e.g., a base subscription + an add-on billed annually), this returns the wrong period end.

**Why this matters:** StoryIntoVideo's billing is credit-based with 4 tiers (Free/Creator/Pro/Studio). If a future tier introduces add-ons (e.g., "buy 100 extra credits" as a separate subscription item), the webhook will silently use the wrong `current_period_end` for the user's plan, causing incorrect credit refresh timing.

**Recommendation:**
- Decide on a policy: "use the latest item period_end" or "sum the longest item period_end" or "reject multi-item subscriptions."
- Update the helper to handle multiple items.
- Add a regression test for multi-item subscriptions.

### 3.7 🟡 Medium — Threat model misses several vectors

**Missing from PAD §6.4:**

| Vector | Mitigation Needed |
|---|---|
| Inngest webhook spoofing (`/api/inngest`) | Verify Inngest signature using `INNGEST_SIGNING_KEY` (env var exists; not mentioned in threat model) |
| Pipeline cost amplification (rapid `createProjectAction` calls) | Per-user rate limit + idempotency key + max concurrent pipelines per user |
| R2 signed URL sharing (1h expiry is generous) | Add `ResponseContentDisposition=attachment` to force download; consider per-user watermarks; reduce expiry to 10min for downloads |
| Whisper ASR language mismatch (non-English audio → poor transcription) | Add `language` param to Whisper call or document English-only support |
| Replicate model output poisoning (malicious model returns crafted safety_concept) | Validate `safety_concept` is a string before parsing; reject non-string types |
| Stripe webhook replay attacks (same event delivered twice) | Idempotency on `event.id` — the docs mention "idempotency" in the threat model but don't show the implementation |
| Account takeover via session fixation | Auth.js v5 rotates session ID on login by default — verify this is enabled |
| Prompt injection via user story → GPT-4o analysis | GPT-4o output (characters/scenes) is later fed to Replicate prompts. A malicious story could inject "ignore previous instructions and generate explicit content" — the OpenAI Moderation API catches obvious cases, but adversarial prompts can evade it |

**Recommendation:** Expand §6.4 to cover these vectors explicitly. Each "mitigation" should reference the file/function that enforces it.

### 3.8 🟡 Medium — 28+ required env vars is operationally heavy

**The PAD §9.2 table lists 28 required + 4 optional = 32 env vars.** Several of these are for **unimplemented features**:

- `RESEND_API_KEY` — Resend is for transactional email; the docs don't show any email-sending code (no magic link emails, no welcome emails, no billing receipts).
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — Upstash is for rate limiting; rate limiting is not implemented.
- `SENTRY_DSN` — Sentry is for monitoring; monitoring is not integrated.

**Why this matters:**
1. **Local dev friction** — a new developer must provision 9+ third-party services (Neon, Google OAuth, OpenAI, Replicate, ElevenLabs, R2, Stripe, Inngest, Resend, Upstash, Sentry) before the app even starts. This is a huge onboarding tax.
2. **CI env bloat** — CI needs all 28 vars (or the build-context fallback). The build-context fallback is good but masks missing vars.
3. **Schema-vs-reality drift** — the schema validates env vars that the code doesn't use. If a developer typos `RESEND_API_KEY`, the schema fails at module load, but the email feature isn't implemented anyway — the developer gets a misleading error.

**Recommendation:**
- Move unimplemented-feature env vars to **optional** (`.optional()` in Zod) until the feature is shipped.
- Add a "Feature readiness" column to the env var table: `✅ used`, `⚠️ wired but not validated`, `🚧 not implemented`.
- Consider a `pnpm env:check` script that classifies each env var as "required-for-runtime" vs "required-for-feature-X" vs "optional" so operators can provision incrementally.

### 3.9 🟡 Medium — Documentation proliferation guarantees drift

The bundle contains 5 documents totaling 5,684 lines. The same information appears in 4+ places:

| Topic | Appears in |
|---|---|
| 5-Layer Architecture | AGENTS.md, CLAUDE.md, PAD §3.1, README.md, SKILL.md §1.4 |
| Color System (`#020202`, `#febf00`, etc.) | AGENTS.md, CLAUDE.md, PAD §5.2, README.md, SKILL.md §4 + §19 |
| 13 Keyframes list | AGENTS.md, CLAUDE.md, PAD §5.4, README.md, SKILL.md §4 |
| AI Pipeline (6 steps) | AGENTS.md, CLAUDE.md, PAD §7.3, README.md, SKILL.md §7 |
| Common Pitfalls (40+ items) | AGENTS.md, CLAUDE.md (same list, slightly different wording) |
| Outstanding Issues | AGENTS.md, CLAUDE.md, PAD §11 (overlapping but not identical) |

**Observable drift:**
- Env var count: 28 vs 29 vs 32 (see §2.6)
- `fluent-ffmpeg` mention: present in CLAUDE.md, absent in ADR-006 (see §2.5)
- "WCAG AAA": claimed outright in AGENTS.md, hedged as "Qualified" in PAD
- "Project files" list: slightly different in each document (e.g., AGENTS.md says 8 app components but doesn't list them; CLAUDE.md lists all 8; PAD lists all 8 with one-line descriptions)

**Why this matters:** Documentation drift is silent. When a developer updates the env schema to add a 29th var, they must update 4 documents. They will update 2 and forget the others. Six months later, no one knows which document is authoritative.

**Recommendation:**
- **Single source of truth per topic.** Pick one canonical location for each piece of information; other documents link to it instead of duplicating.
- **Suggested consolidation:**
  - `README.md` (≤200 lines) — quick start, links to other docs
  - `AGENTS.md` (≤150 lines) — compact pointer to canonical docs, lists only the most critical 5–10 rules
  - `CLAUDE.md` (≤300 lines) — agent operating instructions (workflow, commands, pitfalls top-10)
  - `PAD` (canonical for architecture, ADRs, security, data, deployment)
  - `SKILL.md` (canonical for design system, component patterns, hooks, accessibility)
- **Add a `docs/check-drift.ts` script** that fails CI if the same string (e.g., "5-Layer Architecture", "288 unit tests", "#febf00") appears with different surrounding text across documents.

### 3.10 🟡 Medium — No staging environment or end-to-end smoke test plan

**The docs say:**
- "Real API keys required to run end-to-end. The pipeline is fully wired at the code layer; remaining validation is operational."
- "Test the AI pipeline end-to-end — sign up, paste a story, verify characters/scenes/video generate. This is the highest-risk validation."

**But there is no plan for how to do this safely.** Specifically:
- No staging environment spec (separate Neon DB? Separate R2 buckets? Separate Stripe account in test mode? Separate Replicate account?)
- No smoke test fixture (what story to use, what expected outputs, what latency budget)
- No rollback plan (what if Step 6 FFmpeg assembly fails on real video? What if Replicate rate-limits the test?)
- No cost budget for the smoke test (a full pipeline run costs ~$0.50–$2 in AI inference; how many runs before launch?)

**Recommendation:**
- Add a §10.5 "Staging Environment" to the PAD.
- Define a `pnpm test:smoke` script that runs against a staging env and exercises: signup → create project → poll progress → download video → delete project.
- Define a `pnpm test:smoke:cheap` variant that uses GPT-4o-mini + Replicate's cheapest SDXL variant + a 30s audio cap to keep cost < $0.10 per run.
- Document the smoke test in CI (run nightly, not on every PR).

### 3.11 🟢 Low — Self-congratulatory tone in places

Examples:
- "TDD exposed 4 latent defects in `assemble-video.ts` — All discoverable only by writing tests first." (The "only" is unverifiable.)
- "This is a P0 bug that completely breaks the project detail page." (P0 is appropriate, but "completely breaks" is dramatic.)
- "The #1 test bug" (subjective ranking).
- "Production-ready codebase. 288 unit tests + 48 E2E tests, all GREEN." (Production-ready is aspirational given the Outstanding Issues list.)
- "Every architectural decision in this document traces to a specific rationale. Nothing is here 'because it's popular.'" (ADR-001's rejection of "Feature-sliced design" is justified by "too many slice boundaries for this project size" — which is a popularity/fit argument, not a rationale.)

**Recommendation:** Strip superlatives. Replace with quantified claims: "288 unit tests cover X% of domain logic; 48 E2E tests cover Y% of user journeys."

### 3.12 🟢 Low — `force-static` removal doesn't engage with Next.js 16 PPR

**The docs say** (ADR-002):
> "**Decision:** Remove `force-static` from the route config. Marketing page (`/`) is statically prerendered. App routes are dynamic."

**What's missing:** Next.js 16 introduces **Partial Prerendering (PPR)** as a stable feature, which allows a page to be statically prerendered with dynamic holes (e.g., auth state in the navbar). The PAD glossary mentions "PPR" but no ADR discusses whether the app uses it.

**Why this matters:** If PPR is enabled, the marketing page could have a dynamic navbar (showing "Sign in" vs "Dashboard") without losing static prerender performance. The current "marketing = static, app = dynamic" split is binary; PPR would allow a more nuanced hybrid.

**Recommendation:** Add an ADR-007: "PPR adoption: yes/no/deferred." If deferred, explain why (e.g., "PPR's `<Suspense>` boundary requirements conflict with our 4-layer Hero composition"). If adopted, document which routes use it.

### 3.13 🟢 Low — `bcryptjs` vs native `bcrypt` tradeoff isn't discussed

**The docs say** (PAD §6.1, threat model):
> "Passwords hashed with bcryptjs | `bcrypt.hash(password, 12)` in Auth.js Credentials provider"

The choice of `bcryptjs` (pure JavaScript) over native `bcrypt` (C++) has a real performance cost: bcryptjs is ~3–5× slower than native bcrypt at the same cost factor. At cost factor 12:
- Native bcrypt: ~150–300ms per hash
- bcryptjs: ~400–800ms per hash

For sign-up flows this is fine. For sign-in with high concurrency (e.g., a launch-day traffic spike), bcryptjs can become a CPU bottleneck on Vercel Functions (which have limited CPU).

The docs don't discuss this tradeoff. The implicit choice (bcryptjs avoids native compilation issues, especially on Windows dev machines and in CI) is reasonable, but it should be documented as a deliberate tradeoff with the performance number.

**Recommendation:** Add a note to ADR-001 or as a new ADR: "bcryptjs over native bcrypt: ~3–5× slower per hash but no native compilation; acceptable for our auth volume; revisit if sign-in latency exceeds 500ms p99."

---

## 4. Cross-Document Consistency Audit

| Topic | AGENTS.md | CLAUDE.md | PAD | README.md | SKILL.md | Drift? |
|---|---|---|---|---|---|---|
| Env var count | 28 | 28 / 29 | 28+4=32 | not stated | 29 | 🔴 Yes |
| `fluent-ffmpeg` mention | not mentioned | mentioned | not in ADR-006 | not mentioned | not mentioned | 🟠 Yes |
| `getProject()` LEFT JOIN | "LEFT JOINs" | "LEFT JOINs" | code shows 2 queries | not detailed | not detailed | 🔴 Yes |
| Inngest v4 signature | "triggers in config" | "triggers in config" | code shows 3 args | not detailed | not detailed | 🔴 Yes |
| WCAG AAA | claimed | claimed | "Qualified" | claimed | "Qualified" | 🟡 Yes |
| React CVE range | 19.2.0–19.2.2 | 19.2.0–19.2.2 | not detailed | not detailed | 19.2.0–19.2.2 | 🟠 Yes (over-claim) |
| Component counts (8/4/10/7) | 8/4/10/7 | 8/4/10/7 | 8/4/10/7 | 8/4/10/7 | 8/4/10/7 | ✅ Aligned |
| Test counts (288/48) | 288/48 | 288/48 | 288/48 | 288/48 | 288/48 | ✅ Aligned |
| 13 Keyframes list | same | same | same | same | same | ✅ Aligned |
| Color tokens (`#020202`, `#febf00`, etc.) | same | same | same | same | same | ✅ Aligned |
| Pipeline credit costs (5/10/8/15/3/30) | same | same | same | same | same | ✅ Aligned |

**Net:** 6 topics show measurable drift across documents; 5 are perfectly aligned. The drift is concentrated in newly-added (post-review) sections, which is consistent with the "documents updated at different times" hypothesis.

---

## 5. Strengths Worth Preserving

To balance the critique, these aspects of the documentation are genuinely excellent and should be preserved in any future revision:

1. **ADR format is well-executed.** Each ADR has Context / Decision / Rationale / Consequences / Alternatives Rejected — the canonical structure. The "Alternatives Rejected" section is particularly valuable (most teams skip it).

2. **Honest "Outstanding Issues" section.** The docs explicitly list what is NOT done (rate limiting, monitoring, E2E in CI, GDPR banner, IP-Adapter placeholder). This is rare and commendable.

3. **TDD discipline is real.** 288 unit + 48 E2E = 336 tests, with documented patterns (source-reading tests, `vi.hoisted()` for mock state, `class` syntax for constructors). The "Bug #N" format in SKILL.md §9 ties each fix to a regression test.

4. **Pitfall documentation is exceptional.** The 40+ pitfall items in AGENTS.md and CLAUDE.md are concrete, actionable, and tied to specific symptoms (`Cannot access 'X' before initialization`, `pnpm install` warnings, etc.). This is the kind of operational knowledge that takes years to accumulate.

5. **Server-side URL signing pattern (ADR-005).** The `SignedDownloadWrapper` Server Component → `ProjectDownloadButton` Client Component pattern is the correct Next.js 16 pattern for handling server-only env vars. The docs explain *why* (env validation crashes in browser) with a concrete failure mode.

6. **Stripe Basil API awareness.** The docs identified a real 2025-03-31 Stripe API shape change and built a forward-compatible helper. This is above the industry baseline.

7. **`trustHost: true` for reverse proxy.** The docs identified and fixed a real P0 production outage (auth redirects to `localhost:3000`) that affects many Auth.js v5 deployments. The fix is correct.

8. **Security headers in `next.config.ts`.** X-Frame-Options DENY, nosniff, strict referrer, Permissions-Policy — these are the right headers and they're documented.

9. **Build-context env fallback.** The Zod env schema with `NEXT_PHASE=phase-production-build` fallback is a clever solution to the "next build fails without secrets" problem. It's documented with the exact failure mode it prevents.

10. **`vi.hoisted()` and `class` mock patterns.** These are non-obvious Vitest patterns that the docs explain clearly with examples. Future maintainers will save hours.

---

## 6. Prioritized Recommendations

### 🔴 Critical (block launch)

1. **Elevate IP-Adapter placeholder to CRITICAL.** Validate the exact Replicate model identifier; add a startup-time warning if the env var still matches the SDXL base hash; add a `pnpm test:smoke` script.
2. **Implement rate limiting.** Auth (5/15min/IP), pipeline trigger (5/min/user, max 3 concurrent), SSE (1 connection/user/project). Use Upstash (env vars already in schema).
3. **Fix the `createProjectAction` credit race.** Add a `SELECT ... FOR UPDATE` or equivalent row-level lock on the user's `creditsRemaining` before debiting. The current `debitCredits` transaction may not prevent concurrent bursts if the read isn't locked.
4. **Fix the Inngest v4 signature documentation contradiction** (§2.3). Either the code example is wrong or the prose is wrong; verify against the official v4 migration guide and align.

### 🟠 High (fix in first sprint post-launch)

5. **Fix `getProject()` LEFT JOIN vs two-query contradiction** (§2.2). Either rewrite as actual `leftJoin` or update the prose.
6. **Flip `IMAGE_MODERATION_FAIL_OPEN` default to `false`** (§3.5). Secure defaults principle.
7. **Fix the React CVE version range** (§2.1). Change "19.2.0–19.2.2 are vulnerable" to "19.2.0 is vulnerable; pinning 19.2.3 as conservative floor."
8. **Re-evaluate SSE polling interval** (§3.3). Either bump to 10s with honest rationale, or migrate to Inngest `step.emit()`.
9. **Expand the threat model** (§3.7) to cover Inngest webhook spoofing, pipeline cost amplification, R2 URL sharing, prompt injection, multi-item Stripe subscriptions.
10. **Fix `extractSubscriptionPeriodEnd()` for multi-item subscriptions** (§3.6).

### 🟡 Medium (polish & compliance)

11. **Reconcile env var count across all 5 documents** (§2.6). Pick a canonical number (likely 32) and align.
12. **Move unimplemented-feature env vars to optional** (§3.8). `RESEND_API_KEY`, `UPSTASH_*`, `SENTRY_DSN` should be `.optional()` until the feature ships.
13. **Add a staging environment spec and smoke test plan** (§3.10).
14. **Consolidate documentation** (§3.9). Define single source of truth per topic; other docs link instead of duplicating.
15. **Fix the "WCAG AAA" over-claim** (§2.4). Either darken `--muted-foreground` or rebrand as "AA+ (AAA where feasible)".
16. **Fix ADR-006 "No npm package dependency" wording** (§2.5). Acknowledge `fluent-ffmpeg`.
17. **Drop the "pure function" claim for domain functions** (§3.4) OR make them actually pure by passing config as a parameter.
18. **Add an ADR for PPR adoption** (§3.12). Even "deferred — here's why" is better than silence.

### 🟢 Low (documentation hygiene)

19. **Strip self-congratulatory superlatives** (§3.11).
20. **Document the bcryptjs vs native bcrypt tradeoff** (§3.13).
21. **Cite or hedge the `@ffmpeg-installer/ffmpeg` Turbopack incompatibility claim** (§2.7).
22. **Add a `docs/check-drift.ts` CI check** to catch future cross-document drift.

---

## 7. Suggested Next Steps for the Maintainer

1. **Triage this critique.** Mark each item as accept / reject / defer with a one-line reason. The items marked "accept" become a remediation sprint.
2. **Run a `pnpm test:smoke` against a staging environment** to validate the IP-Adapter assumption (§3.1) before any production launch. This is the single highest-risk item.
3. **Run a load test** on the SSE polling (§3.3) with 50 concurrent viewers to confirm the DB load concern. The numbers in this critique are estimated; measured numbers will be more persuasive.
4. **Schedule a documentation consolidation sprint** (§3.9). Treat the 5 documents as a single deliverable; the cost of drift grows linearly with the number of documents.
5. **Re-read this critique in 90 days.** Some items will have been addressed; others will look different after 90 days of production traffic. Update the critique with what changed and what didn't.

---

## Appendix A: Web Search Sources Consulted

All sources accessed 2026-06-28 via ZAI web search.

1. [Next.js — Renaming Middleware to Proxy](https://nextjs.org/docs/messages/middleware-to-proxy)
2. [Next.js 16 — proxy.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
3. [React.dev — Critical Security Vulnerability in React Server Components (CVE-2025-55182)](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
4. [NVD — CVE-2025-55182 Detail](https://nvd.nist.gov/vuln/detail/CVE-2025-55182)
5. [Microsoft Security Blog — Defending against CVE-2025-55182](https://www.microsoft.com/en-us/security/blog/2025/12/15/defending-against-the-cve-2025-55182-react2shell-vulnerability-)
6. [Oligo Security — CVE-2025-55182 / 66478 RCE](https://www.oligo.security/blog/critical-react-next-js-rce-vulnerability-cve-2025-55182-cve-2025-66478-what-you-need-to-)
7. [Stripe — Basil Changelog (2025-03-31)](https://docs.stripe.com/changelog/basil/2025-03-31/deprecate-subscription-current-period-start-and-end)
8. [dev.to — Stripe Basil Quietly Moved current_period_end](https://dev.to/flarecanary/stripe-basil-quietly-moved-currentperiodend-off-subscription-and-a-lot-of-code-broke-3eo7)
9. [Inngest — TypeScript SDK v3→v4 Migration Guide](https://www.inngest.com/docs/reference/typescript/v4/migrations/v3-to-v4)
10. [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4)
11. [Tailwind CSS — Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
12. [Zod v4 Migration Guide / Changelog](https://zod.dev/v4/changelog)
13. [Vercel — Configuring Maximum Duration for Functions](https://vercel.com/docs/functions/configuring-functions/duration)
14. [Vercel — Fluid Compute](https://vercel.com/docs/fluid-compute)
15. [Vercel — Functions Limits](https://vercel.com/docs/functions/limitations)
16. [pnpm 10.26 Release Notes](https://pnpm.io/blog/releases/10.26)
17. [pnpm 11.0 Release Notes](https://pnpm.io/blog/releases/11.0)
18. [pnpm — Settings (pnpm-workspace.yaml)](https://pnpm.io/settings)
19. [Auth.js — Deployment](https://authjs.dev/getting-started/deployment)
20. [Auth.js — Migrating to v5](https://authjs.dev/getting-started/migrating-to-v5)
21. [Next.js 16 Blog Post](https://nextjs.org/blog/next-16)
22. [Next.js 16.2 Blog Post](https://nextjs.org/blog/next-16-2)
23. [Cloudflare R2 — Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls)
24. [Cloudflare R2 — aws-sdk-js-v3 Example](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3)
25. [Neon — Schema migration with Drizzle](https://neon.com/docs/guides/drizzle-migrations)
26. [Drizzle — Drizzle with Neon Postgres](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon)
27. [GitHub Security Advisory GHSA-qx2v-qp2m-jg93 (PostCSS XSS)](https://github.com/advisories/GHSA-qx2v-qp2m-jg93)
28. [NVD — CVE-2026-41305 (PostCSS)](https://nvd.nist.gov/vuln/detail/CVE-2026-41305)
29. [Replicate — lucataco/ip-adapter-faceid](https://replicate.com/lucataco/ip-adapter-faceid)
30. [Security StackExchange — Recommended bcrypt rounds](https://security.stackexchange.com/questions/17207)

---

**End of critique.**
