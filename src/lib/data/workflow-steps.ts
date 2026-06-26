import type { WorkflowStep } from '@/types';

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    number: 1,
    title: 'Create Your Project',
    description:
      'Paste your story in any language — novel, script, or narrative. Pick a visual style and aspect ratio.',
    ctaLabel: 'Start Your Story',
    ctaHref: '#',
    videoSrc: '/workflow/showcase-step1.mp4',
    videoPoster: '/workflow/showcase-step1-poster.webp',
    mediaPosition: 'right',
  },
  {
    number: 2,
    title: 'Generate Characters & Scenes',
    description:
      'AI reads your story and performs automatic scene breakdown — creating consistent character portraits.',
    ctaLabel: 'Create Your Characters',
    ctaHref: '#',
    videoSrc: '/workflow/showcase-step2.mp4',
    videoPoster: '/workflow/showcase-step2-poster.webp',
    mediaPosition: 'left',
  },
  {
    number: 3,
    title: 'AI Storyboard',
    description:
      'AI breaks your story into shots and generates storyboard images automatically, with full character consistency.',
    ctaLabel: 'Try AI Storyboard',
    ctaHref: '#',
    videoSrc: '/workflow/showcase-step3.mp4',
    videoPoster: '/workflow/showcase-step3-poster.webp',
    mediaPosition: 'right',
  },
  {
    number: 4,
    title: 'Professional Timeline Editor',
    description:
      'Full creative control in the timeline editor. Add AI voiceover and background music, style subtitles.',
    ctaLabel: 'Create Your Video',
    ctaHref: '#',
    videoSrc: '/workflow/showcase-step4.mp4',
    videoPoster: '/workflow/showcase-step4-poster.webp',
    mediaPosition: 'left',
  },
];
