import Link from 'next/link';

import { FOOTER_COLUMNS, FOOTER_BRAND, FOOTER_COPYRIGHT } from '@/lib/data/footer-links';

/**
 * Footer — server component.
 * Brand block (left) + 3 link columns + bottom row (copyright + legal links).
 * All copy verbatim from PRD §12.1 Footer section.
 */
export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-zinc-950 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand block */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="font-heading text-base font-medium tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              {FOOTER_BRAND.name}
            </Link>
            <p className="mt-2 max-w-[24ch] text-sm text-zinc-400">{FOOTER_BRAND.tagline}</p>
            <a
              href={`mailto:${FOOTER_BRAND.supportEmail}`}
              className="mt-4 inline-block text-sm text-zinc-400 transition-colors hover:text-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              {FOOTER_BRAND.supportEmail}
            </a>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                {col.title}
              </h3>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="block py-1.5 text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">{FOOTER_COPYRIGHT}</p>
          <nav className="flex gap-6" aria-label="Legal">
            <a
              href="/privacy"
              className="text-sm text-zinc-500 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="text-sm text-zinc-500 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Terms of Service
            </a>
            <a
              href="/contact"
              className="text-sm text-zinc-500 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
