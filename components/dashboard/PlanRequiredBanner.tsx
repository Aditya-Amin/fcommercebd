"use client";

import Link from "next/link";
import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { usePlan } from "@/context/PlanContext";

interface PlanRequiredBannerProps {
  requirePaid?: boolean;
}

export function PlanRequiredBanner({ requirePaid = false }: PlanRequiredBannerProps) {
  const { planId, isTrialSubscription } = usePlan();

  const blocked = planId === "free" || (requirePaid && isTrialSubscription);

  if (!blocked) return null;

  const isPaidOnly = requirePaid && isTrialSubscription;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 p-px shadow-md">
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-sm">
            <Lock className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {isPaidOnly ? "Paid plan required" : "Active plan required"}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isPaidOnly
                ? "This feature is exclusive to paid subscribers. Upgrade to unlock."
                : "Upgrade your plan to unlock this feature and more."}
            </p>
          </div>
        </div>
        <Link
          href="/plan-details"
          className="group flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-amber-600 hover:shadow-md"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Upgrade
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
