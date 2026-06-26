import { BookOpen, Clapperboard, GraduationCap, Video } from 'lucide-react';

import type { UseCase } from '@/types';

export const USE_CASES: UseCase[] = [
  {
    id: 'novel-writers',
    title: 'Novel & Fiction Writers',
    description:
      'Turn your novel into video — create visual trailers or full short dramas from your story. Give readers a cinematic taste of your story before they dive in.',
    icon: BookOpen,
    href: '#',
  },
  {
    id: 'content-creators',
    title: 'Content Creators',
    description:
      "Turn trending stories into video for YouTube Shorts and TikTok. Build faceless channels with StoryIntoVideo's AI-generated content.",
    icon: Video,
    href: '#',
  },
  {
    id: 'filmmakers',
    title: 'Filmmakers & Studios',
    description:
      'Turn your script into video storyboards instantly. See your story come alive as a video before production — perfect for pitching and pre-visualization.',
    icon: Clapperboard,
    href: '#',
  },
  {
    id: 'educators',
    title: 'Educators & Trainers',
    description:
      'Turn educational stories into video lessons. Make complex narratives memorable through AI-powered story-into-video generation.',
    icon: GraduationCap,
    href: '#',
  },
];
