import {
  Package, Users, Bell, ClipboardList, Settings as SettingsIcon, LogOut, TrendingUp,
} from "lucide-react";

export default function Sidebar({ view, setView, currentUser, onLogout, alertCount }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: TrendingUp },
    { key: "franchises", label: "Franchises", icon: Package },
    { key: "alerts", label: "Alerts", icon: Bell, badge: alertCount },
    { key: "activity", label: "Activity Log", icon: ClipboardList },
  ];
  if (currentUser.role === "admin") {
    items.push({ key: "users", label: "Employees", icon: Users });
    items.push({ key: "settings", label: "Settings", icon: SettingsIcon });
  }
  return (
    <aside className="sidebar">
      <div className="side-top">
        <div className="side-mark">DL</div>
        <div className="side-title">Dispatch Ledger</div>
      </div>
      <nav>
        {items.map((it) => (
          <button
            key={it.key}
            className={`side-item ${view === it.key ? "active" : ""}`}
            onClick={() => setView(it.key)}
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
        <button className="btn btn-ghost btn-block" onClick={onLogout}>
          <LogOut size={15} /> Log out
        </button>
      </div>
    </aside>
  );
}
