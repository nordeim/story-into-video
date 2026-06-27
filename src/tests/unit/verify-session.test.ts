import { describe, it, expect, vi } from 'vitest';

// Mock next-auth's auth() function and next/navigation's redirect()
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    // redirect() throws NEXT_REDIRECT internally — simulate that
    const err = new Error('NEXT_REDIRECT');
    (err as unknown as { digest: string }).digest = 'NEXT_REDIRECT';
    throw err;
  }),
}));

import { auth } from '@/lib/auth';
import { verifySession } from '@/features/auth/domain/verify-session';

describe('verifySession — DAL auth function', () => {
  it('returns the session when authenticated', async () => {
    const mockSession = {
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
      expires: '2026-12-31',
    };
    vi.mocked(auth).mockResolvedValue(mockSession as never);

    const result = await verifySession();
    expect(result).toEqual(mockSession);
    expect(result.user?.id).toBe('user-123');
  });

  it('throws NEXT_REDIRECT when unauthenticated (auth returns null)', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(verifySession()).rejects.toThrow('NEXT_REDIRECT');
  });

  it('redirects to /sign-in when unauthenticated (with default callbackUrl)', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    try {
      await verifySession();
    } catch {
      // Expected — the redirect throws
    }
    const { redirect } = await import('next/navigation');
    expect(redirect).toHaveBeenCalledWith('/sign-in?callbackUrl=%2F');
  });

  it('supports a custom callbackUrl via redirectTo param', async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    try {
      await verifySession({ redirectTo: '/dashboard' });
    } catch {
      // Expected
    }
    const { redirect } = await import('next/navigation');
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('/sign-in'));
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining('callbackUrl'));
  });
});
