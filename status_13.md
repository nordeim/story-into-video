# Status 13 — Audit-v2 Remediation Complete

**Date:** 2026-07-02
**Predecessor:** `status_12.md` (Sprint 3 T1–T9 + live-site validation + SKILL.md v8)
**Scope:** Audit-v2 findings NF-1 through NF-6 (see `REMEDIATION_PLAN_v2.md`)
**Method:** TDD — RED (failing test) → GREEN (minimum fix) → REFACTOR → VERIFY
**Result:** ✅ All 6 findings remediated. 524/524 tests pass. Lint + typecheck + build clean.

---

## Executive Summary

Audit-v2 identified 6 findings (1 Critical, 1 High, 4 Medium) that were NOT
captured by the prior audit (AUDIT_REPORT_v1.md) or the Sprint 3 T1–T9
remediation. These findings were surfaced by the live-site behavioral smoke
test at `https://storyintovideo.jesspete.shop/` and validated against the
actual codebase with file:line evidence.

All 6 findings have been remediated via TDD:

| ID | Severity | Finding | Status |
|---|---|---|---|
| NF-1 | 🔴 Critical | Live site runs `next dev` instead of `next start` (no production Dockerfile) | ✅ Fixed |
| NF-2 | 🟠 High | Missing `Content-Security-Policy` + `Strict-Transport-Security` headers | ✅ Fixed |
| NF-3 | 🟡 Medium | FAQ "7+ styles" copy drift vs 8-chip marquee (3-way drift) | ✅ Fixed |
| NF-4 | 🟡 Medium | Dead/unused exports (`getProjectVideo`, `WHISPER_MODEL` unused, `r2Client`/`BUCKET_MAP` exported) | ✅ Fixed |
| NF-5 | 🟡 Medium | Doc inaccuracy: `@aws-sdk/lib-storage` claimed "installed" but is NOT in package.json; Sentry `@sentry/nextjs` not installed | ✅ Fixed (docs) |
| NF-6 | 🟡 Medium | Pipeline steps 1, 4, 5, 6, `complete` lack try/catch → projects stuck in non-terminal status on Inngest retry exhaustion | ✅ Fixed |

**Test count:** 479 → 524 (+45 new tests across 5 new test files)
**New test files:** `security-headers.test.ts`, `faq-style-consistency.test.ts`, `dead-exports.test.ts`, `pipeline-error-handling.test.ts`, `deployment.test.ts`

---

## Detailed Remediation Summary

### NF-1 — Production Dockerfile + CI guard (🔴 Critical → ✅ Fixed)

**Root cause:** Only `Dockerfile.dev` existed (runs `pnpm dev`). No production
Dockerfile, no production docker-compose, no deployment runbook. The live site
was running `next dev --turbopack` in production (confirmed by HMR client chunks,
dev console messages, unhashed chunk names, `cache-control: no-cache` headers,
and `/sign-up` taking 18.66s for a cold compile).

**Fix:**
- Created `Dockerfile` (production, multi-stage: deps → builder → runtime)
  - `node:24-alpine` base, installs `ffmpeg` + `curl`
  - Runs `pnpm build` in builder stage
  - Runs `pnpm start` (which invokes `next start`) in runtime stage
  - `NODE_ENV=production`, non-root user, healthcheck on `/api/health`
- Created `docker-compose.prod.yml` (only `web` service; Neon + Upstash are external)
- Created `docs/DEPLOYMENT_RUNBOOK.md` (full deployment process + troubleshooting)
- Added CI guard step in `.github/workflows/ci.yml` that greps `.next/` for
  `hmr-client` and fails the build if found (prevents future dev-mode regressions)
- Created `src/tests/unit/deployment.test.ts` (18 tests verifying all artifacts)

**Verification:** Build output contains NO `hmr-client` chunks (CI guard passes).

### NF-2 — CSP + HSTS headers (🟠 High → ✅ Fixed)

