# StoryIntoVideo — Remediation Plan v1.0

**Companion to:** `AUDIT_REPORT_v1.md`
**Date:** 2026-06-29
**Methodology:** TDD (RED → GREEN → REFACTOR) per `skills/test-driven-development` + `skills/tdd-workflow`
**Verification gate:** `pnpm lint && pnpm typecheck && pnpm test` must pass with zero warnings/errors after each task
**Scope:** 15 findings (2 Critical, 3 High, 6 Medium, 4 Low). 11 are actionable in code; 4 require deployment/config changes outside the repo.

---

## Guiding Principles (applied to every task)

1. **TDD discipline** — Write a failing test (RED) that reproduces the bug, then write the minimum code to pass (GREEN), then refactor (REFACTOR). One cycle per commit.
2. **Surgical changes** — Touch only the file:lines cited in the finding. No drive-by refactors. Per `skills/code-simplification` §5.
3. **Preserve behavior** — All 377 existing tests must continue to pass without modification. If a test needs to change, the finding was misunderstood.
4. **Source-reading tests for server-only modules** — Per project convention (see `auth-config.test.ts`, `proxy.test.ts`), use `readFileSync` + comment-strip + regex for modules that can't render in jsdom.
5. **`vi.hoisted()` for shared mock state**, `class` syntax for mock constructors, `.tsx` extension for JSX tests.
6. **Update worklog** — Append to `/home/z/my-project/worklog.md` after each task per the multi-agent protocol.

---

## Task Ordering (priority + dependency)

Tasks are ordered by severity, then by dependency. C-1 and C-2 are independent and can be done in parallel. H-2 depends on understanding C-1's billing flow. M-3 depends on H-2's webhook changes being stable.

| Task | Finding | Severity | Estimated effort | Depends on |
|---|---|---|---|---|
| T1 | C-1 | Critical | 1h | — |
| T2 | C-2 | Critical | 2-4h (investigation) | — |
| T3 | H-1 | High | 1.5h | — |
| T4 | H-2 | High | 2h | T1 (billing context) |
| T5 | H-3 | High | 1.5h | — |
| T6 | M-1 | Medium | 30m | — |
| T7 | M-2 | Medium | 45m | T3 |
| T8 | M-3 | Medium | 30m | — |
| T9 | M-4 | Medium | 30m | — |
| T10 | M-5 | Medium | 30m | — |
| T11 | M-6 | Medium | 4h (large sweep) | — |
| T12 | L-1 through L-4 | Low | 1h total | — |

**Total estimated effort:** ~15h for the codeable items. T2 (C-2) is investigation-heavy and may require deployment access.

---

## T1 — Fix billing upgrade form to call `checkoutAction` (C-1)

**Finding:** `src/app/(app)/billing/page.tsx:94` posts to non-existent `/api/stripe/checkout` route. `checkoutAction` exists but is never called.

**Root cause:** UI wiring mismatch. The billing page was written before the Server Action pattern was adopted; the form was never migrated.

**Optimal fix:** Convert the `<form>` to call `checkoutAction` via a Server Action binding. Two valid approaches:

- **Option A (preferred):** Use a `<form action={checkoutAction}>` with a `<button name="plan" value={plan}>` pattern. This is the Next.js 16 idiomatic way — no client JS, progressive enhancement, works without JS enabled.
- **Option B:** Create a thin wrapper Server Action `billingCheckoutAction(formData: FormData)` that extracts `plan` from formData and calls `checkoutAction(plan)`. More boilerplate but allows the form to stay as `<form action={billingCheckoutAction}>`.

**TDD steps:**

1. **RED:** Add a test in `src/tests/unit/billing-action-wiring.test.ts` that:
   - Reads the source of `src/app/(app)/billing/page.tsx`
   - Strips comments
   - Asserts the source contains `action={checkoutAction}` OR `action={billingCheckoutAction}` (not the literal string `/api/stripe/checkout`)
   - Asserts the source imports `checkoutAction` from `@/features/billing/actions`
   - This test will FAIL because the current source has neither.

