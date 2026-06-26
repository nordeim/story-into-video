import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Hero } from '@/components/sections/hero';

describe('Hero ratio toggle', () => {
  it('starts with 9:16 active and 16:9 inactive', () => {
    render(<Hero />);
    const portrait = screen.getByRole('button', { name: /9:16/i });
    const landscape = screen.getByRole('button', { name: /16:9/i });
    expect(portrait).toHaveAttribute('aria-pressed', 'true');
    expect(landscape).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles to 16:9 on click (single selection enforced)', async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const portrait = screen.getByRole('button', { name: /9:16/i });
    const landscape = screen.getByRole('button', { name: /16:9/i });

    await user.click(landscape);
    expect(landscape).toHaveAttribute('aria-pressed', 'true');
    expect(portrait).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles back to 9:16 when clicked again', async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const portrait = screen.getByRole('button', { name: /9:16/i });
    const landscape = screen.getByRole('button', { name: /16:9/i });

    await user.click(landscape);
    expect(landscape).toHaveAttribute('aria-pressed', 'true');

    await user.click(portrait);
    expect(portrait).toHaveAttribute('aria-pressed', 'true');
    expect(landscape).toHaveAttribute('aria-pressed', 'false');
  });
});
