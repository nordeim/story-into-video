import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import localFont from 'next/font/local';

// Self-hosted Outfit variable font for access to weight 820
// (next/font/google only serves discrete weights — 820 unavailable)
// Source: https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf
// Converted to woff2 via fonttools (45KB, weight range 100-900)
const outfit = localFont({
  src: '../../public/fonts/Outfit-VariableFont.woff2',
  weight: '100 900',
  variable: '--font-outfit',
  display: 'swap',
});

export const fonts = {
  sans: GeistSans,
  mono: GeistMono,
  heading: outfit,
};

// Combined CSS variable classes for the <html> element
export const fontVariables: string = [GeistSans.variable, GeistMono.variable, outfit.variable].join(
  ' ',
);
