import { describe, it, expect } from 'vitest';

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
