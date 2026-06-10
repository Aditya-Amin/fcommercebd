/**
 * bKash payment API — supports both real (Laravel) and mock (prototype) modes.
 *
 * When NEXT_PUBLIC_LARAVEL_API_URL is set and backend is running, calls real endpoints.
 * Otherwise, uses mock responses to simulate the full payment flow without backend.
 */

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
const USE_MOCK_API = !LARAVEL_API_URL || LARAVEL_API_URL.trim() === "";

export interface CreatePaymentResponse {
  paymentID: string;
  bkashURL: string;
  amount: number;
  currency: string;
}

export interface ExecuteResult {
  ok: boolean;
  execute: Record<string, unknown>;
}

export interface SubscriptionPayload {
  id: number;
  user_id: number;
  plan_id: number;
  transaction_id: string;
  amount: string;
  status: "pending" | "active" | "failed" | "expired" | "cancelled";
  start_date: string;
  expiry_date: string;
  plan?: {
    id: number;
    name: string;
    slug: string;
    price: string;
    currency: string;
  };
}

function authHeaders(): Record<string, string> {
  // Replace with your real auth integration. With Laravel Sanctum bearer
  // tokens, store the token after login under "auth.token".
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("auth.token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const message =
      (body as { message?: string; error?: string } | null)?.message ??
      (body as { error?: string } | null)?.error ??
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

export async function createBkashPayment(planId: number, phone?: string): Promise<CreatePaymentResponse> {
  if (USE_MOCK_API) {
    const plans = await getPlans();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) throw new Error(`Plan ${planId} not found`);

    const paymentID = generateMockPaymentId();
    const trxID = generateMockTrxId();
    const amount = parseInt(plan.price, 10);

    const params = new URLSearchParams({
      paymentID,
      trxID,
      plan: plan.slug
    });

    return {
      paymentID,
      amount,
      currency: plan.currency,
      bkashURL: `/payment/success?${params.toString()}`
    };
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/bkash/create-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders()
    },
    credentials: "include",
    body: JSON.stringify({ plan_id: planId, ...(phone ? { phone } : {}) })
  });
  return jsonOrThrow<CreatePaymentResponse>(res);
}

export async function executeBkashPayment(paymentID: string): Promise<ExecuteResult> {
  if (USE_MOCK_API) {
    return {
      ok: true,
      execute: {
        paymentID,
        transactionStatus: "Completed",
        trxID: generateMockTrxId(),
        amount: 100,
        currency: "৳"
      }
    };
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/bkash/execute-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders()
    },
    credentials: "include",
    body: JSON.stringify({ paymentID })
  });
  return jsonOrThrow<ExecuteResult>(res);
}

export async function queryBkashPayment(paymentID: string): Promise<Record<string, unknown>> {
  if (USE_MOCK_API) {
    return {
      paymentID,
      transactionStatus: "Completed",
      trxID: generateMockTrxId(),
      amount: 100,
      currency: "৳",
      completionTime: new Date().toISOString()
    };
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/bkash/query-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders()
    },
    credentials: "include",
    body: JSON.stringify({ paymentID })
  });
  return jsonOrThrow<Record<string, unknown>>(res);
}

export interface PlanPayload {
  id: number;
  name: string;
  slug: string;
  price: string;
  currency: string;
  duration: string;
  duration_days: number;
  features: string[] | null;
}

let plansCache: PlanPayload[] | null = null;

const MOCK_PLANS: PlanPayload[] = [
  {
    id: 1,
    name: "Starter",
    slug: "starter",
    price: "149",
    currency: "৳",
    duration: "month",
    duration_days: 30,
    features: [
      "প্রোডাক্ট ও অর্ডার ম্যানেজমেন্ট",
      "ফেসবুক পেজে পোস্ট",
      "Steadfast ও Pathao কুরিয়ার",
      "মাসে ১০টি প্রমোশনাল SMS"
    ]
  },
  {
    id: 2,
    name: "Growth",
    slug: "growth",
    price: "599",
    currency: "৳",
    duration: "month",
    duration_days: 30,
    features: [
      "Starter-এর সব ফিচার",
      "মাসে ৬০টি AI পোস্ট জেনারেশন",
      "মাসে ৩০০টি প্রমোশনাল SMS",
      "দ্রুত প্রসেসিং",
      "প্রায়োরিটি সাপোর্ট",
      "বাল্ক প্রোডাক্ট আপলোড"
    ]
  }
];

function generateMockPaymentId(): string {
  return "TXN" + Date.now() + Math.random().toString(36).substring(2, 9);
}

function generateMockTrxId(): string {
  return "BKT" + Math.random().toString(36).substring(2, 13).toUpperCase();
}

export async function getPlans(): Promise<PlanPayload[]> {
  if (plansCache) return plansCache;

  if (USE_MOCK_API) {
    plansCache = MOCK_PLANS;
    return MOCK_PLANS;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/plans`, {
    headers: { Accept: "application/json" }
  });
  const body = await jsonOrThrow<{ data: PlanPayload[] }>(res);
  plansCache = body.data;
  return body.data;
}

/**
 * Resolve "starter" / "growth" (slug used in our local PLAN_LIST) to the
 * numeric plan_id stored in Laravel.
 */
export async function getPlanIdBySlug(slug: string): Promise<number> {
  const plans = await getPlans();
  const match = plans.find((p) => p.slug === slug);
  if (!match) throw new Error(`Unknown plan slug: ${slug}`);
  return match.id;
}

export async function getActiveSubscription(): Promise<SubscriptionPayload | null> {
  if (USE_MOCK_API) {
    return null;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/subscriptions/active`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: SubscriptionPayload | null }>(res);
  return body.data;
}

/**
 * Convenience: kick off a payment and redirect the browser to the bKash hosted page.
 * Throws if the Laravel call fails so the caller can show an error.
 */
export async function startBkashCheckout(planId: number, phone?: string): Promise<void> {
  const { bkashURL } = await createBkashPayment(planId, phone);
  if (!bkashURL) throw new Error("bKash did not return a redirect URL");
  window.location.href = bkashURL;
}
