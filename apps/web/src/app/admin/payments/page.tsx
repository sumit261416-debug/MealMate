"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { formatDateTime, formatInrFromPaise } from "@/lib/format";
import { useQueryState } from "@/lib/use-query-state";
import { AdminListChrome } from "@/components/AdminListChrome";
import { Badge, PageHeader, StatCard } from "@/components/ui";

type Payment = {
  id: string;
  status: string;
  amountPaise: number;
  provider: string;
  providerRef: string | null;
  createdAt: string;
  order: {
    id: string;
    status: string;
    customer: { email: string | null; fullName: string | null };
  } | null;
  refunds: { id: string; status: string; amountPaise: number }[];
};

type ListResponse = {
  items: Payment[];
  total: number;
  summary: { status: string; count: number; amountPaise: number }[];
};

function PaymentsInner() {
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
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      setData(await adminFetch<ListResponse>(`/payments?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Payments reconciliation"
        description="Provider references, amounts, and refund linkage. Gateway webhooks remain source of truth in Phase 4."
      />
      {data?.summary?.length ? (
        <div className="stat-grid" style={{ marginBottom: "1rem" }}>
          {data.summary.slice(0, 4).map((row, index) => (
            <StatCard
              key={row.status}
              index={index}
              label={row.status}
              value={`${row.count} · ${formatInrFromPaise(row.amountPaise)}`}
            />
          ))}
        </div>
      ) : null}
      <AdminListChrome
        loading={loading && !data}
        error={error}
        empty={data && data.items.length === 0 ? "No payments found." : null}
        total={data?.total}
        toolbar={
          <>
            <input
              className="input"
              placeholder="Search id / provider ref / order"
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
                "created",
                "requires_action",
                "succeeded",
                "failed",
                "refund_pending",
                "partially_refunded",
                "refunded",
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
                <th>Payment</th>
                <th>Customer / Order</th>
                <th>Amount</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Refunds</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.id.slice(0, 10)}…</td>
                  <td>
                    <div className="stack-sm">
                      <span>
                        {payment.order?.customer.fullName ??
                          payment.order?.customer.email ??
                          "—"}
                      </span>
                      <span className="muted">
                        {payment.order?.id.slice(0, 10) ?? "—"}…
                      </span>
                    </div>
                  </td>
                  <td>{formatInrFromPaise(payment.amountPaise)}</td>
                  <td>
                    <div className="stack-sm">
                      <span>{payment.provider}</span>
                      <span className="muted">{payment.providerRef ?? "—"}</span>
                    </div>
                  </td>
                  <td>
                    <Badge
                      tone={
                        payment.status === "succeeded"
                          ? "ok"
                          : payment.status.includes("fail")
                            ? "danger"
                            : "warn"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </td>
                  <td>
                    {payment.refunds.length === 0
                      ? "—"
                      : payment.refunds
                          .map(
                            (refund) =>
                              `${refund.status} (${formatInrFromPaise(refund.amountPaise)})`,
                          )
                          .join(", ")}
                  </td>
                  <td>{formatDateTime(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </AdminListChrome>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="empty-state">Loading…</div>}>
      <PaymentsInner />
    </Suspense>
  );
}
