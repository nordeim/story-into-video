import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * T2 — Pipeline queries for voiceovers + videos tables.
 *
 * The existing pipeline/queries.ts only handles characters, scenes,
 * and project progress. Wiring Steps 4-6 (voiceover, subtitles, video
 * assembly) into Inngest requires new queries:
 *   - appendVoiceover
 *   - getProjectVoiceover
 *   - appendVideo
 *   - updateVideoSubtitle
 */

const dbInsertChain = (returnValue: unknown) => ({
  values: vi.fn(() => ({
    onConflictDoNothing: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([returnValue]),
    })),
    returning: vi.fn().mockResolvedValue([returnValue]),
  })),
});

const dbSelectChain = (returnValue: unknown) => ({
  from: vi.fn(() => ({
    where: vi.fn(() => ({
      limit: vi.fn().mockResolvedValue([returnValue]),
      orderBy: vi.fn().mockResolvedValue([returnValue]),
    })),
  })),
});

const dbUpdateChain = () => ({
  set: vi.fn(() => ({
    where: vi.fn().mockResolvedValue(undefined),
  })),
});

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

import { db } from '@/lib/db';
import {
  appendVoiceover,
  getProjectVoiceover,
  appendVideo,
  updateVideoSubtitle,
  updateVideo,
} from '@/features/pipeline/queries';

describe('T2: Voiceover + Video pipeline queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('appendVoiceover', () => {
    it('inserts a voiceover row and returns it', async () => {
      const voiceoverRow = {
        id: 'vo-1',
        projectId: 'proj-1',
        voiceId: 'voice-1',
        voiceName: 'Josh',
        audioKey: 'proj-1/voiceover.mp3',
        duration: 42.5,
        transcript: 'Once upon a time...',
      };
      vi.mocked(db.insert).mockReturnValue(dbInsertChain(voiceoverRow) as never);

      const result = await appendVoiceover(
        'proj-1',
        'voice-1',
        'Josh',
        'proj-1/voiceover.mp3',
        42.5,
        'Once upon a time...',
      );

      // C5: append* now returns AppendResult { inserted, row }
      expect(result.inserted).toBe(true);
      expect(result.row).toEqual(voiceoverRow);
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('getProjectVoiceover', () => {
    it('returns the first voiceover for the project', async () => {
      const vo = { id: 'vo-1', projectId: 'proj-1', voiceId: 'v1' };
      vi.mocked(db.select).mockReturnValue(dbSelectChain(vo) as never);

      const result = await getProjectVoiceover('proj-1');
      expect(result).toEqual(vo);
    });

    it('returns undefined when project has no voiceover', async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      } as never);

      const result = await getProjectVoiceover('proj-1');
      expect(result).toBeUndefined();
    });
  });

  describe('appendVideo', () => {
    it('inserts a video row and returns it', async () => {
      const videoRow = {
        id: 'vid-1',
        projectId: 'proj-1',
        videoKey: 'proj-1/final.mp4',
        subtitleKey: 'proj-1/subs.srt',
        duration: 90,
        resolution: '1080p',
        status: 'completed',
      };
      vi.mocked(db.insert).mockReturnValue(dbInsertChain(videoRow) as never);

      const result = await appendVideo(
        'proj-1',
        'proj-1/final.mp4',
        'proj-1/subs.srt',
        90,
        '1080p',
      );

      // C5: append* now returns AppendResult { inserted, row }
      expect(result.inserted).toBe(true);
      expect(result.row).toEqual(videoRow);
    });
  });

  describe('updateVideoSubtitle', () => {
    it('updates the subtitleKey on the video row by projectId', async () => {
      vi.mocked(db.update).mockReturnValue(dbUpdateChain() as never);

      await updateVideoSubtitle('proj-1', 'proj-1/subs.srt');

      expect(db.update).toHaveBeenCalled();
      const setChain = vi.mocked(db.update).mock.results[0]?.value.set;
      expect(setChain).toHaveBeenCalled();
    });
  });

  describe('T3: updateVideo', () => {
    it('updates the videoKey + duration on the existing video row by projectId', async () => {
      vi.mocked(db.update).mockReturnValue(dbUpdateChain() as never);

      await updateVideo('proj-1', 'proj-1/final.mp4', 90);

      expect(db.update).toHaveBeenCalled();
      const setChain = vi.mocked(db.update).mock.results[0]?.value.set;
      expect(setChain).toHaveBeenCalledWith(
        expect.objectContaining({
          videoKey: 'proj-1/final.mp4',
          duration: 90,
        }),
      );
    });
  });

  // C5: Pipeline queries must be idempotent so Inngest retries don't create
  // duplicate rows. The UNIQUE indexes on videos.projectId + voiceovers.projectId
  // (added in Task 1.3) make ON CONFLICT DO NOTHING possible.
  describe('C5: Idempotent append* queries (ON CONFLICT DO NOTHING)', () => {
    const QUERIES_PATH = resolve(__dirname, '../../features/pipeline/queries.ts');

    it('appendVideo uses onConflictDoNothing on projectId', () => {
      const source = readFileSync(QUERIES_PATH, 'utf-8');
      expect(source).toMatch(/appendVideo[\s\S]*?onConflictDoNothing/);
    });

    it('appendVoiceover uses onConflictDoNothing on projectId', () => {
      const source = readFileSync(QUERIES_PATH, 'utf-8');
      expect(source).toMatch(/appendVoiceover[\s\S]*?onConflictDoNothing/);
    });

    it('appendCharacter uses onConflictDoNothing (on projectId + name)', () => {
      const source = readFileSync(QUERIES_PATH, 'utf-8');
      expect(source).toMatch(/appendCharacter[\s\S]*?onConflictDoNothing/);
    });

    it('appendScene uses onConflictDoNothing (on projectId + order)', () => {
      const source = readFileSync(QUERIES_PATH, 'utf-8');
      expect(source).toMatch(/appendScene[\s\S]*?onConflictDoNothing/);
    });
  });
});
