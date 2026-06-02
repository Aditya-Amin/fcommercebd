"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}

export function UpgradePrompt({
  title = "Unlock AI-powered selling",
  description = "Upgrade to Growth to generate posts, images, and reach more customers.",
  className,
  compact
}: UpgradePromptProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3",
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary-700">{title}</p>
        </div>
        <Link href="/pricing">
          <Button size="sm">Upgrade</Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-white p-6",
        className
      )}
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
          </div>
        </div>
        <Link href="/pricing">
          <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Upgrade to Growth</Button>
        </Link>
      </div>
    </div>
  );
}
