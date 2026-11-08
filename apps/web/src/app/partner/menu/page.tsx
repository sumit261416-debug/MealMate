"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { partnerFetch } from "@/lib/partner-api";
import { formatInrFromPaise } from "@/lib/format";
import { Badge, EmptyState, ErrorBanner, PageHeader } from "@/components/ui";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  isVeg: boolean;
  allergens: string | null;
  dailyCapacity: number | null;
  isAvailable: boolean;
};

type Menu = {
  id: string;
  title: string;
  isPublished: boolean;
  items: MenuItem[];
};

export default function PartnerMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [, startTransition] = useTransition();

  // Form states for new dish
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriceRs, setNewPriceRs] = useState("99");
  const [newIsVeg, setNewIsVeg] = useState(true);
  const [newAllergens, setNewAllergens] = useState("");
  const [newCapacity, setNewCapacity] = useState("50");
  const [creating, setCreating] = useState(false);

  function loadMenus() {
    setLoading(true);
    startTransition(() => {
      partnerFetch<Menu[]>("/menu")
        .then((res) => {
          setMenus(res);
          setError(null);
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    });
  }

  useEffect(() => {
    loadMenus();
  }, []);

  async function toggleAvailability(item: MenuItem) {
    setBusyItemId(item.id);
    try {
      await partnerFetch(`/menu/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      loadMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle availability");
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleCreateItem(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const pricePaise = Math.round(parseFloat(newPriceRs) * 100);
      const dailyCapacity = newCapacity ? parseInt(newCapacity, 10) : undefined;

      await partnerFetch("/menu/items", {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          pricePaise,
          isVeg: newIsVeg,
          allergens: newAllergens,
          dailyCapacity,
          isAvailable: true,
        }),
      });

      setShowAddModal(false);
      setNewName("");
      setNewDesc("");
      setNewPriceRs("99");
      loadMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create menu item");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Kitchen Menu & Daily Dishes"
        description="Manage your kitchen dishes, adjust daily portion capacity, and toggle items In-Stock or Sold-Out."
        actions={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn secondary" type="button" onClick={loadMenus}>
              Refresh
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={() => setShowAddModal(true)}
            >
              + Add New Dish
            </button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* Add New Dish Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem",
          }}
        >
          <div
            className="panel"
            style={{
              maxWidth: "520px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: "1.3rem" }}>Add New Kitchen Dish</h2>
            <p className="muted" style={{ fontSize: "0.88rem", marginTop: "-0.5rem" }}>
              Add a regular meal or thali to your daily kitchen menu.
            </p>

            <form onSubmit={handleCreateItem}>
              <div className="field">
                <label htmlFor="dish-name">Dish Name *</label>
                <input
                  id="dish-name"
                  className="input"
                  required
                  placeholder="e.g. Deluxe Paneer Thali"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="dish-desc">Description & Items Included</label>
                <textarea
                  id="dish-desc"
                  className="textarea"
                  rows={2}
                  placeholder="e.g. Shahi paneer, dal fry, 4 phulkas, jeera rice, salad"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="field">
                  <label htmlFor="dish-price">Price (₹) *</label>
                  <input
                    id="dish-price"
                    className="input"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={newPriceRs}
                    onChange={(e) => setNewPriceRs(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="dish-capacity">Daily Capacity</label>
                  <input
                    id="dish-capacity"
                    className="input"
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="dish-allergens">Allergens (if any)</label>
                <input
                  id="dish-allergens"
                  className="input"
                  placeholder="e.g. Dairy, Gluten, Peanuts"
                  value={newAllergens}
                  onChange={(e) => setNewAllergens(e.target.value)}
                />
              </div>

              <div className="field" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                <input
                  id="dish-veg"
                  type="checkbox"
                  checked={newIsVeg}
                  onChange={(e) => setNewIsVeg(e.target.checked)}
                  style={{ width: "1.1rem", height: "1.1rem", cursor: "pointer" }}
                />
                <label htmlFor="dish-veg" style={{ margin: 0, cursor: "pointer", fontWeight: 600 }}>
                  Pure Vegetarian Dish (Green Dot)
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={creating}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={creating}>
                  {creating ? "Adding Dish…" : "Save to Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && <div className="empty-state">Loading kitchen menu items…</div>}

      {!loading && menus.length === 0 && (
        <EmptyState message="No menus found. Click '+ Add New Dish' to begin." />
      )}

      {!loading &&
        menus.map((menu) => (
          <div key={menu.id} className="panel" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{menu.title}</h2>
                <span style={{ fontSize: "0.82rem", color: "var(--muted, #64748b)" }}>
                  {menu.items.length} items configured
                </span>
              </div>
              <Badge tone={menu.isPublished ? "ok" : "warn"}>
                {menu.isPublished ? "Published to Customers" : "Draft (Pending Admin Review)"}
              </Badge>
            </div>

            {menu.items.length === 0 ? (
              <EmptyState message="No dishes in this menu yet. Add dishes so customers can order." />
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {menu.items.map((item) => {
                  const isBusy = busyItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid rgba(22, 48, 34, 0.1)",
                        borderRadius: "12px",
                        padding: "1rem 1.25rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem",
                        background: item.isAvailable ? "#ffffff" : "rgba(239, 68, 68, 0.04)",
                        opacity: item.isAvailable ? 1 : 0.75,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "220px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: "12px",
                              height: "12px",
                              borderRadius: "3px",
                              border: `2px solid ${item.isVeg ? "#10b981" : "#ef4444"}`,
                              background: item.isVeg ? "#10b981" : "#ef4444",
                            }}
                            title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                          />
                          <strong style={{ fontSize: "1.05rem" }}>{item.name}</strong>
                          <span style={{ fontWeight: 800, color: "var(--brand, #1a7a52)" }}>
                            {formatInrFromPaise(item.pricePaise)}
                          </span>
                        </div>
                        {item.description && (
                          <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "var(--muted, #64748b)" }}>
                            {item.description}
                          </p>
                        )}
                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "0.78rem", color: "var(--muted, #64748b)" }}>
                          {item.dailyCapacity && <span>Capacity: {item.dailyCapacity} meals/day</span>}
                          {item.allergens && <span>Allergens: {item.allergens}</span>}
                        </div>
                      </div>

                      {/* Instant In-Stock / Sold-Out Toggle */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <Badge tone={item.isAvailable ? "ok" : "danger"}>
                          {item.isAvailable ? "In Stock" : "Sold Out"}
                        </Badge>
                        <button
                          type="button"
                          className={`btn ${item.isAvailable ? "secondary" : "primary"}`}
                          disabled={isBusy}
                          onClick={() => void toggleAvailability(item)}
                          style={{
                            fontSize: "0.85rem",
                            padding: "0.45rem 0.9rem",
                            background: item.isAvailable ? undefined : "#10b981",
                            borderColor: item.isAvailable ? undefined : "#059669",
                          }}
                        >
                          {isBusy ? "Updating…" : item.isAvailable ? "Mark as Sold Out" : "Mark as In Stock"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
