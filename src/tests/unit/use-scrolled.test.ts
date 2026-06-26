import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrolled } from '@/lib/hooks/use-scrolled';

describe('useScrolled hook', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollY', 0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when scrollY is below threshold (default 10px)', () => {
    vi.stubGlobal('scrollY', 5);
    const { result } = renderHook(() => useScrolled());
    expect(result.current).toBe(false);
  });

  it('returns true when scrollY exceeds threshold (default 10px)', () => {
    vi.stubGlobal('scrollY', 15);
    const { result } = renderHook(() => useScrolled());
    expect(result.current).toBe(true);
  });

  it('returns false when scrollY equals threshold exactly (boundary)', () => {
    vi.stubGlobal('scrollY', 10);
    const { result } = renderHook(() => useScrolled());
    expect(result.current).toBe(false);
  });

  it('honors custom threshold argument (below threshold)', () => {
    vi.stubGlobal('scrollY', 50);
    const { result } = renderHook(() => useScrolled(100));
    expect(result.current).toBe(false);
  });

  it('honors custom threshold argument (above threshold)', () => {
    vi.stubGlobal('scrollY', 150);
    const { result } = renderHook(() => useScrolled(100));
    expect(result.current).toBe(true);
  });

  it('updates when scroll event fires', () => {
    vi.stubGlobal('scrollY', 0);
    const { result } = renderHook(() => useScrolled(10));
    expect(result.current).toBe(false);

    act(() => {
      vi.stubGlobal('scrollY', 20);
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(true);
  });

  it('updates back to false when scrolling up past threshold', () => {
    vi.stubGlobal('scrollY', 50);
    const { result } = renderHook(() => useScrolled(10));
    expect(result.current).toBe(true);

    act(() => {
      vi.stubGlobal('scrollY', 5);
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(false);
  });
});
