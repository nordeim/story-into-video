import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges plain class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes (falsy values skipped)', () => {
    const isYes = true;
    const isNo = false;
    expect(cn('base', isNo && 'no', isYes && 'yes', null, undefined)).toBe('base yes');
  });

  it('dedupes conflicting Tailwind classes via tailwind-merge', () => {
    // px-4 should win over px-2 (later declaration wins in Tailwind)
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles arrays (clsx)', () => {
    expect(cn(['a', 'b'])).toBe('a b');
  });

  it('handles objects (clsx)', () => {
    expect(cn({ a: true, b: false, c: true })).toBe('a c');
  });

  it('handles mixed arrays + objects + strings', () => {
    expect(cn(['a', { b: true, c: false }], 'd', { e: true })).toBe('a b d e');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('returns empty string for all-falsy inputs', () => {
    expect(cn(false, null, undefined, '', 0)).toBe('');
  });
});
