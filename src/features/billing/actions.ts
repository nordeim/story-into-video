'use server';

import { redirect } from 'next/navigation';

import { stripe, PRICE_IDS } from '@/lib/stripe/client';
import { env } from '@/lib/env';
import { verifySession } from '@/features/auth/domain/verify-session';
import { getOrCreateSubscription } from '@/features/billing/queries';

/**
 * Billing Server Actions — checkoutAction + portalAction.
 *
 * Auth-first pattern. Creates Stripe Checkout Sessions / Customer Portal
 * sessions and redirects the user.
 */

export type Plan = 'creator' | 'pro' | 'studio';

export async function checkoutAction(plan: Plan): Promise<void> {
  const session = await verifySession({ redirectTo: '/billing' });
  const userId = session.user?.id;
  if (!userId) redirect('/sign-in');

  const subscription = await getOrCreateSubscription(userId);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: subscription.stripeCustomerId ?? undefined,
    customer_email: subscription.stripeCustomerId ? undefined : (session.user?.email ?? undefined),
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    client_reference_id: userId,
    metadata: { userId, plan },
  });

  if (checkoutSession.url) {
    redirect(checkoutSession.url);
  }
}

export async function portalAction(): Promise<void> {
  const session = await verifySession({ redirectTo: '/billing' });
  const userId = session.user?.id;
  if (!userId) redirect('/sign-in');

  const subscription = await getOrCreateSubscription(userId);

  if (!subscription.stripeCustomerId) {
    redirect('/billing');
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  if (portalSession.url) {
    redirect(portalSession.url);
  }
}

/**
 * T1 (C-1): Server Action wrapper for the billing page upgrade form.
 *
 * The billing page renders `<form action={billingCheckoutAction}>` with a
 * `<button name="plan" value={plan}>` for each tier. This wrapper extracts
 * the plan from formData and delegates to `checkoutAction(plan)`.
 *
 * Lives here (not in the page component) because Server Actions must be in a
 * module with `"use server"` at the top — the billing page is a Server Component,
 * not a Server Action module.
 */
export async function billingCheckoutAction(formData: FormData): Promise<void> {
  const plan = formData.get('plan');
  if (plan === 'creator' || plan === 'pro' || plan === 'studio') {
    await checkoutAction(plan);
  }
}
