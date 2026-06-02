import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE = "sf_creds";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge
  };
}

/** Returns whether credentials are currently saved — never exposes the actual keys */
export async function GET() {
  try {
    const raw = cookies().get(COOKIE)?.value;
    if (!raw) return NextResponse.json({ connected: false });
    const p = JSON.parse(raw) as { apiKey?: string; secretKey?: string };
    return NextResponse.json({ connected: !!(p.apiKey && p.secretKey) });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

/** Saves credentials to a server-side httpOnly cookie */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { apiKey?: string; secretKey?: string };
    const apiKey = body.apiKey?.trim() ?? "";
    const secretKey = body.secretKey?.trim() ?? "";

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: "Both API Key and Secret Key are required." },
        { status: 400 }
      );
    }

    const res = NextResponse.json({ connected: true });
    res.cookies.set(
      COOKIE,
      JSON.stringify({ apiKey, secretKey }),
      cookieOptions(365 * 24 * 60 * 60)
    );
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}

/** Clears saved credentials */
export async function DELETE() {
  const res = NextResponse.json({ connected: false });
  res.cookies.set(COOKIE, "", cookieOptions(0));
  return res;
}
