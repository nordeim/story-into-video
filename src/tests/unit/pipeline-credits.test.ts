import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * C6 — Revenue leak: Steps 2 (character_generation) and 3 (scene_generation)
 * were not debiting credits. The documented FULL_PIPELINE_COST = 131 credits
 * assumes all 6 steps debit, but only 4 did (analysis + voiceover + subtitle +
 * video_assembly = 53 credits). This test locks in the fix.
 *
 * The test uses source-reading (regex on inngest.ts) because the full pipeline
 * mock setup is heavy — pipeline-sprint5.test.ts covers the functional side.
 * Here we just verify the debitCredits calls exist in the right steps.
 */

const INNGEST_PATH = resolve(__dirname, '../../features/pipeline/inngest.ts');
const inngestSource = readFileSync(INNGEST_PATH, 'utf-8');

// Strip comments to avoid false positives on docblocks that mention old patterns
const strippedSource = inngestSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

describe('C6: Pipeline debits credits for ALL 6 steps (revenue leak fix)', () => {
  it('Step 2 (generate-characters) debits character_generation credits', () => {
    // Find the generate-characters step block and check it contains a debitCredits call
    // with 'character_generation' as the operation type.
    const step2Match = strippedSource.match(
      /step\.run\(['"]generate-characters['"][\s\S]*?await debitCredits\([\s\S]*?character_generation[\s\S]*?\)/,
    );
    expect(step2Match).not.toBeNull();
  });

  it('Step 2 uses a deterministic idempotency key per character', () => {
    // The key should include the character name (or index) so retries are idempotent.
    const step2Match = strippedSource.match(
      /step\.run\(['"]generate-characters['"][\s\S]*?\$\{projectId\}:character:[\s\S]*?debitCredits/,
    );
    expect(step2Match).not.toBeNull();
  });

  it('Step 3 (generate-scenes) debits scene_generation credits', () => {
    const step3Match = strippedSource.match(
      /step\.run\(['"]generate-scenes['"][\s\S]*?await debitCredits\([\s\S]*?scene_generation[\s\S]*?\)/,
    );
    expect(step3Match).not.toBeNull();
  });

  it('Step 3 uses a deterministic idempotency key per scene', () => {
    const step3Match = strippedSource.match(
      /step\.run\(['"]generate-scenes['"][\s\S]*?\$\{projectId\}:scene:[\s\S]*?debitCredits/,
    );
    expect(step3Match).not.toBeNull();
  });

  it('Step 4 (voiceover) debits voiceover credits with idempotency key', () => {
    const step4Match = strippedSource.match(
      /step\.run\(['"]synthesize-voiceover['"][\s\S]*?await debitCredits\([\s\S]*?voiceover[\s\S]*?\$\{projectId\}:voiceover/,
    );
    expect(step4Match).not.toBeNull();
  });

  it('Step 5 (subtitle_alignment) debits with idempotency key', () => {
    const step5Match = strippedSource.match(
      /step\.run\(['"]align-subtitles['"][\s\S]*?await debitCredits\([\s\S]*?subtitle_alignment[\s\S]*?\$\{projectId\}:subtitle_alignment/,
    );
    expect(step5Match).not.toBeNull();
  });

  it('Step 6 (video_assembly) debits with idempotency key', () => {
    const step6Match = strippedSource.match(
      /step\.run\(['"]assemble-video['"][\s\S]*?await debitCredits\([\s\S]*?video_assembly[\s\S]*?\$\{projectId\}:video_assembly/,
    );
    expect(step6Match).not.toBeNull();
  });
});

describe('C6: FULL_PIPELINE_COST formula verification', () => {
  const TIER_LIMITS_PATH = resolve(__dirname, '../../features/billing/domain/tier-limits.ts');
  const tierLimitsSource = readFileSync(TIER_LIMITS_PATH, 'utf-8');

  it('FULL_PIPELINE_COST sums all 6 step costs (assumes 3 chars + 6 scenes)', () => {
    // The formula should be: analysis + character_generation*3 + scene_generation*6
    // + voiceover + subtitle_alignment + video_assembly = 5 + 30 + 48 + 15 + 3 + 30 = 131
    expect(tierLimitsSource).toMatch(/FULL_PIPELINE_COST/);
    expect(tierLimitsSource).toMatch(/CREDIT_COSTS\.analysis/);
    expect(tierLimitsSource).toMatch(/CREDIT_COSTS\.character_generation\s*\*\s*3/);
    expect(tierLimitsSource).toMatch(/CREDIT_COSTS\.scene_generation\s*\*\s*6/);
    expect(tierLimitsSource).toMatch(/CREDIT_COSTS\.voiceover/);
    expect(tierLimitsSource).toMatch(/CREDIT_COSTS\.subtitle_alignment/);
    expect(tierLimitsSource).toMatch(/CREDIT_COSTS\.video_assembly/);
  });

  it('comment confirms the total is 131 credits', () => {
    expect(tierLimitsSource).toMatch(/131/);
  });
});
