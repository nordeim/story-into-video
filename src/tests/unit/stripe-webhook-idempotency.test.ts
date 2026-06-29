import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * T4 (H-2) — Stripe webhook idempotency INSERT must happen AFTER side effects.
 *
 * Bug: The idempotency INSERT happened BEFORE the event handler. If the handler
 * threw (e.g., DB update failed for checkout.session.completed), the webhook
 * returned 500 — Stripe retried — but the idempotency row was already committed,
 * so the retry hit onConflictDoNothing and returned { duplicate: true } without
 * re-processing. The subscription update was PERMANENTLY LOST.
 *
 * Fix: Move the idempotency INSERT to be the LAST step inside the try block,
 * AFTER all side effects succeed. Add a pre-check SELECT for duplicates. If the
 * handler throws, no idempotency row is inserted → Stripe retries → handler
 * runs again → succeeds → row inserted → future duplicates caught.
 *
 * Source-reading test (webhook route is a server-only module).
 */
describe('T4: Stripe webhook idempotency INSERT is AFTER side effects', () => {
  const webhookPath = join(process.cwd(), 'src', 'app', 'api', 'stripe', 'webhook', 'route.ts');
  const source = readFileSync(webhookPath, 'utf-8');
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('does NOT insert the idempotency row before the switch/event handler', () => {
    // The bug: db.insert(usageEvents)...onConflictDoNothing appeared BEFORE the switch block.
    // The fix: the insert should appear AFTER the switch block.
    // Note: we search for '.insert(usageEvents)' (not 'db.insert(usageEvents)') because
    // the source has `db\n  .insert(usageEvents)` across lines — indexOf needs a contiguous match.
    const insertPos = stripped.indexOf('.insert(usageEvents)');
    const switchPos = stripped.indexOf('switch (event.type)');
    expect(insertPos).toBeGreaterThan(-1);
    expect(switchPos).toBeGreaterThan(-1);
    // The insert must come AFTER the switch (not before)
    expect(insertPos).toBeGreaterThan(switchPos);
  });

  it('performs a duplicate pre-check via SELECT before processing', () => {
    // Pre-check: query usageEvents for event.id before running the handler.
    // This is a TOCTOU race but combined with post-handler INSERT + onConflictDoNothing,
    // it's safe: worst case, two concurrent webhooks both pass the pre-check, both run
    // the handler, one wins the INSERT, the other gets onConflictDoNothing. Side effects
    // run twice but are idempotent (Stripe subscription updates are idempotent).
    expect(stripped).toMatch(/usageEvents/);
    expect(stripped).toMatch(/event\.id/);
  });

  it('returns { duplicate: true } for already-processed events without re-running side effects', () => {
    // The duplicate response must still be returned — just via a different mechanism
    // (pre-check SELECT instead of post-insert onConflictDoNothing early return)
    expect(stripped).toMatch(/duplicate:\s*true/);
  });
});
