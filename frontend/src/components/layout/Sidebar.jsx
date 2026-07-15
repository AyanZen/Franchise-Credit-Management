import {
  Package, Users, Bell, ClipboardList, Settings as SettingsIcon, LogOut, TrendingUp, X,
} from "lucide-react";

export default function Sidebar({
  view,
  setView,
  currentUser,
  onLogout,
  alertCount,
  mobileOpen,
  onClose,
}) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: TrendingUp },
    { key: "franchises", label: "Franchises", icon: Package },
    { key: "alerts", label: "Alerts", icon: Bell, badge: alertCount },
    { key: "activity", label: "Activity Log", icon: ClipboardList },
  ];
  if (currentUser.role === "admin") {
    items.push({ key: "users", label: "Employees", icon: Users });
  }
  items.push({ key: "settings", label: "Settings", icon: SettingsIcon });

  function navigate(key) {
    setView(key);
    onClose?.();
  }

  return (
    <aside className={`sidebar${mobileOpen ? " sidebar--open" : ""}`}>
      <div className="side-top">
        <div className="side-mark">DL</div>
        <div className="side-title">Dispatch Ledger</div>
        {onClose && (
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <nav>
        {items.map((it) => (
          <button
            key={it.key}
            className={`side-item ${view === it.key ? "active" : ""}`}
            onClick={() => navigate(it.key)}
          >
            <it.icon size={17} />
            <span>{it.label}</span>
            {!!it.badge && <span className="side-badge">{it.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="side-user">
        <div className="side-user-name">{currentUser.name}</div>
        <div className="side-user-role">{currentUser.role}</div>
        <button
          className="btn btn-ghost btn-block"
          onClick={() => {
            onClose?.();
            onLogout();
          }}
        >
          <LogOut size={15} /> Log out
        </button>
      </div>
    </aside>
  );
}
