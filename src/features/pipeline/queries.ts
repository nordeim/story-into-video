import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { characters, scenes, projects, videos, voiceovers } from '@/lib/db/schema';

/**
 * Pipeline queries — the queries.ts boundary for pipeline state updates.
 * All DB access for the AI pipeline goes through this file.
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §5, §7
 */

/**
 * Result of an idempotent append* call.
 *
 * C5: When Inngest retries a step, the append* query may hit the UNIQUE
 * constraint (e.g., videos.project_id). In that case, `inserted` is false
 * and `row` is null — the caller should treat this as 'already done' and
 * skip downstream side effects.
 */
export interface AppendResult<T> {
  inserted: boolean;
  row: T | null;
}

export async function appendCharacter(
  projectId: string,
  name: string,
  description: string,
  referenceImageKey: string,
): Promise<AppendResult<typeof characters.$inferSelect>> {
  const [character] = await db
    .insert(characters)
    .values({
      projectId,
      name,
      description,
      referenceImageKey,
    })
    .onConflictDoNothing({
      target: [characters.projectId, characters.name],
    })
    .returning();
  return { inserted: !!character, row: character ?? null };
}

export async function appendScene(
  projectId: string,
  order: number,
  description: string,
  generatedImageKey: string,
  duration: number | null,
): Promise<AppendResult<typeof scenes.$inferSelect>> {
  const [scene] = await db
    .insert(scenes)
    .values({
      projectId,
      order,
      description,
      generatedImageKey,
      duration,
    })
    .onConflictDoNothing({
      target: [scenes.projectId, scenes.order],
    })
    .returning();
  return { inserted: !!scene, row: scene ?? null };
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
): Promise<AppendResult<typeof voiceovers.$inferSelect>> {
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
    .onConflictDoNothing({
      target: voiceovers.projectId,
    })
    .returning();
  return { inserted: !!voiceover, row: voiceover ?? null };
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
): Promise<AppendResult<typeof videos.$inferSelect>> {
  const [video] = await db
    .insert(videos)
    .values({
      projectId,
      videoKey,
      subtitleKey,
      duration,
      resolution,
      // T8 (M-3): Use 'rendering' (not 'completed') at insert time. The video
      // row is created in Step 5 (subtitles) with videoKey=null — the MP4 doesn't
      // exist yet. Step 6 calls updateVideo() to set videoKey + status='completed'.
      // The video_status enum has: pending, rendering, completed, failed.
      status: 'rendering',
    })
    .onConflictDoNothing({
      target: videos.projectId,
    })
    .returning();
  return { inserted: !!video, row: video ?? null };
}

export async function updateVideoSubtitle(projectId: string, subtitleKey: string) {
  await db.update(videos).set({ subtitleKey }).where(eq(videos.projectId, projectId));
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
  // T8 (M-3): Set status='completed' alongside videoKey + duration. The row was
  // inserted by appendVideo with status='rendering'; this update marks it done.
  await db
    .update(videos)
    .set({ videoKey, duration, status: 'completed' })
    .where(eq(videos.projectId, projectId));
}
