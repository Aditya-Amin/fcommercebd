import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconBadge } from "@/components/ui/IconBadge";
import { getIcon } from "@/lib/icon-registry";
import { toBanglaNumber } from "@/lib/utils";
import type { HowItWorksContent, HowItWorksStep } from "@/lib/types/marketing";

export function HowItWorks({ content }: { content: HowItWorksContent }) {
  return (
    <Section id="how-it-works" bg="white">
      <SectionHeading
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      />

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {content.steps.map((step, i) => (
          <StepCard key={step.title} step={step} index={i + 1} />
        ))}
      </div>
    </Section>
  );
}

function StepCard({ step, index }: { step: HowItWorksStep; index: number }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-card transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <IconBadge icon={getIcon(step.iconName)} variant="solid" />
        <span className="text-3xl font-bold text-primary/15">
          ০{toBanglaNumber(index)}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{step.description}</p>
    </div>
  );
}
