import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { getProject } from '@/features/projects/queries';
import { getSignedDownloadUrl } from '@/lib/storage/r2';

/**
 * H4 fix — Click-time R2 URL signing.
 *
 * The previous pattern signed the R2 URL at SSR time (in SignedDownloadWrapper)
 * and baked the 1-hour-expiry URL into the RSC payload. Users who left the tab
 * open >1h would get a 403 Forbidden on download.
 *
 * This API route signs the URL at click time. The client component fetches
 * this route, gets a fresh signed URL, and triggers the download. The signed
 * URL is never baked into the HTML — it's generated per-request.
 *
 * Pattern: API route uses auth() (returns null → 401 JSON, not verifySession()
 * which redirects — wrong for JSON/SSE/API endpoints).
 *
 * @param req - The incoming request (unused but required by the signature)
 * @param params - Promise<{ id: string }> (Next.js 16 async params)
 */
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // 1. AUTH (API pattern — auth() returns null → 401 JSON, not redirect)
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. PARSE PARAMS (Next.js 16 async params)
  const { id: projectId } = await params;

  // 3. OWNER CHECK (getProject returns null if not owner — treated as 404)
  const project = await getProject(projectId, session.user.id);
  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 4. STATE VALIDATION — video must be assembled before we can sign a URL
  if (!project.videoKey) {
    return NextResponse.json(
      { error: 'Video not ready — the pipeline has not finished assembling this video yet.' },
      { status: 409 },
    );
  }

  // 5. EXECUTION — sign the URL at click time (fresh 1-hour expiry per request)
  try {
    const signedUrl = await getSignedDownloadUrl('videos', project.videoKey);
    return NextResponse.json({ url: signedUrl }, { status: 200 });
  } catch (err) {
    console.error('[Download] R2 signing failed:', err);
    return NextResponse.json(
      { error: 'Storage error — could not generate download URL.' },
      { status: 500 },
    );
  }
}
