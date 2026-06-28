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

  // H7 fix: Idempotency via ON CONFLICT (idempotency_key) DO NOTHING.
  // The previous code used a TOCTOU-vulnerable SELECT-then-INSERT pattern on
  // the metadata column (no UNIQUE index). Two concurrent webhooks for the
  // same event.id would both pass the SELECT and both INSERT.
  //
  // The fix: attempt the INSERT first with onConflictDoNothing. If it returns
  // no rows, this event was already processed — return early. Otherwise,
  // process the event. The idempotencyKey column + UNIQUE index (added in
  // Task 1.1) make this race-condition-proof at the DB level.
  //
  // We use event.id as the idempotencyKey — Stripe guarantees these are unique.
  const [inserted] = await db
    .insert(usageEvents)
    .values({
      // H7: userId is now nullable — webhook events don't map to a user
      // until the checkout.session.completed handler runs. The system user
      // UUID was a hack that violated the foreign key constraint.
      userId: null,
      type: 'stripe_webhook',
      cost: 0,
      idempotencyKey: event.id,
      metadata: event.id,
    })
    .onConflictDoNothing({
      target: usageEvents.idempotencyKey,
    })
    .returning({ id: usageEvents.id });

  if (!inserted) {
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

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook handler failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
