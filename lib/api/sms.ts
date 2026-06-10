/**
 * SMS API — real (Laravel) + mock (prototype) modes.
 *
 * When NEXT_PUBLIC_LARAVEL_API_URL is set and the backend is running,
 * every function calls the real Laravel endpoint.
 *
 * When the env var is absent the functions return static mock data so
 * the UI can be built and previewed without a running backend.
 */

import type { DevPlan, SmsLogEntry, SmsSendResult, SmsStats } from "@/lib/types/sms";

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
const USE_MOCK_API = !LARAVEL_API_URL || LARAVEL_API_URL.trim() === "";

// ─── Auth header helper ───────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("auth.token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Fetch helper ────────────────────────────────────────────────────────────

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const b = body as { message?: string } | null;
    throw new Error(b?.message ?? `HTTP ${res.status}`);
  }
  return body as T;
}

// ─── Mock data ───────────────────────────────────────────────────────────────
// Realistic defaults so the Usage Statistics tab looks right in prototype mode.

const MOCK_STATS: SmsStats = {
  has_active_plan:  true,
  package_name:     "Growth",
  total_sms:        300,
  used_sms:         45,
  remaining_sms:    255,
  usage_percentage: 15,
  reset_at:         new Date(Date.now() + 25 * 86_400_000).toISOString().slice(0, 10),
};

const MOCK_LOGS: SmsLogEntry[] = [
  { id: 1, recipient_number: "01711111111", message_preview: "আপনার অর্ডার নিশ্চিত হয়েছে। ধন্যবাদ!", status: "mock", sent_at: new Date(Date.now() - 3_600_000).toISOString() },
  { id: 2, recipient_number: "01722222222", message_preview: "আপনার পণ্য পাঠানো হয়েছে। ট্র্যাক করুন: SF123", status: "mock", sent_at: new Date(Date.now() - 7_200_000).toISOString() },
  { id: 3, recipient_number: "01733333333", message_preview: "বিশেষ অফার: আজই অর্ডার করুন ৳৫০ ছাড়ে!", status: "failed", sent_at: new Date(Date.now() - 86_400_000).toISOString() },
  { id: 4, recipient_number: "01744444444", message_preview: "আপনার পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে।", status: "mock", sent_at: new Date(Date.now() - 172_800_000).toISOString() },
  { id: 5, recipient_number: "01755555555", message_preview: "ডেলিভারি সম্পন্ন হয়েছে। রিভিউ দিন!", status: "mock", sent_at: new Date(Date.now() - 259_200_000).toISOString() },
];

const MOCK_PLANS: DevPlan[] = [
  { id: 1, name: "Starter", slug: "starter", price: 149, currency: "BDT", sms_limit: 10,  features: ["10 SMS/month", "30 FB posts/month"] },
  { id: 2, name: "Growth",  slug: "growth",  price: 599, currency: "BDT", sms_limit: 300, features: ["300 SMS/month", "300 FB posts/month", "60 AI posts/month"] },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * GET /api/user/sms/stats
 * Returns the user's current SMS quota snapshot.
 */
export async function getSmsStats(): Promise<SmsStats> {
  if (USE_MOCK_API) return MOCK_STATS;

  const res = await fetch(`${LARAVEL_API_URL}/api/user/sms/stats`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include",
  });
  const body = await jsonOrThrow<{ data: SmsStats }>(res);
  return body.data;
}

/**
 * POST /api/user/sms/send
 * Deducts one SMS from the user's balance and dispatches the message.
 *
 * @throws Error with the server's message on quota exceeded / no plan.
 */
export async function sendSms(
  recipientNumber: string,
  message: string
): Promise<SmsSendResult> {
  if (USE_MOCK_API) {
    // Simulate a successful mock send without touching the backend
    return {
      ok:        true,
      status:    "mock",
      message:   "SMS পাঠানো হয়েছে। (mock)",
      remaining: MOCK_STATS.remaining_sms - 1,
    };
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/user/sms/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ recipient_number: recipientNumber, message }),
  });

  // For quota errors the server returns 4xx with { ok: false, message: "..." }.
  // We still parse the body and throw so the caller can show the message.
  const body = await jsonOrThrow<SmsSendResult>(res);
  return body;
}

/**
 * GET /api/user/sms/log?limit=N
 * Returns the N most recent SMS send records for the authenticated user.
 */
export async function getSmsLog(limit = 20): Promise<SmsLogEntry[]> {
  if (USE_MOCK_API) return MOCK_LOGS;

  const res = await fetch(
    `${LARAVEL_API_URL}/api/user/sms/log?limit=${limit}`,
    {
      headers: { Accept: "application/json", ...authHeaders() },
      credentials: "include",
    }
  );
  const body = await jsonOrThrow<{ data: SmsLogEntry[] }>(res);
  return body.data;
}

// ─── Dev / test helpers ───────────────────────────────────────────────────────

/**
 * GET /api/dev/packages
 * Lists available plans for the mock activation test page.
 * Only works when APP_ENV=local on the backend.
 */
export async function getDevPlans(): Promise<DevPlan[]> {
  if (USE_MOCK_API) return MOCK_PLANS;

  const res = await fetch(`${LARAVEL_API_URL}/api/dev/packages`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include",
  });
  const body = await jsonOrThrow<{ data: DevPlan[] }>(res);
  return body.data;
}

/**
 * POST /api/dev/activate-package
 * Instantly activates a plan for the current user (no bKash payment).
 * Only works when APP_ENV=local on the backend.
 */
export async function activateDevPackage(
  planId: number
): Promise<{ ok: boolean; plan: string; sms_total: number; expires_at: string }> {
  if (USE_MOCK_API) {
    const plan = MOCK_PLANS.find((p) => p.id === planId) ?? MOCK_PLANS[1];
    return { ok: true, plan: plan.name, sms_total: plan.sms_limit, expires_at: MOCK_STATS.reset_at ?? "" };
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/dev/activate-package`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ plan_id: planId }),
  });
  return jsonOrThrow(res);
}
