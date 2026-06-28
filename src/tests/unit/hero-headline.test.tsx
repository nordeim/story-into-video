import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Hero } from '@/components/sections/hero';

/**
 * Hero headline + subtitle — spec fidelity tests.
 *
 * The deviation report (storyintovideo_deviation_report_v3.md §4.1, §4.2)
 * found two content drifts vs. the original storyintovideo.com:
 *
 *  §4.1 Headline: Original is a 3-line stacked title-card:
 *     "Turn"
 *     "Story Into Video"
 *     "with AI Magic"
 *   The clone collapsed this to 2 lines ("Turn Story Into Video" on one
 *   line), losing the cinematic poster quality.
 *
 *  §4.2 Subtitle: Original emphasizes the OUTPUT —
 *     "...and a finished video in minutes."
 *   The clone emphasized PROCESS instead —
 *     "...and subtitles, all generated in minutes."
 *   The original is the stronger value proposition (the user gets a
 *   finished video, not just subtitle artifacts).
 *
 * These tests lock the spec-mandated copy so future drift is caught.
 */

describe('Hero headline — 3-line cinematic stack (spec §4.1)', () => {
  it('renders the H1 with three distinct text nodes (Turn / Story Into Video / with AI Magic)', () => {
    render(<Hero />);
    const heading = screen.getByRole('heading', { level: 1 });

    // The H1 must contain all three phrases as separate text segments
    // (separated by <br /> elements). We assert each phrase is present
    // and that the heading text is NOT collapsed to a single line.
    const headingText = heading.textContent ?? '';
    expect(headingText).toMatch(/Turn/i);
    expect(headingText).toMatch(/Story Into Video/i);
    expect(headingText).toMatch(/with AI Magic/i);
  });

  it('uses two <br> elements to create the 3-line stack', () => {
    const { container } = render(<Hero />);
    const heading = container.querySelector('h1');
    expect(heading).not.toBeNull();
    const breakCount = heading?.querySelectorAll('br').length ?? 0;
    // 2 <br> tags produce 3 visual lines:
    //   Line 1: "Turn"
    //   <br>
    //   Line 2: "Story Into Video"
    //   <br>
    //   Line 3: "with AI Magic"
    expect(breakCount).toBe(2);
  });

  it('applies Outfit weight 820 via inline style (spec §1.4)', () => {
    const { container } = render(<Hero />);
    const heading = container.querySelector('h1');
    expect(heading).not.toBeNull();
    // The inline style fontWeight:820 is what gives the headline its
    // ultra-heavy cinematic title-card quality. Google Fonts API only
    // serves discrete weights — 820 requires the self-hosted variable font.
    expect(heading?.getAttribute('style')).toMatch(/font-weight:\s*820/i);
  });
});

describe('Hero subtitle — emphasizes finished video (spec §4.2)', () => {
  it('renders the subtitle with "a finished video in minutes" copy', () => {
    render(<Hero />);
    // The original emphasizes the OUTPUT ("a finished video"), not the
    // PROCESS ("subtitles, all generated"). This is the stronger value
    // proposition — the user gets a completed video, not just artifacts.
    const subtitle = screen.getByText(/finished video/i);
    expect(subtitle).toBeInTheDocument();
  });

  it('does NOT use the drifted "subtitles, all generated in minutes" copy', () => {
    render(<Hero />);
    // Regression guard: the drifted copy emphasized process over output.
    // It must not return.
    expect(screen.queryByText(/subtitles, all generated/i)).not.toBeInTheDocument();
  });
});
