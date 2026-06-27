import { eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { subscriptions, usageEvents } from '@/lib/db/schema';

/**
 * Billing queries — the queries.ts boundary for billing/subscription access.
 * All DB access for the billing feature goes through this file.
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §5
 */

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly required: number,
    public readonly available: number,
  ) {
    super(
      `Insufficient credits: need ${required}, have ${available}. Upgrade your plan to continue.`,
    );
    this.name = 'InsufficientCreditsError';
  }
}

/** Get a user's subscription, creating a free-tier one if none exists */
export async function getOrCreateSubscription(userId: string) {
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (existing) return existing;

  // Create free-tier subscription for new users
  const [created] = await db
    .insert(subscriptions)
    .values({
      userId,
      plan: 'free',
      status: 'active',
      creditsRemaining: 50,
    })
    .returning();

  return created!;
}

/**
 * Debit credits from a user's subscription atomically.
 * Throws InsufficientCreditsError if not enough credits remain.
 * Logs a usage_event for audit.
 */
export async function debitCredits(
  userId: string,
  amount: number,
  operationType:
    | 'analysis'
    | 'character_generation'
    | 'scene_generation'
    | 'voiceover'
    | 'subtitle_alignment'
    | 'video_assembly'
    | 'moderation_check',
  projectId?: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    // Lock the subscription row for the duration of the transaction
    const [sub] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .for('update')
      .limit(1);

    if (!sub) {
      throw new Error(`No subscription found for user ${userId}`);
    }

    if (sub.creditsRemaining < amount) {
      throw new InsufficientCreditsError(amount, sub.creditsRemaining);
    }

    // Debit
    await tx
      .update(subscriptions)
      .set({
        creditsRemaining: sub.creditsRemaining - amount,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id));

    // Log usage event
    await tx.insert(usageEvents).values({
      userId,
      projectId: projectId ?? null,
      type: operationType,
      cost: amount,
    });
  });
}

/** Refill credits (called on subscription renewal or credit purchase) */
export async function refillCredits(userId: string, amount: number): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      creditsRemaining: sql`${subscriptions.creditsRemaining} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, userId));
}

/** Get a summary of usage (aggregated by operation type) */
export async function getUsageSummary(userId: string) {
  const result = await db
    .select({
      type: usageEvents.type,
      totalCost: sql<number>`sum(${usageEvents.cost})`.as('total_cost'),
      count: sql<number>`count(*)`.as('count'),
    })
    .from(usageEvents)
    .where(eq(usageEvents.userId, userId))
    .groupBy(usageEvents.type);

  return result;
}
