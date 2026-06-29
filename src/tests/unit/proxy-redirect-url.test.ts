import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * T2 (C-2) — Proxy redirect must use env.NEXT_PUBLIC_APP_URL, not nextUrl.origin.
 *
 * Bug: All 4 protected routes (/dashboard, /create, /billing, /projects/*) returned
 * net::ERR_CONNECTION_REFUSED for unauthenticated users on the live site.
 *
 * Root cause: `new URL('/sign-in', nextUrl.origin)` derives protocol+host from the
 * incoming request. Behind a TLS-terminating reverse proxy (Cloudflare Tunnel),
 * nextUrl.protocol is 'http:' (not 'https:') and/or the Host header doesn't match
 * the public URL. The redirect goes to http://public-domain/sign-in → port 80 →
 * connection refused (only 443 is open).
 *
 * Fix: Use `new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)` so the redirect always
 * uses the canonical public HTTPS URL, regardless of how the request arrived.
 *
 * Source-reading test (per project convention for Edge-runtime modules).
 */
describe('T2: Proxy redirect uses canonical public URL', () => {
  const proxyPath = join(process.cwd(), 'src', 'proxy.ts');
  const source = readFileSync(proxyPath, 'utf-8');
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('does NOT construct the signInUrl from nextUrl.origin', () => {
    // The bug: new URL('/sign-in', nextUrl.origin)
    expect(stripped).not.toMatch(/new\s+URL\(\s*['"]\/sign-in['"]\s*,\s*nextUrl\.origin\s*\)/);
  });

  it('constructs the signInUrl from env.NEXT_PUBLIC_APP_URL', () => {
    // The fix: new URL('/sign-in', env.NEXT_PUBLIC_APP_URL)
    expect(stripped).toMatch(/new\s+URL\(\s*['"]\/sign-in['"]\s*,\s*env\.NEXT_PUBLIC_APP_URL\s*\)/);
  });

  it('still passes nextUrl.pathname as the callbackUrl search param', () => {
    // The callbackUrl must still reflect the path the user tried to visit
    expect(stripped).toMatch(
      /signInUrl\.searchParams\.set\(\s*['"]callbackUrl['"]\s*,\s*nextUrl\.pathname\s*\)/,
    );
  });
});
