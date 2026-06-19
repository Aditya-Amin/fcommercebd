const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL;
const USE_MOCK_API = !LARAVEL_API_URL || LARAVEL_API_URL.trim() === "";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("auth.token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (body as { message?: string }).message ??
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}

/**
 * Generate a refined DALL-E style image prompt from a user topic.
 * Used in Human Edit mode so the user can review/edit before generating.
 */
export async function generateImagePrompt(payload: {
  topic: string;
  language: "en" | "bn";
}): Promise<string> {
  if (USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 600));
    return `A professional, high-quality product photo of ${payload.topic}. Clean white background, studio lighting, sharp focus, commercial photography style.`;
  }

  const res = await fetch(`${LARAVEL_API_URL}/api/image/generate-prompt`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const body = await jsonOrThrow<{ data: { prompt: string } }>(res);
  return body.data.prompt;
}

/**
 * Poll the job status endpoint until done or failed.
 * Interval: 3 seconds, max 120 seconds total.
 */
async function pollImageJob(jobId: string): Promise<string> {
  const maxAttempts = 40;
  const intervalMs = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const res = await fetch(`${LARAVEL_API_URL}/api/image/status/${jobId}`, {
      headers: { Accept: "application/json", ...authHeaders() },
      credentials: "include",
    });

    if (!res.ok) continue;

    const body = await res.json() as { data: { status: string; url?: string; message?: string } };
    const { status, url, message } = body.data;

    if (status === "done" && url) return url;
    if (status === "failed") throw new Error(message ?? "Image generation failed");
  }

  throw new Error("Image generation timed out. Please try again.");
}

/**
 * Generate or edit an image (async via queue).
 * Returns the public URL of the result after polling for completion.
 */
export async function generateImage(payload: {
  prompt: string;
  image_url?: string;
}): Promise<string> {
  if (USE_MOCK_API) {
    await new Promise((r) => setTimeout(r, 1200));
    const encoded = encodeURIComponent(payload.prompt.slice(0, 40));
    return `https://placehold.co/1024x1024/6366f1/ffffff?text=${encoded}`;
  }

  // Dispatch the job — returns immediately with a job_id.
  const res = await fetch(`${LARAVEL_API_URL}/api/image/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const body = await jsonOrThrow<{ data: { job_id: string } }>(res);

  // Poll until the background worker finishes.
  return pollImageJob(body.data.job_id);
}
