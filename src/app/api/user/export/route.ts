import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { getUserExportData } from '@/features/auth/queries';

/**
 * T3 (status_11.md) — GDPR data export endpoint.
 *
 * The Privacy Policy §6 publicly promises "Portability — receive your data
 * in a machine-readable format." This endpoint fulfills that promise.
 *
 * Returns a JSON object with the user's complete data:
 *   - Profile (email, name, created date — NO password hash)
 *   - Subscription (plan, credits, status)
 *   - Projects (with nested characters, scenes, videos, voiceovers)
 *   - Usage events (audit log)
 *
 * Pattern (mirrors /api/projects/[id]/download/route.ts):
 *   - Uses `auth()` (NOT verifySession) — API routes return 401 JSON, not redirects
 *   - Delegates DB access to features/auth/queries.ts (queries.ts boundary)
 *   - Owner check is implicit (userId comes from the session, not URL params)
 */

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  // 1. AUTH (API pattern — auth() returns null → 401 JSON, not redirect)
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. FETCH (queries.ts boundary — no raw db calls in the route handler)
  const exportData = await getUserExportData(session.user.id);

  if (!exportData) {
    // Should not happen (session exists but user row missing) — treat as 404
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 3. RESPONSE (machine-readable JSON — fulfills GDPR Portability right)
  return NextResponse.json(exportData, { status: 200 });
}
