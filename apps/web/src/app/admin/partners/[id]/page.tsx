"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { formatInrFromPaise } from "@/lib/format";
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
  partnerTone,
} from "@/components/ui";

type PartnerDetail = {
  id: string;
  businessName: string;
  status: string;
  rejectionReason: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  user: { email: string | null; fullName: string | null; phone: string | null };
  serviceAreas: { serviceArea: { name: string; code: string } }[];
  menus: {
    id: string;
    title: string;
    isPublished: boolean;
    items: {
      id: string;
      name: string;
      pricePaise: number;
      isAvailable: boolean;
    }[];
  }[];
  documents: {
    id: string;
    docType: string;
    originalName: string | null;
    mimeType: string | null;
    createdAt: string;
  }[];
};

export default function PartnerDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PartnerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docBusy, setDocBusy] = useState<string | null>(null);

  useEffect(() => {
    void adminFetch<PartnerDetail>(`/partners/${params.id}`)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  async function openSecureDocument(docId: string) {
    setDocBusy(docId);
    setError(null);
    try {
      const access = await adminFetch<{ viewPath: string }>(
        `/partners/${params.id}/documents/${docId}/access`,
        { method: "POST" },
      );
      window.open(`/api/admin${access.viewPath.replace("/v1/admin", "")}`, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open document");
    } finally {
      setDocBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={data?.businessName ?? "Partner"}
        description="Partner profile, menus, and document metadata."
        actions={
          <Link className="btn secondary" href="/admin/partners">
            Back to list
          </Link>
        }
      />
      {error ? <ErrorBanner message={error} /> : null}
      {!data && !error ? <EmptyState message="Loading…" /> : null}
      {data ? (
        <div className="detail-grid">
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Profile</h2>
            <p>
              <Badge tone={partnerTone(data.status)}>{data.status}</Badge>
            </p>
            <p>Owner: {data.user.fullName ?? "—"}</p>
            <p>Email: {data.contactEmail ?? data.user.email}</p>
            <p>Phone: {data.contactPhone ?? data.user.phone}</p>
            {data.rejectionReason ? (
              <p className="muted">Rejection: {data.rejectionReason}</p>
            ) : null}
            <p>
              Areas:{" "}
              {data.serviceAreas
                .map((row) => row.serviceArea.name)
                .join(", ") || "—"}
            </p>
          </div>
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Documents</h2>
            <p className="muted">
              Private storage only. Links expire in 5 minutes and are audited.
            </p>
            {data.documents.length === 0 ? (
              <p className="muted">No documents uploaded.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>File</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.docType}</td>
                      <td>{doc.originalName ?? "document"}</td>
                      <td>
                        <button
                          className="btn secondary"
                          type="button"
                          disabled={docBusy === doc.id}
                          onClick={() => void openSecureDocument(doc.id)}
                        >
                          {docBusy === doc.id ? "Opening…" : "Secure view"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h2 style={{ marginTop: 0 }}>Menus</h2>
            {data.menus.map((menu) => (
              <div key={menu.id} style={{ marginBottom: "1rem" }}>
                <strong>
                  {menu.title}{" "}
                  <Badge tone={menu.isPublished ? "ok" : "warn"}>
                    {menu.isPublished ? "published" : "unpublished"}
                  </Badge>
                </strong>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Price</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menu.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{formatInrFromPaise(item.pricePaise)}</td>
                        <td>{item.isAvailable ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
