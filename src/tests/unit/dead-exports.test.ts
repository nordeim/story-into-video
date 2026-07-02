import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * NF-4 — Dead/unused exports cleanup.
 *
 * Validation found these exports are dead (never imported by production code):
 *   - getProjectVideo (only in a test mock, not used by any feature)
 *   - WHISPER_MODEL  (declared but align-subtitles.ts hardcodes 'whisper-1')
 *   - r2Client, BUCKET_MAP (exported but only used internally in r2.ts)
 *
 * Decision:
 *   - Remove getProjectVideo + its test mock
 *   - KEEP WHISPER_MODEL but actually USE it in align-subtitles.ts (better than
 *     deleting — centralizes the model name for future updates)
 *   - Remove the `export` keyword from r2Client + BUCKET_MAP (keep as internal)
 *   - KEEP getSignedUploadUrl (future client-direct-to-R2 uploads)
 *   - KEEP signOut (E2E tests + future logout button)
 */

const QUERIES_PATH = resolve(__dirname, '../../features/pipeline/queries.ts');
const OPENAI_PATH = resolve(__dirname, '../../lib/ai/openai.ts');
const ALIGN_SUBTITLES_PATH = resolve(
  __dirname,
  '../../features/pipeline/domain/align-subtitles.ts',
);
const R2_PATH = resolve(__dirname, '../../lib/storage/r2.ts');
const SPRINT5_TEST_PATH = resolve(__dirname, './pipeline-sprint5.test.ts');

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('NF-4: Dead exports removed / unused exports cleaned up', () => {
  it('getProjectVideo is NOT exported from pipeline/queries.ts', () => {
    const source = stripComments(readFileSync(QUERIES_PATH, 'utf-8'));
    // Must not export getProjectVideo as a function declaration
    expect(source).not.toMatch(/export\s+async\s+function\s+getProjectVideo/);
    // Must not re-export it either
    expect(source).not.toMatch(/export\s*\{[^}]*getProjectVideo[^}]*\}/);
  });

  it('getProjectVideo mock is removed from pipeline-sprint5.test.ts', () => {
    const source = readFileSync(SPRINT5_TEST_PATH, 'utf-8');
    // The mock should no longer reference getProjectVideo
    expect(source).not.toMatch(/getProjectVideo/);
  });

  it('WHISPER_MODEL is still exported from openai.ts (kept — will be used)', () => {
    const source = stripComments(readFileSync(OPENAI_PATH, 'utf-8'));
    expect(source).toMatch(/export\s+const\s+WHISPER_MODEL/);
  });

  it('align-subtitles.ts imports and uses WHISPER_MODEL (not a hardcoded "whisper-1")', () => {
    const source = stripComments(readFileSync(ALIGN_SUBTITLES_PATH, 'utf-8'));
    // Must import WHISPER_MODEL from @/lib/ai/openai
    expect(source).toMatch(/import.*WHISPER_MODEL.*from.*@\/lib\/ai\/openai/);
    // Must NOT contain a hardcoded whisper-1 string literal (the model: field
    // should reference the constant)
    expect(source).not.toMatch(/model:\s*['"]whisper-1['"]/);
  });

  it('r2Client is NOT exported from r2.ts (internal only)', () => {
    const source = stripComments(readFileSync(R2_PATH, 'utf-8'));
    // The declaration should be `const r2Client` (no `export` keyword)
    expect(source).toMatch(/^(?:const|let)\s+r2Client/m);
    expect(source).not.toMatch(/^export\s+(?:const|let)\s+r2Client/m);
    // Must not appear in an export { ... } statement
    expect(source).not.toMatch(/export\s*\{[^}]*r2Client[^}]*\}/);
  });

  it('BUCKET_MAP is NOT exported from r2.ts (internal only)', () => {
    const source = stripComments(readFileSync(R2_PATH, 'utf-8'));
    expect(source).toMatch(/^(?:const|let)\s+BUCKET_MAP/m);
    expect(source).not.toMatch(/^export\s+(?:const|let)\s+BUCKET_MAP/m);
    expect(source).not.toMatch(/export\s*\{[^}]*BUCKET_MAP[^}]*\}/);
  });

  it('BucketName type IS still exported (used by callers)', () => {
    const source = stripComments(readFileSync(R2_PATH, 'utf-8'));
    expect(source).toMatch(/export\s+type\s+\{[^}]*BucketName[^}]*\}/);
  });

  it('getSignedUploadUrl IS still exported (kept for future client uploads)', () => {
    const source = stripComments(readFileSync(R2_PATH, 'utf-8'));
    expect(source).toMatch(/export\s+async\s+function\s+getSignedUploadUrl/);
  });
});
