import productsMock from "@/lib/mock/products/products.json";
import copyMock from "@/lib/mock/products/copy.json";
import type {
  Product,
  ProductFormPayload,
  ProductListQuery,
  ProductListResponse
} from "@/lib/types/product";
import type { ProductCopy } from "@/lib/types/product-copy";

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
const USE_MOCK_API = !LARAVEL_API_URL || LARAVEL_API_URL.trim() === "";

const STORAGE_KEY = "fcommerce.mock.products.v3";

/**
 * True when the call is running on the Next.js server (no `window`) and
 * we're in real-API mode. Auth tokens live in localStorage, so the server
 * can't hit Sanctum-protected endpoints. Server fetches in this scenario
 * should return empty placeholders; the client useEffect refetches on mount
 * with the proper bearer token.
 */
function isServerSideRealMode(): boolean {
  return typeof window === "undefined" && !USE_MOCK_API;
}

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

function loadMockStore(): Product[] {
  if (typeof window === "undefined") {
    return productsMock.data as Product[];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch {
    /* ignore */
  }
  const initial = productsMock.data as Product[];
  saveMockStore(initial);
  return initial;
}

function saveMockStore(products: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch {
    /* ignore */
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ঀ-৿\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function generateId(): string {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export async function getProductCopy(): Promise<ProductCopy> {
  return copyMock as ProductCopy;
}

export async function getProducts(query: ProductListQuery = {}): Promise<ProductListResponse> {
  // Server-side in real mode: bail with empty list. ProductListView's
  // useEffect refetches with the bearer token on mount.
  if (isServerSideRealMode()) {
    return { data: [], total: 0, page: query.page ?? 1, perPage: query.perPage ?? 24 };
  }

  if (USE_MOCK_API) {
    await delay(150);
    let items = loadMockStore();

    if (query.search) {
      const q = query.search.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (query.category && query.category !== "all") {
      items = items.filter((p) => p.category === query.category);
    }
    if (query.status && query.status !== "all") {
      items = items.filter((p) => p.status === query.status);
    }

    const page = query.page ?? 1;
    const perPage = query.perPage ?? 24;
    const start = (page - 1) * perPage;
    const paged = items.slice(start, start + perPage);

    return { data: paged, total: items.length, page, perPage };
  }

  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category && query.category !== "all") params.set("category", query.category);
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.page) params.set("page", String(query.page));
  if (query.perPage) params.set("per_page", String(query.perPage));

  const res = await fetch(`${LARAVEL_API_URL}/api/products?${params.toString()}`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  return jsonOrThrow<ProductListResponse>(res);
}

export async function getProduct(id: string): Promise<Product> {
  // Server-side in real mode: throw a special "skip" error the page can
  // either catch or let bubble. For edit pages we rely on the client to
  // refetch — return a stub Product so the server render doesn't crash.
  if (isServerSideRealMode()) {
    return {
      id,
      title: "",
      slug: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
      status: "draft",
      images: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  if (USE_MOCK_API) {
    await delay(120);
    const items = loadMockStore();
    const found = items.find((p) => p.id === id);
    if (!found) throw new Error(`Product not found (${id})`);
    return found;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/products/${id}`, {
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  const body = await jsonOrThrow<{ data: Product }>(res);
  return body.data;
}

export async function createProduct(payload: ProductFormPayload): Promise<Product> {
  if (USE_MOCK_API) {
    await delay(400);
    const items = loadMockStore();
    const now = new Date().toISOString();
    const product: Product = {
      id: generateId(),
      slug: slugify(payload.title),
      title: payload.title,
      description: payload.description,
      shortDescription: payload.shortDescription,
      price: payload.price,
      comparePrice: payload.comparePrice,
      stock: payload.stock,
      category: payload.category,
      status: payload.stock === 0 ? "out_of_stock" : payload.status,
      images: payload.images,
      tags: payload.tags,
      createdAt: now,
      updatedAt: now
    };
    saveMockStore([product, ...items]);
    return product;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders()
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  const body = await jsonOrThrow<{ data: Product }>(res);
  return body.data;
}

export async function updateProduct(
  id: string,
  payload: ProductFormPayload
): Promise<Product> {
  if (USE_MOCK_API) {
    await delay(400);
    const items = loadMockStore();
    const idx = items.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Product not found (${id})`);
    const updated: Product = {
      ...items[idx],
      ...payload,
      slug: slugify(payload.title),
      status: payload.stock === 0 ? "out_of_stock" : payload.status,
      updatedAt: new Date().toISOString()
    };
    items[idx] = updated;
    saveMockStore(items);
    return updated;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders()
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });
  const body = await jsonOrThrow<{ data: Product }>(res);
  return body.data;
}

export async function deleteProduct(id: string): Promise<void> {
  if (USE_MOCK_API) {
    await delay(250);
    const items = loadMockStore();
    saveMockStore(items.filter((p) => p.id !== id));
    return;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/products/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include"
  });
  if (!res.ok) await jsonOrThrow(res);
}

export async function uploadProductImage(file: File): Promise<{ id: string; url: string }> {
  if (USE_MOCK_API) {
    await delay(500);
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return { id: "img_" + Date.now().toString(36), url };
  }

  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${LARAVEL_API_URL}/api/products/upload-image`, {
    method: "POST",
    headers: { Accept: "application/json", ...authHeaders() },
    credentials: "include",
    body: form
  });
  const body = await jsonOrThrow<{ data: { id: string; url: string } }>(res);
  return body.data;
}
