import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { IconBadge } from "@/components/ui/IconBadge";
import { getIcon } from "@/lib/icon-registry";
import type { StatsContent, StatItem } from "@/lib/types/marketing";

export function Stats({ content }: { content: StatsContent }) {
  return (
    <Section bg="white" padding="compact" bordered>
      <SectionHeading
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        size="md"
      />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {content.items.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>
    </Section>
  );
}

function StatCard({ item }: { item: StatItem }) {
  return (
    <div className="rounded-2xl border border-border bg-bg/40 p-6 text-center transition hover:border-primary/40 hover:bg-primary-50/40">
      <IconBadge icon={getIcon(item.iconName)} size="lg" className="mx-auto" />
      <p className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {item.value}
      </p>
      <p className="mt-1 text-sm text-ink-muted">{item.label}</p>
    </div>
  );
}
