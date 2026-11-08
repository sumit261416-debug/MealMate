"use client";

import { useEffect, useState, useTransition } from "react";
import { partnerFetch } from "@/lib/partner-api";
import { formatInrFromPaise } from "@/lib/format";
import { Badge, EmptyState, ErrorBanner, PageHeader } from "@/components/ui";

type LedgerItem = {
  orderId: string;
  date: string;
  status: string;
  itemCount: number;
  grossAmountPaise: number;
  platformDeductionPaise: number;
  netEarningsPaise: number;
};

type PayoutsResponse = {
  summary: {
    totalEligibleOrders: number;
    grossSalesPaise: number;
    totalPlatformFeesPaise: number;
    netPayablePaise: number;
    payoutStatus: string;
    nextSettlementDate: string;
  };
  ledger: LedgerItem[];
};

export default function PartnerPayoutsPage() {
  const [data, setData] = useState<PayoutsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function loadPayouts() {
    setLoading(true);
    startTransition(() => {
      partnerFetch<PayoutsResponse>("/payouts")
        .then((res) => {
          setData(res);
          setError(null);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    });
  }

  useEffect(() => {
    loadPayouts();
  }, []);

  return (
    <div>
      <PageHeader
        title="Kitchen Payouts & Earnings"
        description="Transparent breakdown of your fulfilled meal revenue, platform fees, and net settlement ledger."
        actions={
          <button className="btn secondary" type="button" onClick={loadPayouts}>
            Refresh Ledger
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <div className="panel" style={{ borderLeft: "4px solid #10b981" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>Net Payable Earnings</span>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--brand, #1a7a52)", marginTop: "0.25rem" }}>
              {formatInrFromPaise(data.summary.netPayablePaise)}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>
              Cycle: {data.summary.payoutStatus === "cycle_pending" ? "Pending Next Settlement" : "Settled"}
            </span>
          </div>

          <div className="panel" style={{ borderLeft: "4px solid #3b82f6" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>Gross Food Sales</span>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#2563eb", marginTop: "0.25rem" }}>
              {formatInrFromPaise(data.summary.grossSalesPaise)}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>
              Across {data.summary.totalEligibleOrders} fulfilled orders
            </span>
          </div>

          <div className="panel" style={{ borderLeft: "4px solid #f59e0b" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)", fontWeight: 600 }}>Platform Deductions</span>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#d97706", marginTop: "0.25rem" }}>
              -{formatInrFromPaise(data.summary.totalPlatformFeesPaise)}
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>Service & technology commission</span>
          </div>
        </div>
      )}

      <div className="panel">
        <h2 style={{ marginTop: 0, fontSize: "1.2rem", marginBottom: "1rem" }}>Fulfilled Order Earnings Ledger</h2>

        {loading && <div className="empty-state">Loading payout ledger…</div>}
        {!loading && (!data || data.ledger.length === 0) && (
          <EmptyState message="No fulfilled or ready orders for payout settlement yet." />
        )}
        {!loading && data && data.ledger.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Fulfilment Date</th>
                  <th>Status</th>
                  <th>Portions</th>
                  <th>Gross Food Sale</th>
                  <th>Platform Fee</th>
                  <th>Net Kitchen Earning</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((row) => (
                  <tr key={row.orderId}>
                    <td>
                      <strong>#{row.orderId.slice(-6).toUpperCase()}</strong>
                    </td>
                    <td>{new Date(row.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td>
                      <Badge tone={row.status === "delivered" ? "ok" : "info"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td>{row.itemCount} items</td>
                    <td>{formatInrFromPaise(row.grossAmountPaise)}</td>
                    <td style={{ color: "#d97706" }}>-{formatInrFromPaise(row.platformDeductionPaise)}</td>
                    <td>
                      <strong style={{ color: "var(--brand, #1a7a52)" }}>
                        {formatInrFromPaise(row.netEarningsPaise)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
