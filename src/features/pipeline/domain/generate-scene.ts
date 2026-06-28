import { replicate, SDXL_IPADAPTER_MODEL } from '@/lib/ai/replicate';

/**
 * Scene generation with character consistency via IP-Adapter.
 *
 * IP-Adapter injects character reference portraits as conditioning inputs,
 * preserving the character's face across all scenes.
 *
 * This is the HIGHEST-RISK component of the pipeline (per ADR-006 + Risk R1).
 * Quality depends on the IP-Adapter model and reference image quality.
 * Manual R&D validation is required (see S3-03 acceptance criteria).
 */

export interface CharacterReference {
  imageUrl: string;
  name: string;
}

export interface GenerateSceneInput {
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
  characterReferences: CharacterReference[];
  aspectRatio: 'portrait' | 'landscape';
}

export interface GenerateSceneOutput {
  imageUrl: string;
  prompt: string;
  /** Raw Replicate output — passed to moderateImage for safety checking */
  raw: unknown;
}

const STYLE_PROMPTS: Record<GenerateSceneInput['style'], string> = {
  ghibli: 'in the style of Studio Ghibli animation, soft colors, hand-drawn aesthetic',
  medieval: 'in medieval art style, illuminated manuscript, Gothic, knights and castles',
  'oil-painting': 'as an oil painting, rich textures, classical art style',
  anime: 'in anime style, vibrant colors, detailed eyes, cel-shaded',
  'japanese-animation':
    'in Japanese animation style, similar to Studio Ghibli or Makoto Shinkai, painterly backgrounds',
  realistic: 'photorealistic, cinematic, high detail, professional cinematography',
  cyberpunk: 'cyberpunk style, neon lighting, futuristic, dystopian atmosphere',
  watercolor: 'watercolor painting, soft washes, artistic, dreamy',
  comic: 'comic book style, bold outlines, flat colors, graphic novel panel',
};

function buildPrompt(input: GenerateSceneInput): string {
  const styleSuffix = STYLE_PROMPTS[input.style];
  const characterNames = input.characterReferences.map((c) => c.name).join(', ');
  return `Scene: ${input.description}. Featuring: ${characterNames}. Rendered ${styleSuffix}. Cinematic composition, high quality, detailed background.`;
}

function buildIpAdapterInputs(references: CharacterReference[]): string[] {
  // IP-Adapter accepts up to 4 reference images; we use the first 4 characters
  return references.slice(0, 4).map((ref) => ref.imageUrl);
}

export async function generateScene(input: GenerateSceneInput): Promise<GenerateSceneOutput> {
  const prompt = buildPrompt(input);
  const ipAdapterImages = buildIpAdapterInputs(input.characterReferences);

  const dimensions =
    input.aspectRatio === 'portrait' ? { width: 768, height: 1344 } : { width: 1344, height: 768 };

  const output = (await replicate.run(SDXL_IPADAPTER_MODEL, {
    input: {
      prompt,
      image: ipAdapterImages[0], // primary reference
      ip_adapter_images: ipAdapterImages,
      width: dimensions.width,
      height: dimensions.height,
      num_outputs: 1,
      guidance_scale: 7.5,
      num_inference_steps: 30,
    },
  })) as unknown as string[];

  if (!output || output.length === 0) {
    throw new Error('Replicate returned no scene image URLs');
  }

  return {
    imageUrl: output[0]!,
    prompt,
    raw: output,
  };
}
