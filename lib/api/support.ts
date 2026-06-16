import type { SupportTicket, SupportMessage, MessageDelta } from "@/lib/types/support";

const BASE = process.env.NEXT_PUBLIC_LARAVEL_API_URL ?? "";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("auth.token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  if (!res.ok) {
    const b = body as { message?: string; errors?: Record<string, string[]> } | null;
    if (b?.errors) throw new Error(Object.values(b.errors).flat()[0] ?? "Error");
    throw new Error(b?.message ?? `HTTP ${res.status}`);
  }
  return body as T;
}

export async function getTickets(): Promise<SupportTicket[]> {
  const res = await fetch(`${BASE}/api/support/tickets`, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  const body = await jsonOrThrow<{ data: SupportTicket[] }>(res);
  return body.data;
}

export async function getTicket(id: number): Promise<SupportTicket> {
  const res = await fetch(`${BASE}/api/support/tickets/${id}`, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  const body = await jsonOrThrow<{ data: SupportTicket }>(res);
  return body.data;
}

export async function createTicket(subject: string, message: string): Promise<SupportTicket> {
  const res = await fetch(`${BASE}/api/support/tickets`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
    body:    JSON.stringify({ subject, message }),
  });
  const body = await jsonOrThrow<{ data: SupportTicket }>(res);
  return body.data;
}

/**
 * Cursor delta poll: fetch only messages newer than `afterId`.
 * Pass 0 (or omit) to get the full thread. This is what the chat polls on an
 * interval — each call is a tiny indexed range scan, returning [] most ticks.
 */
export async function getNewMessages(ticketId: number, afterId: number): Promise<MessageDelta> {
  const res = await fetch(
    `${BASE}/api/support/tickets/${ticketId}/messages?after_id=${afterId}`,
    { headers: { Accept: "application/json", ...authHeaders() } }
  );
  return jsonOrThrow<MessageDelta>(res);
}

export async function sendMessage(ticketId: number, message: string): Promise<SupportMessage> {
  const res = await fetch(`${BASE}/api/support/tickets/${ticketId}/messages`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
    body:    JSON.stringify({ message }),
  });
  const body = await jsonOrThrow<{ data: SupportMessage }>(res);
  return body.data;
}
