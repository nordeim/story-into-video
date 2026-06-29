import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { env } from '@/lib/env';

/**
 * Proxy — Layer 0 of the 5-layer architecture.
 *
 * Cookie check + redirect ONLY. NO database access. NO business logic.
 *
 * In Next.js 16, the `middleware` file convention is renamed to `proxy`
 * to better reflect its role as a network boundary at the Edge Runtime.
 * The functionality is identical — only the filename changes.
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §5
 * Next.js 16 migration: https://nextjs.org/docs/messages/middleware-to-proxy
 *
 * In Auth.js v5, the `auth` function exported from NextAuth() can be used
 * as middleware. However, the default behavior only populates `req.auth` —
 * it does NOT automatically redirect unauthenticated users.
 *
 * We wrap it with an explicit redirect check for protected routes.
 * The proxy only checks cookie presence. Actual session validity is
 * verified by verifySession() in Server Components / Server Actions.
 *
 * CRITICAL: The matcher must ONLY list protected routes. If a catch-all
 * pattern is included, it shadows the specific route matchers and the
 * proxy never runs on the protected paths.
 *
 * H6 fix: Host header validation. trustHost: true (in auth config) makes
 * Auth.js trust the incoming Host / X-Forwarded-Host header. Without edge
 * validation, an attacker behind a misconfigured reverse proxy can inject
 * evil.com to steal magic-link tokens (Host Header Injection). We validate
 * the Host header against a whitelist BEFORE Auth.js runs.
 */
export default auth(async (req) => {
  const { nextUrl } = req;

  // ── H6: HOST HEADER VALIDATION ──────────────────────────────────────────
  // Reject any request whose Host header doesn't match the canonical domain,
  // localhost (dev), or Vercel preview deployments. This prevents Host Header
  // Injection where trustHost: true would let Auth.js generate magic links
  // for attacker-controlled domains.
  const host = req.headers.get('host') || '';
  const appUrl = new URL(env.NEXT_PUBLIC_APP_URL);
  const isAllowedHost =
    host === appUrl.host ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.endsWith('.vercel.app');

  if (!isAllowedHost) {
    console.warn(`[proxy] Blocked request with unauthorized Host header: ${host}`);
    return new NextResponse('Invalid Host header', { status: 400 });
  }

  // ── ROUTE PROTECTION ────────────────────────────────────────────────────
  const isAuthenticated = !!req.auth;

  // Define protected path prefixes — includes /projects (H6 cleanup)
  const protectedPaths = ['/dashboard', '/create', '/settings', '/billing', '/projects'];
  const isProtectedPath = protectedPaths.some((p) => nextUrl.pathname.startsWith(p));

  if (isProtectedPath && !isAuthenticated) {
    // T2 fix: Use env.NEXT_PUBLIC_APP_URL (canonical public HTTPS URL) as the
    // redirect base, NOT nextUrl.origin. Behind a TLS-terminating reverse proxy
    // (Cloudflare Tunnel), nextUrl.protocol is 'http:' and/or the Host header
    // may not match the public domain — causing the browser to connect to
    // http://public-domain:80 → ERR_CONNECTION_REFUSED. env.NEXT_PUBLIC_APP_URL
    // is always the canonical HTTPS URL the user's browser can actually reach.
    const signInUrl = new URL('/sign-in', env.NEXT_PUBLIC_APP_URL);
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Only run middleware on auth-protected routes.
  // Static assets, marketing pages, and API routes are NOT listed here.
  // H6: /projects/:path* added — was missing, so /projects/[id] relied on
  // SSR-time verifySession() instead of edge-level protection.
  matcher: [
    '/dashboard/:path*',
    '/create/:path*',
    '/settings/:path*',
    '/billing/:path*',
    '/projects/:path*',
  ],
};
