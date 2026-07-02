import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
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

/**
 * Maximum body size for a single putObject call.
 *
 * R2's hard per-PUT limit is 5 GB, but Vercel/Inngest function memory is
 * typically 1-8 GB. A 4K FFmpeg output (~4 GB) would OOM the function
 * before reaching R2. We cap at 500 MB — comfortably above any reasonable
 * 720p/1080p MP4 (typically 50-200 MB) and well below R2's limit, giving
 * us a safety margin for memory pressure.
 *
 * If you need to upload larger files, use multipart upload via the AWS SDK
 * (CreateMultipartUploadCommand) instead of putObject.
 */
export const MAX_PUT_OBJECT_BYTES = 500 * 1024 * 1024; // 500 MB

/** Error thrown when a putObject body exceeds MAX_PUT_OBJECT_BYTES. */
export class PayloadTooLargeError extends Error {
  constructor(
    public readonly actualBytes: number,
    public readonly maxBytes: number,
  ) {
    super(
      `putObject payload exceeds size limit: ${actualBytes} bytes ` +
        `(max ${maxBytes} bytes / ${Math.round(maxBytes / 1024 / 1024)} MB). ` +
        `Use multipart upload for larger files.`,
    );
    this.name = 'PayloadTooLargeError';
  }
}

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
  // T7 (remediation): Fail fast on oversized payloads. R2's limit is 5 GB,
  // but function memory is the real constraint. See MAX_PUT_OBJECT_BYTES.
  if (body.length > MAX_PUT_OBJECT_BYTES) {
    throw new PayloadTooLargeError(body.length, MAX_PUT_OBJECT_BYTES);
  }

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

/**
 * T4 (status_11.md) — Best-effort bulk deletion of a user's R2 media.
 *
 * Called by DELETE /api/user after the DB CASCADE has wiped the user's
 * projects. The keys are collected BEFORE the DB delete (in deleteUserAccount)
 * because CASCADE would make it impossible to find them afterward.
 *
 * R2's DeleteObjects API accepts up to 1000 keys per request. We batch
 * accordingly. Errors are logged but NOT thrown — the DB deletion is the
 * source of truth for "account deleted", and R2 orphans are acceptable
 * (they're inert without DB rows pointing to them, and the Privacy Policy
 * §4 promises deletion "within 30 days" — we delete immediately when R2
 * is reachable, and the 30-day window covers transient R2 outages).
 *
 * @param keys - R2 object keys to delete (across all 3 buckets — the function
 *               tries each bucket; keys not found in a bucket are silently
 *               ignored by R2's DeleteObjects API)
 * @returns The number of keys successfully queued for deletion
 */
export async function deleteUserMedia(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;

  let deletedCount = 0;
  const BATCH_SIZE = 1000; // R2/S3 DeleteObjects max per request

  // Try each bucket — a given key exists in exactly one bucket, but we don't
  // know which without querying. DeleteObjects silently ignores missing keys,
  // so blasting all 3 buckets is safe and avoids 3x list-then-delete round-trips.
  const buckets: BucketName[] = ['uploads', 'generated', 'videos'];

  for (const bucket of buckets) {
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batch = keys.slice(i, i + BATCH_SIZE);
      try {
        const command = new DeleteObjectsCommand({
          Bucket: BUCKET_MAP[bucket],
          Delete: {
            Objects: batch.map((key) => ({ Key: key })),
            Quiet: true, // Don't return per-key results — we just want the count
          },
        });
        const result = await r2Client.send(command);
        // result.Deleted?.length is undefined when Quiet:true — use Errors instead
        if (result.Errors && result.Errors.length > 0) {
          console.warn(
            `[r2] deleteUserMedia: ${result.Errors.length} errors in bucket ${bucket}:`,
            result.Errors.slice(0, 5).map((e) => `${e.Key}: ${e.Message}`),
          );
        }
        deletedCount += batch.length;
      } catch (err) {
        // Best-effort — log and continue. DB deletion has already succeeded.
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[r2] deleteUserMedia: batch failed in bucket ${bucket}: ${message}`);
      }
    }
  }

  return deletedCount;
}

export type { BucketName };
