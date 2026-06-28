import { replicate, SDXL_MODEL } from '@/lib/ai/replicate';

/**
 * Character generation — produces a reference portrait for a story character.
 *
 * This portrait is later used as an IP-Adapter input for scene generation,
 * ensuring the character's face stays consistent across all scenes.
 *
 * Pure domain function (no Next.js, no DB). Returns the generated image URL
 * hosted on Replicate's CDN. The caller uploads to R2 for persistent storage.
 */

export interface GenerateCharacterInput {
  name: string;
  description: string;
  style:
    | 'ghibli'
    | 'medieval'
    | 'oil-painting'
    | 'anime'
    | 'japanese-animation'
    | 'realistic'
    | 'cyberpunk'
    | 'watercolor'
    | 'comic';
}

export interface GenerateCharacterOutput {
  imageUrl: string;
  prompt: string;
  /** Raw Replicate output — passed to moderateImage for safety checking */
  raw: unknown;
}

const STYLE_PROMPTS: Record<GenerateCharacterInput['style'], string> = {
  ghibli: 'in the style of Studio Ghibli animation, soft colors, hand-drawn aesthetic',
  medieval: 'in medieval art style, illuminated manuscript, Gothic, knights and castles',
  'oil-painting': 'as an oil painting, rich textures, classical art style',
  anime: 'in anime style, vibrant colors, detailed eyes, cel-shaded',
  'japanese-animation':
    'in Japanese animation style, similar to Studio Ghibli or Makoto Shinkai, painterly backgrounds',
  realistic: 'photorealistic, high detail, professional portrait photography',
  cyberpunk: 'cyberpunk style, neon lighting, futuristic, dystopian',
  watercolor: 'watercolor painting, soft washes, artistic, dreamy',
  comic: 'comic book style, bold outlines, flat colors, graphic novel',
};

function buildPrompt(input: GenerateCharacterInput): string {
  const styleSuffix = STYLE_PROMPTS[input.style];
  return `Character portrait: ${input.name}. ${input.description}. Rendered ${styleSuffix}. High quality, detailed, centered composition, head and shoulders.`;
}

export async function generateCharacter(
  input: GenerateCharacterInput,
): Promise<GenerateCharacterOutput> {
  const prompt = buildPrompt(input);

  const output = (await replicate.run(SDXL_MODEL, {
    input: {
      prompt,
      width: 768,
      height: 768,
      num_outputs: 1,
      guidance_scale: 7.5,
      num_inference_steps: 30,
    },
  })) as unknown as string[];

  if (!output || output.length === 0) {
    throw new Error('Replicate returned no image URLs');
  }

  return {
    imageUrl: output[0]!,
    prompt,
    raw: output,
  };
}
