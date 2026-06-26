import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

describe('useReducedMotion hook', () => {
  let listeners: Array<() => void>;
  let matches: boolean;

  beforeEach(() => {
    listeners = [];
    matches = false;

    const mockMediaQuery = {
      get matches() {
        return matches;
      },
      addEventListener: vi.fn((_: 'change', cb: () => void) => {
        listeners.push(cb);
      }),
      removeEventListener: vi.fn(),
    };

    const mockMatchMedia = vi.fn(() => mockMediaQuery);
    vi.stubGlobal('matchMedia', mockMatchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when matchMedia reports no-reduce', () => {
    matches = false;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when matchMedia reports reduce', () => {
    matches = true;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when the media query change event fires', () => {
    matches = false;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    // Simulate user enabling reduce-motion at OS level
    matches = true;
    act(() => {
      listeners.forEach((cb) => cb());
    });

    expect(result.current).toBe(true);
  });

  it('updates back to false when reduce-motion is disabled', () => {
    matches = true;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);

    matches = false;
    act(() => {
      listeners.forEach((cb) => cb());
    });

    expect(result.current).toBe(false);
  });
});
