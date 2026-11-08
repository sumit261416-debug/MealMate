"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { formatDateTime } from "@/lib/format";
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
} from "@/components/ui";

type Ticket = {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  createdAt: string;
  requester: { fullName: string | null; email: string | null };
  order: { id: string; status: string } | null;
};

type ListResponse = { items: Ticket[]; total: number };

export default function SupportPage() {
  const [status, setStatus] = useState("");
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    setData(await adminFetch<ListResponse>(`/support?${params}`));
  }, [status]);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function updateStatus(id: string, next: string) {
    try {
      await adminFetch(`/support/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Support queue"
        description="Complaints and tickets. Status changes are audited."
      />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="toolbar">
        <select
          className="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <button className="btn secondary" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {!data ? (
        <EmptyState message="Loading tickets…" />
      ) : (
        <div className="panel anim-rise">
          <table className="table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Requester</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <div className="stack-sm">
                      <strong>{ticket.subject}</strong>
                      <span className="muted">{ticket.body}</span>
                      {ticket.order ? (
                        <span className="muted">Order {ticket.order.id}</span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    {ticket.requester.fullName ?? ticket.requester.email}
                  </td>
                  <td>
                    <Badge>{ticket.priority}</Badge>
                  </td>
                  <td>
                    <Badge
                      tone={
                        ticket.status === "open" || ticket.status === "in_progress"
                          ? "warn"
                          : "ok"
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </td>
                  <td>{formatDateTime(ticket.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => void updateStatus(ticket.id, "in_progress")}
                      >
                        Start
                      </button>
                      <button
                        className="btn"
                        type="button"
                        onClick={() => void updateStatus(ticket.id, "resolved")}
                      >
                        Resolve
                      </button>
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => void updateStatus(ticket.id, "closed")}
                      >
                        Close
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
