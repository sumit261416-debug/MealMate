"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { partnerFetch } from "@/lib/partner-api";
import { formatInrFromPaise } from "@/lib/format";
import { Badge, EmptyState, ErrorBanner, PageHeader, partnerTone } from "@/components/ui";

type DashboardData = {
  partner: {
    id: string;
    businessName: string;
    status: string;
    serviceAreas: { serviceArea: { name: string } }[];
  };
  counts: {
    needsAcceptance: number;
    cooking: number;
    accepted: number;
    readyForPickup: number;
    activeSubscriptions: number;
    todayMealsCount: number;
    todayGrossPaise: number;
  };
  ordersBySlot: {
    code: string;
    displayName: string;
    cutoffHour: number;
    cutoffMinute: number;
    openOrders: number;
    needsAttention: number;
  }[];
};

type LiveOrder = {
  id: string;
  status: string;
  totalPaise: number;
  subtotalPaise: number;
  createdAt: string;
  allowedTransitions: string[];
  mealSlot?: { code: string; displayName: string };
  items: { id: string; nameSnapshot: string; quantity: number }[];
  address?: {
    pgName: string | null;
    roomFlat: string | null;
    line1: string;
    landmark: string | null;
    instructions: string | null;
  };
  deliveryTask?: { assigneeName: string | null; status: string } | null;
};

