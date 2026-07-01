import Link from 'next/link';

import { FOOTER_COLUMNS, FOOTER_BRAND, FOOTER_COPYRIGHT } from '@/lib/data/footer-links';

/**
 * Footer — server component.
 * Brand block (left) + 3 link columns + bottom row (copyright + legal links).
 * All copy verbatim from PRD §12.1 Footer section.
 */
export function Footer() {
  return (
    <footer className="bg-background border-t border-white/[0.06] px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand block */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="font-heading focus-visible:outline-primary text-base font-medium tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {FOOTER_BRAND.name}
            </Link>
            <p className="mt-2 max-w-[24ch] text-sm text-zinc-400">{FOOTER_BRAND.tagline}</p>
            <a
              href={`mailto:${FOOTER_BRAND.supportEmail}`}
              className="hover:text-primary focus-visible:outline-primary mt-4 inline-block text-sm text-zinc-400 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
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
                {col.links.map((link) =>
                  link.href.startsWith('/') ? (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="focus-visible:outline-primary block py-1.5 text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="focus-visible:outline-primary block py-1.5 text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        {link.label}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">{FOOTER_COPYRIGHT}</p>
          <nav className="flex gap-6" aria-label="Legal">
            <Link
              href="/privacy"
              className="focus-visible:outline-primary text-sm text-zinc-500 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="focus-visible:outline-primary text-sm text-zinc-500 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="focus-visible:outline-primary text-sm text-zinc-500 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
