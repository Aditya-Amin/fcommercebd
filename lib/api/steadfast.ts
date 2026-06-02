/**
 * Steadfast Courier API client.
 *
 * In real-API mode (`NEXT_PUBLIC_LARAVEL_API_URL` set) every call goes
 * through Laravel at `/api/steadfast/*`. Laravel holds the encrypted
 * credentials and proxies to the upstream Steadfast portal — the browser
 * never sees the keys after they're saved.
 *
 * In mock mode, calls return the existing localStorage-backed shape so
 * demos still work without a backend.
 */

import type { SteadfastConsignment, SteadfastCredentials } from "@/lib/types";

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
const USE_MOCK_API = !LARAVEL_API_URL || LARAVEL_API_URL.trim() === "";

// ────────────────────────────────────────────────────────────────────────
// Wire types — match SteadfastConsignmentResource on the backend.

export interface SteadfastConsignmentDto {
  id: string;
  invoice: string;
  consignmentId: string | null;
  trackingCode: string | null;
  status: string;
  recipientName: string;
  recipientPhone: string;
  alternativePhone: string | null;
  recipientEmail: string | null;
  recipientAddress: string;
  codAmount: number;
  note: string | null;
  itemDescription: string | null;
  deliveryType: number | null;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface CreateConsignmentPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  alternative_phone?: string;
  recipient_email?: string;
  note?: string;
  item_description?: string;
  delivery_type?: 0 | 1;
}

export interface CredentialStatus {
  connected: boolean;
  isValid: boolean;
  lastValidatedAt: string | null;
  currentBalance?: number;
}

// ────────────────────────────────────────────────────────────────────────
// Helpers

function authHeaders(): Record<string, string> {
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

// Convert the new wire DTO to the legacy `SteadfastConsignment` shape that
// the modal + orders page already render. Keeps the UI unchanged.
function dtoToLegacy(dto: SteadfastConsignmentDto): SteadfastConsignment {
  return {
    consignmentId: dto.consignmentId ? Number(dto.consignmentId) : 0,
    trackingCode: dto.trackingCode ?? "",
    status: dto.status,
    bookedAt: dto.createdAt,
    deliveryAddress: dto.recipientAddress
  };
}

// ────────────────────────────────────────────────────────────────────────
// Mock backing (localStorage) — keeps the existing offline demo path working.

const MOCK_CREDS_KEY = "fcommerce.mock.steadfast.creds.v1";
const MOCK_CONSIGNMENTS_KEY = "fcommerce.mock.steadfast.consignments.v1";

function loadMockConsignments(): Record<string, SteadfastConsignment> {
  try {
    const raw = window.localStorage.getItem(MOCK_CONSIGNMENTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, SteadfastConsignment>) : {};
  } catch {
    return {};
  }
}

function saveMockConsignments(map: Record<string, SteadfastConsignment>): void {
  try {
    window.localStorage.setItem(MOCK_CONSIGNMENTS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

// ────────────────────────────────────────────────────────────────────────
// Public API

export async function getCredentialStatus(): Promise<CredentialStatus> {
  if (USE_MOCK_API) {
    const has = !!window.localStorage.getItem(MOCK_CREDS_KEY);
    return { connected: has, isValid: has, lastValidatedAt: null };
  }
  const res = await fetch(`${LARAVEL_API_URL}/api/steadfast/credentials`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: CredentialStatus }>(res);
  return body.data;
}

export async function saveCredentials(creds: SteadfastCredentials): Promise<CredentialStatus> {
  if (USE_MOCK_API) {
    window.localStorage.setItem(MOCK_CREDS_KEY, JSON.stringify(creds));
    return { connected: true, isValid: true, lastValidatedAt: new Date().toISOString() };
  }
  const res = await fetch(`${LARAVEL_API_URL}/api/steadfast/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ api_key: creds.apiKey, secret_key: creds.secretKey })
  });
  const body = await jsonOrThrow<{ data: CredentialStatus }>(res);
  return body.data;
}

export async function deleteCredentials(): Promise<void> {
  if (USE_MOCK_API) {
    window.localStorage.removeItem(MOCK_CREDS_KEY);
    return;
  }
  const res = await fetch(`${LARAVEL_API_URL}/api/steadfast/credentials`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  await jsonOrThrow<unknown>(res);
}

export async function getBalance(): Promise<number> {
  if (USE_MOCK_API) return 0;
  const res = await fetch(`${LARAVEL_API_URL}/api/steadfast/balance`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: { currentBalance: number } }>(res);
  return body.data.currentBalance ?? 0;
}

export async function listConsignments(): Promise<Record<string, SteadfastConsignment>> {
  if (USE_MOCK_API) return loadMockConsignments();

  const res = await fetch(`${LARAVEL_API_URL}/api/steadfast/consignments`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: SteadfastConsignmentDto[] }>(res);

  const out: Record<string, SteadfastConsignment> = {};
  for (const dto of body.data) {
    out[dto.invoice] = dtoToLegacy(dto);
  }
  return out;
}

export async function createConsignment(
  payload: CreateConsignmentPayload
): Promise<SteadfastConsignment> {
  if (USE_MOCK_API) {
    const fake: SteadfastConsignment = {
      consignmentId: Math.floor(10_000_000 + Math.random() * 90_000_000),
      trackingCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
      status: "in_review",
      bookedAt: new Date().toISOString(),
      deliveryAddress: payload.recipient_address
    };
    const all = loadMockConsignments();
    all[payload.invoice] = fake;
    saveMockConsignments(all);
    return fake;
  }
  const res = await fetch(`${LARAVEL_API_URL}/api/steadfast/consignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  const body = await jsonOrThrow<{ data: SteadfastConsignmentDto }>(res);
  return dtoToLegacy(body.data);
}

export async function syncConsignmentStatus(invoice: string): Promise<SteadfastConsignment> {
  if (USE_MOCK_API) {
    const all = loadMockConsignments();
    const existing = all[invoice];
    if (!existing) throw new Error("Consignment not found.");
    return existing;
  }
  const res = await fetch(
    `${LARAVEL_API_URL}/api/steadfast/consignments/${encodeURIComponent(invoice)}/sync-status`,
    {
      method: "POST",
      headers: { Accept: "application/json", ...authHeaders() },
      credentials: "include"
    }
  );
  const body = await jsonOrThrow<{ data: SteadfastConsignmentDto }>(res);
  return dtoToLegacy(body.data);
}
