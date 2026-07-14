const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const authApi = {
  login: (username, password) => api("/auth/login", { method: "POST", body: { username, password } }),
  logout: () => api("/auth/logout", { method: "POST" }),
  bootstrap: () => api("/auth/bootstrap"),
};

export const franchisesApi = {
  create: (data) => api("/franchises", { method: "POST", body: data }),
  update: (id, data) => api(`/franchises/${id}`, { method: "PATCH", body: data }),
  remove: (id) => api(`/franchises/${id}`, { method: "DELETE" }),
};

export const ordersApi = {
  create: (data) => api("/orders", { method: "POST", body: data }),
};

export const paymentsApi = {
  create: (data) => api("/payments", { method: "POST", body: data }),
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
