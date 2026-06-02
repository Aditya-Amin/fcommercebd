/**
 * API client for the marketing site.
 *
 * Right now every endpoint resolves to a local mock JSON file. When the
 * Laravel backend is ready, set NEXT_PUBLIC_API_BASE_URL and flip
 * USE_MOCK_API to false (or remove the flag) — every page will then pull
 * its content from the real API without any further component changes.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const USE_MOCK_API =
  !API_BASE_URL || process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

export interface ApiOptions {
  revalidate?: number;
}

export async function apiFetch<T>(
  endpoint: string,
  mockLoader: () => Promise<T> | T,
  options: ApiOptions = {}
): Promise<T> {
  if (USE_MOCK_API) {
    return Promise.resolve(mockLoader());
  }

  const url = `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
  const res = await fetch(url, {
    next: { revalidate: options.revalidate ?? 3600 },
    headers: { Accept: "application/json" }
  });

  if (!res.ok) {
    throw new Error(
      `API request failed: ${res.status} ${res.statusText} (${url})`
    );
  }

  const json = (await res.json()) as { data?: T } | T;
  return (json as { data?: T }).data ?? (json as T);
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
  useMock: USE_MOCK_API
};
