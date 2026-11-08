"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { partnerFetch } from "@/lib/partner-api";
import { Badge, EmptyState, ErrorBanner, PageHeader, partnerTone } from "@/components/ui";

type Document = {
  id: string;
  docType: string;
  originalName: string | null;
  mimeType: string | null;
  createdAt: string;
};

type PartnerProfile = {
  id: string;
  businessName: string;
  status: string;
  rejectionReason: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  user: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
  };
  serviceAreas: {
    serviceArea: {
      name: string;
      code: string;
    };
  }[];
  documents: Document[];
  _count: {
    orders: number;
    menus: number;
  };
};

export default function PartnerProfilePage() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [, startTransition] = useTransition();

  function loadProfile() {
    setLoading(true);
    startTransition(() => {
      partnerFetch<PartnerProfile>("/profile")
        .then((data) => {
          setProfile(data);
          setBusinessName(data.businessName);
          setContactEmail(data.contactEmail || data.user.email || "");
          setContactPhone(data.contactPhone || data.user.phone || "");
          setError(null);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    });
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await partnerFetch("/profile", {
        method: "PATCH",
        body: JSON.stringify({
          businessName,
          contactEmail,
          contactPhone,
        }),
      });
      setSuccess("Kitchen profile details updated successfully.");
      loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Kitchen Profile & Onboarding Documents"
        description="Review your registered kitchen business details, active service areas, and onboarding verification documents."
      />

      {error && <ErrorBanner message={error} />}
      {success && (
        <div style={{ background: "#dcfce7", color: "#15803d", padding: "0.85rem 1rem", borderRadius: "10px", marginBottom: "1rem", fontWeight: 600 }}>
          {success}
        </div>
      )}

      {loading && <div className="empty-state">Loading kitchen profile…</div>}

      {!loading && profile && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Business Details Form */}
          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Kitchen Details</h2>
              <Badge tone={partnerTone(profile.status)}>
                Status: {profile.status}
              </Badge>
            </div>

            {profile.rejectionReason && (
              <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.88rem" }}>
                <strong>Rejection Note:</strong> {profile.rejectionReason}
              </div>
            )}

            <form onSubmit={handleUpdate}>
              <div className="field">
                <label htmlFor="p-business">Kitchen / Business Name *</label>
                <input
                  id="p-business"
                  className="input"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="p-email">Kitchen Contact Email</label>
                <input
                  id="p-email"
                  className="input"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="p-phone">Kitchen Contact Phone</label>
                <input
                  id="p-phone"
                  className="input"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Account Owner</label>
                <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--ink, #0f172a)", padding: "0.4rem 0" }}>
                  {profile.user.fullName || "—"} ({profile.user.email})
                </div>
              </div>

              <button
                type="submit"
                className="btn primary"
                disabled={saving}
                style={{ marginTop: "1rem" }}
              >
                {saving ? "Saving Changes…" : "Update Profile"}
              </button>
            </form>
          </div>

          {/* Operational Scope & Documents */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Service Areas */}
            <div className="panel">
              <h2 style={{ marginTop: 0, fontSize: "1.2rem", marginBottom: "0.75rem" }}>Service Areas</h2>
              <p className="muted" style={{ fontSize: "0.85rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                Assigned localities where your meals are currently eligible for customer order delivery.
              </p>

              {profile.serviceAreas.length === 0 ? (
                <EmptyState message="No service areas mapped to your kitchen yet." />
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {profile.serviceAreas.map((sa) => (
                    <span
                      key={sa.serviceArea.code}
                      style={{
                        background: "rgba(26, 122, 82, 0.1)",
                        color: "var(--brand, #1a7a52)",
                        border: "1px solid rgba(26, 122, 82, 0.2)",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                      }}
                    >
                      📍 {sa.serviceArea.name} ({sa.serviceArea.code})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Onboarding Documents */}
            <div className="panel">
              <h2 style={{ marginTop: 0, fontSize: "1.2rem", marginBottom: "0.75rem" }}>Onboarding Documents</h2>
              <p className="muted" style={{ fontSize: "0.85rem", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                FSSAI certificate, kitchen hygiene photos, and government ID proofs.
              </p>

              {profile.documents.length === 0 ? (
                <EmptyState message="No compliance documents recorded on file." />
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Document Type</th>
                      <th>File Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <strong>{doc.docType.toUpperCase()}</strong>
                        </td>
                        <td>{doc.originalName || "document.pdf"}</td>
                        <td>
                          <Badge tone="ok">Verified on File</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
