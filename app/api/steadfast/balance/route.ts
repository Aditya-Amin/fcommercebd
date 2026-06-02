import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = "https://portal.packzy.com/api/v1";

function getCredentials(): { apiKey: string; secretKey: string } | null {
  try {
    const raw = cookies().get("sf_creds")?.value;
    if (!raw) return null;
    const p = JSON.parse(raw) as { apiKey?: string; secretKey?: string };
    if (p.apiKey && p.secretKey) return { apiKey: p.apiKey, secretKey: p.secretKey };
  } catch { /* ignore */ }
  return null;
}

export async function GET() {
  try {
    const creds = getCredentials();
    if (!creds) {
      return NextResponse.json(
        { error: "Steadfast credentials are not saved. Set them in Integrations." },
        { status: 401 }
      );
    }

    const response = await fetch(`${BASE}/get_balance`, {
      headers: {
        "Api-Key": creds.apiKey,
        "Secret-Key": creds.secretKey,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    const rawText = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("[steadfast/balance] non-JSON response:", response.status, rawText.slice(0, 300));
      return NextResponse.json(
        { error: `Steadfast returned an unexpected response (HTTP ${response.status}). Check your API credentials.` },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: (data?.message as string) ?? "Invalid credentials or API error." },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Steadfast API. Check your internet connection." },
      { status: 500 }
    );
  }
}
