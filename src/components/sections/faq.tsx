'use client';

import { Plus } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Eyebrow } from '@/components/primitives/eyebrow';
import { SectionHeading } from '@/components/primitives/section-heading';
import { FAQ_ITEMS } from '@/lib/data/faq-items';
import { cn } from '@/lib/utils';

/**
 * FAQ — client component.
 * Radix Accordion (single-open, collapsible). 6 items in single-column max-w-3xl.
 * Plus icon rotates 45° on open (becomes ×). Content uses CSS Grid
 * grid-template-rows 0fr→1fr transition (defined in globals.css via
 * .radix-accordion-content class).
 */
export function Faq() {
  return (
    <section className="bg-background py-24" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <Eyebrow className="mb-4">FAQ</Eyebrow>
          <SectionHeading id="faq-heading">Frequently Asked Questions</SectionHeading>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-b border-white/10 last:border-0"
            >
              <AccordionTrigger
                className={cn(
                  'flex w-full items-center justify-between gap-4 py-6 text-start',
                  'focus-visible:outline-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2',
                  'group hover:no-underline',
                )}
              >
                <span className="group-hover:text-primary pr-4 text-start text-base font-medium text-white transition-colors sm:text-lg">
                  {item.question}
                </span>
                <span
                  className="group-hover:text-primary shrink-0 text-zinc-500 transition-transform duration-300 [[data-state=open]>&]:rotate-45"
                  aria-hidden="true"
                >
                  <Plus className="h-5 w-5" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="overflow-hidden text-zinc-400">
                <p className="pb-6 text-sm leading-relaxed sm:text-base">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
