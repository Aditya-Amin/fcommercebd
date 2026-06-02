"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, LogOut, RefreshCcw } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { startBkashCheckout } from "@/lib/api/bkash";
import { formatBDT } from "@/lib/utils";

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export default function SubscriptionExpiredPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [renewing, setRenewing] = useState(false);

  const last = user?.lastSubscription ?? null;
  const expiredDays = daysSince(last?.expiresAt ?? null);

  async function handleRenew() {
    if (!last?.planDbId) {
      toast("Could not find your previous plan. Pick a plan from pricing.", "error");
      router.push("/pricing");
      return;
    }
    setRenewing(true);
    try {
      await startBkashCheckout(last.planDbId);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not start bKash checkout.", "error");
      setRenewing(false);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/5 p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-ink">Your subscription has expired</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Renew your plan to regain access to your dashboard, products, orders, AI generation, and SMS campaigns.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Last plan" description="The plan you were on before it expired." />
        <div className="space-y-4 p-5">
          {last ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-ink-muted">Plan</p>
                  <p className="text-lg font-semibold text-ink">{last.planName ?? "—"}</p>
                </div>
                <Badge tone="warning">Expired</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-ink-muted">Monthly price</p>
                  <p className="text-base font-medium text-ink">
                    {typeof last.planPrice === "number" ? `${formatBDT(last.planPrice)}/month` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Expired on</p>
                  <p className="text-base font-medium text-ink">
                    {last.expiresAt ? new Date(last.expiresAt).toLocaleDateString() : "—"}
                    {expiredDays !== null && expiredDays > 0 && (
                      <span className="ml-1 text-xs text-ink-muted">({expiredDays}d ago)</span>
                    )}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-muted">No previous plan on record. Pick one from pricing.</p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-bg/50 px-5 py-3">
          <Link href="/pricing">
            <Button size="sm" variant="ghost">View pricing →</Button>
          </Link>
          <Button
            onClick={handleRenew}
            loading={renewing}
            leftIcon={<RefreshCcw className="h-4 w-4" />}
            disabled={!last?.planDbId}
          >
            {renewing ? "Redirecting to bKash…" : "Renew with bKash"}
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-ink-muted">Want to come back later?</p>
        <Button variant="outline" size="sm" leftIcon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
