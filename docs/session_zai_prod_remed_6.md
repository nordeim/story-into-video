I'll execute this in phases: clone the repo, deep-read the docs, validate against the actual codebase, then run browser-based E2E checks for T1–T9. Let me start by cloning and inspecting the structure.
Now let me read the key documentation files in parallel to build a deep understanding of the project.
The status_11.md contains the previous session's remediation plan with T1-T9 tasks (which were awaiting approval). I now need to:
1. Finish reading the rest of CLAUDE.md, AGENTS.md, README.md (truncated content)
2. Check T1-T9 completion status against the current codebase
3. Run agent-browser E2E validation against the live site

Let me create a TODO list and proceed.
The output files are nested reads — let me read the original files directly in chunks to avoid the recursion.
I have a strong understanding of the project now. Let me move to checking the T1-T9 remediation tasks against the current codebase.
Let me check all T1-T9 tasks in parallel by reading the relevant files:
Significant findings: T3, T4, T6, T7, T8 are completely absent (no files exist). T1 and T2 are not done in the code. Let me verify T5 (Link replacement) and T9 (CI workflow), plus check if `.github` exists at all.
Now let me read the CI workflow file to verify T9 status, and also check the `AGENTS.md` and remaining `CLAUDE.md` content for completeness.
All T1-T9 (as proposed in status_11.md) are confirmed NOT DONE. Now let me load the agent-browser skill and run E2E validation against the live site.
Let me check if agent-browser is installed and run the E2E validation against the live site.
Excellent — landing page renders cleanly. Now let me check the `/api/health` endpoint and the critical `/dashboard` redirect issue from status_11.md.
The critical production issue from status_11.md is **STILL LIVE** — `/dashboard` redirects to `http://localhost:3000/sign-in?callbackUrl=%2Fdashboard` with `authjs.callback-url=http%3A%2F%2Flocalhost%3A3000` cookie. `NEXT_PUBLIC_APP_URL` is still misconfigured in production.

Let me verify T6 (missing pages), T7 (no custom 404), and confirm auth/legal pages still work:
Confirmed: T3, T4, T6, T7 all return 404 (not implemented). Auth/legal pages return 200. Let me snapshot the sign-in page to verify AuthForm renders:
All public pages render correctly. Let me take screenshots of the marketing page and the missing-pages 404 behavior for the validation report.
I now have all the evidence needed. Let me write the worklog and produce the consolidated validation report.
All work complete. Here is the consolidated validation report.

---

# StoryIntoVideo — Meticulous Validation Report

## Phase 1 · ANALYZE — What the project IS

**StoryIntoVideo** is a production SaaS that turns written stories into finished MP4 videos via a 6-step AI pipeline (moderate → analyze → characters → scenes → voiceover → subtitles → assembly). Originally a pixel-accurate marketing clone of `storyintovideo.com`, it has evolved into a hybrid Next.js 16 app with a marketing layer, a production app layer (auth, dashboard, create wizard, project detail w/ SSE, billing), an Inngest AI pipeline, and Stripe credit-metered billing.

**Stack verified against `package.json`:** Next.js `^16.2.0`, React `^19.2.3` (CVE-2025-55182 floor), Tailwind v4 CSS-first, Drizzle `^0.45.2`, Inngest `^4.11.0`, Zod `^4.4.3`, ElevenLabs `^1.59.0`, Replicate `^1.4.0`, Stripe `^22.3.0`. pnpm `>=10.26.0`, Node `>=20.0.0`. **Every version matches the docs.**

## Phase 2 · VALIDATE — Docs ↔ Codebase alignment

| Claim | Validated against | Status |
|---|---|---|
| 5-layer architecture (proxy/app/features/domain/lib) | `src/proxy.ts`, `src/app/`, `src/features/`, `src/features/*/domain/`, `src/lib/` | ✅ Exact match |
| 15 routes (3 route groups: `(auth)`, `(app)`, `(legal)`) | All route handlers present in `src/app/` | ✅ Exact match |
| 11 tables + 8 enums | `src/lib/db/schema/{auth,projects,media,billing}.ts` | ✅ Exact match |
| 30 env vars validated by Zod | `src/lib/env/index.ts` | ✅ Exact match |
| Outfit 820 hero H1 with 3-line `<br>` stack | `src/components/sections/hero.tsx:77-86` | ✅ Exact match |
| T2 fix (proxy uses `env.NEXT_PUBLIC_APP_URL`) | `src/proxy.ts:71` | ✅ Code correct |
| H6 host-header whitelist | `src/proxy.ts:44-55` | ✅ Exact match |
| H9 health endpoint (DB SELECT 1 + FFmpeg accessSync) | `src/app/api/health/route.ts:37-53` | ✅ Live returns `{database:"healthy",ffmpeg:"healthy"}` |
| 396 unit tests + 48 E2E tests | `src/tests/unit/` (48 files) + `src/tests/e2e/` (9 specs) | ✅ Counts match docs |

**Verdict: Documentation ↔ codebase alignment is essentially perfect** for everything that was implemented *before* status_11.md was written.

## Phase 3 · VERIFY — T1–T9 completion status (the core ask)

`status_11.md` (lines 211–221) proposed **9 new TDD remediation task cards** and stopped at "Phase 4 · VALIDATE Gate — Awaiting your approval". My verification shows **0 of 9 have been executed**:

| # | Task | Code state | Live site evidence |
|---|---|---|---|
| **T1** | Env host-mismatch fail-fast in production | `src/lib/env/index.ts:219-226` still uses `console.warn`, no throw | `/dashboard` redirects to `http://localhost:3000` — env IS misconfigured AND no fail-fast catches it |
| **T2** | `/api/health` env sanity check | `src/app/api/health/route.ts` only checks DB + FFmpeg | `/api/health` returns `healthy` even though env is broken |
| **T3** | GDPR data export `GET /api/user/export` | No `src/app/api/user/export/route.ts` file | `GET /api/user/export` → **404** |
| **T4** | GDPR account deletion `DELETE /api/user` | No `src/app/api/user/route.ts` file | `DELETE /api/user` → **404** |
| **T5** | Replace `<a>` with `<Link>` | `navbar.tsx`: 6 raw `<a href>` (lines 60, 100, 108, 145, 156, 163); `hero.tsx:166` `<a href="/create">`; `dashboard/page.tsx:64, 95` — directly violates CLAUDE.md line 92 | Live nav still triggers full-page reloads |
| **T6** | `/pricing`, `/blog`, `/contact` pages | None of the directories exist | All three → **404** with default Next.js 404 page |
| **T7** | Custom `not-found.tsx` page | No `src/app/not-found.tsx` | Unknown routes fall back to default "404 - This page could not be found." |
| **T8** | GDPR cookie consent banner | No `src/components/app/cookie-banner.tsx` | No banner visible anywhere |
| **T9** | E2E tests in CI | `.github/workflows/ci.yml` only has `lint+typecheck+test+build`; explicit comment says "E2E tests (Playwright) are NOT run in CI yet" | n/a (CI config) |

## Phase 4 · CRITICAL — The live production blocker (still unfixed)

`status_11.md` identified that every auth-protected route (`/dashboard`, `/create`, `/billing`, `/projects/[id]`, `/settings`) redirects to `http://localhost:3000` → `ERR_CONNECTION_REFUSED` in the browser. **This is still live.** `curl` proves it:

```
HTTP/2 307
location: http://localhost:3000/sign-in?callbackUrl=%2Fdashboard
set-cookie: authjs.callback-url=http%3A%2F%2Flocalhost%3A3000
```

**Root cause (unchanged from status_11.md):** the production `NEXT_PUBLIC_APP_URL` env var is set to `http://localhost:3000` instead of `https://storyintovideo.jesspete.shop`. The T2 code fix at `src/proxy.ts:71` IS deployed — but the env var itself is wrong. T1 (fail-fast) would have caught this at boot, but T1 is not implemented.

## Phase 5 · DELIVER — Summary & next steps

**The codebase is audit-driven remediation gold** for everything that came *before* status_11.md. **None of the T1–T9 tasks proposed in status_11.md have been executed** — the previous session correctly stopped at the VALIDATE gate and never received approval to proceed.

**Recommended priority order:**

1. **Immediate (5 min, operational):** Set `NEXT_PUBLIC_APP_URL=https://storyintovideo.jesspete.shop` and `AUTH_URL=https://storyintovideo.jesspete.shop` in production env, redeploy. Unblocks 100% of auth-protected routes with zero code changes.

2. **Short-term (1 sprint, T1+T2):** Implement T1 (env host-mismatch fail-fast) + T2 (`/api/health` env check). This is the highest-leverage work because it converts the silent production misconfiguration that broke the live site into a loud boot-time failure that operators can't miss.

3. **Compliance (T3+T4+T8):** Implement GDPR data export, account deletion, and cookie consent banner. The Privacy Policy already publicly promises these features — they're currently a compliance P0.

4. **UX polish (T5+T6+T7):** Replace internal `<a>` with `<Link>`, implement the three missing pages, and add a custom 404. Improves Lighthouse scores and SEO.

5. **CI hardening (T9):** Add a Playwright E2E job to CI with a Postgres service container.

**Evidence captured:** Two screenshots at `/home/z/my-project/download/validation-evidence/` (full marketing page + the default 404 on `/pricing`). Full worklog at `/home/z/my-project/worklog.md`.

---

I'll proceed with the Meticulous Approach: ANALYZE → PLAN → VALIDATE → IMPLEMENT → VERIFY → DELIVER for T1 + T2 in sequence.

## Phase 1 · ANALYZE — Deep-dive on both tasks

Let me re-confirm the exact current state of every file T1/T2 will touch, plus the existing tests that constrain my design.
Excellent — I now have a complete picture of the constraints. Let me also check the `next.config.ts` and `.env.example` to confirm there are no other places that read `process.env` for these vars, and verify the `vitest.config.ts` so I know my new test file will be picked up.
I now have the complete picture. Let me also check if pnpm is installed in this environment so I can actually run the test suite (TDD requires running tests).
Dependencies installed. Now let me verify the baseline is GREEN before making any changes.
Baseline confirmed: **396 tests passing across 48 files, all GREEN.** Let me also run lint + typecheck to confirm the baseline is fully clean.
Lint + typecheck both clean. Baseline fully GREEN. Now let me present the comprehensive remediation plan and detailed TODO list.

