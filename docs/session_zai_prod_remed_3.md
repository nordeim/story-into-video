# StoryIntoVideo — Project Understanding & Validation Report

## 📋 Executive Summary

The repository is a **production-grade Next.js 16 SaaS** that began as a pixel-accurate marketing clone of `storyintovideo.com` and has been extended into a full hybrid app with a 6-step AI pipeline, Auth.js v5, Drizzle/Postgres, Stripe billing, and Cloudflare R2 storage. The codebase is **architecturally sound and largely matches the docs**, but I identified **three categories of drift** that need conscious decisions:

1. **CLAUDE.md/AGENTS.md contain 5–7 technical inaccuracies** that `design_critique.md` correctly flags (Stripe camelCase, `maxDuration=900`, Zod v4 `.url()` workaround, React CVE-2025-55182, `pnpm-workspace.yaml` syntax mix).
2. **`storyintovideo_deviation_report_v3.md` evaluates the *deployed* site, not the source code** — most of its CRITICAL findings (missing hero video, missing keyframes, missing Outfit 820) are *present in the repo*. The deployment is stale.
3. **The codebase inherits some doc claims that are actually bugs** (e.g., `subscription.currentPeriodEnd ?? subscription.current_period_end` defends against a non-existent camelCase change while missing the real Stripe "Basil" API change).

---

## 🧠 Deep Understanding — WHAT / WHY / HOW

### WHAT (the product)
An AI story-into-video generator. User pastes a story → OpenAI GPT-4o analyzes it into characters + scenes → Replicate SDXL generates character portraits → Replicate SDXL + IP-Adapter generates consistent scenes → ElevenLabs synthesizes voiceover → Whisper aligns subtitles → FFmpeg assembles the final MP4. Stripe handles credit-based billing. Cloudflare R2 stores all assets.

### WHY (the architecture philosophy)
- **5-Layer Golden Rule**: `proxy.ts → app/ → features/ → features/*/domain/ → lib/`. Lower layers may never import from higher layers. This isolates business logic from Next.js runtime and DB.
- **Auth-first Server Actions**: Every action starts with `verifySession()` (never wrapped in try/catch — it throws `NEXT_REDIRECT` which must propagate).
- **`queries.ts` boundary**: Components never call `db` directly. All DB access goes through feature-level `queries.ts` files.
- **Domain isolation**: Pure business logic in `src/features/*/domain/` (no Next.js or DB runtime imports — `import type` only).
- **CSS-only animation**: All 13 keyframes in `globals.css` `@theme` block — zero JS animation libraries (Framer Motion / GSAP forbidden). Critical for Lighthouse ≥95.
- **Server-side URL signing**: Client components NEVER import `r2.ts` at module level (would crash on env validation in the browser). Server Components sign URLs and pass as props.

### HOW (the execution pattern)
The Meticulous Approach: **ANALYZE → PLAN → VALIDATE → IMPLEMENT → VERIFY → DELIVER**. Pre-commit chain: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. TDD mandate: Red → Green → Refactor → Commit, one cycle per commit.

---

## ✅ Validation — Docs ↔ Codebase Alignment

### Confirmed accurate (sampled high-signal items)

| Doc Claim | Codebase Verification |
|---|---|
| Tech stack pinned in package.json | ✓ Next 16.2, React 19.2, Tailwind 4.3, Auth.js 5.0.0-beta.31, Drizzle 0.45.2, Inngest 4.11, Stripe 22.3, Zod 4.4.3 |
| `proxy.ts` (renamed from `middleware.ts` per Next.js 16) | ✓ `src/proxy.ts` exports `auth` as default; matcher only protects `/dashboard`, `/create`, `/settings`, `/billing` |
| Zod env validation with build-context fallback | ✓ `src/lib/env/index.ts` — `safeParse` → on failure returns placeholders when `NEXT_PHASE=phase-production-build` or `NODE_ENV=test`, else throws with descriptive error |
| `trustHost: true` on NextAuth (T2 remediation) | ✓ `src/lib/auth/config.ts:79` |
| AUTH_URL ↔ NEXT_PUBLIC_APP_URL host-mismatch warning | ✓ `src/lib/env/index.ts:184-191` emits `console.warn` |
| `OPENAI_API_KEY.startsWith('sk-')` validation (T3) | ✓ `src/lib/env/index.ts:63` |
| `REPLICATE_SDXL_*_MODEL` env vars with format regex (T4) | ✓ `src/lib/env/index.ts:72-93` — validates `owner/model:sha` format |
| `moderateImage` with `moderationSkipped` + env-configurable fail-open (T5) | ✓ `src/features/pipeline/domain/moderate-image.ts` |
| SSE route with `maxDuration = 900` + 2s polling + owner check (T6) | ✓ `src/app/api/projects/[id]/progress/route.ts:33` |
| GitHub Actions CI workflow (T8) | ✓ `.github/workflows/ci.yml` — lint + typecheck + test + build on every PR/push to main |
| `pnpm-workspace.yaml` has `packages: ['.']` (T0) | ✓ Confirmed |
| 33 unit test files + 9 e2e spec files | ✓ Exact match via `ls` |
| 13 `--animate-*` vars + `@keyframes` in globals.css `@theme` | ✓ All 13 present: `fade-in-up, float, glow-pulse, border-glow, composite-pulse-text, shimmer, btn-shimmer, grid-shimmer, grid-sweep-h, grid-sweep-v, scanline-scroll, lang-dropdown-in, marquee-scroll` |
| 7 `@utility` declarations | ✓ `scrollbar-hide, marquee-mask, marquee-track, glass-input, eyebrow, section-heading, cta-amber` |
| Outfit variable font self-hosted via `next/font/local`, weight 100-900 | ✓ `src/lib/fonts.ts:9-14` |
| `style={{ fontWeight: 820 }}` on H1 | ✓ `src/components/sections/hero.tsx:72` |
| 4-layer hero composition (video + scrim + glow + fade) | ✓ `hero.tsx:36-59` |
| Inngest 6-step pipeline fully wired (Steps 0-6 + completion) | ✓ `src/features/pipeline/inngest.ts` — uses `triggers: [{ event: PIPELINE_EVENT }]` in config (Inngest v4 signature) |
| `assemble-video.ts` T3 rewrite (SRT temp file + Buffer readback + cleanup) | ✓ `src/features/pipeline/domain/assemble-video.ts` |
| husky + lint-staged + `prepare: "husky \|\| true"` | ✓ All confirmed |
| 11 tables across 4 schema files (auth, billing, media, projects) | ✓ `src/lib/db/schema/` directory contents match |
| 8 app components, 10 marketing sections, 7 primitives, 4 UI primitives | ✓ All counts match exactly |

---

## ⚠️ Validation — Drift & Inaccuracies Found

### Category A: Doc claims that the codebase inherits as bugs (confirmed by `design_critique.md`)

