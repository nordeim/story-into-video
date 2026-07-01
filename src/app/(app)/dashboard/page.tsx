import { Suspense } from 'react';
import Link from 'next/link';
import { Film } from 'lucide-react';

import { EmptyState } from '@/components/app/empty-state';
import { verifySession } from '@/features/auth/domain/verify-session';
import { getUserProjects } from '@/features/projects/queries';

/**
 * Dashboard — the authenticated user's project list.
 *
 * Server Component. Wraps the async data fetcher in <Suspense> per Next.js 16
 * cacheComponents requirement. Auth-first: verifySession() at the top.
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §5
 * (Suspense + Server Component Pattern, queries.ts boundary)
 */

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02]"
        />
      ))}
    </div>
  );
}

async function ProjectList() {
  const session = await verifySession({ redirectTo: '/dashboard' });
  const userId = session.user?.id;

  if (!userId) {
    return (
      <EmptyState
        icon={<Film className="h-6 w-6" aria-hidden="true" />}
        title="Sign in to view your projects"
        description="You need to be signed in to see your video projects."
        ctaLabel="Sign in"
        ctaHref="/sign-in"
      />
    );
  }

  const userProjects = await getUserProjects(userId);

  if (userProjects.length === 0) {
    return (
      <EmptyState
        icon={<Film className="h-6 w-6" aria-hidden="true" />}
        title="No projects yet"
        description="Create your first AI-generated video from a story. It takes less than 15 minutes."
        ctaLabel="Create your first video"
        ctaHref="/create"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {userProjects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="group hover:border-primary/20 focus-visible:outline-primary rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <h3 className="font-heading group-hover:text-primary mb-2 text-lg font-bold text-white">
            {project.title}
          </h3>
          <p className="text-xs text-zinc-500">
            {project.style} · {project.aspectRatio}
          </p>
          <p className="mt-4 text-xs text-zinc-500">
            Status: <span className="text-zinc-400">{project.status}</span>
          </p>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="bg-background min-h-screen px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-white">
              Your Projects
            </h1>
            <p className="mt-2 text-sm text-zinc-400">Manage your story-into-video projects.</p>
          </div>
          <Link
            href="/create"
            className="bg-primary hover:bg-primary focus-visible:outline-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            New Project
          </Link>
        </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <ProjectList />
        </Suspense>
      </div>
    </main>
  );
}
