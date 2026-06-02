import samplePages from "@/lib/mock/facebook/sample-pages.json";
import type {
  AiGeneratePayload,
  AiGenerateResult,
  ConnectResponse,
  CreatePostPayload,
  FacebookPage,
  FacebookPost,
  FbPostsQuota
} from "@/lib/types/facebook";
import { getProduct } from "@/lib/api/products";
import { PLANS } from "@/lib/plans";
import type { PlanId, UsageStats } from "@/lib/types";

// Mock-mode safety knobs — mirrors backend config/facebook.php so the
// demo behaves identically to the real API.
const MOCK_MIN_GAP_SECONDS = 300; // 5 min between posts on the same page
const MOCK_MAX_PER_HOUR    = 6;
const MOCK_MAX_PER_DAY     = 25;

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
const USE_MOCK_API = !LARAVEL_API_URL || LARAVEL_API_URL.trim() === "";

const PAGES_KEY = "fcommerce.mock.fb.pages.v1";
const POSTS_KEY = "fcommerce.mock.fb.posts.v1";

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
    const b = body as { message?: string; violations?: string[] } | null;
    const message =
      b?.message ??
      (b?.violations ? b.violations.join("; ") : null) ??
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

function loadPages(): FacebookPage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PAGES_KEY);
    return raw ? (JSON.parse(raw) as FacebookPage[]) : [];
  } catch {
    return [];
  }
}

function savePages(pages: FacebookPage[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
  } catch {
    /* ignore */
  }
}

function loadPosts(): FacebookPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(POSTS_KEY);
    return raw ? (JSON.parse(raw) as FacebookPost[]) : [];
  } catch {
    return [];
  }
}

function savePosts(posts: FacebookPost[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  } catch {
    /* ignore */
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

// ────────────────────────────────────────────────────────────────────────────
// Pages
// ────────────────────────────────────────────────────────────────────────────

export async function getFacebookPages(): Promise<FacebookPage[]> {
  if (USE_MOCK_API) {
    await delay(120);
    return loadPages();
  }
  const res = await fetch(`${LARAVEL_API_URL}/api/facebook/pages`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: FacebookPage[] }>(res);
  return body.data;
}

/**
 * Mock connect simulates the OAuth dance. Adds the sample page to localStorage.
 * Real connect returns the dialog URL the SPA should redirect to.
 */
export async function startFacebookConnect(): Promise<ConnectResponse> {
  if (USE_MOCK_API) {
    await delay(400);
    const sample = (samplePages.data as FacebookPage[])[0];
    const existing = loadPages();
    if (!existing.some((p) => p.pageId === sample.pageId)) {
      savePages([...existing, sample]);
    }
    return { state: "mock_state", url: "/integrations?fb=connected" };
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/facebook/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders()
    },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: ConnectResponse }>(res);
  return body.data;
}

export async function disconnectFacebookPage(id: string): Promise<void> {
  if (USE_MOCK_API) {
    await delay(200);
    savePages(loadPages().filter((p) => p.id !== id));
    return;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/facebook/pages/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  if (!res.ok) await jsonOrThrow(res);
}

// ────────────────────────────────────────────────────────────────────────────
// Posts
// ────────────────────────────────────────────────────────────────────────────

export async function createFacebookPost(payload: CreatePostPayload): Promise<FacebookPost> {
  if (USE_MOCK_API) {
    await delay(700);
    const pages = loadPages();
    const page = pages.find((p) => p.id === payload.facebook_page_id);
    if (!page) throw new Error("Facebook page not found.");

    // ── 1. Plan quota (matches backend PlanQuotaService) ──
    const quota = readMockQuota();
    if (quota.locked) {
      throw new Error("Facebook posting is not available on your current plan.");
    }
    if (quota.remaining <= 0) {
      throw new Error(
        `Monthly Facebook post limit reached (${quota.used}/${quota.limit}). Upgrade for more.`
      );
    }

    // ── 2. Per-page rate limit (matches backend PostingRateLimiter) ──
    const rateError = mockRateCheck(page.id, payload.scheduled_at);
    if (rateError) throw new Error(rateError);

    // ── 3. Content moderation ──
    const composed = composeMockMessage(payload.message, payload.hashtags ?? []);
    const violations = mockModerate(composed);
    if (violations.length > 0) throw new Error(violations.join("; "));

    const now = new Date().toISOString();
    const post: FacebookPost = {
      id: "fbpost_" + Date.now().toString(36),
      pageId: payload.facebook_page_id,
      productId: payload.product_id ?? null,
      type: payload.type,
      message: composed,
      linkUrl: payload.link_url ?? null,
      imageUrl: payload.image_url ?? null,
      imageUrls: payload.image_urls ?? [],
      hashtags: payload.hashtags ?? [],
      status: payload.scheduled_at ? "scheduled" : "publishing",
      scheduledAt: payload.scheduled_at ?? null,
      publishedAt: null,
      fbPostId: null,
      fbPermalink: null,
      errorCode: null,
      errorMessage: null,
      moderationFlags: [],
      attempts: 1,
      createdAt: now
    };
    const all = [post, ...loadPosts()];
    savePosts(all);

    // Tick the mock usage counter so subsequent calls see the new total.
    bumpMockFbPostsUsed();

    // simulate publish completion after a short delay
    if (!payload.scheduled_at) {
      setTimeout(() => {
        const list = loadPosts();
        const idx = list.findIndex((p) => p.id === post.id);
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            status: "published",
            publishedAt: new Date().toISOString(),
            fbPostId: page.pageId + "_" + Math.random().toString(36).slice(2, 10),
            fbPermalink: `https://facebook.com/${page.pageId}`
          };
          savePosts(list);
        }
      }, 1500);
    }

    return post;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/facebook/post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders()
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  const body = await jsonOrThrow<{ data: FacebookPost }>(res);
  return body.data;
}

export async function getFacebookPosts(): Promise<FacebookPost[]> {
  if (USE_MOCK_API) {
    await delay(120);
    return loadPosts();
  }
  const res = await fetch(`${LARAVEL_API_URL}/api/facebook/posts`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: FacebookPost[] }>(res);
  return body.data;
}

/**
 * Current-period FB post usage + remaining for the logged-in user.
 * Mock mode reads from the same usage shape PlanContext owns.
 */
export async function getFbPostsQuota(): Promise<FbPostsQuota> {
  if (USE_MOCK_API) {
    await delay(80);
    return readMockQuota();
  }
  const res = await fetch(`${LARAVEL_API_URL}/api/facebook/quota`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: FbPostsQuota }>(res);
  return body.data;
}

export async function cancelFacebookPost(id: string): Promise<void> {
  if (USE_MOCK_API) {
    await delay(150);
    const list = loadPosts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], status: "cancelled" };
      savePosts(list);
    }
    return;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/facebook/posts/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  if (!res.ok) await jsonOrThrow(res);
}

