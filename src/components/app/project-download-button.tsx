'use client';

import { useState } from 'react';
import { Download, Loader2, AlertCircle, Check } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * ProjectDownloadButton — H4 fix: click-time R2 URL signing.
 *
 * The previous version received a `downloadUrl` prop that was signed at SSR
 * time and baked into the RSC payload. Users who left the tab open >1h would
 * get a 403 Forbidden because the signed URL had expired.
 *
 * This version receives only the `projectId` (a primitive string that never
 * expires). On click, it fetches `/api/projects/[id]/download` to get a
 * FRESH signed URL, then triggers the download via a dynamically-created
 * <a> element. The signed URL is never baked into the HTML.
 *
 * The button never imports @/lib/storage/r2 — that would crash env validation
 * in the browser. All signing happens server-side in the API route.
 *
 * UI states: idle → loading → success (2.5s) → idle, OR idle → error.
 * Uses the luxury-dark design system (near-black surface, rationed amber on
 * hover, AAA focus rings).
 */

interface ProjectDownloadButtonProps {
  /** The project ID — used to fetch the fresh signed URL on click. */
  projectId: string;
  /** Whether the video has been assembled (gates whether the button renders). */
  hasVideo: boolean;
}

type DownloadState = 'idle' | 'loading' | 'error' | 'success';

export function ProjectDownloadButton({ projectId, hasVideo }: ProjectDownloadButtonProps) {
  const [state, setState] = useState<DownloadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Empty state — don't render if the video isn't ready
  if (!hasVideo) return null;

  async function handleDownload() {
    setState('loading');
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/download`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? 'Failed to secure download URL');
      }

      const { url } = (await res.json()) as { url: string };

      // Trigger native browser download without leaving the app context
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-${projectId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setState('success');
      // Reset to idle after 2.5s so the user can download again if needed
      setTimeout(() => setState('idle'), 2500);
    } catch (err) {
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={state === 'loading' || state === 'success'}
        className={cn(
          // Base: Anti-generic dark surface, hairline border
          'group relative overflow-hidden rounded-full border border-neutral-800 bg-[#060607] px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-300',
          // Hover: Rationed amber accent
          'hover:border-[#febf00]/50 hover:text-[#febf00]',
          // A11y: AAA Focus rings (using the brand amber, not Tailwind amber-400)
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#febf00]',
          // Disabled states
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span className="relative flex items-center gap-2">
          {state === 'idle' && (
            <>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download Video
            </>
          )}
          {state === 'loading' && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Securing download…
            </>
          )}
          {state === 'success' && (
            <>
              <Check className="h-4 w-4 text-[#febf00]" aria-hidden="true" />
              Download started
            </>
          )}
          {state === 'error' && (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
              Retry download
            </>
          )}
        </span>
      </button>

      {/* Error state feedback */}
      {state === 'error' && errorMessage && (
        <p className="text-xs text-red-400/80" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