2. **GREEN:** Edit `src/app/(app)/billing/page.tsx`:
   - Add `'use server'` import: `import { checkoutAction } from '@/features/billing/actions'`
   - Add a thin wrapper at top of file:
     ```tsx
     async function billingCheckoutAction(formData: FormData) {
       const plan = formData.get('plan');
       if (plan === 'creator' || plan === 'pro' || plan === 'studio') {
         await checkoutAction(plan);
       }
     }
     ```
   - Replace the form at line 94:
     ```tsx
     <form action={billingCheckoutAction} className="mt-6">
       <button type="submit" name="plan" value={plan} className="...">
         Upgrade to {plan}
       </button>
     </form>
     ```
   - Remove `method="POST"` (Server Action forms don't need it)
   - Test now PASSES.

3. **REFACTOR:** None needed — minimal change.

4. **VERIFY:** `pnpm lint && pnpm typecheck && pnpm test` all pass.

**Files touched:** `src/app/(app)/billing/page.tsx`, `src/tests/unit/billing-action-wiring.test.ts` (new)

**Risk:** Low. Server Action forms are a stable Next.js 14+ pattern. The `checkoutAction` is already implemented and tested.

---

## T2 — Diagnose & fix proxy redirect producing ERR_CONNECTION_REFUSED (C-2)

**Finding:** All 4 protected routes (`/dashboard`, `/create`, `/billing`, `/projects/*`) return `net::ERR_CONNECTION_REFUSED` for unauthenticated users on the live site.

**Root cause:** Unknown — needs investigation. Three hypotheses in AUDIT_REPORT_v1.md §C-2.

**Investigation plan (no code changes yet):**

1. **Reproduce locally:** Run `pnpm dev`, open a fresh incognito window (no cookies), visit `http://localhost:3000/dashboard`. Expected: 307 redirect to `/sign-in?callbackUrl=/dashboard`. If it works locally, the issue is deployment-specific (reverse proxy / Cloudflare Tunnel).

2. **Check deployment logs:** SSH into the deployment host or check Vercel/Cloudflare logs for the live site. Look for:
   - Errors from `proxy.ts` (the `console.warn` at line 53 for blocked hosts)
   - Errors from Auth.js (DrizzleAdapter trying to read session at Edge)
   - Connection resets from the reverse proxy

3. **Test hypothesis H-A (redirect URL origin):** Add temporary logging to `proxy.ts`:
   ```ts
   console.log('[proxy] redirecting to', signInUrl.toString());
   ```
   Deploy, visit `/dashboard` as unauthenticated, check logs. If `signInUrl.origin` is `localhost:3000` or an internal hostname, that's the bug.

4. **Test hypothesis H-B (Edge runtime DB crash):** The `auth()` wrapper from NextAuth v5 runs on the Edge runtime. If `DrizzleAdapter` is being initialized at Edge (it shouldn't be, but config drift happens), it will crash trying to reach Postgres. Check `src/lib/auth/config.ts` — the `adapter: DrizzleAdapter(db)` line executes at module load. If `db` (from `src/lib/db/index.ts`) tries to connect at module load, Edge will crash.

5. **Test hypothesis H-C (streaming response):** Less likely; the proxy returns `NextResponse.redirect()` which is a static 307, not a stream.

**Likely fix (contingent on investigation):**

- **If H-A:** Replace `new URL('/sign-in', nextUrl.origin)` with `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)`. The proxy should use the canonical public URL, not the request's origin (which may be an internal hostname behind a reverse proxy).
- **If H-B:** Move `DrizzleAdapter` initialization out of the Edge runtime path. Either:
  - Use `export const runtime = 'nodejs'` in `proxy.ts` (gives up Edge speed but fixes the DB access issue), OR
  - Configure Auth.js v5 to NOT use the adapter at Edge (only use JWT sessions, sync to DB via Server Actions). This is the documented pattern for serverless Edge deployments.
- **If H-C:** Unlikely; skip unless investigation points here.

**TDD steps:**

1. **RED:** Add a test in `src/tests/unit/proxy-redirect-url.test.ts` that:
   - Reads `src/proxy.ts` source
   - Strips comments
   - Asserts the redirect URL is constructed with `env.NEXT_PUBLIC_APP_URL` (not `nextUrl.origin`)
   - This test will FAIL because the current code uses `nextUrl.origin` at line 65-66.

2. **GREEN:** Edit `src/proxy.ts` lines 65-66:
   ```ts
   const signInUrl = new URL('/sign-in', env.NEXT_PUBLIC_APP_URL);
   signInUrl.searchParams.set('callbackUrl', nextUrl.pathname);
   ```
   - Add `import { env } from '@/lib/env';` (already imported at line 4 — verify)
   - Test now PASSES.

3. **REFACTOR:** None.

4. **VERIFY:** `pnpm lint && pnpm typecheck && pnpm test` all pass. Then deploy and verify live site redirects work.

**Files touched:** `src/proxy.ts`, `src/tests/unit/proxy-redirect-url.test.ts` (new)

**Risk:** Medium. Changing the redirect URL origin affects all auth flows. The existing `proxy.test.ts` (8 tests) must still pass. If the investigation reveals H-B (Edge DB crash), the fix is more invasive and may require moving the proxy to Node.js runtime.

**Fallback if investigation inconclusive:** Convert `proxy.ts` to use `export const runtime = 'nodejs'` and add a test verifying that. This trades Edge performance for reliability.

---

## T3 — Wrap project INSERT + credit debit in a transaction (H-1)

**Finding:** `createProjectAction` inserts the project, then debits credits. If debit throws `InsufficientCreditsError`, the project row is orphaned.

**Root cause:** No transaction wrapping the two operations.

**Optimal fix:** Wrap the INSERT + debit in a single `db.transaction()`. If the debit throws, the transaction rolls back and the project row is never committed.

**Complication:** `debitCredits` already opens its own transaction (line 111 of `billing/queries.ts`). We can't nest transactions in Drizzle/postgres.js. Two options:

- **Option A (preferred):** Add a `debitCreditsTx(tx, ...)` variant that accepts an existing transaction. `createProjectAction` opens one transaction, calls `tx.insert(projects)...`, then `debitCreditsTx(tx, ...)`. The standalone `debitCredits(userId, ...)` keeps its own transaction for callers that don't have one (like the pipeline steps).
- **Option B:** Inline the debit logic into `createProjectAction`'s transaction. Duplicates code; bad.

**TDD steps:**

1. **RED:** Add a test in `src/tests/unit/create-project-action-orphan.test.ts` that:
   - Mocks `db.transaction` to call the callback with a mock `tx`
   - Mocks `debitCredits` (or `debitCreditsTx`) to throw `InsufficientCreditsError`
   - Mocks `verifySession` to return a session
   - Calls `createProjectAction({ story: '...100+chars', style: 'anime', aspectRatio: 'portrait' })`
   - Asserts the result is `{ success: false, code: 'INSUFFICIENT_CREDITS' }`
   - Asserts `tx.insert(projects)` was called (the INSERT was attempted)
   - Asserts the transaction was rolled back (the mock `tx.rollback` was called OR the insert's effect was never committed)
   - This test will FAIL because the current code does the insert outside any transaction.

2. **GREEN:**
   - In `src/features/billing/queries.ts`, add:
     ```ts
     export async function debitCreditsTx(
       tx: Parameters<Parameters<Database['transaction']>[0]>[0],
       userId: string, amount: number, operationType: DebitOperation,
       idempotencyKey: string, projectId?: string,
     ): Promise<DebitResult> { /* same body as debitCredits but uses passed tx */ }
     ```
   - Refactor `debitCredits` to be a thin wrapper: `return db.transaction((tx) => debitCreditsTx(tx, ...))`
   - In `src/features/projects/actions.ts`, wrap lines 116-157 in `db.transaction(async (tx) => { ... })`, use `tx.insert(projects)`, call `debitCreditsTx(tx, ...)`.
   - Test now PASSES.

3. **REFACTOR:** Ensure the standalone `debitCredits` (used by pipeline steps) still works unchanged — it just delegates to `debitCreditsTx` inside its own transaction.

4. **VERIFY:** `pnpm test` — all 377 existing tests + the new one pass. Pay special attention to `create-project-action.test.ts` (12 tests) and `credit-metering.test.ts` (12 tests) — these must not regress.

**Files touched:** `src/features/billing/queries.ts`, `src/features/projects/actions.ts`, `src/tests/unit/create-project-action-orphan.test.ts` (new)

**Risk:** Medium. Transaction nesting is tricky. The `debitCreditsTx` signature must match what the pipeline expects. Run the full test suite after this change.

---

## T4 — Move Stripe webhook idempotency INSERT to after side effects (H-2)

**Finding:** The idempotency INSERT happens BEFORE the event handler. If the handler throws, retries are silently swallowed and the subscription update is lost.

**Root cause:** Idempotency-key-too-early anti-pattern.

**Optimal fix:** Two-phase approach:
1. **Phase 1 (claim):** INSERT a `usageEvents` row with `idempotencyKey = event.id` and a new `metadata` field marking it as `processing`. Use `onConflictDoNothing` — if it returns no rows, another worker is processing or already processed this event. If it returns rows, we have the claim.
2. **Phase 2 (process):** Run the event handler. On success, update the row's `metadata` to `completed`. On failure, DELETE the row (so retries can re-claim) OR leave it as `processing` with a timestamp for stuck-event detection.

**Simpler alternative (preferred for this codebase):** Move the idempotency INSERT to be the LAST step inside the try block, AFTER all side effects succeed. This means:
- If the handler throws, no idempotency row is inserted → Stripe retries → handler runs again → if it succeeds this time, the row is inserted → future duplicates are caught.
- If the handler succeeds, the row is inserted → future duplicates are caught.
- Downside: if the handler succeeds but the INSERT fails (e.g., DB blip), Stripe retries and the handler runs again (double side effects). But Stripe webhooks for `checkout.session.completed` are designed to be idempotent at the Stripe level (the subscription is already created in Stripe; we're just syncing), so re-running the handler is safe.

**TDD steps:**

1. **RED:** Add a test in `src/tests/unit/stripe-webhook-idempotency.test.ts` that:
   - Mocks `db.insert(usageEvents)` to return `[{ id: 'evt-1' }]` (successful insert)
   - Mocks `db.update(subscriptions)` to throw a DB error
   - Constructs a fake `checkout.session.completed` event
   - Calls the webhook POST handler
   - Asserts the response is `{ status: 500, error: '...' }`
   - Asserts the idempotency row was NOT inserted (because the handler threw before the insert)
   - This test will FAIL because the current code inserts the idempotency row BEFORE the handler.

2. **GREEN:** Edit `src/app/api/stripe/webhook/route.ts`:
   - Move the idempotency INSERT (lines 55-76) to AFTER the `switch` block, inside the try, before the final `return NextResponse.json({ received: true })`.
   - Remove the early-return `if (!inserted) return { duplicate: true }` — instead, do a pre-check: SELECT the idempotencyKey, if it exists, return `{ duplicate: true }` early.
   - The pre-check is a TOCTOU race, but combined with the post-handler INSERT + `onConflictDoNothing`, it's safe: worst case, two concurrent webhooks both pass the pre-check, both run the handler, one wins the INSERT, the other gets `onConflictDoNothing` and returns success. Side effects run twice but are idempotent (Stripe subscription updates are idempotent).
   - Test now PASSES.

3. **REFACTOR:** Consider extracting the idempotency check into a helper `isDuplicateEvent(eventId)` for clarity.

4. **VERIFY:** `pnpm test` — `stripe-webhook.test.ts` (12 tests) must still pass. May need to update some of those tests if they assumed the old INSERT-first ordering.

**Files touched:** `src/app/api/stripe/webhook/route.ts`, `src/tests/unit/stripe-webhook-idempotency.test.ts` (new), possibly `src/tests/unit/stripe-webhook.test.ts` (update if assumptions changed)

**Risk:** Medium-High. Webhook idempotency is subtle. The existing 12 tests in `stripe-webhook.test.ts` may encode the old behavior. Run them and fix any that fail due to the corrected ordering (NOT by reverting the fix — by updating the test to match the correct behavior).

---

## T5 — Release SSE rate limit on clean disconnect (H-3)

**Finding:** `sseRateLimit` uses `fixedWindow(1, '1 m')` — no release on disconnect. Users who close and reopen within 60s get 429.

**Root cause:** Upstash Ratelimit's fixed window doesn't support decrement/release.

**Optimal fix:** Track active connections in a separate Redis key with a short TTL, refreshed by the stream, and deleted on disconnect. The rate limit check becomes: "is there an active connection key for this user:project?" rather than "has a connection been opened in the last 60s?"

**Implementation:**
1. Add a new helper in `src/lib/rate-limit.ts`:
   ```ts
   const ACTIVE_CONN_TTL_SEC = 30;
   export async function claimSseSlot(userId: string, projectId: string): Promise<boolean> {
     const key = `siv:sse:active:${userId}:${projectId}`;
     // SET NX with TTL — only succeeds if no existing key
     const result = await redis.set(key, '1', { ex: ACTIVE_CONN_TTL_SEC, nx: true });
     return result === 'OK';
   }
   export async function releaseSseSlot(userId: string, projectId: string): Promise<void> {
     await redis.del(`siv:sse:active:${userId}:${projectId}`);
   }
   export async function refreshSseSlot(userId: string, projectId: string): Promise<void> {
     // Called every 10s by the stream to keep the key alive
     await redis.expire(`siv:sse:active:${userId}:${projectId}`, ACTIVE_CONN_TTL_SEC);
   }
   ```
2. In `src/app/api/projects/[id]/progress/route.ts`:
   - Replace `sseRateLimit.limit(...)` with `claimSseSlot(userId, projectId)`
   - In the `setInterval` callback (every 2s), also call `refreshSseSlot`
   - In the `abort` handler, call `releaseSseSlot` before closing
3. Keep `sseRateLimit` exported (other code might use it) but stop using it in the SSE route.

**TDD steps:**

1. **RED:** Add a test in `src/tests/unit/sse-slot-release.test.ts` that:
   - Reads the source of `progress/route.ts`
   - Asserts the source contains `claimSseSlot` and `releaseSseSlot` (not `sseRateLimit.limit`)
   - Asserts the abort handler calls `releaseSseSlot`
   - Asserts the interval calls `refreshSseSlot`
   - This test will FAIL because the current code uses `sseRateLimit.limit`.

2. **GREEN:** Implement the helpers in `rate-limit.ts`, update `progress/route.ts` per the implementation above. Test PASSES.

3. **REFACTOR:** Consider whether `sseRateLimit` is still needed anywhere; if not, remove it and its test in `rate-limit.test.ts`.

4. **VERIFY:** `pnpm test` — `sse-progress.test.ts` (18 tests) and `rate-limit.test.ts` (7 tests) must pass. May need to update `rate-limit.test.ts` if it tests `sseRateLimit` specifically.

**Files touched:** `src/lib/rate-limit.ts`, `src/app/api/projects/[id]/progress/route.ts`, `src/tests/unit/sse-slot-release.test.ts` (new), possibly `src/tests/unit/rate-limit.test.ts` (update)

**Risk:** Low-Medium. Redis `SET NX` is well-understood. The main risk is forgetting to call `releaseSseSlot` in some exit path (abort, terminal status, error). The TTL (30s) is the safety net — even if release fails, the slot expires.

---

## T6 — Distinguish R2 error types in download route (M-1)

**Finding:** `download/route.ts:57-63` catch block is generic.

**Optimal fix:** Classify the error. If it's an R2 SDK error (`@aws-sdk/client-s3` throws `S3ServiceError` subclasses), return 502 (bad gateway). If it's a network timeout, return 504. Otherwise 500.

**TDD steps:**

1. **RED:** Add a test that reads `download/route.ts` source and asserts the catch block checks `err.name` for S3 error types and returns different status codes.

2. **GREEN:** Implement the classification. Keep it simple — don't over-engineer.

3. **REFACTOR:** None.

4. **VERIFY:** `pnpm test` — `api-project-download.test.ts` (12 tests) must pass.

**Files touched:** `src/app/api/projects/[id]/download/route.ts`, `src/tests/unit/api-project-download-error-classification.test.ts` (new)

**Risk:** Low.

---

## T7 — Handle Inngest send failure in createProjectAction (M-2)

**Finding:** If `inngest.send()` throws, the project row is orphaned.

**Optimal fix:** Wrap the `inngest.send()` in a try/catch. If it fails, set the project status to `failed` with an error message, and return a user-facing error.

**TDD steps:**

1. **RED:** Add a test that mocks `inngest.send` to throw, calls `createProjectAction`, asserts the project status is updated to `failed` and the result is `{ success: false, code: 'INTERNAL' }`.

2. **GREEN:** Wrap `inngest.send()` in try/catch, call `setProjectFailed(project.id, 'Failed to queue pipeline')` on error, return INTERNAL.

3. **REFACTOR:** None.

4. **VERIFY:** `pnpm test` — `create-project-action.test.ts` (12 tests) must pass.

**Files touched:** `src/features/projects/actions.ts`, `src/tests/unit/create-project-action-orphan.test.ts` (extend from T3)

**Risk:** Low.

---

## T8 — Fix premature `status='completed'` in appendVideo (M-3)

**Finding:** `appendVideo` inserts with `status: 'completed'` and `videoKey: null` in Step 5.

**Optimal fix:** Insert with `status: 'rendering'` (the existing enum value for "video is being assembled"), update to `status: 'completed'` in `updateVideo` (Step 6).

**Validation:** The `video_status` enum in `src/lib/db/schema/media.ts:22-27` has values `['pending', 'rendering', 'completed', 'failed']`. There is NO `'processing'` value — but `'rendering'` is the correct semantic. Use `'rendering'`.

**TDD steps:**

1. **RED:** Add a test that reads `queries.ts` source and asserts `appendVideo` uses `status: 'rendering'` (not `'completed'`), and `updateVideo` sets both `videoKey` AND `status: 'completed'`.

2. **GREEN:** Change `appendVideo` line 162 from `status: 'completed'` to `status: 'rendering'`. Change `updateVideo` to also set `status: 'completed'` alongside `videoKey` and `duration`.

3. **REFACTOR:** None.

4. **VERIFY:** `pnpm test` — `pipeline-queries.test.ts` (10 tests) must pass. May need to update tests that assumed `status: 'completed'` at insert.

**Files touched:** `src/features/pipeline/queries.ts`, `src/tests/unit/pipeline-queries.test.ts` (update)

**Risk:** Low. The enum value `'rendering'` already exists — no migration needed.

---

## T9 — Make `FAIL_OPEN` testable per-call (M-4)

**Finding:** `moderate-image.ts:68` reads `FAIL_OPEN` at module load.

**Optimal fix:** Read `env.IMAGE_MODERATION_FAIL_OPEN` inside the function body, so tests can mock it per-call.

**TDD steps:**

1. **RED:** Add a test that calls `moderateImage` twice with different mocked `env` values and asserts different results — in the same test run.

2. **GREEN:** Move `const FAIL_OPEN = ...` from module scope into the function body.

3. **REFACTOR:** None.

4. **VERIFY:** `pnpm test` — `moderate-image.test.ts` (8 tests) must pass.

**Files touched:** `src/features/pipeline/domain/moderate-image.ts`, `src/tests/unit/moderate-image.test.ts` (extend)

**Risk:** Very low.

---

## T10 — Remove or wire up `buildFfmpegCommand` (M-5)

**Finding:** `buildFfmpegCommand` is exported but never called in production.

**Optimal fix:** Delete it. The `assembleVideo` function uses fluent-ffmpeg's API directly and is tested by `assemble-video.test.ts`. The `buildFfmpegCommand` function is dead code that creates a second source of truth.

**TDD steps:**

1. **RED:** Add a test that asserts `buildFfmpegCommand` is NOT exported from `assemble-video.ts` (after deletion). OR: keep the function but refactor `assembleVideo` to use it.

2. **GREEN:** Delete `buildFfmpegCommand` and its test in `assemble-video.test.ts`.

3. **REFACTOR:** None.

4. **VERIFY:** `pnpm test` — `assemble-video.test.ts` (11 tests, minus the deleted one = 10) must pass.

**Files touched:** `src/features/pipeline/domain/assemble-video.ts`, `src/tests/unit/assemble-video.test.ts` (update)

**Risk:** Very low. The function is dead code.

---

## T11 — Replace `amber-400`/`bg-zinc-950` with brand tokens across app components (M-6)

**Finding:** 122 `amber-*` violations across 28 files; 27 `bg-zinc-950/900/black` violations across 19 files.

**Optimal fix:** Replace `bg-amber-400` → `bg-primary`, `text-amber-400` → `text-primary`, `border-amber-400` → `border-primary`, `bg-zinc-950` → `bg-background`, etc. The `@theme` block in `globals.css` already defines `--color-primary: #febf00` and `--color-background: #020202`, so `bg-primary` / `text-primary` / `bg-background` are valid Tailwind v4 classes.

**Scope:** This is a large mechanical sweep across 28+ files. Per `skills/code-simplification` §3 "Rule of 500" — if a refactor touches >500 lines, use automation (codemod / sed). Manual edits at this scale are error-prone.

**TDD steps:**

1. **RED:** Update `src/tests/unit/brand-tokens.test.ts` to LOWER the baseline from 122 to 0 (or a much lower number). The test will FAIL because the violations still exist.

2. **GREEN:** Use a scripted replacement:
   ```bash
   # Replace amber-400 with primary across app + components (NOT marketing sections, which already use the custom token)
   find src/app/\(app\) src/components/app -name '*.tsx' -exec \
     sed -i 's/bg-amber-400/bg-primary/g; s/text-amber-400/text-primary/g; s/border-amber-400/border-primary/g; s/outline-amber-400/outline-primary/g; s/bg-zinc-950/bg-background/g; s/bg-zinc-900/bg-card/g' {} +
   ```
   - Run `pnpm lint` to catch any broken classes.
   - Visually verify the dashboard, billing, create, project-detail pages render correctly.
   - Test PASSES when violation count drops to the new baseline.

3. **REFACTOR:** Manually review the diff for any over-replacements (e.g., `amber-400/20` opacity modifiers need `primary/20` — verify Tailwind v4 supports this).

4. **VERIFY:** `pnpm test` — all 377 tests pass. `brand-tokens.test.ts` passes with the new baseline.

**Files touched:** ~28 files in `src/app/(app)/` and `src/components/app/`

**Risk:** Medium. Large sweep. Visual regression is possible. Per `skills/code-simplification`, this should be a SEPARATE PR from the bug fixes (T1-T10). Recommend doing T11 last.

---

## T12 — Low-priority fixes (L-1 through L-4)

Bundle these into a single small PR:

### L-1: Add explicit production domain to proxy host whitelist
**File:** `src/proxy.ts:46-50`
**Fix:** Add `host === 'storyintovideo.jesspete.shop'` to the `isAllowedHost` check, OR derive the allowed hosts from a new env var `ALLOWED_HOSTS` (comma-separated). Keep the localhost/vercel.app branches for dev/preview.

### L-2: Guard against double-close in useProjectProgress
**File:** `src/lib/hooks/use-project-progress.ts:91`
**Fix:** Set `eventSource = null` after `close()` in the terminal-status handler, so the cleanup function's `if (eventSource) eventSource.close()` skips.

### L-3: Use crypto.randomUUID for temp file names
**File:** `src/features/pipeline/domain/assemble-video.ts:99, 121, 140`
**Fix:** Replace `${Date.now()}` with `${crypto.randomUUID()}`. Import `crypto` from `node:crypto`.

### L-4: Use env.NEXT_PUBLIC_APP_URL for metadataBase
**File:** `src/app/layout.tsx:8`
**Fix:** `metadataBase: new URL(env.NEXT_PUBLIC_APP_URL)`. Add `import { env } from '@/lib/env'`. Note: this makes `layout.tsx` depend on the env module, which means it can no longer render in jsdom without mocking — update `layout-hydration.test.tsx` to mock `@/lib/env`.

**TDD steps:** One small test per fix (or one combined test). RED → GREEN → REFACTOR.

**Files touched:** `src/proxy.ts`, `src/lib/hooks/use-project-progress.ts`, `src/features/pipeline/domain/assemble-video.ts`, `src/app/layout.tsx`, `src/tests/unit/layout-hydration.test.tsx` (update)

**Risk:** Low for L-1, L-2, L-3. L-4 has a small test-breakage risk.

---

## Post-Remediation Verification Gate

After all tasks complete, run the FULL verification chain per `skills/verification-and-review-protocol`:

```bash
pnpm lint          # zero warnings, zero errors
pnpm typecheck     # zero errors
pnpm test          # all tests pass (377 + new tests from T1-T12)
pnpm build         # production build succeeds (with build-context env fallback)
```

Then re-run the agent-browser smoke test against the live site:
- `/dashboard` as unauthenticated → should redirect to `/sign-in?callbackUrl=/dashboard` (T2)
- `/billing` as authenticated → click "Upgrade to Creator" → should redirect to Stripe Checkout (T1)
- Open project detail → close tab → reopen within 30s → SSE should connect (T5)

---

## Worklog Protocol

After each task, append to `/home/z/my-project/worklog.md`:
```
---
Task ID: T<n>
Agent: Super Z
Task: <one-line summary>

Work Log:
- <step 1>
- <step 2>

Stage Summary:
- <key result>
- <tests added/updated>
- <verification result>
```

---

## Validation Against Codebase (Phase 11)

Each task's proposed fix was validated against the actual codebase during audit:

| Task | Fix validated? | Notes |
|---|---|---|
| T1 | ✅ | `checkoutAction` confirmed implemented at `billing/actions.ts:19`. Server Action form pattern is Next.js 16 standard. |
| T2 | ⚠️ | Fix is hypothesis-dependent. The `env.NEXT_PUBLIC_APP_URL` redirect fix is low-risk and worth trying first. H-B (Edge DB crash) needs deployment log investigation. |
| T3 | ✅ | `db.transaction()` is available in Drizzle. The `debitCreditsTx` pattern is standard. Existing `debitCredits` callers (pipeline steps) don't need changes. |
| T4 | ✅ | The "move INSERT to end" approach is simpler than two-phase and safe for Stripe webhooks (idempotent side effects). |
| T5 | ✅ | Redis `SET NX EX` is the standard pattern for distributed locks. Upstash supports it. |
| T6 | ✅ | AWS SDK errors have `.name` property. Simple to classify. |
| T7 | ✅ | `setProjectFailed` already exists in `pipeline/queries.ts:89`. Just call it. |
| T8 | ⚠️ | Need to verify `video_status` enum includes `'processing'`. If not, add a migration. |
| T9 | ✅ | Moving a const into function body is trivial. |
| T10 | ✅ | Dead code deletion is always safe. |
| T11 | ✅ | `sed` replacement is mechanical. Visual regression is the only risk. |
| T12 | ✅ | All four are small, isolated changes. |

All fixes are aligned with the codebase architecture (5-layer, env module, TDD, Drizzle, Auth.js v5). No fix requires introducing new dependencies or breaking the Golden Rule.

---

## Next Steps (after user approval)

1. Execute T1 first (smallest, highest-impact — unblocks all paid conversions).
2. Execute T2 (investigation + fix — unblocks the signup funnel for deep links).
3. Execute T3-T5 (High severity, independent).
4. Execute T6-T10 (Medium severity, quick wins).
5. Execute T11 last (large sweep, separate PR).
6. Execute T12 (Low priority, bundle into one PR).
7. Final verification gate.
8. Update `CLAUDE.md` / `AGENTS.md` / `README.md` / `Project_Architecture_Document.md` to reflect the fixes (especially the test count, which will increase from 377).
