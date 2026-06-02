import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Bg = "white" | "muted" | "none";
type Padding = "default" | "compact";

const BG: Record<Bg, string> = {
  white: "bg-white",
  muted: "bg-bg",
  none: ""
};

const PADDING: Record<Padding, string> = {
  default: "py-20 lg:py-28",
  compact: "py-14 lg:py-16"
};

interface Props {
  id?: string;
  bg?: Bg;
  padding?: Padding;
  bordered?: boolean;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}

export function Section({
  id,
  bg = "white",
  padding = "default",
  bordered = false,
  className,
  containerClassName,
  children
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        BG[bg],
        PADDING[padding],
        bordered && "border-y border-border",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
