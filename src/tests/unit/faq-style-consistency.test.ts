import { describe, it, expect } from 'vitest';
import { STYLE_CHIPS } from '@/lib/data/style-chips';
import { FAQ_ITEMS } from '@/lib/data/faq-items';

/**
 * NF-3 — FAQ copy vs STYLE_CHIPS three-way drift.
 *
 * Before this fix, the FAQ answer for "Can I customize the visual style?" said:
 *   "Choose from 7+ visual styles including Ghibli, Oil Painting, Anime,
 *    Realistic, Cyberpunk, Watercolor, and Comic"
 *
 * But the hero marquee directly above the FAQ visibly shows 8 chips:
 *   Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic,
 *   Cyberpunk, Watercolor
 *
 * Drift:
 *   - Count: "7+" vs actual 8
 *   - Missing: Medieval, Japanese animation
 *   - Extra: Comic (not in STYLE_CHIPS — regression test forbids it)
 *
 * The fix: update the FAQ answer to match STYLE_CHIPS exactly. These tests lock
 * the alignment so future drift is caught.
 */

function findFaqById(id: string) {
  return FAQ_ITEMS.find((item) => item.id === id);
}

describe('NF-3: FAQ visual-style answer aligns with STYLE_CHIPS', () => {
  it('the visual-style FAQ item exists', () => {
    const item = findFaqById('visual-style');
    expect(item).toBeDefined();
  });

  it('FAQ answer mentions the exact STYLE_CHIPS count (not "7+")', () => {
    const item = findFaqById('visual-style');
    expect(item).toBeDefined();
    const expectedCount = STYLE_CHIPS.length.toString(); // "8"
    // The answer must contain the literal count — no "7+" or "9+" drift
    expect(item!.answer).toContain(expectedCount);
    // Must NOT contain the old "7+" phrasing
    expect(item!.answer).not.toMatch(/7\+/);
  });

  it('FAQ answer names every STYLE_CHIPS label', () => {
    const item = findFaqById('visual-style');
    expect(item).toBeDefined();
    for (const chip of STYLE_CHIPS) {
      // Each chip label must appear in the answer (case-insensitive — FAQ may
      // use sentence case while the chip array uses title case)
      const answerLower = item!.answer.toLowerCase();
      const labelLower = chip.label.toLowerCase();
      expect(answerLower).toContain(labelLower);
    }
  });

  it('FAQ answer does NOT mention Comic (regression guard — Comic is not in STYLE_CHIPS)', () => {
    const item = findFaqById('visual-style');
    expect(item).toBeDefined();
    // "Comic" as a whole word, case-insensitive
    expect(item!.answer).not.toMatch(/\bcomic\b/i);
  });

  it('FAQ answer does NOT mention "Futuristic neon" (another prior drift label)', () => {
    const item = findFaqById('visual-style');
    expect(item).toBeDefined();
    expect(item!.answer).not.toMatch(/futuristic/i);
  });
});
