"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { formatDateTime, formatInrFromPaise } from "@/lib/format";
import { useQueryState } from "@/lib/use-query-state";
import { AdminListChrome } from "@/components/AdminListChrome";
import { Badge, PageHeader } from "@/components/ui";

type Refund = {
  id: string;
  amountPaise: number;
  reason: string;
  status: string;
  createdAt: string;
  decisionNote: string | null;
  payment: {
    providerRef: string | null;
    order: {
      id: string;
      customer: { fullName: string | null; email: string | null };
    } | null;
  };
};

type ListResponse = { items: Refund[]; total: number };

function RefundsInner() {
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
      setData(await adminFetch<ListResponse>(`/refunds?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, decision: "approved" | "rejected" | "processed") {
    let decisionNote: string | undefined;
    if (decision === "rejected") {
      decisionNote = window.prompt("Rejection note (required)")?.trim();
      if (!decisionNote) return;
    }
    setBusyId(id);
    try {
      await adminFetch(`/refunds/${id}/decision`, {
        method: "PATCH",
        body: JSON.stringify({ decision, decisionNote }),
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
        title="Refund requests"
        description="Approve, reject, or mark refunds processed. Decisions are audited."
      />
      <AdminListChrome
        loading={loading && !data}
        error={error}
        empty={data && data.items.length === 0 ? "No refund requests found." : null}
        total={data?.total}
        toolbar={
          <>
            <input
              className="input"
              placeholder="Search order / reason"
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
              <option value="requested">Requested</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="processed">Processed</option>
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
                <th>Order / Customer</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((refund) => (
                <tr key={refund.id}>
                  <td>
                    <div className="stack-sm">
                      <strong>{refund.payment.order?.id.slice(0, 10)}…</strong>
                      <span className="muted">
                        {refund.payment.order?.customer.fullName ??
                          refund.payment.order?.customer.email}
                      </span>
                    </div>
                  </td>
                  <td>{formatInrFromPaise(refund.amountPaise)}</td>
                  <td>{refund.reason}</td>
                  <td>
                    <Badge
                      tone={
                        refund.status === "requested"
                          ? "warn"
                          : refund.status === "rejected"
                            ? "danger"
                            : "ok"
                      }
                    >
                      {refund.status}
                    </Badge>
                  </td>
                  <td>{formatDateTime(refund.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      {refund.status === "requested" ? (
                        <>
                          <button
                            className="btn"
                            type="button"
                            disabled={busyId === refund.id}
                            onClick={() => void decide(refund.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn danger"
                            type="button"
                            disabled={busyId === refund.id}
                            onClick={() => void decide(refund.id, "rejected")}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                      {refund.status === "approved" ? (
                        <button
                          className="btn secondary"
                          type="button"
                          disabled={busyId === refund.id}
                          onClick={() => void decide(refund.id, "processed")}
                        >
                          Mark processed
                        </button>
                      ) : null}
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

export default function RefundsPage() {
  return (
    <Suspense fallback={<div className="empty-state">Loading…</div>}>
      <RefundsInner />
    </Suspense>
  );
}
