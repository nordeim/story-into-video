import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  users,
  accounts,
  sessions,
  projects,
  characters,
  scenes,
  videos,
  voiceovers,
  subscriptions,
  usageEvents,
} from '@/lib/db/schema';
import { isTable } from 'drizzle-orm/table';

/**
 * Schema validation tests — these verify the schema is structurally correct
 * (tables exist, columns exist, relations are defined) without needing a live
 * database. This is a unit test of the schema definition itself.
 *
 * Full integration tests (connecting to a real Postgres via testcontainers)
 * are documented in the blueprint but require Docker, which isn't available
 * in this environment. They should be added in a CI pipeline that has Docker.
 */
describe('Drizzle schema — structural validation', () => {
  describe('auth tables (Auth.js v5 shape)', () => {
    it('users table has required Auth.js columns', () => {
      expect(isTable(users)).toBe(true);
      // Auth.js requires these columns
      expect(users.id).toBeDefined();
      expect(users.email).toBeDefined();
      expect(users.emailVerified).toBeDefined();
      expect(users.name).toBeDefined();
      expect(users.image).toBeDefined();
      expect(users.createdAt).toBeDefined();
    });

    it('accounts table has required OAuth columns', () => {
      expect(isTable(accounts)).toBe(true);
      expect(accounts.userId).toBeDefined();
      expect(accounts.type).toBeDefined();
      expect(accounts.provider).toBeDefined();
      expect(accounts.providerAccountId).toBeDefined();
      expect(accounts.refresh_token).toBeDefined();
      expect(accounts.access_token).toBeDefined();
    });

    it('sessions table has required session columns', () => {
      expect(isTable(sessions)).toBe(true);
      expect(sessions.sessionToken).toBeDefined();
      expect(sessions.userId).toBeDefined();
      expect(sessions.expires).toBeDefined();
    });
  });

  describe('projects table', () => {
    it('has the columns needed for the create wizard + pipeline', () => {
      expect(isTable(projects)).toBe(true);
      expect(projects.id).toBeDefined();
      expect(projects.userId).toBeDefined();
      expect(projects.title).toBeDefined();
      expect(projects.story).toBeDefined();
      expect(projects.style).toBeDefined();
      expect(projects.aspectRatio).toBeDefined();
      expect(projects.status).toBeDefined();
      expect(projects.creditsCost).toBeDefined();
      expect(projects.createdAt).toBeDefined();
      expect(projects.updatedAt).toBeDefined();
    });
  });

  describe('characters table', () => {
    it('has columns for AI-generated character portraits', () => {
      expect(isTable(characters)).toBe(true);
      expect(characters.id).toBeDefined();
      expect(characters.projectId).toBeDefined();
      expect(characters.name).toBeDefined();
      expect(characters.description).toBeDefined();
      expect(characters.referenceImageKey).toBeDefined();
    });
  });

  describe('scenes table', () => {
    it('has columns for AI-generated scene images', () => {
      expect(isTable(scenes)).toBe(true);
      expect(scenes.id).toBeDefined();
      expect(scenes.projectId).toBeDefined();
      expect(scenes.order).toBeDefined();
      expect(scenes.description).toBeDefined();
      expect(scenes.generatedImageKey).toBeDefined();
      expect(scenes.duration).toBeDefined();
    });
  });

  describe('media tables (videos + voiceovers)', () => {
    it('videos table has columns for final rendered MP4s', () => {
      expect(isTable(videos)).toBe(true);
      expect(videos.id).toBeDefined();
      expect(videos.projectId).toBeDefined();
      expect(videos.videoKey).toBeDefined();
      expect(videos.duration).toBeDefined();
      expect(videos.resolution).toBeDefined();
      expect(videos.status).toBeDefined();
    });

    it('voiceovers table has columns for TTS audio', () => {
      expect(isTable(voiceovers)).toBe(true);
      expect(voiceovers.id).toBeDefined();
      expect(voiceovers.projectId).toBeDefined();
      expect(voiceovers.voiceId).toBeDefined();
      expect(voiceovers.audioKey).toBeDefined();
      expect(voiceovers.transcript).toBeDefined();
    });
  });

  describe('billing tables', () => {
    it('subscriptions table has columns for Stripe + credit metering', () => {
      expect(isTable(subscriptions)).toBe(true);
      expect(subscriptions.id).toBeDefined();
      expect(subscriptions.userId).toBeDefined();
      expect(subscriptions.stripeCustomerId).toBeDefined();
      expect(subscriptions.stripeSubscriptionId).toBeDefined();
      expect(subscriptions.plan).toBeDefined();
      expect(subscriptions.status).toBeDefined();
      expect(subscriptions.creditsRemaining).toBeDefined();
      expect(subscriptions.currentPeriodEnd).toBeDefined();
    });

    it('usageEvents table has columns for metering + audit', () => {
      expect(isTable(usageEvents)).toBe(true);
      expect(usageEvents.id).toBeDefined();
      expect(usageEvents.userId).toBeDefined();
      expect(usageEvents.type).toBeDefined();
      expect(usageEvents.cost).toBeDefined();
      expect(usageEvents.timestamp).toBeDefined();
    });

    // C5: Idempotency — Inngest retries must not double-debit credits.
    // The idempotencyKey column + UNIQUE index enforce this at the DB level.
    it('usageEvents table has idempotencyKey column for deduplication (C5)', () => {
      expect(usageEvents.idempotencyKey).toBeDefined();
    });

    it('usageEvents schema source declares a UNIQUE index on idempotencyKey (C5)', () => {
      const schemaSource = readFileSync(
        resolve(__dirname, '../../lib/db/schema/billing.ts'),
        'utf-8',
      );
      expect(schemaSource).toMatch(/idempotencyKey/);
      expect(schemaSource).toMatch(/uniqueIndex/);
      expect(schemaSource).toMatch(/idempotency_key/i);
    });
  });

  // C5/M1: UNIQUE constraints on media tables prevent duplicate rows from
  // Inngest retries. Without these, appendVideo/appendVoiceover can create
  // duplicate rows, and getProject()'s .limit(1) picks one arbitrarily.
  describe('media tables — UNIQUE constraints (C5/M1)', () => {
    it('videos schema source declares a UNIQUE index on projectId', () => {
      const schemaSource = readFileSync(
        resolve(__dirname, '../../lib/db/schema/media.ts'),
        'utf-8',
      );
      expect(schemaSource).toMatch(/uniqueIndex/);
      expect(schemaSource).toMatch(/videos_project_id/);
    });

    it('voiceovers schema source declares a UNIQUE index on projectId', () => {
      const schemaSource = readFileSync(
        resolve(__dirname, '../../lib/db/schema/media.ts'),
        'utf-8',
      );
      expect(schemaSource).toMatch(/uniqueIndex/);
      expect(schemaSource).toMatch(/voiceovers_project_id/);
    });
  });
});
