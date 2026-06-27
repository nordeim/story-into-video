'use client';

import { useProjectProgress } from '@/lib/hooks/use-project-progress';

/**
 * ProjectProgressPanel — client component that subscribes to the SSE
 * progress stream and renders live status updates.
 *
 * Renders inside the (server) project detail page. The page passes the
 * initial status (from the DB read at SSR time) so the first paint is
 * instant; the SSE stream then takes over with live updates.
 */

interface ProjectProgressPanelProps {
  projectId: string;
  initialStatus: string;
  initialProgressDetail: string | null;
  initialErrorMessage: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Project created. Pipeline starting soon.',
  pending: 'Your project is queued for processing.',
  analyzing: 'AI is analyzing your story…',
  generating_characters: 'Generating character portraits…',
  generating_scenes: 'Generating scene images…',
  synthesizing_voice: 'Synthesizing voiceover…',
  aligning_subtitles: 'Aligning subtitles…',
  assembling_video: 'Assembling your video…',
  completed: 'Your video is ready!',
  failed: 'Generation failed.',
};

export function ProjectProgressPanel({
  projectId,
  initialStatus,
  initialProgressDetail,
  initialErrorMessage,
}: ProjectProgressPanelProps) {
  const progress = useProjectProgress(projectId);

  // Use SSE values once we have them; fall back to initial SSR values
  const status = progress.status ?? initialStatus;
  const progressDetail = progress.progressDetail ?? initialProgressDetail;
  const errorMessage = progress.errorMessage ?? initialErrorMessage;
  const progressPercent = progress.progressPercent ?? 0;

  const label = STATUS_LABELS[status] ?? status;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h2 className="font-heading mb-3 text-lg font-bold text-white">Pipeline Status</h2>
      <p className="text-sm text-zinc-400">
        {status === 'failed' && errorMessage
          ? `${label} ${errorMessage}`
          : label}
      </p>
      {progressDetail && <p className="mt-2 text-xs text-zinc-500">{progressDetail}</p>}

      {/* Progress bar */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-2 text-right text-xs text-zinc-500">{progressPercent}%</p>

      {progress.connectionState === 'error' && (
        <p className="mt-2 text-xs text-amber-400">
          Live updates disconnected. Refresh the page to retry.
        </p>
      )}

      {progress.connectionState === 'reconnecting' && (
        <p className="mt-2 text-xs text-zinc-500">
          Reconnecting to live updates…
        </p>
      )}
    </div>
  );
}
