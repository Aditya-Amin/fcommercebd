import { cn } from "@/lib/utils";

type Tone = "primary" | "danger";
type Align = "center" | "left";
type Size = "md" | "lg";

const EYEBROW_TONE: Record<Tone, string> = {
  primary: "text-primary",
  danger: "text-danger"
};

const TITLE_SIZE: Record<Size, string> = {
  md: "text-2xl sm:text-3xl",
  lg: "text-3xl sm:text-4xl"
};

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: Align;
  eyebrowTone?: Tone;
  size?: Size;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  eyebrowTone = "primary",
  size = "lg",
  className
}: Props) {
  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-2xl text-center",
        align === "left" && "max-w-2xl",
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "text-sm font-semibold uppercase tracking-wide",
            EYEBROW_TONE[eyebrowTone]
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "mt-2 font-bold tracking-tight text-ink",
          TITLE_SIZE[size]
        )}
      >
        {title}
      </h2>
      {description && <p className="mt-3 text-ink-muted">{description}</p>}
    </div>
  );
}
