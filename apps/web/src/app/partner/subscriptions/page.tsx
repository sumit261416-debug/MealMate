"use client";

import { useEffect, useState, useTransition } from "react";
import { partnerFetch } from "@/lib/partner-api";
import { formatInrFromPaise } from "@/lib/format";
import { Badge, EmptyState, ErrorBanner, PageHeader } from "@/components/ui";

type Subscription = {
  id: string;
  status: string;
  mealsTotal: number;
  mealsRemaining: number;
  pricePaise: number;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  customer: {
    id: string;
    fullName: string | null;
    phone: string | null;
  };
};

type SubscriptionsResponse = {
  summary: {
    activeCount: number;
    pausedCount: number;
    totalRemainingMeals: number;
  };
  items: Subscription[];
};

export default function PartnerSubscriptionsPage() {
  const [data, setData] = useState<SubscriptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function loadSubscriptions() {
    setLoading(true);
    startTransition(() => {
      partnerFetch<SubscriptionsResponse>("/subscriptions")
        .then((res) => {
          setData(res);
          setError(null);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    });
  }

  useEffect(() => {
    loadSubscriptions();
  }, []);

  return (
    <div>
      <PageHeader
        title="Meal Subscriptions Fulfilment"
        description="Monitor ongoing weekly/monthly meal plan subscribers, remaining meal balances, and pause/skip statuses."
        actions={
          <button className="btn secondary" type="button" onClick={loadSubscriptions}>
            Refresh
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="panel" style={{ borderLeft: "4px solid #10b981" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>Active Subscriptions</span>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>
              {data.summary.activeCount}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>Serving daily</span>
          </div>

          <div className="panel" style={{ borderLeft: "4px solid #f59e0b" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>Paused Subscribers</span>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#d97706", marginTop: "0.25rem" }}>
              {data.summary.pausedCount}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>Skipping meals</span>
          </div>

          <div className="panel" style={{ borderLeft: "4px solid #3b82f6" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>Total Remaining Meals</span>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#2563eb", marginTop: "0.25rem" }}>
              {data.summary.totalRemainingMeals}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>Committed meals pipeline</span>
          </div>
        </div>
      )}

      <div className="panel">
        {loading && <div className="empty-state">Loading subscriptions…</div>}
        {!loading && (!data || data.items.length === 0) && (
          <EmptyState message="No customer meal subscriptions active for your kitchen yet." />
        )}
        {!loading && data && data.items.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Subscriber</th>
                  <th>Contact</th>
                  <th>Meals Balance</th>
                  <th>Start Date</th>
                  <th>Plan Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <strong>{sub.customer.fullName || "Subscriber"}</strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted, #64748b)" }}>
                        ID: #{sub.id.slice(-6).toUpperCase()}
                      </div>
                    </td>
                    <td>{sub.customer.phone || "—"}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: "var(--brand, #1a7a52)" }}>
                        {sub.mealsRemaining}
                      </span>{" "}
                      / {sub.mealsTotal} meals left
                    </td>
                    <td>{new Date(sub.startDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td>
                      <strong>{formatInrFromPaise(sub.pricePaise)}</strong>
                    </td>
                    <td>
                      <Badge tone={sub.status === "active" ? "ok" : sub.status === "paused" ? "warn" : "info"}>
                        {sub.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
