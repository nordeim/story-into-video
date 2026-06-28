/**
 * Image moderation — checks Replicate's safety output for NSFW content.
 *
 * Per ADR-011, this is MANDATORY on every AI-generated image (characters
 * AND scenes) before the pipeline proceeds.
 *
 * Approach: parse Replicate's `safety_concept` or `api_safety_concept`
 * output field. SDXL models return an array of flagged categories when
 * their built-in safety checker rejects the output. Absent or empty
 * array = image is safe.
 *
 * This is preferred over a second OpenAI vision moderation API call
 * because:
 *   1. Zero extra latency/cost
 *   2. The safety check already happened during generation
 *   3. We're just parsing the model's existing output
 *
 * Fail-open policy (T5 remediation):
 *   - Default behavior is preserved: when the output shape is unknown
 *     (e.g., a model that doesn't expose safety fields), we return
 *     flagged=false. This is a deliberate tradeoff — fail-closed would
 *     block all generations from models that don't expose safety metadata,
 *     which is worse UX than accepting the small risk.
 *   - NEW: The `moderationSkipped` field makes the bypass observable.
 *     Callers (and operators reading logs) can detect when an image
 *     bypassed moderation. A console.warn is emitted on every skip.
 *   - NEW: The policy is env-configurable via `IMAGE_MODERATION_FAIL_OPEN`.
 *     Set to 'false' to fail-closed (flag unknown shapes as flagged:true).
 *     This is the recommended setting for production launches where the
 *     model output shape is known and stable.
 *
 * ENV MODULE INTEGRATION:
 *   The fail-open flag is read from the validated `env` module (NOT
 *   process.env directly). This catches typos like IMAGE_MOD_FAIL_OPEN
 *   that would silently fall back to the default with no error — exactly
 *   the failure mode the env module exists to prevent. Per CLAUDE.md
 *   pitfall #14 / AGENTS.md pitfall #9: never read process.env.* directly.
 */

import { env } from '@/lib/env';

export interface ModerateImageInput {
  imageUrl: string;
  rawOutput: unknown;
}

export interface ImageModerationResult {
  flagged: boolean;
  categories: string[];
  /**
   * true when moderation could not run because the output shape was unknown
   * (no recognized safety field). Operators should monitor this — a high
   * rate indicates the model is bypassing moderation entirely.
   */
  moderationSkipped: boolean;
}

const FLAGGED_KEYWORDS = new Set(['nsfw', 'sexual', 'violence', 'gore', 'hate', 'self-harm']);

/**
 * Read the fail-open policy from the validated env module. Defaults to
 * 'true' (fail-open) per the env schema. Set IMAGE_MODERATION_FAIL_OPEN=false
 * in production to fail-closed.
 *
 * Read at module load — changing the env var requires a restart. This is
 * intentional: moderation policy changes should be deliberate, not dynamic.
 */
const FAIL_OPEN = env.IMAGE_MODERATION_FAIL_OPEN === 'true';

function extractSafetyCategories(rawOutput: unknown): string[] {
  if (typeof rawOutput !== 'object' || rawOutput === null) {
    return [];
  }

  const obj = rawOutput as Record<string, unknown>;
  // Replicate SDXL models expose safety via either:
  //   - safety_concept: string[]
  //   - api_safety_concept: string[]
  //   - safety: string[]
  const safetyFields = ['safety_concept', 'api_safety_concept', 'safety'];

  for (const field of safetyFields) {
    const value = obj[field];
    if (Array.isArray(value)) {
      return value
        .map((v) => (typeof v === 'string' ? v.toLowerCase() : ''))
        .filter((v) => FLAGGED_KEYWORDS.has(v));
    }
    if (typeof value === 'string' && FLAGGED_KEYWORDS.has(value.toLowerCase())) {
      return [value.toLowerCase()];
    }
  }

  return [];
}

/**
 * Determine whether the raw output shape is "known" — i.e., whether we
 * successfully parsed a safety field (even if it was empty). When the
 * shape is unknown, moderation is "skipped" and the fail-open policy
 * decides whether to flag or not.
 */
function isOutputShapeKnown(rawOutput: unknown): boolean {
  if (typeof rawOutput !== 'object' || rawOutput === null) {
    // String outputs (e.g., a single URL) are common but expose no safety
    // metadata — treat as unknown shape.
    return false;
  }
  const obj = rawOutput as Record<string, unknown>;
  return 'safety_concept' in obj || 'api_safety_concept' in obj || 'safety' in obj;
}

export async function moderateImage(input: ModerateImageInput): Promise<ImageModerationResult> {
  const categories = extractSafetyCategories(input.rawOutput);
  const shapeKnown = isOutputShapeKnown(input.rawOutput);
  const moderationSkipped = !shapeKnown;

  // Fail-open (default): unknown shape → not flagged, but skipped=true
  // Fail-closed: unknown shape → flagged=true with a synthetic category
  if (moderationSkipped && !FAIL_OPEN) {
    console.warn(
      `[moderate-image] Moderation FAIL-CLOSED: unknown output shape for ${input.imageUrl}. ` +
        `Flagging as 'unknown-output-shape'. Set IMAGE_MODERATION_FAIL_OPEN=true to allow.`,
    );
    return {
      flagged: true,
      categories: ['unknown-output-shape'],
      moderationSkipped: true,
    };
  }

  if (moderationSkipped) {
    console.warn(
      `[moderate-image] Moderation skipped: unknown output shape for ${input.imageUrl}. ` +
        `Fail-open policy is active (IMAGE_MODERATION_FAIL_OPEN=true). ` +
        `Set IMAGE_MODERATION_FAIL_OPEN=false to fail-closed.`,
    );
  }

  return {
    flagged: categories.length > 0,
    categories,
    moderationSkipped,
  };
}
