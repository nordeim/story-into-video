'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * CookieBanner — GDPR cookie consent banner.
 *
 * Dismissible informational banner (NOT a consent gate). The app doesn't
 * currently use any analytics or tracking cookies — the banner simply
 * acknowledges that we use essential cookies (session, CSRF) and links to
 * the Privacy Policy for details.
 *
 * SSR-safe via `useSyncExternalStore`: the server snapshot always returns
 * `false` (don't render banner during SSR — avoids hydration mismatch),
 * and the client snapshot reads localStorage. This is the React 19-blessed
 * pattern for reading browser-only APIs without triggering the
 * `react-hooks/set-state-in-effect` lint rule.
 *
 * Clicking "Got it" persists the acknowledgement to localStorage and triggers
 * the subscribe callback to re-render. The banner reappears if the user
 * clears localStorage or uses a different browser/device.
 */

const STORAGE_KEY = 'siv-cookie-consent';
const STORAGE_VALUE = 'acknowledged';

// Lazy-init the listeners set (only on the client — SSR doesn't have window).
const listeners = new Set<() => void>();
let initialized = false;

function ensureInit() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  // Re-render all subscribers when localStorage changes (e.g., user clears
  // site data in another tab — the storage event fires across tabs).
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      for (const listener of listeners) listener();
    }
  });
}

function subscribe(listener: () => void): () => void {
  ensureInit();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Server snapshot: always "not acknowledged" → but we render null on server
// anyway (see getServerSnapshot). This keeps the snapshot stable.
function getServerSnapshot(): boolean {
  return false;
}

// Client snapshot: read localStorage. Returns true if NOT yet acknowledged
// (i.e., the banner SHOULD show).
function getClientSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== STORAGE_VALUE;
  } catch {
    // localStorage unavailable (private browsing) — show the banner (safer for compliance).
    return true;
  }
}

export function CookieBanner() {
  const shouldShow = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, STORAGE_VALUE);
    } catch {
      // If localStorage is unavailable, the banner will reappear on next visit.
      // Acceptable — compliance favors visibility over silence.
    }
    // Notify all subscribers (including this component) to re-render.
    for (const listener of listeners) listener();
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className={cn(
        'bg-card border-primary/20 fixed inset-x-0 bottom-0 z-40 border-t',
        'px-6 py-4',
        'animate-[fade-in-up_0.4s_ease-out_both]',
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-300">
          We use essential cookies to keep you signed in and secure. By using StoryIntoVideo, you
          agree to our{' '}
          <Link
            href="/privacy"
            className="text-primary hover:text-primary focus-visible:outline-primary underline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            'bg-primary hover:bg-primary focus-visible:outline-primary',
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2',
            'text-xs font-bold text-zinc-950 transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2',
          )}
          aria-label="Dismiss cookie notice"
        >
          Got it
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