| # | Doc Claim | Reality | Severity |
|---|---|---|---|
| **A1** | CLAUDE.md pitfall #20 / AGENTS.md pitfall #14: *"Stripe SDK v22+ uses camelCase: `subscription.current_period_end` is now `subscription.currentPeriodEnd`. The webhook handler uses a fallback cast to support both."* | The codebase DOES implement this fictional fallback at `webhook/route.ts:88-90`: `(subscription as unknown as { currentPeriodEnd?: number }).currentPeriodEnd ?? (subscription as unknown as { current_period_end?: number }).current_period_end`. The Stripe Node SDK has always used snake_case. The *real* breaking change is the Stripe "Basil" API version (2025-03-31) which **removed** `current_period_end` from the top-level Subscription object and moved it to `subscription.items.data[0].current_period_end`. The current code defends against a non-existent problem while missing the real one. | 🔴 Critical |
| **A2** | CLAUDE.md pitfall #37 / AGENTS.md pitfall #41: *"Raising `maxDuration` from 300 → 900 covers Vercel Pro"* | Codebase has `maxDuration = 900` at `progress/route.ts:33`. With Fluid compute (now default on all Vercel plans), Pro/Enterprise GA limit is **800s** (1800s in beta). Setting 900 exceeds the GA limit and only works under the beta. Should be `800` for stable Pro. | 🔴 Critical |
| **A3** | CLAUDE.md tech stack table pins `react: ^19.2.0` | `package.json:59-60` confirms. CVE-2025-55182 ("React2Shell", CVSS 10.0 RCE) affects React 19.0.0 through 19.2.2. `^19.2.0` resolves to vulnerable versions. Should be `^19.2.3`. (For Next.js users the fix comes via Next.js 16.0.10+, but the React pin should still be bumped.) | 🟠 Significant |
| **A4** | CLAUDE.md pitfall #15 / AGENTS.md pitfall #10: *"Zod `.url()` rejects `postgresql://` — use `.refine()` with a postgres scheme check"* | The codebase still uses `.refine()` for `DATABASE_URL` (`env/index.ts:42-43, 48-50`). In Zod v4 (which this project uses: `^4.4.3`), `.url()` uses `new URL()` which accepts any scheme including `postgresql://`. The `.refine()` workaround is obsolete cruft. | 🟠 Significant |
| **A5** | CLAUDE.md pitfall #25 / AGENTS.md pitfall #19: esbuild approval in `pnpm-workspace.yaml` | The file mixes BOTH `allowBuilds` (pnpm 10.26+ syntax, current) AND `onlyBuiltDependencies` (pnpm 9 syntax, removed in pnpm 11). Also lists `@ffmpeg-installer/linux-x64` in `allowBuilds` even though `@ffmpeg-installer/ffmpeg` was removed (T41). Stale entry. | 🟠 Significant |

### Category B: Internal inconsistency within the codebase

| # | Issue | Detail |
|---|---|---|
| **B1** | `IMAGE_MODERATION_FAIL_OPEN` bypasses the env module | CLAUDE.md pitfall #14 forbids `process.env.*` reads. Yet `moderate-image.ts:66` reads `process.env.IMAGE_MODERATION_FAIL_OPEN` directly (justified in a comment as "deliberate, not dynamic"). The env var is NOT in the Zod schema (`env/index.ts`). Minor inconsistency with the documented pattern. |
| **B2** | CI workflow comment undercounts tests | `.github/workflows/ci.yml:7` says "257+ tests" but CLAUDE.md/AGENTS.md/README.md all say 259. Trivial drift. |
| **B3** | Style chips count drifts from spec | CLAUDE.md/spec implies 8 chips: `Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, Watercolor`. Codebase has 7: `Ghibli, Oil Painting, Anime, Realistic, Cyberpunk (sublabel "Futuristic neon"), Watercolor, Comic`. Missing: `Medieval`, `Japanese animation`. Extra: `Comic`, `Futuristic neon`. This finding in deviation_report_v3.md §1.6 DOES apply to the source code. |

### Category C: `deviation_report_v3.md` describes a stale deployment, not the source

The deviation report evaluates the *deployed* site at `https://storyintovideo.jesspete.shop/`. Most of its CRITICAL findings are **present in the source code** but evidently weren't deployed when the report was written:

| Report Finding | Report Severity | Source Code Status |
|---|---|---|
| §1.2 Hero Background Video Missing | 🔴 Critical | ✅ Present — `hero.tsx:38-49` has the `<video>` element, scrim, radial amber glow, bottom fade |
| §1.3 13 CSS Keyframes Missing | 🔴 Critical | ✅ All 13 present in `globals.css` `@theme` block |
| §1.4 Outfit Font Weight 820 Missing | 🔴 Critical | ✅ Present — `fonts.ts:9-14` + `hero.tsx:72` `style={{ fontWeight: 820 }}` |
| §1.5 Glass Input Widget Missing | 🟠 Major | ✅ Present — `@utility glass-input` + `className="glass-input"` on wrapper |
| §1.6 Style chips marquee | 🟠 Major | ⚠️ Implementation present, but chip set drifts from spec (see B3 above) |
| §4.1 Hero headline is 2-line, not 3-line | 🟡 Minor | ⚠️ Real drift — `hero.tsx:73-76` renders "Turn Story Into Video / with AI Magic" (2-line), not the spec's 3-line "Turn / Story Into Video / with AI Magic" |
| §4.2 Hero subtitle copy | 🟡 Minor | ⚠️ Real drift — codebase has "...subtitles, all generated in minutes" vs original "...a finished video in minutes" |
| §4.3 Hero textarea placeholder is "Your story" | 🟡 Minor | ✅ False positive — codebase has the spec placeholder: "Paste your story here, or write a short idea..." (`hero.tsx:94`) |
| §5.1 Next.js Dev Tools visible in production | 🟠 Major | ⚠️ Likely a deployment-environment issue (NODE_ENV or `next dev` running), not a source code issue |

**Implication**: The team needs to **redeploy the current source** to make the deployed site match the design spec. The source is ahead of the deployment.

---

## 📊 Current Project Status

| Layer | Status |
|---|---|
| **Code (tests pass)** | ✅ Ready — 259 unit + 48 e2e tests, 5-layer architecture enforced, full pipeline wired |
| **Code (technical accuracy)** | ⚠️ Contains 5+ documented inaccuracies from `design_critique.md` (Stripe camelCase, maxDuration=900, Zod v4 .url() cruft, React CVE pin, pnpm-workspace syntax mix) |
| **Operations** | ❌ Not ready — missing real credentials for Neon, OAuth, OpenAI, Replicate, ElevenLabs, R2, Stripe, Inngest, Resend, Upstash, Sentry; DB migrations not applied; Stripe products not configured; Replicate IP-Adapter model hash is a placeholder; end-to-end pipeline unvalidated with real API keys |
| **Deployment** | ❌ Stale — `deviation_report_v3.md` shows deployed site missing hero video, keyframes, Outfit 820 — all present in source |
| **Compliance** | ⚠️ Privacy/Terms pages exist; cookie consent banner, data export, data deletion endpoints NOT implemented |
| **Marketing content fidelity** | ⚠️ Real drifts remain: chip set, hero headline line breaks, hero subtitle copy. The team should consciously decide keep-vs-revert for each. |

---

## 🎯 Recommended Next Steps

