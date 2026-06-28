import type { StyleChip } from '@/types';

/**
 * 8 style chips for the Hero marquee. The marquee duplicates this array
 * (8×2=16 chips) for a seamless infinite scroll via the marquee-track
 * @utility (translateX -50%).
 *
 * This array is locked to the spec-mandated set from the original
 * storyintovideo.com site (see storyintovideo_deviation_report_v3.md §1.6).
 * A prior implementation had drifted to 7 chips with different labels
 * (added "Comic" + "Futuristic neon"; dropped "Medieval" +
 * "Japanese animation"). The spec set is restored here and protected by
 * src/tests/unit/style-chips.test.ts.
 */
export const STYLE_CHIPS: StyleChip[] = [
  { label: 'Ghibli' },
  { label: 'Medieval' },
  { label: 'Oil Painting' },
  { label: 'Anime' },
  { label: 'Japanese animation' },
  { label: 'Realistic' },
  { label: 'Cyberpunk' },
  { label: 'Watercolor' },
];
