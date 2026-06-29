import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { getProject } from '@/features/projects/queries';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { claimSseSlot, releaseSseSlot, refreshSseSlot } from '@/lib/rate-limit';

/**
 * SSE progress stream — pushes project status updates to the client.
 *
 * Pattern: API route uses auth() (returns null → 401 JSON, NOT verifySession
 * which redirects — wrong for JSON/SSE endpoints).
 *
 * Owner check via getProject() (returns null if not owner → 404).
 *
 * Polls the DB every 2s for the project's status. Closes the stream when
 * the project reaches a terminal state (completed or failed).
 *
 * Why polling vs. listen/notify? Postgres LISTEN/NOTIFY requires a long-lived
 * connection which doesn't play well with serverless. The Inngest function
 * updates the DB; this route re-reads on each interval. 2s is fast enough for
 * a 5-15min pipeline without hammering the DB.
 */

export const dynamic = 'force-dynamic';
// T6 (remediation, corrected): 800s is the Vercel Pro/Enterprise GA ceiling
// under Fluid Compute (now default on all Vercel plans). The pipeline runs
// 5-15min; the previous value of 300s (Vercel Hobby ceiling) caused
// mid-stream disconnects.
//
// Why 800 and not 900: with Fluid Compute enabled, Vercel Pro/Enterprise
// caps function duration at 800s GA (1800s is available in beta only —
// not stable for production configuration). The earlier value of 900
// exceeded the GA limit and silently fell back to the platform default.
//
// Vercel Hobby still caps at 300s — the client-side reconnect in
// useProjectProgress (1s → 2s → 4s exponential backoff, max 3 attempts)
// handles that case gracefully with a "Reconnecting to live updates…"
// UI state.
export const maxDuration = 800;

const POLL_INTERVAL_MS = 2000;
const TERMINAL_STATUSES = new Set(['completed', 'failed']);

interface ProgressEvent {
  status: string;
  progressPercent: number;
  progressDetail: string | null;
  errorMessage: string | null;
}

async function readProjectProgress(projectId: string): Promise<ProgressEvent | null> {
  const [project] = await db
    .select({
      status: projects.status,
      progressPercent: projects.progressPercent,
      progressDetail: projects.progressDetail,
      errorMessage: projects.errorMessage,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return project ?? null;
}

function formatSseMessage(data: ProgressEvent): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response | NextResponse> {
  // 1. AUTH (API pattern — auth() returns null, not redirect)
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Capture userId as a non-optional string for use in closures below
  // (TypeScript doesn't preserve session.user.id narrowing inside closures)
  const userId: string = session.user.id;

  // 2. OWNER CHECK
  const { id: projectId } = await params;
  const project = await getProject(projectId, userId);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 2b. T5 (H-3): Claim an SSE slot — 1 concurrent connection per user/project.
  // Replaces the old sseRateLimit.fixedWindow which never released on disconnect.
  // The slot is:
  //   - CLAIMED here (SET NX EX 30 — fails if a slot already exists)
  //   - REFRESHED every poll interval (2s) to keep it alive
  //   - RELEASED on disconnect (abort handler below) for immediate reconnection
  // The 30s TTL is the safety net if the server crashes or abort doesn't fire.
  const slotClaimed = await claimSseSlot(userId, projectId);
  if (!slotClaimed) {
    return NextResponse.json(
      { error: 'Too many concurrent connections. Close existing tabs and try again.' },
      { status: 429 },
    );
  }

  // 3. SSE RESPONSE — custom ReadableStream that polls the DB
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send an initial event immediately so the client knows it's connected
      const initial = await readProjectProgress(projectId);
      if (initial) {
        controller.enqueue(encoder.encode(formatSseMessage(initial)));
        if (TERMINAL_STATUSES.has(initial.status)) {
          controller.close();
          return;
        }
      }

      // Poll until terminal or client disconnects
      const interval = setInterval(async () => {
        try {
          // T5: Refresh the SSE slot TTL so it doesn't expire while streaming
          await refreshSseSlot(userId, projectId);
          const current = await readProjectProgress(projectId);
          if (!current) {
            controller.close();
            clearInterval(interval);
            return;
          }
          controller.enqueue(encoder.encode(formatSseMessage(current)));
          if (TERMINAL_STATUSES.has(current.status)) {
            controller.close();
            clearInterval(interval);
          }
        } catch {
          // Network/client error — close gracefully
          controller.close();
          clearInterval(interval);
        }
      }, POLL_INTERVAL_MS);

      // Clean up interval + release SSE slot when the client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        // T5: Release the slot so the user can reconnect immediately
        void releaseSseSlot(userId, projectId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}