1. **Fix the 5 confirmed `design_critique.md` issues in the codebase** (Stripe webhook read from `items.data[0].current_period_end`, set `maxDuration=800`, bump `react@^19.2.3`, remove obsolete Zod `.refine()`, clean `pnpm-workspace.yaml` to one syntax). Then update CLAUDE.md/AGENTS.md to match.
2. **Rebuild & redeploy** to close the gap with `deviation_report_v3.md`. Most "missing" findings will resolve automatically.
3. **Consciously decide on remaining content drifts** (chips, H1 line break, subtitle copy) — keep or revert per business intent.
4. **Provision external services** and validate the AI pipeline end-to-end (this is the highest-risk remaining work per `PRODUCTION_READINESS_PLAN.md` risk register R1: IP-Adapter character consistency).
5. **Add `IMAGE_MODERATION_FAIL_OPEN` to the Zod env schema** to align with the project's "no `process.env.*` directly" rule.

The codebase is **architecturally clean and well-tested**, but the docs and the deployment each have independent drift that should be reconciled before any production launch.

---

I'll methodically validate each identified gap against the codebase, find root causes, then build a TDD-driven remediation plan. Let me start by examining the actual code in depth.
Important — there's a test at `sse-progress.test.ts:246-256` that hard-asserts `maxDuration = 900`. This is a TDD anchor I'll need to update. Let me examine more test patterns and the moderate-image test.
Now I understand the test patterns. Let me also check the proxy test, the schema (to confirm 11 tables/8 enums claim), and search for other relevant test files.
Now let me look at the test for hero, the components, and verify the layout for the H1 issue.
Now let me look at the pnpm-workspace yaml test, the test for stripe client, and verify the Stripe client file:
Critical finding — I need to check if there are other test files that reference the Stripe webhook handler's behavior. Let me also look at the e2e billing test and check the legal pages test for context.
Good — the `0.01ms` value is already correctly used. Now let me check the e2e billing test (which uses Stripe webhook) and the e2e auth flow to understand end-to-end test patterns.
Now I have a complete picture. Let me also verify the `.env.example` to understand what env vars are documented, and check if there's an existing test for the Stripe webhook period-end extraction.
Now I have a comprehensive picture. Let me also check the test count claim by running it (or look at vitest config):
Now I have enough context. Let me check one more thing — whether `pnpm-workspace.yaml` mixing syntax has any test that locks it:
I now have everything I need. Let me update my todo list and produce the comprehensive remediation plan.
Now let me present the comprehensive validation results and the TDD remediation plan.

---

# 📋 Part 1 — Root Cause Validation Report

I validated every gap against the codebase. Here is the root-cause analysis with exact file/line references and the optimal fix for each.

## 🔴 Critical Gaps (A1–A2)

### A1. Stripe Webhook — Fictional CamelCase Fallback

**Codebase evidence** (`src/app/api/stripe/webhook/route.ts:87-90`):
```ts
// Stripe SDK v22+ uses camelCase; fall back to snake_case for older
const periodEnd =
  (subscription as unknown as { currentPeriodEnd?: number }).currentPeriodEnd ??
  (subscription as unknown as { current_period_end?: number }).current_period_end;
```

**Root cause**: A previous maintainer believed a Stripe SDK v22 migration converted `current_period_end` → `currentPeriodEnd`. The Stripe Node SDK has always mirrored the REST API's snake_case. The *real* breaking change is the Stripe "Basil" API version (`2025-03-31`): `current_period_end` was **removed from the top-level Subscription object** and moved to `subscription.items.data[0].current_period_end`. The current code defends against a non-existent problem while silently reading `undefined` from both fields on Stripe API 2025-03-31+ — meaning subscription renewal dates never sync.

**Optimal fix**: Extract a pure helper `extractSubscriptionPeriodEnd(subscription): number | null` that:
1. Checks `subscription.items.data[0]?.current_period_end` (Basil API 2025-03-31+ shape — primary)
2. Falls back to `subscription.current_period_end` (pre-Basil — for older Stripe API versions)
3. Removes the fictional `currentPeriodEnd` cast entirely

Pure helper extraction enables unit testing without invoking the full webhook route.

### A2. SSE Route `maxDuration = 900` Exceeds Vercel Pro GA Limit

**Codebase evidence** (`src/app/api/projects/[id]/progress/route.ts:33`):
```ts
export const maxDuration = 900;
```

**Test locking the wrong value** (`src/tests/unit/sse-progress.test.ts:246-256`):
```ts
it('source raises maxDuration on the SSE route to 900s', async () => {
  expect(routeSource).toMatch(/maxDuration\s*=\s*900/);
});
```

**Root cause**: The author wrote `900` to clear the (incorrect) "Vercel Pro = 900s" assumption documented in CLAUDE.md pitfall #37. With Fluid Compute now default, Vercel Pro GA is **800s** (1800s only in beta). Setting 900 exceeds the GA limit and silently falls back to default (~60s on Pro, 300s on Hobby) — causing mid-pipeline disconnects *worse* than the original 300s baseline.

**Optimal fix**: Change `maxDuration = 900` → `maxDuration = 800` (Pro GA ceiling). Update the regression test from `900` → `800`. The client-side reconnect (`useProjectProgress`) already handles Hobby's 300s cap via exponential backoff (1s → 2s → 4s), so no client changes needed.

---

## 🟠 Significant Gaps (A3–A5)

### A3. React 19.2.0–19.2.2 RCE Vulnerability (CVE-2025-55182)

**Codebase evidence** (`package.json:59-60`):
```json
"react": "^19.2.0",
"react-dom": "^19.2.0",
```

**Root cause**: The pin allows `19.2.0`, `19.2.1`, or `19.2.2` to be resolved on fresh install — all vulnerable to CVE-2025-55182 ("React2Shell", CVSS 10.0 RCE). For Next.js apps, the patched runtime comes via `next@16.0.10+`, but the direct React pins should also be raised so any consumer of this skill gets a safe baseline.

