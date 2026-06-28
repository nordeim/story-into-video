import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * C1 — Sign-up flow is completely non-functional.
 *
 * The AuthForm component calls signIn('credentials', ...) for BOTH sign-in
 * and sign-up modes, but the Credentials provider's authorize() only checks
 * existing users — it has no user-creation logic. Users cannot create
 * accounts via email/password.
 *
 * This test verifies the new signUpAction server action exists and works.
 */

// Mock the db
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]), // no existing user by default
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'user-new-1', email: 'new@test.com' }]),
      })),
    })),
  },
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password-12-cost'),
    compare: vi.fn(),
  },
}));

// Mock billing queries (getOrCreateSubscription)
vi.mock('@/features/billing/queries', () => ({
  getOrCreateSubscription: vi.fn().mockResolvedValue({ id: 'sub-1', plan: 'free' }),
}));

// Mock rate-limit (C3)
vi.mock('@/lib/rate-limit', () => ({
  authRateLimit: {
    limit: vi.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 900000,
      pending: Promise.resolve(),
    }),
  },
}));

// Mock next/headers (for getClientIp in signUpAction)
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((name: string) => {
      if (name === 'x-forwarded-for') return '127.0.0.1';
      if (name === 'x-real-ip') return null;
      return null;
    }),
  }),
}));

import { signUpAction } from '@/features/auth/actions';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getOrCreateSubscription } from '@/features/billing/queries';
import { authRateLimit } from '@/lib/rate-limit';

describe('C1: signUpAction server action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signUpAction is exported from src/features/auth/actions.ts', () => {
    expect(signUpAction).toBeDefined();
    expect(typeof signUpAction).toBe('function');
  });

  it('hashes the password with bcrypt cost factor 12 (matches docs, not seed)', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    } as never);

    await signUpAction({ email: 'new@test.com', password: 'password123' });

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
  });

  it('returns EMAIL_EXISTS when the email is already registered', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([{ id: 'existing-user', email: 'taken@test.com' }]),
        })),
      })),
    } as never);

    const result = await signUpAction({ email: 'taken@test.com', password: 'password123' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('EMAIL_EXISTS');
    }
    // Should NOT have hashed the password or inserted a user
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('creates the user + free-tier subscription on success', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    } as never);

    const result = await signUpAction({
      email: 'new@test.com',
      password: 'password123',
      name: 'New User',
    });

    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
    expect(getOrCreateSubscription).toHaveBeenCalledWith('user-new-1');
  });

  it('returns VALIDATION when password is shorter than 8 characters', async () => {
    const result = await signUpAction({ email: 'new@test.com', password: 'short' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('VALIDATION');
    }
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });

  it('returns VALIDATION when email is malformed', async () => {
    const result = await signUpAction({ email: 'not-an-email', password: 'password123' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('VALIDATION');
    }
  });

  // C3: signUpAction must rate-limit to prevent credential stuffing + spam account creation
  it('C3: calls authRateLimit.limit before creating a user', async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    } as never);

    await signUpAction({ email: 'new@test.com', password: 'password123' });

    expect(authRateLimit.limit).toHaveBeenCalled();
  });

  it('C3: returns RATE_LIMITED when auth rate limit is exceeded', async () => {
    vi.mocked(authRateLimit.limit).mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 900000,
      pending: Promise.resolve(),
    });

    const result = await signUpAction({ email: 'new@test.com', password: 'password123' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('RATE_LIMITED');
    }
    // Should NOT have hashed the password or inserted a user
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});

// Source-reading test: verify the action file exists + uses the right patterns
describe('C1: signUpAction source-structure verification', () => {
  const ACTIONS_PATH = resolve(__dirname, '../../features/auth/actions.ts');

  it('src/features/auth/actions.ts exports signUpAction', () => {
    const source = readFileSync(ACTIONS_PATH, 'utf-8');
    expect(source).toMatch(/export async function signUpAction/);
  });

  it('signUpAction uses bcrypt.hash with cost factor 12', () => {
    const source = readFileSync(ACTIONS_PATH, 'utf-8');
    expect(source).toMatch(/bcrypt\.hash\([^,]+,\s*12\)/);
  });

  it('signUpAction has a Zod schema validating email + password', () => {
    const source = readFileSync(ACTIONS_PATH, 'utf-8');
    expect(source).toMatch(/z\.object/);
    expect(source).toMatch(/z\.string\(\)\.email/);
    // password field uses z.string().min(8) — allow multiline (Prettier splits
    // long chains across lines)
    expect(source).toMatch(/password:\s*z\s*\.\s*string\(\)\s*\.\s*min\(8/);
  });

  it("signUpAction starts with 'use server' directive", () => {
    const source = readFileSync(ACTIONS_PATH, 'utf-8');
    expect(source.startsWith("'use server'")).toBe(true);
  });
});
