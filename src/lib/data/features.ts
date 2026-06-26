import { Captions, Download, FileText, Film, Mic, Plus, Sparkles, Users } from 'lucide-react';

import type { Feature } from '@/types';

export const FEATURES: Feature[] = [
  {
    id: 'ai-script-analysis',
    title: 'AI Script Analysis',
    description:
      'Paste any story and AI identifies characters, scenes, and narrative structure — automatically.',
    icon: FileText,
  },
  {
    id: 'character-consistency',
    title: 'Character Consistency',
    description:
      'Same character face across all scenes. AI-powered visual identity keeps every character on-model.',
    icon: Users,
  },
  {
    id: 'multi-voice-narration',
    title: 'Multi-Voice Narration',
    description:
      'Natural AI voiceovers from ElevenLabs. Multiple voice styles bring every character to life.',
    icon: Mic,
  },
  {
    id: 'ai-powered',
    title: '100% AI Powered',
    description:
      'Latest AI models for image generation, video synthesis, and voice cloning — the entire pipeline.',
    icon: Sparkles,
  },
  {
    id: 'scene-generation',
    title: 'Scene Generation',
    description:
      "AI generates cinematic scenes that match your story's settings, mood, and atmosphere.",
    icon: Film,
  },
  {
    id: 'dynamic-subtitles',
    title: 'Dynamic Subtitles',
    description:
      'Auto-generated subtitles with precise timing and ASR alignment. Every word of your story.',
    icon: Captions,
  },
  {
    id: 'one-click-export',
    title: 'One-Click Export',
    description:
      'Export your finished story video with subtitles, voiceover, and background music in one click.',
    icon: Download,
  },
  {
    id: 'and-much-more',
    title: 'And Much More...',
    description:
      'StoryIntoVideo is constantly evolving with new story-into-video features added every week.',
    icon: Plus,
  },
];
