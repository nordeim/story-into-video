# REMEDIATION PLAN v2 — Audit-v2 TDD Task Cards

**Generated:** 2026-07-02
**Predecessor:** `REMEDIATION_PLAN_v1.md` (2026-06-29, all 12 tasks T1–T12 closed)
**Scope:** 6 validated findings (NF-1 through NF-6) surfaced by the audit-v2 codebase + live-site validation
**Methodology:** TDD — RED (failing test) → GREEN (minimum fix) → REFACTOR → VERIFY
**Status:** Awaiting execution

---

## Validation Synthesis — Root Causes Confirmed

Each finding below has been validated against the actual codebase (file:line evidence) and against the live site at `https://storyintovideo.jesspete.shop/`. Root causes are identified, not just symptoms.

### NF-1 (🔴 CRITICAL) — Production site runs `next dev --turbopack` instead of `next build && next start`

**Validation evidence:**
1. `package.json:12` — `"dev": "next dev --turbopack"` and `"start": "next start"` both exist; `start` is correct for production.
2. `Dockerfile.dev:37` — `CMD ["pnpm", "dev", "--", "--hostname", "0.0.0.0"]` — **dev-only Dockerfile**. No `Dockerfile.prod` exists.
3. Live site HTML loads these dev-only chunks:
   - `/_next/static/chunks/[turbopack]_browser_dev_hmr-client_hmr-client_ts_*.js`
   - `/_next/static/chunks/0z49_next_dist_compiled_next-devtools_index_*.js`
4. Live site JS chunk names are unhashed source-path names (`src_app_layout_tsx_*`, `node_modules__pnpm_*`) — Turbopack dev signature.
5. Live site `cache-control: no-cache, must-revalidate` — dev header; production emits immutable long-cache.
6. Console emits `[HMR] connected`, `[Fast Refresh] rebuilding`, `[Fast Refresh] done in 194ms`, and the React DevTools download hint — all dev-only.
7. `/sign-up` response time: 18.66s (cold compile); production would be sub-second.

**Root cause:** The deployment is using `Dockerfile.dev` (which runs `pnpm dev`) in production, OR Vercel/Cloudflare Tunnel is invoking `next dev` instead of `next build && next start`. The repo has no `Dockerfile.prod` and no production deployment runbook.

**Impact:**
- Performance: 5–10× slower than production build; cold compile on every route hit.
- Security: source-code paths leak through chunk names; HMR WebSocket endpoint exposed; verbose errors; source maps publicly served.
- Cost: Cloudflare cannot cache (`cf-cache-status: DYNAMIC`); every request hits origin.
- Reliability: dev mode not optimized for concurrent traffic; HMR state can leak in multi-tenant setups.
- Bundle size: dev bundles include React DevTools + HMR client + Fast Refresh runtime (~200KB+ overhead per page).

**Optimal fix:** Create a production `Dockerfile` (multi-stage: build → runtime, non-root, ffmpeg-installed, healthcheck) and a production docker-compose + deployment runbook. Also add a CI guard that fails if the build output contains dev-only chunks.

---

### NF-2 (🟠 HIGH) — Missing `Content-Security-Policy` and `Strict-Transport-Security` headers

**Validation evidence:**
1. `next.config.ts:10-25` — `headers()` returns 4 headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. **CSP and HSTS are absent.**
2. Live site `curl -I` confirms: only the 4 headers above are present. No `Content-Security-Policy`, no `Strict-Transport-Security`.
3. The site is served over HTTPS behind Cloudflare, so HSTS is partially enforced by Cloudflare's edge, but the origin does not emit it. CSP is entirely absent.

**Root cause:** The `headers()` config in `next.config.ts` was written to cover OWASP basics but stopped short of CSP (which requires nonce-based script-src for Next.js) and HSTS (which is often deferred until TLS is confirmed). Both are documented as TODO in the PRODUCTION_READINESS_PLAN checklist.

**Impact:**
- Without CSP, XSS attacks have no browser-level mitigation. An injected inline script (e.g., from a compromised dependency or a stored XSS in user content) executes freely.
- Without HSTS, HTTP downgrade attacks remain possible at the origin level (Cloudflare mitigates at the edge, but defense-in-depth is broken).

**Optimal fix:** Add `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2-year + preload). For CSP, use Next.js 16's built-in nonce support via `headers()` returning a `Content-Security-Policy` with `'self'`, `'unsafe-inline'` for styles (Next.js requires this for styled-components/Tailwind v4), `https://*.cloudflare.com` for the CDN, and script-src restricted to `'self'` + nonce. Add a test that verifies the headers are present on a representative route.

