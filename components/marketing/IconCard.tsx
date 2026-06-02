import { IconBadge } from "@/components/ui/IconBadge";
import { getIcon } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";

type Tone = "primary" | "danger";

const HOVER_BORDER: Record<Tone, string> = {
  primary: "hover:border-primary/30 hover:shadow-pop",
  danger: "hover:border-danger/30 hover:shadow-card"
};

interface Props {
  iconName: string;
  title: string;
  description: string;
  tone?: Tone;
  iconVariant?: "soft" | "solid";
}

export function IconCard({
  iconName,
  title,
  description,
  tone = "primary",
  iconVariant = "soft"
}: Props) {
  const Icon = getIcon(iconName);
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-0.5",
        HOVER_BORDER[tone]
      )}
    >
      <IconBadge icon={Icon} tone={tone} variant={iconVariant} />
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>
    </div>
  );
}
