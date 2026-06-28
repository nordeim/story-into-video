import { pgTable, text, timestamp, uuid, real, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Media tables — final rendered videos and TTS voiceover audio.
 * Both store R2 object keys (not URLs); signed URLs are generated on read.
 *
 * C5/M1: UNIQUE constraints on projectId prevent duplicate rows from Inngest
 * retries. Without these, appendVideo/appendVoiceover could create duplicate
 * rows, and getProject()'s .limit(1) would pick one arbitrarily. The UNIQUE
 * constraint + ON CONFLICT DO NOTHING in the append* queries makes the
 * pipeline idempotent.
 *
 * ⚠️ DEPLOYMENT NOTE: If duplicate rows already exist in production, the
 * migration that adds these constraints will fail. Run this cleanup first:
 *   DELETE FROM videos WHERE id NOT IN
 *     (SELECT MIN(id) FROM videos GROUP BY project_id);
 *   DELETE FROM voiceovers WHERE id NOT IN
 *     (SELECT MIN(id) FROM voiceovers GROUP BY project_id);
 */

export const videoStatusEnum = pgEnum('video_status', [
  'pending',
  'rendering',
  'completed',
  'failed',
]);

export const videoResolutionEnum = pgEnum('video_resolution', ['720p', '1080p', '4k']);

export const videos = pgTable(
  'videos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    // R2 object key for the final MP4
    videoKey: text('video_key'),
    duration: real('duration'), // seconds
    resolution: videoResolutionEnum('resolution').default('720p').notNull(),
    status: videoStatusEnum('status').default('pending').notNull(),
    // SRT subtitle file R2 key (for downloadable subtitles)
    subtitleKey: text('subtitle_key'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // C5/M1: One video row per project — Inngest retries must not create duplicates.
    projectIdUniqueIdx: uniqueIndex('videos_project_id_unique_idx').on(table.projectId),
  }),
);

export const voiceovers = pgTable(
  'voiceovers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    // ElevenLabs voice ID used for this voiceover
    voiceId: text('voice_id').notNull(),
    voiceName: text('voice_name'), // human-readable, e.g. "Josh"
    // R2 object key for the generated MP3
    audioKey: text('audio_key'),
    duration: real('duration'), // seconds
    // The text that was synthesized (for re-generation + subtitle alignment)
    transcript: text('transcript').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // C5/M1: One voiceover row per project — same rationale as videos.
    projectIdUniqueIdx: uniqueIndex('voiceovers_project_id_unique_idx').on(table.projectId),
  }),
);
