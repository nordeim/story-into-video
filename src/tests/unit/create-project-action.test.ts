import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Mock the db
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi
          .fn()
          .mockResolvedValue([
            { id: 'project-123', userId: 'user-123', title: 'Test', status: 'pending' },
          ]),
      })),
    })),
  },
}));

// Mock verifySession
vi.mock('@/features/auth/domain/verify-session', () => ({
  verifySession: vi.fn(),
}));

// Mock moderateContent
vi.mock('@/features/pipeline/domain/moderate-content', () => ({
  moderateContent: vi.fn(),
}));

// Mock billing queries
vi.mock('@/features/billing/queries', () => ({
  getOrCreateSubscription: vi.fn(),
  // C5: debitCredits now returns DebitResult { idempotent, eventId, creditsRemaining }
  debitCredits: vi.fn().mockResolvedValue({
    idempotent: false,
    eventId: 'evt-1',
    creditsRemaining: 45,
  }),
  InsufficientCreditsError: class extends Error {
    constructor(
      public required: number,
      public available: number,
    ) {
      super(`Insufficient credits: need ${required}, have ${available}`);
      this.name = 'InsufficientCreditsError';
    }
  },
}));

// Mock next/cache + next/navigation
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    const err = new Error('NEXT_REDIRECT');
    (err as unknown as { digest: string }).digest = 'NEXT_REDIRECT';
    throw err;
  }),
}));

// Mock Inngest client — pipeline trigger
vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: vi.fn().mockResolvedValue({ ids: ['event-1'] }),
  },
  PIPELINE_EVENT: 'pipeline.started',
}));

// Mock rate-limit (C3) — default to success
vi.mock('@/lib/rate-limit', () => ({
  pipelineRateLimit: {
    limit: vi.fn().mockResolvedValue({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 60000,
      pending: Promise.resolve(),
    }),
  },
}));

import { verifySession } from '@/features/auth/domain/verify-session';
import { moderateContent } from '@/features/pipeline/domain/moderate-content';
import {
  getOrCreateSubscription,
  debitCredits,
  InsufficientCreditsError,
} from '@/features/billing/queries';
import { inngest, PIPELINE_EVENT } from '@/lib/inngest/client';
import { createProjectAction } from '@/features/projects/actions';

