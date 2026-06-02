import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
  size = "md"
}: {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const text = size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";
  const box = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-8 w-8";

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 font-semibold text-ink", className)}
    >
      <span
        className={cn(
          "grid place-items-center rounded-lg bg-primary text-white shadow-sm",
          box
        )}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h10a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H8" />
          <path d="M4 12h8" />
          <path d="M4 20h12" />
        </svg>
      </span>
      <span className={cn("tracking-tight", text)}>FcommerceBD</span>
    </Link>
  );
}
