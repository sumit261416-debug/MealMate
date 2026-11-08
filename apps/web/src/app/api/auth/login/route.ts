import { NextResponse } from "next/server";
import { ADMIN_TOKEN_COOKIE, getApiBaseUrl } from "@/lib/config";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const upstream = await fetch(`${getApiBaseUrl()}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      { error: data.error ?? "Login failed", code: data.code },
      { status: upstream.status },
    );
  }

  const response = NextResponse.json({
    user: data.user,
    partner: data.partner,
  });

  response.cookies.set({
    name: ADMIN_TOKEN_COOKIE,
    value: data.accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
