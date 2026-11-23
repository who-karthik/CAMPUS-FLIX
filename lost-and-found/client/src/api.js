const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const headers = {};
  const savedUser = localStorage.getItem("campus_user");
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      headers["x-user-data"] = JSON.stringify(user);
      headers["Authorization"] = `Bearer token-${user.role || "student"}-${Date.now()}`;
    } catch {
      // ignore
    }
  }
  return headers;
}

async function request(path, options = {}) {
  const authHeaders = getAuthHeaders();
  const response = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers
    },
    ...options
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Something went wrong");
  return result;
}

// Items APIs
export const getItems = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
  return request(`/items${query.toString() ? `?${query}` : ""}`);
};

export const getItemById = (id) => request(`/items/${id}`);

export const createItem = (data) =>
  request("/items", { method: "POST", body: JSON.stringify(data) });

export const updateItem = (id, data) =>
  request(`/items/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const updateStatus = (id, status) =>
  request(`/items/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const deleteItem = (id) =>
  request(`/items/${id}`, { method: "DELETE" });

// Image Upload
export const uploadItemImage = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("image", file);

  const authHeaders = getAuthHeaders();
  delete authHeaders["Content-Type"]; // Multer sets its own boundary

  const response = await fetch(`${API}/items/upload-image`, {
    method: "POST",
    headers: authHeaders,
    body: formData
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "Image upload failed");
  return result;
};

// Smart Suggestions & Matches
export const getSuggestions = ({ q = "", type = "Found", category = "", location = "" }) => {
  const params = new URLSearchParams({ q, type, category, location });
  return request(`/matches/suggestions?${params.toString()}`);
};

export const getItemMatches = (id) => request(`/matches/item/${id}`);

export const recalculateMatches = () =>
  request("/matches/recalculate", { method: "POST" });

// Notifications
export const getNotifications = (unreadOnly = false) =>
  request(`/notifications${unreadOnly ? "?unreadOnly=true" : ""}`);

export const getUnreadNotificationCount = () =>
  request("/notifications/unread-count");

export const markNotificationRead = (id) =>
  request(`/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
  request("/notifications/read-all", { method: "PATCH" });

export const deleteNotification = (id) =>
  request(`/notifications/${id}`, { method: "DELETE" });

// Claims
export const submitClaim = (claimData) =>
  request("/claims", { method: "POST", body: JSON.stringify(claimData) });

export const getClaims = () => request("/claims");

export const updateClaimStatus = (id, status, reviewNotes = "") =>
  request(`/claims/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reviewNotes })
  });

// Admin Reminders & Unresolved Cases
export const getAdminReminders = (filter = "all") =>
  request(`/admin/reminders?filter=${filter}`);

export const sendAdminManualReminder = (itemId) =>
  request(`/admin/reminders/${itemId}/send`, { method: "POST" });

export const getReminderHistory = () =>
  request("/admin/reminders/history");

// Authentication
export const loginUser = (credentials) =>
  request("/auth/login", { method: "POST", body: JSON.stringify(credentials) });

export const registerUser = (userData) =>
  request("/auth/register", { method: "POST", body: JSON.stringify(userData) });
