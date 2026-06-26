import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Hero } from '@/components/sections/hero';

describe('Hero character counter', () => {
  it('renders the counter showing 0 / 500 initially', () => {
    render(<Hero />);
    // The counter displays the current textarea length over the 500-char cap.
    expect(screen.getByText('0 / 500')).toBeInTheDocument();
  });

  it('updates the counter as the user types into the textarea', () => {
    render(<Hero />);

    const textarea = screen.getByRole('textbox', { name: /your story/i });
    fireEvent.change(textarea, { target: { value: 'Hello world' } });

    // 11 characters typed → counter reads "11 / 500"
    expect(screen.getByText('11 / 500')).toBeInTheDocument();
    // The initial "0 / 500" should no longer be present
    expect(screen.queryByText('0 / 500')).not.toBeInTheDocument();
  });

  it('applies the amber warning style at ≥450 characters (90% of limit)', () => {
    render(<Hero />);

    const textarea = screen.getByRole('textbox', { name: /your story/i });
    fireEvent.change(textarea, { target: { value: 'a'.repeat(450) } });

    const counter = screen.getByText('450 / 500');
    // Amber warning state activates at ≥450 chars per PRD §2.2
    expect(counter).toHaveClass('text-amber-400');
  });

  it('uses the muted default style below the 450-char threshold', () => {
    render(<Hero />);

    const textarea = screen.getByRole('textbox', { name: /your story/i });
    fireEvent.change(textarea, { target: { value: 'a'.repeat(449) } });

    const counter = screen.getByText('449 / 500');
    // Default muted state — no amber warning
    expect(counter).toHaveClass('text-zinc-600');
    expect(counter).not.toHaveClass('text-amber-400');
  });
});
