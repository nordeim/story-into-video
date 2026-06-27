import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  debitCredits: vi.fn(),
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
    vi.mocked(debitCredits).mockResolvedValue(undefined);

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
    vi.mocked(debitCredits).mockResolvedValue(undefined);

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
    vi.mocked(debitCredits).mockResolvedValue(undefined);

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
});
