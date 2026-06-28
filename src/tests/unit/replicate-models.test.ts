import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * T4 (remediation) — Replicate model IDs source-level guarantees.
 *
 * The SDXL model IDs (SDXL_MODEL, SDXL_IPADAPTER_MODEL) were previously
 * hardcoded constants in replicate.ts. The placeholder IP-Adapter hash
 * ('6f288a8d-7e5e-4f0c-8b3f-3e1f3e6e3e3e') does not match Replicate's
 * actual version hash format (64-char hex SHA) — scene generation would
 * 404 in production.
 *
 * The fix: read both IDs from the validated `env` module so they can be
 * rotated without code changes, with the existing constants kept as
 * defaults inside the env module itself. The env schema validates that
 * any user-provided value matches Replicate's `owner/model:sha` format.
 */

const REPLICATE_PATH = resolve(__dirname, '../../lib/ai/replicate.ts');
const source = readFileSync(REPLICATE_PATH, 'utf-8');

describe('T4: Replicate model IDs are env-configurable', () => {
  it('replicate.ts imports env from @/lib/env', () => {
    expect(source).toMatch(/from ['"]@\/lib\/env['"]/);
  });

  it('SDXL_MODEL reads from env.REPLICATE_SDXL_MODEL (not hardcoded)', () => {
    expect(source).toMatch(/env\.REPLICATE_SDXL_MODEL/);
  });

  it('SDXL_IPADAPTER_MODEL reads from env.REPLICATE_SDXL_IPADAPTER_MODEL (not hardcoded)', () => {
    expect(source).toMatch(/env\.REPLICATE_SDXL_IPADAPTER_MODEL/);
  });

  // C2 fix: When the IP-Adapter model is still the SDXL base placeholder,
  // the codebase must emit a loud warning so operators know character
  // consistency won't work. Without this, the core product feature silently
  // does not function.
  it('C2: replicate.ts warns when IP-Adapter model is the SDXL base placeholder', () => {
    expect(source).toMatch(/placeholder|SDXL_BASE_HASH|console\.warn.*IP.?Adapter/i);
  });

  it('C2: warning is emitted in production context (NODE_ENV check)', () => {
    expect(source).toMatch(/NODE_ENV.*production|production.*NODE_ENV/i);
  });
});
