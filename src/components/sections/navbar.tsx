'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useScrolled } from '@/lib/hooks/use-scrolled';
import { NAV_LANGUAGES, NAV_LINKS } from '@/lib/data/nav-links';
import { cn } from '@/lib/utils';

/**
 * Navbar — client component.
 * Fixed nav with scroll-aware background (transparent → bg-background/70
 * backdrop-blur-[24px] border-b border-white/10 at scrollY > 10).
 * Desktop: logo + 4 nav links + EN dropdown + Sign in + Get Started.
 * Mobile (<sm): logo + EN + hamburger → right-side Sheet.
 */
export function Navbar() {
  const scrolled = useScrolled(10);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/70 border-b border-white/10 backdrop-blur-[24px]'
          : 'bg-transparent',
      )}
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"
        aria-label="Main"
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-heading focus-visible:outline-primary text-base font-medium tracking-tight text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          StoryIntoVideo
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-visible:outline-primary rounded-lg px-3 py-1.5 text-sm font-medium text-white/60 transition-all duration-200 hover:bg-white/[0.04] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="focus-visible:outline-primary flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-3"
              aria-label="Switch language"
            >
              EN
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-popover border-border animate-[lang-dropdown-in_0.15s_ease-out]"
            >
              {NAV_LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang}
                  className={cn(
                    'cursor-pointer focus:bg-white/[0.04]',
                    lang === 'EN' && 'text-primary',
                  )}
                >
                  {lang}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sign in (desktop only) */}
          <Link
            href="/sign-in"
            className="focus-visible:outline-primary hidden rounded-lg px-3 py-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 sm:inline"
          >
            Sign in
          </Link>

          {/* Get Started (desktop) */}
          <Link
            href="/sign-up"
            className="focus-visible:outline-primary hidden rounded-full px-5 py-2 text-base font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 sm:inline"
          >
            Get Started
          </Link>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="focus-visible:outline-primary inline-flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 sm:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-background w-[300px] border-l border-white/10 p-6"
            >
              <SheetHeader className="mb-6 flex flex-row items-center justify-between">
                <SheetTitle className="font-heading text-base font-medium text-white">
                  Menu
                </SheetTitle>
                <SheetClose asChild>
                  <button
                    type="button"
                    className="focus-visible:outline-primary inline-flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </SheetClose>
              </SheetHeader>
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="focus-visible:outline-primary rounded-lg px-3 py-2 text-base font-medium text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2 border-white/10" />
                <Link
                  href="/sign-in"
                  onClick={() => setMobileOpen(false)}
                  className="focus-visible:outline-primary rounded-lg px-3 py-2 text-base font-medium text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setMobileOpen(false)}
                  className="text-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-primary rounded-lg px-3 py-2 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Get Started
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
