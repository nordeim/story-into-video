import { describe, it, expect, vi } from 'vitest';

// Mock the fonts module — next/font/local and geist aren't available in jsdom.
vi.mock('@/lib/fonts', () => ({
  fontVariables: 'geistsans-variable geistmono-variable outfit-variable',
}));

import { metadata } from '@/app/layout';

describe('RootLayout metadata — SEO canonical URL', () => {
  it('defines alternates.canonical (prevents duplicate-content indexing)', () => {
    // Without alternates.canonical, Next.js does not emit a <link rel="canonical">
    // tag even when metadataBase is set. Search engines then index the page
    // ambiguously. This test guards against regression: if someone removes the
    // canonical field, this test fails.
    expect(metadata).toBeDefined();
    expect(metadata.alternates).toBeDefined();
    expect(metadata.alternates!.canonical).toBeDefined();
  });

  it('canonical resolves to the clone domain via metadataBase (not the original)', () => {
    // metadataBase is set to the clone's own domain. A canonical of '/' resolves
    // to that base — pointing search engines at the clone, NOT at the original
    // storyintovideo.com. This is the correct behavior for a clone deployment.
    expect(metadata.metadataBase).toBeDefined();
    expect(metadata.metadataBase!.toString()).not.toContain('storyintovideo.com');
    expect(metadata.alternates!.canonical).toBe('/');
  });
});
