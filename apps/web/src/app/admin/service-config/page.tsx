"use client";

import { FormEvent, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { EmptyState, ErrorBanner, PageHeader } from "@/components/ui";

type Config = {
  serviceAreas: {
    id: string;
    name: string;
    code: string;
    isActive: boolean;
    description: string | null;
  }[];
  mealSlots: {
    id: string;
    code: string;
    displayName: string;
    cutoffHour: number;
    cutoffMinute: number;
    cutoffPrevDay: boolean;
    isActive: boolean;
  }[];
  policy: {
    cancellationCutoffMinutes: number;
    refundWindowHours: number;
    deliveryFeePaise: number;
    platformFeePaise: number;
  };
};

export default function ServiceConfigPage() {
  const [data, setData] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [areaName, setAreaName] = useState("");
  const [areaCode, setAreaCode] = useState("");

  async function load() {
    setData(await adminFetch<Config>("/service-config"));
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  async function createArea(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await adminFetch("/service-config/areas", {
        method: "POST",
        body: JSON.stringify({ name: areaName, code: areaCode }),
      });
      setAreaName("");
      setAreaCode("");
      setMessage("Service area created.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function saveSlot(code: string, form: HTMLFormElement) {
    const formData = new FormData(form);
    setError(null);
    setMessage(null);
    try {
      await adminFetch(`/service-config/slots/${code}`, {
        method: "PATCH",
        body: JSON.stringify({
          displayName: String(formData.get("displayName") ?? ""),
          cutoffHour: Number(formData.get("cutoffHour")),
          cutoffMinute: Number(formData.get("cutoffMinute")),
          cutoffPrevDay: formData.get("cutoffPrevDay") === "on",
          isActive: formData.get("isActive") === "on",
        }),
      });
      setMessage(`Updated ${code} slot.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setMessage(null);
    try {
      await adminFetch("/service-config/policy", {
        method: "PUT",
        body: JSON.stringify({
          cancellationCutoffMinutes: Number(
            formData.get("cancellationCutoffMinutes"),
          ),
          refundWindowHours: Number(formData.get("refundWindowHours")),
          deliveryFeePaise: Number(formData.get("deliveryFeePaise")),
          platformFeePaise: Number(formData.get("platformFeePaise")),
        }),
      });
      setMessage("Policy saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Service configuration"
        description="Areas, meal cut-offs, and fee policy. Changes are audited."
      />
      {error ? <ErrorBanner message={error} /> : null}
      {message ? <div className="empty-state">{message}</div> : null}
      {!data ? (
        <EmptyState message="Loading configuration…" />
      ) : (
        <div className="detail-grid">
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Service areas</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {data.serviceAreas.map((area) => (
                  <tr key={area.id}>
                    <td>{area.name}</td>
                    <td>{area.code}</td>
                    <td>{area.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <form onSubmit={createArea} style={{ marginTop: "1rem" }}>
              <div className="field">
                <label htmlFor="areaName">New area name</label>
                <input
                  id="areaName"
                  className="input"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="areaCode">Code</label>
                <input
                  id="areaCode"
                  className="input"
                  value={areaCode}
                  onChange={(e) => setAreaCode(e.target.value)}
                  required
                />
              </div>
              <button className="btn" type="submit">
                Add area
              </button>
            </form>
          </div>

          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Meal slots & cut-offs</h2>
            {data.mealSlots.map((slot) => (
              <form
                key={slot.id}
                className="panel"
                style={{ marginBottom: "0.75rem", boxShadow: "none" }}
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveSlot(slot.code, event.currentTarget);
                }}
              >
                <strong>{slot.code}</strong>
                <div className="field">
                  <label>Display name</label>
                  <input
                    className="input"
                    name="displayName"
                    defaultValue={slot.displayName}
                  />
                </div>
                <div className="toolbar">
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Cutoff hour</label>
                    <input
                      className="input"
                      name="cutoffHour"
                      type="number"
                      min={0}
                      max={23}
                      defaultValue={slot.cutoffHour}
                    />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Minute</label>
                    <input
                      className="input"
                      name="cutoffMinute"
                      type="number"
                      min={0}
                      max={59}
                      defaultValue={slot.cutoffMinute}
                    />
                  </div>
                </div>
                <label>
                  <input
                    type="checkbox"
                    name="cutoffPrevDay"
                    defaultChecked={slot.cutoffPrevDay}
                  />{" "}
                  Cut-off previous day
                </label>
                <br />
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={slot.isActive}
                  />{" "}
                  Active
                </label>
                <div style={{ marginTop: "0.75rem" }}>
                  <button className="btn secondary" type="submit">
                    Save slot
                  </button>
                </div>
              </form>
            ))}
          </div>

          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Fees & policy</h2>
            <form onSubmit={savePolicy}>
              <div className="field">
                <label>Cancellation cut-off (minutes)</label>
                <input
                  className="input"
                  name="cancellationCutoffMinutes"
                  type="number"
                  defaultValue={data.policy.cancellationCutoffMinutes}
                />
              </div>
              <div className="field">
                <label>Refund window (hours)</label>
                <input
                  className="input"
                  name="refundWindowHours"
                  type="number"
                  defaultValue={data.policy.refundWindowHours}
                />
              </div>
              <div className="field">
                <label>Delivery fee (paise)</label>
                <input
                  className="input"
                  name="deliveryFeePaise"
                  type="number"
                  defaultValue={data.policy.deliveryFeePaise}
                />
              </div>
              <div className="field">
                <label>Platform fee (paise)</label>
                <input
                  className="input"
                  name="platformFeePaise"
                  type="number"
                  defaultValue={data.policy.platformFeePaise}
                />
              </div>
              <button className="btn" type="submit">
                Save policy
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
