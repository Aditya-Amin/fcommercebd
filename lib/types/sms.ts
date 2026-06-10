// ─── SMS quota stats ─────────────────────────────────────────────────────────

export interface SmsStats {
  has_active_plan: boolean;
  package_name: string | null;
  total_sms: number;
  used_sms: number;
  remaining_sms: number;
  usage_percentage: number;
  reset_at: string | null; // "YYYY-MM-DD"
}

// ─── Send result ─────────────────────────────────────────────────────────────

export interface SmsSendResult {
  ok: boolean;
  status: "sent" | "mock" | "failed" | "quota_exceeded" | "no_active_plan" | "period_expired";
  message: string;
  remaining: number;
  log_id?: number;
}

// ─── Usage log row ───────────────────────────────────────────────────────────

export interface SmsLogEntry {
  id: number;
  recipient_number: string;
  message_preview: string;
  status: "sent" | "failed" | "mock";
  sent_at: string; // ISO 8601
}

// ─── Dev: package plan ───────────────────────────────────────────────────────

export interface DevPlan {
  id: number;
  name: string;
  slug: string;
  price: number;
  currency: string;
  sms_limit: number;
  features: string[];
}
