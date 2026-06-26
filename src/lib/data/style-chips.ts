import type { StyleChip } from '@/types';

/**
 * 7 style chips for the Hero marquee. "Cyberpunk" has a sublabel "Futuristic neon"
 * (rendered in smaller text). The marquee duplicates this array (7×2=14 chips)
 * for a seamless infinite scroll via the marquee-track @utility (translateX -50%).
 */
export const STYLE_CHIPS: StyleChip[] = [
  { label: 'Ghibli' },
  { label: 'Oil Painting' },
  { label: 'Anime' },
  { label: 'Realistic' },
  { label: 'Cyberpunk', sublabel: 'Futuristic neon' },
  { label: 'Watercolor' },
  { label: 'Comic' },
];
