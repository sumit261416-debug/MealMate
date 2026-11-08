"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { formatInrFromPaise } from "@/lib/format";
import { EmptyState, ErrorBanner, PageHeader } from "@/components/ui";
import "./dashboard.css";

type Dashboard = {
  pendingPartners: number;
  approvedPartners: number;
  openOrders: number;
  openTickets: number;
  customers: number;
  menusPendingReview: number;
  refundRequested: number;
  unassignedDeliveries: number;
  ordersBySlot: { code: string; displayName: string; openOrders: number }[];
  charts?: {
    ordersByStatus: { status: string; count: number }[];
    paymentsByStatus: { status: string; count: number; amountPaise: number }[];
  };
};

type Metric = {
  key: string;
  label: string;
  value: number;
  hint: string;
  href: string;
  tone: string;
};

const slotFill: Record<string, string> = {
  breakfast: "mm-dash-fill-breakfast",
  lunch: "mm-dash-fill-lunch",
  dinner: "mm-dash-fill-dinner",
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setData(await adminFetch<Dashboard>("/dashboard"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const metrics: Metric[] = useMemo(() => {
    if (!data) return [];
    return [
      {
        key: "pending",
        label: "Pending partners",
        value: data.pendingPartners,
        hint: "Awaiting review",
        href: "/admin/partners?status=submitted",
        tone: "mm-dash-tone-warn",
      },
      {
        key: "orders",
        label: "Open orders",
        value: data.openOrders,
        hint: "Across all slots",
        href: "/admin/orders",
        tone: "mm-dash-tone-accent",
      },
      {
        key: "refunds",
        label: "Refund requests",
        value: data.refundRequested ?? 0,
        hint: "Needs decision",
        href: "/admin/refunds?status=requested",
        tone: "mm-dash-tone-warn",
      },
      {
        key: "deliveries",
        label: "Unassigned deliveries",
        value: data.unassignedDeliveries ?? 0,
        hint: "Manual assign",
        href: "/admin/deliveries?status=unassigned",
        tone: "mm-dash-tone-info",
      },
      {
        key: "tickets",
        label: "Open tickets",
        value: data.openTickets,
        hint: "Support queue",
        href: "/admin/support",
        tone: "mm-dash-tone-warn",
      },
      {
        key: "menus",
        label: "Menus to review",
        value: data.menusPendingReview,
        hint: "Not published yet",
        href: "/admin/menus",
        tone: "mm-dash-tone-info",
      },
    ];
  }, [data]);

  const ordersByStatus = data?.charts?.ordersByStatus ?? [];
  const paymentsByStatus = data?.charts?.paymentsByStatus ?? [];
  const totalSlotOrders =
    data?.ordersBySlot.reduce((sum, slot) => sum + slot.openOrders, 0) ?? 0;
  const maxOrderStatus = Math.max(1, ...ordersByStatus.map((row) => row.count), 1);
  const maxPaymentAmount = Math.max(
    1,
    ...paymentsByStatus.map((row) => row.amountPaise),
    1,
  );

  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return (
    <div>
      <PageHeader
        title="Operations dashboard"
        description="Live pulse of the MealMate pilot — partners, meals, refunds, and delivery."
        actions={
          <button
            type="button"
            className="btn secondary"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}
      {loading && !data ? <EmptyState message="Loading dashboard…" /> : null}

      {data ? (
        <>
          <section className="mm-dash-hero">
            <div>
              <p className="mm-dash-kicker">{todayLabel} · Asia/Kolkata</p>
              <h2 className="mm-dash-title">Pilot control room</h2>
              <p className="mm-dash-copy">
                Action queue for kitchen approvals, refunds, unassigned
                deliveries, and open meal orders.
              </p>
            </div>
            <div className="mm-dash-pills">
              <div className="mm-dash-pill">
                <span className="mm-dash-pill-label">Open work</span>
                <span className="mm-dash-pill-value">
                  {(data.pendingPartners ?? 0) +
                    (data.menusPendingReview ?? 0) +
                    (data.openTickets ?? 0) +
                    (data.refundRequested ?? 0)}
                </span>
              </div>
              <div className="mm-dash-pill">
                <span className="mm-dash-pill-label">Active orders</span>
                <span className="mm-dash-pill-value">{data.openOrders}</span>
              </div>
              <div className="mm-dash-pill">
                <span className="mm-dash-pill-label">Live kitchens</span>
                <span className="mm-dash-pill-value">{data.approvedPartners}</span>
              </div>
            </div>
          </section>

          <section className="mm-dash-metrics">
            {metrics.map((metric) => (
              <Link
                key={metric.key}
                href={metric.href}
                className={`mm-dash-metric ${metric.tone}`}
              >
                <div className="mm-dash-metric-top">
                  <span className="mm-dash-metric-label">{metric.label}</span>
                  <span className="mm-dash-metric-arrow" aria-hidden>
                    →
                  </span>
                </div>
                <p className="mm-dash-metric-value">{metric.value}</p>
                <p className="mm-dash-metric-hint">{metric.hint}</p>
              </Link>
            ))}
          </section>

          <section className="mm-dash-grid">
            <div className="mm-dash-card">
              <div className="mm-dash-section-head">
                <div>
                  <h2>Orders by meal slot</h2>
                  <p>Open breakfast / lunch / dinner load.</p>
                </div>
                <Link className="btn secondary" href="/admin/orders">
                  View orders
                </Link>
              </div>
              <div className="mm-dash-slots">
                {data.ordersBySlot.map((slot) => {
                  const pct =
                    totalSlotOrders > 0
                      ? Math.round((slot.openOrders / totalSlotOrders) * 100)
                      : 0;
                  const width = slot.openOrders > 0 ? Math.max(pct, 12) : 0;
                  return (
                    <div key={slot.code} className="mm-dash-slot">
                      <div className="mm-dash-slot-top">
                        <span className="mm-dash-slot-name">{slot.displayName}</span>
                        <span className="mm-dash-slot-count">{slot.openOrders}</span>
                      </div>
                      <div className="mm-dash-slot-bar" aria-hidden>
                        <span
                          className={`mm-dash-slot-fill ${slotFill[slot.code] ?? "mm-dash-fill-lunch"}`}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <p className="mm-dash-slot-meta">
                        {totalSlotOrders === 0
                          ? "No open orders"
                          : `${pct}% of open orders`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mm-dash-card">
              <div className="mm-dash-section-head">
                <div>
                  <h2>Ops charts</h2>
                  <p>Lightweight status mix — not a full analytics CMS.</p>
                </div>
              </div>
              <div className="mm-dash-chart-block">
                <h3>Orders by status</h3>
                {ordersByStatus.length === 0 ? (
                  <p className="mm-dash-slot-meta">No order status data.</p>
                ) : (
                  ordersByStatus.map((row) => (
                    <div key={row.status} className="mm-dash-chart-row">
                      <span>{row.status}</span>
                      <div className="mm-dash-chart-track">
                        <span
                          style={{
                            width: `${Math.max(8, (row.count / maxOrderStatus) * 100)}%`,
                          }}
                        />
                      </div>
                      <strong>{row.count}</strong>
                    </div>
                  ))
                )}
              </div>
              <div className="mm-dash-chart-block">
                <h3>Payments by status</h3>
                {paymentsByStatus.length === 0 ? (
                  <p className="mm-dash-slot-meta">No payment rows yet.</p>
                ) : (
                  paymentsByStatus.map((row) => (
                    <div key={row.status} className="mm-dash-chart-row">
                      <span>{row.status}</span>
                      <div className="mm-dash-chart-track">
                        <span
                          style={{
                            width: `${Math.max(
                              8,
                              (row.amountPaise / maxPaymentAmount) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <strong>{formatInrFromPaise(row.amountPaise)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
