import { pgTable, text, timestamp, uuid, integer, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { projects } from './projects';

/**
 * Billing tables — subscriptions (Stripe + credit metering) and usage_events
 * (per-operation audit log for cost tracking).
 *
 * Credit model: users buy/prepaid credits; each AI operation debits credits.
 * See ADR-007 in the Production Readiness Plan.
 */

export const planEnum = pgEnum('plan', ['free', 'creator', 'pro', 'studio']);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
]);

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  plan: planEnum('plan').default('free').notNull(),
  status: subscriptionStatusEnum('status').default('active').notNull(),
  // Credit metering — debited per AI operation, refilled on payment/refresh
  creditsRemaining: integer('credits_remaining').default(50).notNull(), // Free tier: 50/mo
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usageEventTypeEnum = pgEnum('usage_event_type', [
  'analysis', // GPT-4o story analysis (cost: 5 credits)
  'character_generation', // Replicate SDXL (cost: 10 credits)
  'scene_generation', // Replicate SDXL + IP-Adapter (cost: 8 credits)
  'voiceover', // ElevenLabs TTS (cost: 15 credits)
  'subtitle_alignment', // Whisper ASR (cost: 3 credits)
  'video_assembly', // FFmpeg (cost: 30 credits)
  'moderation_check', // OpenAI Moderation (free — logged for audit)
  'stripe_webhook', // Stripe event received (free — logged for audit)
]);

export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // H7 fix: userId is now nullable so webhook events can be logged without
    // a real user (e.g., Stripe webhook events that don't map to a user yet).
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    type: usageEventTypeEnum('type').notNull(),
    // Credits debited for this operation
    cost: integer('cost').default(0).notNull(),
    /**
     * Idempotency key for deduplication (C5).
     *
     * Inngest retries failed steps up to 3 times by default. Without an
     * idempotency guard, a retried step that already debited credits would
     * debit AGAIN — a double-charge. The UNIQUE index below + ON CONFLICT
     * DO NOTHING in debitCredits() prevents this at the database level.
     *
     * Format: `${projectId}:${stepName}:${entityId?}` (deterministic per step).
     * For webhook events: the Stripe event ID (e.g. `evt_123abc`).
     *
     * Nullable for backward compatibility with existing rows that predate
     * this column. New rows MUST set it.
     */
    idempotencyKey: text('idempotency_key'),
    // Optional metadata (e.g., model used, tokens, latency)
    metadata: text('metadata'),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // C5: UNIQUE index ensures ON CONFLICT (idempotency_key) DO NOTHING works.
    // Nulls are allowed (legacy rows); Postgres treats each NULL as distinct,
    // so legacy rows don't conflict with each other.
    idempotencyKeyUniqueIdx: uniqueIndex('usage_events_idempotency_key_unique_idx').on(
      table.idempotencyKey,
    ),
  }),
);
