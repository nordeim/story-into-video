import { Inngest } from 'inngest';

import { env } from '@/lib/env';

/**
 * Inngest client — used for the multi-step AI pipeline orchestration.
 *
 * Per ADR-004, Inngest handles retries, timeouts, observability, and
 * concurrency for the 5–15 minute pipeline (moderation → analysis →
 * characters → scenes → voiceover → assembly).
 *
 * Pattern source: skills/nextjs16-react19-postgres17/SKILL.md §7 (BullMQ
 * pipeline structure, adapted to Inngest step functions)
 */

export const inngest = new Inngest({
  id: 'story-into-video',
  eventKey: env.INNGEST_EVENT_KEY,
  signingKey: env.INNGEST_SIGNING_KEY,
});

export const PIPELINE_EVENT = 'pipeline.started' as const;
