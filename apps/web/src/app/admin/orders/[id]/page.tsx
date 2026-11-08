"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import { formatDateTime, formatInrFromPaise } from "@/lib/format";
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
  orderTone,
} from "@/components/ui";

type OrderDetail = {
  id: string;
  status: string;
  totalPaise: number;
  subtotalPaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  taxPaise: number;
  createdAt: string;
  allowedTransitions: string[];
  customer: { fullName: string | null; email: string | null; phone: string | null };
  partner: { businessName: string };
  mealSlot: { displayName: string } | null;
  serviceArea: { name: string } | null;
  items: {
    nameSnapshot: string;
    pricePaiseSnapshot: number;
    quantity: number;
  }[];
  statusHistory: {
    id: string;
    fromStatus: string | null;
    toStatus: string;
    note: string | null;
    createdAt: string;
  }[];
  payments: {
    id: string;
    status: string;
    amountPaise: number;
    provider: string;
    providerRef: string | null;
  }[];
  deliveryTask: {
    id: string;
    status: string;
    assigneeName: string | null;
  } | null;
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const order = await adminFetch<OrderDetail>(`/orders/${params.id}`);
    setData(order);
    setNextStatus(order.allowedTransitions[0] ?? "");
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [params.id]);

  async function overrideStatus() {
    if (!nextStatus) return;
    const note = window.prompt("Optional note for status change") ?? undefined;
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`/orders/${params.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, note }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Order detail"
        description={data?.id}
        actions={
          <Link className="btn secondary" href="/admin/orders">
            Back to orders
          </Link>
        }
      />
      {error ? <ErrorBanner message={error} /> : null}
      {!data && !error ? <EmptyState message="Loading…" /> : null}
      {data ? (
        <div className="detail-grid">
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Summary</h2>
            <p>
              <Badge tone={orderTone(data.status)}>{data.status}</Badge>
            </p>
            <p>Customer: {data.customer.fullName ?? data.customer.email}</p>
            <p>Kitchen: {data.partner.businessName}</p>
            <p>Slot: {data.mealSlot?.displayName ?? "—"}</p>
            <p>Area: {data.serviceArea?.name ?? "—"}</p>
            <p>Created: {formatDateTime(data.createdAt)}</p>
            <p>Total: {formatInrFromPaise(data.totalPaise)}</p>
            <p className="muted">
              Subtotal {formatInrFromPaise(data.subtotalPaise)} · Delivery{" "}
              {formatInrFromPaise(data.deliveryFeePaise)} · Platform{" "}
              {formatInrFromPaise(data.platformFeePaise)} · Tax{" "}
              {formatInrFromPaise(data.taxPaise)}
            </p>
            <div style={{ marginTop: "1rem" }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>
                Admin status override
              </h3>
              {data.allowedTransitions.length === 0 ? (
                <p className="muted">No further transitions allowed.</p>
              ) : (
                <div className="toolbar" style={{ marginBottom: 0 }}>
                  <select
                    className="select"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                  >
                    {data.allowedTransitions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn"
                    type="button"
                    disabled={busy || !nextStatus}
                    onClick={() => void overrideStatus()}
                  >
                    {busy ? "Updating…" : "Apply status"}
                  </button>
                </div>
              )}
              {data.deliveryTask ? (
                <p className="muted" style={{ marginTop: "0.75rem" }}>
                  Delivery: {data.deliveryTask.status}
                  {data.deliveryTask.assigneeName
                    ? ` · ${data.deliveryTask.assigneeName}`
                    : ""}{" "}
                  ·{" "}
                  <Link href="/admin/deliveries">Open deliveries</Link>
                </p>
              ) : null}
            </div>
          </div>
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Items (order-time snapshot)</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={`${item.nameSnapshot}-${index}`}>
                    <td>{item.nameSnapshot}</td>
                    <td>{item.quantity}</td>
                    <td>{formatInrFromPaise(item.pricePaiseSnapshot)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Status history</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Note</th>
                  <th>At</th>
                </tr>
              </thead>
              <tbody>
                {data.statusHistory.map((row) => (
                  <tr key={row.id}>
                    <td>{row.fromStatus ?? "—"}</td>
                    <td>{row.toStatus}</td>
                    <td>{row.note ?? "—"}</td>
                    <td>{formatDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Payments</h2>
            {data.payments.length === 0 ? (
              <p className="muted">No payment records.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Provider</th>
                    <th>Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.status}</td>
                      <td>{formatInrFromPaise(payment.amountPaise)}</td>
                      <td>{payment.provider}</td>
                      <td>{payment.providerRef ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
