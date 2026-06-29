import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { verifySession } from '@/features/auth/domain/verify-session';
import { getProject } from '@/features/projects/queries';
import { env } from '@/lib/env';
import { ProjectProgressPanel } from '@/components/app/project-progress-panel';
import { ProjectDownloadButton } from '@/components/app/project-download-button';
import { ProjectShareButton } from '@/components/app/project-share-button';

/**
 * Project detail page — shows the project's analysis results + live pipeline status.
 *
 * Server Component. Auth-first. Owner-checked via getProject (returns null if
 * not owner → 404-equivalent). Wraps async data in <Suspense> per Next.js 16.
 *
 * The pipeline status panel is a client component that subscribes to the SSE
 * progress stream at /api/projects/[id]/progress for live updates.
 */

async function ProjectDetail({ projectId }: { projectId: string }) {
  const session = await verifySession({ redirectTo: `/projects/${projectId}` });
  const userId = session.user?.id;

  if (!userId) notFound();

  const project = await getProject(projectId, userId);
  if (!project) notFound();

  return (
    <main className="bg-background min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <a
          href="/dashboard"
          className="hover:text-primary focus-visible:outline-primary mb-6 inline-block text-sm text-zinc-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
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

        <ProjectProgressPanel
          projectId={project.id}
          initialStatus={project.status}
          initialProgressDetail={project.progressDetail}
          initialErrorMessage={project.errorMessage}
        />

        {/* H4 fix: Click-time R2 URL signing.
            The ProjectDownloadButton receives only projectId + hasVideo (primitives
            that never expire). It fetches /api/projects/[id]/download on click to
            get a FRESH signed URL. The signed URL is never baked into the RSC
            payload, so users who leave the tab open >1h no longer get 403 errors. */}
        {project.status === 'completed' && project.videoKey && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ProjectDownloadButton projectId={project.id} hasVideo={!!project.videoKey} />
            <ProjectShareButton
              url={`${env.NEXT_PUBLIC_APP_URL}/projects/${project.id}`}
              title={project.title}
            />
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * H4: SignedDownloadWrapper was removed in favor of click-time signing via
 * the /api/projects/[id]/download API route. The wrapper is no longer needed.
 */

function ProjectDetailSkeleton() {
  return (
    <div className="bg-background min-h-screen px-6 py-16">
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
