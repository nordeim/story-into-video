import type { FAQItem } from '@/types';

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'stories-types',
    question: 'What kind of stories can I turn into videos?',
    answer:
      'You can turn any narrative into video — novels, short stories, scripts, fanfiction, blog posts, or even product descriptions. StoryIntoVideo understands narrative structure and can convert any genre into a cinematic video.',
  },
  {
    id: 'character-consistency',
    question: 'How does AI maintain character consistency?',
    answer:
      'StoryIntoVideo uses a proprietary character-locking system. Once the AI generates a character portrait in Step 2, that visual identity is preserved across every subsequent scene through reference-image conditioning.',
  },
  {
    id: 'copyright',
    question: 'Do I own the copyright to the videos?',
    answer:
      'Yes. You retain full commercial rights to all videos generated through your account. The underlying AI models are licensed for commercial use.',
  },
  {
    id: 'visual-style',
    question: 'Can I customize the visual style?',
    answer:
      'Absolutely. Choose from 8 visual styles including Ghibli, Medieval, Oil Painting, Anime, Japanese animation, Realistic, Cyberpunk, and Watercolor — or describe a custom style and the AI will adapt.',
  },
  {
    id: 'generation-time',
    question: 'How long does it take to generate a video?',
    answer:
      'A typical 2-minute story video takes about 8–12 minutes to generate end-to-end, including character generation, scene rendering, voiceover synthesis, and subtitle alignment.',
  },
  {
    id: 'narration-languages',
    question: 'What languages are supported for narration?',
    answer:
      'StoryIntoVideo supports 30+ languages for AI narration, including English, Spanish, French, German, Japanese, Korean, Chinese, Portuguese, and Arabic. New languages are added monthly.',
  },
];
