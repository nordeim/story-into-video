import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import type { Session } from 'next-auth';

/**
 * verifySession — the DAL auth function.
 *
 * Returns the session if the user is authenticated, or throws NEXT_REDIRECT
 * (via redirect()) to /sign-in if not.
 *
 * CRITICAL (from skills/nextjs16-react19-postgres17/SKILL.md §6):
 *   - NEVER wrap verifySession() in try/catch — it throws NEXT_REDIRECT which
 *     must propagate. Wrapping it silently swallows the redirect.
 *   - For API routes, use `auth()` directly (returns null → 401 JSON), NOT
 *     verifySession() (which redirects — wrong for a JSON API).
 *
 * Usage in Server Components / Server Actions:
 *   const session = await verifySession();
 *   // session.user.id is guaranteed non-null past this point
 */

interface VerifySessionOptions {
  /** Where to send the user after sign-in (defaults to current route) */
  redirectTo?: string;
}

export async function verifySession(options?: VerifySessionOptions): Promise<Session> {
  const session = await auth();

  if (!session) {
    const callbackUrl = options?.redirectTo ?? '/';
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session as Session;
}
