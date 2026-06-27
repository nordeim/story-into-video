import { openai } from '@/lib/ai/openai';

/**
 * Content moderation — runs OpenAI Moderation API on user-submitted text.
 *
 * Per ADR-011, this is MANDATORY on every story input before the pipeline
 * starts. Flagged content is blocked; repeated violations auto-suspend.
 */

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  const result = await openai.moderations.create({
    input: text,
  });

  const first = result.results[0];
  if (!first) {
    throw new Error('OpenAI Moderation returned no results');
  }

  const flaggedCategories = Object.entries(first.categories)
    .filter(([, flagged]) => flagged === true)
    .map(([category]) => category);

  return {
    flagged: first.flagged,
    categories: flaggedCategories,
  };
}
