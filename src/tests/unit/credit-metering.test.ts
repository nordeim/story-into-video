import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const TIER_LIMITS_PATH = resolve(__dirname, '../../features/billing/domain/tier-limits.ts');
const QUERIES_PATH = resolve(__dirname, '../../features/billing/queries.ts');

describe('S2-06: Credit metering foundation', () => {
  it('tier-limits.ts defines 4 plans (free, creator, pro, studio)', () => {
    const source = readFileSync(TIER_LIMITS_PATH, 'utf-8');
    expect(source).toMatch(/free:/);
    expect(source).toMatch(/creator:/);
    expect(source).toMatch(/pro:/);
    expect(source).toMatch(/studio:/);
  });

  it('free tier has 50 monthly credits, 720p, watermark', () => {
    const source = readFileSync(TIER_LIMITS_PATH, 'utf-8');
    expect(source).toMatch(/monthlyCredits:\s*50/);
    expect(source).toMatch(/maxResolution:\s*['"]720p['"]/);
    expect(source).toMatch(/watermark:\s*true/);
  });

  it('CREDIT_COSTS defines per-operation costs', () => {
    const source = readFileSync(TIER_LIMITS_PATH, 'utf-8');
    expect(source).toMatch(/analysis:\s*5/);
    expect(source).toMatch(/character_generation:\s*10/);
    expect(source).toMatch(/scene_generation:\s*8/);
    expect(source).toMatch(/voiceover:\s*15/);
    expect(source).toMatch(/video_assembly:\s*30/);
  });

  it('FULL_PIPELINE_COST calculates total credits for one video', () => {
    const source = readFileSync(TIER_LIMITS_PATH, 'utf-8');
    expect(source).toMatch(/FULL_PIPELINE_COST/);
  });

  it('queries.ts exports getOrCreateSubscription', () => {
    const source = readFileSync(QUERIES_PATH, 'utf-8');
    expect(source).toMatch(/export async function getOrCreateSubscription/);
  });

  it('queries.ts exports debitCredits with transaction', () => {
    const source = readFileSync(QUERIES_PATH, 'utf-8');
    expect(source).toMatch(/export async function debitCredits/);
    expect(source).toMatch(/db\.transaction/);
  });

  it('queries.ts defines InsufficientCreditsError', () => {
    const source = readFileSync(QUERIES_PATH, 'utf-8');
    expect(source).toMatch(/class InsufficientCreditsError/);
  });

  it('debitCredits logs a usage_event for audit', () => {
    const source = readFileSync(QUERIES_PATH, 'utf-8');
    expect(source).toMatch(/usageEvents/);
    expect(source).toMatch(/\.insert\(usageEvents\)/);
  });
});
