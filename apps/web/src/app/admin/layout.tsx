import { cookies } from "next/headers";
import { AdminShell } from "@/components/AdminShell";
import { ADMIN_TOKEN_COOKIE, getApiBaseUrl } from "@/lib/config";

export const dynamic = "force-dynamic";

async function getMe() {
  const jar = await cookies();
  const token = jar.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token) return null;
  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as { email?: string | null };
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getMe();
  return <AdminShell email={me?.email}>{children}</AdminShell>;
}
