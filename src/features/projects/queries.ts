import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { projects, videos } from '@/lib/db/schema';

/**
 * Projects queries — the queries.ts boundary.
 * All DB access for the projects feature goes through this file.
 * Components never call db directly.
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §5
 */

export async function getUserProjects(userId: string) {
  return db
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      style: projects.style,
      aspectRatio: projects.aspectRatio,
      progressPercent: projects.progressPercent,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(projects.updatedAt);
}

export async function getProject(projectId: string, userId: string) {
  // LEFT JOIN videos so the project detail page can render a download button
  // when the video is ready. Returns videoKey + subtitleKey (both null if
  // the project hasn't reached the assembly step yet).
  const [row] = await db
    .select({
      id: projects.id,
      userId: projects.userId,
      title: projects.title,
      story: projects.story,
      style: projects.style,
      aspectRatio: projects.aspectRatio,
      status: projects.status,
      progressDetail: projects.progressDetail,
      progressPercent: projects.progressPercent,
      creditsCost: projects.creditsCost,
      errorMessage: projects.errorMessage,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      videoKey: videos.videoKey,
      subtitleKey: videos.subtitleKey,
      videoDuration: videos.duration,
      videoResolution: videos.resolution,
    })
    .from(projects)
    .leftJoin(videos, eq(videos.projectId, projects.id))
    .where(eq(projects.id, projectId))
    .limit(1);

  // Owner check — returns null if not owner (treated as 404 by the caller)
  if (row && row.userId !== userId) {
    return null;
  }

  return row;
}
