'use client';

import { Download } from 'lucide-react';

/**
 * ProjectDownloadButton — renders an anchor styled as a button that links
 * to a pre-signed R2 download URL for the final MP4.
 *
 * The signed URL is generated server-side (in the ProjectDetail Server
 * Component) and passed as a prop. This avoids importing @/lib/storage/r2
 * in the browser, which would trigger env validation (all server-only env
 * vars are undefined in the client context).
 *
 * Pattern: Server Component handles data fetching, Client Component handles
 * presentation. This is the recommended Next.js 16 pattern for signed URLs.
 */

interface ProjectDownloadButtonProps {
  videoKey: string;
  downloadUrl: string;
}

export function ProjectDownloadButton({ downloadUrl }: ProjectDownloadButtonProps) {
  return (
    <a
      href={downloadUrl}
      download
      className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
    >
      <Download className="h-4 w-4" />
      Download Video
    </a>
  );
}
