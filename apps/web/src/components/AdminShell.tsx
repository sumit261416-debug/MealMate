"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MealMateLogo } from "@/components/MealMateLogo";
import { PageTransition } from "@/components/PageTransition";

const STORAGE_KEY = "mm-admin-sidebar-collapsed";

type NavIcon =
  | "dashboard"
  | "partners"
  | "customers"
  | "menus"
  | "orders"
  | "deliveries"
  | "refunds"
  | "payments"
  | "config"
  | "support"
  | "audit";

const links: { href: string; label: string; hint: string; icon: NavIcon }[] = [
  { href: "/admin", label: "Dashboard", hint: "Ops overview", icon: "dashboard" },
  { href: "/admin/partners", label: "Partners", hint: "Kitchen review", icon: "partners" },
  { href: "/admin/customers", label: "Customers", hint: "Accounts", icon: "customers" },
  { href: "/admin/menus", label: "Menus", hint: "Publish control", icon: "menus" },
  { href: "/admin/orders", label: "Orders", hint: "Fulfilment", icon: "orders" },
  { href: "/admin/deliveries", label: "Deliveries", hint: "Manual assign", icon: "deliveries" },
  { href: "/admin/refunds", label: "Refunds", hint: "Approve queue", icon: "refunds" },
  { href: "/admin/payments", label: "Payments", hint: "Reconcile", icon: "payments" },
  { href: "/admin/service-config", label: "Service config", hint: "Areas & slots", icon: "config" },
  { href: "/admin/support", label: "Support", hint: "Tickets", icon: "support" },
  { href: "/admin/audit", label: "Audit log", hint: "Trail", icon: "audit" },
];

function NavGlyph({ name }: { name: NavIcon }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "partners":
      return (
        <svg {...common}>
          <path d="M3 21V8l9-5 9 5v13" />
          <path d="M9 21V12h6v9" />
        </svg>
      );
    case "customers":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3.5 20c.8-3.2 2.9-5 5.5-5s4.7 1.8 5.5 5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 15.2c1.7.3 3.1 1.4 3.8 3.8" />
        </svg>
      );
    case "menus":
      return (
        <svg {...common}>
          <path d="M6 4h11a2 2 0 0 1 2 2v14l-7.5-3L4 20V6a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <path d="M6 7h12l-1 12H7L6 7z" />
          <path d="M9 7V5.5A3 3 0 0 1 12 2.5 3 3 0 0 1 15 5.5V7" />
        </svg>
      );
    case "deliveries":
      return (
        <svg {...common}>
          <path d="M3 7h11v10H3z" />
          <path d="M14 10h4l3 3v4h-7" />
          <circle cx="7" cy="19" r="2" />
          <circle cx="17" cy="19" r="2" />
        </svg>
      );
    case "refunds":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 1 0 2.3-5.7" />
          <path d="M4 4v5h5" />
        </svg>
      );
    case "payments":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 15h4" />
        </svg>
      );
    case "config":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2.2M12 18.8V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.2M18.8 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
        </svg>
      );
    case "support":
      return (
        <svg {...common}>
          <path d="M7 11V9a5 5 0 0 1 10 0v2" />
          <path d="M5 11h2v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2zM17 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2z" />
          <path d="M12 19v2" />
        </svg>
      );
    case "audit":
      return (
        <svg {...common}>
          <path d="M8 6h12M8 12h12M8 18h8" />
          <circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div
      className={[
        "admin-shell",
        collapsed ? "sidebar-collapsed" : "sidebar-expanded",
        ready ? "sidebar-ready" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="sidebar-top">
          <div className="brand-block">
            <div className="brand-row">
              <MealMateLogo size={36} className="brand-logo" />
              <div className="brand-copy">
                <p className="brand brand-full">MealMate</p>
                <p className="brand-sub">Admin console</p>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-expanded={!collapsed}
          aria-controls="admin-side-nav"
          title={collapsed ? "Expand menu" : "Collapse menu"}
        >
          <span className="sidebar-toggle-icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="sr-only">
            {collapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </button>

        <nav id="admin-side-nav" aria-label="Admin">
          {links.map((link, index) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "nav-link active" : "nav-link"}
                style={{ animationDelay: `${0.05 + index * 0.03}s` }}
                title={collapsed ? link.label : undefined}
                data-tooltip={link.label}
              >
                <span className="nav-icon">
                  <NavGlyph name={link.icon} />
                </span>
                <span className="nav-label">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="muted sidebar-email" title={email ?? undefined}>
            {email}
          </p>
          <button
            type="button"
            className="btn ghost sidebar-logout"
            onClick={() => void logout()}
            title="Sign out"
          >
            <span className="logout-icon" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <path
                  d="M14 16l4-4-4-4M18 12H9"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="nav-label">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
