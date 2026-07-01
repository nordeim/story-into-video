import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T7 (status_11.md) — Custom not-found.tsx page.
 *
 * Without a custom not-found.tsx, Next.js falls back to its default 404 page
 * which inherits the root layout's metadata — making unknown URLs look like
 * the marketing page (200 OK + marketing title in the browser tab). This is
 * bad for SEO (search engines can't distinguish real pages from 404s) and
 * bad for UX (no clear "go back home" CTA).
 *
 * The custom not-found.tsx provides an on-brand 404 with proper navigation
 * back to / and /create.
 */

const NOT_FOUND_PATH = resolve(__dirname, '../../app/not-found.tsx');

describe('T7: Custom not-found.tsx page', () => {
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  it('file exists at src/app/not-found.tsx', () => {
    expect(() => readFileSync(NOT_FOUND_PATH, 'utf-8')).not.toThrow();
  });

  it('is a server component (no "use client")', () => {
    const source = readFileSync(NOT_FOUND_PATH, 'utf-8');
    expect(source).not.toMatch(/^['"]use client['"]/m);
  });

  it('contains "404" text', () => {
    const source = readFileSync(NOT_FOUND_PATH, 'utf-8');
    expect(source).toMatch(/404/);
  });

  it('contains a "not found" or "page not found" heading', () => {
    const source = readFileSync(NOT_FOUND_PATH, 'utf-8');
    expect(source).toMatch(/not found/i);
  });

  it('uses next/link for internal navigation (not <a href>)', () => {
    const source = stripComments(readFileSync(NOT_FOUND_PATH, 'utf-8'));
    expect(source).toMatch(/import\s+Link\s+from\s+['"]next\/link['"]/);
    // No <a href="/..."> — internal routes use <Link>
    expect(source).not.toMatch(/<a\b[^>]*\bhref\s*=\s*['"]\/[^'"]*['"][^>]*>/);
  });

  it('links back to / (home)', () => {
    const source = stripComments(readFileSync(NOT_FOUND_PATH, 'utf-8'));
    expect(source).toMatch(/(href=['"]\/['"])|(href:\s*['"]\/['"])/);
  });

  it('links to /create (conversion CTA)', () => {
    const source = stripComments(readFileSync(NOT_FOUND_PATH, 'utf-8'));
    expect(source).toMatch(/(href=['"]\/create['"])|(href:\s*['"]\/create['"])/);
  });

  it('uses brand tokens (no bg-zinc-950/900/black, no amber-300/400/500/600)', () => {
    const source = readFileSync(NOT_FOUND_PATH, 'utf-8');
    expect(source).not.toMatch(/\bamber-(300|400|500|600)\b/);
    expect(source).not.toMatch(/\bbg-(zinc-950|zinc-900|black)\b/);
  });
});