// ────────────────────────────────────────────────────────────────────────────
// AI generation
// ────────────────────────────────────────────────────────────────────────────

export async function generateAiPost(payload: AiGeneratePayload): Promise<AiGenerateResult> {
  if (USE_MOCK_API) {
    await delay(1200);
    const product = await getProduct(payload.product_id);
    const tone = payload.tone ?? "friendly";
    const language = payload.language ?? "en";

    const tonePrefix = {
      promo: "Limited offer! ",
      festive: "This Eid, ",
      professional: "",
      friendly: ""
    }[tone];

    const caption =
      language === "bn"
        ? `${tonePrefix}${product.title} এখন মাত্র ৳${product.price}!\n\n${product.shortDescription ?? product.description}\n\nএখনই ইনবক্সে অর্ডার করুন।`
        : language === "mixed"
          ? `${tonePrefix}${product.title} matro ৳${product.price} e!\n\n${product.shortDescription ?? product.description}\n\nOrder korte inbox koren.`
          : `${tonePrefix}${product.title} — only ৳${product.price}!\n\n${product.shortDescription ?? product.description}\n\nDM us to order today.`;

    const hashtags =
      payload.include_hashtags === false
        ? []
        : Array.from(
            new Set([
              "#FcommerceBD",
              "#OnlineShoppingBD",
              ...product.tags.map((t) => "#" + t.replace(/\s+/g, ""))
            ])
          ).slice(0, 6);

    return {
      productId: product.id,
      caption,
      hashtags,
      images: product.images.map((i) => i.url),
      primary: product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url ?? null
    };
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/ai/generate-post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders()
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  const body = await jsonOrThrow<{ data: AiGenerateResult }>(res);
  return body.data;
}

// ────────────────────────────────────────────────────────────────────────────
// Mock-mode helpers (mirror the backend moderator/composer)
// ────────────────────────────────────────────────────────────────────────────

function composeMockMessage(caption?: string, hashtags: string[] = []): string {
  const trimmed = (caption ?? "").trim();
  const tags = hashtags
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : "#" + t.replace(/\s+/g, "")));
  if (!trimmed && tags.length === 0) return "";
  if (tags.length === 0) return trimmed;
  return trimmed ? `${trimmed}\n\n${tags.join(" ")}` : tags.join(" ");
}

