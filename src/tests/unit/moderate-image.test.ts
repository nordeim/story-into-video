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
  });

  it('returns flagged:false when Replicate reports no safety concerns', async () => {
    const result = await moderateImage({
      imageUrl: 'https://r2.example.com/char-1.png',
      rawOutput: {
        // Replicate SDXL models return a safety_concept or api_safety_concept field
        // when their safety checker flags the output. Absent = safe.
        output: ['https://r2.example.com/char-1.png'],
      },
    });

    expect(result.flagged).toBe(false);
    expect(result.categories).toEqual([]);
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

  it('returns flagged:false for unknown output shapes (fail-open for non-safety fields)', async () => {
    const result = await moderateImage({
      imageUrl: 'https://r2.example.com/scene-3.png',
      rawOutput: { some_other_field: 'foo' },
    });

    expect(result.flagged).toBe(false);
  });

  it('accepts a string output (some Replicate models return a single URL string)', async () => {
    const result = await moderateImage({
      imageUrl: 'https://r2.example.com/scene-4.png',
      rawOutput: 'https://r2.example.com/scene-4.png',
    });

    expect(result.flagged).toBe(false);
  });
});
