import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ theme, onToggle, compact = false, className = "" }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle${compact ? " theme-toggle--compact" : ""}${className ? ` ${className}` : ""}`}
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="theme-toggle__icon" aria-hidden>
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </span>
      {!compact && (
        <span className="theme-toggle__label">{isDark ? "Light mode" : "Dark mode"}</span>
      )}
    </button>
  );
}
