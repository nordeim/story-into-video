import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * T1 — R2 storage putObject helper tests.
 *
 * Mocks @aws-sdk/client-s3 minimally so we can assert PutObjectCommand
 * was constructed with the right Bucket/Key/Body/ContentType, and that
 * S3Client.send was invoked once per upload.
 */

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    send = sendMock;
    config = {};
  }
  class MockPutObjectCommand {
    constructor(public readonly input: unknown) {}
  }
  class MockGetObjectCommand {
    constructor(public readonly input: unknown) {}
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: MockPutObjectCommand,
    GetObjectCommand: MockGetObjectCommand,
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  env: {
    R2_ACCOUNT_ID: 'test-account',
    R2_ACCESS_KEY_ID: 'test-key',
    R2_SECRET_ACCESS_KEY: 'test-secret',
    R2_BUCKET_UPLOADS: 'siv-uploads',
    R2_BUCKET_GENERATED: 'siv-generated',
    R2_BUCKET_VIDEOS: 'siv-videos',
  },
}));

import { putObject } from '@/lib/storage/r2';

describe('T1: R2 putObject helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads a buffer to the specified bucket with correct params', async () => {
    sendMock.mockResolvedValue({});

    const buffer = Buffer.from('fake-audio-bytes');
    await putObject('generated', 'project-1/voiceover.mp3', buffer, 'audio/mpeg');

    expect(sendMock).toHaveBeenCalledTimes(1);
    const sentCommand = sendMock.mock.calls[0]?.[0] as { input: Record<string, unknown> };
    expect(sentCommand.input).toEqual({
      Bucket: 'siv-generated',
      Key: 'project-1/voiceover.mp3',
      Body: buffer,
      ContentType: 'audio/mpeg',
    });
  });

  it('uploads to the videos bucket when specified', async () => {
    sendMock.mockResolvedValue({});

    const buffer = Buffer.from('fake-video-bytes');
    await putObject('videos', 'project-1/final.mp4', buffer, 'video/mp4');

    const sentCommand = sendMock.mock.calls[0]?.[0] as { input: Record<string, unknown> };
    expect(sentCommand.input).toEqual({
      Bucket: 'siv-videos',
      Key: 'project-1/final.mp4',
      Body: buffer,
      ContentType: 'video/mp4',
    });
  });

  it('propagates errors from S3Client.send', async () => {
    sendMock.mockRejectedValue(new Error('S3 upload failed: Access Denied'));

    await expect(
      putObject('uploads', 'k', Buffer.from('x'), 'application/octet-stream'),
    ).rejects.toThrow('S3 upload failed');
  });

  it('returns void on success', async () => {
    sendMock.mockResolvedValue({});
    const result = await putObject('generated', 'k', Buffer.from('x'), 'image/png');
    expect(result).toBeUndefined();
  });
});
