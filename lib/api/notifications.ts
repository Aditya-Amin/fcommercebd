import sampleNotifications from "@/lib/mock/notifications/sample-notifications.json";
import copyJson from "@/lib/mock/notifications/copy.json";
import type {
  Notification,
  NotificationCopy,
  NotificationFilters,
  NotificationListResponse,
  NotificationPriority,
  NotificationType
} from "@/lib/types/notification";

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
const USE_MOCK_API = !LARAVEL_API_URL || LARAVEL_API_URL.trim() === "";

const STORAGE_KEY = "fcommerce.mock.notifications.v1";
const SIM_TICK_KEY = "fcommerce.mock.notifications.simTick";

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
    const b = body as { message?: string } | null;
    throw new Error(b?.message ?? `HTTP ${res.status}`);
  }
  return body as T;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ────────────────────────────────────────────────────────────────────────────
// Copy
// ────────────────────────────────────────────────────────────────────────────

export async function getNotificationCopy(): Promise<NotificationCopy> {
  return copyJson as NotificationCopy;
}

// ────────────────────────────────────────────────────────────────────────────
// Mock storage helpers
// ────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_OFFSETS: Record<string, number> = {
  __NOW_MINUS_2_MIN__: 2 * 60_000,
  __NOW_MINUS_18_MIN__: 18 * 60_000,
  __NOW_MINUS_55_MIN__: 55 * 60_000,
  __NOW_MINUS_3_HR__: 3 * 60 * 60_000,
  __NOW_MINUS_5_HR__: 5 * 60 * 60_000,
  __NOW_MINUS_8_HR__: 8 * 60 * 60_000,
  __NOW_MINUS_1_DAY__: 24 * 60 * 60_000,
  __NOW_MINUS_2_DAY__: 2 * 24 * 60 * 60_000,
  __NOW_MINUS_3_DAY__: 3 * 24 * 60 * 60_000,
  __NOW_MINUS_4_DAY__: 4 * 24 * 60 * 60_000,
  __NOW_MINUS_5_DAY__: 5 * 24 * 60 * 60_000,
  __NOW_MINUS_6_DAY__: 6 * 24 * 60 * 60_000,
  __NOW_MINUS_7_DAY__: 7 * 24 * 60 * 60_000,
  __NOW_MINUS_8_DAY__: 8 * 24 * 60 * 60_000,
  __NOW_MINUS_10_DAY__: 10 * 24 * 60 * 60_000,
  __NOW_MINUS_12_DAY__: 12 * 24 * 60 * 60_000
};

function resolveTimestamp(value: string | null): string | null {
  if (!value) return null;
  const offset = PLACEHOLDER_OFFSETS[value];
  if (offset === undefined) return value;
  return new Date(Date.now() - offset).toISOString();
}

function seedNotifications(): Notification[] {
  return (sampleNotifications.data as Array<Notification & { createdAt: string; readAt: string | null }>).map(
    (n) => ({
      ...n,
      createdAt: resolveTimestamp(n.createdAt) ?? new Date().toISOString(),
      readAt: resolveTimestamp(n.readAt)
    })
  );
}

function loadNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedNotifications();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Notification[];
  } catch {
    return [];
  }
}

