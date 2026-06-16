"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { FREE_TRIAL_DURATION_MS } from "@/lib/plans";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "fcommerce.sidebar.collapsed";
const EXPIRED_PATH = "/subscription-expired";
const TRIAL_EXPIRED_PATH = "/trial-expired";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isReady, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    // Hard cutoff: if the user previously had a subscription that's no longer
    // active, gate every dashboard route behind /subscription-expired. Free
    // users (lastSubscription is null) keep the existing locked-features flow.
    const expired = !!user?.lastSubscription && !user?.subscription;
    if (expired && pathname !== EXPIRED_PATH) {
      router.replace(EXPIRED_PATH);
      return;
    }
    // Inverse: a renewed user landing on /subscription-expired should bounce out.
    if (!expired && pathname === EXPIRED_PATH) {
      router.replace("/dashboard");
    }

    // Free trial expiry: new users with no subscription history get 30 days.
    const isFreeTrial = !user?.subscription && !user?.lastSubscription;
    const trialExpired =
      isFreeTrial &&
      !!user?.createdAt &&
      Date.now() > new Date(user.createdAt).getTime() + FREE_TRIAL_DURATION_MS;
    if (trialExpired && pathname !== TRIAL_EXPIRED_PATH) {
      router.replace(TRIAL_EXPIRED_PATH);
      return;
    }
    if (!trialExpired && pathname === TRIAL_EXPIRED_PATH) {
      router.replace("/dashboard");
    }
  }, [isReady, isAuthenticated, user, pathname, router]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(COLLAPSE_KEY);
      if (v === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (!isReady) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-bg">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[76px]" : "lg:pl-64")}>
          <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </NotificationProvider>
  );
}
