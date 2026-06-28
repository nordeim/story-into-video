'use client';

import { useEffect, useState } from 'react';

/**
 * useProjectProgress — subscribes to the SSE progress stream for a project.
 *
 * Opens an EventSource on /api/projects/[id]/progress, parses incoming
 * JSON events, and exposes the latest status/progress to the component.
 * Closes the EventSource on unmount or when status reaches a terminal state.
 *
 * T6 (remediation): Reconnect with exponential backoff when the stream drops.
 * M5 fix: Vercel Fluid Compute caps SSE at 300s (Hobby) or 800s (Pro/Enterprise
 * GA; 1800s in beta). The pipeline runs 5-15min, so a single SSE connection
 * may not survive a full generation. On error, the hook waits (1s → 2s → 4s)
 * and reopens the EventSource, up to MAX_RECONNECT_ATTEMPTS (3). After max
 * attempts, the connectionState becomes 'error' and the UI shows a
 * "Reconnect failed" message.
 *
 * Reconnect is also cancelled if the user unmounts the component or if
 * the stream reaches a terminal status (completed/failed).
 */

export interface ProjectProgressState {
  status: string | null;
  progressPercent: number | null;
  progressDetail: string | null;
  errorMessage: string | null;
  connectionState: 'connecting' | 'open' | 'closed' | 'error' | 'reconnecting';
}

const INITIAL_STATE: ProjectProgressState = {
  status: null,
  progressPercent: null,
  progressDetail: null,
  errorMessage: null,
  connectionState: 'connecting',
};

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

/** Maximum reconnect attempts before giving up. */
const MAX_RECONNECT_ATTEMPTS = 3;

/** Base backoff in ms. Doubles each attempt: 1000 → 2000 → 4000. */
const BASE_BACKOFF_MS = 1000;

/** Compute the backoff delay for a given attempt (0-indexed). */
function backoffDelay(attempt: number): number {
  return BASE_BACKOFF_MS * Math.pow(2, attempt);
}

export function useProjectProgress(projectId: string): ProjectProgressState {
  const [state, setState] = useState<ProjectProgressState>(INITIAL_STATE);

  useEffect(() => {
    if (!projectId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;
    let isCancelled = false;

    const openStream = () => {
      if (isCancelled) return;

      eventSource = new EventSource(`/api/projects/${projectId}/progress`);

      eventSource.onopen = () => {
        // Successful open resets the reconnect counter
        reconnectAttempt = 0;
        setState((prev) => ({ ...prev, connectionState: 'open' }));
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            status: string;
            progressPercent: number;
            progressDetail: string | null;
            errorMessage: string | null;
          };
          setState({
            ...data,
            connectionState: 'open',
          });

          // Close the EventSource when terminal — server will also close,
          // but this avoids a redundant reconnect attempt
          if (TERMINAL_STATUSES.has(data.status)) {
            eventSource?.close();
            setState((prev) => ({ ...prev, connectionState: 'closed' }));
          }
        } catch {
          // Malformed JSON — ignore the message
        }
      };

      eventSource.onerror = () => {
        // Defensive: EventSource may already be closed
        if (!eventSource) return;
        eventSource.close();
        eventSource = null;

        // Don't reconnect if we've hit the attempt cap or the component
        // unmounted, or if we already reached a terminal status (no point
        // reopening a stream for a finished project).
        if (isCancelled) return;
        if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
          setState((prev) => ({ ...prev, connectionState: 'error' }));
          return;
        }

        // Schedule reconnect with exponential backoff
        const delay = backoffDelay(reconnectAttempt);
        reconnectAttempt += 1;
        setState((prev) => ({ ...prev, connectionState: 'reconnecting' }));
        reconnectTimer = setTimeout(() => {
          if (!isCancelled) openStream();
        }, delay);
      };
    };

    openStream();

    // Cleanup on unmount: cancel any pending reconnect + close the source
    return () => {
      isCancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) eventSource.close();
    };
  }, [projectId]);

  return state;
}
