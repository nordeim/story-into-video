'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

/**
 * ProjectShareButton — uses the Web Share API when available, falls back to
 * copy-to-clipboard.
 *
 * Shows a transient "Copied!" state for 2 seconds after clipboard success.
 */

interface ProjectShareButtonProps {
  url: string;
  title?: string;
}

export function ProjectShareButton({
  url,
  title = 'My StoryIntoVideo project',
}: ProjectShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // Preferred: native Web Share API (mobile + supported desktop browsers)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API blocked — last resort: select-and-prompt
      // (rare in practice; most browsers allow clipboard.writeText on user gesture)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="focus-visible:outline-primary inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2"
      aria-label="Share project"
    >
      {copied ? <Check className="text-primary h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
