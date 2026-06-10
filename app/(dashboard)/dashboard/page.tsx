"use client";

import Link from "next/link";
import {
  ShoppingCart,
  DollarSign,
  Sparkles,
  MessageSquare,
  Plus,
  Send,
  Wand2,
  Truck
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { usePlan } from "@/context/PlanContext";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { useOrders } from "@/lib/hooks/useOrders";
import { formatBDT, timeAgo } from "@/lib/utils";
import type { NotificationType } from "@/lib/types/notification";

const ACTIVITY_ICONS: Record<string, { bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  order: { bg: "bg-primary/10 text-primary", icon: ShoppingCart },
  ai: { bg: "bg-warning/10 text-warning", icon: Sparkles },
  sms: { bg: "bg-success/10 text-success", icon: MessageSquare },
  product: { bg: "bg-primary/10 text-primary", icon: Plus },
  system: { bg: "bg-ink-subtle/10 text-ink-muted", icon: Truck }
};

// Maps NotificationType (server-side enum) to one of the ACTIVITY_ICONS
// buckets. Keep this aligned with backend `app/Models/Notification.php`
// constants — when a new notification type is added there, extend the
// switch below.
function activityCategoryFor(type: NotificationType): keyof typeof ACTIVITY_ICONS {
  switch (type) {
    case "order_new":
    case "order_status":
      return "order";
    case "fb_post_published":
    case "fb_post_failed":
      return "ai";
    case "low_stock":
      return "product";
    case "sms_low":
      return "sms";
    default:
      return "system";
  }
}

const STATUS_TONES = {
  pending: "warning",
  confirmed: "primary",
  shipped: "primary",
  delivered: "success",
  cancelled: "danger"
} as const;

export default function DashboardHomePage() {
  const { plan, usage } = usePlan();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { items: notifications } = useNotifications();
  const recentOrders = orders.slice(0, 4);
  const recentActivity = notifications.slice(0, 5);

  // Stat-card aggregates derived from the user's real orders (not mock).
  // "This month" is calendar-month based; revenue counts delivered orders
  // only so cancelled / pending entries don't inflate the number.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const ordersThisMonth = orders.filter(
    (o) => new Date(o.createdAt).getTime() >= monthStart
  );
  const monthlyRevenue = ordersThisMonth
    .filter((o) => o.status !== "pending" && o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-ink-muted">
            Here’s what’s happening with your business today.
          </p>
        </div>
        <Link href="/products">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add product</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Orders this month"
          value={String(ordersThisMonth.length)}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatCard
          label="Revenue this month"
          value={formatBDT(monthlyRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-success/10 text-success"
        />
        <StatCard
          label="AI generations"
          value={`${usage.aiUsed}/${plan.limits.aiGenerations || "—"}`}
          icon={<Sparkles className="h-5 w-5" />}
          iconBg="bg-warning/10 text-warning"
        />
        <StatCard
          label="SMS sent"
          value={`${usage.smsUsed}/${plan.limits.sms}`}
          icon={<MessageSquare className="h-5 w-5" />}
          iconBg="bg-primary/10 text-primary"
        />
      </div>

      {/* Usage + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Monthly usage"
            description={`${plan.name} plan — resets in 12 days`}
            action={
              plan.id === "starter" ? (
                <Link href="/pricing">
                  <Button size="sm" variant="outline">Upgrade</Button>
                </Link>
              ) : null
            }
          />
          <div className="space-y-5 p-5">
            <ProgressBar
              value={usage.aiUsed}
              max={Math.max(plan.limits.aiGenerations, 1)}
              label="AI Generations"
              hint={
                plan.limits.aiGenerations
                  ? `${usage.aiUsed} of ${plan.limits.aiGenerations} used`
                  : "Not available on Starter"
              }
            />
            <ProgressBar
              value={usage.smsUsed}
              max={plan.limits.sms}
              label="SMS Messages"
              hint={`${usage.smsUsed} of ${plan.limits.sms} used`}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Quick actions" />
          <div className="grid grid-cols-2 gap-3 p-5">
            <QuickAction href="/ai-generate" icon={Wand2} label="AI Generate" tone="bg-warning/10 text-warning" />
            <QuickAction href="/products" icon={Plus} label="Add Product" tone="bg-primary/10 text-primary" />
            <QuickAction href="/campaigns" icon={Send} label="Send SMS" tone="bg-success/10 text-success" />
            <QuickAction href="/orders" icon={ShoppingCart} label="View Orders" tone="bg-ink-subtle/10 text-ink" />
          </div>
        </Card>
      </div>

      {plan.id === "starter" && <UpgradePrompt />}

      {/* Recent orders + activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent orders"
            action={
              <Link href="/orders">
                <Button size="sm" variant="ghost">View all</Button>
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-ink-muted">No orders yet.</p>
                <p className="mt-1 text-xs text-ink-subtle">
                  New orders will show up here once you create one from the Orders page.
                </p>
              </div>
            ) : (
              recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{o.id}</p>
                      <Badge tone={STATUS_TONES[o.status]} className="capitalize">
                        {o.status}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-ink-muted">{o.customer} · {o.product}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">{formatBDT(o.amount)}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recent activity"
            action={
              <Link href="/notifications">
                <Button size="sm" variant="ghost">View all</Button>
              </Link>
            }
          />
          <ul className="space-y-1 p-3">
            {recentActivity.length === 0 ? (
              <li className="px-2 py-6 text-center">
                <p className="text-sm text-ink-muted">No activity yet.</p>
                <p className="mt-1 text-xs text-ink-subtle">
                  Add a product or generate an AI post to get started.
                </p>
              </li>
            ) : (
              recentActivity.map((n) => {
                const cfg = ACTIVITY_ICONS[activityCategoryFor(n.type)];
                const Icon = cfg.icon;
                const target = n.actionUrl ?? "/notifications";
                return (
                  <li key={n.id}>
                    <Link
                      href={target}
                      className={`flex items-start gap-3 rounded-lg p-2 transition hover:bg-bg ${
                        n.readAt ? "" : "bg-primary/5"
                      }`}
                    >
                      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cfg.bg}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm leading-snug text-ink">{n.title}</p>
                        <p className="text-xs text-ink-muted">{timeAgo(n.createdAt)}</p>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  tone
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-2 rounded-xl border border-border p-3 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
    >
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="text-sm font-medium text-ink">{label}</span>
    </Link>
  );
}
