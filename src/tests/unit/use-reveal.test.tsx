import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useEffect } from 'react';
import { useReveal } from '@/lib/hooks/use-reveal';

// Type for the mock observer so we can access its callback
interface MockObserver {
  callback: IntersectionObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  takeRecords: ReturnType<typeof vi.fn>;
}

// Test harness component that attaches the ref to a real DOM element.
// Uses a ref + useEffect to expose the latest revealed state synchronously
// without violating the react-hooks/refs rule (no ref writes during render).
function TestReveal({
  stateRef,
  options,
}: {
  stateRef: React.MutableRefObject<boolean>;
  options?: Parameters<typeof useReveal>[0];
}) {
  const { ref, revealed } = useReveal<HTMLDivElement>(options);
  useEffect(() => {
    stateRef.current = revealed;
  }, [revealed, stateRef]);
  return <div ref={ref}>test target</div>;
}

describe('useReveal hook', () => {
  let observers: MockObserver[];

  beforeEach(() => {
    observers = [];

    class MockIntersectionObserver {
      callback: IntersectionObserverCallback;
      observe = vi.fn();
      disconnect = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);

      constructor(cb: IntersectionObserverCallback) {
        this.callback = cb;
        observers.push(this as unknown as MockObserver);
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  it('returns revealed=false initially', () => {
    const stateRef = { current: true };
    render(<TestReveal stateRef={stateRef} />);
    expect(stateRef.current).toBe(false);
    expect(screen.getByText('test target')).toBeInTheDocument();
  });

  it('creates an IntersectionObserver on mount', () => {
    const stateRef = { current: false };
    render(<TestReveal stateRef={stateRef} />);
    expect(observers.length).toBeGreaterThanOrEqual(1);
  });

  it('sets revealed=true when observer reports intersection', () => {
    const stateRef = { current: false };
    render(<TestReveal stateRef={stateRef} />);

    const observer = observers[0];
    if (!observer) throw new Error('Observer not created');

    act(() => {
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(stateRef.current).toBe(true);
  });

  it('does NOT set revealed=true when observer reports non-intersection (default once=true)', () => {
    const stateRef = { current: false };
    render(<TestReveal stateRef={stateRef} />);

    const observer = observers[0];
    if (!observer) throw new Error('Observer not created');

    act(() => {
      observer.callback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(stateRef.current).toBe(false);
  });

  it('disconnects observer after first intersection (once=true default)', () => {
    const stateRef = { current: false };
    render(<TestReveal stateRef={stateRef} />);

    const observer = observers[0];
    if (!observer) throw new Error('Observer not created');

    act(() => {
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('does NOT disconnect after intersection when once=false', () => {
    const stateRef = { current: false };
    render(<TestReveal stateRef={stateRef} options={{ once: false }} />);

    const observer = observers[0];
    if (!observer) throw new Error('Observer not created');

    act(() => {
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(observer.disconnect).not.toHaveBeenCalled();
  });

  it('toggles revealed back to false on non-intersection when once=false', () => {
    const stateRef = { current: false };
    render(<TestReveal stateRef={stateRef} options={{ once: false }} />);

    const observer = observers[0];
    if (!observer) throw new Error('Observer not created');

    act(() => {
      observer.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(stateRef.current).toBe(true);

    act(() => {
      observer.callback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(stateRef.current).toBe(false);
  });
});