function saveNotifications(list: Notification[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Mock realtime simulator — drips a new notification every ~30–90s so the
// poller in NotificationContext picks it up and fires a toast.
// ────────────────────────────────────────────────────────────────────────────

const SIMULATED_TEMPLATES: Array<{
  type: NotificationType;
  title: string;
  message: string;
  actionUrl: string;
  icon: string;
  priority: NotificationPriority;
}> = [
  {
    type: "order_new",
    title: "New order received",
    message: "A customer just placed a new order. Tap to view details.",
    actionUrl: "/orders",
    icon: "shopping-bag",
    priority: "high"
  },
  {
    type: "fb_post_published",
    title: "Facebook post published",
    message: "Your scheduled post is now live on your page.",
    actionUrl: "/ai-generate",
    icon: "facebook",
    priority: "normal"
  },
  {
    type: "low_stock",
    title: "Low stock alert",
    message: "One of your products is running low on stock.",
    actionUrl: "/products",
    icon: "alert-triangle",
    priority: "high"
  },
  {
    type: "order_status",
    title: "Order delivered",
    message: "Steadfast confirmed delivery for one of your orders.",
    actionUrl: "/orders",
    icon: "check-circle",
    priority: "normal"
  }
];

/**
 * Called by the NotificationContext poller in mock mode. If enough time has
 * elapsed since the last simulated drip, prepends one new unread notification
 * and returns true. Otherwise no-op.
 */
function maybeSimulateNewNotification(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const lastTickRaw = window.localStorage.getItem(SIM_TICK_KEY);
    const lastTick = lastTickRaw ? parseInt(lastTickRaw, 10) : 0;
    const now = Date.now();
    // first call: just record the tick, don't fire immediately
    if (lastTick === 0) {
      window.localStorage.setItem(SIM_TICK_KEY, String(now));
      return false;
    }
    // random interval between 30s and 90s
    const interval = 30_000 + Math.floor(Math.random() * 60_000);
    if (now - lastTick < interval) return false;

    const tpl = SIMULATED_TEMPLATES[Math.floor(Math.random() * SIMULATED_TEMPLATES.length)];
    const next: Notification = {
      id: "ntf_" + now.toString(36),
      type: tpl.type,
      title: tpl.title,
      message: tpl.message,
      data: {},
      actionUrl: tpl.actionUrl,
      icon: tpl.icon,
      priority: tpl.priority,
      readAt: null,
      createdAt: new Date(now).toISOString()
    };
    const list = loadNotifications();
    saveNotifications([next, ...list]);
    window.localStorage.setItem(SIM_TICK_KEY, String(now));
    return true;
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

export async function getNotifications(
  filters: NotificationFilters = {}
): Promise<NotificationListResponse> {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.max(1, Math.min(50, filters.perPage ?? 10));
  const unreadOnly = filters.unreadOnly === true;

  if (USE_MOCK_API) {
    await delay(150);
    const all = loadNotifications().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const unreadCount = all.filter((n) => n.readAt === null).length;
    const filtered = unreadOnly ? all.filter((n) => n.readAt === null) : all;
    const start = (page - 1) * perPage;
    return {
      data: filtered.slice(start, start + perPage),
      total: filtered.length,
      page,
      perPage,
      unreadCount
    };
  }

  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    unread_only: unreadOnly ? "1" : "0"
  });
  const res = await fetch(`${LARAVEL_API_URL}/api/notifications?${params}`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  return jsonOrThrow<NotificationListResponse>(res);
}

export async function getUnreadCount(): Promise<number> {
  if (USE_MOCK_API) {
    // The simulator runs on the same poll cycle that fetches the count,
    // so the bell badge updates without waiting for a separate fetch.
    maybeSimulateNewNotification();
    const list = loadNotifications();
    return list.filter((n) => n.readAt === null).length;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/notifications/unread-count`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: { count: number } }>(res);
  return body.data.count;
}

export async function markAsRead(id: string): Promise<Notification> {
  if (USE_MOCK_API) {
    await delay(80);
    const list = loadNotifications();
    const idx = list.findIndex((n) => n.id === id);
    if (idx < 0) throw new Error("Notification not found.");
    if (list[idx].readAt === null) {
      list[idx] = { ...list[idx], readAt: new Date().toISOString() };
      saveNotifications(list);
    }
    return list[idx];
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/notifications/${id}/read`, {
    method: "POST",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: Notification }>(res);
  return body.data;
}

export async function markAllAsRead(): Promise<number> {
  if (USE_MOCK_API) {
    await delay(120);
    const list = loadNotifications();
    const now = new Date().toISOString();
    let updated = 0;
    const next = list.map((n) => {
      if (n.readAt === null) {
        updated++;
        return { ...n, readAt: now };
      }
      return n;
    });
    saveNotifications(next);
    return updated;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/notifications/mark-all-read`, {
    method: "POST",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: { updated: number } }>(res);
  return body.data.updated;
}

export async function deleteNotification(id: string): Promise<void> {
  if (USE_MOCK_API) {
    await delay(80);
    saveNotifications(loadNotifications().filter((n) => n.id !== id));
    return;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/notifications/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  if (!res.ok) await jsonOrThrow(res);
}
