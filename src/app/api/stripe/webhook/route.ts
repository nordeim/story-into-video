import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { stripe } from '@/lib/stripe/client';
import { env } from '@/lib/env';
import { db } from '@/lib/db';
import { subscriptions, usageEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { TIER_LIMITS } from '@/features/billing/domain/tier-limits';

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

  // Idempotency check — log the event, skip if already processed
  const existing = await db
    .select()
    .from(usageEvents)
    .where(eq(usageEvents.metadata, event.id))
    .limit(1);

  if (existing.length > 0) {
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

        // Stripe SDK v22+ uses camelCase; fall back to snake_case for older
        const periodEnd =
          (subscription as unknown as { currentPeriodEnd?: number }).currentPeriodEnd ??
          (subscription as unknown as { current_period_end?: number }).current_period_end;

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

    // Log the webhook event for idempotency + audit
    await db.insert(usageEvents).values({
      userId: '00000000-0000-0000-0000-000000000000', // system user for webhook logs
      type: 'stripe_webhook',
      cost: 0,
      metadata: event.id,
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook handler failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
