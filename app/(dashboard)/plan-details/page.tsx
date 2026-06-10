"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, Check, RefreshCcw, ArrowUpRight, Phone } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { usePlan } from "@/context/PlanContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { PLAN_LIST } from "@/lib/plans";
import { formatBDT, cn } from "@/lib/utils";
import { startBkashCheckout, getPlanIdBySlug } from "@/lib/api/bkash";
import type { PlanId } from "@/lib/types";

const BD_PHONE_RE = /^01[3-9]\d{8}$/;

export default function PlanDetailsPage() {
  const { plan, planId, usage, resetUsage } = usePlan();
  const { user } = useAuth();
  const { toast } = useToast();
  const [redirectingTo, setRedirectingTo] = useState<PlanId | null>(null);
  const [pendingTarget, setPendingTarget] = useState<PlanId | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  async function handleSwitchPlan(target: PlanId) {
    if (target === planId || redirectingTo) return;

    if (!user?.phone) {
      setPendingTarget(target);
      return;
    }

    await doCheckout(target, user.phone);
  }

  async function doCheckout(target: PlanId, resolvedPhone: string) {
    setRedirectingTo(target);
    try {
      const dbId = await getPlanIdBySlug(target);
      await startBkashCheckout(dbId, resolvedPhone);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not start bKash checkout.";
      toast(msg, "error");
      setRedirectingTo(null);
    }
  }

  async function handlePhoneSubmit(e: FormEvent) {
    e.preventDefault();
    if (!BD_PHONE_RE.test(phone)) {
      setPhoneError("সঠিক বাংলাদেশি নম্বর দিন (যেমন: 01712345678)");
      return;
    }
    if (!pendingTarget) return;
    setPendingTarget(null);
    setPhone("");
    setPhoneError(null);
    await doCheckout(pendingTarget, phone);
  }

  return (
    <div>
    <Modal
      open={!!pendingTarget}
      onClose={() => { setPendingTarget(null); setPhone(""); setPhoneError(null); }}
      title="bKash নম্বর দিন"
      description="পেমেন্টের জন্য আপনার bKash-সংযুক্ত মোবাইল নম্বর দিন।"
      size="sm"
    >
      <form onSubmit={handlePhoneSubmit} className="space-y-4">
        <Input
          name="bkashPhone"
          label="bKash নম্বর"
          placeholder="01XXXXXXXXX"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
          leftIcon={<Phone className="h-4 w-4" />}
          inputMode="numeric"
          maxLength={11}
          autoFocus
          error={phoneError ?? undefined}
          required
        />
        <Button type="submit" fullWidth size="lg">
          পেমেন্টে যান
        </Button>
      </form>
    </Modal>
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Plan details</h1>
        <p className="text-sm text-ink-muted">Review your subscription, upgrade your plan, and track monthly usage.</p>
      </div>

      {/* Plan */}
      <Card>
        <CardHeader
          title="Subscription plan"
          description={`Current plan: ${plan.name} · ${formatBDT(plan.price)}/month`}
          action={
            <Link href="/pricing">
              <Button size="sm" variant="ghost">View pricing →</Button>
            </Link>
          }
        />
        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {PLAN_LIST.map((p) => {
              const isActive = p.id === planId;
              const isRedirecting = redirectingTo === p.id;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition",
                    isActive
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border"
                  )}
                >
                  {isActive && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{p.name}</p>
                    {p.highlight && (
                      <Badge tone="primary">
                        <Sparkles className="h-3 w-3" /> Popular
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-ink">
                    {formatBDT(p.price)}
                    <span className="text-xs font-normal text-ink-muted"> /mo</span>
                  </p>
                  <p className="text-xs text-ink-muted">{p.tagline}</p>

                  {!isActive && (
                    <Button
                      size="sm"
                      fullWidth
                      leftIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
                      loading={isRedirecting}
                      disabled={!!redirectingTo}
                      onClick={() => handleSwitchPlan(p.id)}
                    >
                      {isRedirecting ? "Redirecting to bKash…" : `Switch to ${p.name}`}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-ink-muted">
            Plan changes are charged through bKash. Your new {plan.currency || "৳"} balance and
            limits apply immediately after payment completes.
          </p>
        </div>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader
          title="Usage"
          description="Track your monthly limits."
          action={
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCcw className="h-3.5 w-3.5" />}
              onClick={() => {
                resetUsage();
                toast("Usage counters reset.", "info");
              }}
            >
              Reset
            </Button>
          }
        />
        <div className="space-y-5 p-5">
          <ProgressBar
            value={usage.aiUsed}
            max={Math.max(plan.limits.aiGenerations, 1)}
            label="AI generations"
            hint={
              plan.limits.aiGenerations
                ? `${usage.aiUsed} / ${plan.limits.aiGenerations} used`
                : "Not available on Starter"
            }
          />
          <ProgressBar
            value={usage.smsUsed}
            max={plan.limits.sms}
            label="SMS sent"
            hint={`${usage.smsUsed} / ${plan.limits.sms} used`}
          />
        </div>
      </Card>
    </div>
    </div>
  );
}
