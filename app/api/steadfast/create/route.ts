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

export async function POST(req: NextRequest) {
  try {
    const creds = getCredentials();
    if (!creds) {
      return NextResponse.json(
        { error: "Steadfast credentials are not saved. Set them in Integrations." },
        { status: 401 }
      );
    }

    const orderData = await req.json() as {
      invoice: string;
      recipient_name: string;
      recipient_phone: string;
      recipient_address: string;
      cod_amount: number;
      alternative_phone?: string;
      note?: string;
      item_description?: string;
      delivery_type?: number;
    };

    let response: Response;
    try {
      response = await fetch(`${BASE}/create_order`, {
        method: "POST",
        headers: {
          "Api-Key": creds.apiKey,
          "Secret-Key": creds.secretKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData),
        cache: "no-store"
      });
    } catch (networkErr) {
      const msg = networkErr instanceof Error ? networkErr.message : String(networkErr);
      console.error("[steadfast/create] network error:", msg);
      return NextResponse.json(
        { error: `Could not reach Steadfast API: ${msg}` },
        { status: 502 }
      );
    }

    const rawText = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("[steadfast/create] non-JSON response:", response.status, rawText.slice(0, 300));
      return NextResponse.json(
        {
          error: `Steadfast returned an unexpected response (HTTP ${response.status}). Check your API credentials.`,
          detail: rawText.slice(0, 300)
        },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }

    if (!response.ok) {
      console.error("[steadfast/create] API error:", response.status, data);
      return NextResponse.json(
        { error: (data?.message as string) ?? "Steadfast API error.", detail: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[steadfast/create] unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error. Check the server logs for details." },
      { status: 500 }
    );
  }
}

