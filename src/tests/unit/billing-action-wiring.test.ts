import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * T1 (C-1) — Billing page must call checkoutAction via a Server Action binding.
 *
 * Bug: The billing page rendered `<form action="/api/stripe/checkout?plan=${plan}">`
 * but no such API route exists. The `checkoutAction` Server Action is implemented
 * in `src/features/billing/actions.ts` but never called from the UI. Clicking
 * "Upgrade to Creator/Pro/Studio" returned a 404 — 100% of paid conversions blocked.
 *
 * Fix: Convert the form to use a Server Action (`<form action={billingCheckoutAction}>`)
 * that extracts the plan from formData and calls `checkoutAction(plan)`.
 *
 * This is a source-reading test (per project convention for server-only modules).
 */
describe('T1: Billing page wires upgrade button to checkoutAction', () => {
  const billingPagePath = join(process.cwd(), 'src', 'app', '(app)', 'billing', 'page.tsx');
  const source = readFileSync(billingPagePath, 'utf-8');
  // Strip comments so docblocks don't trigger false positives
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('imports billingCheckoutAction from the billing feature', () => {
    // T1: The billing page imports billingCheckoutAction (a Server Action wrapper
    // that extracts plan from formData and delegates to checkoutAction).
    // billingCheckoutAction lives in billing/actions.ts (has "use server" at top).
    expect(stripped).toMatch(
      /import\s+\{[^}]*\bbillingCheckoutAction\b[^}]*\}\s+from\s+['"]@\/features\/billing\/actions['"]/,
    );
  });

  it('does NOT post to the non-existent /api/stripe/checkout route', () => {
    expect(stripped).not.toMatch(/action=['"`]\/api\/stripe\/checkout/);
    expect(stripped).not.toMatch(/\/api\/stripe\/checkout/);
  });

  it('binds the form to a Server Action (action={...} JSX expression)', () => {
    expect(stripped).toMatch(/<form\s+action=\{/);
  });

  it('passes the plan value via a button name/value pair (progressive enhancement)', () => {
    // The button must have name="plan" and value={plan} so formData carries it
    expect(stripped).toMatch(/name=["']plan["']/);
    expect(stripped).toMatch(/value=\{plan\}/);
  });
});
