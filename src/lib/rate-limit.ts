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
