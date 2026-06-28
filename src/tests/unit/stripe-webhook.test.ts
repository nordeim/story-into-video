import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { extractSubscriptionPeriodEnd } from '@/features/billing/domain/extract-period-end';

/**
 * Stripe webhook — period-end extraction regression tests.
 *
 * Background: the previous webhook handler had a fictional fallback
 *   (subscription as unknown as { currentPeriodEnd?: number }).currentPeriodEnd
 *     ?? (subscription as unknown as { current_period_end?: number }).current_period_end
 *
 * The Stripe Node SDK has always mirrored the REST API's snake_case convention.
 * The REAL breaking change is the Stripe "Basil" API version (2025-03-31):
 * `current_period_end` was REMOVED from the top-level Subscription object and
 * moved to `subscription.items.data[0].current_period_end`.
 *
 * The old code defended against a non-existent camelCase problem while silently
 * reading `undefined` from both fields on Basil API 2025-03-31+ — meaning
 * subscription renewal dates never synced to the database.
 *
 * The fix extracts a pure helper `extractSubscriptionPeriodEnd(subscription)`
 * that:
 *   1. Checks `items.data[0].current_period_end` (Basil API 2025-03-31+ — primary)
 *   2. Falls back to `current_period_end` (pre-Basil — backward compat)
 *   3. Returns null when neither is present
 *
 * Pure helper extraction enables unit testing without invoking the full
 * webhook route (which requires signature verification + DB mocks).
 */

// Use a minimal local interface to keep the helper decoupled from the Stripe
// SDK's exact Subscription shape (which has 100+ fields). The helper only
// needs to read these two fields.
interface StripeSubscriptionLike {
  current_period_end?: number | null;
  items?: {
    data?: Array<{ current_period_end?: number | null }>;
  };
}

describe('extractSubscriptionPeriodEnd — Stripe Basil API migration', () => {
  it('reads from items.data[0] when present (Basil API 2025-03-31+)', () => {
    const subscription: StripeSubscriptionLike = {
      // Basil API removed current_period_end from the top-level Subscription
      // object. It now lives on each subscription item.
      items: { data: [{ current_period_end: 1735689600 }] },
    };

    expect(extractSubscriptionPeriodEnd(subscription)).toBe(1735689600);
  });

  it('falls back to top-level current_period_end (pre-Basil backward compat)', () => {
    const subscription: StripeSubscriptionLike = {
      // Older Stripe API versions still expose current_period_end on the
      // Subscription itself. We need to support these for accounts that
      // haven't migrated to the Basil API version.
      current_period_end: 1704067200,
      // items.data[0].current_period_end may also be present; we prefer
      // the items path when both exist (Basil is canonical going forward).
      items: { data: [{}] },
    };

    expect(extractSubscriptionPeriodEnd(subscription)).toBe(1704067200);
  });

  it('prefers items.data[0] over top-level when both are present', () => {
    // Both shapes can coexist during API-version migration windows.
    // Basil is the source of truth going forward.
    const subscription: StripeSubscriptionLike = {
      current_period_end: 1111111111,
      items: { data: [{ current_period_end: 2222222222 }] },
    };

    expect(extractSubscriptionPeriodEnd(subscription)).toBe(2222222222);
  });

  it('returns null when neither field is present', () => {
    const subscription: StripeSubscriptionLike = {
      // Some Stripe events (e.g., deleted subscriptions) may not include
      // period info at all.
      items: { data: [{}] },
    };

    expect(extractSubscriptionPeriodEnd(subscription)).toBeNull();
  });

  it('returns null when items.data is an empty array', () => {
    const subscription: StripeSubscriptionLike = {
      current_period_end: null,
      items: { data: [] },
    };

    expect(extractSubscriptionPeriodEnd(subscription)).toBeNull();
  });

  it('returns null when items is missing entirely', () => {
    const subscription: StripeSubscriptionLike = {
      current_period_end: null,
    };

    expect(extractSubscriptionPeriodEnd(subscription)).toBeNull();
  });

  it('handles null items.data[0].current_period_end by falling back to top-level', () => {
    const subscription: StripeSubscriptionLike = {
      current_period_end: 1640995200,
      items: { data: [{ current_period_end: null }] },
    };

    expect(extractSubscriptionPeriodEnd(subscription)).toBe(1640995200);
  });

  it('handles completely empty subscription object', () => {
    expect(extractSubscriptionPeriodEnd({})).toBeNull();
  });
});

// H7 fix: Stripe webhook idempotency via ON CONFLICT (not TOCTOU SELECT-then-INSERT)
describe('H7: Stripe webhook idempotency source-level guarantees', () => {
  const WEBHOOK_PATH = resolve(__dirname, '../../app/api/stripe/webhook/route.ts');

  it('webhook uses onConflictDoNothing for idempotency (not SELECT-then-INSERT)', () => {
    const source = readFileSync(WEBHOOK_PATH, 'utf-8');
    expect(source).toMatch(/onConflictDoNothing/);
    expect(source).toMatch(/usageEvents\.idempotencyKey/);
  });

  it('webhook uses event.id as the idempotencyKey', () => {
    const source = readFileSync(WEBHOOK_PATH, 'utf-8');
    expect(source).toMatch(/idempotencyKey:\s*event\.id/);
  });

  it('H7: webhook does NOT use the hardcoded system user UUID', () => {
    const source = readFileSync(WEBHOOK_PATH, 'utf-8');
    // The old code had userId: '00000000-0000-0000-0000-000000000000'
    // which violated the FK constraint. The new code uses userId: null.
    expect(source).not.toMatch(/00000000-0000-0000-0000-000000000000/);
    expect(source).toMatch(/userId:\s*null/);
  });

  it('H7: webhook does NOT use the old TOCTOU SELECT pattern', () => {
    const source = readFileSync(WEBHOOK_PATH, 'utf-8');
    // The old code had: db.select().from(usageEvents).where(eq(usageEvents.metadata, event.id))
    // This is a TOCTOU race — the new code uses INSERT-first with ON CONFLICT.
    // Strip comments to avoid false positives on the explanation.
    const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    // The SELECT-then-INSERT pattern should NOT be present in executable code.
    // (We allow it in comments explaining the old behavior, which we stripped.)
    expect(stripped).not.toMatch(
      /\.select\(\)\s*\.from\(usageEvents\)\s*\.where\(eq\(usageEvents\.metadata/,
    );
  });
});
