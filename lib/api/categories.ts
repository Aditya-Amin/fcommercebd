import categoriesMock from "@/lib/mock/products/categories.json";
import type { Category } from "@/lib/types/product";

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
const USE_MOCK_API = !LARAVEL_API_URL || LARAVEL_API_URL.trim() === "";

const STORAGE_KEY = "fcommerce.mock.categories";

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
      (body as { message?: string } | null)?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

function loadStore(): Category[] {
  if (typeof window === "undefined") return categoriesMock.data as Category[];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Category[];
  } catch {
    /* ignore */
  }
  const seed = categoriesMock.data as Category[];
  saveStore(seed);
  return seed;
}

function saveStore(items: Category[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCK_API) {
    await delay(80);
    return loadStore();
  }
  const res = await fetch(`${LARAVEL_API_URL}/api/categories`, {
    headers: { Accept: "application/json" }
  });
  const body = await jsonOrThrow<{ data: Category[] }>(res);
  return body.data;
}

export async function createCategory(name: string): Promise<Category> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required.");

  if (USE_MOCK_API) {
    await delay(200);
    const items = loadStore();
    const slug = slugify(trimmed);
    if (items.some((c) => c.slug === slug)) {
      throw new Error("A category with this name already exists.");
    }
    const created: Category = {
      id: "cat_" + Date.now().toString(36),
      slug,
      name: trimmed
    };
    saveStore([...items, created]);
    return created;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders()
    },
    credentials: "include",
    body: JSON.stringify({ name: trimmed })
  });
  const body = await jsonOrThrow<{ data: Category }>(res);
  return body.data;
}
