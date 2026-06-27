'use client';

import { useEffect, useState } from 'react';

/**
 * useProjectProgress — subscribes to the SSE progress stream for a project.
 *
 * Opens an EventSource on /api/projects/[id]/progress, parses incoming
 * JSON events, and exposes the latest status/progress to the component.
 * Closes the EventSource on unmount or when status reaches a terminal state.
 */

export interface ProjectProgressState {
  status: string | null;
  progressPercent: number | null;
  progressDetail: string | null;
  errorMessage: string | null;
  connectionState: 'connecting' | 'open' | 'closed' | 'error';
}

const INITIAL_STATE: ProjectProgressState = {
  status: null,
  progressPercent: null,
  progressDetail: null,
  errorMessage: null,
  connectionState: 'connecting',
};

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

export function useProjectProgress(projectId: string): ProjectProgressState {
  const [state, setState] = useState<ProjectProgressState>(INITIAL_STATE);

  useEffect(() => {
    if (!projectId) return;

    const eventSource = new EventSource(`/api/projects/${projectId}/progress`);

    eventSource.onopen = () => {
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
          eventSource.close();
          setState((prev) => ({ ...prev, connectionState: 'closed' }));
        }
      } catch {
        // Malformed JSON — ignore the message
      }
    };

    eventSource.onerror = () => {
      setState((prev) => ({
        ...prev,
        connectionState: EventSource.CLOSED ? 'closed' : 'error',
      }));
    };

    return () => {
      eventSource.close();
    };
  }, [projectId]);

  return state;
}
