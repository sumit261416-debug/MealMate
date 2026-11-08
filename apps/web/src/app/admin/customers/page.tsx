"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/format";
import { EmptyState, ErrorBanner, PageHeader } from "@/components/ui";

type Customer = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number; addresses: number };
};

type ListResponse = { items: Customer[]; total: number };

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    setData(await adminFetch<ListResponse>(`/customers?${params}`));
  }, [q]);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Safe search with pagination caps. No bulk export in MVP."
      />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="toolbar">
        <input
          className="input"
          placeholder="Search name / email / phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn secondary" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {!data ? (
        <EmptyState message="Loading customers…" />
      ) : (
        <div className="panel anim-rise">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Orders</th>
                <th>Addresses</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.fullName ?? "—"}</td>
                  <td>
                    <div className="stack-sm">
                      <span>{customer.email}</span>
                      <span className="muted">{customer.phone}</span>
                    </div>
                  </td>
                  <td>{customer._count.orders}</td>
                  <td>{customer._count.addresses}</td>
                  <td>{formatDateTime(customer.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Total: {data.total}</p>
        </div>
      )}
    </div>
  );
}
