import type { Plan, PlanId } from "./types";

export const PLANS: Record<PlanId, Plan> = {
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
    limits: { aiGenerations: 5, sms: 10, fbPosts: 30 }
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
    limits: { aiGenerations: 60, sms: 300, fbPosts: 300 },
    highlight: true
  }
};

export const PLAN_LIST: Plan[] = [PLANS.starter, PLANS.growth];

export function formatPrice(plan: Plan): string {
  return `${plan.currency}${plan.price}`;
}
