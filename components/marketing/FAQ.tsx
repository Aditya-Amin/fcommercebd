import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { FaqContent } from "@/lib/types/marketing";

export function FAQ({ content }: { content: FaqContent }) {
  return (
    <Section id="faq" bg="white" containerClassName="!max-w-3xl">
      <SectionHeading
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      />

      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-white shadow-card">
        {content.items.map((item) => (
          <details key={item.question} className="group p-5 open:bg-bg/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-ink">
              <span>{item.question}</span>
              <span className="text-2xl leading-none text-ink-subtle transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
