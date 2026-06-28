import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock the fonts module — next/font/local and geist aren't available in jsdom.
vi.mock('@/lib/fonts', () => ({
  fontVariables: 'geistsans-variable geistmono-variable outfit-variable',
}));

// Mock next-auth/react — SessionProvider fires a fetch('/api/auth/session')
// on mount which fails in jsdom (no base URL). Replace it with a pass-through
// that renders children unchanged. This eliminates act() warnings, AuthError
// spam, and the "<html> cannot be child of <div>" hydration noise.
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import RootLayout from '@/app/layout';

const LAYOUT_PATH = resolve(__dirname, '../../app/layout.tsx');
const layoutSource = readFileSync(LAYOUT_PATH, 'utf-8');

describe('RootLayout — hydration resilience', () => {
  afterEach(() => {
    cleanup();
  });

  it('layout source has suppressHydrationWarning on <body> (hydration guard)', () => {
    // suppressHydrationWarning is a React-internal prop consumed by the reconciler
    // during hydration — it does NOT appear in the rendered DOM. We verify it by
    // reading the source file and checking the <body> opening tag.
    //
    // This prevents regression: if someone removes the prop, this test fails.
    // The Grammarly browser extension injects data-new-gr-c-s-check-loaded and
    // data-gr-ext-installed into <body> before React hydrates, causing a
    // hydration mismatch if suppressHydrationWarning is absent.
    //
    // We use a regex to extract the full <body ...> opening tag (which may span
    // multiple lines after Prettier formatting) rather than a line-by-line search.
    const bodyTag = layoutSource.match(/<body[\s\S]*?>/)?.[0];
    expect(bodyTag).toBeDefined();
    expect(bodyTag).toContain('suppressHydrationWarning');
  });

  it('layout source has correct body className', () => {
    // Extract the full <body ...> opening tag via regex — handles multi-line
    // tags that Prettier may produce when attributes exceed the print width.
    const bodyTag = layoutSource.match(/<body[\s\S]*?>/)?.[0];
    expect(bodyTag).toBeDefined();
    expect(bodyTag).toContain('bg-background');
    expect(bodyTag).toContain('text-foreground');
    expect(bodyTag).toContain('min-h-screen');
    expect(bodyTag).toContain('antialiased');
  });

  it('renders skip-to-content link targeting #main', () => {
    const { container } = render(
      <RootLayout>
        <div>child</div>
      </RootLayout>,
    );

    const skipLink = container.querySelector('a[href="#main"]');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveClass('sr-only');
  });

  it('renders JSON-LD structured data script', () => {
    const { container } = render(
      <RootLayout>
        <div>child</div>
      </RootLayout>,
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();

    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('SoftwareApplication');
    expect(data.name).toBe('StoryIntoVideo');
  });

  it('renders children inside body', () => {
    const { getByText } = render(
      <RootLayout>
        <div>test content</div>
      </RootLayout>,
    );

    expect(getByText('test content')).toBeInTheDocument();
  });
});
