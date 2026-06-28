import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * H10/C5 — Concurrency test for debitCredits idempotency.
 *
 * This test verifies that debitCredits is race-condition-proof when called
 * concurrently with the SAME idempotency key (simulating an Inngest retry).
 * Exactly ONE call should debit credits; the others should return
 * { idempotent: true } without touching the balance.
 */

// Hoist all mock state so the vi.mock factory can reference it
const { mockReturning, mockUpdateSet, mockTransaction } = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockOnConflictDoNothing = vi.fn(() => ({ returning: mockReturning }));
  const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  const mockFor = vi.fn(() => ({
    limit: vi.fn().mockResolvedValue([{ id: 'sub-1', creditsRemaining: 100 }]),
  }));
  const mockSelectFrom = vi.fn(() => ({
    where: vi.fn(() => ({ for: mockFor, limit: vi.fn() })),
  }));
  const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));
  const mockUpdateWhere = vi.fn().mockResolvedValue(undefined);
  const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
  const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));
  const mockTransaction = vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
    return cb({ insert: mockInsert, select: mockSelect, update: mockUpdate });
  });
  return { mockReturning, mockUpdateSet, mockTransaction };
});

vi.mock('@/lib/db', () => ({
  db: { transaction: mockTransaction },
}));

import { debitCredits } from '@/features/billing/queries';

describe('H10/C5: debitCredits concurrency + idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Simulate ON CONFLICT DO NOTHING: first insert with a key returns a row,
    // subsequent inserts with the same key return empty (conflict).
    mockReturning.mockImplementation(() => {
      if (mockReturning.mock.calls.length === 1) {
        return Promise.resolve([{ id: 'evt-success' }]);
      }
      return Promise.resolve([]);
    });
  });

  it('a single debitCredits call succeeds and debits credits', async () => {
    mockReturning.mockResolvedValueOnce([{ id: 'evt-1' }]);

    const result = await debitCredits('user-1', 10, 'voiceover', 'proj-1:voiceover', 'proj-1');

    expect(result.idempotent).toBe(false);
    expect(result.eventId).toBe('evt-1');
    expect(result.creditsRemaining).toBe(90); // 100 - 10
    // The UPDATE was called (balance debited)
    expect(mockUpdateSet).toHaveBeenCalled();
  });

  it('a second call with the SAME idempotency key returns idempotent=true (no debit)', async () => {
    // First call succeeds
    mockReturning.mockResolvedValueOnce([{ id: 'evt-1' }]);
    await debitCredits('user-1', 10, 'voiceover', 'proj-1:voiceover', 'proj-1');

    // Second call with same key — ON CONFLICT returns empty
    mockReturning.mockResolvedValueOnce([]);
    const result = await debitCredits('user-1', 10, 'voiceover', 'proj-1:voiceover', 'proj-1');

    expect(result.idempotent).toBe(true);
    expect(result.eventId).toBeNull();
    expect(result.creditsRemaining).toBeNull();
    // The UPDATE should NOT have been called for the second debit
    // (mockUpdateSet was called once for the first debit, not twice)
    expect(mockUpdateSet).toHaveBeenCalledTimes(1);
  });

  it('concurrent calls with the SAME key: exactly one succeeds, others are idempotent', async () => {
    // Simulate the race: the first insert returns a row, the rest return empty
    let callCount = 0;
    mockReturning.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve([{ id: 'evt-winner' }]);
      }
      return Promise.resolve([]);
    });

    // Fire 10 concurrent calls with the same idempotency key
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        debitCredits('user-1', 10, 'voiceover', 'proj-1:voiceover', 'proj-1'),
      ),
    );

    const successful = results.filter((r) => !r.idempotent);
    const idempotent = results.filter((r) => r.idempotent);

    // Exactly ONE call debited credits
    expect(successful).toHaveLength(1);
    expect(successful[0]!.eventId).toBe('evt-winner');
    expect(successful[0]!.creditsRemaining).toBe(90);

    // The other 9 were idempotent (no debit)
    expect(idempotent).toHaveLength(9);
    for (const r of idempotent) {
      expect(r.eventId).toBeNull();
      expect(r.creditsRemaining).toBeNull();
    }

    // The UPDATE was called exactly ONCE (only the winner debited)
    expect(mockUpdateSet).toHaveBeenCalledTimes(1);
  });

  it('calls with DIFFERENT keys both succeed (no false idempotency)', async () => {
    mockReturning.mockResolvedValueOnce([{ id: 'evt-1' }]);
    const result1 = await debitCredits('user-1', 10, 'voiceover', 'proj-1:voiceover', 'proj-1');

    mockReturning.mockResolvedValueOnce([{ id: 'evt-2' }]);
    const result2 = await debitCredits('user-1', 10, 'voiceover', 'proj-1:scene:1', 'proj-1');

    expect(result1.idempotent).toBe(false);
    expect(result2.idempotent).toBe(false);
    expect(result1.eventId).toBe('evt-1');
    expect(result2.eventId).toBe('evt-2');
    // Both debits applied
    expect(mockUpdateSet).toHaveBeenCalledTimes(2);
  });
});
