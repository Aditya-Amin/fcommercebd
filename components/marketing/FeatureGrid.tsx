import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconCard } from "./IconCard";
import type { FeaturesContent } from "@/lib/types/marketing";

export function FeatureGrid({ content }: { content: FeaturesContent }) {
  return (
    <Section id="features" bg="muted">
      <SectionHeading
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {content.items.map((item) => (
          <IconCard
            key={item.title}
            iconName={item.iconName}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </Section>
  );
}
