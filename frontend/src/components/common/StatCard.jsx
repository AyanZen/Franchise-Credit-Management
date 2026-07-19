export default function StatCard({ label, value, tone, onClick }) {
  const className = `stat-card tone-${tone}${onClick ? " stat-card--clickable" : ""}`;

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </button>
    );
  }

  return (
    <div className={className}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
