import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * C3 — Rate limiting client.
 *
 * Without rate limiting, a malicious user can:
 *   - Spawn 1000 createProjectAction calls/second (AI cost amplification)
 *   - Credential-stuff the sign-in endpoint
 *   - Open 100 SSE connections per project (DB connection exhaustion)
 *
 * The Upstash env vars (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 * are already in the Zod schema. This test verifies the rate-limit client
 * module exists and exports the expected instances.
 */

const RATE_LIMIT_PATH = resolve(__dirname, '../../lib/rate-limit.ts');

describe('C3: Rate limiting client module', () => {
  it('src/lib/rate-limit.ts exists and exports authRateLimit', () => {
    const source = readFileSync(RATE_LIMIT_PATH, 'utf-8');
    expect(source).toMatch(/export.*authRateLimit/);
  });

  it('src/lib/rate-limit.ts exports pipelineRateLimit', () => {
    const source = readFileSync(RATE_LIMIT_PATH, 'utf-8');
    expect(source).toMatch(/export.*pipelineRateLimit/);
  });

  it('src/lib/rate-limit.ts exports sseRateLimit', () => {
    const source = readFileSync(RATE_LIMIT_PATH, 'utf-8');
    expect(source).toMatch(/export.*sseRateLimit/);
  });

  // T5: New claim/release/refresh functions for SSE slot management
  it('T5: exports claimSseSlot, releaseSseSlot, and refreshSseSlot', () => {
    const source = readFileSync(RATE_LIMIT_PATH, 'utf-8');
    expect(source).toMatch(/export.*claimSseSlot/);
    expect(source).toMatch(/export.*releaseSseSlot/);
    expect(source).toMatch(/export.*refreshSseSlot/);
  });

  it('uses @upstash/ratelimit + @upstash/redis', () => {
    const source = readFileSync(RATE_LIMIT_PATH, 'utf-8');
    expect(source).toMatch(/from ['"]@upstash\/ratelimit['"]/);
    expect(source).toMatch(/from ['"]@upstash\/redis['"]/);
  });

  it('authRateLimit uses a sliding window (10 per 15 min)', () => {
    const source = readFileSync(RATE_LIMIT_PATH, 'utf-8');
    expect(source).toMatch(
      /Ratelimit\.slidingWindow\(\s*10,\s*['"]15\s*m['"]|Ratelimit\.slidingWindow\(\s*10,\s*['"]15m['"]/,
    );
  });

  it('pipelineRateLimit uses a sliding window (5 per 1 min)', () => {
    const source = readFileSync(RATE_LIMIT_PATH, 'utf-8');
    expect(source).toMatch(
      /Ratelimit\.slidingWindow\(\s*5,\s*['"]1\s*m['"]|Ratelimit\.slidingWindow\(\s*5,\s*['"]1m['"]/,
    );
  });

  it('reads Upstash credentials from the validated env module', () => {
    const source = readFileSync(RATE_LIMIT_PATH, 'utf-8');
    expect(source).toMatch(/from ['"]@\/lib\/env['"]/);
    expect(source).toMatch(/env\.UPSTASH_REDIS_REST_URL/);
    expect(source).toMatch(/env\.UPSTASH_REDIS_REST_TOKEN/);
  });
});
