"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { formatDateTime, formatInrFromPaise } from "@/lib/format";
import { useQueryState } from "@/lib/use-query-state";
import { AdminListChrome } from "@/components/AdminListChrome";
import { Badge, PageHeader, orderTone } from "@/components/ui";

type OrderRow = {
  id: string;
  status: string;
  totalPaise: number;
  createdAt: string;
  customer: { fullName: string | null; email: string | null };
  partner: { businessName: string };
  mealSlot: { displayName: string } | null;
};

type ListResponse = { items: OrderRow[]; total: number };

function OrdersInner() {
  const { get, setValues } = useQueryState();
  const q = get("q");
  const status = get("status");
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      setData(await adminFetch<ListResponse>(`/orders?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Orders"
        description="View and open orders. Use detail page for admin status overrides."
      />
      <AdminListChrome
        loading={loading && !data}
        error={error}
        empty={data && data.items.length === 0 ? "No orders match these filters." : null}
        total={data?.total}
        toolbar={
          <>
            <input
              className="input"
              placeholder="Search id / email / kitchen"
              defaultValue={q}
              onBlur={(e) => setValues({ q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setValues({ q: (e.target as HTMLInputElement).value });
                }
              }}
            />
            <select
              className="select"
              value={status}
              onChange={(e) => setValues({ status: e.target.value })}
            >
              <option value="">All statuses</option>
              {[
                "placed",
                "accepted",
                "preparing",
                "ready",
                "out_for_delivery",
                "delivered",
                "cancelled",
                "payment_failed",
              ].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <button className="btn secondary" type="button" onClick={() => void load()}>
              Refresh
            </button>
          </>
        }
      >
        {data ? (
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Kitchen</th>
                <th>Slot</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/orders/${order.id}`}>
                      {order.id.slice(0, 10)}…
                    </Link>
                  </td>
                  <td>{order.customer.fullName ?? order.customer.email}</td>
                  <td>{order.partner.businessName}</td>
                  <td>{order.mealSlot?.displayName ?? "—"}</td>
                  <td>{formatInrFromPaise(order.totalPaise)}</td>
                  <td>
                    <Badge tone={orderTone(order.status)}>{order.status}</Badge>
                  </td>
                  <td>{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </AdminListChrome>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="empty-state">Loading…</div>}>
      <OrdersInner />
    </Suspense>
  );
}