export default function PartnerLiveKitchenPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [liveOrders, setLiveOrders] = useState<LiveOrder[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function loadData() {
    startTransition(() => {
      Promise.all([
        partnerFetch<DashboardData>("/dashboard"),
        partnerFetch<{ items: LiveOrder[] }>("/orders?pageSize=20"),
      ])
        .then(([dash, ordersRes]) => {
          setData(dash);
          // Filter to actionable open orders
          setLiveOrders(
            ordersRes.items.filter((o) =>
              ["placed", "accepted", "preparing", "ready"].includes(o.status),
            ),
          );
        })
        .catch((err: Error) => setError(err.message));
    });
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000); // 15s auto-refresh for live kitchen
    return () => clearInterval(interval);
  }, []);

  async function handleStatusTransition(orderId: string, nextStatus: string) {
    setActionBusyId(orderId);
    setError(null);
    try {
      await partnerFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setActionBusyId(null);
    }
  }

  const filteredOrders = liveOrders.filter((o) => {
    if (selectedSlot === "all") return true;
    return o.mealSlot?.code === selectedSlot;
  });

  return (
    <div>
      <PageHeader
        title="Live Kitchen Operations"
        description="Monitor real-time daily orders across meal slots, accept incoming orders, and signal ready for delivery pickup."
        actions={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn secondary" type="button" onClick={() => loadData()}>
              Refresh Feed
            </button>
            <Link className="btn primary" href="/partner/menu">
              Manage Menu Items
            </Link>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Top Operational Metrics */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="panel" style={{ borderLeft: "4px solid #f59e0b" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>Needs Acceptance</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#d97706", marginTop: "0.25rem" }}>
              {data.counts.needsAcceptance}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>New placed orders</span>
          </div>

          <div className="panel" style={{ borderLeft: "4px solid #3b82f6" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>Cooking in Progress</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#2563eb", marginTop: "0.25rem" }}>
              {data.counts.cooking + data.counts.accepted}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>Accepted & preparing</span>
          </div>

          <div className="panel" style={{ borderLeft: "4px solid #10b981" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>Ready for Pickup</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>
              {data.counts.readyForPickup}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>Awaiting delivery partner</span>
          </div>

          <div className="panel" style={{ borderLeft: "4px solid #8b5cf6" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>Active Subscriptions</span>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#7c3aed", marginTop: "0.25rem" }}>
              {data.counts.activeSubscriptions}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>Recurring daily meals</span>
          </div>
        </div>
      )}

      {/* Meal Slot Breakdown Tabs */}
      {data && (
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          <button
            type="button"
            className={`btn ${selectedSlot === "all" ? "primary" : "secondary"}`}
            onClick={() => setSelectedSlot("all")}
          >
            All Live Slots ({liveOrders.length})
          </button>
          {data.ordersBySlot.map((slot) => (
            <button
              key={slot.code}
              type="button"
              className={`btn ${selectedSlot === slot.code ? "primary" : "secondary"}`}
              onClick={() => setSelectedSlot(slot.code)}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
            >
              <span>{slot.displayName}</span>
              <span
                style={{
                  background: selectedSlot === slot.code ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.08)",
                  padding: "0.1rem 0.45rem",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {slot.openOrders}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Actionable Live Order Queue */}
      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Kitchen Order Queue</h2>
          <span style={{ fontSize: "0.85rem", color: "var(--muted, #64748b)" }}>
            Showing {filteredOrders.length} active orders
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState message="No orders currently waiting for kitchen action in this slot." />
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {filteredOrders.map((order) => {
              const isBusy = actionBusyId === order.id;
              return (
                <div
                  key={order.id}
                  style={{
                    border: "1px solid rgba(22, 48, 34, 0.12)",
                    borderRadius: "14px",
                    padding: "1.15rem",
                    background: order.status === "placed" ? "rgba(251, 191, 36, 0.06)" : "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>Order #{order.id.slice(-6).toUpperCase()}</span>
                        <Badge tone={order.status === "placed" ? "warn" : order.status === "preparing" ? "info" : "ok"}>
                          {order.status}
                        </Badge>
                        {order.mealSlot && (
                          <span style={{ fontSize: "0.8rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>
                            · {order.mealSlot.displayName} Slot
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", marginTop: "0.2rem" }}>
                        Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {/* Step Action Buttons */}
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      {order.status === "placed" && (
                        <button
                          type="button"
                          className="btn primary"
                          disabled={isBusy}
                          onClick={() => void handleStatusTransition(order.id, "accepted")}
                        >
                          {isBusy ? "Updating…" : "✓ Accept Order"}
                        </button>
                      )}
                      {order.status === "accepted" && (
                        <button
                          type="button"
                          className="btn primary"
                          disabled={isBusy}
                          onClick={() => void handleStatusTransition(order.id, "preparing")}
                          style={{ background: "#2563eb", borderColor: "#1d4ed8" }}
                        >
                          {isBusy ? "Updating…" : "🔥 Start Cooking"}
                        </button>
                      )}
                      {order.status === "preparing" && (
                        <button
                          type="button"
                          className="btn primary"
                          disabled={isBusy}
                          onClick={() => void handleStatusTransition(order.id, "ready")}
                          style={{ background: "#059669", borderColor: "#047857" }}
                        >
                          {isBusy ? "Updating…" : "📦 Mark Ready for Delivery"}
                        </button>
                      )}
                      {order.status === "ready" && (
                        <Badge tone="ok">
                          Ready for Rider Pickup
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Items Ordered */}
                  <div
                    style={{
                      background: "rgba(22, 48, 34, 0.03)",
                      borderRadius: "10px",
                      padding: "0.75rem 1rem",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "1.25rem",
                    }}
                  >
                    {order.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span
                          style={{
                            background: "var(--brand, #1a7a52)",
                            color: "#ffffff",
                            borderRadius: "6px",
                            padding: "0.1rem 0.45rem",
                            fontSize: "0.8rem",
                            fontWeight: 800,
                          }}
                        >
                          {item.quantity}x
                        </span>
                        <span style={{ fontWeight: 600, fontSize: "0.92rem" }}>{item.nameSnapshot}</span>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Location & Instructions Note */}
                  {order.address && (
                    <div style={{ fontSize: "0.85rem", color: "var(--muted, #64748b)" }}>
                      <strong>Delivery Target: </strong>
                      {[order.address.pgName, order.address.roomFlat, order.address.line1]
                        .filter(Boolean)
                        .join(", ")}
                      {order.address.instructions && (
                        <span style={{ color: "#b45309", marginLeft: "0.5rem" }}>
                          (Note: {order.address.instructions})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
