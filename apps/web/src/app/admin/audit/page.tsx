"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/format";
import { EmptyState, ErrorBanner, PageHeader } from "@/components/ui";

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  actor: { email: string | null; fullName: string | null } | null;
  metadata: unknown;
};

type ListResponse = { items: AuditRow[]; total: number };

export default function AuditPage() {
  const [entityType, setEntityType] = useState("");
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (entityType) params.set("entityType", entityType);
    setData(await adminFetch<ListResponse>(`/audit?${params}`));
  }, [entityType]);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Append-oriented record of admin-sensitive actions."
      />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="toolbar">
        <input
          className="input"
          placeholder="Filter entity type e.g. kitchen_partner"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />
        <button className="btn secondary" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {!data ? (
        <EmptyState message="Loading audit log…" />
      ) : (
        <div className="panel anim-rise">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTime(row.createdAt)}</td>
                  <td>{row.actor?.email ?? row.actor?.fullName ?? "—"}</td>
                  <td>{row.action}</td>
                  <td>
                    {row.entityType}
                    {row.entityId ? ` · ${row.entityId.slice(0, 8)}…` : ""}
                  </td>
                  <td>
                    <code style={{ fontSize: "0.8rem" }}>
                      {row.metadata ? JSON.stringify(row.metadata) : "—"}
                    </code>
                  </td>
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
