"use client";

import styles from "./admin-list.module.css";

export function AdminListChrome({
  children,
  toolbar,
  error,
  empty,
  loading,
  total,
}: {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  error?: string | null;
  empty?: string | null;
  loading?: boolean;
  total?: number;
}) {
  return (
    <div className={styles.wrap}>
      {toolbar ? <div className={`toolbar ${styles.toolbar}`}>{toolbar}</div> : null}
      {error ? (
        <div className="error-banner" role="alert">
          {error}
        </div>
      ) : null}
      {loading ? <div className={`empty-state ${styles.state}`}>Loading…</div> : null}
      {!loading && empty ? (
        <div className={`empty-state ${styles.state}`}>{empty}</div>
      ) : null}
      {!loading && !empty ? (
        <div className={`panel anim-rise ${styles.panel}`}>
          {children}
          {typeof total === "number" ? (
            <p className="muted" style={{ marginTop: "0.85rem" }}>
              Total: {total}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
