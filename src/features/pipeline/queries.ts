import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { characters, scenes, projects } from '@/lib/db/schema';

/**
 * Pipeline queries — the queries.ts boundary for pipeline state updates.
 * All DB access for the AI pipeline goes through this file.
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §5, §7
 */

export async function appendCharacter(
  projectId: string,
  name: string,
  description: string,
  referenceImageKey: string,
) {
  const [character] = await db
    .insert(characters)
    .values({
      projectId,
      name,
      description,
      referenceImageKey,
    })
    .returning();
  return character!;
}

export async function appendScene(
  projectId: string,
  order: number,
  description: string,
  generatedImageKey: string,
  duration: number | null,
) {
  const [scene] = await db
    .insert(scenes)
    .values({
      projectId,
      order,
      description,
      generatedImageKey,
      duration,
    })
    .returning();
  return scene!;
}

export type ProjectStatus = (typeof projects.status.enumValues)[number];

export async function updateProjectProgress(
  projectId: string,
  status: ProjectStatus,
  progressDetail: string,
  progressPercent: number,
) {
  await db
    .update(projects)
    .set({
      status,
      progressDetail,
      progressPercent,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
}

export async function setProjectFailed(projectId: string, errorMessage: string) {
  await db
    .update(projects)
    .set({
      status: 'failed',
      errorMessage,
      progressDetail: `Failed: ${errorMessage}`,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));
}

export async function getProjectCharacters(projectId: string) {
  return db.select().from(characters).where(eq(characters.projectId, projectId));
}

export async function getProjectScenes(projectId: string) {
  return db.select().from(scenes).where(eq(scenes.projectId, projectId)).orderBy(scenes.order);
}
