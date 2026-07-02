import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * NF-2 — Security headers: Content-Security-Policy + Strict-Transport-Security.
 *
 * The live site at https://storyintovideo.jesspete.shop/ emits 4 security headers
 * (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
 * but is MISSING:
 *   - Content-Security-Policy (no browser-level XSS mitigation)
 *   - Strict-Transport-Security (no origin-level HSTS; Cloudflare mitigates at
 *     edge only, breaking defense-in-depth)
 *
 * These tests read the next.config.ts source and assert both headers are present
 * with the required policy directives. Source-reading is appropriate here because
 * next.config.ts runs at build time (not importable in jsdom).
 */

const CONFIG_PATH = resolve(__dirname, '../../..', 'next.config.ts');

function readConfigSource(): string {
  return readFileSync(CONFIG_PATH, 'utf-8');
}

describe('NF-2: Security headers — Content-Security-Policy + HSTS', () => {
  it('next.config.ts headers() returns 6 headers (4 existing + CSP + HSTS)', () => {
    const source = readConfigSource();
    // Count the number of { key: '...', value: '...' } entries inside headers()
    const headerKeys = source.match(/key:\s*'([^']+)'/g) ?? [];
    expect(headerKeys.length).toBeGreaterThanOrEqual(6);
  });

  it('emits Strict-Transport-Security with max-age=63072000 (2 years) + includeSubDomains + preload', () => {
    const source = readConfigSource();
    expect(source).toMatch(/Strict-Transport-Security/);
    // max-age must be 63072000 (2 years) — the OWASP-recommended minimum for preload eligibility
    expect(source).toMatch(/max-age=63072000/);
    expect(source).toMatch(/includeSubDomains/);
    expect(source).toMatch(/preload/);
  });

  it('emits Content-Security-Policy with default-src self', () => {
    const source = readConfigSource();
    expect(source).toMatch(/Content-Security-Policy/);
    expect(source).toMatch(/default-src\s+'self'/);
  });

  it('CSP restricts frame-ancestors to none (equivalent to X-Frame-Options: DENY)', () => {
    const source = readConfigSource();
    expect(source).toMatch(/frame-ancestors\s+'none'/);
  });

  it('CSP allows self + data: + https: for img-src (og:image, examples, R2 signed URLs)', () => {
    const source = readConfigSource();
    expect(source).toMatch(/img-src\s+'self'\s+data:\s+https:/);
  });

  it('CSP allows self for font-src (self-hosted Geist + Outfit fonts)', () => {
    const source = readConfigSource();
    expect(source).toMatch(/font-src\s+'self'/);
  });

  it('CSP restricts connect-src to self (all AI calls are server-side, no external browser API calls)', () => {
    const source = readConfigSource();
    expect(source).toMatch(/connect-src\s+'self'/);
  });

  it('CSP restricts base-uri and form-action to self', () => {
    const source = readConfigSource();
    expect(source).toMatch(/base-uri\s+'self'/);
    expect(source).toMatch(/form-action\s+'self'/);
  });
});
