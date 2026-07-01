import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import fs from 'node:fs';

import { db } from '@/lib/db';
import { env } from '@/lib/env';

/**
 * Health check endpoint — H9 fix + T2 env sanity check (status_11.md).
 *
 * The previous implementation returned { status: 'ok' } unconditionally,
 * which hid real failures from Docker HEALTHCHECK, Kubernetes liveness probes,
 * and Vercel monitoring.
 *
 * H9 fix: checks DB (SELECT 1) + FFmpeg (fs.accessSync) and returns 503 when
 * either fails.
 *
 * T2 fix (status_11.md): on the live storyintovideo.jesspete.shop deployment,
 * /api/health was returning {status:'healthy', services:{database:'healthy',
 * ffmpeg:'healthy'}} even though NEXT_PUBLIC_APP_URL was misconfigured to
 * http://localhost:3000 — breaking 100% of auth-protected routes. Operators
 * monitoring the health probe had NO visibility into the env misconfiguration.
 * T2 adds a read-only env sanity check that compares AUTH_URL host vs
 * NEXT_PUBLIC_APP_URL host at request time and surfaces the result in the JSON
 * response under `config`. Importantly, an env mismatch does NOT cause 503 —
 * DB+FFmpeg being healthy means the container is alive, just misconfigured.
 * Monitoring can detect the `config.healthy: false` flag separately.
 *
 * This route must run on Node.js (not Edge) — it uses fs.accessSync which
 * is a Node.js API. The default runtime for API routes in Next.js 16 is
 * Node.js, so no explicit runtime config is needed.
 */

export const dynamic = 'force-dynamic';

/**
 * Extract the host portion of a URL string. Returns null for invalid URLs.
 * Mirrors the helper in src/lib/env/index.ts (kept local to avoid exporting
 * an internal helper from the env module).
 */
function extractHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export async function GET() {
  let dbHealthy = false;
  let ffmpegHealthy = false;
  const errors: string[] = [];

  // 1. Verify Postgres reachability via a trivial SELECT 1
  try {
    await db.execute(sql`SELECT 1`);
    dbHealthy = true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`Postgres offline: ${message}`);
  }

  // 2. Verify system FFmpeg binary exists and is executable
  try {
    const ffmpegPath = env.FFMPEG_PATH;
    fs.accessSync(ffmpegPath, fs.constants.F_OK | fs.constants.X_OK);
    ffmpegHealthy = true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`FFmpeg check failed: ${message}`);
  }

  // 3. T2: env sanity check — surface AUTH_URL ↔ NEXT_PUBLIC_APP_URL host
  //    mismatches in the JSON response. Read-only (never throws) — by the
  //    time this route is reachable, the env module has already loaded
  //    successfully. In production with T1 deployed, a host mismatch would
  //    have already failed-fast at boot, so this check is most useful in
  //    dev/test contexts where T1 only warns. It's also a defense-in-depth:
  //    if a future operator disables T1's fail-fast, /api/health still
  //    surfaces the misconfiguration to monitoring.
  const configErrors: string[] = [];
  const authHost = extractHost(env.AUTH_URL);
  const appHost = extractHost(env.NEXT_PUBLIC_APP_URL);
  if (authHost && appHost && authHost !== appHost) {
    configErrors.push(
      `AUTH_URL host ("${authHost}") differs from NEXT_PUBLIC_APP_URL host ("${appHost}") — ` +
        `auth-protected routes will redirect to the wrong host.`,
    );
  }
  const configHealthy = configErrors.length === 0;

  // overallHealthy depends ONLY on DB + FFmpeg — an env mismatch is a
  // configuration issue, not a liveness issue. Returning 503 for a config
  // error would cause Docker/K8s to restart a perfectly alive container.
  const overallHealthy = dbHealthy && ffmpegHealthy;

  return NextResponse.json(
    {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        ffmpeg: ffmpegHealthy ? 'healthy' : 'unhealthy',
      },
      errors: errors.length > 0 ? errors : undefined,
      config: {
        healthy: configHealthy,
        authUrl: env.AUTH_URL,
        appUrl: env.NEXT_PUBLIC_APP_URL,
      },
      configErrors: configErrors.length > 0 ? configErrors : undefined,
    },
    {
      status: overallHealthy ? 200 : 503,
    },
  );
}
