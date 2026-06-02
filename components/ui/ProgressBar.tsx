import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "danger";
}

const TONES = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger"
};

export function ProgressBar({
  value,
  max,
  label,
  hint,
  tone = "primary"
}: ProgressBarProps) {
  const safeMax = Math.max(max, 1);
  const pct = Math.min(100, Math.round((value / safeMax) * 100));

  let toneFinal = tone;
  if (tone === "primary" && pct >= 90) toneFinal = "danger";
  else if (tone === "primary" && pct >= 70) toneFinal = "warning";

  return (
    <div className="w-full">
      {(label || hint) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && <span className="font-medium text-ink">{label}</span>}
          {hint && <span className="text-ink-muted">{hint}</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
        <div
          className={cn("h-full rounded-full transition-all duration-500", TONES[toneFinal])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
