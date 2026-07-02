import type { NextConfig } from 'next';

/**
 * Content-Security-Policy for StoryIntoVideo.
 *
 * Directives:
 *   - default-src 'self'                 — deny everything not explicitly allowed
 *   - script-src 'self' 'unsafe-inline'  — Next.js inline runtime scripts require 'unsafe-inline'
 *                                           (a future hardening pass can switch to nonce-based)
 *   - style-src 'self' 'unsafe-inline'   — Tailwind v4 + Next.js inject inline styles
 *   - img-src 'self' data: https:        — self-hosted examples + og:image + R2 signed URLs (https)
 *   - font-src 'self'                    — self-hosted Geist + Outfit (no CDN)
 *   - connect-src 'self'                 — all AI calls are server-side; browser only talks to origin
 *   - media-src 'self'                   — workflow showcase MP4s are self-hosted
 *   - frame-ancestors 'none'             — equivalent to X-Frame-Options: DENY (clickjacking)
 *   - base-uri 'self'                    — prevent <base> injection
 *   - form-action 'self'                 — forms may only submit to origin
 *   - object-src 'none'                  — no Flash/Java/plugins
 *
 * Note: 'unsafe-inline' is required for Next.js App Router (inline <script> chunks
 * for the router state). A nonce-based CSP is the production-hardened alternative
 * but requires per-request nonce generation via Next.js 16's built-in support —
 * deferred to a future hardening sprint.
 */
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ['storyintovideo.jesspete.shop', '192.168.2.132'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // NF-2: Content-Security-Policy — browser-level XSS mitigation.
          // Without this, an injected inline script (compromised dependency,
          // stored XSS in user content) executes freely.
          { key: 'Content-Security-Policy', value: CSP_POLICY },
          // NF-2: Strict-Transport-Security — origin-level HSTS (defense-in-depth
          // behind Cloudflare's edge HSTS). max-age=63072000 (2 years) is the
          // OWASP-recommended minimum for preload-list eligibility.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
