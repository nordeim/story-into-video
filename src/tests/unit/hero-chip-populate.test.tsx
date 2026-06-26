import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Hero } from '@/components/sections/hero';

describe('Hero chip → textarea population', () => {
  it('populates textarea with Time travel seed when chip clicked', async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const textarea = screen.getByPlaceholderText(/Paste your story here/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');

    const chip = screen.getByRole('button', { name: /Time travel/i });
    await user.click(chip);

    expect(textarea.value).toContain('Dr. Elena Voss');
  });

  it('populates textarea with Victorian mystery seed when chip clicked', async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const chip = screen.getByRole('button', { name: /Victorian mystery/i });
    await user.click(chip);

    const textarea = screen.getByPlaceholderText(/Paste your story here/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Lady Ashford');
  });

  it('populates textarea with Space odyssey seed when chip clicked', async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const chip = screen.getByRole('button', { name: /Space odyssey/i });
    await user.click(chip);

    const textarea = screen.getByPlaceholderText(/Paste your story here/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('colony ship Aurora');
  });

  it('populates textarea with Rival chefs seed when chip clicked', async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const chip = screen.getByRole('button', { name: /Rival chefs/i });
    await user.click(chip);

    const textarea = screen.getByPlaceholderText(/Paste your story here/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('Maison Lumière');
  });

  it('replaces previous seed when a different chip is clicked', async () => {
    const user = userEvent.setup();
    render(<Hero />);

    const textarea = screen.getByPlaceholderText(/Paste your story here/i) as HTMLTextAreaElement;

    await user.click(screen.getByRole('button', { name: /Time travel/i }));
    expect(textarea.value).toContain('Dr. Elena Voss');

    await user.click(screen.getByRole('button', { name: /Space odyssey/i }));
    expect(textarea.value).toContain('colony ship Aurora');
    expect(textarea.value).not.toContain('Dr. Elena Voss');
  });
});
