"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { PLANS } from "@/lib/plans";
import type { Plan, PlanId, UsageStats } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

const PLAN_STORAGE_KEY = "fcommerce.plan";
// Usage + purchase are scoped per user. Without scoping, signing out and
// signing in as a different account inherits the previous user's counters.
// v3 = added fbPostsUsed; old v2 shape is incompatible.
const USAGE_STORAGE_PREFIX = "fcommerce.usage.v3";
const PURCHASE_STORAGE_PREFIX = "fcommerce.purchase";

function usageKeyFor(uid: string): string {
  return `${USAGE_STORAGE_PREFIX}:${uid}`;
}
function purchaseKeyFor(uid: string): string {
  return `${PURCHASE_STORAGE_PREFIX}:${uid}`;
}

export interface PlanPurchase {
  planId: PlanId;
  trxId: string;
  paidAt: string;
  amount: number;
  method: "bkash";
}

interface PlanState {
  planId: PlanId;
  plan: Plan;
  usage: UsageStats;
  lastPurchase: PlanPurchase | null;
  setPlan: (id: PlanId) => void;
  activatePlan: (purchase: PlanPurchase) => void;
  canUseAI: () => boolean;
  canSendSMS: (count?: number) => boolean;
  canCreateFBPost: () => boolean;
  fbPostsRemaining: () => number;
  recordAIUse: () => void;
  recordSMSUse: (count: number) => void;
  recordFBPostUse: () => void;
  resetUsage: () => void;
}

const defaultUsage: UsageStats = { aiUsed: 0, smsUsed: 0, fbPostsUsed: 0 };

const PlanContext = createContext<PlanState | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [planId, setPlanIdState] = useState<PlanId>("starter");
  const [usage, setUsage] = useState<UsageStats>(defaultUsage);
  const [lastPurchase, setLastPurchase] = useState<PlanPurchase | null>(null);

  // Plan first-paint cache — overwritten by server-sync below as soon as
  // /api/me resolves. Kept global because it's not user-sensitive once
  // the server-sync effect runs.
  useEffect(() => {
    try {
      const p = localStorage.getItem(PLAN_STORAGE_KEY);
      if (p === "starter" || p === "growth") setPlanIdState(p);
    } catch {
      // ignore
    }
  }, []);

  // One-time cleanup of the legacy unscoped keys. Without this, accounts
  // created before the per-user scoping was added still see the old
  // shared cache on first load.
  useEffect(() => {
    try {
      localStorage.removeItem(USAGE_STORAGE_PREFIX);
      localStorage.removeItem(PURCHASE_STORAGE_PREFIX);
    } catch {
      // ignore
    }
  }, []);

  // Per-user hydrate: every time the authenticated user changes (login,
  // logout, account switch), load the *new* user's usage + purchase from
  // their own scoped key. Reset to defaults if no record exists for them.
  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setUsage(defaultUsage);
      setLastPurchase(null);
      return;
    }
    try {
      const u = localStorage.getItem(usageKeyFor(uid));
      if (u) {
        const parsed = JSON.parse(u) as Partial<UsageStats>;
        setUsage({
          aiUsed: parsed.aiUsed ?? 0,
          smsUsed: parsed.smsUsed ?? 0,
          fbPostsUsed: parsed.fbPostsUsed ?? 0
        });
      } else {
        setUsage(defaultUsage);
      }
      const pr = localStorage.getItem(purchaseKeyFor(uid));
      setLastPurchase(pr ? (JSON.parse(pr) as PlanPurchase) : null);
    } catch {
      setUsage(defaultUsage);
      setLastPurchase(null);
    }
  }, [user?.id]);

  // Server is the source of truth: whenever AuthContext refreshes the user
  // (login, /payment/success, /api/me), pull plan from their active subscription
  // and overwrite both state and the localStorage cache. Prevents the dashboard
  // from showing a stale plan after a Starter signup or a plan change.
  useEffect(() => {
    const serverPlanId = user?.subscription?.planId;
    if (serverPlanId === "starter" || serverPlanId === "growth") {
      setPlanIdState(serverPlanId);
      try {
        localStorage.setItem(PLAN_STORAGE_KEY, serverPlanId);
      } catch {
        // ignore
      }
    }
  }, [user?.subscription?.planId]);

  const persistUsage = useCallback(
    (next: UsageStats) => {
      setUsage(next);
      const uid = user?.id;
      if (uid) {
        try {
          localStorage.setItem(usageKeyFor(uid), JSON.stringify(next));
        } catch {
          // ignore — quota / disabled localStorage
        }
      }
    },
    [user?.id]
  );

  const setPlan = useCallback((id: PlanId) => {
    setPlanIdState(id);
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const activatePlan = useCallback(
    (purchase: PlanPurchase) => {
      setPlanIdState(purchase.planId);
      setLastPurchase(purchase);
      const uid = user?.id;
      try {
        localStorage.setItem(PLAN_STORAGE_KEY, purchase.planId);
        if (uid) {
          localStorage.setItem(purchaseKeyFor(uid), JSON.stringify(purchase));
        }
      } catch {
        // ignore
      }
    },
    [user?.id]
  );

  const plan = PLANS[planId];

  const canUseAI = useCallback(
    () => plan.limits.aiGenerations > 0 && usage.aiUsed < plan.limits.aiGenerations,
    [plan, usage.aiUsed]
  );

  const canSendSMS = useCallback(
    (count = 1) => usage.smsUsed + count <= plan.limits.sms,
    [plan.limits.sms, usage.smsUsed]
  );

  const canCreateFBPost = useCallback(
    () => plan.limits.fbPosts > 0 && usage.fbPostsUsed < plan.limits.fbPosts,
    [plan.limits.fbPosts, usage.fbPostsUsed]
  );

  const fbPostsRemaining = useCallback(
    () => Math.max(0, plan.limits.fbPosts - usage.fbPostsUsed),
    [plan.limits.fbPosts, usage.fbPostsUsed]
  );

  const recordAIUse = useCallback(() => {
    persistUsage({ ...usage, aiUsed: usage.aiUsed + 1 });
  }, [usage, persistUsage]);

  const recordSMSUse = useCallback(
    (count: number) => {
      persistUsage({ ...usage, smsUsed: usage.smsUsed + count });
    },
    [usage, persistUsage]
  );

  const recordFBPostUse = useCallback(() => {
    persistUsage({ ...usage, fbPostsUsed: usage.fbPostsUsed + 1 });
  }, [usage, persistUsage]);

  const resetUsage = useCallback(() => {
    persistUsage({ aiUsed: 0, smsUsed: 0, fbPostsUsed: 0 });
  }, [persistUsage]);

  const value = useMemo<PlanState>(
    () => ({
      planId,
      plan,
      usage,
      lastPurchase,
      setPlan,
      activatePlan,
      canUseAI,
      canSendSMS,
      canCreateFBPost,
      fbPostsRemaining,
      recordAIUse,
      recordSMSUse,
      recordFBPostUse,
      resetUsage
    }),
    [
      planId,
      plan,
      usage,
      lastPurchase,
      setPlan,
      activatePlan,
      canUseAI,
      canSendSMS,
      canCreateFBPost,
      fbPostsRemaining,
      recordAIUse,
      recordSMSUse,
      recordFBPostUse,
      resetUsage
    ]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanState {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
