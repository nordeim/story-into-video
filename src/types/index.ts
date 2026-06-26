import type { LucideIcon } from 'lucide-react';

/** Navigation link in the Navbar (desktop + mobile Sheet). */
export interface NavLink {
  label: string;
  href: string;
}

/** Story example chip in the Hero — clicking populates the textarea. */
export interface StoryExample {
  label: string;
  /** The multi-paragraph seed text injected into the textarea on click. */
  seed: string;
}

/** Aspect ratio toggle button in the Hero (9:16 portrait or 16:9 landscape). */
export interface AspectRatio {
  label: '9:16' | '16:9';
  value: 'portrait' | 'landscape';
}

/** Portrait example card in the Examples carousel. */
export interface ExampleCard {
  id: string;
  title: string;
  /** Style tag shown below the title (e.g., "Anime · Romance"). */
  styleTag: string;
  /** Path to the 9:16 WebP thumbnail in /public/examples/. */
  thumbnail: string;
  href: string;
}

/** One of the 4 alternating media/text rows in the Workflow section. */
export interface WorkflowStep {
  number: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  /** Path to the looping MP4 demo in /public/workflow/. */
  videoSrc: string;
  /** Path to the WebP poster shown before the video loads. */
  videoPoster: string;
  /** Desktop layout: which side the media sits on. Mobile always stacks media-above-text. */
  mediaPosition: 'left' | 'right';
}

/** One of the 8 items in the Features 4×2 hairline grid. */
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/** One of the 6 testimonial cards in the Testimonials 3×2 grid. */
export interface Testimonial {
  id: string;
  quote: string;
  authorName: string;
  authorRole: string;
  /** 2-letter initials rendered in the amber gradient avatar (e.g., "SK"). */
  initials: string;
}

/** One of the 4 use case cards in the UseCases 2×2 grid. */
export interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

/** One of the 6 items in the FAQ Radix Accordion. */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

/** A single link in the Footer. */
export interface FooterLink {
  label: string;
  href: string;
}

/** A titled column of links in the Footer. */
export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/** A chip in the Hero style tags marquee. */
export interface StyleChip {
  label: string;
  /** Optional smaller sublabel (only "Cyberpunk" uses this: "Futuristic neon"). */
  sublabel?: string;
}
