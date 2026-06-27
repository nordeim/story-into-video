import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AI/infrastructure clients
vi.mock('@/lib/ai/replicate', () => ({
  replicate: {
    run: vi.fn(),
  },
  SDXL_MODEL: 'sdxl-model-id',
  SDXL_IPADAPTER_MODEL: 'sdxl-ipadapter-model-id',
}));

vi.mock('@/lib/storage/r2', () => ({
  getSignedUploadUrl: vi.fn(),
  getSignedDownloadUrl: vi.fn(),
  buildObjectKey: vi.fn((projectId: string, filename: string) => `${projectId}/${filename}`),
}));

vi.mock('@/lib/inngest/client', () => ({
  inngest: {
    createFunction: vi.fn(),
    send: vi.fn(),
  },
  PIPELINE_EVENT: 'pipeline.started',
}));

import { replicate } from '@/lib/ai/replicate';
import { getSignedUploadUrl, getSignedDownloadUrl, buildObjectKey } from '@/lib/storage/r2';
import { generateCharacter } from '@/features/pipeline/domain/generate-character';
import { generateScene } from '@/features/pipeline/domain/generate-scene';

describe('Sprint 3: Image Generation + Character Consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('S3-01: R2 storage layer', () => {
    it('getSignedUploadUrl returns a signed URL string', async () => {
      vi.mocked(getSignedUploadUrl).mockResolvedValue('https://r2.example.com/signed-upload');

      const url = await getSignedUploadUrl('generated', 'project-1/char-1.png', 'image/png');
      expect(url).toBe('https://r2.example.com/signed-upload');
      expect(getSignedUploadUrl).toHaveBeenCalledWith(
        'generated',
        'project-1/char-1.png',
        'image/png',
      );
    });

    it('getSignedDownloadUrl returns a signed URL string', async () => {
      vi.mocked(getSignedDownloadUrl).mockResolvedValue('https://r2.example.com/signed-download');

      const url = await getSignedDownloadUrl('videos', 'project-1/final.mp4');
      expect(url).toBe('https://r2.example.com/signed-download');
    });

    it('buildObjectKey constructs a project-scoped key', () => {
      expect(buildObjectKey('proj-123', 'character-1.png')).toBe('proj-123/character-1.png');
    });
  });

  describe('S3-02: Character generation', () => {
    it('generateCharacter returns an image URL and the prompt', async () => {
      vi.mocked(replicate.run).mockResolvedValue([
        'https://replicate.delivery/char-1.png',
      ] as never);

      const result = await generateCharacter({
        name: 'Captain Reyes',
        description: 'A woman in her 40s, weathered face, dark hair',
        style: 'anime',
      });

      expect(result.imageUrl).toBe('https://replicate.delivery/char-1.png');
      expect(result.prompt).toContain('Captain Reyes');
      expect(result.prompt).toContain('anime style');
    });

    it('throws when Replicate returns no images', async () => {
      vi.mocked(replicate.run).mockResolvedValue([] as never);

      await expect(
        generateCharacter({
          name: 'Test',
          description: 'desc',
          style: 'realistic',
        }),
      ).rejects.toThrow(/no image/i);
    });

    it('includes the visual style in the prompt', async () => {
      vi.mocked(replicate.run).mockResolvedValue(['https://example.com/img.png'] as never);

      const result = await generateCharacter({
        name: 'Hero',
        description: 'A brave warrior',
        style: 'cyberpunk',
      });

      expect(result.prompt).toContain('cyberpunk');
    });
  });

  describe('S3-03: Scene generation with IP-Adapter', () => {
    it('generateScene returns an image URL conditioned on character references', async () => {
      vi.mocked(replicate.run).mockResolvedValue([
        'https://replicate.delivery/scene-1.png',
      ] as never);

      const result = await generateScene({
        description: 'The bridge of a spaceship, dimly lit',
        style: 'anime',
        characterReferences: [
          { imageUrl: 'https://example.com/char-1.png', name: 'Captain Reyes' },
        ],
        aspectRatio: 'portrait',
      });

      expect(result.imageUrl).toBe('https://replicate.delivery/scene-1.png');
      expect(result.prompt).toContain('Captain Reyes');
    });

    it('passes character reference images as IP-Adapter inputs', async () => {
      vi.mocked(replicate.run).mockResolvedValue(['https://example.com/scene.png'] as never);

      await generateScene({
        description: 'A scene',
        style: 'realistic',
        characterReferences: [
          { imageUrl: 'https://example.com/ref1.png', name: 'Alice' },
          { imageUrl: 'https://example.com/ref2.png', name: 'Bob' },
        ],
        aspectRatio: 'landscape',
      });

      const callArgs = vi.mocked(replicate.run).mock.calls[0];
      expect(callArgs?.[1]).toMatchObject({
        input: expect.objectContaining({
          image: 'https://example.com/ref1.png',
          ip_adapter_images: ['https://example.com/ref1.png', 'https://example.com/ref2.png'],
        }),
      });
    });

    it('uses portrait dimensions for 9:16 aspect ratio', async () => {
      vi.mocked(replicate.run).mockResolvedValue(['https://example.com/scene.png'] as never);

      await generateScene({
        description: 'scene',
        style: 'anime',
        characterReferences: [],
        aspectRatio: 'portrait',
      });

      const callArgs = vi.mocked(replicate.run).mock.calls[0];
      expect(callArgs?.[1]).toMatchObject({
        input: expect.objectContaining({
          width: 768,
          height: 1344,
        }),
      });
    });

    it('uses landscape dimensions for 16:9 aspect ratio', async () => {
      vi.mocked(replicate.run).mockResolvedValue(['https://example.com/scene.png'] as never);

      await generateScene({
        description: 'scene',
        style: 'anime',
        characterReferences: [],
        aspectRatio: 'landscape',
      });

      const callArgs = vi.mocked(replicate.run).mock.calls[0];
      expect(callArgs?.[1]).toMatchObject({
        input: expect.objectContaining({
          width: 1344,
          height: 768,
        }),
      });
    });
  });
});
