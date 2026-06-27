import { auth } from '@/lib/auth';

/**
 * Middleware — Layer 0 of the 5-layer architecture.
 *
 * Cookie check + redirect ONLY. NO database access. NO business logic.
 * Runs on Edge runtime (limited Node.js APIs).
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §5
 *
 * In Auth.js v5, the `auth` function exported from NextAuth() can be used
 * directly as middleware. It checks the session cookie and redirects
 * unauthenticated users to the signIn page when accessing protected paths.
 *
 * The middleware only checks cookie presence. Actual session validity is
 * verified by verifySession() in Server Components / Server Actions.
 */
export default auth;

export const config = {
  // Protect app routes; exclude static assets, images, auth API, and public API
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|api/auth|api/stripe|api/inngest).*)',
    '/dashboard/:path*',
    '/create/:path*',
    '/settings/:path*',
    '/billing/:path*',
  ],
};
