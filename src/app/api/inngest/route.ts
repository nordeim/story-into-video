import { serve } from 'inngest/next';

import { inngest } from '@/lib/inngest/client';
import { functions } from '@/lib/inngest/functions';

/**
 * Inngest webhook route — receives events from Inngest and dispatches to
 * registered functions. Must be dynamic (receives POST webhooks).
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
