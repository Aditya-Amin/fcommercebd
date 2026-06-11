const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL;

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("auth.token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Calls the backend to initiate an SSLCommerz payment for the given plan,
 * then redirects the browser to the SSLCommerz gateway page.
 */
export async function startSslCommerzCheckout(planId: number): Promise<void> {
  if (!LARAVEL_API_URL) throw new Error("NEXT_PUBLIC_LARAVEL_API_URL is not set.");

  const res = await fetch(`${LARAVEL_API_URL}/api/sslcommerz/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    credentials: "include",
    body: JSON.stringify({ plan_id: planId }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  const gatewayUrl: string = body.gateway_url;
  if (!gatewayUrl) throw new Error("SSLCommerz did not return a gateway URL.");

  window.location.href = gatewayUrl;
}
