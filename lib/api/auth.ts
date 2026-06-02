import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload
} from "@/lib/types/auth";

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
const USE_MOCK_API = !LARAVEL_API_URL || LARAVEL_API_URL.trim() === "";

export const TOKEN_KEY = "auth.token";
export const USER_KEY = "fcommerce.auth";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem(TOKEN_KEY);
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
    const b = body as { message?: string; errors?: Record<string, string[]> } | null;
    // Laravel validation errors come as { errors: { field: [msg, ...] } }
    if (b?.errors) {
      const first = Object.values(b.errors).flat()[0];
      if (first) throw new Error(first);
    }
    throw new Error(b?.message ?? `HTTP ${res.status}`);
  }
  return body as T;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ────────────────────────────────────────────────────────────────────────────
// Mock fallback — used when NEXT_PUBLIC_LARAVEL_API_URL is unset.
// Mirrors the real shape so the SPA "just works" without a backend.
// ────────────────────────────────────────────────────────────────────────────

const MOCK_TOKEN = "mock_token_seller";

function mockUser(email: string, name: string, business?: string, phone?: string): AuthUser {
  const colors = ["#3362FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  const idx = Math.abs(Array.from(email).reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length;
  return {
    id: "mock_" + Date.now().toString(36),
    name,
    email,
    business: business ?? "FcommerceBD",
    phone: phone ?? null,
    avatarColor: colors[idx],
    createdAt: new Date().toISOString(),
    subscription: null,
    lastSubscription: null
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

export async function registerAccount(payload: RegisterPayload): Promise<AuthResponse> {
  if (USE_MOCK_API) {
    await delay(500);
    return {
      token: MOCK_TOKEN,
      user: mockUser(payload.email, payload.name, payload.business, payload.phone)
    };
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  return jsonOrThrow<AuthResponse>(res);
}

export async function loginAccount(payload: LoginPayload): Promise<AuthResponse> {
  if (USE_MOCK_API) {
    await delay(400);
    return {
      token: MOCK_TOKEN,
      user: mockUser(payload.email, payload.email.split("@")[0])
    };
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  return jsonOrThrow<AuthResponse>(res);
}

export async function logoutAccount(): Promise<void> {
  if (USE_MOCK_API) {
    await delay(80);
    return;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/logout`, {
    method: "POST",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  // Don't throw on logout failure — local state is already cleared.
  if (!res.ok && res.status !== 401) await jsonOrThrow(res);
}

/**
 * Returns the currently-authenticated user (with active subscription) from the
 * server. Used to hydrate AuthContext on app boot and after a successful
 * payment so the dashboard reflects the new active plan.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (USE_MOCK_API) {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/me`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  if (res.status === 401) return null;
  const body = await jsonOrThrow<{ data: AuthUser }>(res);
  return body.data;
}
