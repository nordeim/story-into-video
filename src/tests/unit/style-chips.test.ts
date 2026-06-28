import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { STYLE_CHIPS } from '@/lib/data/style-chips';

/**
 * STYLE_CHIPS — spec fidelity tests.
 *
 * The deviation report (storyintovideo_deviation_report_v3.md §1.6) found
 * that the hero marquee drifted from the canonical 8-chip set defined in
 * the design spec. The original site's chip array is:
 *
 *   Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic,
 *   Cyberpunk, Watercolor
 *
 * A previous implementation had only 7 chips with different labels
 * (added "Comic", "Futuristic neon"; dropped "Medieval", "Japanese animation").
 * These tests lock the spec-mandated set so future drift is caught.
 */

describe('STYLE_CHIPS — spec fidelity', () => {
  it('contains exactly 8 chips (spec mandate)', () => {
    expect(STYLE_CHIPS).toHaveLength(8);
  });

  it('matches the canonical spec labels verbatim (order-sensitive)', () => {
    const labels = STYLE_CHIPS.map((chip) => chip.label);
    expect(labels).toEqual([
      'Ghibli',
      'Medieval',
      'Oil Painting',
      'Anime',
      'Japanese animation',
      'Realistic',
      'Cyberpunk',
      'Watercolor',
    ]);
  });

  it('every chip has a non-empty label', () => {
    for (const chip of STYLE_CHIPS) {
      expect(chip.label).toBeTruthy();
      expect(typeof chip.label).toBe('string');
      expect(chip.label.length).toBeGreaterThan(0);
    }
  });

  it('labels are unique (no duplicates that would break the marquee loop)', () => {
    const labels = STYLE_CHIPS.map((chip) => chip.label);
    const uniqueLabels = new Set(labels);
    expect(uniqueLabels.size).toBe(labels.length);
  });

  it('does not include the previously-drifted labels', () => {
    // Regression guard: these labels were added in a prior implementation
    // but are NOT in the spec. They must not return.
    const labels = STYLE_CHIPS.map((chip) => chip.label);
    expect(labels).not.toContain('Comic');
    expect(labels).not.toContain('Futuristic neon');
  });
});

/**
 * H3: Style chips must align with the backend enum.
 *
 * The CreateWizard normalizes chip labels via:
 *   chip.label.toLowerCase().replace(/\s+/g, '-')
 * and passes the result as the `style` field to createProjectAction.
 *
 * Previously, "Medieval" → 'medieval' and "Japanese animation" →
 * 'japanese-animation' were NOT in the visualStyleEnum. The server-side
 * Zod validation rejected the submission with "Invalid input" AFTER the
 * user typed a 100+ char story — a frustrating user-facing bug.
 *
 * The fix: add 'medieval' and 'japanese-animation' to the enum + Zod schema
 * + STYLE_PROMPTS maps in generate-character.ts and generate-scene.ts.
 */
describe('H3: Style chips align with backend enum + Zod + STYLE_PROMPTS', () => {
  function normalize(label: string): string {
    return label.toLowerCase().replace(/\s+/g, '-');
  }

  const SCHEMA_PATH = resolve(__dirname, '../../lib/db/schema/projects.ts');
  const ACTIONS_PATH = resolve(__dirname, '../../features/projects/actions.ts');
  const GEN_CHAR_PATH = resolve(__dirname, '../../features/pipeline/domain/generate-character.ts');
  const GEN_SCENE_PATH = resolve(__dirname, '../../features/pipeline/domain/generate-scene.ts');

  it('schema visualStyleEnum includes all 8 normalized chip labels', () => {
    const schemaSource = readFileSync(SCHEMA_PATH, 'utf-8');
    for (const chip of STYLE_CHIPS) {
      const normalized = normalize(chip.label);
      expect(schemaSource).toContain(`'${normalized}'`);
    }
  });

  it('actions.ts CreateProjectSchema.style enum includes all 8 normalized labels', () => {
    const actionsSource = readFileSync(ACTIONS_PATH, 'utf-8');
    for (const chip of STYLE_CHIPS) {
      const normalized = normalize(chip.label);
      expect(actionsSource).toContain(`'${normalized}'`);
    }
  });

  it('generate-character.ts STYLE_PROMPTS includes all 8 normalized labels', () => {
    const genCharSource = readFileSync(GEN_CHAR_PATH, 'utf-8');
    for (const chip of STYLE_CHIPS) {
      const normalized = normalize(chip.label);
      expect(genCharSource).toContain(`'${normalized}'`);
    }
  });

  it('generate-scene.ts STYLE_PROMPTS includes all 8 normalized labels', () => {
    const genSceneSource = readFileSync(GEN_SCENE_PATH, 'utf-8');
    for (const chip of STYLE_CHIPS) {
      const normalized = normalize(chip.label);
      expect(genSceneSource).toContain(`'${normalized}'`);
    }
  });
});
