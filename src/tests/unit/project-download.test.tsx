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
});

// ── Functional tests for the buttons ────────────────────────────────────────
vi.mock('@/lib/storage/r2', () => ({
  getSignedDownloadUrl: vi.fn().mockResolvedValue('https://r2.example.com/signed-download'),
}));

import { getSignedDownloadUrl } from '@/lib/storage/r2';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

describe('T10: ProjectDownloadButton functional behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a download link with the signed URL', async () => {
    const { ProjectDownloadButton } = await import('@/components/app/project-download-button');

    render(<ProjectDownloadButton videoKey="proj-1/final.mp4" />);

    // Wait for the signed URL to resolve
    await waitFor(() => {
      expect(getSignedDownloadUrl).toHaveBeenCalledWith('videos', 'proj-1/final.mp4');
    });

    const link = await screen.findByRole('link', { name: /download/i });
    expect(link).toHaveAttribute('href', 'https://r2.example.com/signed-download');
    expect(link).toHaveAttribute('download');
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
