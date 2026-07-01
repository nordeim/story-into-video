import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  users,
  projects,
  subscriptions,
  usageEvents,
  characters,
  scenes,
  videos,
  voiceovers,
} from '@/lib/db/schema';

/**
 * Auth feature queries — the queries.ts boundary for auth/user data access.
 *
 * All DB access for user-account-level operations (profile, GDPR export,
 * GDPR deletion) goes through this file. Route handlers and Server Actions
 * call these functions — they never call `db` directly.
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §5
 */

/**
 * T3 (status_11.md) — GDPR data export.
 *
 * Returns the user's complete data in a machine-readable JSON structure:
 *   - Profile (email, name, created date — NO password hash)
 *   - Subscription (plan, credits, status)
 *   - Projects (with nested characters, scenes, videos, voiceovers)
 *   - Usage events (audit log)
 *
 * The passwordHash is deliberately excluded — it's not "personal data" under
 * GDPR and exposing it would be a security risk. The email is included because
 * it IS personal data and the user has a right to see what we store.
 *
 * R2 object keys are included (not signed URLs) — signed URLs expire in 1 hour
 * and would make the export stale. The user can request signed URLs separately
 * via the download endpoint if they want to actually download the media.
 */
export async function getUserExportData(userId: string) {
  // 1. Profile (exclude passwordHash)
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return null;
  }

  // 2. Subscription
  const [subscription] = await db
    .select({
      plan: subscriptions.plan,
      status: subscriptions.status,
      creditsRemaining: subscriptions.creditsRemaining,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  // 3. Projects with nested media (characters, scenes, videos, voiceovers)
  const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));

  const projectsWithMedia = await Promise.all(
    userProjects.map(async (project) => {
      const [projectCharacters, projectScenes, projectVideos, projectVoiceovers] =
        await Promise.all([
          db.select().from(characters).where(eq(characters.projectId, project.id)),
          db.select().from(scenes).where(eq(scenes.projectId, project.id)),
          db.select().from(videos).where(eq(videos.projectId, project.id)),
          db.select().from(voiceovers).where(eq(voiceovers.projectId, project.id)),
        ]);

      return {
        ...project,
        characters: projectCharacters,
        scenes: projectScenes,
        videos: projectVideos,
        voiceovers: projectVoiceovers,
      };
    }),
  );

  // 4. Usage events (audit log)
  const userUsageEvents = await db
    .select({
      id: usageEvents.id,
      type: usageEvents.type,
      cost: usageEvents.cost,
      projectId: usageEvents.projectId,
      idempotencyKey: usageEvents.idempotencyKey,
      metadata: usageEvents.metadata,
      timestamp: usageEvents.timestamp,
    })
    .from(usageEvents)
    .where(eq(usageEvents.userId, userId));

  return {
    user,
    subscription: subscription ?? null,
    projects: projectsWithMedia,
    usageEvents: userUsageEvents,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * T4 (status_11.md) — GDPR account deletion.
 *
 * Deletes the user row. All child rows cascade automatically at the DB level
 * (every FK from `users` is `onDelete: 'cascade'`):
 *   - accounts, sessions, subscriptions
 *   - projects → characters, scenes, videos, voiceovers
 *   - usageEvents
 *
 * R2 media files are deleted separately via deleteUserMedia() in r2.ts —
 * the DB CASCADE doesn't touch R2 (it's a separate storage system).
 *
 * Returns the count of R2 keys that were queued for deletion (best-effort —
 * R2 errors are logged but don't fail the request, since the DB deletion is
 * the source of truth for "account deleted").
 */
export async function deleteUserAccount(
  userId: string,
): Promise<{ r2KeysCollected: string[] } | null> {
  // 1. Collect all R2 keys for the user's projects BEFORE deleting (CASCADE
  //    would wipe the projects table, making it impossible to find the keys
  //    after deletion).
  const userProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, userId));

  const projectIds = userProjects.map((p) => p.id);

  // Collect R2 keys from characters, scenes, videos, voiceovers across all projects
  const r2Keys: string[] = [];
  for (const projectId of projectIds) {
    const [projectCharacters, projectScenes, projectVideos, projectVoiceovers] = await Promise.all([
      db
        .select({ referenceImageKey: characters.referenceImageKey })
        .from(characters)
        .where(eq(characters.projectId, projectId)),
      db
        .select({ generatedImageKey: scenes.generatedImageKey })
        .from(scenes)
        .where(eq(scenes.projectId, projectId)),
      db
        .select({ videoKey: videos.videoKey, subtitleKey: videos.subtitleKey })
        .from(videos)
        .where(eq(videos.projectId, projectId)),
      db
        .select({ audioKey: voiceovers.audioKey })
        .from(voiceovers)
        .where(eq(voiceovers.projectId, projectId)),
    ]);

    for (const c of projectCharacters) if (c.referenceImageKey) r2Keys.push(c.referenceImageKey);
    for (const s of projectScenes) if (s.generatedImageKey) r2Keys.push(s.generatedImageKey);
    for (const v of projectVideos) {
      if (v.videoKey) r2Keys.push(v.videoKey);
      if (v.subtitleKey) r2Keys.push(v.subtitleKey);
    }
    for (const vo of projectVoiceovers) if (vo.audioKey) r2Keys.push(vo.audioKey);
  }

  // 2. Delete the user row — CASCADE handles all child rows
  await db.delete(users).where(eq(users.id, userId));

  return { r2KeysCollected: r2Keys };
}
