"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Sparkles,
  MessageSquare,
  Plug,
  CreditCard,
  Settings,
  BarChart2,
  ChevronLeft,
  X,
  Headphones,
  LayoutTemplate
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { usePlan } from "@/context/PlanContext";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getAiUsage } from "@/lib/api/facebook";
import { getSmsStats } from "@/lib/api/sms";
import type { FbPostsQuota } from "@/lib/types/facebook";
import type { SmsStats } from "@/lib/types/sms";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/ai-generate", label: "AI Generate", icon: Sparkles },
  { href: "/campaigns", label: "SMS Campaigns", icon: MessageSquare },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/usage", label: "Usage Stats", icon: BarChart2 },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/plan-details", label: "Plan", icon: CreditCard },
  { href: "/support", label: "Support", icon: Headphones },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Loading placeholder for a usage meter — shown until the API resolves so we
// never paint a stale localStorage value on first load.
function UsageSkeleton({ label }: { label: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        <span className="h-3 w-8 animate-pulse rounded bg-ink/10" />
      </div>
      <div className="h-2 w-full animate-pulse rounded-full bg-ink/10" />
    </div>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile
}: SidebarProps) {
  const pathname = usePathname();
  const { plan } = usePlan();

  // Usage meters are server-truth only — never the local PlanContext cache.
  // A loading skeleton shows until the API resolves so the UI never flashes a
  // stale localStorage number on first paint. Refetched on navigation.
  const [aiUsage, setAiUsage] = useState<FbPostsQuota | null>(null);
  const [smsStats, setSmsStats] = useState<SmsStats | null>(null);

  useEffect(() => {
    const refresh = () => {
      getAiUsage()
        .then(setAiUsage)
        .catch(() => setAiUsage(null));
      getSmsStats()
        .then(setSmsStats)
        .catch(() => setSmsStats(null));
    };
    refresh();
    // Other screens (e.g. AI Generate, SMS) fire this after a successful action
    // so the meter updates immediately without a page navigation.
    window.addEventListener("usage:changed", refresh);
    return () => window.removeEventListener("usage:changed", refresh);
  }, [pathname]);

  const linkClass = (href: string) => {
    const active = pathname === href || pathname?.startsWith(href + "/");
    return cn(
      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
      active
        ? "bg-primary/10 text-primary"
        : "text-ink-muted hover:bg-bg hover:text-ink"
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={onCloseMobile}
        className={cn(
          "fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-white transition-all duration-200",
          // mobile slide
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          // desktop width
          collapsed ? "lg:w-[76px]" : "lg:w-64",
          "w-72"
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          {collapsed ? (
            <Link
              href="/dashboard"
              className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white"
              aria-label="FcommerceBD"
            >
              <span className="text-sm font-bold">F</span>
            </Link>
          ) : (
            <Logo href="/dashboard" />
          )}
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-ink-muted hover:bg-bg hover:text-ink lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden rounded-lg p-1.5 text-ink-muted hover:bg-bg hover:text-ink lg:inline-flex",
              collapsed && "absolute -right-3 top-5 border border-border bg-white shadow-sm"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onCloseMobile}
                  className={linkClass(href)}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {!collapsed && (
          <div className="border-t border-border p-4">
            <div className="rounded-xl bg-gradient-to-br from-primary-50 to-white p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                  {plan.name} plan
                </span>
              </div>
              <p className="mb-3 text-xs text-ink-muted">
                Track your AI & SMS usage this month.
              </p>
              <div className="space-y-2.5">
                {aiUsage ? (
                  <ProgressBar
                    value={aiUsage.used}
                    max={Math.max(aiUsage.limit, 1)}
                    label="AI"
                    hint={`${aiUsage.used}/${aiUsage.limit}`}
                  />
                ) : (
                  <UsageSkeleton label="AI" />
                )}
                {smsStats ? (
                  <ProgressBar
                    value={smsStats.used_sms}
                    max={Math.max(smsStats.total_sms, 1)}
                    label="SMS"
                    hint={`${smsStats.used_sms}/${smsStats.total_sms}`}
                  />
                ) : (
                  <UsageSkeleton label="SMS" />
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