## Phase 2 · PLAN — Comprehensive Remediation Plan for T1 + T2
### T1 — Env host-mismatch fail-fast in production

**File:** `src/lib/env/index.ts` (lines 209–227)

**Current behavior:** When `AUTH_URL` host ≠ `NEXT_PUBLIC_APP_URL` host, the module emits `console.warn` and returns successfully. The app boots. This is exactly what happened on the live production site — the warning was buried in server logs, the env was misconfigured (`NEXT_PUBLIC_APP_URL=http://localhost:3000`), and every auth-protected route redirected to `localhost` → `ERR_CONNECTION_REFUSED`.

**New behavior:** Promote to a thrown error **only in production runtime** (not build context, not dev/test). This is the "fail-fast at boot" principle that the rest of the env module already follows (line 278 throws on missing required vars).

**Design decisions:**
1. **Production-only** — In dev/test, mismatches are common (e.g., AUTH_URL=localhost, NEXT_PUBLIC_APP_URL=localhost both work; if someone sets them mismatched locally, they're actively debugging). Throw only when `NODE_ENV === 'production'` AND not in build context.
2. **Build context still returns placeholders** — Build context uses `AUTH_URL: 'http://localhost:3000'` and `NEXT_PUBLIC_APP_URL: 'http://localhost:3000'` (both placeholders), so they match — no throw.
3. **Keep the `console.warn` in all contexts** — It's still useful in dev/test as a visible reminder. Just promote to throw *in addition* in production.
4. **Update the 2 existing tests** that asserted "warns but boots" — they currently use `VALID_ENV` with `NODE_ENV: 'production'`, so they will now expect a throw. I'll split the test cases by NODE_ENV.

**Tests to add (4 new + 2 updated):**

| # | Test | Asserts |
|---|---|---|
| 1 (new) | T1: throws in production when AUTH_URL host ≠ NEXT_PUBLIC_APP_URL host | `import('@/lib/env')` rejects with a host-mismatch error |
| 2 (new) | T1: does NOT throw in development when hosts mismatch (still warns) | import succeeds, console.warn called |
| 3 (new) | T1: does NOT throw in test context when hosts mismatch (still warns) | import succeeds, console.warn called |
| 4 (new) | T1: does NOT throw in build context (placeholders match anyway) | import succeeds with placeholder values |
| 5 (update existing) | "warns when AUTH_URL host differs from NEXT_PUBLIC_APP_URL host" | Change `NODE_ENV` to `'development'` so it warns without throwing — keeps the regression guard |
| 6 (update existing) | "does NOT warn when AUTH_URL and NEXT_PUBLIC_APP_URL hosts match" | Already uses production + matching hosts → still passes |

### T2 — `/api/health` env sanity check

**File:** `src/app/api/health/route.ts`

**Current behavior:** Returns `{status, timestamp, services:{database, ffmpeg}}`. Does NOT surface env misconfigurations. On the live site, `/api/health` returns `healthy` even though the production `NEXT_PUBLIC_APP_URL` is broken — operators monitoring the health probe have **no visibility** into the env misconfiguration that's breaking 100% of auth-protected routes.

**New behavior:** Add an env sanity check that runs the same host-mismatch logic as T1 (read-only, no throw) and surfaces it in the health response.

**Design decisions:**
1. **Never throw** — The health endpoint must always return a response. If env reading throws (it shouldn't, since the module loaded successfully), catch and report.
2. **Add a `config` object** to the response: `{config: {authUrlMatch: boolean, authUrl: string, appUrl: string}}`. Or simpler: `{config: 'healthy'|'unhealthy', configErrors: string[]}` mirroring the existing `services` pattern.
3. **configOk = false should NOT trigger 503** — A misconfigured env still leaves the marketing page + auth pages working. Returning 503 would cause Docker/K8s to restart a "healthy" container. Instead, surface the misconfig in the JSON body so monitoring can detect it, but keep 200 OK if DB + FFmpeg are healthy.
4. **Pattern: read-only check** — Reuse the same `extractHost` logic from the env module, but call it on `env.AUTH_URL` / `env.NEXT_PUBLIC_APP_URL` at request time (not module load). This makes T2 observably correct regardless of when the env was loaded.

**Tests to add (4 new):**

| # | Test | Asserts |
|---|---|---|
| 1 (new) | T2: health route checks AUTH_URL ↔ NEXT_PUBLIC_APP_URL host match | source matches `/AUTH_URL/` AND `/NEXT_PUBLIC_APP_URL/` AND `/extractHost\|host/i` |
| 2 (new) | T2: health route includes a `config` field in the JSON response | source matches `/config:/` |
| 3 (new) | T2: health route includes `configErrors` array (mirrors `errors` pattern) | source matches `/configErrors/` |
| 4 (new) | T2: health route does NOT return 503 solely for env mismatch (keeps 200 if DB+FFmpeg healthy) | source must show config check is independent of overallHealthy computation |

### Cross-cutting design choices

- **No new dependencies** — both fixes use existing `z`, `URL`, `fs`, `NextResponse`.
- **No new files** — both are in-place edits to existing files + existing test files.
- **No breaking changes** — existing 396 tests stay GREEN. The 2 env tests I'm updating are made stricter but still pass.
- **TDD discipline** — write failing test first, watch it fail, then make minimum fix, watch it pass, refactor for clarity.
- **No `as any`** — TypeScript strict mode preserved.
- **No layer violations** — health route is Layer 1 (app), reads from Layer 4 (`@/lib/env`). Already an established pattern.
- **No `process.env.*`** — Both fixes read from the validated `env` module (T2) or its already-validated `result.data` (T1).

## Phase 3 · VALIDATE — Plan vs. codebase alignment
Let me validate each design decision against the actual codebase constraints before implementing.

**Validation matrix:**

| Plan constraint | Codebase check | Result |
|---|---|---|
| T1 throws only in production runtime (not build/test/dev) | env module line 233-234 already distinguishes build context via `NEXT_PHASE === 'phase-production-build' \|\| NODE_ENV === 'test'`. Build context placeholders have matching `localhost:3000` hosts (lines 243, 268) → no throw in build | ✅ Safe |
| T1 must not break the `setup.ts` test env | `setup.ts` sets `AUTH_URL: 'http://localhost:3000'` + `NEXT_PUBLIC_APP_URL: 'http://localhost:3000'` + `NODE_ENV: 'test'`. Hosts match → no throw, and `NODE_ENV='test'` means non-production path anyway | ✅ Safe |
| T1 must not break `env.test.ts` line 27 `NODE_ENV: 'production'` baseline | `VALID_ENV` has both URLs set to `'http://localhost:3000'` → hosts match → no throw | ✅ Safe |
| T1 must not break the 2 existing mismatch tests (lines 161, 176) | Line 161 uses `NODE_ENV: 'production'` (inherited from VALID_ENV line 27) with mismatched hosts → WILL throw after T1. Must update this test to use `NODE_ENV: 'development'`. Line 176 uses matching hosts → still passes | ⚠️ Needs test update |
| T2 must not break existing 6 health.test.ts tests | Existing tests are source-reading tests that check `from '@/lib/db'`, `SELECT 1`, `accessSync`, `503`, `database`, `ffmpeg`, `healthy\|unhealthy`. Adding `config` field doesn't break any of these | ✅ Safe |
| T2 must not break the `proxy-redirect-url.test.ts` | That test reads `src/proxy.ts` source, not health route. Independent | ✅ Safe |
| T2 should NOT return 503 solely for env mismatch | Plan specifies this. Need to ensure the `overallHealthy` computation only depends on `dbHealthy && ffmpegHealthy` | ✅ Plan-conformant |
| T2's env read must be safe (no throw at request time) | env module already loaded successfully at boot (otherwise the route wouldn't be reachable). Reading `env.AUTH_URL` + `env.NEXT_PUBLIC_APP_URL` is just property access | ✅ Safe |
| Both fixes respect 5-layer architecture | T1 is in Layer 4 (lib/env), T2 is in Layer 1 (app/api/health) importing from Layer 4. Established pattern | ✅ Safe |
| Both fixes preserve TypeScript strict mode | No `any`, no `as` casts needed. `extractHost` already returns `string \| null` | ✅ Safe |
| Both fixes preserve ESLint rules | No `process.env.*` direct access. Consistent-type-imports already followed in both files | ✅ Safe |
| Brand tokens test (`brand-tokens.test.ts`) unaffected | Neither file touches colors or fonts | ✅ Safe |
| `vitest.config.ts` `include` pattern picks up new tests | Pattern is `'src/tests/unit/**/*.test.{ts,tsx}'`. New tests go in existing `env.test.ts` and `health.test.ts` | ✅ Safe |

**Plan is fully validated.** Proceeding to implementation.

---

## Phase 4 · IMPLEMENT — T1 first (RED → GREEN → REFACTOR)

### T1.1 — RED: Write failing tests for T1
I'll edit `env.test.ts` to (a) update the 2 existing mismatch tests to use NODE_ENV='development' so they still assert the warn behavior, and (b) add 4 new tests that assert the production fail-fast behavior.
Now let me run the new T1 tests to confirm they FAIL as expected (RED phase):
RED confirmed. Exactly 1 test fails — the production fail-fast test ("T1: THROWS at module load in production when AUTH_URL host ≠ NEXT_PUBLIC_APP_URL host"). The other 35 env tests pass (including the dev/test/build-context tests I just added, because the current code already warns without throwing).

### T1.2 — GREEN: Implement the production fail-fast
Now let me run the env tests to confirm GREEN phase:
All 36 env tests pass (was 32, now 36 with the 4 new T1 tests). GREEN confirmed.

### T1.3 + T1.4 — VERIFY: Full test suite + lint + typecheck
T1 fully verified:
- **400 tests passing** (was 396, +4 new T1 tests, 0 regressions)
- **lint clean**
- **typecheck clean**

T1 is complete. Now proceeding to T2.

---

## Phase 4 · IMPLEMENT — T2 (RED → GREEN → REFACTOR)

### T2.1 — RED: Write failing tests for T2
Now let me run the health tests to confirm RED phase:
RED confirmed — 4 of the 5 new T2 tests fail (the 5th, `overallHealthy = dbHealthy && ffmpegHealthy`, already passes since the current code has that exact pattern). The 6 pre-existing H9 tests + the overallHealthy test = 7 passing. Now let me implement T2.

### T2.2 — GREEN: Add env sanity check to health route
### T2.3 + T2.4 — VERIFY: T2 tests + full suite + lint + typecheck
All 11 health tests pass (was 6, now 11 with the 5 new T2 tests). GREEN confirmed.
T2 fully verified:
- **405 tests passing** (was 396, +4 T1 + +5 T2 = +9 new tests, 0 regressions)
- **lint clean**
- **typecheck clean**

## Phase 5 · FINAL VERIFY — Full pre-commit chain
Per CLAUDE.md line 199, the pre-commit chain is `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. The build step needs `NEXT_PHASE=phase-production-build` to trigger the env module's build-context fallback (per `ci.yml` lines 66-71).
Build succeeds cleanly. All 17 routes compile correctly (15 documented routes + `/_not-found` + `/icon`). T1's production fail-fast did NOT fire during build because the build-context placeholders match (`http://localhost:3000` for both `AUTH_URL` and `NEXT_PUBLIC_APP_URL`), exactly as designed.

## Phase 6 · DELIVER — Knowledge transfer & handoff
---

# T1 + T2 Execution Report — Complete

## Executive Summary

Both T1 (env host-mismatch fail-fast) and T2 (`/api/health` env sanity check) have been implemented via strict TDD. The pre-commit chain is fully GREEN: **405 tests passing** (+9 new), **lint clean**, **typecheck clean**, **build clean**.

## What was delivered

| Task | File | Change |
|---|---|---|
| T1 RED | `src/tests/unit/env.test.ts` | +4 new tests, 2 existing tests updated for dev-context |
| T1 GREEN | `src/lib/env/index.ts` | Promoted host-mismatch from `console.warn` to `throw` in production runtime only |
| T2 RED | `src/tests/unit/health.test.ts` | +5 new tests |
| T2 GREEN | `src/app/api/health/route.ts` | Added env sanity probe; surfaces `config.healthy` + `configErrors` in JSON |

## Behavior matrix (T1)

| Context | AUTH_URL ≠ APP_URL host | Behavior |
|---|---|---|
| production runtime | mismatch | **THROWS** (fail-fast at boot — the core T1 fix) |
| development | mismatch | `console.warn` only (operator debugging) |
| test | mismatch | `console.warn` only (test suite flexibility) |
| build context | (placeholders match) | never reached — build always succeeds |

## Health endpoint response shape (T2)

```json
{
  "status": "healthy",
  "timestamp": "2026-...",
  "services": { "database": "healthy", "ffmpeg": "healthy" },
  "config": { "healthy": true, "authUrl": "...", "appUrl": "..." },
  "configErrors": undefined
}
```

Crucially, `config.healthy: false` does **NOT** trigger 503 — DB+FFmpeg being healthy means the container is alive, just misconfigured. Monitoring detects the config flag separately; Docker/K8s won't restart a perfectly alive container.

## What this fixes

The live production issue at `https://storyintovideo.jesspete.shop/` (every auth-protected route redirecting to `http://localhost:3000`) was caused by `NEXT_PUBLIC_APP_URL=http://localhost:3000` in the production env, with **no fail-fast to catch it**. After this fix is deployed:

1. **T1** ensures any future env misconfiguration of this type causes the app to refuse to boot at startup with a clear error message — operators can't miss it.
2. **T2** ensures `/api/health` surfaces the misconfiguration to monitoring even if T1 is somehow bypassed (defense-in-depth).

## Operational next step (required to fix the live site)

This is a code change, not a deployment. To actually fix the live site, the production server needs:

```bash
# On the production host
NEXT_PUBLIC_APP_URL=https://storyintovideo.jesspete.shop
AUTH_URL=https://storyintovideo.jesspete.shop
# Then redeploy
```

After redeploy, visiting `/dashboard` while logged out should redirect to `https://storyintovideo.jesspete.shop/sign-in?callbackUrl=%2Fdashboard` (HTTPS, correct host) instead of `http://localhost:3000/...`.

## Suggested next steps

1. **Commit + push** the T1+T2 changes so they're on `main` and get picked up by the next deploy.
2. **Fix the production env var** (5-minute operational task) — unblocks 100% of auth-protected routes immediately.
3. **Verify the live site** after redeploy: `curl -i https://storyintovideo.jesspete.shop/api/health` should now show `config.healthy: true`, and `/dashboard` should redirect to the HTTPS sign-in URL.
4. **Continue the T1–T9 sequence** with T3 (GDPR data export) + T4 (GDPR account deletion) — these are compliance P0s since the Privacy Policy publicly promises features that don't exist yet.

---

I'll proceed with the Meticulous Approach for T3–T9 in sequence. Let me start by deeply analyzing each task against the actual codebase to surface every constraint, dependency, and risk before planning.

## Phase 1 · ANALYZE — Deep-dive on T3–T9

Let me read every file that T3–T9 will touch, plus all existing tests that constrain the design.
Excellent — schema confirms full CASCADE on all FKs from `users`. DB-level GDPR is ready. Now let me read the existing features/auth files, R2 client, and key tests that constrain my design.
Critical finding from `verify-session.ts` line 15: **API routes must use `auth()` directly (returns null → 401 JSON), NOT `verifySession()` (which redirects)**. This is the AGENTS.md pitfall #24 referenced in status_11.md's validation. I'll follow this for T3/T4.

Let me now read the remaining critical files: navbar, footer, dashboard, legal-links, the existing tests for cta-routes + legal-pages + brand-tokens, and the existing E2E specs.
Now I have a clear picture. Let me also read the remaining critical files: examples.tsx, workflow.tsx, use-cases.tsx, final-cta.tsx, testimonials.tsx (T5 scope), the cta-routes test, brand-tokens test, the existing E2E specs, and the terms page (to understand the legal page pattern T6 should follow).
Let me read the remaining critical files for T5/T6: the CTA primitives, the cta-routes test, brand-tokens test, and existing E2E tests.
Critical finding from cta-routes.test.ts line 37: the existing test checks `NAVBAR_SOURCE` matches `/href=['"]\/sign-in['"]/` — but does NOT check it's a `<Link>`. Same for hero, final-cta, etc. These tests use source-reading to check `href=` patterns, which work with both `<a href>` and `<Link href>`. So my T5 refactor will keep these tests passing as long as I preserve the `href="..."` attribute syntax.

Also critical from brand-tokens.test.ts: any new components I add (T6 pages, T7 not-found, T8 cookie-banner) must NOT use `bg-zinc-950/900/black` or `amber-300/400/500/600` — must use `bg-background`, `bg-card`, `text-primary`, etc.

Let me now read the existing E2E tests and the layout.tsx (for T8 cookie banner mounting) + the existing terms page (as a model for T6).
Now let me also check the billing queries (for T3/T4 — need to understand existing patterns for `db.transaction`, user-related queries), the existing CI workflow, and check if there's an existing `app/api/projects/[id]/download/route.ts` as a model for API route patterns.
Now let me also check the Database type, db index, and existing `dashboard.test.ts` (which constrains T5 changes to dashboard):
I now have a complete picture of every constraint. Let me also quickly confirm the baseline is still GREEN after T1+T2 (no drift introduced) and check the `metadata.test.ts` to make sure T6/T7 metadata patterns will pass.
Baseline confirmed: 405/405 tests passing (396 original + 9 from T1+T2). Now I have everything needed to produce the comprehensive plan.

## Phase 2 · PLAN — Comprehensive Remediation Plan for T3–T9
### T3 — GDPR data export endpoint `GET /api/user/export`

**Files to create:**
- `src/app/api/user/export/route.ts` — API route handler
- `src/features/auth/queries.ts` — NEW file (the `queries.ts` boundary for auth feature; currently only `actions.ts` + `domain/verify-session.ts` exist)
- `src/tests/unit/user-export.test.ts` — NEW test file

**Design:**
- Uses `auth()` (NOT `verifySession()`) per AGENTS.md pitfall #24 — API routes return 401 JSON, not redirects
- Returns JSON with: user profile, projects (with characters/scenes counts), subscription, usage events
- Pattern mirrors `download/route.ts`: `auth()` → 401 if no session → queries.ts → JSON response
- Owner check is implicit (the `userId` comes from the session, not from URL params)
- No R2 signed URLs in the export (just keys + metadata) — avoids 1-hour expiry making the export stale

**Tests (4 new):**
1. Route uses `auth()` (not `verifySession`) — source-reading test
2. Route returns 401 JSON when unauthenticated — source-reading test for the 401 pattern
3. Route imports from `@/features/auth/queries` (queries.ts boundary) — source-reading test
4. `getUserExportData(userId)` exists in queries.ts and queries users + projects + subscriptions + usageEvents

### T4 — GDPR account deletion endpoint `DELETE /api/user`

**Files to create:**
- `src/app/api/user/route.ts` — API route handler
- Add `deleteUserAccount(userId)` to `src/features/auth/queries.ts` (created in T3)
- Add `deleteUserMedia(userId)` helper in `src/lib/storage/r2.ts` — bulk-delete R2 objects for a user's projects
- `src/tests/unit/user-delete.test.ts` — NEW test file

**Design:**
- Uses `auth()` → 401 JSON if unauthenticated
- Calls `deleteUserAccount(userId)` which:
  1. Queries all projects for the user → collects R2 keys (referenceImageKey, generatedImageKey, videoKey, subtitleKey, audioKey)
  2. Deletes the `users` row — CASCADE handles all child rows (accounts, sessions, subscriptions, projects → characters/scenes/videos/voiceovers, usageEvents)
  3. Best-effort R2 bulk delete (R2 errors logged but don't fail the request — DB deletion is the source of truth)
- Returns 200 JSON `{ success: true }` on completion
- The Privacy Policy §4 already promises "R2-stored media files are deleted within 30 days" — we delete immediately at the R2 layer (better than the policy promises)

**Tests (5 new):**
1. Route uses `auth()` (not `verifySession`)
2. Route returns 401 JSON when unauthenticated
3. Route imports from `@/features/auth/queries`
4. `deleteUserAccount(userId)` exists in queries.ts and uses `db.delete(users)` (CASCADE)
5. `deleteUserMedia(userId)` exists in r2.ts and uses `DeleteObjectsCommand` (bulk delete)

### T5 — Replace internal `<a>` with `<Link>`

**Files to edit:**
- `src/components/sections/navbar.tsx` — 6 `<a href>` → `<Link href>` (desktop nav, sign-in, get-started, mobile sheet nav × 3)
- `src/components/sections/hero.tsx` — 1 `<a href="/create">` → `<Link>`
- `src/app/(app)/dashboard/page.tsx` — 2 `<a href>` → `<Link>` (New Project button + project cards)
- `src/components/sections/examples.tsx` — 1 `<a href={card.href}>` → `<Link>` (card link)
- `src/components/sections/use-cases.tsx` — 1 `<a href={uc.href}>` → `<Link>` (card link)
- `src/components/sections/workflow.tsx` — uses `CtaGhost` (primitive) — no direct `<a>` in this file
- `src/components/sections/final-cta.tsx` — uses `CtaAmber` (primitive) — no direct `<a>`
- `src/components/sections/features.tsx` — uses `CtaGhost` — no direct `<a>`
- `src/components/sections/testimonials.tsx` — uses `CtaGhost` — no direct `<a>`
- `src/components/sections/footer.tsx` — 1 `<a href={link.href}>` for footer link columns + 3 `<a href>` in bottom legal nav → `<Link>` (but `mailto:` stays as `<a>`)
- `src/components/primitives/cta-amber.tsx` — `<a href>` → `<Link>` (server component, still works)
- `src/components/primitives/cta-gradient.tsx` — `<a href>` → `<Link>`
- `src/components/primitives/cta-ghost.tsx` — `<a href>` → `<Link>`

**Critical constraint:** The existing `cta-routes.test.ts` uses source-reading to check `href="..."` patterns — these will still pass with `<Link href="...">`. The `layout.tsx` skip-to-content link uses `<a href="#main">` — this is an anchor link, NOT internal navigation, so it stays as `<a>` (Next.js `<Link>` doesn't handle hash anchors the same way). Same for `mailto:` links in footer/legal pages.

**Tests (1 new source-reading test in cta-routes.test.ts):**
- Add a test that asserts no `<a href="/...">` (internal route) exists in navbar.tsx, hero.tsx, dashboard/page.tsx, examples.tsx, use-cases.tsx, footer.tsx, cta-amber.tsx, cta-gradient.tsx, cta-ghost.tsx — only `<Link href="/...">` is allowed for internal routes. Exclude `#` (hash anchors) and `mailto:` (email links).

### T6 — Implement `/pricing`, `/blog`, `/contact` pages

**Files to create:**
- `src/app/(legal)/pricing/page.tsx` — Server Component
- `src/app/(legal)/blog/page.tsx` — Server Component
- `src/app/(legal)/contact/page.tsx` — Server Component
- `src/tests/unit/content-pages.test.ts` — NEW test file

**Design:**
- All 3 are Server Components (no client state) with proper `metadata` exports — mirrors the existing `/privacy` and `/terms` pattern
- Placed in `(legal)/` route group (no URL prefix — same as privacy/terms)
- Each page: H1 + intro paragraph + "coming soon" CTA pointing to `/create` (the working conversion path)
- `/pricing`: 4-tier plan table (Free/Creator/Pro/Studio) — pulled from `tier-limits.ts` constants, with "Coming soon" badges on paid tiers + CTA to `/create` for free tier
- `/blog`: "Stories from the team" header + "Coming soon" placeholder + newsletter signup CTA (mailto: link, no form)
- `/contact`: support email + "We'll respond within 5 business days" + link to `/create` for product questions
- All use brand tokens: `bg-background`, `text-primary`, `font-heading` — NO `bg-zinc-950/900/black` or `amber-300/400/500/600`

**Tests (6 new):**
1. All 3 files exist
2. All 3 are server components (no `'use client'`)
3. All 3 export `metadata` with a title
4. All 3 contain a CTA linking to `/create` (source-reading)
5. All 3 use brand tokens (no `bg-zinc-950/900/black`, no `amber-*`)
6. All 3 contain an H1 heading

### T7 — Custom `not-found.tsx` page

**Files to create:**
- `src/app/not-found.tsx` — Server Component (Next.js convention)
- `src/tests/unit/not-found-page.test.tsx` — NEW test file (`.tsx` because it may render)

**Design:**
- Next.js automatically uses `app/not-found.tsx` for any unmatched route + for `notFound()` calls
- Server Component (no client state)
- On-brand 404: large "404" in Outfit 820, "Page not found" subtitle, "Back to home" + "Start creating" CTAs
- Uses `Link` (not `<a>`) per T5 discipline
- Brand tokens only

**Tests (2 new):**
1. File exists, is a server component, contains "404" + a link to `/`
2. Uses `next/link` (not `<a>`) for internal navigation, uses brand tokens

### T8 — GDPR cookie consent banner

**Files to create:**
- `src/components/app/cookie-banner.tsx` — Client component (uses `useState` + `localStorage`)
- `src/tests/unit/cookie-banner.test.tsx` — NEW test file
- **Edit:** `src/app/layout.tsx` — mount `<CookieBanner />` inside `<body>` after `<Providers>`

**Design:**
- Client component (`'use client'`) — needs `useState` for show/hide + `localStorage` for persistence
- Dismissible informational banner (NOT a consent gate — the app doesn't use analytics/tracking cookies)
- Bottom-fixed, full-width, with: short text + "Privacy Policy" link + "Got it" button
- `localStorage.setItem('siv-cookie-consent', 'acknowledged')` on dismiss
- On mount, reads localStorage — if `'acknowledged'`, renders `null`
- SSR-safe: renders `null` on first render (avoids hydration mismatch), then shows banner after `useEffect` confirms localStorage is empty
- Uses brand tokens only

**Tests (4 new):**
1. File exists with `'use client'` directive
2. Component renders banner text + Privacy Policy link + dismiss button
3. Clicking dismiss calls `localStorage.setItem('siv-cookie-consent', 'acknowledged')`
4. Component renders null when localStorage already has `'acknowledged'`

### T9 — Add Playwright E2E job to CI

**File to edit:**
- `.github/workflows/ci.yml` — add a second job `e2e` that runs after `quality-gate` passes

**Design:**
- New `e2e` job: `needs: quality-gate` (runs only if lint+typecheck+test+build pass)
- `continue-on-error: true` initially — doesn't block PRs while flakiness is shaken out (per status_11.md plan)
- Services: `postgres` service container with health check + `DATABASE_URL` env wired
- Steps: checkout → pnpm → node → install → seed DB → install Playwright browsers → run `pnpm test:e2e`
- The CI workflow already has `concurrency: cancel-in-progress` — the e2e job inherits this

**No new tests** (CI config change). Verification = YAML syntax check + reviewing the job structure.

---

## Phase 3 · VALIDATE — Plan vs. codebase alignment
| Plan constraint | Codebase check | Result |
|---|---|---|
| T3/T4 use `auth()` not `verifySession()` | `verify-session.ts` line 15 documents this; `download/route.ts` line 31 shows the established pattern | ✅ Safe |
| T3/T4 respect `queries.ts` boundary | New `src/features/auth/queries.ts` will be the first queries.ts in the auth feature — follows the projects/billing pattern | ✅ Safe |
| T4 CASCADE delete already wired at DB level | `auth.ts:25,43`, `projects.ts:45,65,87`, `media.ts:37,59`, `billing.ts:29,58` — every FK from `users` is `onDelete: 'cascade'` | ✅ Safe |
| T4 R2 bulk delete needs `DeleteObjectsCommand` | `r2.ts` imports from `@aws-sdk/client-s3` — `DeleteObjectsCommand` is available in the same package | ✅ Safe |
| T5 source-reading tests still pass with `<Link>` | `cta-routes.test.ts` checks `href="..."` patterns, not element type — works with both `<a>` and `<Link>` | ✅ Safe |
| T5 `layout.tsx` skip-to-content `<a href="#main">` stays | Hash anchor — Next.js `<Link>` doesn't handle these the same way | ✅ Will preserve |
| T5 `mailto:` links stay as `<a>` | Not internal navigation | ✅ Will preserve |
| T6/T7/T8 use brand tokens only | `brand-tokens.test.ts` scans `src/components/` + `src/app/` for `amber-300/400/500/600` and `bg-zinc-950/900/black` — new files must use `bg-background`, `bg-card`, `text-primary` | ✅ Will comply |
| T6 placed in `(legal)/` route group | Existing `privacy/page.tsx` + `terms/page.tsx` follow this pattern — no URL prefix, just code organization | ✅ Safe |
| T7 `app/not-found.tsx` is Next.js convention | Confirmed no existing `not-found.tsx` at any level — creating one at the root is the documented Next.js pattern | ✅ Safe |
| T8 mounted in `layout.tsx` | `layout.tsx` currently renders `<Providers>{children}</Providers>` — adding `<CookieBanner />` as a sibling is safe (it's a client component, which works inside a server layout) | ✅ Safe |
| T8 SSR-safe (no hydration mismatch) | Plan specifies: render `null` on first render, show banner after `useEffect` — standard pattern | ✅ Safe |
| T9 e2e job needs Postgres service + seed | `seed.ts` exists at `src/lib/db/seed.ts`; `package.json` has `db:seed` script; `auth-flow.spec.ts` + `seed-data.spec.ts` require seeded DB | ✅ Safe |
| T9 `continue-on-error: true` initially | Per status_11.md plan + prevents flakiness blocking PRs | ✅ Plan-conformant |
| No `process.env.*` direct access in any new code | All new routes/components read from `env` module or `auth()` | ✅ Safe |
| No `as any` | TypeScript strict mode preserved — all new code uses proper types | ✅ Safe |
| No layer violations | T3/T4: Layer 1 (app/api) → Layer 2 (features/auth/queries) → Layer 4 (lib/db, lib/storage). T5/T6/T7/T8: Layer 1 (app/components). T9: Layer 0 (.github) | ✅ Safe |
| New test files picked up by vitest | `vitest.config.ts` include pattern is `'src/tests/unit/**/*.test.{ts,tsx}'` — all new tests go in `src/tests/unit/` | ✅ Safe |

**Plan fully validated.** Proceeding to implementation.

---

## Phase 4 · IMPLEMENT — T3 (RED → GREEN → REFACTOR)

### T3.1 — RED: Write failing tests for T3
RED confirmed — all 10 tests fail (files don't exist yet). Now let me implement T3.

### T3.2 — GREEN: Implement T3
### T3.3 — VERIFY: T3 tests + lint + typecheck
All 10 T3 tests pass. Let me also run lint + typecheck to make sure the new queries.ts compiles cleanly.
T3 complete: 10/10 tests pass, lint clean, typecheck clean. Now T4.

---

### T4 — GDPR account deletion (RED → GREEN → VERIFY)

The `deleteUserAccount` function is already implemented in T3's `queries.ts`. I just need the route handler + the R2 bulk-delete helper + the tests.
RED confirmed — 10 of 12 tests fail (the 2 passing tests check `queries.ts` which already has `deleteUserAccount` from T3). Now let me add the R2 helper and the route.
Now the DELETE route:
T4 complete: 12/12 tests pass, lint clean, typecheck clean. Now T5.

---

### T5 — Replace internal `<a>` with `<Link>` (RED → GREEN → VERIFY)
First the RED test — I'll add a new test block to `cta-routes.test.ts` that enforces `<Link>` usage for internal routes:
RED confirmed — 11 of 18 new T5 tests fail (the import + anchor checks across navbar, hero, examples, use-cases, footer, cta-amber, cta-gradient, cta-ghost, dashboard). Now let me refactor all 9 files.
### T5.2 — GREEN: Refactor all 9 files

**1. navbar.tsx** — replace 6 `<a href>` for internal routes with `<Link>`:
**2. hero.tsx** — replace the Start Creating `<a>` with `<Link>`:
**3. dashboard/page.tsx** — replace 2 `<a href>` with `<Link>`:
**4. examples.tsx** — replace the card `<a>` with `<Link>`:
**5. use-cases.tsx** — replace the card `<a>` with `<Link>`:
**6. footer.tsx** — replace `<a href>` for internal routes (Privacy/Terms/Contact + footer link columns) with `<Link>`, but keep `mailto:` as `<a>`:
**7. cta-amber.tsx** — `<a>` → `<Link>`:
**8. cta-gradient.tsx** — `<a>` → `<Link>`:
**9. cta-ghost.tsx** — `<a>` → `<Link>`:
### T5.3 — VERIFY
All 29 cta-routes tests pass (was 11, now 29 with the 18 new T5 tests). Let me also run lint + typecheck + the full suite to confirm no regressions:
T5 complete: 445/445 tests pass (was 405, +18 T5 +22 T3/T4 = +40 new tests, 0 regressions), lint clean, typecheck clean. Now T6.

---

### T6 — Implement `/pricing`, `/blog`, `/contact` pages (RED → GREEN → VERIFY)
RED confirmed — all 18 tests fail. Now let me create the 3 pages. I'll use `Link` (not `<a>`) per T5 discipline, and pull pricing data from the existing `tier-limits.ts` for accuracy.
Now let me create all 3 pages:
### T6.3 — VERIFY
17/18 pass — let me see which one failed:
The pricing page uses `<Link href="/create">` (T5 discipline) — but the test regex `href=['"]\/create['"]` expects the literal `href="/create"` which IS what `<Link href="/create">` produces. The issue is the plan cards use `href={plan.cta.href}` (dynamic expression) not `href="/create"` (literal). Let me look at the pricing page — the Free tier has `cta: { label: 'Start creating', href: '/create' }` which becomes `href={plan.cta.href}`. The regex won't match this dynamic form.

The fix: the test is checking for the literal `href="/create"` pattern. Since I'm using `<Link href={plan.cta.href}>` with the value coming from the PLANS array (which has `'/create'` as a string), the source-reading test won't find `href="/create"` literally. Let me update the test to be more flexible — it should accept either the literal form OR the dynamic form, as long as `/create` appears as a link target somewhere.

Actually, the simpler fix: add a literal `Link href="/create"` somewhere on the page (e.g., in the footnote), OR update the test to also accept `href: '/create'` in the data array. The cleanest approach is to update the test to check for `/create` appearing in any `href` context (literal or in the data array).
T6 complete: 18/18 tests pass. Now T7.

---

### T7 — Custom `not-found.tsx` page (RED → GREEN → VERIFY)
RED confirmed. Now implement:
T7 complete: 8/8 tests pass, lint clean, typecheck clean. Now T8.

---

### T8 — GDPR cookie consent banner (RED → GREEN → VERIFY)
The test file fails to load because `@/components/app/cookie-banner` doesn't exist yet. The `vi.resetModules()` in `beforeEach` causes the import to fail at module resolution. This is expected RED behavior. Now let me implement the component:
Now mount it in `layout.tsx`:
All 8 T8 tests pass. Let me also run lint + typecheck:
ESLint flags `react-hooks/set-state-in-effect` — calling `setShouldShow` inside `useEffect` is flagged by the new React 19 hooks plugin. This is actually a legitimate pattern (reading from localStorage after mount), but the linter wants me to handle it differently. The fix: use the `useSyncExternalStore` pattern, OR add an eslint-disable comment with justification. Let me use the cleaner approach — restructure to read localStorage lazily in initial state with a guard.

Actually, the cleanest fix that preserves SSR-safety AND satisfies the linter: initialize `shouldShow` to `null` (SSR), then use `useEffect` to flip it — but wrap the `setShouldShow` in a way the linter accepts. The React team's recommended pattern for "read from browser API after mount" is exactly this. The linter rule is overly aggressive here. Let me add a targeted eslint-disable with a clear justification:
The eslint-disable comment syntax is malformed — the linter is parsing the comment text as part of the rule name. The correct syntax is `// eslint-disable-next-line react-hooks/set-state-in-effect` followed by a separate `//` comment for the justification.
Interesting — the linter now says the rule is `react-hooks/set-state-in-effect` but the disable directive is "unused" — meaning the rule didn't actually fire on line 48 (it fired on line 41, the `setShouldShow(true)` in the catch block). The disable needs to be on the line BEFORE the actual `setShouldShow` call. Let me restructure — the cleanest approach is to read localStorage into a variable first, then call setState once at the end of the effect:
The rule fires on line 46 (`setShouldShow(shouldShowBanner)`). The linter is detecting that `setShouldShow` is called inside `useEffect`. This is the React 19 `react-hooks/set-state-in-effect` rule — it's quite strict. The React team's recommended escape hatch is `useSyncExternalStore` for reading browser-only APIs. Let me refactor to that pattern — it's actually cleaner and the officially blessed approach:
Now I need to update the test — the `useState`/`localStorage` source-reading tests need to change since I'm now using `useSyncExternalStore`:
Lint clean, all 8 T8 tests pass. T8 complete. Now T9 — the CI workflow update.

---

### T9 — Add Playwright E2E job to CI workflow
Let me also check the seed script to understand what env vars + commands the e2e job needs:
Now I have what I need. Let me update the CI workflow:
Let me verify the YAML syntax:
YAML syntax valid. T9 complete (no tests — CI config change). Now the final verification.

---

## Phase 5 · FINAL VERIFY — Full pre-commit chain
Excellent — **479/479 tests pass** (was 405 after T1+T2, now +74 from T3–T8), lint clean, typecheck clean. Now the build:
Build succeeds cleanly. The route table now shows:
- **22 routes** (was 17 before T3-T9) — added `/api/user`, `/api/user/export`, `/blog`, `/contact`, `/pricing`, `/_not-found` (custom)
- All 3 new content pages (`/pricing`, `/blog`, `/contact`) are `○ Static` — statically prerendered, perfect for SEO
- The 2 new API routes (`/api/user`, `/api/user/export`) are `ƒ Dynamic` — correct for authenticated endpoints
- `/_not-found` is now `○ Static` — the custom 404 page is prerendered

## Phase 6 · DELIVER — Knowledge transfer
---

# T3–T9 Execution Report — Complete

## Executive Summary

All 7 remaining tasks from `status_11.md` have been implemented via strict TDD. Combined with the earlier T1+T2, **all 9 remediation tasks are now complete**. The pre-commit chain is fully GREEN: **479 tests passing** (+83 new across T1–T9, 0 regressions), **lint clean**, **typecheck clean**, **build clean** with 22 routes compiled.

## What was delivered in this session (T3–T9)

| Task | Files created | Files edited | New tests |
|---|---|---|---|
| **T3** GDPR data export | `src/app/api/user/export/route.ts`, `src/features/auth/queries.ts` | — | 10 |
| **T4** GDPR account deletion | `src/app/api/user/route.ts` | `src/lib/storage/r2.ts` (+`deleteUserMedia`) | 12 |
| **T5** `<a>` → `<Link>` | — | 9 files (navbar, hero, dashboard, examples, use-cases, footer, 3 CTA primitives) | 18 |
| **T6** /pricing, /blog, /contact | 3 pages in `src/app/(legal)/` | — | 18 |
| **T7** Custom 404 | `src/app/not-found.tsx` | — | 8 |
| **T8** Cookie banner | `src/components/app/cookie-banner.tsx` | `src/app/layout.tsx` (mount) | 8 |
| **T9** E2E in CI | — | `.github/workflows/ci.yml` (+e2e job) | 0 (config) |
| **Total** | **8 new files** | **12 edited files** | **+74 tests** |

## Key design decisions

- **T3/T4 use `auth()` not `verifySession()`** — per AGENTS.md pitfall #24, API routes return 401 JSON, not redirects. Pattern mirrors the existing `download/route.ts`.
- **T4 collects R2 keys BEFORE the CASCADE delete** — after `db.delete(users)`, the projects table is wiped, making it impossible to find the keys. The `deleteUserAccount` function returns the collected keys, and the route handler passes them to `deleteUserMedia`.
- **T4 R2 cleanup is best-effort** — DB deletion is the source of truth for "account deleted". R2 errors are logged but don't fail the request. The Privacy Policy §4 promises deletion "within 30 days" — we delete immediately when R2 is reachable.
- **T5 preserves `<a>` for hash anchors + mailto:** — `layout.tsx` skip-to-content (`<a href="#main">`) and footer `mailto:` links stay as `<a>` because Next.js `<Link>` doesn't handle these the same way.
- **T6 pricing page uses `TIER_LIMITS` + `FULL_PIPELINE_COST` constants** — single source of truth with the billing feature. The plan table auto-calculates "~N full videos/month" from the credit math.
- **T8 uses `useSyncExternalStore`** — the React 19-blessed pattern for reading browser-only APIs (localStorage) without triggering the `react-hooks/set-state-in-effect` lint rule. SSR-safe via `getServerSnapshot` returning `false`.
- **T9 uses `continue-on-error: true`** — E2E flakiness won't block PRs while the CI environment is being shaken out. Flip to required once stable.

## Compliance status

The Privacy Policy now matches the implementation:
- **§4 Data Retention** — "delete your account at any time, which triggers a CASCADE deletion" → ✅ `DELETE /api/user` implemented
- **§4** — "R2-stored media files are deleted within 30 days" → ✅ `deleteUserMedia` deletes immediately (better than promised)
- **§6 Portability** — "receive your data in a machine-readable format" → ✅ `GET /api/user/export` implemented
- **§6 Erasure** — "request deletion of your account and associated data" → ✅ `DELETE /api/user` implemented
- **Cookie consent** → ✅ `CookieBanner` mounted in layout

## Final pre-commit chain results

```
pnpm lint         → clean (0 warnings, 0 errors)
pnpm typecheck    → clean (0 errors)
pnpm test         → 479/479 pass (53 files, +83 vs baseline 396)
pnpm build        → succeeds, 22 routes (was 17, +5 new + custom /_not-found)
```

## Suggested next steps

1. **Commit + push** all T1–T9 changes so they're on `main` and get picked up by CI (the new `e2e` job will run on the PR).
2. **Fix the production env var** (still outstanding from the live site validation): set `NEXT_PUBLIC_APP_URL=https://storyintovideo.jesspete.shop` + `AUTH_URL=https://storyintovideo.jesspete.shop` in production, redeploy. T1 will now catch any future misconfiguration at boot; T2 will surface it to `/api/health` monitoring.
3. **Verify the live site** after redeploy: `curl https://storyintovideo.jesspete.shop/api/health` should show `config.healthy: true`; `/dashboard` should redirect to the HTTPS sign-in URL; `/pricing`, `/blog`, `/contact` should return 200 with proper metadata; unknown URLs should show the custom 404; the cookie banner should appear on first visit.
4. **Flip T9 `continue-on-error: false`** once the E2E job has passed cleanly on 3+ PRs — makes E2E a required gate.
5. **Consider follow-up work** (not part of T1–T9): provision real credentials for Neon/OpenAI/Replicate/ElevenLabs/Stripe/Inngest/Upstash/R2, run migrations against real Neon, end-to-end validate the AI pipeline (especially IP-Adapter character consistency — Risk R1).

---

I'll create a clean tar archive of the remediated codebase, excluding the heavy/regenerable folders. Let me first verify the project structure, then create the archive.
The codebase is 1.2GB total, but 1.0GB is in node_modules + .next + .git (which we'll exclude). The actual source should be quite small. Let me also check for other heavy/regenerable artifacts that shouldn't be in the archive, then create it.
Let me check what's in the .env files (they're in .gitignore — may contain secrets that should never go to GitHub):
The .env files contain placeholder values (sk-test-key, r8_test_token, etc.), not real secrets. Still, they're in `.gitignore` and shouldn't be in a GitHub refresh. Per the user's explicit instruction, I'll exclude only `node_modules`, `.next`, `.git` — but I'll also note that `.env*` files (except `.env.example`) are in `.gitignore` and would normally not be committed. I'll leave them in the archive since the user was specific, and they're all placeholder values anyway.

Let me also verify the download directory exists, then create the archive:
Now let me create the tar archive. I'll use `tar` with `--exclude` flags, being careful to exclude the exact folders the user specified.
Archive created successfully. Let me verify it — check the size, list the top-level contents, and confirm the excluded folders are absent:
Archive is 105MB. Let me verify the key remediated files from T1–T9 are present in the archive, and check what's taking up the space:
The grep for key remediated files came back empty — let me check why (the regex alternation syntax may be off). Also I see there's a 53MB `backup/` folder (a tar.gz of the production build) and a large `skills/` directory with design templates. Both are in `.gitignore` (`backup/` explicitly, and `skills/` is bundled skill packs). Let me verify the key files more carefully:
All remediated files are present:
- **T1/T2**: `src/lib/env/index.ts`, `src/app/api/health/route.ts` ✓
- **T3**: `src/app/api/user/export/route.ts`, `src/features/auth/queries.ts` ✓
- **T4**: `src/app/api/user/route.ts` ✓
- **T6**: `src/app/(legal)/pricing/page.tsx`, `blog/page.tsx`, `contact/page.tsx` ✓
- **T7**: `src/app/not-found.tsx` ✓
- **T8**: `src/components/app/cookie-banner.tsx` ✓
- All new test files present ✓

Now let me create a SHA-256 checksum for integrity verification, and also generate a quick manifest of the archive's file count:
The archive is ready. Here's the complete handoff:

---

# Remediated Codebase Archive — Ready for Download

## Archive details

| Property | Value |
|---|---|
| **File path** | `/home/z/my-project/download/story-into-video-remediated-T1-T9.tar.gz` |
| **Size** | 105 MB |
| **File count** | 2,385 files |
| **SHA-256** | `e81a57a47f93950a3279c2680eae4622ed7161e02fc65dc1d7a32a58f400d002` |
| **Format** | gzip-compressed tar (`.tar.gz`) |

## What was excluded (per your request)

- ✅ `node_modules/` (796 MB)
- ✅ `.next/` (51 MB — build output)
- ✅ `.git/` (154 MB — version history)

## Verification — all T1–T9 remediated files present

| Task | File(s) in archive | Status |
|---|---|---|
| T1 | `src/lib/env/index.ts` | ✓ |
| T2 | `src/app/api/health/route.ts` | ✓ |
| T3 | `src/app/api/user/export/route.ts`, `src/features/auth/queries.ts` | ✓ |
| T4 | `src/app/api/user/route.ts` (+ `deleteUserMedia` in `src/lib/storage/r2.ts`) | ✓ |
| T5 | 9 refactored files (navbar, hero, dashboard, examples, use-cases, footer, 3 CTA primitives) | ✓ |
| T6 | `src/app/(legal)/pricing/page.tsx`, `blog/page.tsx`, `contact/page.tsx` | ✓ |
| T7 | `src/app/not-found.tsx` | ✓ |
| T8 | `src/components/app/cookie-banner.tsx` (+ mounted in `src/app/layout.tsx`) | ✓ |
| T9 | `.github/workflows/ci.yml` (+e2e job) | ✓ |
| Tests | All 5 new test files (`user-export`, `user-delete`, `content-pages`, `not-found-page`, `cookie-banner`) | ✓ |

## Heads-up — gitignored files included in the archive

Per your explicit instruction, I only excluded `node_modules`, `.next`, `.git`. The archive therefore includes a few files that are in `.gitignore` and would **not** normally be committed to GitHub. Before pushing, you may want to delete these from your working tree:

| Path | Size | Why it's gitignored |
|---|---|---|
| `backup/story-into-video-production-2026-06-27.tar.gz` | 53 MB | Explicit `backup/` entry in `.gitignore` — production backup, not source |
| `tsconfig.tsbuildinfo` | 661 KB | `*.tsbuildinfo` in `.gitignore` — TypeScript incremental build cache |
| `.husky/_/` | small | `.husky/_/` in `.gitignore` — husky internal hooks (regenerated by `husky init`) |
| `.env`, `.env.local`, `.env.docker` | small | `.env*` (except `.env.example`) in `.gitignore` — contain placeholder secrets |

All `.env*` files contain only **placeholder values** (`sk-test-key`, `r8_test_token`, etc.) — no real secrets — so including them is a minor hygiene issue, not a security incident. But they should not be committed to GitHub.

## How to use it to refresh your GitHub repo

```bash
# 1. Extract the archive locally
tar -xzf story-into-video-remediated-T1-T9.tar.gz
cd story-into-video

# 2. (Optional) Remove gitignored artifacts before committing
rm -rf backup/ tsconfig.tsbuildinfo .husky/_/ .env .env.local .env.docker

# 3. Verify the pre-commit chain passes (after pnpm install)
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# 4. Commit + push to GitHub
git add -A
git commit -m "Remediate T1–T9: env fail-fast, health probe, GDPR export/delete, next/link, content pages, 404, cookie banner, E2E in CI"
git push origin main
```

## Suggested next steps

1. **Download** the archive from the path above.
2. **Extract + review** the diff before pushing — the `backup/` folder (53MB) is the single largest non-source artifact; removing it shrinks the archive to ~50MB if you need a leaner transfer.
3. **After pushing to GitHub**, the new `e2e` CI job (T9) will run on the PR — it has `continue-on-error: true` initially, so flakiness won't block merges.
4. **Don't forget the production env var fix** (the live site at `storyintovideo.jesspete.shop` still has `NEXT_PUBLIC_APP_URL=http://localhost:3000`): set it to `https://storyintovideo.jesspete.shop` and redeploy. T1 will now catch this class of misconfiguration at boot; T2 will surface it to `/api/health`.

---

I'll meticulously review all 4 documentation files, identify what's outdated after T1–T9, then update each to align with the current codebase. Let me start by reading each file completely.
The file is large. Let me read it in chunks to get the full picture.
These are 4 large files (3,535 lines total). I already know exactly what T1–T9 changed (I implemented them). Let me launch 4 parallel exploration agents to read each file thoroughly and produce precise edit lists, then I'll apply the edits myself.
Excellent — all 4 audits are complete. I have a precise edit map for each file. Key insight from the README audit: there's a **T-numbering collision** (the docs already use T1–T12 for a prior sprint). I'll disambiguate by calling the new work "Sprint 3 (T1–T9)" consistently across all 4 docs.

Let me create a TODO list and proceed file by file with batched MultiEdit calls.
Let me start with CLAUDE.md. I need to read the specific sections that need editing to get exact string matches, then batch the edits.
Now I have the exact text for the routes table and file tree. Let me also read the Common Pitfalls, Troubleshooting, Outstanding Issues, and Recommendations sections to get exact anchors.
I now have the complete CLAUDE.md content and a precise edit map. Let me execute the edits using MultiEdit. I'll batch them into logical groups. Starting with count updates, route table, and file tree:
Count updates and route table done. Now let me update the file tree, T1 env descriptions, T2 health, and the file tree additions:
File tree updates done. Now let me update the T1 env behavior descriptions, troubleshooting rows, outstanding issues, recommendations, and add the new "Recently Closed" section. I'll do this in a few more MultiEdit batches:
Now let me update the Outstanding Issues, Recommendations, and add the new "Recently Closed" section:
Now let me update the Recommendations section and add the new "Recently Closed (Sprint 3)" subsection:
Now let me add the "Recently Closed (Sprint 3)" section and update the remaining Lessons Learned entries. Let me find the exact anchor point:
Most edits succeeded. Let me find the exact text for the Code-Level Fixes #2 and #8 entries:
Let me update the CI/CD tech stack row and the #8 Code-Level Fixes entry:
CLAUDE.md is now fully updated. Let me mark it complete and proceed with the remaining 3 files in parallel using specialized agents that have the detailed audit reports.
All 3 remaining files have been updated. Let me mark the TODOs complete and do a quick verification pass.
Let me do a quick spot-check across all 4 files to verify the key changes landed:
Two items to check: README and PAD have 0 "Recently Closed (Sprint 3" matches (may be different heading format), and PAD has 2 stale "396" references. Let me verify:
All checks pass. The 2 "stale" 396 references in PAD are in the revision history (v1.3 entry says "396→479", v1.2 says "377→396") — these are correct historical records. The "Recently Closed" sections use slightly different heading formats across files but all content is present. Let me do one final check on the critical T1 env throw change:
All 4 documentation files have been meticulously updated. Here's a summary of what was done.

---

# Documentation Update Report — Complete

## Files updated (4 files, 3,670 lines total, +135 lines of new documentation)

| File | Lines (before → after) | Key changes |
|---|---|---|
| **CLAUDE.md** | 912 → 946 | Route count 15→22, test count 396→479/48→53, all T1–T9 changes, new "Recently Closed (Sprint 3)" section, updated pitfalls/troubleshooting/lessons learned |
| **AGENTS.md** | 602 → 628 | Same scope as CLAUDE.md, new pitfalls #59–#66, "Recently Closed (Sprint 3)" subsection |
| **README.md** | 894 → 923 | Same scope + T-numbering collision resolved (Sprint 3 label), Quick Start updated, route table + file tree expanded |
| **Project_Architecture_Document.md** | 1,127 → 1,173 | Version bumped v1.2→v1.3, ADR-004 cross-ref, new Key Files entries, new Glossary entries, CI/CD YAML updated, pre-existing ASCII tree corruption fixed |

## What was updated in each file

### Factual corrections (all 4 files)
- **Route count**: 15 → 22 (added `/api/user/export`, `/api/user` DELETE, `/pricing`, `/blog`, `/contact`, `/_not-found`)
- **Test count**: 396 → 479 unit tests, 48 → 53 files (E2E unchanged at 48 tests/9 specs)
- **T1 env behavior**: All "console.warn" mentions updated to "THROWS in production runtime, warns in dev/test"
- **T2 health endpoint**: All `/api/health` descriptions updated to include `config` + `configErrors` fields, with the critical caveat that `config.healthy=false` does NOT trigger 503

### Outstanding issues marked CLOSED (all 4 files)
- ~~Privacy Policy promises unimplemented GDPR endpoints~~ → Fixed (T3+T4)
- ~~Production env var misconfiguration goes silently undetected~~ → Fixed (T1+T2)
- ~~Navbar/dashboard/hero use raw `<a href>`~~ → Fixed (T5)
- ~~No custom `not-found.tsx`~~ → Fixed (T7)
- ~~E2E tests not in CI~~ → Fixed (T9)
- ~~No GDPR/CCPA compliance~~ → Fixed (T3+T4+T8)
- ~~Other content pages missing (`/pricing`, `/blog`, `/contact`)~~ → Fixed (T6+T7)

### Recommendations marked DONE (all 4 files)
- ~~Implement GDPR endpoints~~ → DONE (T3+T4)
- ~~Implement `/pricing`, `/blog`, `/contact`~~ → DONE (T6+T7)
- ~~Add cookie consent banner~~ → DONE (T8)
- ~~Replace internal `<a href>` with `<Link>`~~ → DONE (T5)
- ~~Promote env host-mismatch warning to thrown error~~ → DONE (T1+T2)
- ~~Add E2E tests to CI~~ → DONE (T9)

### File tree updates (all 4 files)
- Added `(legal)/pricing/`, `(legal)/blog/`, `(legal)/contact/` pages
- Added `api/user/route.ts` (DELETE) + `api/user/export/route.ts` (GET)
- Added `app/not-found.tsx`
- Added `components/app/cookie-banner.tsx` (7→8 app components)
- Added `features/auth/queries.ts` (T3 getUserExportData, T4 deleteUserAccount)
- Updated `lib/storage/r2.ts` comment with `deleteUserMedia` (T4)
- Updated `lib/env/index.ts` comment with T1 throw behavior
- Updated `app/layout.tsx` comment with CookieBanner mount (T8)

### New content added
- **"Recently Closed (Sprint 3 — T1–T9)" subsection** in CLAUDE.md, AGENTS.md, README.md, and PAD
- **New Common Pitfalls** (AGENTS.md #59–#66): T1 throw, T2 config caveat, T3/T4 auth pattern, T4 R2 best-effort, T5 Link carve-outs, T7 not-found Server Component, T8 useSyncExternalStore, T9 CI Postgres
- **New Troubleshooting rows** (CLAUDE.md): production boot failure, /api/health config mismatch, CI e2e continue-on-error, DELETE /api/user R2 orphans, CookieBanner hydration, E2E DB connection
- **New Key Files entries** (PAD): `api/user/route.ts`, `api/user/export/route.ts`, `features/auth/queries.ts`, `not-found.tsx`, `cookie-banner.tsx`
- **New Glossary entries** (PAD): GDPR Export, GDPR Deletion, DeleteObjectsCommand, useSyncExternalStore, best-effort R2 cleanup
- **ADR-004 cross-reference** (PAD): T1 production-runtime throw extends the build-context fallback ADR
- **CI/CD YAML** (PAD): full `e2e` job added to the example workflow

### T-numbering collision resolved
The existing docs already used T1–T12 for a prior "Audit v1 Remediation" sprint. All new work is consistently labeled **"Sprint 3 T1–T9"** across all 4 files to avoid confusion. Existing `(T1)` references in route tables (e.g., billing checkout) were prefixed with `(audit-v1 T1)` where collisions existed.

### Pre-existing drift fixed opportunistically
- **PAD**: Fixed "31 vars" typo → "30 vars" in env module comment
- **PAD**: Fixed corrupted ASCII tree lines (missing `│   ├──` prefixes)
- **CLAUDE.md**: Fixed stale "SignedDownloadWrapper extracted to its own file" claim (it was deleted in H4)
- **CLAUDE.md**: Updated CI/CD tech stack row to mention both jobs

## Verification results

| Check | CLAUDE.md | AGENTS.md | README.md | PAD |
|---|---|---|---|---|
| "Routes (22 total)" | ✅ | ✅ | ✅ | n/a (no count header) |
| "479" test count | ✅ (7 refs) | ✅ (5 refs) | ✅ (7 refs) | ✅ (6 refs) |
| "Sprint 3" mentions | ✅ (51) | ✅ (38) | ✅ (45) | ✅ (39) |
| "Recently Closed" Sprint 3 | ✅ | ✅ | ✅ | ✅ (inline) |
| Stale "396" removed | ✅ | ✅ | ✅ (0) | ✅ (only in revision history) |
| T1 "THROWS in production" | ✅ | ✅ (6) | ✅ (4) | ✅ (3) |
| New routes (4/4 files) | ✅ | ✅ | ✅ | ✅ |
| New files (4/4 files) | ✅ | ✅ | ✅ | ✅ |

All 4 files are now fully aligned with the Sprint 3 T1–T9 codebase changes. The documentation accurately reflects the current state of routes (22), tests (479 unit + 48 E2E), env validation behavior (production throw), health endpoint (config surfacing), GDPR endpoints (export + delete), navigation (`<Link>` everywhere), content pages (`/pricing`, `/blog`, `/contact`), custom 404, cookie banner, and CI E2E job.

---

I'll meticulously plan this skill file creation. First, I need to gather all exact details from the codebase — design tokens, hook implementations, component patterns, TypeScript interfaces, and configuration. Let me read the critical source files in parallel.
Now let me read the hooks, key components, and config files:
Now let me read the remaining key files: the auth-form, create-wizard, empty-state, providers, project-progress-panel, and the config files:
I now have all the exact details I need. Let me create the comprehensive skill file. This is a large document, so I'll write it in sections.
Let me verify the file was created correctly:
The skill file is created with all 20 sections + appendix. Let me do a final validation that the key details match the actual codebase:
All validations pass. Here's the summary:

---

# `storyintovideo_SKILL.md` — Complete

**File:** `/home/z/my-project/story-into-video/storyintovideo_SKILL.md`
**Size:** 1,836 lines, 68 KB
**Sections:** 20 numbered sections + Table of Contents + Appendix

## What was created

A comprehensive skill file that distills the entire project knowledge into a single reference document. Every section is directly informed by the actual codebase — I read the source files (`globals.css`, `fonts.ts`, `utils.ts`, `types/index.ts`, all 4 hooks, all 7 primitives, all config files) to extract exact values, patterns, and implementation details.

## All 20 sections covered

| # | Section | Key content |
|---|---|---|
| 1 | Project Identity & Design Philosophy | Luxury-dark cinematic aesthetic, amber-rationed principle, 4-tier CTA hierarchy, the singular purple exception |
| 2 | Tech Stack & Environment | Exact versions from `package.json`, `tsconfig.json` strict flags, ESLint flat config, Prettier config, pnpm workspace |
| 3 | Bootstrapping & Configuration | Full `pnpm create` + install commands, all 5 config files (`postcss`, `next.config`, `drizzle.config`, `components.json`, `pnpm-workspace`) |
| 4 | The Design System (Code-First) | Complete `@theme` block, critical `#febf00 ≠ amber-400` rule, typography hierarchy, all 13 keyframes, 7 `@utility` classes, scroll-reveal CSS pattern |
| 5 | Component Architecture & Patterns | 5-layer architecture, Server vs Client decision tree, `queries.ts` boundary, `verifySession()` vs `auth()` pattern, 10-section marketing composition, CTA primitive breakdown |
| 6 | Custom Hooks Deep Dive | All 4 hooks with full implementation + usage notes: `useScrolled`, `useReveal`, `useReducedMotion`, `useProjectProgress` (SSE with exponential backoff) |
| 7 | Content Management | Static data pattern (10 files in `src/lib/data/`), why not `import.meta.glob` (Next.js, not Vite) |
| 8 | Accessibility (WCAG AAA) | Focus rings, skip-to-content, dual-layer reduced motion, 44px touch targets, contrast ratios, ARIA patterns, hero video `aria-hidden` |
| 9 | Anti-Patterns & Common Bugs | 20 documented bugs with root causes + fixes (amber-400, bg-zinc-950, r2.ts in client, verifySession in API, mock hoisting, Date.now collisions, T1-T9 Sprint 3 issues) |
| 10 | Debugging Guide | 16 troubleshooting scenarios with step-by-step fixes |
| 11 | Pre-Ship Checklist | Pre-commit chain, pre-deploy steps, post-deploy smoke test, CI verification, Lighthouse targets |
| 12 | Lessons Learnt | 27 lessons across architecture, auth, testing, pipeline, infrastructure, Sprint 3 |
| 13 | Pitfalls to Avoid | TypeScript, Next.js 16, React 19, Tailwind v4, Database, Storage, Security pitfalls |
| 14 | Best Practices | Code organization, component design, testing, performance, accessibility |
| 15 | Coding Patterns | Server Action, queries.ts, API route, ScrollReveal stagger, SSE, GDPR endpoint, CookieBanner, custom @utility |
| 16 | Coding Anti-Patterns | 21 "do not" rules |
| 17 | Responsive Breakpoint Reference | 6 breakpoints + key responsive patterns |
| 18 | Z-Index Layer Map | 6 z-index levels with locations |
| 19 | Color Reference (Complete) | All 19 brand tokens, chart palette, opacity variants, zinc utility colors, the singular purple exception |
| 20 | TypeScript Interface Reference | All 12 marketing interfaces + 10 component props interfaces + 8 DB enum types |

## Validation results

All key details verified against the actual codebase:
- ✅ Tech stack versions match `package.json` exactly
- ✅ Color tokens match `globals.css` `@theme` block (`#020202`, `#febf00`, `#060607`)
- ✅ 13 keyframes confirmed
- ✅ 12 TypeScript interfaces in `src/types/index.ts`
- ✅ 4 hooks confirmed (`use-scrolled`, `use-reveal`, `use-reduced-motion`, `use-project-progress`)
- ✅ 8 API route files confirmed
- ✅ 479 unit tests confirmed (matches `pnpm test` output)

This skill file is now the definitive reference for any coding agent working on the StoryIntoVideo codebase. It covers the full stack from design tokens to deployment, including every lesson learned across 3 remediation sprints (Sprint 1 pipeline wiring, Sprint 2 post-review hardening, Sprint 3 T1–T9 compliance + UX + CI).

---

I'll create the updated v2 tar archive with all the latest changes (updated docs + SKILL.md + all Sprint 3 T1–T9 code).
Archive created. Let me verify it — check size, confirm exclusions, and validate that the key updated files are present:
The grep for Sprint 3 source files came back empty (regex issue with the alternation). Let me verify those files are actually present:
All files verified. The v2 archive is ready.

---

# Updated v2 Archive — Ready for Download

## Archive details

| Property | Value |
|---|---|
| **File path** | `/home/z/my-project/download/story-into-video-remediated-v2-T1-T9.tar.gz` |
| **Size** | 105 MB |
| **File count** | 2,385 files |
| **SHA-256** | `2673ada2233d01048755b6a8d2525f9c44df2fe1659211cd24882e945badf625` |
| **Format** | gzip-compressed tar (`.tar.gz`) |

## What's new in v2 (vs v1)

| Change | v1 | v2 |
|---|---|---|
| `CLAUDE.md` | Pre-Sprint-3 state | Updated: route count 22, test count 479/53 files, T1–T9 changes, new "Recently Closed (Sprint 3)" section |
| `AGENTS.md` | Pre-Sprint-3 state | Updated: same scope + new pitfalls #59–#66 |
| `README.md` | Pre-Sprint-3 state | Updated: same scope + T-numbering collision resolved |
| `Project_Architecture_Document.md` | v1.2 | Updated: v1.3, new ADR-004 cross-ref, new Key Files + Glossary entries |
| `storyintovideo_SKILL.md` | Did not exist | **NEW** — 1,836 lines, 20 sections + appendix, complete project knowledge reference |
| Checksum | `e81a57a4...` | `2673ada2...` (different = content changed) |

## Exclusions verified

- ✅ `node_modules/` — 0 entries (796 MB excluded)
- ✅ `.next/` — 0 entries (51 MB excluded)
- ✅ `.git/` — 0 entries (154 MB excluded)

## All key files confirmed present

**Updated documentation (4 files):**
- ✅ `CLAUDE.md` (946 lines)
- ✅ `AGENTS.md` (628 lines)
- ✅ `README.md` (923 lines)
- ✅ `Project_Architecture_Document.md` (1,173 lines, v1.3)

**New skill file:**
- ✅ `storyintovideo_SKILL.md` (1,836 lines)

**Sprint 3 T1–T9 source files:**
- ✅ `src/lib/env/index.ts` (T1 — production throw)
- ✅ `src/app/api/health/route.ts` (T2 — config + configErrors)
- ✅ `src/app/api/user/export/route.ts` (T3 — GDPR export)
- ✅ `src/features/auth/queries.ts` (T3/T4 — getUserExportData + deleteUserAccount)
- ✅ `src/app/api/user/route.ts` (T4 — GDPR deletion)
- ✅ `src/lib/storage/r2.ts` (T4 — deleteUserMedia)
- ✅ `src/app/(legal)/pricing/page.tsx` (T6)
- ✅ `src/app/(legal)/blog/page.tsx` (T6)
- ✅ `src/app/(legal)/contact/page.tsx` (T6)
- ✅ `src/app/not-found.tsx` (T7)
- ✅ `src/components/app/cookie-banner.tsx` (T8)
- ✅ `.github/workflows/ci.yml` (T9 — e2e job)

**Sprint 3 test files (5 new):**
- ✅ `src/tests/unit/user-export.test.ts`
- ✅ `src/tests/unit/user-delete.test.ts`
- ✅ `src/tests/unit/content-pages.test.ts`
- ✅ `src/tests/unit/not-found-page.test.ts`
- ✅ `src/tests/unit/cookie-banner.test.tsx`

## Same heads-up as v1

The archive still includes gitignored files (placeholder `.env*` files, `backup/` folder, `tsconfig.tsbuildinfo`, `.husky/_/`) — all contain only placeholder values, no real secrets. Before pushing to GitHub, you may want to remove:

```bash
tar -xzf story-into-video-remediated-v2-T1-T9.tar.gz
cd story-into-video
rm -rf backup/ tsconfig.tsbuildinfo .husky/_/ .env .env.local .env.docker
```

## How to use

```bash
# 1. Extract
tar -xzf story-into-video-remediated-v2-T1-T9.tar.gz
cd story-into-video

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Verify the pre-commit chain passes
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# 4. Commit + push to GitHub
git add -A
git commit -m "Sprint 3 T1-T9: env fail-fast, health probe, GDPR endpoints, next/link, content pages, 404, cookie banner, E2E in CI + docs update + SKILL.md"
git push origin main
```

This v2 archive is the complete, up-to-date codebase with all Sprint 3 remediation work, updated documentation, and the new comprehensive skill file — ready to refresh your GitHub repo.

---

https://chat.z.ai/s/37e4dae9-836e-4a66-8086-84a044256440 

