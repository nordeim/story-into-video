import { pgTable, text, timestamp, uuid, real, pgEnum } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Media tables — final rendered videos and TTS voiceover audio.
 * Both store R2 object keys (not URLs); signed URLs are generated on read.
 */

export const videoStatusEnum = pgEnum('video_status', [
  'pending',
  'rendering',
  'completed',
  'failed',
]);

export const videoResolutionEnum = pgEnum('video_resolution', ['720p', '1080p', '4k']);

export const videos = pgTable('videos', {
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
});

export const voiceovers = pgTable('voiceovers', {
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
});
