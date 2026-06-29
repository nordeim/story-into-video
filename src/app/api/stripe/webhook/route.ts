import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe/client';
import { env } from '@/lib/env';
import { db } from '@/lib/db';
import { subscriptions, usageEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { TIER_LIMITS } from '@/features/billing/domain/tier-limits';
import { extractSubscriptionPeriodEnd } from '@/features/billing/domain/extract-period-end';

/**
 * Stripe webhook handler — receives events from Stripe and syncs subscription
 * state into the database.
 *
 * CRITICAL: webhook signature verification (prevents forged events).
 * Idempotency: check event ID in usageEvents before processing.
 *
 * Pattern source: skills/security-and-hardening/SKILL.md (webhook signature)
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  // T4 (H-2) fix: Idempotency INSERT happens AFTER side effects succeed.
  //
  // H-2 bug: The idempotency INSERT previously happened BEFORE the event handler.
  // If the handler threw (e.g., DB update failed for checkout.session.completed),
  // the webhook returned 500 — Stripe retried — but the idempotency row was
  // already committed, so the retry hit onConflictDoNothing and returned
  // { duplicate: true } without re-processing. The subscription update was
  // PERMANENTLY LOST.
  //
  // T4 fix: Two-phase approach:
  //   1. PRE-CHECK: SELECT usageEvents for event.id. If found, return { duplicate: true }.
  //      (This is a TOCTOU race, but safe combined with step 3.)
  //   2. RUN HANDLER: Execute the event-specific side effects.
  //   3. CLAIM: INSERT the idempotency row with onConflictDoNothing AFTER side
  //      effects succeed. If the handler throws, no row is inserted → Stripe
  //      retries → handler runs again → succeeds → row inserted.
  //
  // No more permanently-lost subscription updates on transient handler failures.
  const [existing] = await db
    .select({ id: usageEvents.id })
    .from(usageEvents)
    .where(eq(usageEvents.idempotencyKey, event.id))
    .limit(1);

  if (existing) {
    // Duplicate event.id — already processed. Return success without
    // re-running the side effects (subscription updates, etc.).
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.userId;
        const plan = session.metadata?.plan as 'creator' | 'pro' | 'studio' | undefined;

        if (userId && plan) {
          const tierLimit = TIER_LIMITS[plan];
          await db
            .update(subscriptions)
            .set({
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              plan,
              status: 'active',
              creditsRemaining: tierLimit.monthlyCredits,
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId));
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const status =
          event.type === 'customer.subscription.deleted'
            ? 'canceled'
            : (subscription.status as 'active' | 'past_due' | 'canceled' | 'unpaid');

        // Stripe "Basil" API version (2025-03-31) removed
        // `current_period_end` from the top-level Subscription object and
        // moved it to `subscription.items.data[0].current_period_end`.
        // The helper checks both shapes for backward compatibility with
        // older Stripe API versions.
        const periodEnd = extractSubscriptionPeriodEnd(subscription);

        await db
          .update(subscriptions)
          .set({
            status,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await db
          .update(subscriptions)
          .set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(subscriptions.stripeCustomerId, invoice.customer as string));
        break;
      }

      default:
        // Unhandled event type — log but don't error
        break;
    }

    // T4: CLAIM — insert the idempotency row AFTER side effects succeed.
    // If the handler threw above, we never reach this line → no row inserted →
    // Stripe retries → handler runs again. If the INSERT hits onConflictDoNothing
    // (concurrent worker won the race), that's fine — our side effects are idempotent.
    await db
      .insert(usageEvents)
      .values({
        // H7: userId is nullable — webhook events don't map to a user until
        // the checkout.session.completed handler runs.
        userId: null,
        type: 'stripe_webhook',
        cost: 0,
        idempotencyKey: event.id,
        metadata: event.id,
      })
      .onConflictDoNothing({
        target: usageEvents.idempotencyKey,
      });

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook handler failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
