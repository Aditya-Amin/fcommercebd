import { PricingCards } from "@/components/marketing/PricingCards";
import { FAQ } from "@/components/marketing/FAQ";
import { CTA } from "@/components/marketing/CTA";
import { getPricingSection, getFaq, getCta } from "@/lib/api/marketing";
import { getBkashCopy } from "@/lib/api/payment-copy";

export default async function PricingPage() {
  const [pricing, faq, cta, bkashCopy] = await Promise.all([
    getPricingSection(),
    getFaq(),
    getCta(),
    getBkashCopy()
  ]);

  return (
    <>
      <section className="bg-gradient-to-b from-primary-50/60 via-white to-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
              {pricing.eyebrow}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              {pricing.title}
            </h1>
            <p className="mt-4 text-lg text-ink-muted">{pricing.description}</p>
          </div>
          <div className="mt-14">
            <PricingCards labels={pricing} bkashCopy={bkashCopy} />
          </div>
        </div>
      </section>

      <FAQ content={faq} />

      <CTA content={cta} />
    </>
  );
}
