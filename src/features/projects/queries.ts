import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';

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
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

  // Owner check — throws 403-equivalent if not owner
  if (project && project.userId !== userId) {
    return null;
  }

  return project;
}
