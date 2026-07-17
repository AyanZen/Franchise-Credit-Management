const HTML_ESCAPE = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch]);
}

export function trimString(value, maxLen = 500) {
  if (value == null) return "";
  return String(value).trim().slice(0, maxLen);
}

export function sanitizeUsername(username) {
  const value = trimString(username, 64);
  if (!value || !/^[a-zA-Z0-9._-]+$/.test(value)) return null;
  return value;
}

export function sanitizeRole(role) {
  return role === "admin" ? "admin" : "staff";
}

export function isValidCuid(id) {
  return typeof id === "string" && /^c[a-z0-9]{24,}$/i.test(id);
}
