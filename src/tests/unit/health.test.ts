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

  // T2 (status_11.md): /api/health must surface env misconfigurations.
  //
  // On the live storyintovideo.jesspete.shop deployment, /api/health was
  // returning {status:'healthy', services:{database:'healthy', ffmpeg:'healthy'}}
  // even though NEXT_PUBLIC_APP_URL was misconfigured to http://localhost:3000 —
  // breaking 100% of auth-protected routes. Operators monitoring the health
  // probe had NO visibility into the env misconfiguration.
  //
  // T2 fix: add an env sanity check (read-only — never throws) that compares
  // AUTH_URL host vs NEXT_PUBLIC_APP_URL host at request time, and surfaces the
  // result in the JSON response. Importantly, an env mismatch should NOT cause
  // a 503 — DB+FFmpeg being healthy means the container is alive, just
  // misconfigured. Monitoring can detect the config flag separately.

  it('T2: health route reads env.AUTH_URL (for env sanity check)', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    // Must reference env.AUTH_URL — not just process.env — to go through the
    // validated env module.
    expect(source).toMatch(/env\.AUTH_URL/);
  });

  it('T2: health route reads env.NEXT_PUBLIC_APP_URL (for env sanity check)', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    expect(source).toMatch(/env\.NEXT_PUBLIC_APP_URL/);
  });

  it('T2: health route includes a config object in the JSON response', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    // The response should surface env sanity as a `config` field — mirrors the
    // existing `services` pattern (database/ffmpeg).
    expect(source).toMatch(/config:/);
  });

  it('T2: health route includes configErrors array (mirrors errors pattern)', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    // Surface env misconfigurations in a separate array — keeps `errors`
    // focused on service failures (DB/FFmpeg) and `configErrors` on env issues.
    expect(source).toMatch(/configErrors/);
  });

  it('T2: health route does NOT gate 503 on env mismatch (config is independent of overallHealthy)', () => {
    const source = readFileSync(ROUTE_PATH, 'utf-8');
    // The overallHealthy computation must only depend on dbHealthy && ffmpegHealthy.
    // An env mismatch should NOT cause 503 — that would restart a "healthy"
    // container in Docker/K8s. Monitoring detects the config flag separately.
    expect(source).toMatch(/overallHealthy\s*=\s*dbHealthy\s*&&\s*ffmpegHealthy/);
  });
});
