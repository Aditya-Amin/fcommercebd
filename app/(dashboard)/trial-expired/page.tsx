"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, LogOut, Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getPlanIdBySlug } from "@/lib/api/bkash";
import { startSslCommerzCheckout } from "@/lib/api/sslcommerz";
import { PLAN_LIST } from "@/lib/plans";
import type { PlanId } from "@/lib/types";

export default function TrialExpiredPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [loadingPlanId, setLoadingPlanId] = useState<PlanId | null>(null);

  async function handlePickPlan(planId: PlanId) {
    if (loadingPlanId) return;
    setLoadingPlanId(planId);
    try {
      const dbId = await getPlanIdBySlug(planId);
      await startSslCommerzCheckout(dbId);
    } catch (e) {
      toast(e instanceof Error ? e.message : "পেমেন্ট শুরু করা যায়নি।", "error");
      setLoadingPlanId(null);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const trialEndDate = user?.createdAt
    ? new Date(new Date(user.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    : null;

  const paidPlans = PLAN_LIST.filter((p) => p.id !== "free");

  return (
    <div>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-ink">আপনার ফ্রি ট্রায়াল শেষ হয়েছে</h1>
            <p className="mt-1 text-sm text-ink-muted">
              আপনার ১ মাসের বিনামূল্যে ট্রায়াল
              {trialEndDate ? ` ${trialEndDate} তারিখে` : ""} শেষ হয়েছে।
              SMS ও AI পোস্ট সার্ভিস চালিয়ে যেতে একটি প্ল্যান কিনুন।
            </p>
          </div>
        </div>

        <Card>
          <CardHeader
            title="আপনার ট্রায়ালে যা পেয়েছিলেন"
            description="ট্রায়াল চলাকালীন প্রদত্ত সীমা।"
          />
          <div className="flex flex-wrap gap-3 p-5">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
              <span className="text-sm font-medium text-ink">১০টি SMS</span>
              <Badge tone="success">ব্যবহৃত</Badge>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
              <span className="text-sm font-medium text-ink">৩টি AI পোস্ট</span>
              <Badge tone="success">ব্যবহৃত</Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="একটি প্ল্যান বেছে নিন"
            description="আরও বেশি সার্ভিস পেতে আজই আপগ্রেড করুন।"
          />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {paidPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-4 ${
                  plan.highlight ? "border-primary bg-primary/5" : "border-border bg-surface"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                    সবচেয়ে জনপ্রিয়
                  </span>
                )}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-ink">{plan.name}</p>
                    <p className="text-xs text-ink-muted">{plan.tagline}</p>
                  </div>
                  <p className="shrink-0 text-lg font-bold text-primary">
                    {plan.currency}{plan.price}
                    <span className="text-xs font-normal text-ink-muted">/মাস</span>
                  </p>
                </div>
                <ul className="mb-4 space-y-1">
                  {plan.features.filter((f) => f.included).map((f) => (
                    <li key={f.label} className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Sparkles className="h-3 w-3 shrink-0 text-primary" />
                      {f.label}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant={plan.highlight ? "primary" : "outline"}
                  className="w-full"
                  loading={loadingPlanId === plan.id}
                  onClick={() => handlePickPlan(plan.id as PlanId)}
                >
                  {loadingPlanId === plan.id ? "পেমেন্ট পেজে যাচ্ছে…" : `${plan.name} কিনুন`}
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border bg-bg/50 px-5 py-3">
            <Link href="/pricing">
              <Button size="sm" variant="ghost">সব প্ল্যান দেখুন →</Button>
            </Link>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
          <p className="text-sm text-ink-muted">পরে আসতে চান?</p>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={handleLogout}
          >
            সাইন আউট
          </Button>
        </div>
      </div>
    </div>
  );
}
