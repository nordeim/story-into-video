/**
 * Extract the subscription's `current_period_end` timestamp from a Stripe
 * Subscription object, handling both the modern and legacy API shapes.
 *
 * CONTEXT — Stripe "Basil" API version (2025-03-31):
 *   `current_period_end` was REMOVED from the top-level Subscription object
 *   and moved down to each subscription item:
 *     subscription.items.data[0].current_period_end
 *
 *   Stripe Node SDK migration guide: types were refactored (e.g.,
 *   `Stripe.StripeContext` → `Stripe.StripeContextType`) and ESM module
 *   shape changed — but the SDK has ALWAYS mirrored the REST API's
 *   snake_case convention. There was never a camelCase conversion.
 *
 * STRATEGY:
 *   1. Prefer `items.data[0].current_period_end` (Basil API 2025-03-31+).
 *   2. Fall back to top-level `current_period_end` (pre-Basil backward compat).
 *   3. Return null when neither is present (e.g., deleted subscription events).
 *
 * The helper accepts a minimal structural interface (not the full Stripe
 * Subscription type) so it can be unit-tested in isolation without importing
 * the Stripe SDK.
 *
 * Pattern source: design_critique.md finding #1 (Stripe camelCase claim was
 * factually wrong; the real migration is the Basil API shape change).
 */

/** Minimal structural shape — only the fields the helper reads. */
interface StripeSubscriptionLike {
  current_period_end?: number | null;
  items?: {
    data?: Array<{ current_period_end?: number | null }>;
  };
}

/**
 * Read the period-end timestamp (Unix epoch seconds, per Stripe convention)
 * from a Stripe Subscription object. Returns null when not available.
 */
export function extractSubscriptionPeriodEnd(subscription: StripeSubscriptionLike): number | null {
  // 1. Prefer the Basil API shape (canonical going forward)
  const itemPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
  if (typeof itemPeriodEnd === 'number') {
    return itemPeriodEnd;
  }

  // 2. Fall back to the pre-Basil top-level field (backward compat)
  const topLevelPeriodEnd = subscription.current_period_end;
  if (typeof topLevelPeriodEnd === 'number') {
    return topLevelPeriodEnd;
  }

  // 3. Neither present — Stripe didn't include period info on this event
  return null;
}
