const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Something went wrong");
  return result;
}

export const getItems = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
  return request(`/items${query.toString() ? `?${query}` : ""}`);
};
export const createItem = (data) => request("/items", { method: "POST", body: JSON.stringify(data) });
export const updateStatus = (id, status) => request(`/items/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteItem = (id) => request(`/items/${id}`, { method: "DELETE" });

export const loginUser = (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });
export const registerUser = (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) });
