import type { NavLink } from '@/types';

export const NAV_LINKS: NavLink[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
  { label: 'Contact', href: '#contact' },
];

/** Languages shown in the navbar dropdown (decorative — no i18n implementation). */
export const NAV_LANGUAGES = ['EN', '中文', '日本語'] as const;
