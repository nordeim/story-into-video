import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * T11 — Generated-image moderation (ADR-011).
 *
 * ADR-011 mandates moderation on BOTH story input AND generated images.
 * Story moderation is already wired (moderate-content.ts). This test
 * verifies the new moderate-image.ts domain function + Inngest wiring.
 *
 * Approach: parse Replicate's safety output from the model response.
 * This avoids a second API call (vs. OpenAI vision moderation).
 *
 * T5 (remediation): The fail-open policy is now env-configurable via
 * IMAGE_MODERATION_FAIL_OPEN (default 'true'). When an unknown output
 * shape is encountered:
 *   - fail-open=true  → moderationSkipped:true, flagged:false (current default)
 *   - fail-open=false → flagged:true, categories:['unknown-output-shape']
 * The moderationSkipped field makes the bypass observable.
 */

vi.mock('@/lib/ai/replicate', () => ({
  replicate: { run: vi.fn() },
  SDXL_MODEL: 'sdxl-model-id',
  SDXL_IPADAPTER_MODEL: 'sdxl-ipadapter-model-id',
}));

import { moderateImage } from '@/features/pipeline/domain/moderate-image';

describe('T11: moderateImage domain function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns flagged:false when Replicate reports no safety concerns', async () => {
    const result = await moderateImage({
      imageUrl: 'https://r2.example.com/char-1.png',
      rawOutput: {
        // Replicate SDXL models return a safety_concept or api_safety_concept field
        // when their safety checker flags the output. An empty array means the
        // safety checker ran and found nothing. This is a KNOWN shape (not skipped).
        safety_concept: [],
        output: ['https://r2.example.com/char-1.png'],
      },
    });

    expect(result.flagged).toBe(false);
    expect(result.categories).toEqual([]);
    expect(result.moderationSkipped).toBe(false);
  });

  it('returns flagged:true when Replicate safety_concept contains nsfw', async () => {
    const result = await moderateImage({
      imageUrl: 'https://r2.example.com/scene-1.png',
      rawOutput: {
        safety_concept: ['nsfw'],
      },
    });

    expect(result.flagged).toBe(true);
    expect(result.categories).toContain('nsfw');
    expect(result.moderationSkipped).toBe(false);
  });

  it('returns flagged:true when api_safety_concept contains sexual', async () => {
    const result = await moderateImage({
      imageUrl: 'https://r2.example.com/scene-2.png',
      rawOutput: {
        api_safety_concept: ['sexual', 'violence'],
      },
    });

    expect(result.flagged).toBe(true);
    expect(result.categories).toEqual(expect.arrayContaining(['sexual', 'violence']));
  });

  it('returns flagged:false for unknown output shapes (fail-open default)', async () => {
    const result = await moderateImage({
      imageUrl: 'https://r2.example.com/scene-3.png',
      rawOutput: { some_other_field: 'foo' },
    });

    expect(result.flagged).toBe(false);
    // T5: moderationSkipped is now exposed so operators can detect bypasses
    expect(result.moderationSkipped).toBe(true);
  });

  it('accepts a string output (some Replicate models return a single URL string)', async () => {
    const result = await moderateImage({
      imageUrl: 'https://r2.example.com/scene-4.png',
      rawOutput: 'https://r2.example.com/scene-4.png',
    });

    expect(result.flagged).toBe(false);
    expect(result.moderationSkipped).toBe(true);
  });
});

// T5 (remediation): env-configurable fail-open policy
describe('T5: moderateImage env-configurable fail-open policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns flagged:true for unknown shapes when IMAGE_MODERATION_FAIL_OPEN=false', async () => {
    vi.stubEnv('IMAGE_MODERATION_FAIL_OPEN', 'false');
    // Re-import to pick up the new env value
    vi.resetModules();
    const { moderateImage: freshModerateImage } = await import(
      '@/features/pipeline/domain/moderate-image'
    );

    const result = await freshModerateImage({
      imageUrl: 'https://r2.example.com/scene-5.png',
      rawOutput: { unknown_field: 'foo' },
    });

    expect(result.flagged).toBe(true);
    expect(result.moderationSkipped).toBe(true);
  });

  it('logs a warning when moderation is skipped (fail-open default)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await moderateImage({
      imageUrl: 'https://r2.example.com/scene-6.png',
      rawOutput: { unknown_field: 'foo' },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/moderation.*skipped|unknown.*output.*shape/i),
    );
    warnSpy.mockRestore();
  });
});
