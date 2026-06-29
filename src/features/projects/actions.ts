'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { verifySession } from '@/features/auth/domain/verify-session';
import { moderateContent } from '@/features/pipeline/domain/moderate-content';
import {
  debitCreditsTx,
  getOrCreateSubscription,
  InsufficientCreditsError,
} from '@/features/billing/queries';
import { CREDIT_COSTS } from '@/features/billing/domain/tier-limits';
import { inngest, PIPELINE_EVENT } from '@/lib/inngest/client';
import { pipelineRateLimit } from '@/lib/rate-limit';
import { setProjectFailed } from '@/features/pipeline/queries';

/**
 * createProjectAction — Server Action that creates a new project from a story.
 *
 * Auth-first pattern (per skills/nextjs16-react19-postgres17 §5):
 *   1. verifySession() — redirects to /sign-in if unauthenticated
 *   2. Zod validate input
 *   3. moderateContent — block if flagged (ADR-011)
 *   4. Check + debit credits
 *   5. Insert project into DB
 *   6. (Sprint 3+) trigger Inngest pipeline event
 *   7. revalidatePath + redirect to project detail
 */

const CreateProjectSchema = z.object({
  story: z
    .string()
    .min(100, 'Story must be at least 100 characters')
    .max(5000, 'Story must be under 5000 characters'),
  style: z.enum([
    'ghibli',
    'medieval', // H3: align with STYLE_CHIPS
    'oil-painting',
    'anime',
    'japanese-animation', // H3: align with STYLE_CHIPS
    'realistic',
    'cyberpunk',
    'watercolor',
    'comic',
  ]),
  aspectRatio: z.enum(['portrait', 'landscape']),
  title: z.string().min(1).max(100).optional(),
});

export type CreateProjectResult =
  | { success: true; projectId: string }
  | {
      success: false;
      error: string;
      code:
        | 'UNAUTHORIZED'
        | 'VALIDATION'
        | 'FLAGGED'
        | 'INSUFFICIENT_CREDITS'
        | 'INTERNAL'
        | 'RATE_LIMITED';
    };

export async function createProjectAction(
  input: z.infer<typeof CreateProjectSchema>,
): Promise<CreateProjectResult> {
  // 1. AUTH FIRST
  const session = await verifySession({ redirectTo: '/create' });
  const userId = session.user?.id;
  if (!userId) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // 1b. C3: RATE LIMIT — 5 project creations per user per minute.
  // Prevents AI cost amplification (each project triggers a 6-step pipeline
  // costing ~$0.50-$2 in inference). The limit uses the user ID as the
  // identifier, so it's per-user (not per-IP) — a single user can't bypass
  // it by switching networks.
  const { success: rateLimitOk } = await pipelineRateLimit.limit(userId);
  if (!rateLimitOk) {
    return {
      success: false,
      error: 'You are creating projects too quickly. Please wait a minute and try again.',
      code: 'RATE_LIMITED',
    };
  }

  // 2. ZOD VALIDATE
  const parsed = CreateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
      code: 'VALIDATION',
    };
  }

  // 3. CONTENT MODERATION (ADR-011 — mandatory)
  const moderation = await moderateContent(parsed.data.story);
  if (moderation.flagged) {
    return {
      success: false,
      error: 'Your story was flagged by content moderation. Please revise and try again.',
      code: 'FLAGGED',
    };
  }

  // 4. ENSURE SUBSCRIPTION EXISTS (free-tier auto-create if needed)
  // We do this BEFORE the insert so the subscription row is ready for the
  // debit. The debit itself happens AFTER the insert (C4 fix below).
  await getOrCreateSubscription(userId);

  // 5. INSERT PROJECT + DEBIT CREDITS IN A SINGLE TRANSACTION (T3/H-1 fix)
  //
  // H-1 bug: Previously the project INSERT and the credit debit were separate
  // top-level operations. If debitCredits threw InsufficientCreditsError, the
  // project row was already committed as an orphan with status='pending' —
  // cluttering the dashboard with ghost projects the user could never complete.
  //
  // T3 fix: Wrap both in a single db.transaction(). If the debit throws, the
  // transaction rolls back and no project row is committed. The user sees a
  // clean INSUFFICIENT_CREDITS error with no orphan.
  let projectId: string;
  try {
    projectId = await db.transaction(async (tx) => {
      // 5a. INSERT project (inside the transaction)
      const [project] = await tx
        .insert(projects)
        .values({
          userId,
          title: parsed.data.title ?? parsed.data.story.slice(0, 50) + '…',
          story: parsed.data.story,
          style: parsed.data.style,
          aspectRatio: parsed.data.aspectRatio,
          status: 'pending',
          creditsCost: CREDIT_COSTS.analysis,
        })
        .returning({ id: projects.id });

      if (!project) {
        throw new Error('Failed to create project');
      }

      // 5b. DEBIT analysis credits (inside the SAME transaction).
      // If this throws InsufficientCreditsError, the transaction rolls back
      // and the project INSERT above is undone — no orphan row.
      await debitCreditsTx(
        tx,
        userId,
        CREDIT_COSTS.analysis,
        'analysis',
        `${project.id}:analysis`,
        project.id,
      );

      return project.id;
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return {
        success: false,
        error: err.message,
        code: 'INSUFFICIENT_CREDITS',
      };
    }
    // Unexpected error — let it propagate so the user sees a generic failure
    // rather than a silently orphaned project.
    throw err;
  }

  // 6. TRIGGER INNGEST PIPELINE (outside the transaction — fire-and-forget)
  // T7 (M-2): If inngest.send() fails (Inngest API down), mark the project as
  // failed so the user sees a clear error instead of a permanently-pending orphan.
  try {
    await inngest.send({
      name: PIPELINE_EVENT,
      data: { projectId },
    });
  } catch (err) {
    console.error('[createProjectAction] Failed to trigger Inngest pipeline:', err);
    await setProjectFailed(projectId, 'Failed to queue the AI pipeline. Please try again.');
    return {
      success: false,
      error: 'Failed to queue the AI pipeline. Please try again.',
      code: 'INTERNAL',
    };
  }

  // 7. REVALIDATE + REDIRECT
  revalidatePath('/dashboard');
  redirect(`/projects/${projectId}`);
}
