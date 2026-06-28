import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import fs from 'node:fs';

import { db } from '@/lib/db';
import { env } from '@/lib/env';

/**
 * Health check endpoint — H9 fix.
 *
 * The previous implementation returned { status: 'ok' } unconditionally,
 * which hid real failures from Docker HEALTHCHECK, Kubernetes liveness probes,
 * and Vercel monitoring.
 *
 * This robust version checks:
 *   1. Postgres connectivity via SELECT 1
 *   2. FFmpeg binary accessibility via fs.accessSync (F_OK | X_OK)
 *
 * Returns 200 + { status: 'healthy', services: { database, ffmpeg } } when
 * both pass, or 503 + { status: 'unhealthy', errors: [...] } when either
 * fails. The errors array is populated with human-readable messages for
 * debugging.
 *
 * This route must run on Node.js (not Edge) — it uses fs.accessSync which
 * is a Node.js API. The default runtime for API routes in Next.js 16 is
 * Node.js, so no explicit runtime config is needed.
 */

export const dynamic = 'force-dynamic';

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
    },
    {
      status: overallHealthy ? 200 : 503,
    },
  );
}
