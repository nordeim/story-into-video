import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock the fonts module — next/font/local and geist aren't available in jsdom.
vi.mock('@/lib/fonts', () => ({
  fontVariables: 'geistsans-variable geistmono-variable outfit-variable',
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
    // reading the source file and checking the <body> JSX line.
    //
    // This prevents regression: if someone removes the prop, this test fails.
    // The Grammarly browser extension injects data-new-gr-c-s-check-loaded and
    // data-gr-ext-installed into <body> before React hydrates, causing a
    // hydration mismatch if suppressHydrationWarning is absent.
    const bodyLine = layoutSource.split('\n').find((line) => line.includes('<body'));
    expect(bodyLine).toBeDefined();
    expect(bodyLine).toContain('suppressHydrationWarning');
  });

  it('layout source has correct body className', () => {
    const bodyLine = layoutSource.split('\n').find((line) => line.includes('<body'));
    expect(bodyLine).toBeDefined();
    expect(bodyLine).toContain('bg-background');
    expect(bodyLine).toContain('text-foreground');
    expect(bodyLine).toContain('min-h-screen');
    expect(bodyLine).toContain('antialiased');
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
