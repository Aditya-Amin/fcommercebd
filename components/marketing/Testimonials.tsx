import { Star } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { TestimonialsContent, TestimonialItem } from "@/lib/types/marketing";

export function Testimonials({ content }: { content: TestimonialsContent }) {
  return (
    <Section id="testimonials" bg="muted">
      <SectionHeading
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      />

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {content.items.map((item) => (
          <TestimonialCard key={item.name} item={item} />
        ))}
      </div>
    </Section>
  );
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  const initials = item.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-7 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex gap-1 text-amber-500">
        {Array.from({ length: item.rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>

      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-ink">
        &ldquo;{item.message}&rdquo;
      </p>

      <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
          style={{
            background: `linear-gradient(135deg, hsl(${item.avatarHue} 70% 55%), hsl(${(item.avatarHue + 30) % 360} 70% 45%))`
          }}
        >
          {initials}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{item.name}</p>
          <p className="text-xs text-ink-muted">
            {item.role} · {item.business}
          </p>
        </div>
      </div>
    </div>
  );
}
