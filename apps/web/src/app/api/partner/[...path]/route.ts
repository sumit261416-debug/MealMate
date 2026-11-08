import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_TOKEN_COOKIE, getApiBaseUrl } from "@/lib/config";

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  const jar = await cookies();
  const token = jar.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const target = `${getApiBaseUrl()}/v1/partner/${path.join("/")}${url.search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "*/*",
  };

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type");
    if (contentType) headers["Content-Type"] = contentType;
    init.body = await request.text();
  }

  const upstream = await fetch(target, init);
  const contentType =
    upstream.headers.get("Content-Type") ?? "application/json";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await upstream.text() : await upstream.arrayBuffer();

  const responseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": upstream.headers.get("Cache-Control") ?? "no-store",
  };
  const disposition = upstream.headers.get("Content-Disposition");
  if (disposition) responseHeaders["Content-Disposition"] = disposition;

  return new NextResponse(body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
