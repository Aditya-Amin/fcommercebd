"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLAN_LIST } from "@/lib/plans";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getPlanIdBySlug } from "@/lib/api/bkash";
import { startSslCommerzCheckout } from "@/lib/api/sslcommerz";
import { cn } from "@/lib/utils";
import type { PricingSectionContent } from "@/lib/types/marketing";
import type { BkashCopy } from "@/lib/types/payment-copy";
import type { PlanId } from "@/lib/types";

interface Props {
  compact?: boolean;
  labels: PricingSectionContent;
  // bkashCopy is kept on the prop signature for backwards compatibility
  // with the offline modal flow, but the live flow doesn't use it.
  bkashCopy?: BkashCopy;
}

export function PricingCards({ compact = false, labels }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);

  async function handleSelect(planSlug: PlanId) {
    if (!isAuthenticated) {
      router.push(`/register?plan=${planSlug}`);
      return;
    }
    setPendingPlan(planSlug);
    try {
      const planId = await getPlanIdBySlug(planSlug);
      await startSslCommerzCheckout(planId);
      // The browser navigates away to SSLCommerz gateway — no further code runs here.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "পেমেন্ট শুরু করা যায়নি";
      toast(msg, "error");
      setPendingPlan(null);
    }
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-2", compact && "max-w-4xl mx-auto")}>
      {PLAN_LIST.map((p) => {
        const isPending = pendingPlan === p.id;
        return (
          <div
            key={p.id}
            className={cn(
              "relative rounded-2xl border bg-white p-7 transition",
              p.highlight
                ? "border-primary shadow-pop ring-1 ring-primary/30"
                : "border-border shadow-card"
            )}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                <Sparkles className="mr-1 inline h-3 w-3" /> {labels.popularLabel}
              </span>
            )}

            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-ink">{p.name}</h3>
              {p.id === "growth" && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {labels.aiBadgeLabel}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-muted">{p.tagline}</p>

            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-ink">
                {p.currency}
                {p.price}
              </span>
              <span className="text-sm text-ink-muted">{labels.monthlyLabel}</span>
            </div>

            <Button
              fullWidth
              size="lg"
              variant={p.highlight ? "primary" : "outline"}
              className="mt-6"
              disabled={isPending}
              onClick={() => handleSelect(p.id)}
              leftIcon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {isPending
                ? "পেমেন্ট পেজে যাচ্ছে…"
                : p.highlight
                  ? labels.growthCtaLabel
                  : labels.starterCtaLabel}
            </Button>

            <ul className="mt-7 space-y-3">
              {p.features.map((f) => (
                <li key={f.label} className="flex items-start gap-2 text-sm">
                  {f.included ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" />
                  )}
                  <span className={cn(f.included ? "text-ink" : "text-ink-subtle line-through")}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
