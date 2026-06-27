import Stripe from 'stripe';

import { env } from '@/lib/env';

/**
 * Stripe client — used for subscriptions, Checkout, Customer Portal, webhooks.
 *
 * Per ADR-007, Stripe is the billing provider. Credit-based metering:
 * users buy prepaid credits; each AI generation debits credits.
 */

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  typescript: true,
});

// Price IDs (configure in Stripe Dashboard, set as env vars in production)
export const PRICE_IDS = {
  creator: 'price_creator_monthly',
  pro: 'price_pro_monthly',
  studio: 'price_studio_monthly',
} as const;
