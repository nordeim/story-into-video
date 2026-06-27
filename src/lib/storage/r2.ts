import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

import { env } from '@/lib/env';

/**
 * Cloudflare R2 storage client — S3-compatible API.
 *
 * Three buckets (per ADR-005):
 *   - siv-uploads:    user inputs (story text as JSON, reference uploads)
 *   - siv-generated:  AI-generated images + audio (characters, scenes, voiceover)
 *   - siv-videos:     final rendered MP4s
 *
 * All buckets are PRIVATE. Access is via signed URLs (1-hour expiry).
 * Never make buckets public — signed URLs prevent unauthorized access.
 *
 * Pattern source: skills/security-and-hardening/SKILL.md (Secrets, File Upload)
 */

type BucketName = 'uploads' | 'generated' | 'videos';

const BUCKET_MAP: Record<BucketName, string> = {
  uploads: env.R2_BUCKET_UPLOADS,
  generated: env.R2_BUCKET_GENERATED,
  videos: env.R2_BUCKET_VIDEOS,
};

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const SIGNED_URL_EXPIRY = 3600; // 1 hour

/** Generate a signed URL for uploading a file to R2 */
export async function getSignedUploadUrl(
  bucket: BucketName,
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_MAP[bucket],
    Key: key,
    ContentType: contentType,
  });
  return awsGetSignedUrl(r2Client, command, { expiresIn: SIGNED_URL_EXPIRY });
}

/** Generate a signed URL for downloading a file from R2 */
export async function getSignedDownloadUrl(bucket: BucketName, key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_MAP[bucket],
    Key: key,
  });
  return awsGetSignedUrl(r2Client, command, { expiresIn: SIGNED_URL_EXPIRY });
}

/**
 * Upload a Buffer directly to R2.
 *
 * Used by the Inngest pipeline (Steps 4-6) to persist AI-generated audio,
 * SRT subtitles, and the final MP4 video. Inside an Inngest function we
 * already have the bytes in memory — going through a presigned URL would
 * add a redundant HTTP round-trip.
 *
 * Returns void on success. Callers use the known (bucket, key) pair for
 * future reads via getSignedDownloadUrl.
 */
export async function putObject(
  bucket: BucketName,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const input: PutObjectCommandInput = {
    Bucket: BUCKET_MAP[bucket],
    Key: key,
    Body: body,
    ContentType: contentType,
  };
  await r2Client.send(new PutObjectCommand(input));
}

/** Build an R2 object key from a project ID + filename */
export function buildObjectKey(projectId: string, filename: string): string {
  return `${projectId}/${filename}`;
}

export { r2Client, BUCKET_MAP };
export type { BucketName };
