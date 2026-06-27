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
 * Fail-open policy: if the output shape is unknown (e.g., a model that
 * doesn't expose safety fields), we return flagged=false. This is a
 * deliberate tradeoff — fail-closed would block all generations from
 * models that don't expose safety metadata, which is worse UX than
 * accepting the small risk.
 */

export interface ModerateImageInput {
  imageUrl: string;
  rawOutput: unknown;
}

export interface ImageModerationResult {
  flagged: boolean;
  categories: string[];
}

const FLAGGED_KEYWORDS = new Set(['nsfw', 'sexual', 'violence', 'gore', 'hate', 'self-harm']);

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

export async function moderateImage(input: ModerateImageInput): Promise<ImageModerationResult> {
  const categories = extractSafetyCategories(input.rawOutput);
  return {
    flagged: categories.length > 0,
    categories,
  };
}
