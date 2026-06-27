import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { verifySession } from '@/features/auth/domain/verify-session';
import { getProject } from '@/features/projects/queries';
import { env } from '@/lib/env';
import { getSignedDownloadUrl } from '@/lib/storage/r2';
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

        <ProjectProgressPanel
          projectId={project.id}
          initialStatus={project.status}
          initialProgressDetail={project.progressDetail}
          initialErrorMessage={project.errorMessage}
        />

        {/* Download + Share buttons — render only when the video is ready.
            The signed URL is generated server-side (safe — env vars exist in
            Node.js) and passed as a prop to the client component. This avoids
            importing r2.ts in the browser where env vars are undefined. */}
        {project.status === 'completed' && project.videoKey && (
          <SignedDownloadWrapper videoKey={project.videoKey}>
            <ProjectShareButton
              url={`${env.NEXT_PUBLIC_APP_URL}/projects/${project.id}`}
              title={project.title}
            />
          </SignedDownloadWrapper>
        )}
      </div>
    </main>
  );
}

/**
 * SignedDownloadWrapper — Server Component that generates a signed R2 URL
 * at SSR time and passes it to the ProjectDownloadButton client component.
 *
 * This keeps the r2.ts import (and its env validation) on the server side,
 * preventing the "Invalid environment variables" crash in the browser.
 */
async function SignedDownloadWrapper({
  videoKey,
  children,
}: {
  videoKey: string;
  children: React.ReactNode;
}) {
  const downloadUrl = await getSignedDownloadUrl('videos', videoKey);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <ProjectDownloadButton videoKey={videoKey} downloadUrl={downloadUrl} />
      {children}
    </div>
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
