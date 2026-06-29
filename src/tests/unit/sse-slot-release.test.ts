import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * T5 (H-3) — SSE rate limit must release on clean disconnect.
 *
 * Bug: `sseRateLimit` used `fixedWindow(1, '1 m')` — 1 connection per
 * user:project per 60s. When the client disconnected cleanly, the abort
 * handler closed the stream but did NOT release the rate-limit counter.
 * Users who closed and reopened within 60s got 429 "Too many concurrent
 * connections" despite having zero active connections.
 *
 * Fix: Replace the fixed-window counter with a Redis `SET NX EX` claim/release
 * pattern:
 *   - claimSseSlot(userId, projectId) — SET NX with 30s TTL. Returns true if claimed.
 *   - refreshSseSlot(userId, projectId) — EXPIRE to 30s. Called every poll interval.
 *   - releaseSseSlot(userId, projectId) — DEL. Called on disconnect.
 *
 * Source-reading test (SSE route is a server-only module).
 */
describe('T5: SSE rate limit uses claim/release/refresh pattern', () => {
  const progressPath = join(
    process.cwd(),
    'src',
    'app',
    'api',
    'projects',
    '[id]',
    'progress',
    'route.ts',
  );
  const source = readFileSync(progressPath, 'utf-8');
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  const rateLimitPath = join(process.cwd(), 'src', 'lib', 'rate-limit.ts');
  const rateLimitSource = readFileSync(rateLimitPath, 'utf-8');
  const rateLimitStripped = rateLimitSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  it('rate-limit.ts exports claimSseSlot, releaseSseSlot, and refreshSseSlot functions', () => {
    expect(rateLimitStripped).toMatch(/export\s+async\s+function\s+claimSseSlot/);
    expect(rateLimitStripped).toMatch(/export\s+async\s+function\s+releaseSseSlot/);
    expect(rateLimitStripped).toMatch(/export\s+async\s+function\s+refreshSseSlot/);
  });

  it('SSE route imports claimSseSlot + releaseSseSlot (not sseRateLimit.limit)', () => {
    expect(stripped).toMatch(/claimSseSlot/);
    expect(stripped).toMatch(/releaseSseSlot/);
  });

  it('SSE route calls claimSseSlot before opening the stream', () => {
    expect(stripped).toMatch(/claimSseSlot\s*\(/);
  });

  it('SSE route calls releaseSseSlot in the abort handler', () => {
    // The abort handler must release the slot so the user can reconnect immediately
    expect(stripped).toMatch(/releaseSseSlot/);
  });

  it('SSE route calls refreshSseSlot in the poll interval to keep the slot alive', () => {
    // The poll interval (every 2s) must refresh the slot TTL so it doesn't
    // expire while the stream is still active
    expect(stripped).toMatch(/refreshSseSlot/);
  });
});
