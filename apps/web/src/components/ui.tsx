export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function StatCard({
  label,
  value,
  index = 0,
}: {
  label: string;
  value: string | number;
  index?: number;
}) {
  return (
    <div
      className="stat-card anim-rise"
      style={{ animationDelay: `${0.06 + index * 0.05}s` }}
    >
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="empty-state">{message}</div>;
}

export function ErrorBanner({
  message,
  shake = false,
}: {
  message: string;
  shake?: boolean;
}) {
  return (
    <div className={shake ? "error-banner anim-shake" : "error-banner"} role="alert">
      {message}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger" | "info";
}) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`panel anim-rise ${className}`.trim()}>{children}</div>;
}

export function partnerTone(
  status: string,
): "neutral" | "ok" | "warn" | "danger" {
  if (status === "approved") return "ok";
  if (status === "submitted" || status === "under_review") return "warn";
  if (status === "rejected" || status === "suspended") return "danger";
  return "neutral";
}

export function orderTone(
  status: string,
): "neutral" | "ok" | "warn" | "danger" {
  if (status === "delivered") return "ok";
  if (status === "cancelled" || status === "payment_failed") return "danger";
  if (status === "placed" || status === "preparing" || status === "ready")
    return "warn";
  return "neutral";
}
