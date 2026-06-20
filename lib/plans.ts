import type { Plan, PlanId } from "./types";
import type { PlanPayload } from "./api/bkash";

export const FREE_TRIAL_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free Trial",
    price: 0,
    currency: "৳",
    tagline: "নতুন ব্যবহারকারীদের জন্য ১ মাসের বিনামূল্যে ট্রায়াল।",
    features: [
      { label: "মাসে ১০টি প্রমোশনাল SMS", included: true },
      { label: "মাসে ৩টি AI পোস্ট জেনারেশন", included: true },
      { label: "ফেসবুক পোস্ট করার সুবিধা", included: false },
      { label: "Steadfast ও Pathao কুরিয়ার", included: false },
      { label: "প্রায়োরিটি সাপোর্ট", included: false }
    ],
    limits: { aiGenerations: 3, aiImages: 3, sms: 10, fbPosts: 0 }
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 149,
    currency: "৳",
    tagline: "যাঁরা সদ্য ফেসবুকে বিজনেস শুরু করেছেন তাঁদের জন্য।",
    features: [
      { label: "প্রোডাক্ট ও অর্ডার ম্যানেজমেন্ট", included: true },
      { label: "মাসে ৩০টি ফেসবুক পোস্ট", included: true },
      { label: "Steadfast ও Pathao কুরিয়ার", included: true },
      { label: "মাসে ১০টি প্রমোশনাল SMS", included: true },
      { label: "মাসে ৫টি AI পোস্ট জেনারেশন", included: true },
      { label: "প্রায়োরিটি প্রসেসিং ও সাপোর্ট", included: false }
    ],
    limits: { aiGenerations: 5, aiImages: 5, sms: 10, fbPosts: 30 }
  },
  growth: {
    id: "growth",
    name: "Growth",
    price: 599,
    currency: "৳",
    tagline: "যাঁরা AI ও অটোমেশন দিয়ে ব্যবসা বড় করতে প্রস্তুত।",
    features: [
      { label: "Starter-এর সব ফিচার", included: true },
      { label: "মাসে ৩০০টি ফেসবুক পোস্ট", included: true },
      { label: "মাসে ৬০টি AI পোস্ট জেনারেশন", included: true },
      { label: "মাসে ৩০০টি প্রমোশনাল SMS", included: true },
      { label: "দ্রুত প্রসেসিং", included: true },
      { label: "প্রায়োরিটি সাপোর্ট", included: true },
      { label: "বাল্ক প্রোডাক্ট আপলোড", included: true }
    ],
    limits: { aiGenerations: 60, aiImages: 20, sms: 300, fbPosts: 300 },
    highlight: true
  }
};

export const PLAN_LIST: Plan[] = [PLANS.starter, PLANS.growth];

export function formatPrice(plan: Plan): string {
  return `${plan.currency}${plan.price}`;
}

/**
 * A plan shaped for the public-facing pricing cards & dashboard switcher.
 * Sourced from the admin-managed plans (`/api/plans`) — see `marketingPlanFromPayload`.
 */
export interface MarketingPlan {
  slug: string;
  name: string;
  tagline: string | null;
  price: number;
  currency: string;
  features: string[];
  popular: boolean;
  hasAi: boolean;
}

/** Map a backend plan payload onto the display shape the cards render. */
export function marketingPlanFromPayload(p: PlanPayload): MarketingPlan {
  return {
    slug: p.slug,
    name: p.name,
    tagline: p.tagline ?? null,
    price: Number(p.price),
    currency: p.currency || "৳",
    features: p.features ?? [],
    popular: Boolean(p.is_popular),
    hasAi: (p.limits?.aiGenerations ?? 0) > 0
  };
}

/**
 * Fallback used when the live plans request fails, so the pricing page is
 * never blank. Derived from the bundled PLAN_LIST (included features only).
 */
export const FALLBACK_MARKETING_PLANS: MarketingPlan[] = PLAN_LIST.map((p) => ({
  slug: p.id,
  name: p.name,
  tagline: p.tagline,
  price: p.price,
  currency: p.currency,
  features: p.features.filter((f) => f.included).map((f) => f.label),
  popular: Boolean(p.highlight),
  hasAi: p.limits.aiGenerations > 0
}));
