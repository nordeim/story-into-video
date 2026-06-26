import type { FooterColumn } from '@/types';

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'All AI Tools',
    links: [
      { label: 'Script to Video', href: '#' },
      { label: 'AI Image Generator', href: '#' },
      { label: 'AI Video Generation', href: '#' },
      { label: 'Kling 3 Video', href: '#' },
      { label: 'Hailuo 2.3 Video', href: '#' },
      { label: 'Seedance 2 Video', href: '#' },
      { label: 'Seedance 1.5 Pro', href: '#' },
      { label: 'Seedream Image', href: '#' },
      { label: 'GPT Image 2', href: '#' },
      { label: 'Nano Banana', href: '#' },
    ],
  },
  {
    title: 'Use Cases',
    links: [
      { label: 'Bedtime Story Video', href: '#' },
      { label: 'Kids Story Video', href: '#' },
      { label: 'Birthday Video', href: '#' },
      { label: "Father's Day Video", href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Contact Us', href: '#' },
    ],
  },
];

export const FOOTER_BRAND = {
  name: 'StoryIntoVideo',
  tagline: 'Turn any story into a cinematic video with AI.',
  supportEmail: 'support@storyintovideo.com',
} as const;

export const FOOTER_COPYRIGHT = '© 2026 StoryIntoVideo. All rights reserved.';
