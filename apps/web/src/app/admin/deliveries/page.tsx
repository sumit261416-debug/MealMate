"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { formatDateTime, formatInrFromPaise } from "@/lib/format";
import { useQueryState } from "@/lib/use-query-state";
import { AdminListChrome } from "@/components/AdminListChrome";
import { Badge, PageHeader } from "@/components/ui";

type Delivery = {
  id: string;
  status: string;
  assigneeName: string | null;
  podNote: string | null;
  updatedAt: string;
  order: {
    id: string;
    status: string;
    totalPaise: number;
    customer: { fullName: string | null; phone: string | null };
    partner: { businessName: string };
    mealSlot: { displayName: string } | null;
    address: {
      line1: string;
      pgName: string | null;
      roomFlat: string | null;
    } | null;
  };
};

type ListResponse = { items: Delivery[]; total: number };

function DeliveriesInner() {
  const { get, setValues } = useQueryState();
  const q = get("q");
  const status = get("status");
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      setData(await adminFetch<ListResponse>(`/deliveries?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function assign(id: string) {
    const assigneeName = window.prompt("Rider / assignee name")?.trim();
    if (!assigneeName) return;
    setBusyId(id);
    try {
      await adminFetch(`/deliveries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ assigneeName, status: "assigned" }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setBusyId(null);
    }
  }

  async function setStatus(id: string, next: string) {
    const current = data?.items.find((item) => item.id === id);
    if (!current?.assigneeName && next !== "unassigned") {
      setError("Assign a rider before changing delivery status.");
      return;
    }
    setBusyId(id);
    try {
      await adminFetch(`/deliveries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          assigneeName: current?.assigneeName ?? "Unassigned",
          status: next,
          podNote:
            next === "delivered"
              ? window.prompt("Proof of delivery note (optional)") ?? undefined
              : undefined,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Delivery assignment"
        description="Manual rider assignment and proof-of-delivery for the pilot."
      />
      <AdminListChrome
        loading={loading && !data}
        error={error}
        empty={data && data.items.length === 0 ? "No delivery tasks yet." : null}
        total={data?.total}
        toolbar={
          <>
            <input
              className="input"
              placeholder="Search order / rider / kitchen"
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
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
              <option value="picked_up">Picked up</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
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
                <th>Address</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((task) => (
                <tr key={task.id}>
                  <td>
                    <div className="stack-sm">
                      <strong>{task.order.id.slice(0, 10)}…</strong>
                      <span className="muted">
                        {task.order.partner.businessName} ·{" "}
                        {task.order.mealSlot?.displayName ?? "—"} ·{" "}
                        {formatInrFromPaise(task.order.totalPaise)}
                      </span>
                      <span className="muted">
                        {task.order.customer.fullName} {task.order.customer.phone}
                      </span>
                    </div>
                  </td>
                  <td>
                    {task.order.address
                      ? `${task.order.address.line1}${
                          task.order.address.pgName
                            ? `, ${task.order.address.pgName}`
                            : ""
                        }${
                          task.order.address.roomFlat
                            ? ` · ${task.order.address.roomFlat}`
                            : ""
                        }`
                      : "—"}
                  </td>
                  <td>{task.assigneeName ?? "—"}</td>
                  <td>
                    <Badge tone={task.status === "unassigned" ? "warn" : "ok"}>
                      {task.status}
                    </Badge>
                  </td>
                  <td>{formatDateTime(task.updatedAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn"
                        type="button"
                        disabled={busyId === task.id}
                        onClick={() => void assign(task.id)}
                      >
                        Assign
                      </button>
                      <button
                        className="btn secondary"
                        type="button"
                        disabled={busyId === task.id}
                        onClick={() => void setStatus(task.id, "picked_up")}
                      >
                        Picked up
                      </button>
                      <button
                        className="btn secondary"
                        type="button"
                        disabled={busyId === task.id}
                        onClick={() => void setStatus(task.id, "delivered")}
                      >
                        Delivered
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </AdminListChrome>
    </div>
  );
}

export default function DeliveriesPage() {
  return (
    <Suspense fallback={<div className="empty-state">Loading…</div>}>
      <DeliveriesInner />
    </Suspense>
  );
}
