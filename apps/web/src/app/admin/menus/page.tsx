"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { formatInrFromPaise } from "@/lib/format";
import {
  Badge,
  EmptyState,
  ErrorBanner,
  PageHeader,
} from "@/components/ui";

type MenuRow = {
  id: string;
  title: string;
  isPublished: boolean;
  partner: { businessName: string; status: string };
  items: { id: string; name: string; pricePaise: number; isAvailable: boolean }[];
};

type ListResponse = { items: MenuRow[]; total: number };

export default function MenusPage() {
  const [published, setPublished] = useState("");
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (published) params.set("published", published);
    setData(await adminFetch<ListResponse>(`/menus?${params}`));
  }, [published]);

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function togglePublish(id: string, isPublished: boolean) {
    setBusyId(id);
    try {
      await adminFetch(`/menus/${id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished }),
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
        title="Menu review"
        description="Publish only for approved kitchen partners."
      />
      {error ? <ErrorBanner message={error} /> : null}
      <div className="toolbar">
        <select
          className="select"
          value={published}
          onChange={(e) => setPublished(e.target.value)}
        >
          <option value="">All</option>
          <option value="false">Unpublished</option>
          <option value="true">Published</option>
        </select>
        <button className="btn secondary" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {!data ? (
        <EmptyState message="Loading menus…" />
      ) : (
        <div className="panel anim-rise">
          <table className="table">
            <thead>
              <tr>
                <th>Menu</th>
                <th>Partner</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((menu) => (
                <tr key={menu.id}>
                  <td>{menu.title}</td>
                  <td>
                    {menu.partner.businessName}{" "}
                    <Badge>{menu.partner.status}</Badge>
                  </td>
                  <td>
                    {menu.items
                      .map(
                        (item) =>
                          `${item.name} (${formatInrFromPaise(item.pricePaise)})`,
                      )
                      .join(", ")}
                  </td>
                  <td>
                    <Badge tone={menu.isPublished ? "ok" : "warn"}>
                      {menu.isPublished ? "published" : "unpublished"}
                    </Badge>
                  </td>
                  <td>
                    {menu.isPublished ? (
                      <button
                        className="btn secondary"
                        type="button"
                        disabled={busyId === menu.id}
                        onClick={() => void togglePublish(menu.id, false)}
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        className="btn"
                        type="button"
                        disabled={busyId === menu.id}
                        onClick={() => void togglePublish(menu.id, true)}
                      >
                        Publish
                      </button>
                    )}
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
