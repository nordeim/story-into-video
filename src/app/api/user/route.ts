import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { deleteUserAccount } from '@/features/auth/queries';
import { deleteUserMedia } from '@/lib/storage/r2';

/**
 * T4 (status_11.md) — GDPR account deletion endpoint.
 *
 * The Privacy Policy §4 publicly promises: "You may delete your account at
 * any time, which triggers a CASCADE deletion of all your projects, characters,
 * scenes, voiceovers, videos, and usage events from our database. R2-stored
 * media files are deleted within 30 days of account deletion."
 *
 * This endpoint fulfills that promise. The DB CASCADE is already wired (every
 * FK from `users` is onDelete: 'cascade'). This endpoint:
 *   1. Collects all R2 keys for the user's projects (before CASCADE wipes them)
 *   2. Deletes the user row (CASCADE handles all child rows)
 *   3. Best-effort R2 bulk delete (R2 errors logged but don't fail the request)
 *
 * Pattern (mirrors /api/projects/[id]/download/route.ts + T3 export route):
 *   - Uses `auth()` (NOT verifySession) — API routes return 401 JSON, not redirects
 *   - Delegates DB access to features/auth/queries.ts (queries.ts boundary)
 *   - Delegates R2 access to lib/storage/r2.ts
 */

export const dynamic = 'force-dynamic';

export async function DELETE(): Promise<NextResponse> {
  // 1. AUTH (API pattern — auth() returns null → 401 JSON, not redirect)
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. DELETE (queries.ts boundary — collects R2 keys, then CASCADE-deletes the user)
  const result = await deleteUserAccount(session.user.id);

  if (!result) {
    // Should not happen (session exists but user row missing) — treat as 404
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 3. R2 CLEANUP (best-effort — DB deletion is the source of truth).
  //    R2 errors are logged inside deleteUserMedia but do NOT fail the request.
  //    The Privacy Policy §4 promises deletion "within 30 days" — we delete
  //    immediately when R2 is reachable, and the 30-day window covers transient
  //    R2 outages. Orphaned R2 keys are inert without DB rows pointing to them.
  try {
    await deleteUserMedia(result.r2KeysCollected);
  } catch (err) {
    // Defensive: deleteUserMedia already catches internally, but if something
    // unexpected leaks through, we still return 200 — the account IS deleted.
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[user-delete] R2 cleanup failed for user ${session.user.id}: ${message}`);
  }

  // 4. RESPONSE
  return NextResponse.json(
    {
      success: true,
      message:
        'Account deleted. All database records have been cascade-removed. R2 media deletion is in progress.',
    },
    { status: 200 },
  );
}
