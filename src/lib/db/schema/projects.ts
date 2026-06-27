import { pgTable, text, timestamp, uuid, integer, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './auth';

/**
 * Projects, Characters, Scenes — the core domain tables for the
 * story-into-video pipeline.
 *
 * A Project is the top-level entity created when a user submits a story.
 * The Inngest pipeline processes it through 6 steps (moderation, analysis,
 * character generation, scene generation, voiceover, video assembly),
 * updating `status` and `progressDetail` as it goes.
 */

export const projectStatusEnum = pgEnum('project_status', [
  'draft',
  'pending', // pipeline queued
  'analyzing', // step 1: GPT-4o story analysis
  'generating_characters', // step 2: Replicate SDXL
  'generating_scenes', // step 3: Replicate SDXL + IP-Adapter
  'synthesizing_voice', // step 4: ElevenLabs TTS
  'aligning_subtitles', // step 5: Whisper ASR
  'assembling_video', // step 6: FFmpeg
  'completed',
  'failed',
]);

export const visualStyleEnum = pgEnum('visual_style', [
  'ghibli',
  'oil-painting',
  'anime',
  'realistic',
  'cyberpunk',
  'watercolor',
  'comic',
]);

export const aspectRatioEnum = pgEnum('aspect_ratio', ['portrait', 'landscape']);

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  story: text('story').notNull(),
  style: visualStyleEnum('style').notNull(),
  aspectRatio: aspectRatioEnum('aspect_ratio').notNull(),
  status: projectStatusEnum('status').default('draft').notNull(),
  progressDetail: text('progress_detail'), // human-readable, e.g. "Generating character 2 of 3"
  progressPercent: integer('progress_percent').default(0).notNull(), // 0–100
  creditsCost: integer('credits_cost').default(0).notNull(),
  errorMessage: text('error_message'), // populated if status = 'failed'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const characters = pgTable('characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  // R2 object key (not URL) — signed URLs are generated on read
  referenceImageKey: text('reference_image_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const scenes = pgTable('scenes', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(), // 1-indexed scene sequence
  description: text('description').notNull(),
  // R2 object key for the generated scene image
  generatedImageKey: text('generated_image_key'),
  // Duration this scene appears in the final video (seconds)
  duration: integer('duration'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
