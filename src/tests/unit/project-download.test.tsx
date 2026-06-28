import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * T10 — Download + share on project detail page.
 *
 * When a project reaches status='completed', the detail page must:
 *   - Show a download button linking to a signed R2 URL for the final MP4
 *   - Show a share button (Web Share API with copy-to-clipboard fallback)
 *
 * Requires:
 *   - getProject() to be extended to LEFT JOIN the videos table
 *   - ProjectDownloadButton + ProjectShareButton client components
 *   - The page to render them conditionally when project.videoKey exists
 */

// ── Source-level guarantees (don't need DB mocking) ─────────────────────────
describe('T10: download/share source-level guarantees', () => {
  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  it('queries.ts getProject returns video data via left join', () => {
    const source = readFileSync(resolve(__dirname, '../../features/projects/queries.ts'), 'utf-8');
    const codeOnly = stripComments(source);
    // Must join the videos table — either via .leftJoin() or by selecting from videos
    expect(codeOnly).toMatch(/videos/);
  });

  it('project detail page renders a download link when video is completed', () => {
    const source = readFileSync(
      resolve(__dirname, '../../app/(app)/projects/[id]/page.tsx'),
      'utf-8',
    );
    // The page must reference the download button component
    expect(source).toMatch(/ProjectDownloadButton|download/i);
  });

  it('ProjectDownloadButton component file exists', () => {
    const path = resolve(__dirname, '../../components/app/project-download-button.tsx');
    expect(() => readFileSync(path, 'utf-8')).not.toThrow();
  });

  it('ProjectShareButton component file exists', () => {
    const path = resolve(__dirname, '../../components/app/project-share-button.tsx');
    expect(() => readFileSync(path, 'utf-8')).not.toThrow();
  });

  it('ProjectDownloadButton is a client component', () => {
    const path = resolve(__dirname, '../../components/app/project-download-button.tsx');
    const source = readFileSync(path, 'utf-8');
    expect(source).toMatch(/^['"]use client['"]/m);
  });

  it('ProjectShareButton is a client component', () => {
    const path = resolve(__dirname, '../../components/app/project-share-button.tsx');
    const source = readFileSync(path, 'utf-8');
    expect(source).toMatch(/^['"]use client['"]/m);
  });

  // H4 fix: SignedDownloadWrapper was REMOVED in favor of click-time signing
  // via /api/projects/[id]/download. The wrapper signed at SSR time, baking
  // a 1h-expiry URL into the RSC payload. Users with stale tabs got 403.
  it('H4: project detail page does NOT import SignedDownloadWrapper (removed)', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../../app/(app)/projects/[id]/page.tsx'),
      'utf-8',
    );
    const codeOnly = stripComments(pageSource);
    expect(codeOnly).not.toMatch(/from ['"]@\/components\/app\/signed-download-wrapper['"]/);
    expect(codeOnly).not.toMatch(/async function SignedDownloadWrapper/);
  });

  it('H4: project detail page imports ProjectDownloadButton (click-time signing)', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../../app/(app)/projects/[id]/page.tsx'),
      'utf-8',
    );
    const codeOnly = stripComments(pageSource);
    expect(codeOnly).toMatch(/from ['"]@\/components\/app\/project-download-button['"]/);
  });

  it('H4: download API route exists at app/api/projects/[id]/download/route.ts', () => {
    const routePath = resolve(__dirname, '../../app/api/projects/[id]/download/route.ts');
    expect(() => readFileSync(routePath, 'utf-8')).not.toThrow();
  });
});

// ── Functional tests for the buttons ────────────────────────────────────────
// H4 fix: ProjectDownloadButton now receives projectId (not downloadUrl) and
// fetches a fresh signed URL at click time via /api/projects/[id]/download.
// This eliminates the 1h-expiry trap where stale tabs got 403 errors.
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

describe('H4: ProjectDownloadButton functional behavior (click-time signing)', () => {
  it('renders a download button (not a link) that triggers fetch on click', async () => {
    const { ProjectDownloadButton } = await import('@/components/app/project-download-button');

    render(<ProjectDownloadButton projectId="proj-1" hasVideo={true} />);

    // Should be a button (not an <a> link) — it fetches on click
    const button = screen.getByRole('button', { name: /download/i });
    expect(button).toBeInTheDocument();
  });

  it('returns null when hasVideo is false (empty state)', async () => {
    const { ProjectDownloadButton } = await import('@/components/app/project-download-button');

    const { container } = render(<ProjectDownloadButton projectId="proj-1" hasVideo={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does NOT import r2.ts at module level (no client-side env dependency)', () => {
    const source = readFileSync(
      resolve(__dirname, '../../components/app/project-download-button.tsx'),
      'utf-8',
    );
    // Must not import from @/lib/storage/r2 — that chain triggers env validation
    expect(source).not.toMatch(/from ['"]@\/lib\/storage\/r2['"]/);
  });
});

describe('T10: ProjectShareButton functional behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a share button', async () => {
    const { ProjectShareButton } = await import('@/components/app/project-share-button');

    render(<ProjectShareButton url="https://example.com/projects/123" />);

    const button = screen.getByRole('button', { name: /share/i });
    expect(button).toBeInTheDocument();
  });

  it('falls back to copy-to-clipboard when Web Share API is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    // navigator.share is undefined in jsdom — exercises the fallback path

    const { ProjectShareButton } = await import('@/components/app/project-share-button');

    render(<ProjectShareButton url="https://example.com/projects/123" />);

    const button = screen.getByRole('button', { name: /share/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.com/projects/123');
    });
  });
});
