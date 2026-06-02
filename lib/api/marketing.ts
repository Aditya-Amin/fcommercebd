import { apiFetch } from "./client";
import type {
  HeroContent,
  StatsContent,
  ProblemsContent,
  FeaturesContent,
  HowItWorksContent,
  TestimonialsContent,
  PricingSectionContent,
  FaqContent,
  CtaContent,
  NavContent,
  FooterContent
} from "@/lib/types/marketing";

import heroMock from "@/lib/mock/marketing/hero.json";
import statsMock from "@/lib/mock/marketing/stats.json";
import problemsMock from "@/lib/mock/marketing/problems.json";
import featuresMock from "@/lib/mock/marketing/features.json";
import howItWorksMock from "@/lib/mock/marketing/how-it-works.json";
import testimonialsMock from "@/lib/mock/marketing/testimonials.json";
import pricingSectionMock from "@/lib/mock/marketing/pricing-section.json";
import faqMock from "@/lib/mock/marketing/faq.json";
import ctaMock from "@/lib/mock/marketing/cta.json";
import navMock from "@/lib/mock/marketing/nav.json";
import footerMock from "@/lib/mock/marketing/footer.json";

export function getHero() {
  return apiFetch<HeroContent>(
    "/marketing/hero",
    () => heroMock as HeroContent
  );
}

export function getStats() {
  return apiFetch<StatsContent>(
    "/marketing/stats",
    () => statsMock as StatsContent
  );
}

export function getProblems() {
  return apiFetch<ProblemsContent>(
    "/marketing/problems",
    () => problemsMock as ProblemsContent
  );
}

export function getFeatures() {
  return apiFetch<FeaturesContent>(
    "/marketing/features",
    () => featuresMock as FeaturesContent
  );
}

export function getHowItWorks() {
  return apiFetch<HowItWorksContent>(
    "/marketing/how-it-works",
    () => howItWorksMock as HowItWorksContent
  );
}

export function getTestimonials() {
  return apiFetch<TestimonialsContent>(
    "/marketing/testimonials",
    () => testimonialsMock as TestimonialsContent
  );
}

export function getPricingSection() {
  return apiFetch<PricingSectionContent>(
    "/marketing/pricing",
    () => pricingSectionMock as PricingSectionContent
  );
}

export function getFaq() {
  return apiFetch<FaqContent>("/marketing/faq", () => faqMock as FaqContent);
}

export function getCta() {
  return apiFetch<CtaContent>("/marketing/cta", () => ctaMock as CtaContent);
}

export function getNav() {
  return apiFetch<NavContent>("/marketing/nav", () => navMock as NavContent);
}

export function getFooter() {
  return apiFetch<FooterContent>(
    "/marketing/footer",
    () => footerMock as FooterContent
  );
}
