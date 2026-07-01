import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T8 (status_11.md) — GDPR cookie consent banner.
 *
 * The Privacy Policy §3 mentions transactional emails and §6 lists GDPR
 * rights, but no cookie consent UI exists. Required for EU/UK/CA compliance.
 *
 * Design: dismissible informational banner (NOT a consent gate — the app
 * doesn't use analytics/tracking cookies). Client component (uses useState +
 * localStorage). SSR-safe: renders null on first render, shows banner after
 * useEffect confirms localStorage is empty.
 */

const COOKIE_BANNER_PATH = resolve(__dirname, '../../components/app/cookie-banner.tsx');
const LAYOUT_PATH = resolve(__dirname, '../../app/layout.tsx');

describe('T8: GDPR cookie consent banner', () => {
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  describe('source-level guarantees', () => {
    it('file exists at src/components/app/cookie-banner.tsx', () => {
      expect(() => readFileSync(COOKIE_BANNER_PATH, 'utf-8')).not.toThrow();
    });

    it('is a client component (uses useSyncExternalStore + localStorage)', () => {
      const source = readFileSync(COOKIE_BANNER_PATH, 'utf-8');
      expect(source).toMatch(/^['"]use client['"]/m);
      // useSyncExternalStore is the React 19-blessed pattern for reading
      // browser-only APIs (localStorage) without triggering the
      // react-hooks/set-state-in-effect lint rule.
      expect(source).toMatch(/useSyncExternalStore/);
      expect(source).toMatch(/localStorage/);
    });

    it('links to /privacy (Privacy Policy)', () => {
      const source = stripComments(readFileSync(COOKIE_BANNER_PATH, 'utf-8'));
      expect(source).toMatch(/href=['"]\/privacy['"]/);
    });

    it('uses brand tokens (no bg-zinc-950/900/black, no amber-300/400/500/600)', () => {
      const source = readFileSync(COOKIE_BANNER_PATH, 'utf-8');
      expect(source).not.toMatch(/\bamber-(300|400|500|600)\b/);
      expect(source).not.toMatch(/\bbg-(zinc-950|zinc-900|black)\b/);
    });
  });

  describe('layout mounting', () => {
    it('layout.tsx imports and renders CookieBanner', () => {
      const source = stripComments(readFileSync(LAYOUT_PATH, 'utf-8'));
      expect(source).toMatch(/CookieBanner/);
      expect(source).toMatch(/from\s+['"]@\/components\/app\/cookie-banner['"]/);
    });
  });

  describe('behavioral tests (jsdom)', () => {
    it('renders banner text + Privacy Policy link + dismiss button after mount', async () => {
      const { CookieBanner } = await import('@/components/app/cookie-banner');
      render(<CookieBanner />);

      // SSR renders null — wait for the useEffect to flip the state
      await waitFor(() => {
        expect(screen.getByText(/cookies/i)).toBeInTheDocument();
      });

      // Privacy Policy link is present
      expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();

      // Dismiss button is present
      expect(screen.getByRole('button', { name: /got it|dismiss|accept/i })).toBeInTheDocument();
    });

    it('clicking dismiss persists to localStorage and hides the banner', async () => {
      const { CookieBanner } = await import('@/components/app/cookie-banner');
      render(<CookieBanner />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /got it|dismiss|accept/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /got it|dismiss|accept/i }));

      // localStorage should now have the acknowledged flag
      expect(localStorage.getItem('siv-cookie-consent')).toBe('acknowledged');

      // Banner should be hidden
      await waitFor(() => {
        expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument();
      });
    });

    it('renders null when localStorage already has "acknowledged"', async () => {
      localStorage.setItem('siv-cookie-consent', 'acknowledged');
      const { CookieBanner } = await import('@/components/app/cookie-banner');
      const { container } = render(<CookieBanner />);

      // After mount, useEffect reads localStorage and keeps the banner hidden
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });
});
