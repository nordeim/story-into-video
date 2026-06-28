import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Hero } from '@/components/sections/hero';

/**
 * Hero character counter tests.
 *
 * M2 fix: The Hero textarea maxLength + counter now match the server-side
 * Zod schema (min(100).max(5000)). Previously, Hero used 500 while the
 * server allowed 5000 — inconsistent. The counter now shows "/ 5000" and
 * the amber warning activates at ≥4500 (90% of 5000).
 */
describe('Hero character counter', () => {
  it('renders the counter showing 0 / 5000 initially', () => {
    render(<Hero />);
    expect(screen.getByText('0 / 5000')).toBeInTheDocument();
  });

  it('updates the counter as the user types into the textarea', () => {
    render(<Hero />);

    const textarea = screen.getByRole('textbox', { name: /your story/i });
    fireEvent.change(textarea, { target: { value: 'Hello world' } });

    expect(screen.getByText('11 / 5000')).toBeInTheDocument();
    expect(screen.queryByText('0 / 5000')).not.toBeInTheDocument();
  });

  it('applies the amber warning style at ≥4500 characters (90% of 5000 limit)', () => {
    render(<Hero />);

    const textarea = screen.getByRole('textbox', { name: /your story/i });
    fireEvent.change(textarea, { target: { value: 'a'.repeat(4500) } });

    const counter = screen.getByText('4500 / 5000');
    // Amber warning state activates at ≥4500 chars (90% of 5000)
    expect(counter).toHaveClass('text-amber-400');
  });

  it('uses the muted default style below the 4500-char threshold', () => {
    render(<Hero />);

    const textarea = screen.getByRole('textbox', { name: /your story/i });
    fireEvent.change(textarea, { target: { value: 'a'.repeat(4499) } });

    const counter = screen.getByText('4499 / 5000');
    expect(counter).toHaveClass('text-zinc-600');
    expect(counter).not.toHaveClass('text-amber-400');
  });
});
