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
