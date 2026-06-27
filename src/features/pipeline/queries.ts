import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { characters, scenes, projects, videos, voiceovers } from '@/lib/db/schema';

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

// ── Voiceover queries (Step 4) ──────────────────────────────────────────────

export async function appendVoiceover(
  projectId: string,
  voiceId: string,
  voiceName: string | null,
  audioKey: string,
  duration: number | null,
  transcript: string,
) {
  const [voiceover] = await db
    .insert(voiceovers)
    .values({
      projectId,
      voiceId,
      voiceName,
      audioKey,
      duration,
      transcript,
    })
    .returning();
  return voiceover!;
}

export async function getProjectVoiceover(projectId: string) {
  const [voiceover] = await db
    .select()
    .from(voiceovers)
    .where(eq(voiceovers.projectId, projectId))
    .limit(1);
  return voiceover;
}

// ── Video queries (Steps 5-6) ───────────────────────────────────────────────

export async function appendVideo(
  projectId: string,
  videoKey: string | null,
  subtitleKey: string | null,
  duration: number | null,
  resolution: '720p' | '1080p' | '4k',
) {
  const [video] = await db
    .insert(videos)
    .values({
      projectId,
      videoKey,
      subtitleKey,
      duration,
      resolution,
      status: 'completed',
    })
    .returning();
  return video!;
}

export async function updateVideoSubtitle(projectId: string, subtitleKey: string) {
  await db
    .update(videos)
    .set({ subtitleKey })
    .where(eq(videos.projectId, projectId));
}

/**
 * Update an existing video row with the final MP4 key + duration.
 * Called by Step 6 after FFmpeg assembly completes. The video row was
 * created by Step 5 (with videoKey=null); this fills in the actual values.
 *
 * Using a dedicated update (not upsert) because the row MUST already exist
 * — if it doesn't, we want a hard failure, not a silent orphan row.
 */
export async function updateVideo(
  projectId: string,
  videoKey: string,
  duration: number,
): Promise<void> {
  await db
    .update(videos)
    .set({ videoKey, duration })
    .where(eq(videos.projectId, projectId));
}

export async function getProjectVideo(projectId: string) {
  const [video] = await db
    .select()
    .from(videos)
    .where(eq(videos.projectId, projectId))
    .limit(1);
  return video;
}
