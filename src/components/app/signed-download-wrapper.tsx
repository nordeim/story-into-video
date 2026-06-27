import { getSignedDownloadUrl } from '@/lib/storage/r2';
import { ProjectDownloadButton } from '@/components/app/project-download-button';

/**
 * SignedDownloadWrapper — Server Component that generates a signed R2 URL
 * at SSR time and passes it to the ProjectDownloadButton client component.
 *
 * This keeps the r2.ts import (and its env validation) on the server side,
 * preventing the "Invalid environment variables" crash in the browser where
 * server-only env vars are undefined.
 *
 * Pattern: Server Component handles data fetching + URL signing → Client
 * Component handles presentation. This is the recommended Next.js 16 pattern
 * for any data that requires server-only env vars (R2 credentials, Stripe
 * secrets, etc.).
 *
 * Extracted from the project detail page so the app/components directory
 * matches the documented count and the wrapper is independently testable
 * and reusable across future authenticated download surfaces.
 */

interface SignedDownloadWrapperProps {
  /** R2 object key for the video file, e.g. `<projectId>/final.mp4`. */
  videoKey: string;
  /** Optional siblings rendered alongside the download button (e.g. share). */
  children?: React.ReactNode;
}

export async function SignedDownloadWrapper({
  videoKey,
  children,
}: SignedDownloadWrapperProps) {
  const downloadUrl = await getSignedDownloadUrl('videos', videoKey);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <ProjectDownloadButton videoKey={videoKey} downloadUrl={downloadUrl} />
      {children}
    </div>
  );
}
