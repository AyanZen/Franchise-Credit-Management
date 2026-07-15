import { Menu, X } from "lucide-react";

export default function MobileHeader({ menuOpen, onToggle }) {
  return (
    <header className="mobile-topbar">
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={onToggle}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div className="mobile-topbar-brand">
        <div className="side-mark">DL</div>
        <span className="mobile-topbar-title">Dispatch Ledger</span>
      </div>
    </header>
  );
}
