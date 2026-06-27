'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

import { getSignedDownloadUrl } from '@/lib/storage/r2';

/**
 * ProjectDownloadButton — fetches a signed R2 download URL on mount and
 * renders an anchor styled as a button.
 *
 * The URL is fetched client-side (not server-side) so the 1-hour signed
 * URL is fresh at click time, not at page load time.
 *
 * Server-side fetching would also work but means the URL could expire
 * for users who leave the tab open. Client-side fetch on mount is a
 * good tradeoff.
 */

interface ProjectDownloadButtonProps {
  videoKey: string;
}

export function ProjectDownloadButton({ videoKey }: ProjectDownloadButtonProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSignedDownloadUrl('videos', videoKey)
      .then((url) => {
        if (!cancelled) setDownloadUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to generate download link');
      });
    return () => {
      cancelled = true;
    };
  }, [videoKey]);

  if (error) {
    return <p className="text-xs text-amber-400">{error}</p>;
  }

  if (!downloadUrl) {
    return (
      <span
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-500"
        aria-label="Preparing download link…"
      >
        <Download className="h-4 w-4" />
        Preparing…
      </span>
    );
  }

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
