"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorBanner } from "@/components/ui";
import { MealMateLogo } from "@/components/MealMateLogo";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("admin@mealmate.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? "Login failed");
      }
      const next = search.get("next");
      if (next) {
        router.replace(next);
      } else if (
        data.user?.roles?.includes("kitchen_partner") &&
        !data.user?.roles?.includes("admin")
      ) {
        router.replace("/partner");
      } else {
        router.replace("/admin");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setShaking(true);
      window.setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(userType: "admin" | "partner") {
    if (userType === "admin") {
      setEmail("admin@mealmate.local");
      setPassword("ChangeMe-Admin-2026!");
    } else {
      setEmail("kitchen.demo@mealmate.local");
      setPassword("ChangeMe-Admin-2026!");
    }
    setError(null);
  }

  return (
    <div className="login-page">
      <section className="login-hero" aria-label="MealMate">
        <div className="login-hero-bg" aria-hidden />
        <div className="login-hero-content">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.85rem" }}>
            <MealMateLogo size={52} className="brand-logo" />
            <div>
              <p className="brand" style={{ margin: 0, lineHeight: 1.1 }}>
                Meal<span style={{ color: "#34d399" }}>Mate</span>
              </p>
              <p className="login-hero-tag" style={{ margin: 0 }}>Delhi NCR · daily tiffin marketplace</p>
            </div>
          </div>
          <p className="login-hero-copy">
            MealMate connects verified home kitchens with bachelors, PG
            residents, and working professionals who want reliable everyday
            meals — not last-minute food chaos.
          </p>
          <p className="login-hero-copy secondary">
            Unified portal for operations staff and kitchen partners. Admin staff
            oversee approvals, service areas, and customer support, while kitchen
            partners manage live slot orders, meal prep, and daily menu capacity.
          </p>
          <ul className="login-hero-points">
            <li>
              <strong>Live kitchen order queue</strong>
              <span>
                Kitchen operators accept incoming orders, start cooking, and signal
                ready for delivery across breakfast, lunch, and dinner slots.
              </span>
            </li>
            <li>
              <strong>Menu items & portion capacity</strong>
              <span>
                Toggle daily dishes In Stock or Sold Out instantly to prevent kitchen
                overload.
              </span>
            </li>
            <li>
              <strong>Transparent earnings & payouts</strong>
              <span>
                Traceable order ledger with automatic platform fee deduction and
                settlement cycle tracking.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="login-panel">
        <form
          className={shaking ? "login-card anim-shake" : "login-card"}
          onSubmit={onSubmit}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <MealMateLogo size={42} className="brand-logo" />
            <div>
              <p className="login-eyebrow" style={{ margin: 0 }}>MealMate Unified Portal</p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-muted)" }}>Admin & Kitchen Partners</p>
            </div>
          </div>
          <h1 style={{ marginTop: "0.25rem" }}>Welcome back</h1>
          <p className="muted login-desc">
            Sign in with your registered MealMate staff or kitchen partner account.
            The portal automatically opens your assigned workspace.
          </p>
          {error ? <ErrorBanner message={error} shake /> : null}

          {/* Quick Demo Switcher */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              margin: "1rem 0 0.5rem",
              background: "rgba(22, 48, 34, 0.04)",
              padding: "0.4rem",
              borderRadius: "10px",
            }}
          >
            <button
              type="button"
              className="btn secondary"
              onClick={() => fillDemo("admin")}
              style={{ flex: 1, fontSize: "0.78rem", padding: "0.35rem 0.5rem", height: "auto" }}
            >
              Demo: Admin Portal
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => fillDemo("partner")}
              style={{ flex: 1, fontSize: "0.78rem", padding: "0.35rem 0.5rem", height: "auto" }}
            >
              Demo: Kitchen Partner
            </button>
          </div>

          <div className="field" style={{ marginTop: "1rem" }}>
            <label htmlFor="email">Work / Kitchen Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className={loading ? "btn loading" : "btn"}
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in to workspace"}
          </button>
          <p className="login-footnote">
            Sessions expire automatically. Keep your credentials secure.
          </p>
        </form>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <section className="login-hero">
            <div className="login-hero-bg" />
          </section>
          <section className="login-panel">
            <div className="login-card anim-fade">Loading…</div>
          </section>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