**Root cause:** `next.config.ts` `headers()` returned 4 security headers but
omitted `Content-Security-Policy` (no browser-level XSS mitigation) and
`Strict-Transport-Security` (no origin-level HSTS; Cloudflare mitigates at
edge only, breaking defense-in-depth).

**Fix:**
- Added `Content-Security-Policy` with a restrictive policy:
  `default-src 'self'`; `script-src 'self' 'unsafe-inline'` (Next.js requires
  inline for router state); `style-src 'self' 'unsafe-inline'` (Tailwind v4);
  `img-src 'self' data: https:`; `font-src 'self'`; `connect-src 'self'`;
  `media-src 'self'`; `frame-ancestors 'none'`; `base-uri 'self'`;
  `form-action 'self'`; `object-src 'none'`
- Added `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- Extracted CSP into a `const CSP_POLICY` for readability
- Created `src/tests/unit/security-headers.test.ts` (8 tests verifying all
  directives are present)

**Note:** `'unsafe-inline'` is required for Next.js App Router (inline `<script>`
chunks). A nonce-based CSP is the production-hardened alternative — deferred to
a future hardening sprint.

### NF-3 — FAQ style drift (🟡 Medium → ✅ Fixed)

**Root cause:** Three independent sources of truth were never reconciled:
- DB enum `visual_style`: 9 values (includes `comic`)
- Marketing `STYLE_CHIPS` array: 8 values (no `comic` — locked by spec)
- FAQ copy: "7+ visual styles including Ghibli, Oil Painting, Anime, Realistic,
  Cyberpunk, Watercolor, and Comic" — wrong count (7 vs 8), omits Medieval +
  Japanese animation, includes Comic (not in chips)

**Fix:**
- Updated `src/lib/data/faq-items.ts` answer to: "Choose from 8 visual styles
  including Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic,
  Cyberpunk, and Watercolor"
- Did NOT add `Comic` to `STYLE_CHIPS` (regression test `style-chips.test.ts`
  explicitly forbids it — it was a prior drift that was deliberately removed)
- Did NOT remove `comic` from the DB enum (PostgreSQL can't cleanly DROP VALUE)
- Created `src/tests/unit/faq-style-consistency.test.ts` (5 tests verifying the
  FAQ count matches `STYLE_CHIPS.length`, all chip labels appear, no "Comic")

### NF-4 — Dead/unused exports (🟡 Medium → ✅ Fixed)

**Root cause:** Exports accumulated across sprints without cleanup.

**Fix:**
- Removed `getProjectVideo` from `src/features/pipeline/queries.ts` (was only
  in a test mock, never used by any feature)
- Removed the `getProjectVideo` mock from `pipeline-sprint5.test.ts`
- Removed the `export` keyword from `r2Client` + `BUCKET_MAP` in `r2.ts`
  (kept as internal `const`; `export type { BucketName }` stays)
- **Kept** `WHISPER_MODEL` in `openai.ts` and **made it actually used** —
  changed `align-subtitles.ts` from hardcoded `model: 'whisper-1'` to
  `model: WHISPER_MODEL` (centralizes the model name for future updates)
- Updated 3 test files that mock `@/lib/ai/openai` to include `WHISPER_MODEL`
  in the mock (`sprint4.test.ts`, `pipeline-sprint5.test.ts`, `analyze-story.test.ts`)
- **Kept** `getSignedUploadUrl` (future client-direct-to-R2 uploads)
- **Kept** `signOut` (E2E tests + future logout button)
- Created `src/tests/unit/dead-exports.test.ts` (8 tests verifying the cleanup)

### NF-5 — Documentation accuracy (🟡 Medium → ✅ Fixed)

**Root cause:** `CLAUDE.md` and `remediation_execution_summary.md` claimed
`@aws-sdk/lib-storage` was "installed" for the H5 refactor — but the dep is
NOT in `package.json`. Sentry status was also ambiguous.

**Fix:**
- Corrected `CLAUDE.md` H5 entry: "`@aws-sdk/lib-storage` is NOT yet installed —
  run `pnpm add @aws-sdk/lib-storage` before starting the refactor"
- Corrected `CLAUDE.md` Sentry entry: "`SENTRY_DSN` is in the env schema but
  `@sentry/nextjs` is NOT installed (run `pnpm add @sentry/nextjs` + wire
  `sentry.{client,server,edge}.config.ts` + wrap `next.config.ts`)"
- Marked `remediation_execution_summary.md` as **SUPERSEDED** with a header
  pointing to `status_12.md` / `status_13.md` and listing the specific
  inaccuracies (H2 closed, H5 dep not installed, test count outdated)
- Did NOT attempt the H5/M3/Sentry refactors (they are feature-level work,
  not bug fixes — deferred to a follow-up sprint)

### NF-6 — Pipeline error handling gap (🟡 Medium → ✅ Fixed)

**Root cause:** Only the `moderate` step and the image-moderation branches
called `setProjectFailed()`. Steps 1 (analyze-story), 4 (synthesize-voiceover),
5 (align-subtitles), 6 (assemble-video), and `complete` did NOT wrap their work
in try/catch. If Inngest exhausted its 3 retries, the project row stayed in a
non-terminal status (e.g., `synthesizing_voice` at 65%) forever — a silent
user-trust bug (ghost "in progress" projects with no error message).

**Fix:**
- Wrapped steps 1, 4, 5, 6 in try/catch that:
  - Calls `setProjectFailed(projectId, "<step> failed: <message>")` on error
  - Re-throws the error (so Inngest still retries — if the retry succeeds, the
    project status will be updated to the next step's progress)
- The `complete` step is special: if `updateProjectProgress('completed', ...)`
  fails, it logs the error but does NOT call `setProjectFailed` — the video is
  already in R2 (uploaded in Step 6), so the user can still download it via
  `/api/projects/[id]/download` (which checks `videoKey` presence, not
  `status === 'completed'`). Marking it failed would hide a working video.
- Created `src/tests/unit/pipeline-error-handling.test.ts` (6 tests: one per
  step that should call `setProjectFailed`, one for the `complete` step that
  should NOT, one happy-path test)

---

## Test Inventory (Final)

| Test file | Tests | Purpose |
|---|---|---|
| `security-headers.test.ts` (new) | 8 | NF-2: CSP + HSTS headers present |
| `faq-style-consistency.test.ts` (new) | 5 | NF-3: FAQ aligns with STYLE_CHIPS |
| `dead-exports.test.ts` (new) | 8 | NF-4: dead exports removed, WHISPER_MODEL used |
| `pipeline-error-handling.test.ts` (new) | 6 | NF-6: every step calls setProjectFailed on error |
| `deployment.test.ts` (new) | 18 | NF-1: production Dockerfile + docker-compose + runbook + CI guard |
| All 53 existing test files | 479 | (unchanged — no regressions) |
| **Total** | **524** | 58 test files, all passing |

---

## Files Changed

### New files (8)
- `Dockerfile` — production multi-stage Dockerfile (next start)
- `docker-compose.prod.yml` — production compose (web service only)
- `docs/DEPLOYMENT_RUNBOOK.md` — full deployment process + troubleshooting
- `REMEDIATION_PLAN_v2.md` — audit-v2 TDD task cards
- `status_13.md` — this file
- `src/tests/unit/security-headers.test.ts`
- `src/tests/unit/faq-style-consistency.test.ts`
- `src/tests/unit/dead-exports.test.ts`
- `src/tests/unit/pipeline-error-handling.test.ts`
- `src/tests/unit/deployment.test.ts`

### Modified files (10)
- `next.config.ts` — added CSP + HSTS headers (NF-2)
- `src/lib/data/faq-items.ts` — updated FAQ visual-style answer (NF-3)
- `src/features/pipeline/queries.ts` — removed `getProjectVideo` (NF-4)
- `src/lib/ai/openai.ts` — kept `WHISPER_MODEL` (now actually used) (NF-4)
- `src/features/pipeline/domain/align-subtitles.ts` — use `WHISPER_MODEL` constant (NF-4)
- `src/lib/storage/r2.ts` — removed `export` from `r2Client`/`BUCKET_MAP` (NF-4)
- `src/features/pipeline/inngest.ts` — wrapped 5 steps in try/catch (NF-6)
- `src/tests/unit/pipeline-sprint5.test.ts` — removed `getProjectVideo` mock + added `WHISPER_MODEL` (NF-4)
- `src/tests/unit/sprint4.test.ts` — added `WHISPER_MODEL` to mock (NF-4)
- `src/tests/unit/analyze-story.test.ts` — added `WHISPER_MODEL` to mock (NF-4)
- `.github/workflows/ci.yml` — added dev-chunk CI guard step (NF-1)
- `CLAUDE.md` — corrected H5 + Sentry status (NF-5)
- `remediation_execution_summary.md` — added SUPERSEDED header (NF-5)

---

## Verification (Final)

```
=== 1. LINT ===        ✅ 0 errors (eslint .)
=== 2. TYPECHECK ===   ✅ 0 errors (tsc --noEmit)
=== 3. TEST ===        ✅ 524/524 passed (58 test files, 27.30s)
=== 4. BUILD ===       ✅ next build succeeds (22 routes: 13 static, 9 dynamic)
=== 5. CI GUARD ===    ✅ no hmr-client chunks in .next/ output
```

---

## Deferred Items (NOT in audit-v2 scope)

These remain open and should be triaged into a follow-up sprint:

1. **H5 — FFmpeg stream-to-R2** (`@aws-sdk/lib-storage`) — eliminates `/tmp` OOM
   risk for large 4K videos. Dep NOT installed; refactor requires both
   `pnpm add @aws-sdk/lib-storage` and rewriting `assemble-video.ts`.
2. **M3 — Character image R2 upload** — `referenceImageKey` stores Replicate CDN
   URLs, not R2 keys. Pipeline Step 2 refactor needed.
3. **Sentry integration** — `@sentry/nextjs` NOT installed. `SENTRY_DSN` is in
   env schema only.
4. **Bundle size monitoring** — `next/bundle-analyzer` not configured.
5. **Visual regression testing** — pixel-perfect verification is manual.
6. **E2E CI `continue-on-error: true`** — flip to `false` after 3 clean PRs.
7. **Stripe `PRICE_IDS`** — still placeholder values; real Stripe products needed.
8. **`REPLICATE_SDXL_IPADAPTER_MODEL`** — default is placeholder; operator must
   set to `lucataco/sdxl-ipadapter:<sha>` for character consistency.
9. **Nonce-based CSP** — current CSP uses `'unsafe-inline'` for script-src;
   upgrade to nonce-based in a future hardening sprint.

---

## Next Steps

1. **Commit + push** all audit-v2 changes to `main` so CI runs the new guard.
2. **Deploy** using the new production Dockerfile:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   node scripts/verify-deployment.js
   ```
3. **Verify NF-2 headers** appear on the live site after deploy:
   ```bash
   curl -I https://storyintovideo.jesspete.shop/ | grep -i "content-security-policy\|strict-transport"
   ```
4. **Verify NF-1** the site is running `next start` (not `next dev`) — check
   that the browser console no longer emits `[HMR] connected` / `[Fast Refresh]`
   messages, and JS chunk names are content-hashed (not source-path names).
5. **Triage** the 9 deferred items above into a follow-up sprint.
6. **Update `storyintovideo_SKILL.md`** to v9 with the audit-v2 outcomes (524
   tests, new files, CSP/HSTS headers, production Dockerfile, pipeline error
   handling pattern).
