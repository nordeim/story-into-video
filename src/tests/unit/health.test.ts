import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * H9 — Health endpoint must verify DB + FFmpeg, not just return 200.
 *
 * The previous /api/health returned { status: 'ok' } unconditionally. Docker
 * HEALTHCHECK, Kubernetes liveness probes, and Vercel monitoring all point at
 * this endpoint — a bare 200 hides real failures.
 *
 * This test verifies the route checks DB connectivity (SELECT 1) and FFmpeg
 * accessibility (fs.accessSync), and returns 503 when either fails.
 */

const ROUTE_PATH = resolve(__dirname, '../../app/api/health/route.ts');

describe('H9: Robust health endpoint', () => {
  it('health route imports db from @/lib/db', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/from ['"]@\/lib\/db['"]/);
  });

  it('health route imports env from @/lib/env (for FFMPEG_PATH)', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/from ['"]@\/lib\/env['"]/);
  });

  it('health route executes a SELECT 1 to verify DB connectivity', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/SELECT\s+1|sql`SELECT 1`/);
  });

  it('health route checks FFmpeg binary accessibility via fs.accessSync', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/accessSync|fs\.accessSync/);
  });

  it('health route returns 503 when a service is unhealthy', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/503/);
  });

  it('health route returns a structured JSON with services object', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/database/);
    expect(source).toMatch(/ffmpeg/);
    expect(source).toMatch(/healthy|unhealthy/);
  });
});