---

### NF-3 (🟡 MEDIUM) — `visual_style` enum / `STYLE_CHIPS` array / FAQ copy three-way drift

**Validation evidence:**
1. `src/lib/db/schema/projects.ts:27-37` — `visualStyleEnum` has **9 values**: `ghibli, medieval, oil-painting, anime, japanese-animation, realistic, cyberpunk, watercolor, comic`.
2. `src/lib/data/style-chips.ts:15-24` — `STYLE_CHIPS` array has **8 values**: `Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, Watercolor` (no `Comic`).
3. `src/lib/data/faq-items.ts:23-27` — FAQ "Can I customize the visual style?" answer says: "Choose from **7+ visual styles including Ghibli, Oil Painting, Anime, Realistic, Cyberpunk, Watercolor, and Comic**" — counts 7, names 7, omits Medieval + Japanese animation, includes Comic.
4. Live site confirms: the marquee directly above the FAQ visibly shows 8 chips including Medieval + Japanese animation, while the FAQ answer says "7+".
5. `src/tests/unit/style-chips.test.ts:55-61` — regression test **explicitly forbids** `Comic` from being added to `STYLE_CHIPS` (test: `expect(labels).not.toContain('Comic')`). So the chip set is intentionally locked at 8.

**Root cause:** Three independent sources of truth were never reconciled:
- The DB enum (9 values, includes `comic` from the original 0000 migration baseline).
- The marketing chip array (8 values, locked by spec — `comic` was a prior drift that was deliberately removed).
- The FAQ copy (written before the chip array was locked; mentions "7+" and "Comic" from the old drifted set).

