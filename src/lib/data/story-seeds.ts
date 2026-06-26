import type { StoryExample } from '@/types';

/**
 * Maps story-example chip labels to multi-paragraph seed texts (300-500 chars).
 * Clicking a chip in the Hero populates the textarea with the matching seed.
 * All seeds verbatim from PRD §12.3.
 */
export const STORY_SEEDS: Record<string, string> = {
  'Time travel': `Dr. Elena Voss pressed her palm against the cold brass of the chronograph. The year was 1923, but the device in her hands pulsed with a future that hadn't happened yet. Outside her laboratory window, horse-drawn carriages clattered past — but in exactly forty-seven seconds, they would be replaced by something else entirely. She had one chance to set things right. One chance before the timeline collapsed.`,

  'Space odyssey': `The colony ship Aurora drifted past Neptune, its hull groaning against the absolute cold of deep space. Captain Reyes stared at the navigation console — they were three hundred years from Earth, and the signal they'd just received was human. It shouldn't exist. The last transmission from Sol system had been two centuries ago, before the silence. "Play it again," she said. The bridge went quiet as the voice of a dead woman filled the room.`,

  'Rival chefs': `In the Michelin-starred kitchen of Maison Lumière, Chef Adrien Laurent was plating the most important dish of his career. Across the pass, his former apprentice Sofia Reyes mirrored his movements with terrifying precision. Tonight was not about cooking. Tonight was about proving which of them had been right all those years ago, when the fire had taken everything. The judges would taste both dishes blind. Only one would walk out with the restaurant.`,

  'Victorian mystery': `The fog rolled in over Whitechapel as Lady Ashford stepped from her carriage. Number 13 Bleecker Street was supposed to be empty — had been empty for six years, ever since the incident. And yet, candlelight flickered in the upstairs window. She tightened her grip on the silver-handled cane her late husband had given her and climbed the steps. The door was already unlocked. Inside, the smell of laudanum and old paper. And a voice she had not heard in six years said: "You're late, Margaret."`,
};

export const DEFAULT_STORY_EXAMPLES: StoryExample[] = Object.keys(STORY_SEEDS).map((label) => ({
  label,
  seed: STORY_SEEDS[label]!,
}));
