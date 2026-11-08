"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { useQueryState } from "@/lib/use-query-state";
import { AdminListChrome } from "@/components/AdminListChrome";
import { Badge, PageHeader, partnerTone } from "@/components/ui";

type Partner = {
  id: string;
  businessName: string;
  status: string;
  contactEmail: string | null;
  contactPhone: string | null;
  _count: { menus: number; orders: number };
};

type ListResponse = { items: Partner[]; total: number };

function PartnersInner() {
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
      setData(await adminFetch<ListResponse>(`/partners?${params}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setPartnerStatus(id: string, next: string) {
    let rejectionReason: string | undefined;
    if (next === "rejected") {
      rejectionReason =
        window.prompt("Rejection reason (required)")?.trim() || undefined;
      if (!rejectionReason) return;
    }
    setBusyId(id);
    try {
      await adminFetch(`/partners/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next, rejectionReason }),
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
        title="Kitchen partners"
        description="Review onboarding and suspend partners when needed. Filters sync to the URL."
      />
      <AdminListChrome
        loading={loading && !data}
        error={error}
        empty={data && data.items.length === 0 ? "No partners found." : null}
        total={data?.total}
        toolbar={
          <>
            <input
              className="input"
              placeholder="Search name / email / phone"
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
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
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
                <th>Business</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Menus / Orders</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((partner) => (
                <tr key={partner.id}>
                  <td>
                    <Link href={`/admin/partners/${partner.id}`}>
                      {partner.businessName}
                    </Link>
                  </td>
                  <td>
                    <Badge tone={partnerTone(partner.status)}>
                      {partner.status}
                    </Badge>
                  </td>
                  <td>
                    <div className="stack-sm">
                      <span>{partner.contactEmail}</span>
                      <span className="muted">{partner.contactPhone}</span>
                    </div>
                  </td>
                  <td>
                    {partner._count.menus} / {partner._count.orders}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn secondary"
                        type="button"
                        disabled={busyId === partner.id}
                        onClick={() => void setPartnerStatus(partner.id, "under_review")}
                      >
                        Review
                      </button>
                      <button
                        className="btn"
                        type="button"
                        disabled={busyId === partner.id}
                        onClick={() => void setPartnerStatus(partner.id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        disabled={busyId === partner.id}
                        onClick={() => void setPartnerStatus(partner.id, "rejected")}
                      >
                        Reject
                      </button>
                      <button
                        className="btn secondary"
                        type="button"
                        disabled={busyId === partner.id}
                        onClick={() => void setPartnerStatus(partner.id, "suspended")}
                      >
                        Suspend
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

export default function PartnersPage() {
  return (
    <Suspense fallback={<div className="empty-state">Loading…</div>}>
      <PartnersInner />
    </Suspense>
  );
}