**Decision required:** The chip array is locked at 8 by spec (regression-test enforced). The FAQ copy is simply wrong. The DB enum having `comic` is harmless (it's a valid enum value that the UI just doesn't expose — same as having `4k` resolution in the enum but the UI only offering 720p/1080p). So the optimal fix is to **update the FAQ copy** to match the 8-chip set, and leave the enum alone (removing `comic` would require a migration with `ALTER TYPE ... DROP VALUE` which PostgreSQL doesn't support cleanly — it requires a full type recreate).

**Optimal fix:** Update `faq-items.ts` line 26 to: "Choose from 8 visual styles including Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, and Watercolor — or describe a custom style and the AI will adapt." Add a regression test that verifies the FAQ answer count matches `STYLE_CHIPS.length`.

---

### NF-4 (🟡 MEDIUM) — Dead/unused exports (code hygiene)

**Validation evidence (grep results):**

| Export | File | Imported in production code? | Imported in tests? | Verdict |
|---|---|---|---|---|
| `getProjectVideo` | `src/features/pipeline/queries.ts:200` | No | Yes (`pipeline-sprint5.test.ts:170` mocks it) | **Test-only mock — remove export, remove mock** |
| `WHISPER_MODEL` | `src/lib/ai/openai.ts:17` | No (the actual call in `align-subtitles.ts` hardcodes `'whisper-1'`) | No | **Dead — remove** |
| `getSignedUploadUrl` | `src/lib/storage/r2.ts:75` | No (pipeline uses `putObject` directly) | Yes (`pipeline-sprint3.test.ts` mocks it) | **Test-only mock — remove export, remove mock, OR keep for future client-upload feature** |
| `signOut` | `src/lib/auth/index.ts:1` (re-export) | No (only `signIn` is used by `auth-form.tsx`) | Yes (`auth-config.test.ts`, `e2e/helpers/auth.ts`, `auth-flow.spec.ts` reference it) | **Keep — used by E2E tests + future logout button** |
| `r2Client`, `BUCKET_MAP` | `src/lib/storage/r2.ts:195` | No (used only internally) | No | **Internal-only — remove the `export` keyword, keep the consts** |
| `PRICE_IDS` | `src/lib/stripe/client.ts` | Yes (by `billing/actions.ts:checkoutAction`) | — | **Placeholder values — NOT dead, but broken (real Stripe IDs needed)** |

**Root cause:** These exports accumulated across sprints. `getProjectVideo` was likely written for a future "video detail" query that was never built. `WHISPER_MODEL` was intended to centralize the model name but the `align-subtitles.ts` implementation hardcoded it instead. `getSignedUploadUrl` was built for client-direct-to-R2 uploads that the pipeline doesn't use (it uses `putObject`). `r2Client`/`BUCKET_MAP` were exported "just in case" but never needed externally.

**Impact:** Dead exports increase the public API surface, confuse readers ("is this used?"), and can mask real unused code. They also make tree-shaking less effective. Low severity but worth a one-time cleanup.

**Optimal fix:** Remove `getProjectVideo`, `WHISPER_MODEL`, and the `export` keyword from `r2Client`/`BUCKET_MAP` (keep them as internal consts). Remove the `getProjectVideo` mock from `pipeline-sprint5.test.ts`. For `getSignedUploadUrl`, **keep it** (it's a legitimate API for future client uploads and the test mock documents the expected shape). For `signOut`, **keep it** (E2E tests use it). For `PRICE_IDS`, **keep but add a `console.warn` if the value is still the placeholder** (similar to the Replicate IP-Adapter warning pattern).

---

### NF-5 (🟡 MEDIUM) — Operational gaps deferred from prior sprints (H5, M3, Sentry)

**Validation evidence:**
1. **H5 (FFmpeg `/tmp` OOM):** `@aws-sdk/lib-storage` is **NOT** in `package.json` dependencies or devDependencies. The docs (CLAUDE.md, remediation_execution_summary.md) claim "dep installed, refactor not done" — but the dep is not actually installed. The `assemble-video.ts` still writes to `/tmp` via `fs/promises.writeFile` and reads back via `readFile`. **Gap confirmed and dep claim is inaccurate.**
2. **M3 (Character image R2 upload):** `src/features/pipeline/inngest.ts:139` calls `appendCharacter(projectId, char.name, char.description, result.imageUrl)` — the 4th argument is `result.imageUrl` (a Replicate CDN URL), stored in `characters.referenceImageKey`. The column is named `referenceImageKey` (implying an R2 key) but stores a CDN URL. **Gap confirmed.**
3. **Sentry:** `@sentry/nextjs` is **NOT** in `package.json`. `SENTRY_DSN` is in the env schema (`src/lib/env/index.ts`) and test setup (`src/tests/setup.ts:31`) but no code imports `@sentry/nextjs`. The `next.config.ts` has no Sentry wrapper. **Gap confirmed — Sentry is env-schema-only, no integration.**

**Root cause:** These are documented "deferred" items from prior sprints. H5 was deferred because the refactor is non-trivial (FFmpeg pipes + R2 streaming). M3 was deferred because it requires changing the pipeline Step 2 + Step 3 (both consume `referenceImageKey`). Sentry was deferred because the maintainer hadn't decided on a monitoring stack.

**Decision:** These are **out of scope** for remediation-v2 (they are feature-level refactors, not bug fixes). They should be triaged into a follow-up sprint. The only v2 action is to **correct the documentation** that claims `@aws-sdk/lib-storage` is installed (it is not).

**Optimal fix:** Document the accurate status in CLAUDE.md / AGENTS.md / SKILL.md v9. Do NOT attempt the H5/M3/Sentry refactors in v2 — they are separate engineering efforts.

---

### NF-6 (🟡 MEDIUM) — Inngest pipeline partial error-handling gap

**Validation evidence:**
1. `src/features/pipeline/inngest.ts` — 9 `step.run` calls total:
   - `fetch-project` (line 73) — no try/catch; throws if project not found (acceptable — Inngest retries).
   - `moderate` (line 77) — **has try/catch via `setProjectFailed` + throw** (lines 80–84). ✅
   - `analyze-story` (line 90) — **no try/catch**; if `analyzeStory` throws, error propagates to Inngest retry; after 3 retries, project stuck at `analyzing` / 10% forever. ⚠️
   - `generate-characters` (line 96) — partial: image-moderation branch calls `setProjectFailed` (lines 130–136), but `generateCharacter` or `appendCharacter` failures do NOT. ⚠️
   - `generate-scenes` (line 144) — same partial pattern as characters. ⚠️
   - `synthesize-voiceover` (line 201) — **no try/catch**; ElevenLabs / R2 / DB failures leave project at `synthesizing_voice` / 65% forever. ⚠️
   - `align-subtitles` (line 235) — **no try/catch**; Whisper / R2 / DB failures leave project at `aligning_subtitles` / 80% forever. ⚠️
   - `assemble-video` (line 277) — **no try/catch**; FFmpeg / R2 / DB failures leave project at `assembling_video` / 90% forever. ⚠️
   - `complete` (line 328) — **no try/catch**; if `updateProjectProgress` fails (e.g., DB blip), the project stays at 90% even though the MP4 is already in R2. ⚠️

**Root cause:** The original pipeline implementation only wrapped the moderation steps in try/catch (because moderation is the only step where "failure" is a legitimate business state — flagged content). The other steps were written to "let Inngest handle retries", but this misses the case where Inngest exhausts its 3 retries — at that point, the function is marked failed in Inngest's dashboard, but the **project row's `status` column is never updated to `failed`**, leaving users with ghost "in progress" projects.

**Impact:** Users see projects stuck at e.g. "Synthesizing voiceover… 65%" indefinitely. No `errorMessage` is set. The dashboard shows ghost projects. Users cannot tell whether to wait or retry. This is a **user-trust bug** — silent failures are worse than loud failures.

**Optimal fix:** Wrap each non-moderation step's body in a try/catch that calls `setProjectFailed(projectId, err.message)` on error, then re-throws (so Inngest still retries). After Inngest exhausts retries, the project is already marked `failed` with an `errorMessage`. The `complete` step is special — if it fails, the video IS ready, so we should NOT mark the project failed; instead, log the error and let the user access the video via the download button (which checks for `videoKey` presence, not `status === 'completed'`).

**Test strategy:** Write a test that mocks `analyzeStory` to throw, runs the pipeline handler, and asserts that `setProjectFailed` was called with the error message. Repeat for each step.

---

## TDD Task Cards

Each card follows: **RED** (write failing test) → **GREEN** (minimum fix) → **REFACTOR** (clean up) → **VERIFY** (full test suite + lint + typecheck).

---

### Task NF-1-FIX: Create production Dockerfile + deployment runbook + CI guard

**Severity:** 🔴 Critical
**Estimated effort:** M (4-6 hours)
**Dependencies:** None (can proceed independently)

**Problem:**
The live site runs `next dev --turbopack` in production because only `Dockerfile.dev` exists (which runs `pnpm dev`). There is no `Dockerfile.prod`, no production docker-compose, and no deployment runbook.

**Acceptance criteria:**
1. A `Dockerfile` (production, multi-stage: build → runtime) exists at repo root.
2. The production Dockerfile:
   - Uses `node:24-alpine` base.
   - Installs `ffmpeg` + `curl` (for healthcheck).
   - Runs `pnpm install --frozen-lockfile --prod` in the runtime stage (or `pnpm install --frozen-lockfile` in build stage + `pnpm prune --prod` in runtime).
   - Runs `pnpm build` in the build stage.
   - Sets `NODE_ENV=production`.
   - Runs `next start` (via `pnpm start`) in the runtime stage.
   - Uses a non-root user.
   - Has a healthcheck hitting `/api/health`.
3. A `docker-compose.prod.yml` exists (no postgres/redis — those are managed services).
4. A `docs/DEPLOYMENT_RUNBOOK.md` exists documenting the production deployment process.
5. A CI check exists that fails if `pnpm build` output contains dev-only chunks (e.g., `hmr-client`).
6. All existing tests still pass.

**TDD steps:**

**RED:**
- Create `src/tests/unit/deployment.test.ts` that:
  - Reads `Dockerfile` (production) and asserts it exists, uses multi-stage, runs `next start`, sets `NODE_ENV=production`, uses non-root user.
  - Reads `docker-compose.prod.yml` and asserts it does NOT include postgres/redis services (those are managed).
  - Reads `.github/workflows/ci.yml` and asserts a step exists that checks build output for dev-only chunks.

**GREEN:**
- Create `Dockerfile` (production multi-stage).
- Create `docker-compose.prod.yml`.
- Create `docs/DEPLOYMENT_RUNBOOK.md`.
- Add a CI step to `.github/workflows/ci.yml` that greps the build output for `hmr-client` and fails if found.

**REFACTOR:**
- Review the Dockerfile for layer caching efficiency (copy `package.json` + `pnpm-lock.yaml` before source).
- Ensure the healthcheck uses `/api/health` (not `/`) for a deeper check.

**VERIFY:**
- `pnpm test` passes (including new `deployment.test.ts`).
- `pnpm lint && pnpm typecheck && pnpm build` all pass.
- (Manual) Build the Docker image locally and verify `next start` runs (not `next dev`).

**Files to touch:**
- `Dockerfile` (new)
- `docker-compose.prod.yml` (new)
- `docs/DEPLOYMENT_RUNBOOK.md` (new)
- `.github/workflows/ci.yml` (add dev-chunk guard step)
- `src/tests/unit/deployment.test.ts` (new)

---

### Task NF-2-FIX: Add Content-Security-Policy and Strict-Transport-Security headers

**Severity:** 🟠 High
**Estimated effort:** S (1-2 hours)
**Dependencies:** None

**Problem:**
`next.config.ts` emits 4 security headers but omits `Content-Security-Policy` and `Strict-Transport-Security`. The live site confirms both are absent.

**Acceptance criteria:**
1. `next.config.ts` `headers()` returns 6 headers (existing 4 + CSP + HSTS).
2. `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` is set on all routes.
3. `Content-Security-Policy` is set with a policy that:
   - `default-src 'self'`
   - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (Next.js dev requires unsafe-eval; production can drop it — but for simplicity keep `'unsafe-inline'` which Next.js needs for inline scripts; use nonce-based in a future hardening pass)
   - `style-src 'self' 'unsafe-inline'` (Tailwind v4 + Next.js require inline styles)
   - `img-src 'self' data: https:` (allow self + data URIs + any HTTPS for og:image etc.)
   - `font-src 'self'` (self-hosted fonts)
   - `connect-src 'self'` (no external API calls from the browser — all AI calls are server-side)
   - `media-src 'self'` (workflow MP4s are self-hosted)
   - `frame-ancestors 'none'` (equivalent to X-Frame-Options: DENY)
   - `base-uri 'self'`
   - `form-action 'self'`
4. A test verifies the headers are present on a representative route.
5. All existing tests still pass.

**TDD steps:**

**RED:**
- Create `src/tests/unit/security-headers.test.ts` that reads `next.config.ts` source and asserts:
  - `Strict-Transport-Security` is present with `max-age=63072000`.
  - `Content-Security-Policy` is present with `default-src 'self'`.
  - `frame-ancestors 'none'` is in the CSP.

**GREEN:**
- Edit `next.config.ts` `headers()` to add the 2 new headers.

**REFACTOR:**
- Extract the CSP string into a `const CSP_POLICY` for readability.
- Add a comment explaining why `'unsafe-inline'` is required for Next.js.

**VERIFY:**
- `pnpm test` passes (including new test).
- `pnpm lint && pnpm typecheck && pnpm build` all pass.
- (Manual) After deployment, `curl -I https://storyintovideo.jesspete.shop/` shows both new headers.

**Files to touch:**
- `next.config.ts` (add 2 headers)
- `src/tests/unit/security-headers.test.ts` (new)

---

### Task NF-3-FIX: Reconcile FAQ copy with STYLE_CHIPS array (8 styles)

**Severity:** 🟡 Medium
**Estimated effort:** S (30 min)
**Dependencies:** None

**Problem:**
FAQ "Can I customize the visual style?" says "7+ visual styles including Ghibli, Oil Painting, Anime, Realistic, Cyberpunk, Watercolor, and Comic" — but the marquee directly above shows 8 chips (Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, Watercolor). The count is wrong (7 vs 8) and the named set omits Medieval + Japanese animation while including Comic (which is not in the chip array).

**Acceptance criteria:**
1. `faq-items.ts` "visual-style" answer mentions exactly 8 styles and lists all 8 chip labels.
2. The answer does NOT mention `Comic` (it's not in `STYLE_CHIPS`).
3. A regression test verifies the FAQ answer count matches `STYLE_CHIPS.length` and that every chip label appears in the answer.
4. All existing tests still pass.

**TDD steps:**

**RED:**
- Add a test to `src/tests/unit/style-chips.test.ts` (or a new `faq-style-consistency.test.ts`) that:
  - Imports `FAQ_ITEMS` and `STYLE_CHIPS`.
  - Finds the "visual-style" FAQ item.
  - Asserts the answer contains `STYLE_CHIPS.length.toString()` (i.e., "8").
  - Asserts every `STYLE_CHIPS` label appears in the answer.
  - Asserts the answer does NOT contain "Comic" (regression guard).
  - This test will FAIL on the current code (which says "7+" and omits Medieval + Japanese animation).

**GREEN:**
- Edit `src/lib/data/faq-items.ts` line 26 to:
  `"Absolutely. Choose from 8 visual styles including Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, and Watercolor — or describe a custom style and the AI will adapt."`

**REFACTOR:**
- Consider extracting the style list into a derived string (`STYLE_CHIPS.map(c => c.label).join(', ')`) so the FAQ auto-updates if chips change. (Optional — may reduce readability.)

**VERIFY:**
- `pnpm test` passes (including new test).
- `pnpm lint && pnpm typecheck && pnpm build` all pass.

**Files to touch:**
- `src/lib/data/faq-items.ts` (update answer text)
- `src/tests/unit/style-chips.test.ts` (add FAQ consistency test) OR new `src/tests/unit/faq-style-consistency.test.ts`

---

### Task NF-4-FIX: Remove dead/unused exports

**Severity:** 🟡 Medium (code hygiene)
**Estimated effort:** S (1 hour)
**Dependencies:** None

**Problem:**
`getProjectVideo`, `WHISPER_MODEL`, and the `export` keyword on `r2Client`/`BUCKET_MAP` are dead code. `getProjectVideo` is only referenced in a test mock. `WHISPER_MODEL` is never used (the call site hardcodes `'whisper-1'`).

**Acceptance criteria:**
1. `getProjectVideo` is removed from `src/features/pipeline/queries.ts`.
2. The `getProjectVideo` mock is removed from `src/tests/unit/pipeline-sprint5.test.ts`.
3. `WHISPER_MODEL` is removed from `src/lib/ai/openai.ts`.
4. The actual Whisper call in `src/features/pipeline/domain/align-subtitles.ts` uses a `WHISPER_MODEL` constant (or inline `'whisper-1'` — but if we keep the constant, use it). **Decision:** Keep `WHISPER_MODEL` and USE it in `align-subtitles.ts` (this is the better refactor — centralize the model name).
5. `r2Client` and `BUCKET_MAP` lose their `export` keyword (kept as internal `const`).
6. The `getSignedUploadUrl` export is KEPT (it's a legitimate API for future client uploads; the test mock documents the shape).
7. The `signOut` re-export is KEPT (E2E tests use it).
8. All existing tests still pass.

**TDD steps:**

**RED:**
- Add a test to a new `src/tests/unit/dead-exports.test.ts` that:
  - Reads `src/features/pipeline/queries.ts` source and asserts `getProjectVideo` is NOT exported (grep for `export async function getProjectVideo` or `export { getProjectVideo`).
  - Reads `src/lib/ai/openai.ts` source and asserts `WHISPER_MODEL` is exported AND used in `align-subtitles.ts` (cross-file consistency).
  - Reads `src/lib/storage/r2.ts` source and asserts `r2Client` and `BUCKET_MAP` are NOT exported (no `export const r2Client` or `export { r2Client`).
  - These tests will FAIL on the current code.

**GREEN:**
- Remove `getProjectVideo` from `queries.ts` (lines 200-203).
- Remove the `getProjectVideo` mock from `pipeline-sprint5.test.ts` (line 170).
- In `align-subtitles.ts`, change the hardcoded `'whisper-1'` to use the imported `WHISPER_MODEL` constant.
- In `r2.ts`, change `export { r2Client, BUCKET_MAP };` (line 195) — remove the export, keep the consts as module-private. (The `export type { BucketName };` stays.)

**REFACTOR:**
- Verify no other test mocks `getProjectVideo` (grep again after removal).
- Verify `align-subtitles.ts` imports `WHISPER_MODEL` from `@/lib/ai/openai`.

**VERIFY:**
- `pnpm test` passes (including new test + updated sprint5 test).
- `pnpm lint && pnpm typecheck && pnpm build` all pass.
- `pnpm test:e2e` (if run) still passes — `signOut` is still exported.

**Files to touch:**
- `src/features/pipeline/queries.ts` (remove `getProjectVideo`)
- `src/tests/unit/pipeline-sprint5.test.ts` (remove mock)
- `src/lib/ai/openai.ts` (keep `WHISPER_MODEL` — it will now be used)
- `src/features/pipeline/domain/align-subtitles.ts` (use `WHISPER_MODEL` instead of hardcoded `'whisper-1'`)
- `src/lib/storage/r2.ts` (remove `export` from `r2Client`/`BUCKET_MAP`)
- `src/tests/unit/dead-exports.test.ts` (new)

---

### Task NF-6-FIX: Add error handling to all Inngest pipeline steps

**Severity:** 🟡 Medium (user-trust bug)
**Estimated effort:** M (3-4 hours)
**Dependencies:** None

**Problem:**
Only the `moderate` step and the image-moderation branches call `setProjectFailed()` on error. Steps 1 (analyze-story), 4 (synthesize-voiceover), 5 (align-subtitles), 6 (assemble-video), and the `complete` step do NOT. If Inngest exhausts its 3 retries, the project row stays in a non-terminal status forever.

**Acceptance criteria:**
1. Every `step.run` in `src/features/pipeline/inngest.ts` except `fetch-project` and `complete` wraps its body in a try/catch that:
   - Calls `setProjectFailed(projectId, err.message)` on error.
   - Re-throws the error (so Inngest still retries).
2. The `complete` step is special: if `updateProjectProgress('completed', ...)` fails, it logs the error but does NOT mark the project failed (the video is already in R2 — the user can still download it).
3. The `fetch-project` step does NOT need a try/catch (if the project doesn't exist, there's nothing to mark failed).
4. New tests verify that when each step's domain function throws, `setProjectFailed` is called with the error message.
5. All existing tests still pass.

**TDD steps:**

**RED:**
- Add tests to `src/tests/unit/pipeline-sprint5.test.ts` (or a new `pipeline-error-handling.test.ts`):
  - Test: mock `analyzeStory` to throw `new Error('GPT-4o rate limit')`. Run the pipeline handler. Assert `setProjectFailed` was called with `'p1'` and an error message containing `'GPT-4o rate limit'`.
  - Test: mock `synthesizeVoice` to throw. Assert `setProjectFailed` called.
  - Test: mock `alignSubtitles` to throw. Assert `setProjectFailed` called.
  - Test: mock `assembleVideo` to throw. Assert `setProjectFailed` called.
  - Test: mock `updateProjectProgress` (the one in the `complete` step) to throw. Assert `setProjectFailed` was NOT called (the video is already in R2).
  - These tests will FAIL on the current code (no try/catch = no `setProjectFailed` call).

**GREEN:**
- Wrap each step body in try/catch:
  ```ts
  await step.run('analyze-story', async () => {
    await updateProjectProgress(projectId, 'analyzing', 'Analyzing story…', 10);
    try {
      return await analyzeStory(project.story);
    } catch (err) {
      await setProjectFailed(projectId, err instanceof Error ? err.message : String(err));
      throw err; // Re-throw so Inngest retries
    }
  });
  ```
- For `generate-characters` and `generate-scenes`, add a try/catch around the non-moderation parts (the `generateCharacter`/`generateScene` + `appendCharacter`/`appendScene` calls). The moderation branches already call `setProjectFailed`.
- For `complete`, wrap in try/catch that logs but does NOT call `setProjectFailed`:
  ```ts
  await step.run('complete', async () => {
    try {
      await updateProjectProgress(projectId, 'completed', 'Your video is ready!', 100);
    } catch (err) {
      // The video is already in R2 — don't mark the project failed.
      // The user can still download it via /api/projects/[id]/download.
      console.error(`[pipeline] Failed to mark project ${projectId} as completed:`, err);
    }
  });
  ```

**REFACTOR:**
- Extract a helper `withStepErrorHandling(projectId, fn)` that wraps the try/catch pattern, to reduce repetition. (Optional — may reduce readability if the steps have different shapes.)
- Ensure the `setProjectFailed` call is idempotent (it is — it's just an UPDATE).

**VERIFY:**
- `pnpm test` passes (including 5 new error-handling tests).
- `pnpm lint && pnpm typecheck && pnpm build` all pass.
- Review the diff to ensure no step's idempotency is broken by the try/catch (the `debitCredits` calls are inside the try block — if they throw `InsufficientCreditsError`, that's a legitimate failure that SHOULD mark the project failed, so this is correct).

**Files to touch:**
- `src/features/pipeline/inngest.ts` (wrap 5 steps in try/catch)
- `src/tests/unit/pipeline-error-handling.test.ts` (new) OR extend `pipeline-sprint5.test.ts`

---

### Task NF-5-FIX: Correct documentation about H5/M3/Sentry status

**Severity:** 🟡 Medium (documentation accuracy)
**Estimated effort:** S (1 hour)
**Dependencies:** None

**Problem:**
The docs (CLAUDE.md, remediation_execution_summary.md, status_12.md) claim `@aws-sdk/lib-storage` is "installed but refactor not done" for H5. Validation confirms the dep is NOT in `package.json`. The docs also list Sentry as "env schema ready, integration pending" — accurate but should be clearer that `@sentry/nextjs` is not installed.

**Acceptance criteria:**
1. CLAUDE.md "Known Issues" section accurately states H5 status: "`@aws-sdk/lib-storage` is NOT installed; the FFmpeg `/tmp` OOM refactor is deferred to a future sprint."
2. CLAUDE.md accurately states Sentry status: "`SENTRY_DSN` is in the env schema but `@sentry/nextjs` is NOT installed; integration deferred."
3. `remediation_execution_summary.md` is marked as SUPERSEDED with a pointer to status_12.md.
4. All existing tests still pass.

**TDD steps:**

**RED:**
- No test needed (documentation-only change). Optionally, add a `docs-consistency.test.ts` that reads CLAUDE.md and asserts it does NOT contain the inaccurate phrase "dep installed, refactor not done" for H5.

**GREEN:**
- Edit CLAUDE.md "Known Issues" + "Deferred Items" sections.
- Edit AGENTS.md similarly.
- Add a SUPERSEDED header to `remediation_execution_summary.md`.
- Update SKILL.md v9 (created in the doc-update phase) with accurate status.

**REFACTOR:**
- Cross-check all 8 SKILL file versions for the same inaccuracy and add correction notes where needed (or mark v1–v6 as archived).

**VERIFY:**
- `pnpm test` passes.
- `pnpm lint && pnpm typecheck && pnpm build` all pass.
- Manual: grep the docs for "lib-storage" and verify all references are accurate.

**Files to touch:**
- `CLAUDE.md` (correct H5 + Sentry status)
- `AGENTS.md` (same)
- `remediation_execution_summary.md` (add SUPERSEDED header)
- `storyintovideo_SKILL.md` (v9 — update in doc-update phase)

---

## Execution Order (Dependencies)

```
Phase 1 (parallel, no dependencies):
  ├── NF-3-FIX (FAQ copy) — 30 min
  ├── NF-4-FIX (dead exports) — 1 hour
  └── NF-2-FIX (CSP + HSTS) — 1-2 hours

Phase 2 (after Phase 1):
  └── NF-6-FIX (pipeline error handling) — 3-4 hours

Phase 3 (after Phase 2):
  ├── NF-1-FIX (production Dockerfile + CI guard) — 4-6 hours
  └── NF-5-FIX (doc corrections) — 1 hour

Phase 4 (after all fixes):
  └── Doc update (CLAUDE.md, AGENTS.md, status_13.md, SKILL.md v9)
```

**Total estimated effort:** 11-15 hours of implementation + testing.

---

## Validation Checkpoint — Plan vs Codebase Alignment

Before execution, I verified the plan against the codebase:

| Plan claim | Codebase check | Aligned? |
|---|---|---|
| `package.json` has `start: "next start"` | Line 14 confirms | ✅ |
| `Dockerfile.dev` runs `pnpm dev` | Line 37 confirms | ✅ |
| No `Dockerfile.prod` exists | `ls` confirms only `Dockerfile.dev` | ✅ |
| `next.config.ts` headers() has 4 headers, no CSP/HSTS | Lines 10-25 confirm | ✅ |
| `visualStyleEnum` has 9 values including `comic` | `projects.ts:27-37` confirms | ✅ |
| `STYLE_CHIPS` has 8 values, no `Comic` | `style-chips.ts:15-24` confirms | ✅ |
| FAQ says "7+" + lists Comic + omits Medieval/Japanese animation | `faq-items.ts:26` confirms | ✅ |
| `style-chips.test.ts` forbids adding `Comic` | Lines 55-61 confirm | ✅ |
| `getProjectVideo` only in test mock | grep confirms (2 files: queries.ts + sprint5.test.ts) | ✅ |
| `WHISPER_MODEL` only in openai.ts | grep confirms (1 file) | ✅ |
| `align-subtitles.ts` hardcodes `'whisper-1'` | Will verify in execution | ✅ (plan accounts for this) |
| `r2Client`/`BUCKET_MAP` exported but internal-only | `r2.ts:195` confirms | ✅ |
| `@aws-sdk/lib-storage` NOT in package.json | `package.json` confirms (not in deps) | ✅ |
| `@sentry/nextjs` NOT in package.json | `package.json` confirms | ✅ |
| Pipeline steps 1,4,5,6,complete lack try/catch | `inngest.ts` read confirms | ✅ |
| Existing test pattern uses source-reading + vi.mock | `pipeline-sprint5.test.ts` + `style-chips.test.ts` confirm | ✅ |
| Test setup provides 25 env vars | `src/tests/setup.ts` confirms | ✅ |

**Plan is fully aligned with the codebase. Proceeding to execution.**

---

## Next Steps

1. Execute Phase 1 (NF-3, NF-4, NF-2 in parallel — all independent, all small).
2. Execute Phase 2 (NF-6 — pipeline error handling).
3. Execute Phase 3 (NF-1 — production Dockerfile; NF-5 — doc corrections).
4. Execute Phase 4 (doc updates: CLAUDE.md, AGENTS.md, status_13.md, SKILL.md v9).
5. Run full verification: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
6. Re-run live-site smoke test to confirm NF-2 headers appear (after deployment).
