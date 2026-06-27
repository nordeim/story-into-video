import { z } from 'zod';

import { openai, GPT_MODEL } from '@/lib/ai/openai';

/**
 * Story analysis — extracts characters and scenes from a user-submitted story.
 *
 * Pure domain function (no Next.js, no DB). Calls OpenAI GPT-4o with JSON mode
 * and a structured prompt. Returns typed AnalyzedStory.
 *
 * The prompt design references skills/storyboard-manager/SKILL.md for
 * character development and story structure conventions.
 */

const CharacterSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
});

const SceneSchema = z.object({
  order: z.number().int().min(1),
  description: z.string().min(1).max(500),
  characters: z.array(z.string()).default([]), // character names in this scene
  duration_sec: z.number().int().min(3).max(30).default(8),
});

const AnalyzedStorySchema = z.object({
  title: z.string().min(1).max(100),
  summary: z.string().min(1).max(300),
  characters: z.array(CharacterSchema).min(1).max(10),
  scenes: z.array(SceneSchema).min(1).max(20),
});

export type AnalyzedStory = z.infer<typeof AnalyzedStorySchema>;
export type AnalyzedCharacter = z.infer<typeof CharacterSchema>;
export type AnalyzedScene = z.infer<typeof SceneSchema>;

const SYSTEM_PROMPT = `You are a story analyst for an AI video generation pipeline.
Your job is to read a user-submitted story and break it down into:
1. A concise title (max 100 chars)
2. A short summary (max 300 chars)
3. A list of characters (1-10), each with a name and visual description suitable for AI image generation
4. A list of scenes (1-20), each with a visual description, the characters appearing in it, and a suggested duration in seconds (3-30s)

The visual descriptions should be concrete and image-friendly: physical appearance, clothing, setting, mood, lighting.
Respond as a JSON object matching the schema. Do not include markdown or explanations.`;

export async function analyzeStory(story: string): Promise<AnalyzedStory> {
  const completion = await openai.chat.completions.create({
    model: GPT_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: story },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response');
  }

  const parsed = JSON.parse(content);
  return AnalyzedStorySchema.parse(parsed);
}
