"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getPlans } from "@/lib/api/bkash";
import { marketingPlanFromPayload, FALLBACK_MARKETING_PLANS, type MarketingPlan } from "@/lib/plans";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getPlanIdBySlug } from "@/lib/api/bkash";
import { startSslCommerzCheckout } from "@/lib/api/sslcommerz";
import { cn } from "@/lib/utils";
import type { PricingSectionContent } from "@/lib/types/marketing";
import type { BkashCopy } from "@/lib/types/payment-copy";

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
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<MarketingPlan[] | null>(null);

  // Plans are managed in the admin panel and served from /api/plans. Fall back
  // to the bundled list if the request fails so the page is never blank.
  useEffect(() => {
    let active = true;
    getPlans()
      .then((data) => {
        if (active) setPlans(data.map(marketingPlanFromPayload));
      })
      .catch(() => {
        if (active) setPlans(FALLBACK_MARKETING_PLANS);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSelect(planSlug: string) {
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

  const gridCols = (plans?.length ?? 2) >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  if (!plans) {
    return (
      <div className={cn("grid gap-6 md:grid-cols-2", compact && "max-w-4xl mx-auto")}>
        {[0, 1].map((i) => (
          <div key={i} className="h-96 animate-pulse rounded-2xl border border-border bg-slate-50" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6 md:grid-cols-2", gridCols, compact && "max-w-5xl mx-auto")}>
      {plans.map((p) => {
        const isPending = pendingPlan === p.slug;
        return (
          <div
            key={p.slug}
            className={cn(
              "relative rounded-2xl border bg-white p-7 transition",
              p.popular
                ? "border-primary shadow-pop ring-1 ring-primary/30"
                : "border-border shadow-card"
            )}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                <Sparkles className="mr-1 inline h-3 w-3" /> {labels.popularLabel}
              </span>
            )}

            <div className="flex items-baseline gap-2">
              <h3 className="text-xl font-bold text-ink">{p.name}</h3>
              {p.hasAi && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {labels.aiBadgeLabel}
                </span>
              )}
            </div>
            {p.tagline && <p className="mt-1 text-sm text-ink-muted">{p.tagline}</p>}

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
              variant={p.popular ? "primary" : "outline"}
              className="mt-6"
              disabled={isPending}
              onClick={() => handleSelect(p.slug)}
              leftIcon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
            >
              {isPending
                ? "পেমেন্ট পেজে যাচ্ছে…"
                : p.popular
                  ? labels.growthCtaLabel
                  : labels.starterCtaLabel}
            </Button>

            <ul className="mt-7 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-ink">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
