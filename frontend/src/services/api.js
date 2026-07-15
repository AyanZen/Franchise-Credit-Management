import { SERVER_WAKE_UP_MESSAGE, toApiError } from "../lib/apiErrors.js";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export async function api(path, options = {}) {
  const token = getToken();
  let res;

  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (err) {
    throw new Error(toApiError(err));
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if ([502, 503, 504].includes(res.status)) {
      throw new Error(SERVER_WAKE_UP_MESSAGE);
    }
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
}

export const authApi = {
  login: (username, password) => api("/auth/login", { method: "POST", body: { username, password } }),
  logout: () => api("/auth/logout", { method: "POST" }),
  bootstrap: () => api("/auth/bootstrap"),
  changePassword: (currentPassword, newPassword) =>
    api("/auth/password", { method: "PATCH", body: { currentPassword, newPassword } }),
};

export const franchisesApi = {
  create: (data) => api("/franchises", { method: "POST", body: data }),
  update: (id, data) => api(`/franchises/${id}`, { method: "PATCH", body: data }),
  remove: (id) => api(`/franchises/${id}`, { method: "DELETE" }),
};

export const ordersApi = {
  create: (data) => api("/orders", { method: "POST", body: data }),
  update: (id, data) => api(`/orders/${id}`, { method: "PATCH", body: data }),
  remove: (id) => api(`/orders/${id}`, { method: "DELETE" }),
};

export const paymentsApi = {
  create: (data) => api("/payments", { method: "POST", body: data }),
  update: (id, data) => api(`/payments/${id}`, { method: "PATCH", body: data }),
  remove: (id) => api(`/payments/${id}`, { method: "DELETE" }),
};

export const remindersApi = {
  create: (data) => api("/reminders", { method: "POST", body: data }),
};

export const usersApi = {
  create: (data) => api("/users", { method: "POST", body: data }),
  remove: (id) => api(`/users/${id}`, { method: "DELETE" }),
};

export const settingsApi = {
  update: (data) => api("/settings", { method: "PATCH", body: data }),
};
