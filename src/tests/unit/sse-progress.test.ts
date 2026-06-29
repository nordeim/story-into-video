import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * T9 — SSE progress stream route + use-project-progress hook.
 *
 * The route must:
 *   - Be force-dynamic (Next.js 16 requirement for SSE)
 *   - Use auth() (API pattern), NOT verifySession() (which redirects)
 *   - Owner-check via getProject() (returns 404 if not owner)
 *   - Return text/event-stream content-type
 *   - Stream { status, progressPercent, progressDetail } events
 *   - Close when status is 'completed' or 'failed'
 *
 * The hook must:
 *   - Open an EventSource on mount
 *   - Update state on each message
 *   - Close on unmount
 */

// Source-reading tests for the route — we can't easily render an SSE
// endpoint in jsdom, so we verify the route file's structure.
describe('T9: SSE progress route source-level guarantees', () => {
  const routePath = resolve(__dirname, '../../app/api/projects/[id]/progress/route.ts');

  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  it('route file exists', () => {
    // Will throw if file doesn't exist
    expect(() => readFileSync(routePath, 'utf-8')).not.toThrow();
  });

  it('exports force-dynamic', () => {
    const source = readFileSync(routePath, 'utf-8');
    expect(source).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
  });

  it('uses auth() (not verifySession) — API pattern', () => {
    const source = readFileSync(routePath, 'utf-8');
    const codeOnly = stripComments(source);
    expect(codeOnly).toMatch(/auth\(\)/);
    expect(codeOnly).not.toMatch(/verifySession/);
  });

  it('returns 401 when unauthenticated', () => {
    const source = readFileSync(routePath, 'utf-8');
    expect(source).toMatch(/401/);
  });

  it('owner-checks via getProject', () => {
    const source = readFileSync(routePath, 'utf-8');
    expect(source).toMatch(/getProject/);
  });

  it('returns text/event-stream content-type', () => {
    const source = readFileSync(routePath, 'utf-8');
    expect(source).toMatch(/text\/event-stream/);
  });

  it('closes the stream when status is completed or failed', () => {
    const source = readFileSync(routePath, 'utf-8');
    expect(source).toMatch(/completed|failed/);
  });

  // C3 + T5: SSE route must limit to 1 concurrent connection per user/project.
  // T5 replaced sseRateLimit.fixedWindow with claimSseSlot/releaseSseSlot/refreshSseSlot
  // to fix the H-3 bug where the slot was never released on disconnect.
  it('C3+T5: route imports claim/release/refresh from @/lib/rate-limit', () => {
    const source = readFileSync(routePath, 'utf-8');
    expect(source).toMatch(/from ['"]@\/lib\/rate-limit['"]/);
    expect(source).toMatch(/claimSseSlot/);
    expect(source).toMatch(/releaseSseSlot/);
    expect(source).toMatch(/refreshSseSlot/);
  });

  it('C3+T5: route calls claimSseSlot before opening the stream', () => {
    const source = readFileSync(routePath, 'utf-8');
    expect(source).toMatch(/claimSseSlot\s*\(/);
  });

  it('C3: route returns 429 when SSE rate limit is exceeded', () => {
    const source = readFileSync(routePath, 'utf-8');
    expect(source).toMatch(/429/);
  });
});

// Source-reading tests for the hook
describe('T9: use-project-progress hook source-level guarantees', () => {
  const hookPath = resolve(__dirname, '../../lib/hooks/use-project-progress.ts');

  it('hook file exists', () => {
    expect(() => readFileSync(hookPath, 'utf-8')).not.toThrow();
  });

  it('is a client hook (has "use client")', () => {
    const source = readFileSync(hookPath, 'utf-8');
    expect(source).toMatch(/^['"]use client['"]/m);
  });

  it('uses EventSource', () => {
    const source = readFileSync(hookPath, 'utf-8');
    expect(source).toMatch(/EventSource/);
  });

  it('closes EventSource on unmount (cleanup)', () => {
    const source = readFileSync(hookPath, 'utf-8');
    expect(source).toMatch(/\.close\(\)/);
  });
});

// Functional test for the hook using @testing-library/react
describe('T9: use-project-progress hook functional behavior', () => {
  it('subscribes to the SSE endpoint and updates state on message', async () => {
    const { renderHook, act } = await import('@testing-library/react');
    const { useProjectProgress } = await import('@/lib/hooks/use-project-progress');

    // The hook uses eventSource.onmessage directly (not addEventListener).
    // Capture the instance via a mutable holder so TS doesn't narrow to never.
    const holder: { current: unknown } = { current: null };
    const closeMock = vi.fn();

    interface CapturedInstance {
      onopen: ((ev: unknown) => void) | null;
      onmessage: ((ev: { data: string }) => void) | null;
      onerror: ((ev: unknown) => void) | null;
      close: () => void;
    }

    class MockEventSource {
      static CLOSED = 2;
      onopen: ((ev: unknown) => void) | null = null;
      onmessage: ((ev: { data: string }) => void) | null = null;
      onerror: ((ev: unknown) => void) | null = null;
      readyState = 1;
      url = '';
      withCredentials = false;

      constructor(public readonly src: string) {
        holder.current = this;
      }

      close = closeMock;

      dispatchEvent() {
        return true;
      }
    }

    vi.stubGlobal('EventSource', MockEventSource);

    const { result, unmount } = renderHook(() => useProjectProgress('proj-123'));

    // Wait for the effect to attach handlers
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });

    const instance = holder.current as CapturedInstance | null;
    expect(instance).not.toBeNull();
    expect(instance?.onmessage).not.toBeNull();

    // Simulate receiving a message
    act(() => {
      instance?.onmessage?.({
        data: JSON.stringify({
          status: 'generating_scenes',
          progressPercent: 50,
          progressDetail: 'Generating scene 3 of 6…',
          errorMessage: null,
        }),
      });
    });

    expect(result.current.status).toBe('generating_scenes');
    expect(result.current.progressPercent).toBe(50);
    expect(result.current.progressDetail).toBe('Generating scene 3 of 6…');

    unmount();
    expect(closeMock).toHaveBeenCalled();
  });
});

// T6 (remediation): The hook must reconnect with exponential backoff when
// the SSE stream drops mid-pipeline (Vercel caps SSE at 300s Hobby / 800s Pro GA; pipeline
// runs 5-15min). The old impl only set connectionState:'error' and never
// retried — users saw "Live updates disconnected" indefinitely.
describe('T6: use-project-progress reconnect behavior', () => {
  it('attempts reconnect after an SSE error (constructor called twice)', async () => {
    vi.useFakeTimers();
    const { renderHook, act } = await import('@testing-library/react');
    const { useProjectProgress } = await import('@/lib/hooks/use-project-progress');

    const constructorSpy = vi.fn();
    const closeMock = vi.fn();
    const instances: Array<{
      onerror: ((ev: unknown) => void) | null;
      onmessage: ((ev: { data: string }) => void) | null;
      onopen: ((ev: unknown) => void) | null;
    }> = [];

    class MockEventSource {
      static CLOSED = 2;
      onopen: ((ev: unknown) => void) | null = null;
      onmessage: ((ev: { data: string }) => void) | null = null;
      onerror: ((ev: unknown) => void) | null = null;
      readyState = 1;

      constructor(public readonly src: string) {
        constructorSpy(src);
        instances.push(this);
      }

      close = closeMock;
      dispatchEvent() {
        return true;
      }
    }

    vi.stubGlobal('EventSource', MockEventSource);

    renderHook(() => useProjectProgress('proj-456'));

    // Initial EventSource created in useEffect (advance microtasks + 0ms timers)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(constructorSpy).toHaveBeenCalledTimes(1);
    expect(instances[0]?.onerror).not.toBeNull();

    // Simulate an SSE error on the first instance
    await act(async () => {
      instances[0]?.onerror?.(new Event('error'));
    });

    // Advance through the 1s backoff. The hook calls setTimeout(openStream, 1000).
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    // After error + backoff, the hook should have created a second EventSource
    expect(constructorSpy).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('source contains reconnect logic with exponential backoff', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const hookSource = readFileSync(
      resolve(__dirname, '../../lib/hooks/use-project-progress.ts'),
      'utf-8',
    );

    // Must declare a max reconnect attempts constant
    expect(hookSource).toMatch(/MAX_RECONNECT_ATTEMPTS\s*=/);
    // Must reference backoff delay (1s, 2s, 4s = exponential)
    expect(hookSource).toMatch(/setTimeout|backoff/i);
    // Must call new EventSource in the reconnect path
    expect(hookSource).toMatch(/new EventSource/);
    // Must track attempt count
    expect(hookSource).toMatch(/reconnectAttempt|attempt/i);
  });

  it('source sets maxDuration on the SSE route to 800s (Vercel Pro GA ceiling)', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const routeSource = readFileSync(
      resolve(__dirname, '../../app/api/projects/[id]/progress/route.ts'),
      'utf-8',
    );
    // Vercel Fluid Compute (now default) caps Pro/Enterprise GA at 800s,
    // with 1800s available in beta. Hobby caps at 300s.
    //
    // The previous value of 900 EXCEEDED the GA limit and would silently
    // fall back to the default (~60s) on Vercel Pro, causing mid-pipeline
    // disconnects worse than the original 300s baseline. 800 is the correct
    // Pro GA ceiling; the client-side reconnect (also T6) handles Hobby's
    // 300s cap via exponential backoff (1s → 2s → 4s).
    expect(routeSource).toMatch(/maxDuration\s*=\s*800/);
  });
});