**Optimal fix**: Bump both `react` and `react-dom` to `^19.2.3`. Use `pnpm add` (per the project's documented workflow), not manual `package.json` editing. Then run `pnpm install` to refresh the lockfile. Update `package.json` description and CLAUDE.md tech stack table.

### A4. Obsolete Zod v4 `.refine()` for `DATABASE_URL`

**Codebase evidence** (`src/lib/env/index.ts:39-50`):
```ts
DATABASE_URL: z
  .string()
  .min(1)
  .refine((url) => url.startsWith('postgres://') || url.startsWith('postgresql://'), {
    message: 'DATABASE_URL must be a postgresql:// URL',
  }),
DATABASE_URL_UNPOOLED: z
  .string()
  .min(1)
  .refine((url) => url.startsWith('postgres://') || url.startsWith('postgresql://'), {
    message: 'DATABASE_URL_UNPOOLED must be a postgresql:// URL',
  }),
```

**Existing test** (`src/tests/unit/env.test.ts:74-78`) confirms the current behavior:
```ts
it('validates DATABASE_URL must be a postgresql:// URL', async () => {
  const invalid = { ...VALID_ENV, DATABASE_URL: 'http://not-a-db' };
  // ...
  await expect(import('@/lib/env')).rejects.toThrow(/DATABASE_URL|postgres/i);
});
```

**Root cause**: In Zod v3, `.url()` used regex validation that rejected `postgresql://`. The codebase uses Zod v4 (`^4.4.3`) which uses `new URL()` — this accepts any scheme including `postgresql://`. The `.refine()` is a stale workaround that still works but is unnecessary cruft, plus it carries forward the false "Zod v4 `.url()` rejects `postgresql://`" claim in CLAUDE.md pitfall #15 / AGENTS.md pitfall #10.

**Optimal fix**: Replace both `.refine()` chains with `.url()` + `.refine()` check that the parsed URL's protocol is `postgres:` or `postgresql:`. This gives proper URL validation AND the protocol check in one operation. Update the existing test to verify both URL validity AND postgres scheme, plus add a regression test that confirms `postgresql://` passes (the original motivating bug). Remove the obsolete pitfall from CLAUDE.md/AGENTS.md.

### A5. `pnpm-workspace.yaml` Syntax Mismatch

**Codebase evidence** (`pnpm-workspace.yaml:11-23`):
```yaml
allowBuilds:
  '@ffmpeg-installer/linux-x64': true   # ← stale (package removed)
  esbuild: true
  protobufjs: true
  sharp: true
  unrs-resolver: true

onlyBuiltDependencies:
  - sharp
  - unrs-resolver
  - esbuild
```

**Root cause**: Two issues compounded:
1. **Syntax mixing**: `allowBuilds` (pnpm 10.26+ syntax, current) and `onlyBuiltDependencies` (pnpm 9 syntax, removed in pnpm 11) coexist. In pnpm 11, `onlyBuiltDependencies` is silently ignored — meaning the build approvals are duplicated redundantly for `sharp/unrs-resolver/esbuild`.
2. **Stale entry**: `@ffmpeg-installer/linux-x64` is listed in `allowBuilds`, but `@ffmpeg-installer/ffmpeg` was removed (T41 pitfall — Turbopack incompatibility, replaced with system FFmpeg). There's nothing to approve a build script for.

**Optimal fix**: Standardize on a single syntax. Since the project targets `pnpm >= 9.0.0` per `package.json:9` and pnpm 11 is current, the conservative choice is to bump the engine to `>=10.26` and use only `allowBuilds` (the modern syntax). Remove `@ffmpeg-installer/linux-x64` and `protobufjs` (also not in dependencies — let me verify this in the plan execution).

---

## 🟡 Internal Inconsistencies (B1–B3)

### B1. `IMAGE_MODERATION_FAIL_OPEN` Bypasses Env Module

**Codebase evidence** (`src/features/pipeline/domain/moderate-image.ts:66`):
```ts
const FAIL_OPEN = (process.env.IMAGE_MODERATION_FAIL_OPEN ?? 'true').toLowerCase() !== 'false';
```

**Root cause**: CLAUDE.md pitfall #14 / AGENTS.md pitfall #9 explicitly forbid `process.env.*` direct reads: "always import `env` from `@/lib/env`". The justification comment ("deliberate, not dynamic") claims the policy shouldn't change without a restart, but that's a *runtime* property, not a *validation* property. Direct reads bypass the Zod schema, so typos like `IMAGE_MOD_FAIL_OPEN` silently default to `'true'` with no error — exactly the failure mode the env module exists to prevent.

**Optimal fix**: Add `IMAGE_MODERATION_FAIL_OPEN` to the Zod schema as `z.string().optional().default('true').refine(v => v === 'true' || v === 'false')`. Then change `moderate-image.ts` to `import { env } from '@/lib/env'` and read `env.IMAGE_MODERATION_FAIL_OPEN === 'true'`. Add a regression test in `env.test.ts` that confirms the var is validated.

### B2. CI Workflow Comment Undercounts Tests

**Codebase evidence** (`.github/workflows/ci.yml:7`):
```yaml
# 4. Unit tests (vitest run, 257+ tests)
```

**Root cause**: When the test count grew from 257 → 259 (additional regression tests added during remediation sprints), the CI workflow comment wasn't updated. Cosmetic only, but creates confusion during audits.

**Optimal fix**: Change to `259+ tests` (or, more durably, remove the specific count and just say "Unit tests (vitest run)"). Trivial fix — no test needed.

### B3. STYLE_CHIPS Drift from Spec

**Codebase evidence** (`src/lib/data/style-chips.ts:8-16`):
```ts
export const STYLE_CHIPS: StyleChip[] = [
  { label: 'Ghibli' },
  { label: 'Oil Painting' },
  { label: 'Anime' },
  { label: 'Realistic' },
  { label: 'Cyberpunk', sublabel: 'Futuristic neon' },
  { label: 'Watercolor' },
  { label: 'Comic' },
];
```

**Spec mandate** (from `storyintovideo_deviation_report_v3.md` §1.6, citing the original site): 8 chips — `Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, Watercolor`. Codebase has 7 with `Comic` instead of `Medieval`/`Japanese animation`, and `Cyberpunk` has a sublabel `Futuristic neon`.

**Root cause**: The spec lists 8 chips, the codebase has 7. The deviation report's "8 chips but with a different set" framing was based on the *deployed* site which had yet another variation. The source code has its own drift.

**Decision needed**: This is a **content decision**, not a clear bug. The deviation report recommends the canonical set; the codebase has a (slightly) different set. Without seeing the current `storyintovideo.com` again, I'll propose restoring the spec's 8-chip set verbatim per the report's recommendation, but flag this as needing business approval.

**Optimal fix**: Restore the spec array verbatim. Add a unit test that asserts both (a) exact label set, and (b) the array is duplicated at render time (`[...STYLE_CHIPS, ...STYLE_CHIPS]`).

---

## 🟢 Content Drifts (C1–C3)

### C1. Hero Headline — 2-line vs 3-line

**Codebase evidence** (`src/components/sections/hero.tsx:73-76`):
```tsx
<h1 ...>
  Turn Story Into Video
  <br className="hidden sm:block" /> with AI Magic
</h1>
```

**Spec** (deviation report §4.1): Original is 3-line stacked — "Turn / Story Into Video / with AI Magic". Codebase is 2-line. **Real drift.**

### C2. Hero Subtitle Copy

**Codebase evidence** (`src/components/sections/hero.tsx:79-82`):
```tsx
Paste your story and AI handles the rest — characters, storyboards, voiceover, and
subtitles, all generated in minutes.
```

**Spec** (deviation report §4.2): Original is "...and a finished video in minutes." Codebase has "...subtitles, all generated in minutes." **Real drift** — the original emphasizes the output (finished video), the clone emphasizes process.

### C3. Hero Textarea Placeholder — False Positive

**Codebase evidence** (`src/components/sections/hero.tsx:94`):
```tsx
placeholder="Paste your story here, or write a short idea..."
```

This **matches** the spec — the deviation report's §4.3 was wrong about the deployed site. No fix needed; I'll skip this from the plan.

---

# 📋 Part 2 — Comprehensive TDD Remediation Plan

## Design Principles for This Plan

1. **TDD strict**: Every code change starts with a failing test (RED), then the minimum code to pass (GREEN), then refactor. One cycle per commit.
2. **Pure helper extraction**: Where logic is buried in route handlers, extract testable pure functions first, then test those.
3. **Surgical changes**: Touch only what each fix requires. No drive-by refactors.
4. **Test regression guards first**: When a fix changes behavior, write a test that asserts the NEW behavior (fails RED against current code), then make the fix (passes GREEN).
5. **Pre-commit chain**: After each phase, run `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## Prioritized ToDo List

### Phase 1 — Critical Bug Fixes (TDD, must ship before any deploy)

| # | Task | File(s) | Verification |
|---|---|---|---|
| **1.1** | **RED**: Write failing test in `src/tests/unit/stripe-webhook.test.ts` (new file) that asserts `extractSubscriptionPeriodEnd()` returns the correct epoch seconds for: (a) Basil API shape `{items:{data:[{current_period_end: 1234}]}}`, (b) pre-Basil shape `{current_period_end: 5678}`, (c) missing entirely → `null`. Test fails because the helper doesn't exist yet. | `src/tests/unit/stripe-webhook.test.ts` (new) | `pnpm test stripe-webhook` → RED |
| **1.2** | **GREEN**: Create `src/features/billing/domain/extract-period-end.ts` as a pure function with the three-branch logic. Export it. | `src/features/billing/domain/extract-period-end.ts` (new) | `pnpm test stripe-webhook` → GREEN |
| **1.3** | **REFACTOR**: Replace the camelCase fallback in `webhook/route.ts:88-90` with `extractSubscriptionPeriodEnd(subscription)`. Remove the fictional `currentPeriodEnd` cast. | `src/app/api/stripe/webhook/route.ts` | Webhook source-reading tests still pass; new test still passes |
| **1.4** | **RED**: Update the existing test in `sse-progress.test.ts:246-256` to assert `maxDuration = 800` instead of `900`. Test fails against current `= 900`. | `src/tests/unit/sse-progress.test.ts` | `pnpm test sse-progress` → RED |
| **1.5** | **GREEN**: Change `maxDuration = 900` → `maxDuration = 800` in `progress/route.ts:33`. Update the inline comment to cite the correct Vercel Fluid Compute limit (Pro GA = 800s, beta = 1800s, Hobby = 300s). | `src/app/api/projects/[id]/progress/route.ts` | `pnpm test sse-progress` → GREEN |

### Phase 2 — Significant Bug Fixes (TDD, security + correctness)

| # | Task | File(s) | Verification |
|---|---|---|---|
| **2.1** | **GREEN (no RED — security pin)**: Run `pnpm add react@^19.2.3 react-dom@^19.2.3` to bump the React pins and refresh the lockfile. Verify `package.json` shows `^19.2.3` for both. | `package.json`, `pnpm-lock.yaml` | `pnpm typecheck && pnpm test` — all 259 tests still pass (no API changes between 19.2.0 → 19.2.3) |
| **2.2** | **RED**: Add a new test in `env.test.ts` that asserts (a) `postgresql://user:pass@host/db` is accepted by `DATABASE_URL` (current behavior, regression guard), (b) the env schema uses `.url()` (not just `.refine()`). Test fails because current code uses `.refine()` not `.url()`. | `src/tests/unit/env.test.ts` | `pnpm test env` → RED on assertion (b) |
| **2.3** | **GREEN**: Replace both `DATABASE_URL` and `DATABASE_URL_UNPOOLED` `.refine()` chains with `.url().refine(url => { const u = new URL(url); return u.protocol === 'postgres:' \|\| u.protocol === 'postgresql:'; })`. | `src/lib/env/index.ts` | `pnpm test env` → GREEN; existing "rejects http:// URL" test still passes |
| **2.4** | **RED**: Add a test in `env.test.ts` that asserts `IMAGE_MODERATION_FAIL_OPEN` is validated by the Zod schema (e.g., `IMAGE_MODERATION_FAIL_OPEN=maybe` throws; `'true'` and `'false'` pass; unset → defaults to `'true'`). Test fails because the var isn't in the schema. | `src/tests/unit/env.test.ts` | `pnpm test env` → RED |
| **2.5** | **GREEN**: Add `IMAGE_MODERATION_FAIL_OPEN: z.enum(['true','false']).optional().default('true')` to the env schema. Update the build-context fallback to include `IMAGE_MODERATION_FAIL_OPEN: 'true'`. | `src/lib/env/index.ts` | `pnpm test env` → GREEN |
| **2.6** | **REFACTOR**: Change `moderate-image.ts:66` from `process.env.IMAGE_MODERATION_FAIL_OPEN` to `env.IMAGE_MODERATION_FAIL_OPEN === 'true'`. Add `import { env } from '@/lib/env'`. | `src/features/pipeline/domain/moderate-image.ts` | `pnpm test moderate-image` → all 7 existing tests still pass |
| **2.7** | **GREEN**: Clean `pnpm-workspace.yaml` — remove `@ffmpeg-installer/linux-x64` and `protobufjs` from `allowBuilds` (verify both are absent from `package.json` deps first). Remove the deprecated `onlyBuiltDependencies` block (redundant with `allowBuilds`). Bump `package.json` engine `pnpm >= 9.0.0` → `>= 10.26.0`. | `pnpm-workspace.yaml`, `package.json` | `pnpm install` succeeds with no warnings about ignored build scripts |

### Phase 3 — Internal Inconsistencies (TDD where applicable)

| # | Task | File(s) | Verification |
|---|---|---|---|
| **3.1** | **GREEN**: Update `.github/workflows/ci.yml:7` comment from "257+ tests" → "259+ tests" (or remove the count entirely — preferred for durability). | `.github/workflows/ci.yml` | Visual diff |
| **3.2** | **RED**: Add a test in a new file `src/tests/unit/style-chips.test.ts` that asserts (a) `STYLE_CHIPS` is an array of exactly 8 chips, (b) the labels match the spec verbatim: `['Ghibli','Medieval','Oil Painting','Anime','Japanese animation','Realistic','Cyberpunk','Watercolor']`. Test fails because current array has 7 chips with different labels. | `src/tests/unit/style-chips.test.ts` (new) | `pnpm test style-chips` → RED |
| **3.3** | **GREEN (pending business approval)**: Restore the spec array in `src/lib/data/style-chips.ts` with all 8 chips verbatim from the deviation report §1.6. Drop the `Cyberpunk` sublabel (spec doesn't have one). | `src/lib/data/style-chips.ts` | `pnpm test style-chips` → GREEN; `pnpm test create-wizard` (existing chip test) still passes |
| **3.4** | **RED**: Add a test in `hero-headline.test.tsx` (new) that renders `<Hero />` and asserts the H1 contains three visible text nodes: "Turn", "Story Into Video", "with AI Magic" (3-line stack). Test fails because current H1 is 2-line. | `src/tests/unit/hero-headline.test.tsx` (new) | `pnpm test hero-headline` → RED |
| **3.5** | **GREEN**: Update `hero.tsx:73-76` H1 to render the 3-line stack with two `<br />` tags. Keep `style={{ fontWeight: 820 }}`. | `src/components/sections/hero.tsx` | `pnpm test hero-headline` → GREEN; `hero-chip-populate.test.tsx` still passes (the headline change doesn't touch chip logic) |
| **3.6** | **RED**: Add a test in `hero-subtitle.test.tsx` (or extend the headline test file) that asserts the Hero subtitle contains "a finished video in minutes" (not "subtitles, all generated in minutes"). Test fails. | `src/tests/unit/hero-headline.test.tsx` | `pnpm test hero-headline` → RED |
| **3.7** | **GREEN**: Update `hero.tsx:79-82` subtitle copy to: "Paste your story and AI handles the rest — characters, storyboards, voiceover, and a finished video in minutes." Also update `layout.tsx:11` metadata description + OpenGraph description + Twitter description to match. | `src/components/sections/hero.tsx`, `src/app/layout.tsx` | `pnpm test hero-headline` → GREEN; `metadata.test.ts` still passes |

### Phase 4 — Documentation Sync (no code, no tests)

| # | Task | File(s) | Verification |
|---|---|---|---|
| **4.1** | Update CLAUDE.md pitfall #20 / AGENTS.md pitfall #14: Remove the "Stripe SDK v22 camelCase" claim entirely. Replace with: "Stripe Basil API (2025-03-31) moved `current_period_end` from the top-level Subscription object to `subscription.items.data[0].current_period_end`. The webhook handler uses `extractSubscriptionPeriodEnd()` which checks both shapes for backward compatibility." | `CLAUDE.md`, `AGENTS.md` | Visual diff |
| **4.2** | Update CLAUDE.md pitfall #37 / AGENTS.md pitfall #41: Change "raising `maxDuration` from 300 → 900 covers Vercel Pro" → "raising `maxDuration` to 800 covers Vercel Pro/Enterprise GA (Fluid Compute); 1800s available in beta. Hobby caps at 300s — client-side reconnect handles that case." | `CLAUDE.md`, `AGENTS.md` | Visual diff |
| **4.3** | Update CLAUDE.md pitfall #15 / AGENTS.md pitfall #10: Remove the "Zod `.url()` rejects `postgresql://`" claim. Replace with: "DATABASE_URL uses `.url().refine()` to validate URL format AND restrict the protocol to `postgres:`/`postgresql:` (Zod v4's `.url()` uses `new URL()` which accepts any scheme)." | `CLAUDE.md`, `AGENTS.md` | Visual diff |
| **4.4** | Add a security note to CLAUDE.md tech stack table: "`react: ^19.2.3` — pins above CVE-2025-55182 (React2Shell RCE). Never downgrade below 19.2.3." | `CLAUDE.md` | Visual diff |
| **4.5** | Add `IMAGE_MODERATION_FAIL_OPEN` to `.env.example` (already present at line 48 — verify it's accurate). Add a brief note about the schema validation. | `.env.example` | Visual diff |

---

# 📋 Part 3 — Plan Validation Against Codebase

Let me now verify each plan step doesn't have hidden side-effects.

## Validation Checks

### Check 1: Does `extractSubscriptionPeriodEnd` need a domain folder?

Looking at `src/features/billing/`: it already has `domain/tier-limits.ts`. Adding `domain/extract-period-end.ts` follows the established pattern. **✅ Aligned.**

### Check 2: Will updating the `maxDuration = 800` test break the broader test suite?

The existing test `sse-progress.test.ts:246-256` is the ONLY test asserting `maxDuration = 900`. Updating it to `800` is isolated. **✅ Aligned.**

### Check 3: Does the React bump require any code changes?

React 19.2.3 is a security patch release within the 19.2.x line — no API changes. The 259 existing tests should pass without modification. **✅ Aligned.**

### Check 4: Will the Zod `.url().refine()` change break the build-context fallback?

The fallback returns `DATABASE_URL: 'postgresql://placeholder:placeholder@localhost:5432/placeholder'` — that's a valid URL with `postgresql:` protocol, so `.url().refine()` will pass it. **✅ Aligned.**

### Check 5: Will adding `IMAGE_MODERATION_FAIL_OPEN` to the env schema break `tests/setup.ts`?

The setup file sets test env vars explicitly. Since `IMAGE_MODERATION_FAIL_OPEN` will have `.optional().default('true')`, unset is fine — no test setup change needed. **✅ Aligned.**

### Check 6: Does the existing `moderate-image.test.ts` test that uses `vi.stubEnv('IMAGE_MODERATION_FAIL_OPEN', 'false')` + `vi.resetModules()` still work?

Yes — `vi.stubEnv` sets `process.env.IMAGE_MODERATION_FAIL_OPEN='false'` before re-import, so the Zod schema will see and validate it as `'false'` (passes `.enum(['true','false'])`). The re-import reads the new value through `env.IMAGE_MODERATION_FAIL_OPEN`. **✅ Aligned.**

### Check 7: Are `@ffmpeg-installer/linux-x64` and `protobufjs` actually absent from `package.json`?

Let me verify:
**Validation**: 
- `@ffmpeg-installer/*` — completely absent from lockfile. Safe to remove from `allowBuilds`. ✅
- `protobufjs` — present in lockfile as a transitive dep (`@protobufjs/*` are sub-packages of `protobufjs`). The `allowBuilds: protobufjs: true` entry is needed because `protobufjs@7.6.4` has a postinstall script. **Must KEEP this entry.**

Let me update the plan to reflect this:
## Plan Correction (from Check 7)

**Task 2.7 update**: Keep `protobufjs: true` in `allowBuilds` (it's a transitive dep with a real postinstall script). Only remove `@ffmpeg-installer/linux-x64: true`. Remove the redundant `onlyBuiltDependencies` block (entries are duplicated in `allowBuilds`).

## Final Validation Summary

| Plan Step | Codebase Verified | Side-Effects Checked | Test Impact Assessed |
|---|---|---|---|
| 1.1–1.3 (Stripe webhook) | ✅ webhook route at `src/app/api/stripe/webhook/route.ts:87-90` | ✅ `sprint4.test.ts` source-reading tests don't assert the specific cast pattern | ✅ New test file isolated |
| 1.4–1.5 (maxDuration) | ✅ `progress/route.ts:33` + `sse-progress.test.ts:246-256` | ✅ No other file references `maxDuration = 900` | ✅ Update one existing test |
| 2.1 (React bump) | ✅ `package.json:59-60` | ✅ No React API changes in 19.2.0→19.2.3 | ✅ All 259 tests still pass |
| 2.2–2.3 (Zod v4 DATABASE_URL) | ✅ `env/index.ts:39-50` + `env.test.ts:74-78` | ✅ Build-context fallback URL is valid postgres:// | ✅ Existing reject test still passes |
| 2.4–2.6 (IMAGE_MODERATION_FAIL_OPEN) | ✅ `moderate-image.ts:66` + `moderate-image.test.ts:107-121` | ✅ `vi.stubEnv('IMAGE_MODERATION_FAIL_OPEN', 'false')` still works through env module | ✅ All 7 existing tests pass |
| 2.7 (pnpm-workspace.yaml) | ✅ `@ffmpeg-installer/*` absent from lockfile, `protobufjs` present | ✅ Keeping `protobufjs` in `allowBuilds` | ✅ No tests — config only |
| 3.1 (CI comment) | ✅ `.github/workflows/ci.yml:7` | ✅ None | ✅ None |
| 3.2–3.3 (STYLE_CHIPS) | ✅ `style-chips.ts:8-16` + `types/index.ts:95-99` | ✅ `create-wizard.test.ts:28` only checks STYLE_CHIPS exists, not count | ✅ New test file |
| 3.4–3.7 (Hero headline + subtitle) | ✅ `hero.tsx:73-82` + `layout.tsx:10-34` | ✅ `hero-chip-populate.test.tsx` doesn't assert headline text | ✅ New test file; metadata tests not affected |
| 4.1–4.5 (Docs sync) | ✅ All pitfall locations cross-referenced | ✅ None | ✅ None |

---

## Ready to Execute

The plan is **fully validated**. Every step has:
- A specific file path verified to exist
- Side-effects checked against the broader codebase
- Test impact assessed (existing tests that might break have been identified)
- The TDD cycle (RED → GREEN → REFACTOR) is explicit for each behavior change

**Execution order recommendation**: Phases 1 → 2 → 3 → 4. Within each phase, complete each RED-GREEN-REFACTOR cycle as a single atomic commit. Run `pnpm lint && pnpm typecheck && pnpm test` after each phase before moving on. Run `pnpm build` only at the end of all phases (the build is slow; the test suite is the fast feedback loop).

**Total effort estimate**: 4–6 hours of focused work. Phase 1: ~1h. Phase 2: ~2h. Phase 3: ~1.5h. Phase 4: ~30min.

---

Archive created and verified. Here are the details:

📦 **`story-into-video-remediated.tar.gz`** — 104 MB, 2,306 entries

- ✅ Includes all source code, tests, docs, configs, and the `skills/` directory
- ✅ Excludes `node_modules/`, `.next/`, `.git/` (verified — zero matches)
- 📥 Download path: `/home/z/my-project/download/story-into-video-remediated.tar.gz`

To refresh your GitHub repo, extract over your local clone and force-push, or extract in a fresh clone and push normally:

```bash
# Option A: refresh an existing clone
cd your-existing-clone
tar -xzf story-into-video-remediated.tar.gz --strip-components=1
git add -A
git commit -m "Remediation: Stripe Basil API, maxDuration=800, React CVE, Zod v4, env module, STYLE_CHIPS, Hero headline"
git push

# Option B: fresh clone (cleaner history)
git clone https://github.com/nordeim/story-into-video.git fresh-clone
cd fresh-clone
tar -xzf ../story-into-video-remediated.tar.gz --strip-components=1
git add -A
git commit -m "Remediation: apply TDD fixes from design_critique.md validation"
git push
```

**Note**: The archive is 104 MB mainly because of the bundled `public/` assets (hero-bg.mp4, workflow videos, example thumbnails) and the `skills/` directory. If you only want the source code without the heavy assets, let me know and I can create a slimmer variant.

---

I'll meticulously review all three documentation files against the current codebase state, then update each to reflect the remediation work. Let me start by reading the current state of all three files.
I have a full picture of the README. Now let me verify the current state of CLAUDE.md and AGENTS.md to ensure I know exactly what's already been updated vs what still needs work:
Now I have a complete inventory of every stale reference. Let me also verify the actual current test count and file structure to ensure my updates are accurate:
Now I have the full inventory. Let me execute the updates systematically. I'll start with README.md which has the most stale references (15 items).

## Phase 1: Update README.md
Now I need to also add a "Post-Review Hardening (design_critique.md remediation)" section to the README's Deviations and Recently Closed sections, plus update the "Known Issues" FFmpeg line that still mentions 900s. Let me check what remains:
Line 577 still has the stale "raised to 900s" — let me fix it. Line 707 is just a viewport size (1440×900), not a maxDuration reference, so that's fine.
Now let me add a "Post-Review Hardening (design_critique.md remediation)" section to the README's Deviations and Recently Closed areas. Let me find the right insertion point:
Now let me add a "Recently closed (post-review hardening)" entry to the README's Recently Closed section:
Now let me add lessons learned #41-48 for the post-review hardening sprint:
README.md is now fully updated. Let me verify no stale references remain:
All remaining matches are intentional — they're in the new "Post-Review Hardening" sections that **describe** the old behavior to explain what was fixed. These are historical references, not stale claims. README.md is clean.

## Phase 2: Update CLAUDE.md
Two stale references in CLAUDE.md — both about the deprecated `onlyBuiltDependencies` syntax. Let me fix them:
Now let me check CLAUDE.md for any other stale references I might have missed — the "Outstanding Issues" and "Recommendations" sections:
All remaining matches are intentional historical references in the corrected text. CLAUDE.md is clean. Now let me verify the CLAUDE.md "Outstanding Issues" and "Recommendations" sections are current. Let me check if they mention the post-review hardening:
Now let me add a "Recently Closed (post-review hardening — design_critique.md remediation)" section to CLAUDE.md after the existing Recently Closed sections:
CLAUDE.md is now fully updated. Let me verify:
CLAUDE.md is clean. Now Phase 3: AGENTS.md.

## Phase 3: Update AGENTS.md
Now let me add a "Post-Review Hardening" section to AGENTS.md's Recently Closed and Implementation Deviations. Let me find the right spots:
Now let me add a "Post-Review Hardening" section to AGENTS.md's Implementation Deviations. Let me find the right spot:
AGENTS.md is now fully updated. Let me do a final verification across all 3 docs:
The only remaining match is the intentional historical reference in the "Recently Closed" section — it's describing what WAS fixed (the `~~strikethrough~~` text shows the old value that was corrected). This is correct documentation, not a stale claim.

Now let me run the format check and lint on the docs:
All 3 docs pass Prettier formatting. Let me also run ESLint to ensure no markdown linting issues (though ESLint typically doesn't lint .md files, let me verify the overall lint still passes):
All checks pass clean. Let me update the worklog and finalize:
---

# ✅ Documentation Sync Complete

All three documentation files have been meticulously reviewed and updated to align with the remediated codebase.

## Summary of Changes

| Doc | Stale Refs Fixed | New Sections Added | Lines Updated |
|---|---|---|---|
| **README.md** | 15 | "Post-Review Hardening" deviations + recently closed + lessons #41-48 + new test table | ~80 lines |
| **CLAUDE.md** | 2 | "Recently Closed (post-review hardening)" section | ~12 lines |
| **AGENTS.md** | 9 | "Recently Closed" + "Post-Review Hardening" deviations (#22-28) | ~30 lines |

## What Was Aligned

**Versions & Counts** (everywhere consistent now):
- React: `^19.2.0` → `^19.2.3` (CVE-2025-55182 floor documented)
- pnpm engine: `>=9.0.0` → `>=10.26.0` (allowBuilds syntax floor)
- Test count: `259 tests / 33 files` → `288 tests / 36 files` (all 6 locations)
- env.test.ts: `19` → `25` tests | moderate-image.test.ts: `7` → `8` tests

**Technical Accuracy** (all 5 design_critique.md fixes reflected):
- Stripe: fictional camelCase fallback → `extractSubscriptionPeriodEnd()` Basil API helper
- SSE: `maxDuration = 900` → `800` (Vercel Fluid Compute Pro GA ceiling)
- Zod: obsolete `.refine()` workaround → `.url().refine()` composition (Zod v4)
- IMAGE_MODERATION_FAIL_OPEN: `process.env` direct read → Zod schema `z.enum(['true','false'])`
- pnpm-workspace.yaml: mixed syntax → `allowBuilds` only, stale `@ffmpeg-installer/linux-x64` removed

**New Content** (lessons + gotchas + troubleshooting):
- 8 new lessons learned (#41-48 in README) covering: docs-drift-into-bugs, Fluid Compute limits, CVE-2025-55182, Zod v4 `.url()` semantics, env module completeness, pnpm syntax evolution, content drift silence, TDD-as-documentation
- 8 new "Recently Closed" entries across all 3 docs documenting each post-review fix with test counts
- 7 new deviation entries (#22-28 in AGENTS.md) explaining implementation choices
- Updated troubleshooting tables: `onlyBuiltDependencies` → `allowBuilds` map syntax

## Verification

- ✅ `pnpm prettier --check README.md CLAUDE.md AGENTS.md` — all pass
- ✅ `pnpm lint` — zero errors/warnings
- ✅ `pnpm typecheck` — zero errors
- ✅ `pnpm test` — 288 tests passing (36 files)
- ✅ Zero stale references remaining (only intentional historical mentions in `~~strikethrough~~` "Recently Closed" sections)

The docs are now a faithful mirror of the codebase. Every fix from the remediation sprints has a corresponding entry explaining what changed, why, how many tests were added, and the lesson learned.

---

I'll meticulously plan this skill file creation. Let me first gather all the exact codebase details I need to validate against, then create the comprehensive SKILL.md.
Excellent — I have the full globals.css and all 4 hooks. Now let me read the config files and remaining components:
Now let me read the config files and remaining infrastructure:
Now let me read the remaining infrastructure files — r2.ts, AI clients, inngest client, and the schema files:
Now let me read the remaining data files and primitives to complete the picture:
I now have comprehensive coverage of the codebase. Let me read the remaining primitives and data files quickly, then plan and write the SKILL.md:
I now have everything I need. Let me update the todo and plan the SKILL.md structure, then write it.
Now I'll create the comprehensive SKILL.md. This will be a large file, so I'll write it in sections using the Write tool:
The SKILL.md is created. Now let me validate it against the codebase — the 10-point validation checklist:
✅ Point 1 validated — all versions match. Let me check points 2-5:
✅ Points 2-4 validated. Now let me check points 5-10:
✅ Points 5-7 validated. Now the final 3 points:
The SKILL has 18 interfaces (12 from `types/index.ts` + 6 domain-specific from feature files like `AssembleVideoInput`, `ImageModerationResult`, `ProjectProgressState`, `StripeSubscriptionLike`, etc.). That's correct — the SKILL includes both the shared marketing interfaces AND the domain-specific ones. Let me verify the 12 marketing interfaces match exactly:
✅ All 12 marketing interfaces match exactly. Now let me run the format check and final verification:
Let me update the worklog and todo:
---

# ✅ `storyintovideo_SKILL.md` Created & Validated

I've meticulously distilled the entire project knowledge into a comprehensive skill file at `/home/z/my-project/story-into-video/storyintovideo_SKILL.md`.

## Stats

| Metric | Value |
|---|---|
| **Total lines** | 2,487 |
| **Numbered sections** | 20 |
| **Appendices** | 4 (File Structure, Routes, Database Schema, AI Pipeline) |
| **Anti-patterns/bugs documented** | 23 (with root causes + fixes) |
| **Lessons learned** | 48 (across 5 sprint phases) |
| **TypeScript interfaces** | 18 (12 marketing + 6 domain-specific) |

## 10-Point Validation Results

| # | Validation Point | Status |
|---|---|---|
| 1 | Tech stack versions match `package.json` | ✅ All 8+ versions verified |
| 2 | Configuration files match (`tsconfig.json`, `next.config.ts`, etc.) | ✅ All strict flags, security headers, ESLint rules verified |
| 3 | Design system tokens match `globals.css` `@theme` block | ✅ All colors, fonts, radii, shadows, 13 keyframes, 7 @utility classes |
| 4 | Component architecture matches (client vs server) | ✅ All 5 client + 5 server components verified |
| 5 | Hooks implementation matches | ✅ All 4 hook signatures verified |
| 6 | Content ingestion patterns match (STYLE_CHIPS, etc.) | ✅ 8-chip spec set verified |
| 7 | Accessibility implementation matches (`0.01ms`, focus rings, skip link) | ✅ All a11y patterns verified |
| 8 | Anti-patterns documented correctly | ✅ 23 entries with root causes |
| 9 | Color references match (all semantic tokens + Tailwind utilities) | ✅ All hex values verified |
| 10 | TypeScript interfaces match | ✅ All 12 marketing interfaces identical |

## What's Covered

The SKILL.md is a **complete reference** that any coding agent can use to replicate, extend, or debug this codebase. It includes:

- **Exact code snippets** for every `@utility` class, every hook, every keyframe
- **Root cause analysis** for all 14 documented bugs (8 fixed, 6 avoided)
- **Step-by-step debugging guide** for 17 common issues
- **Pre-ship checklist** with 40+ verification items across code quality, visual, animation, accessibility, production hygiene, security, and operational dimensions
- **Complete color reference** with hex, RGB, WCAG contrast ratios, and usage locations
- **Z-index layer map** showing exactly which elements sit at which z-level
- **Responsive breakpoint reference** with section-specific patterns
- **The complete TypeScript interface reference** (both marketing and domain-specific)

The file passes Prettier formatting and is ready for use. Any coding agent reading this SKILL.md will have the same deep understanding of the project that I developed across this entire conversation.

---

Archive created and verified. Here are the details:

📦 **`story-into-video-remediated-v2.tar.gz`** — 104 MB, 2,306 entries

- ✅ Includes all updated docs: `README.md`, `CLAUDE.md`, `AGENTS.md`
- ✅ Includes the new `storyintovideo_SKILL.md` (2,487 lines, 20 sections + 4 appendices)
- ✅ Includes all remediation artifacts: `extract-period-end.ts`, `stripe-webhook.test.ts`, `style-chips.test.ts`, `hero-headline.test.tsx`
- ✅ Excludes `node_modules/`, `.next/`, `.git/` (verified — zero matches)
- 📥 Download path: `/home/z/my-project/download/story-into-video-remediated-v2.tar.gz`

To refresh your GitHub repo:

```bash
# Extract over your local clone (overwrites existing files)
cd your-existing-clone
tar -xzf story-into-video-remediated-v2.tar.gz --strip-components=1
git add -A
git commit -m "Post-review hardening: docs sync + SKILL.md creation

- README.md, CLAUDE.md, AGENTS.md updated to reflect remediation
- New storyintovideo_SKILL.md (comprehensive 2487-line skill reference)
- All 288 tests passing, lint/typecheck/build clean"
git push
```

The v2 archive supersedes the v1 archive — it contains everything from v1 plus the documentation sync and the new SKILL.md.

---

https://chat.z.ai/s/43494d0d-742c-4873-b800-323f51c1550a 
