'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { verifySession } from '@/features/auth/domain/verify-session';
import { moderateContent } from '@/features/pipeline/domain/moderate-content';
import { debitCredits, getOrCreateSubscription } from '@/features/billing/queries';
import { CREDIT_COSTS } from '@/features/billing/domain/tier-limits';
import { inngest, PIPELINE_EVENT } from '@/lib/inngest/client';
import { pipelineRateLimit } from '@/lib/rate-limit';

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

  // 5. INSERT PROJECT FIRST (C4 fix)
  // The project is created BEFORE debiting credits. If the DB insert fails,
  // the user loses nothing. The debit happens next with a deterministic
  // idempotency key derived from the project ID — safe against action retries.
  const [project] = await db
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
    .returning();

  if (!project) {
    return { success: false, error: 'Failed to create project', code: 'INTERNAL' };
  }

  // 6. DEBIT ANALYSIS CREDITS (after insert, with project-id-based idempotency key)
  // If the user has insufficient credits, we should ideally roll back the
  // project insert. For now, we leave the project in 'pending' status and
  // return the error — the pipeline won't trigger, so no AI costs accrue.
  // The user can top up and retry, or delete the empty project.
  try {
    const debitResult = await debitCredits(
      userId,
      CREDIT_COSTS.analysis,
      'analysis',
      `${project.id}:analysis`,
      project.id,
    );
    // If idempotent (action retry), the credit was already debited — proceed.
    void debitResult;
  } catch (err) {
    if (err instanceof Error && err.name === 'InsufficientCreditsError') {
      return {
        success: false,
        error: err.message,
        code: 'INSUFFICIENT_CREDITS',
      };
    }
    throw err; // unexpected — let it propagate
  }

  // 7. TRIGGER INNGEST PIPELINE
  await inngest.send({
    name: PIPELINE_EVENT,
    data: { projectId: project.id },
  });

  // 8. REVALIDATE + REDIRECT
  revalidatePath('/dashboard');
  redirect(`/projects/${project.id}`);
}
