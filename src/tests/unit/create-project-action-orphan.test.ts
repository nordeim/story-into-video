import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T3 (H-1) — createProjectAction must wrap INSERT + debit in a transaction.
 *
 * Bug: The project INSERT (top-level) and debitCredits (separate transaction)
 * were not wrapped in a shared transaction. If debitCredits threw
 * InsufficientCreditsError, the project row was committed as an orphan with
 * status='pending' — cluttering the dashboard with ghost projects.
 *
 * Fix: Wrap both operations in a single db.transaction(). Add a debitCreditsTx
 * variant that accepts an existing transaction handle.
 *
 * Source-reading test (verifies the structural fix without needing a real DB).
 */
describe('T3: createProjectAction wraps INSERT + debit in a transaction', () => {
  const actionsPath = resolve(process.cwd(), 'src', 'features', 'projects', 'actions.ts');
  const source = readFileSync(actionsPath, 'utf-8');
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  const billingPath = resolve(process.cwd(), 'src', 'features', 'billing', 'queries.ts');
  const billingSource = readFileSync(billingPath, 'utf-8');
  const billingStripped = billingSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('billing/queries.ts exports a debitCreditsTx function that accepts a transaction handle', () => {
    expect(billingStripped).toMatch(/export\s+async\s+function\s+debitCreditsTx\s*\(/);
  });

  it('billing/queries.ts debitCreditsTx accepts a tx parameter as its first arg', () => {
    // The tx param is the transaction handle from db.transaction(callback)
    expect(billingStripped).toMatch(/export\s+async\s+function\s+debitCreditsTx\s*\(\s*tx\s*:/);
  });

  it('createProjectAction wraps the INSERT + debit in db.transaction()', () => {
    expect(stripped).toMatch(/db\.transaction\s*\(/);
  });

  it('createProjectAction calls debitCreditsTx (not debitCredits) inside the transaction', () => {
    // Inside the transaction callback, the code should call debitCreditsTx(tx, ...)
    // rather than the standalone debitCredits(userId, ...)
    expect(stripped).toMatch(/debitCreditsTx\s*\(/);
  });
});
