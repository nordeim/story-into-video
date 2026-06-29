import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { env } from '@/lib/env';

/**
 * Upstash Ratelimit clients — C3 fix.
 *
 * Without rate limiting, the app is vulnerable to:
 *   - AI cost amplification: a user can spawn 1000 createProjectAction calls/second,
 *     each triggering a 6-step pipeline costing ~$0.50-$2 in AI inference.
 *   - Credential stuffing: the sign-in endpoint has no brute-force protection.
 *   - SSE connection exhaustion: a user can open 100 SSE streams per project,
 *     each polling the DB every 2s.
 *
 * The Upstash env vars (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 * are validated by the Zod schema in src/lib/env/index.ts. If they're missing,
 * the app fails fast at module load (intentional — rate limiting is required
 * for production).
 *
 * Limits:
 *   - authRateLimit: 10 sign-in/sign-up attempts per 15 minutes per IP
 *   - pipelineRateLimit: 5 project creations per 1 minute per user
 *   - sseRateLimit: 1 concurrent SSE connection per user/project (fixed window)
 *
 * Pattern source: https://upstash.com/docs/edge/solutions/ratelimit
 */

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/** Auth endpoint rate limit — 10 attempts per 15 minutes per IP. */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'),
  prefix: 'siv:auth',
  analytics: true,
});

/** Pipeline trigger rate limit — 5 project creations per 1 minute per user. */
export const pipelineRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'siv:pipeline',
  analytics: true,
});

/**
 * SSE connection limit — 1 concurrent connection per user/project.
 *
 * Uses a fixed window with a short TTL (60s). The SSE route calls .limit()
 * on connection open; if the user already has an open connection for this
 * project, the limit returns { success: false } and the route returns 429.
 *
 * The TTL auto-expires if the client disconnects without closing cleanly.
 */
export const sseRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(1, '1 m'),
  prefix: 'siv:sse',
  analytics: true,
});

// ── T5 (H-3): Active-connection slot management ─────────────────────────────
//
// H-3 bug: sseRateLimit (above) used fixedWindow(1, '1 m') — 1 connection per
// user:project per 60s. When the client disconnected cleanly, the abort handler
// closed the stream but did NOT release the rate-limit counter. Users who closed
// and reopened within 60s got 429 despite having zero active connections.
//
// T5 fix: Track active connections with a Redis key using SET NX (only-if-not-exists)
// + short TTL. The slot is:
//   - CLAIMED on stream open (SET NX EX 30 — fails if a slot already exists)
//   - REFRESHED every poll interval (EXPIRE to 30s — keeps the slot alive while streaming)
//   - RELEASED on disconnect (DEL — allows immediate reconnection)
//
// The 30s TTL is the safety net: if the server crashes or the abort handler
// doesn't fire, the slot auto-expires after 30s. The refresh every 2s (poll
// interval) keeps it alive during normal operation.

const SSE_SLOT_TTL_SEC = 30;
const SSE_SLOT_PREFIX = 'siv:sse:active';

function slotKey(userId: string, projectId: string): string {
  return `${SSE_SLOT_PREFIX}:${userId}:${projectId}`;
}

/**
 * Claim an SSE slot for a user:project. Returns true if the slot was claimed
 * (no existing active connection), false if a slot is already held.
 *
 * Uses Redis SET NX (only-if-not-exists) with a TTL. Atomic — no race condition.
 */
export async function claimSseSlot(userId: string, projectId: string): Promise<boolean> {
  const result = await redis.set(slotKey(userId, projectId), '1', {
    ex: SSE_SLOT_TTL_SEC,
    nx: true,
  });
  return result === 'OK';
}

/**
 * Release an SSE slot. Called when the client disconnects (abort signal) or
 * when the stream reaches a terminal status. Allows immediate reconnection.
 */
export async function releaseSseSlot(userId: string, projectId: string): Promise<void> {
  await redis.del(slotKey(userId, projectId));
}

/**
 * Refresh an SSE slot's TTL. Called every poll interval (2s) to keep the slot
 * alive while the stream is active. If the server stops refreshing (crash,
// OOM), the slot expires after 30s — the safety net.
 */
export async function refreshSseSlot(userId: string, projectId: string): Promise<void> {
  await redis.expire(slotKey(userId, projectId), SSE_SLOT_TTL_SEC);
}