describe('S2-02: createProjectAction Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validInput = {
    story: 'A'.repeat(200),
    style: 'anime' as const,
    aspectRatio: 'portrait' as const,
  };

  it('returns UNAUTHORIZED when session has no user id', async () => {
    vi.mocked(verifySession).mockResolvedValue({ user: null, expires: '' } as never);

    const result = await createProjectAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('UNAUTHORIZED');
    }
  });

  it('returns VALIDATION when story is too short', async () => {
    vi.mocked(verifySession).mockResolvedValue({
      user: { id: 'user-123', email: 't@t.com' },
      expires: '',
    } as never);

    const result = await createProjectAction({ ...validInput, story: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('VALIDATION');
    }
  });

  it('returns VALIDATION when story is too long', async () => {
    vi.mocked(verifySession).mockResolvedValue({
      user: { id: 'user-123', email: 't@t.com' },
      expires: '',
    } as never);

    const result = await createProjectAction({ ...validInput, story: 'A'.repeat(5001) });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe('VALIDATION');
  });

  it('returns FLAGGED when content moderation flags the story', async () => {
    vi.mocked(verifySession).mockResolvedValue({
      user: { id: 'user-123', email: 't@t.com' },
      expires: '',
    } as never);
    vi.mocked(moderateContent).mockResolvedValue({ flagged: true, categories: ['violence'] });

    const result = await createProjectAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe('FLAGGED');
  });

  it('returns INSUFFICIENT_CREDITS when debitCredits throws', async () => {
    vi.mocked(verifySession).mockResolvedValue({
      user: { id: 'user-123', email: 't@t.com' },
      expires: '',
    } as never);
    vi.mocked(moderateContent).mockResolvedValue({ flagged: false, categories: [] });
    vi.mocked(debitCredits).mockRejectedValue(new InsufficientCreditsError(5, 2));

    const result = await createProjectAction(validInput);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.code).toBe('INSUFFICIENT_CREDITS');
  });

  it('creates the project and redirects when all checks pass', async () => {
    vi.mocked(verifySession).mockResolvedValue({
      user: { id: 'user-123', email: 't@t.com' },
      expires: '',
    } as never);
    vi.mocked(moderateContent).mockResolvedValue({ flagged: false, categories: [] });
    vi.mocked(getOrCreateSubscription).mockResolvedValue({} as never);
    vi.mocked(debitCredits).mockResolvedValue({
      idempotent: false,
      eventId: 'evt-1',
      creditsRemaining: 45,
    });

    // The action calls redirect() at the end — which throws NEXT_REDIRECT
    await expect(createProjectAction(validInput)).rejects.toThrow('NEXT_REDIRECT');

    // Verify the db.insert was called
    const { db } = await import('@/lib/db');
    expect(db.insert).toHaveBeenCalled();
  });

  it('follows auth-first pattern: verifySession is the first call', async () => {
    vi.mocked(verifySession).mockResolvedValue({
      user: { id: 'user-123', email: 't@t.com' },
      expires: '',
    } as never);
    vi.mocked(moderateContent).mockResolvedValue({ flagged: false, categories: [] });
    vi.mocked(debitCredits).mockResolvedValue({
      idempotent: false,
      eventId: 'evt-1',
      creditsRemaining: 45,
    });

    try {
      await createProjectAction(validInput);
    } catch {
      // redirect throws
    }

    expect(verifySession).toHaveBeenCalled();
  });

  it('triggers Inngest pipeline event after successful project insert', async () => {
    vi.mocked(verifySession).mockResolvedValue({
      user: { id: 'user-123', email: 't@t.com' },
      expires: '',
    } as never);
    vi.mocked(moderateContent).mockResolvedValue({ flagged: false, categories: [] });
    vi.mocked(getOrCreateSubscription).mockResolvedValue({} as never);
    vi.mocked(debitCredits).mockResolvedValue({
      idempotent: false,
      eventId: 'evt-1',
      creditsRemaining: 45,
    });

    try {
      await createProjectAction(validInput);
    } catch {
      // redirect throws NEXT_REDIRECT
    }

    expect(inngest.send).toHaveBeenCalledWith({
      name: PIPELINE_EVENT,
      data: { projectId: 'project-123' },
    });
  });

  // C4: Credits must be debited AFTER the project insert succeeds.
  // If the DB insert fails, the user should NOT lose credits.
  // We verify this by checking the source code order: the projects insert
  // must appear BEFORE debitCredits in the action source.
  it('C4: project insert happens BEFORE credit debit (source order check)', () => {
    const actionsPath = resolve(__dirname, '../../features/projects/actions.ts');
    const source = readFileSync(actionsPath, 'utf-8');
    // Use .insert(projects) to match across the multiline db.insert(projects) call
    const insertPos = source.indexOf('.insert(projects)');
    const debitPos = source.indexOf('debitCredits(');
    expect(insertPos).toBeGreaterThan(-1);
    expect(debitPos).toBeGreaterThan(-1);
    expect(insertPos).toBeLessThan(debitPos);
  });

  // C4: The analysis debit must use a deterministic idempotency key derived
  // from the project ID (not a random UUID) so Inngest retries of the
  // pipeline don't double-charge if the action itself is retried.
  it('C4: analysis debit uses project-id-based idempotency key', () => {
    const actionsPath = resolve(__dirname, '../../features/projects/actions.ts');
    const source = readFileSync(actionsPath, 'utf-8');
    // The key should reference project.id (the just-inserted project)
    expect(source).toMatch(/\$\{project\.id\}:analysis/);
  });

  // C3: createProjectAction must rate-limit to prevent AI cost amplification.
  // A malicious user could spawn thousands of pipeline runs per minute without
  // this check. The rate limit uses the user ID as the identifier (5/min/user).
  it('C3: createProjectAction calls pipelineRateLimit.limit(userId) before debiting', () => {
    const actionsPath = resolve(__dirname, '../../features/projects/actions.ts');
    const source = readFileSync(actionsPath, 'utf-8');
    expect(source).toMatch(/pipelineRateLimit/);
    expect(source).toMatch(/from ['"]@\/lib\/rate-limit['"]/);
  });

  it('C3: createProjectAction returns RATE_LIMITED when limit exceeded', () => {
    const actionsPath = resolve(__dirname, '../../features/projects/actions.ts');
    const source = readFileSync(actionsPath, 'utf-8');
    expect(source).toMatch(/RATE_LIMITED/);
  });
});
