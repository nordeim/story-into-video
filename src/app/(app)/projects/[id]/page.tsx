import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { verifySession } from '@/features/auth/domain/verify-session';
import { getProject } from '@/features/projects/queries';

/**
 * Project detail page — shows the project's analysis results + pipeline status.
 *
 * Server Component. Auth-first. Owner-checked via getProject (returns null if
 * not owner → 404-equivalent). Wraps async data in <Suspense> per Next.js 16.
 */

async function ProjectDetail({ projectId }: { projectId: string }) {
  const session = await verifySession({ redirectTo: `/projects/${projectId}` });
  const userId = session.user?.id;

  if (!userId) notFound();

  const project = await getProject(projectId, userId);
  if (!project) notFound();

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <a
          href="/dashboard"
          className="mb-6 inline-block text-sm text-zinc-400 transition-colors hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          ← Back to dashboard
        </a>

        <h1 className="font-heading mb-2 text-3xl font-bold tracking-tight text-white">
          {project.title}
        </h1>
        <p className="mb-8 text-xs text-zinc-500">
          Status: <span className="text-zinc-400">{project.status}</span> · Style:{' '}
          <span className="text-zinc-400">{project.style}</span> · Ratio:{' '}
          <span className="text-zinc-400">{project.aspectRatio}</span>
        </p>

        <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading mb-3 text-lg font-bold text-white">Your Story</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-400">
            {project.story}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-heading mb-3 text-lg font-bold text-white">Pipeline Status</h2>
          <p className="text-sm text-zinc-400">
            {project.status === 'pending' && 'Your project is queued for processing.'}
            {project.status === 'analyzing' && 'AI is analyzing your story…'}
            {project.status === 'generating_characters' && 'Generating character portraits…'}
            {project.status === 'generating_scenes' && 'Generating scene images…'}
            {project.status === 'synthesizing_voice' && 'Synthesizing voiceover…'}
            {project.status === 'aligning_subtitles' && 'Aligning subtitles…'}
            {project.status === 'assembling_video' && 'Assembling your video…'}
            {project.status === 'completed' && 'Your video is ready!'}
            {project.status === 'failed' &&
              `Generation failed: ${project.errorMessage ?? 'Unknown error'}`}
            {project.status === 'draft' && 'Project created. Pipeline starting soon.'}
          </p>
          {project.progressDetail && (
            <p className="mt-2 text-xs text-zinc-500">{project.progressDetail}</p>
          )}
        </div>
      </div>
    </main>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="h-8 w-32 animate-pulse rounded bg-white/[0.04]" />
        <div className="mt-6 h-10 w-3/4 animate-pulse rounded bg-white/[0.04]" />
        <div className="mt-8 h-48 animate-pulse rounded-2xl bg-white/[0.02]" />
      </div>
    </div>
  );
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <ProjectDetail projectId={id} />
    </Suspense>
  );
}
