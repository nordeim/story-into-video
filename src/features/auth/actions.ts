'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateSubscription } from '@/features/billing/queries';
import { authRateLimit } from '@/lib/rate-limit';

/**
 * signUpAction — Server Action for email + password registration.
 *
 * C1 fix: The AuthForm component previously called signIn('credentials', ...)
 * for BOTH sign-in and sign-up modes, but the Credentials provider's
 * authorize() only checks existing users. Users could not create accounts.
 *
 * This action:
 *   1. Validates email + password with Zod (min 8 chars, max 128 chars)
 *   2. Checks if the email is already registered → returns EMAIL_EXISTS
 *   3. Hashes the password with bcrypt cost factor 12 (matches the documented
 *      standard — NOT the seed script's cost factor 10, which is dev-only)
 *   4. Inserts the user row (passwordHash populated, emailVerified = now)
 *   5. Creates a free-tier subscription via getOrCreateSubscription
 *   6. Returns { success: true, userId } on success
 *
 * The caller (AuthForm) then calls signIn('credentials', ...) to auto-login
 * the just-created user and redirect to /dashboard.
 *
 * Pattern source: skills/nextjs16-react19-next-auth5-drizzle-orm/SKILL.md §6
 */

const SignUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be under 128 characters'),
  name: z.string().min(1).max(100).optional(),
});

export type SignUpResult =
  | { success: true; userId: string }
  | {
      success: false;
      error: string;
      code: 'VALIDATION' | 'EMAIL_EXISTS' | 'INTERNAL' | 'RATE_LIMITED';
    };

/**
 * Extract the client IP from the request headers.
 * Checks X-Forwarded-For (Vercel/Cloudflare/proxies) then X-Real-IP (Nginx),
 * then falls back to 'unknown'.
 */
async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  const realIp = headersList.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export async function signUpAction(input: z.infer<typeof SignUpSchema>): Promise<SignUpResult> {
  // 0. C3: RATE LIMIT — 10 sign-ups per 15 min per IP.
  // Prevents credential stuffing and spam account creation.
  const ip = await getClientIp();
  const { success: rateLimitOk } = await authRateLimit.limit(ip);
  if (!rateLimitOk) {
    return {
      success: false,
      error: 'Too many sign-up attempts. Please wait 15 minutes and try again.',
      code: 'RATE_LIMITED',
    };
  }

  // 1. ZOD VALIDATE
  const parsed = SignUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
      code: 'VALIDATION',
    };
  }

  const { email, password, name } = parsed.data;

  // 2. CHECK IF EMAIL ALREADY EXISTS
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return {
      success: false,
      error: 'An account with this email already exists. Try signing in instead.',
      code: 'EMAIL_EXISTS',
    };
  }

  // 3. HASH PASSWORD (cost factor 12 — matches docs, not seed's 10)
  const passwordHash = await bcrypt.hash(password, 12);

  // 4. INSERT USER
  const [user] = await db
    .insert(users)
    .values({
      email,
      name: name ?? null,
      passwordHash,
      emailVerified: new Date(),
    })
    .returning({ id: users.id });

  if (!user) {
    return {
      success: false,
      error: 'Failed to create user account. Please try again.',
      code: 'INTERNAL',
    };
  }

  // 5. CREATE FREE-TIER SUBSCRIPTION
  await getOrCreateSubscription(user.id);

  return { success: true, userId: user.id };
}
