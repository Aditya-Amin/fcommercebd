import { NextRequest, NextResponse } from "next/server";
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

export async function GET(req: NextRequest) {
  try {
    const creds = getCredentials();
    if (!creds) {
      return NextResponse.json(
        { error: "Steadfast credentials are not saved. Set them in Integrations." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const trackingCode = searchParams.get("trackingCode");
    const consignmentId = searchParams.get("consignmentId");

    let path: string;
    if (trackingCode) {
      path = `/status_by_trackingcode/${encodeURIComponent(trackingCode)}`;
    } else if (consignmentId) {
      path = `/status_by_cid/${encodeURIComponent(consignmentId)}`;
    } else {
      return NextResponse.json({ error: "Provide trackingCode or consignmentId." }, { status: 400 });
    }

    const response = await fetch(`${BASE}${path}`, {
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
      console.error("[steadfast/status] non-JSON response:", response.status, rawText.slice(0, 300));
      return NextResponse.json(
        { error: `Steadfast returned an unexpected response (HTTP ${response.status}).` },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: (data?.message as string) ?? "Steadfast API error.", detail: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Steadfast API." },
      { status: 500 }
    );
  }
}
