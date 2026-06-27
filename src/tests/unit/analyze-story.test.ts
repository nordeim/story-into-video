import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the OpenAI SDK
vi.mock('@/lib/ai/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
    moderations: {
      create: vi.fn(),
    },
  },
  GPT_MODEL: 'gpt-4o',
}));

import { openai } from '@/lib/ai/openai';
import { analyzeStory } from '@/features/pipeline/domain/analyze-story';
import { moderateContent } from '@/features/pipeline/domain/moderate-content';

describe('S2-03: OpenAI integration + story analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeStory', () => {
    it('returns a typed AnalyzedStory with characters and scenes', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'The Last Signal',
                summary: 'A captain receives a signal from a dead colony.',
                characters: [
                  {
                    name: 'Captain Reyes',
                    description:
                      'A woman in her 40s, weathered face, dark hair, wearing a worn spaceship uniform.',
                  },
                ],
                scenes: [
                  {
                    order: 1,
                    description:
                      'The bridge of a spaceship, dimly lit, stars visible through the viewport.',
                    characters: ['Captain Reyes'],
                    duration_sec: 10,
                  },
                ],
              }),
            },
          },
        ],
      };
      vi.mocked(openai.chat.completions.create).mockResolvedValue(mockResponse as never);

      const result = await analyzeStory('Dr. Elena Voss pressed her palm...');

      expect(result.title).toBe('The Last Signal');
      expect(result.characters).toHaveLength(1);
      expect(result.characters[0]?.name).toBe('Captain Reyes');
      expect(result.scenes).toHaveLength(1);
      expect(result.scenes[0]?.duration_sec).toBe(10);
    });

    it('throws when OpenAI returns an empty response', async () => {
      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: null } }],
      } as never);

      await expect(analyzeStory('story text')).rejects.toThrow(/empty response/i);
    });

    it('throws when the response does not match the AnalyzedStory schema', async () => {
      vi.mocked(openai.chat.completions.create).mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({ foo: 'bar' }) } }],
      } as never);

      await expect(analyzeStory('story text')).rejects.toThrow();
    });

    it('uses JSON response_format and the gpt-4o model', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'T',
                summary: 'S',
                characters: [{ name: 'A', description: 'B' }],
                scenes: [{ order: 1, description: 'D', characters: [], duration_sec: 5 }],
              }),
            },
          },
        ],
      };
      vi.mocked(openai.chat.completions.create).mockResolvedValue(mockResponse as never);

      await analyzeStory('story');
      expect(openai.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
        }),
      );
    });
  });

  describe('moderateContent', () => {
    it('returns { flagged: false } for clean text', async () => {
      vi.mocked(openai.moderations.create).mockResolvedValue({
        results: [
          {
            flagged: false,
            categories: {},
            category_scores: {},
          },
        ],
      } as never);

      const result = await moderateContent('A peaceful story about a garden.');
      expect(result.flagged).toBe(false);
      expect(result.categories).toEqual([]);
    });

    it('returns { flagged: true, categories: [...] } for prohibited text', async () => {
      vi.mocked(openai.moderations.create).mockResolvedValue({
        results: [
          {
            flagged: true,
            categories: { violence: true, hate: false },
            category_scores: {},
          },
        ],
      } as never);

      const result = await moderateContent('prohibited content');
      expect(result.flagged).toBe(true);
      expect(result.categories).toContain('violence');
    });

    it('throws when OpenAI returns no results', async () => {
      vi.mocked(openai.moderations.create).mockResolvedValue({
        results: [],
      } as never);

      await expect(moderateContent('text')).rejects.toThrow(/no results/i);
    });
  });
});