// ────────────────────────────────────────────────────────────────────────────
// Mock-mode quota + rate-limit (mirror backend behavior so the demo matches)
// ────────────────────────────────────────────────────────────────────────────

const PLAN_KEY  = "fcommerce.plan";
const USAGE_KEY = "fcommerce.usage.v3";

function readMockQuota(): FbPostsQuota {
  if (typeof window === "undefined") {
    return { limit: 0, used: 0, remaining: 0, resetsAt: new Date().toISOString(), locked: true };
  }
  const planId = (window.localStorage.getItem(PLAN_KEY) as PlanId | null) ?? "growth";
  const limit  = PLANS[planId]?.limits.fbPosts ?? 0;

  let used = 0;
  try {
    const u = window.localStorage.getItem(USAGE_KEY);
    if (u) used = (JSON.parse(u) as Partial<UsageStats>).fbPostsUsed ?? 0;
  } catch {
    /* ignore */
  }

  // Calendar-month reset for mock mode (no subscription window to consult).
  const next = new Date();
  next.setDate(1);
  next.setHours(0, 0, 0, 0);
  next.setMonth(next.getMonth() + 1);

  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    resetsAt: next.toISOString(),
    locked: limit === 0
  };
}

function bumpMockFbPostsUsed(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(USAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<UsageStats>) : {};
    const next: UsageStats = {
      aiUsed:      parsed.aiUsed ?? 0,
      smsUsed:     parsed.smsUsed ?? 0,
      fbPostsUsed: (parsed.fbPostsUsed ?? 0) + 1
    };
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/**
 * Per-page rate-limit check matching the backend's PostingRateLimiter.
 * Returns null if OK, or a human-readable error string.
 */
function mockRateCheck(pageId: string, scheduledAt?: string): string | null {
  const intended = scheduledAt ? new Date(scheduledAt).getTime() : Date.now();
  const posts = loadPosts().filter(
    (p) =>
      p.pageId === pageId &&
      ["queued", "scheduled", "publishing", "published"].includes(p.status)
  );

  // Effective timestamp per post (latest of published_at / scheduled_at / createdAt)
  const stamps = posts
    .map((p) => {
      const ts =
        (p.publishedAt && new Date(p.publishedAt).getTime()) ||
        (p.scheduledAt && new Date(p.scheduledAt).getTime()) ||
        (p.createdAt && new Date(p.createdAt).getTime()) ||
        0;
      return ts;
    })
    .filter((t) => t > 0)
    .sort((a, b) => b - a);

  // 1. Min-gap
  if (stamps.length > 0) {
    const earliest = stamps[0] + MOCK_MIN_GAP_SECONDS * 1000;
    if (intended < earliest) {
      const wait = Math.ceil((earliest - intended) / 1000);
      return `Posting too soon — wait ${wait}s before posting again on this page.`;
    }
  }

  // 2. Hourly bucket
  const hourCount = stamps.filter((t) => t >= intended - 3600_000 && t <= intended).length;
  if (hourCount >= MOCK_MAX_PER_HOUR) {
    return `Hourly limit reached (${MOCK_MAX_PER_HOUR}/hr) for this page.`;
  }

  // 3. Daily bucket
  const dayCount = stamps.filter((t) => t >= intended - 86_400_000 && t <= intended).length;
  if (dayCount >= MOCK_MAX_PER_DAY) {
    return `Daily limit reached (${MOCK_MAX_PER_DAY}/day) for this page.`;
  }

  return null;
}

function mockModerate(message: string): string[] {
  const violations: string[] = [];
  const lower = message.toLowerCase();
  const banned = ["like and share to win", "tag 5 friends", "comment to win"];
  for (const b of banned) {
    if (lower.includes(b)) violations.push(`Contains prohibited pattern: "${b}"`);
  }
  if (message.length > 5000) violations.push("Message exceeds 5000 characters.");
  return violations;
}
