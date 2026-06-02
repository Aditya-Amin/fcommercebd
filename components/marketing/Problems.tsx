import { ArrowRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconCard } from "./IconCard";
import type { ProblemsContent } from "@/lib/types/marketing";

export function Problems({ content }: { content: ProblemsContent }) {
  return (
    <Section id="problems" bg="white">
      <SectionHeading
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        eyebrowTone="danger"
      />

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {content.items.map((item) => (
          <IconCard
            key={item.title}
            iconName={item.iconName}
            title={item.title}
            description={item.description}
            tone="danger"
          />
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-3xl rounded-3xl border border-primary/30 bg-gradient-to-br from-primary-50 via-white to-primary-50/40 p-8 text-center shadow-card sm:p-10">
        <h3 className="text-xl font-bold text-ink sm:text-2xl">{content.outroTitle}</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink-muted sm:text-base">
          {content.outroDescription}
        </p>
        <ArrowRight className="mx-auto mt-5 h-6 w-6 animate-pulse text-primary" />
      </div>
    </Section>
  );
}
