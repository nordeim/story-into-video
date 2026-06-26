import { Navbar } from '@/components/sections/navbar';
import { Hero } from '@/components/sections/hero';
import { Examples } from '@/components/sections/examples';
import { Workflow } from '@/components/sections/workflow';
import { Features } from '@/components/sections/features';
import { Testimonials } from '@/components/sections/testimonials';
import { UseCases } from '@/components/sections/use-cases';
import { Faq } from '@/components/sections/faq';
import { FinalCTA } from '@/components/sections/final-cta';
import { Footer } from '@/components/sections/footer';

export const dynamic = 'force-static';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <Examples />
        <Workflow />
        <Features />
        <Testimonials />
        <UseCases />
        <Faq />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
