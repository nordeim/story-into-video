import { eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import type { Database } from '@/lib/db';
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
 * Result of a debitCredits call.
 *
 * C5: The `idempotent` flag lets callers distinguish "new debit applied" from
 * "duplicate detected, no action taken". This matters for Inngest retries —
 * a retried step should NOT re-execute side effects (e.g., calling Replicate)
 * if the credit was already debited in the previous attempt.
 */
export interface DebitResult {
  /** true if this call was a no-op (duplicate idempotencyKey detected) */
  idempotent: boolean;
  /** The usage_event row id, or null if the debit was skipped */
  eventId: string | null;
  /** The user's credit balance after the debit (null if skipped) */
  creditsRemaining: number | null;
}

/**
 * Operation types that can be debited. Matches the `usage_event_type` enum.
 */
export type DebitOperation =
  | 'analysis'
  | 'character_generation'
  | 'scene_generation'
  | 'voiceover'
  | 'subtitle_alignment'
  | 'video_assembly'
  | 'moderation_check';

/**
 * Debit credits from a user's subscription atomically + idempotently.
 *
 * Throws InsufficientCreditsError if not enough credits remain.
 * Logs a usage_event for audit.
 *
 * C5 — Idempotency:
 *   The `idempotencyKey` parameter is required. The function attempts to
 *   INSERT the usage_event with ON CONFLICT (idempotency_key) DO NOTHING.
 *   If the insert returns no rows (duplicate key), the function returns
 *   `{ idempotent: true, eventId: null, creditsRemaining: null }` WITHOUT
 *   debiting credits. This makes the function safe to call from Inngest
 *   step functions that may be retried.
 *
 * H10 — Row-level lock:
 *   The `SELECT ... FOR UPDATE` on the subscription row prevents concurrent
 *   debits on the same connection from racing. Combined with the idempotency
 *   key (which handles cross-connection retries), this is mathematically
 *   race-condition-proof.
 *
 * T3 — Transaction variant:
 *   This is the standalone entry point that opens its own transaction.
 *   Callers that already hold a transaction (e.g., createProjectAction
 *   wrapping INSERT + debit atomically) should call `debitCreditsTx(tx, ...)`
 *   instead to avoid nested transactions.
 *
 * @param userId - The user to debit
 * @param amount - Credits to deduct
 * @param operationType - The operation enum value (for the audit log)
 * @param idempotencyKey - Deterministic key (e.g., `${projectId}:voiceover`)
 * @param projectId - Optional project context (for the audit log)
 */
export async function debitCredits(
  userId: string,
  amount: number,
  operationType: DebitOperation,
  idempotencyKey: string,
  projectId?: string,
): Promise<DebitResult> {
  return await db.transaction(async (tx) =>
    debitCreditsTx(tx, userId, amount, operationType, idempotencyKey, projectId),
  );
}

/**
 * T3 (H-1) — Transaction-scoped variant of debitCredits.
 *
 * Accepts an existing transaction handle (`tx`) from a caller that has already
 * opened `db.transaction(...)`. This lets the caller wrap multiple operations
 * (e.g., project INSERT + credit debit) in a SINGLE transaction so that if the
 * debit throws InsufficientCreditsError, the INSERT is rolled back too — no
 * orphan project rows.
 *
 * The standalone `debitCredits(userId, ...)` (above) is a thin wrapper that
 * opens its own transaction and delegates to this function. Pipeline steps
 * that don't need a shared transaction should keep using `debitCredits`.
 */
export async function debitCreditsTx(
  tx: Parameters<Parameters<Database['transaction']>[0]>[0],
  userId: string,
  amount: number,
  operationType: DebitOperation,
  idempotencyKey: string,
  projectId?: string,
): Promise<DebitResult> {
  // 1. IDEMPOTENCY GATE — attempt to insert the usage_event first.
  // If this key was already processed (e.g., Inngest retry), the
  // ON CONFLICT DO NOTHING returns an empty array and we abort without
  // touching the credit balance.
  const [inserted] = await tx
    .insert(usageEvents)
    .values({
      userId,
      projectId: projectId ?? null,
      type: operationType,
      cost: amount,
      idempotencyKey,
    })
    .onConflictDoNothing({
      target: usageEvents.idempotencyKey,
    })
    .returning({ id: usageEvents.id });

  if (!inserted) {
    // Duplicate idempotencyKey — this exact debit was already processed.
    // Return without debiting. The caller should skip side effects too.
    return { idempotent: true, eventId: null, creditsRemaining: null };
  }

  // 2. LOCK the subscription row for the duration of the transaction.
  // .for('update') prevents concurrent transactions from reading the same
  // creditsRemaining value until this transaction commits or rolls back.
  const [sub] = await tx
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .for('update')
    .limit(1);

  if (!sub) {
    // Throw to roll back the usage_event insert — the user has no subscription.
    throw new Error(`No subscription found for user ${userId}`);
  }

  if (sub.creditsRemaining < amount) {
    // Throw to roll back the usage_event insert — InsufficientCreditsError
    // propagates to the caller, who can surface it to the user. The
    // transaction rollback means the user can retry later after topping up.
    throw new InsufficientCreditsError(amount, sub.creditsRemaining);
  }

  // 3. DEBIT — subtract the credits from the locked row.
  const newBalance = sub.creditsRemaining - amount;
  await tx
    .update(subscriptions)
    .set({
      creditsRemaining: newBalance,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, sub.id));

  return {
    idempotent: false,
    eventId: inserted.id,
    creditsRemaining: newBalance,
  };
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
