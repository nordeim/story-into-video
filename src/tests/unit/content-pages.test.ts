import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T6 (status_11.md) — Implement /pricing, /blog, /contact pages.
 *
 * These routes are linked from the navbar (nav-links.ts) and footer
 * (footer-links.ts) but currently return 404. This creates a poor UX + SEO
 * footprint — Next.js falls back to its default 404 page (which inherits
 * root layout metadata, making unknown URLs look like the marketing page).
 *
 * All 3 pages are Server Components (no client state) with proper metadata,
 * following the existing /privacy and /terms pattern. Each has a CTA pointing
 * to /create (the working conversion path).
 */

const PRICING_PATH = resolve(__dirname, '../../app/(legal)/pricing/page.tsx');
const BLOG_PATH = resolve(__dirname, '../../app/(legal)/blog/page.tsx');
const CONTACT_PATH = resolve(__dirname, '../../app/(legal)/contact/page.tsx');

describe('T6: /pricing, /blog, /contact content pages', () => {
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  describe('/pricing page', () => {
    it('file exists', () => {
      expect(() => readFileSync(PRICING_PATH, 'utf-8')).not.toThrow();
    });

    it('is a server component (no "use client")', () => {
      const source = readFileSync(PRICING_PATH, 'utf-8');
      expect(source).not.toMatch(/^['"]use client['"]/m);
    });

    it('exports metadata with a title', () => {
      const source = stripComments(readFileSync(PRICING_PATH, 'utf-8'));
      expect(source).toMatch(/export\s+const\s+metadata/);
      expect(source).toMatch(/title:/);
    });

    it('contains an H1 heading', () => {
      const source = readFileSync(PRICING_PATH, 'utf-8');
      expect(source).toMatch(/<h1/);
    });

    it('links to /create (conversion CTA)', () => {
      const source = readFileSync(PRICING_PATH, 'utf-8');
      // Accept either literal href="/create" (Link with static prop) or
      // href: '/create' (in a data array driving a Link). Both count as
      // "links to /create".
      expect(source).toMatch(/(href=['"]\/create['"])|(href:\s*['"]\/create['"])/);
    });

    it('uses brand tokens (no bg-zinc-950/900/black, no amber-300/400/500/600)', () => {
      const source = readFileSync(PRICING_PATH, 'utf-8');
      expect(source).not.toMatch(/\bamber-(300|400|500|600)\b/);
      expect(source).not.toMatch(/\bbg-(zinc-950|zinc-900|black)\b/);
    });
  });

  describe('/blog page', () => {
    it('file exists', () => {
      expect(() => readFileSync(BLOG_PATH, 'utf-8')).not.toThrow();
    });

    it('is a server component (no "use client")', () => {
      const source = readFileSync(BLOG_PATH, 'utf-8');
      expect(source).not.toMatch(/^['"]use client['"]/m);
    });

    it('exports metadata with a title', () => {
      const source = stripComments(readFileSync(BLOG_PATH, 'utf-8'));
      expect(source).toMatch(/export\s+const\s+metadata/);
      expect(source).toMatch(/title:/);
    });

    it('contains an H1 heading', () => {
      const source = readFileSync(BLOG_PATH, 'utf-8');
      expect(source).toMatch(/<h1/);
    });

    it('links to /create (conversion CTA)', () => {
      const source = readFileSync(BLOG_PATH, 'utf-8');
      expect(source).toMatch(/(href=['"]\/create['"])|(href:\s*['"]\/create['"])/);
    });

    it('uses brand tokens (no bg-zinc-950/900/black, no amber-300/400/500/600)', () => {
      const source = readFileSync(BLOG_PATH, 'utf-8');
      expect(source).not.toMatch(/\bamber-(300|400|500|600)\b/);
      expect(source).not.toMatch(/\bbg-(zinc-950|zinc-900|black)\b/);
    });
  });

  describe('/contact page', () => {
    it('file exists', () => {
      expect(() => readFileSync(CONTACT_PATH, 'utf-8')).not.toThrow();
    });

    it('is a server component (no "use client")', () => {
      const source = readFileSync(CONTACT_PATH, 'utf-8');
      expect(source).not.toMatch(/^['"]use client['"]/m);
    });

    it('exports metadata with a title', () => {
      const source = stripComments(readFileSync(CONTACT_PATH, 'utf-8'));
      expect(source).toMatch(/export\s+const\s+metadata/);
      expect(source).toMatch(/title:/);
    });

    it('contains an H1 heading', () => {
      const source = readFileSync(CONTACT_PATH, 'utf-8');
      expect(source).toMatch(/<h1/);
    });

    it('links to /create (conversion CTA)', () => {
      const source = readFileSync(CONTACT_PATH, 'utf-8');
      expect(source).toMatch(/(href=['"]\/create['"])|(href:\s*['"]\/create['"])/);
    });

    it('uses brand tokens (no bg-zinc-950/900/black, no amber-300/400/500/600)', () => {
      const source = readFileSync(CONTACT_PATH, 'utf-8');
      expect(source).not.toMatch(/\bamber-(300|400|500|600)\b/);
      expect(source).not.toMatch(/\bbg-(zinc-950|zinc-900|black)\b/);
    });
  });
});
