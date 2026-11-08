"use client";

import { useEffect, useState, useTransition } from "react";
import { partnerFetch } from "@/lib/partner-api";
import { formatInrFromPaise } from "@/lib/format";
import { Badge, EmptyState, ErrorBanner, PageHeader, partnerTone } from "@/components/ui";

type OrderItem = {
  id: string;
  nameSnapshot: string;
  pricePaiseSnapshot: number;
  quantity: number;
};

type PartnerOrder = {
  id: string;
  status: string;
  totalPaise: number;
  subtotalPaise: number;
  createdAt: string;
  allowedTransitions: string[];
  mealSlot?: { code: string; displayName: string };
  items: OrderItem[];
  address?: {
    label: string | null;
    pgName: string | null;
    roomFlat: string | null;
    line1: string;
    landmark: string | null;
    instructions: string | null;
  };
  deliveryTask?: { assigneeName: string | null; status: string } | null;
};

export default function PartnerOrdersPage() {
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [slotFilter, setSlotFilter] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function fetchOrders() {
    setLoading(true);
    startTransition(() => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (slotFilter) params.set("slot", slotFilter);
      params.set("pageSize", "30");

      partnerFetch<{ items: PartnerOrder[]; total: number }>(`/orders?${params.toString()}`)
        .then((res) => {
          setOrders(res.items);
          setTotal(res.total);
          setError(null);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    });
  }

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, slotFilter]);

  async function handleStatusChange(orderId: string, nextStatus: string) {
    setBusyId(orderId);
    try {
      await partnerFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Kitchen Orders"
        description="View past and present orders assigned to your kitchen. Accept incoming orders and progress cooking status."
        actions={
          <button className="btn secondary" type="button" onClick={fetchOrders}>
            Refresh
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Filter Toolbar */}
      <div className="toolbar" style={{ marginBottom: "1.25rem" }}>
        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="placed">Placed (New)</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready for pickup</option>
          <option value="out_for_delivery">Out for delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          className="select"
          value={slotFilter}
          onChange={(e) => setSlotFilter(e.target.value)}
        >
          <option value="">All meal slots</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
        </select>
      </div>

      <div className="panel">
        {loading && <div className="empty-state">Loading kitchen orders…</div>}
        {!loading && orders.length === 0 && <EmptyState message="No orders match the selected filters." />}
        {!loading && orders.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Meal Slot</th>
                  <th>Items</th>
                  <th>Destination</th>
                  <th>Food Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const isBusy = busyId === o.id;
                  return (
                    <tr key={o.id}>
                      <td>
                        <strong>#{o.id.slice(-6).toUpperCase()}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted, #64748b)" }}>
                          {new Date(o.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                          {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{o.mealSlot?.displayName || "—"}</span>
                      </td>
                      <td>
                        {o.items.map((i) => (
                          <div key={i.id} style={{ fontSize: "0.85rem" }}>
                            <strong>{i.quantity}x</strong> {i.nameSnapshot}
                          </div>
                        ))}
                      </td>
                      <td style={{ maxWidth: "200px" }}>
                        <div style={{ fontSize: "0.85rem" }}>
                          {o.address?.pgName ? <strong>{o.address.pgName}, </strong> : null}
                          {o.address?.roomFlat ? `Flat ${o.address.roomFlat}` : o.address?.line1}
                        </div>
                        {o.address?.instructions && (
                          <div style={{ fontSize: "0.75rem", color: "#b45309" }}>
                            Note: {o.address.instructions}
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{formatInrFromPaise(o.subtotalPaise)}</strong>
                      </td>
                      <td>
                        <Badge tone={o.status === "delivered" ? "ok" : o.status === "cancelled" ? "danger" : "warn"}>
                          {o.status}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          {o.status === "placed" && (
                            <button
                              type="button"
                              className="btn primary"
                              disabled={isBusy}
                              onClick={() => void handleStatusChange(o.id, "accepted")}
                              style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
                            >
                              Accept
                            </button>
                          )}
                          {o.status === "accepted" && (
                            <button
                              type="button"
                              className="btn primary"
                              disabled={isBusy}
                              onClick={() => void handleStatusChange(o.id, "preparing")}
                              style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem", background: "#2563eb", borderColor: "#1d4ed8" }}
                            >
                              Cook
                            </button>
                          )}
                          {o.status === "preparing" && (
                            <button
                              type="button"
                              className="btn primary"
                              disabled={isBusy}
                              onClick={() => void handleStatusChange(o.id, "ready")}
                              style={{ padding: "0.35rem 0.65rem", fontSize: "0.8rem", background: "#059669", borderColor: "#047857" }}
                            >
                              Ready
                            </button>
                          )}
                          {["ready", "out_for_delivery", "delivered", "cancelled"].includes(o.status) && (
                            <span style={{ fontSize: "0.8rem", color: "var(--muted, #64748b)" }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="muted" style={{ marginTop: "1rem" }}>
              Total Orders: {total}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
