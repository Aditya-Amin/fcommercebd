import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "danger" | "success" | "warning";
type Variant = "soft" | "solid";
type Size = "sm" | "md" | "lg";

const TONE_SOFT: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  danger: "bg-danger/10 text-danger",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning"
};

const TONE_SOLID: Record<Tone, string> = {
  primary: "bg-primary text-white",
  danger: "bg-danger text-white",
  success: "bg-success text-white",
  warning: "bg-warning text-white"
};

const SIZES: Record<Size, { box: string; icon: string }> = {
  sm: { box: "h-9 w-9 rounded-lg", icon: "h-4 w-4" },
  md: { box: "h-11 w-11 rounded-xl", icon: "h-5 w-5" },
  lg: { box: "h-12 w-12 rounded-2xl", icon: "h-6 w-6" }
};

interface Props {
  icon: LucideIcon;
  tone?: Tone;
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function IconBadge({
  icon: Icon,
  tone = "primary",
  variant = "soft",
  size = "md",
  className
}: Props) {
  const sz = SIZES[size];
  const toneClasses = variant === "solid" ? TONE_SOLID[tone] : TONE_SOFT[tone];
  return (
    <span
      className={cn("grid place-items-center", sz.box, toneClasses, className)}
    >
      <Icon className={sz.icon} />
    </span>
  );
}
