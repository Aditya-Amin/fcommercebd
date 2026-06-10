"use client";

/**
 * Dev-only package activation test page.
 *
 * Visible at http://localhost:3000/test/activate-package
 *
 * Lets a developer instantly switch the currently-logged-in user to any plan
 * without going through bKash. Uses the POST /api/dev/activate-package endpoint
 * which the backend already guards with APP_ENV=local.
 *
 * This page is intentionally NOT added to the sidebar NAV — it's a dev tool,
 * not a user-facing feature.
 */

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, Package, RefreshCw } from "lucide-react";
import { getDevPlans, activateDevPackage, getSmsStats } from "@/lib/api/sms";
import type { DevPlan, SmsStats } from "@/lib/types/sms";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ToastState = { ok: boolean; text: string } | null;

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
        toast.ok
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {toast.ok ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
      )}
      <span>{toast.text}</span>
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onActivate,
  loading,
}: {
  plan: DevPlan;
  onActivate: (id: number) => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-gray-900">{plan.name}</p>
          <p className="text-sm text-gray-500">
            {plan.currency} {plan.price.toLocaleString()} / month
          </p>
        </div>
        <div className="rounded-xl bg-indigo-50 px-3 py-1.5 text-center">
          <p className="text-xl font-bold text-indigo-700">{plan.sms_limit}</p>
          <p className="text-xs text-indigo-500">SMS</p>
        </div>
      </div>

      <ul className="space-y-1.5 text-sm text-gray-600">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onActivate(plan.id)}
        disabled={loading}
        className="mt-auto flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Activating…
          </>
        ) : (
          <>
            <Package className="h-4 w-4" />
            Activate {plan.name}
          </>
        )}
      </button>
    </div>
  );
}

// ─── Current quota snapshot ───────────────────────────────────────────────────

function QuotaSnapshot({ stats }: { stats: SmsStats | null }) {
  if (!stats) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm">
      <p className="mb-3 font-semibold text-gray-700">Current Quota Snapshot</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-gray-600">
        <span className="text-gray-400">Plan</span>
        <span className="font-medium text-gray-900">{stats.package_name ?? "—"}</span>
        <span className="text-gray-400">Total SMS</span>
        <span className="font-medium text-gray-900">{stats.total_sms}</span>
        <span className="text-gray-400">Used</span>
        <span className="font-medium text-gray-900">{stats.used_sms}</span>
        <span className="text-gray-400">Remaining</span>
        <span className="font-medium text-gray-900">{stats.remaining_sms}</span>
        {stats.reset_at && (
          <>
            <span className="text-gray-400">Resets</span>
            <span className="font-medium text-gray-900">{stats.reset_at}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivatePackagePage() {
  const [plans,       setPlans]       = useState<DevPlan[]>([]);
  const [stats,       setStats]       = useState<SmsStats | null>(null);
  const [loadingId,   setLoadingId]   = useState<number | null>(null);
  const [toast,       setToast]       = useState<ToastState>(null);
  const [fetchError,  setFetchError]  = useState<string | null>(null);
  const [refreshing,  setRefreshing]  = useState(false);

  const loadData = async (showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      const [p, s] = await Promise.all([
        getDevPlans().catch(() => [] as DevPlan[]),
        getSmsStats().catch(() => null),
      ]);
      setPlans(p);
      setStats(s);
      setFetchError(null);
    } catch (e) {
      setFetchError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleActivate = async (planId: number) => {
    setLoadingId(planId);
    setToast(null);
    try {
      const res = await activateDevPackage(planId);
      setToast({
        ok:   true,
        text: `✓ ${res.plan} activated — ${res.sms_total} SMS quota, expires ${res.expires_at}`,
      });
      // Refresh the snapshot so numbers update immediately
      const s = await getSmsStats().catch(() => null);
      setStats(s);
    } catch (e) {
      setToast({ ok: false, text: (e as Error).message });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-xs font-semibold text-amber-700">
              DEV ONLY
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Activate Package</h1>
            <p className="text-sm text-gray-500">
              Instantly switch plans without going through bKash.
              <br />
              Backend endpoint only works when <code className="rounded bg-gray-200 px-1 text-xs">APP_ENV=local</code>.
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex h-9 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Toast */}
        <Toast toast={toast} />

        {/* Fetch error */}
        {fetchError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {fetchError}
          </div>
        )}

        {/* Quota snapshot */}
        <QuotaSnapshot stats={stats} />

        {/* Plan cards */}
        {plans.length === 0 && !fetchError ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 p-12 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading plans…
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onActivate={handleActivate}
                loading={loadingId === plan.id}
              />
            ))}
          </div>
        )}

        {/* Footer links */}
        <p className="text-center text-xs text-gray-400">
          After activating, visit{" "}
          <a href="/usage" className="underline hover:text-gray-700">
            /usage
          </a>{" "}
          to confirm the quota updated, or go to{" "}
          <a href="/dashboard" className="underline hover:text-gray-700">
            /dashboard
          </a>
          .
        </p>
      </div>
    </div>
  );
}
