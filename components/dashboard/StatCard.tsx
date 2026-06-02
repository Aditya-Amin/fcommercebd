import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: { value: string; positive: boolean };
  icon?: ReactNode;
  iconBg?: string;
}

export function StatCard({ label, value, delta, icon, iconBg = "bg-primary/10 text-primary" }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</p>
        </div>
        {icon && (
          <span className={cn("grid h-10 w-10 place-items-center rounded-xl", iconBg)}>
            {icon}
          </span>
        )}
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              delta.positive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            )}
          >
            {delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta.value}
          </span>
          <span className="text-ink-muted">vs last month</span>
        </div>
      )}
    </Card>
  );
}
