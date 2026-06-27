import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

/**
 * Middleware — Layer 0 of the 5-layer architecture.
 *
 * Cookie check + redirect ONLY. NO database access. NO business logic.
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §5
 *
 * In Auth.js v5, the `auth` function exported from NextAuth() can be used
 * as middleware. However, the default behavior only populates `req.auth` —
 * it does NOT automatically redirect unauthenticated users.
 *
 * We wrap it with an explicit redirect check for protected routes.
 * The middleware only checks cookie presence. Actual session validity is
 * verified by verifySession() in Server Components / Server Actions.
 *
 * CRITICAL: The matcher must ONLY list protected routes. If a catch-all
 * pattern is included, it shadows the specific route matchers and the
 * middleware never runs on the protected paths.
 */
export default auth(async (req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  // Define protected path prefixes
  const protectedPaths = ['/dashboard', '/create', '/settings', '/billing'];
  const isProtectedPath = protectedPaths.some((p) =>
    nextUrl.pathname.startsWith(p),
  );

  if (isProtectedPath && !isAuthenticated) {
    const signInUrl = new URL('/sign-in', nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Only run middleware on auth-protected routes.
  // Static assets, marketing pages, and API routes are NOT listed here.
  matcher: [
    '/dashboard/:path*',
    '/create/:path*',
    '/settings/:path*',
    '/billing/:path*',
  ],
};
