import type { Metadata } from 'next';

import { fontVariables } from '@/lib/fonts';
import { Providers } from '@/components/app/providers';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://storyintovideo-clone.example.com'),
  title: 'StoryIntoVideo - Turn Stories Into Videos with AI',
  description:
    'Paste your story and AI handles the rest — characters, storyboards, voiceover, and a finished video in minutes. AI-powered story-into-video generation.',
  keywords: [
    'story into video',
    'AI video generation',
    'storyboard AI',
    'AI voiceover',
    'story video maker',
  ],
  authors: [{ name: 'StoryIntoVideo' }],
  openGraph: {
    title: 'StoryIntoVideo - Turn Stories Into Videos with AI',
    description:
      'Paste your story and AI handles the rest — characters, storyboards, voiceover, and a finished video in minutes.',
    url: 'https://storyintovideo-clone.example.com',
    siteName: 'StoryIntoVideo',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StoryIntoVideo - Turn Stories Into Videos with AI',
    description: 'Paste your story and AI handles the rest.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'StoryIntoVideo',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description: 'AI-powered story-into-video generation tool.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body
        className="bg-background text-foreground min-h-screen antialiased"
        suppressHydrationWarning
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-amber-400 focus:px-4 focus:py-2 focus:font-medium focus:text-zinc-950 focus:shadow-lg"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
