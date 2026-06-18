"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getSmsStats, getSmsLog } from "@/lib/api/sms";
import { getAiUsage } from "@/lib/api/facebook";
import type { SmsStats, SmsLogEntry } from "@/lib/types/sms";
import type { FbPostsQuota } from "@/lib/types/facebook";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_TONE = {
  sent:   "success",
  mock:   "neutral",
  failed: "danger",
} as const;

const STATUS_LABEL = {
  sent:   "Sent",
  mock:   "Mock",
  failed: "Failed",
} as const;

// ─── Relative time formatter ──────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── AI quota card ────────────────────────────────────────────────────────────

function AiQuotaCard({ quota }: { quota: FbPostsQuota }) {
  if (quota.locked) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="h-10 w-10 text-ink-muted" />
          <p className="text-base font-semibold text-ink">AI not available</p>
          <p className="text-sm text-ink-muted">
            AI generation is not included in your current plan.
          </p>
          <Link
            href="/pricing"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary-600"
          >
            View Plans
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Generations
          </span>
        }
        description="Monthly AI post generation quota"
      />
      <CardBody className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-ink">
              {quota.remaining.toLocaleString()}
            </p>
            <p className="text-sm text-ink-muted">
              remaining of {quota.limit.toLocaleString()} generations
            </p>
          </div>
          <p className="text-right text-sm text-ink-muted">
            {quota.limit > 0 ? Math.round((quota.used / quota.limit) * 100) : 0}% used
          </p>
        </div>

        <ProgressBar value={quota.used} max={Math.max(quota.limit, 1)} />

        <div className="grid grid-cols-3 gap-4 rounded-xl bg-bg p-4 text-center text-sm">
          <div>
            <p className="font-semibold text-ink">{quota.limit.toLocaleString()}</p>
            <p className="text-xs text-ink-muted">Total</p>
          </div>
          <div>
            <p className="font-semibold text-ink">{quota.used.toLocaleString()}</p>
            <p className="text-xs text-ink-muted">Used</p>
          </div>
          <div>
            <p className="font-semibold text-ink">{quota.remaining.toLocaleString()}</p>
            <p className="text-xs text-ink-muted">Remaining</p>
          </div>
        </div>

        {quota.resetsAt && (
          <p className="text-xs text-ink-muted">
            Resets on{" "}
            <span className="font-medium text-ink">
              {new Date(quota.resetsAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        )}
      </CardBody>
    </Card>
  );
}

// ─── SMS quota card ───────────────────────────────────────────────────────────

function QuotaCard({ stats }: { stats: SmsStats }) {
  if (!stats.has_active_plan) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="h-10 w-10 text-ink-muted" />
          <p className="text-base font-semibold text-ink">No active plan</p>
          <p className="text-sm text-ink-muted">
            Purchase a plan to start sending SMS messages.
          </p>
          <Link
            href="/pricing"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary-600"
          >
            View Plans
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            SMS Usage
          </span>
        }
        description={`${stats.package_name ?? "Active"} plan`}
      />
      <CardBody className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-ink">
              {stats.remaining_sms.toLocaleString()}
            </p>
            <p className="text-sm text-ink-muted">
              remaining of {stats.total_sms.toLocaleString()} SMS
            </p>
          </div>
          <p className="text-right text-sm text-ink-muted">
            {stats.usage_percentage}% used
          </p>
        </div>

        <ProgressBar
          value={stats.used_sms}
          max={stats.total_sms}
        />

        <div className="grid grid-cols-3 gap-4 rounded-xl bg-bg p-4 text-center text-sm">
          <div>
            <p className="font-semibold text-ink">{stats.total_sms.toLocaleString()}</p>
            <p className="text-xs text-ink-muted">Total</p>
          </div>
          <div>
            <p className="font-semibold text-ink">{stats.used_sms.toLocaleString()}</p>
            <p className="text-xs text-ink-muted">Used</p>
          </div>
          <div>
            <p className="font-semibold text-ink">{stats.remaining_sms.toLocaleString()}</p>
            <p className="text-xs text-ink-muted">Remaining</p>
          </div>
        </div>

        {stats.reset_at && (
          <p className="text-xs text-ink-muted">
            Resets on{" "}
            <span className="font-medium text-ink">
              {new Date(stats.reset_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Log table ────────────────────────────────────────────────────────────────

function LogTable({ logs, loading }: { logs: SmsLogEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-bg" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <CardBody className="py-10 text-center text-sm text-ink-muted">
        No SMS sent yet.
      </CardBody>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
            <th className="px-5 py-3">Number</th>
            <th className="px-5 py-3">Message</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Sent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-bg/50">
              <td className="px-5 py-3 font-mono text-xs text-ink">
                {log.recipient_number}
              </td>
              <td className="max-w-xs px-5 py-3 text-ink-muted">
                <span className="block truncate" title={log.message_preview}>
                  {log.message_preview}
                </span>
              </td>
              <td className="px-5 py-3">
                <Badge tone={STATUS_TONE[log.status]}>
                  {STATUS_LABEL[log.status]}
                </Badge>
              </td>
              <td className="px-5 py-3 text-right text-xs text-ink-muted">
                {relativeTime(log.sent_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const QuotaSkeleton = () => (
  <Card>
    <CardBody className="py-10">
      <div className="space-y-3">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-bg" />
        <div className="h-3 w-full animate-pulse rounded-full bg-bg" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-bg" />
      </div>
    </CardBody>
  </Card>
);

export default function UsagePage() {
  const [stats,        setStats]        = useState<SmsStats | null>(null);
  const [aiQuota,      setAiQuota]      = useState<FbPostsQuota | null>(null);
  const [logs,         setLogs]         = useState<SmsLogEntry[]>([]);
  const [statsError,   setStatsError]   = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingAi,    setLoadingAi]    = useState(true);
  const [loadingLogs,  setLoadingLogs]  = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  const fetchAll = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else {
      setLoadingStats(true);
      setLoadingAi(true);
      setLoadingLogs(true);
    }

    try {
      const [s, ai, l] = await Promise.all([
        getSmsStats().catch((e: Error) => { setStatsError(e.message); return null; }),
        getAiUsage().catch(() => null),
        getSmsLog(20).catch(() => [] as SmsLogEntry[]),
      ]);
      if (s)  { setStats(s);   setStatsError(null); }
      if (ai) { setAiQuota(ai); }
      setLogs(l ?? []);
    } finally {
      setLoadingStats(false);
      setLoadingAi(false);
      setLoadingLogs(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Usage Statistics</h1>
          <p className="text-sm text-ink-muted">AI &amp; SMS quota and recent activity</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchAll(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* AI quota card */}
      {loadingAi ? <QuotaSkeleton /> : aiQuota ? <AiQuotaCard quota={aiQuota} /> : null}

      {/* SMS quota card */}
      {loadingStats ? (
        <QuotaSkeleton />
      ) : statsError ? (
        <Card>
          <CardBody className="flex items-center gap-3 py-6 text-sm text-danger">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {statsError}
          </CardBody>
        </Card>
      ) : stats ? (
        <QuotaCard stats={stats} />
      ) : null}

      {/* Recent SMS log */}
      <Card>
        <CardHeader
          title="Recent SMS"
          description="Last 20 messages sent from your account"
        />
        <LogTable logs={logs} loading={loadingLogs} />
      </Card>
    </div>
  );
}
