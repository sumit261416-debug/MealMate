"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MealMateLogo } from "@/components/MealMateLogo";
import { Badge, partnerTone } from "@/components/ui";

type PartnerProfile = {
  id: string;
  businessName: string;
  status: string;
  contactEmail: string | null;
  contactPhone: string | null;
};

const NAV_ITEMS = [
  { href: "/partner", label: "Live Kitchen", icon: "🍳" },
  { href: "/partner/orders", label: "Orders", icon: "📦" },
  { href: "/partner/menu", label: "Menu & Items", icon: "📋" },
  { href: "/partner/subscriptions", label: "Subscriptions", icon: "📅" },
  { href: "/partner/payouts", label: "Payouts", icon: "💰" },
  { href: "/partner/profile", label: "Kitchen Profile", icon: "🏢" },
];

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.partner) {
          setPartner(data.partner);
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg, #f4faf6)" }}>
      {/* Top Header */}
      <header
        style={{
          background: "linear-gradient(135deg, #062b1e 0%, #0d4a34 100%)",
          color: "#ffffff",
          padding: "0.85rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px rgba(6, 43, 30, 0.25)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Link href="/partner" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <MealMateLogo size={36} className="brand-logo" />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "#ffffff", letterSpacing: "-0.02em" }}>
                  Meal<span style={{ color: "#34d399" }}>Mate</span>
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background: "rgba(52, 211, 153, 0.2)",
                    color: "#6ee7b7",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "6px",
                    border: "1px solid rgba(52, 211, 153, 0.3)",
                  }}
                >
                  Partner Portal
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.72)" }}>
                {partner?.businessName || "Kitchen Operator Workspace"}
              </p>
            </div>
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {partner?.status && (
            <Badge tone={partnerTone(partner.status)}>
              Status: {partner.status}
            </Badge>
          )}
          <button
            type="button"
            className="btn ghost"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            style={{
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "10px",
              padding: "0.45rem 0.85rem",
              fontSize: "0.85rem",
            }}
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>

      {/* Navigation Sub-Bar */}
      <nav
        style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(22, 48, 34, 0.1)",
          padding: "0 1.5rem",
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.85rem 1rem",
                fontSize: "0.9rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--brand, #1a7a52)" : "var(--muted, #64748b)",
                textDecoration: "none",
                borderBottom: isActive ? "3px solid var(--brand, #1a7a52)" : "3px solid transparent",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Page Area */}
      <main style={{ flex: 1, padding: "1.75rem 1.5rem", maxWidth: "1280px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {children}
      </main>
    </div>
  );
}
