import { Hero } from "@/components/marketing/Hero";
import { Stats } from "@/components/marketing/Stats";
import { Problems } from "@/components/marketing/Problems";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Testimonials } from "@/components/marketing/Testimonials";
import { PricingCards } from "@/components/marketing/PricingCards";
import { FAQ } from "@/components/marketing/FAQ";
import { CTA } from "@/components/marketing/CTA";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getHero,
  getStats,
  getProblems,
  getFeatures,
  getHowItWorks,
  getTestimonials,
  getPricingSection,
  getFaq,
  getCta
} from "@/lib/api/marketing";
import { getBkashCopy } from "@/lib/api/payment-copy";

export default async function LandingPage() {
  const [
    hero,
    stats,
    problems,
    features,
    howItWorks,
    testimonials,
    pricing,
    faq,
    cta,
    bkashCopy
  ] = await Promise.all([
    getHero(),
    getStats(),
    getProblems(),
    getFeatures(),
    getHowItWorks(),
    getTestimonials(),
    getPricingSection(),
    getFaq(),
    getCta(),
    getBkashCopy()
  ]);

  return (
    <>
      <Hero content={hero} />
      <Stats content={stats} />
      <Problems content={problems} />
      <FeatureGrid content={features} />
      <HowItWorks content={howItWorks} />
      <Testimonials content={testimonials} />

      <Section id="pricing" bg="muted">
        <SectionHeading
          eyebrow={pricing.eyebrow}
          title={pricing.title}
          description={pricing.description}
        />
        <div className="mt-12">
          <PricingCards compact labels={pricing} bkashCopy={bkashCopy} />
        </div>
      </Section>

      <FAQ content={faq} />
      <CTA content={cta} />
    </>
  );
}
