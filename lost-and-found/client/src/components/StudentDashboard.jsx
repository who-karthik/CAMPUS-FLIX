import { useState, useEffect, useMemo } from "react";
import {
  getClaims,
  getNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  updateItem,
  deleteItem
} from "../api";

export default function StudentDashboard({
  user,
  items = [],
  onOpenItem,
  onMatches,
  onRefresh,
  onOpenQR
}) {
  const [activeTab, setActiveTab] = useState("lost"); // lost, found, matches, claims, notifications, returned, preferences
  const [userClaims, setUserClaims] = useState([]);
  const [userNotifs, setUserNotifs] = useState([]);
  const [preferences, setPreferences] = useState({
    potentialMatches: true,
    unresolvedReminders: true,
    adminAnnouncements: true,
    claimUpdates: true,
    securityAlerts: true
  });
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefMessage, setPrefMessage] = useState("");

  // Edit item modal state
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    itemName: "",
    description: "",
    location: "",
    contact: "",
    imageUrl: ""
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const userEmail = (user?.email || "").toLowerCase().trim();

  // Filter student's own items
  const myItems = useMemo(() => {
    return items.filter((i) => {
      const itUser = (i.userId || "").toLowerCase().trim();
      const itContact = (i.contact || "").toLowerCase().trim();
      return itUser === userEmail || itContact === userEmail;
    });
  }, [items, userEmail]);

  const myLostItems = useMemo(
    () => myItems.filter((i) => i.type === "Lost" && i.status !== "Returned"),
    [myItems]
  );

  const myFoundItems = useMemo(
    () => myItems.filter((i) => i.type === "Found" && i.status !== "Returned"),
    [myItems]
  );

  const myReturnedItems = useMemo(
    () => myItems.filter((i) => i.status === "Returned"),
    [myItems]
  );

  // Items with detected matches
  const myItemsWithMatches = useMemo(
    () => myItems.filter((i) => (i.matchCount || 0) > 0 || i.type === "Lost"),
    [myItems]
  );

  // Load claims and notifications for student
  const loadDashboardData = async () => {
    try {
      setLoadingClaims(true);
      const [claimsRes, notifsRes, prefsRes] = await Promise.all([
        getClaims(),
        getNotifications(false),
        getNotificationPreferences()
      ]);
      if (claimsRes.success) setUserClaims(claimsRes.data || []);
      if (notifsRes.success) setUserNotifs(notifsRes.data || []);
      if (prefsRes.success && prefsRes.data) setPreferences(prefsRes.data);
    } catch (err) {
      console.warn("Dashboard data fetch error:", err.message);
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [userEmail]);

  // Handle editing student's own report
  const startEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      itemName: item.itemName || "",
      description: item.description || "",
      location: item.location || "",
      contact: item.contact || "",
      imageUrl: item.imageUrl || ""
    });
    setEditError("");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSavingEdit(true);
      await updateItem(editingItem._id, editForm);
      setSavingEdit(false);
      setEditingItem(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setSavingEdit(false);
      setEditError(err.message || "Failed to update report.");
    }
  };

  const handleDeleteOwnItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;
    try {
      await deleteItem(itemId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message || "Failed to delete report.");
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSavingPrefs(true);
      setPrefMessage("");
      const res = await updateNotificationPreferences(preferences);
      if (res.success) {
        setPrefMessage("Preferences saved successfully!");
        setTimeout(() => setPrefMessage(""), 3500);
      }
    } catch (err) {
      setPrefMessage("Failed to save preferences: " + err.message);
    } finally {
      setSavingPrefs(false);
    }
  };

  // Stats
  const stats = {
    totalReports: myItems.length,
    activeLost: myLostItems.length,
    foundReports: myFoundItems.length,
    pendingClaims: userClaims.filter((c) => c.status === "pending").length,
    returned: myReturnedItems.length
  };

  return (
    <div className="student-dashboard px-3 px-md-4 py-4">
      {/* Header Profile Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom border-dark">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center bg-danger text-white fw-bold fs-4"
            style={{ width: "54px", height: "54px" }}
          >
            {(user?.name || "S")[0].toUpperCase()}
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h3 className="fw-bold text-light mb-0">{user?.name || "Student"}</h3>
              <span className="badge bg-danger text-uppercase" style={{ fontSize: "0.68rem" }}>
                Student Portal
              </span>
            </div>
            <div className="text-secondary small">
              <i className="bi bi-envelope me-1"></i> {userEmail} • {user?.department || "MITAOE Campus"}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
          onClick={() => {
            loadDashboardData();
            if (onRefresh) onRefresh();
          }}
        >
          <i className="bi bi-arrow-clockwise"></i> Refresh Dashboard
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-md">
          <div className="p-3 rounded bg-black border border-secondary text-center">
            <div className="text-secondary small mb-1">Total Reports</div>
            <div className="fs-3 fw-bold text-light">{stats.totalReports}</div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="p-3 rounded bg-black border border-danger text-center">
            <div className="text-danger small mb-1">Active Lost</div>
            <div className="fs-3 fw-bold text-danger">{stats.activeLost}</div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="p-3 rounded bg-black border border-success text-center">
            <div className="text-success small mb-1">Found Reports</div>
            <div className="fs-3 fw-bold text-success">{stats.foundReports}</div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="p-3 rounded bg-black border border-warning text-center">
            <div className="text-warning small mb-1">Pending Claims</div>
            <div className="fs-3 fw-bold text-warning">{stats.pendingClaims}</div>
          </div>
        </div>
        <div className="col-6 col-md">
          <div className="p-3 rounded bg-black border border-info text-center">
            <div className="text-info small mb-1">Returned Items</div>
            <div className="fs-3 fw-bold text-info">{stats.returned}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-4 gap-2 border-bottom border-dark pb-2">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "lost" ? "active bg-danger" : "text-secondary"}`}
            onClick={() => setActiveTab("lost")}
          >
            <i className="bi bi-search me-1"></i> My Lost Reports ({stats.activeLost})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "found" ? "active bg-success" : "text-secondary"}`}
            onClick={() => setActiveTab("found")}
          >
            <i className="bi bi-box-seam me-1"></i> My Found Reports ({stats.foundReports})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "matches" ? "active bg-warning text-dark" : "text-secondary"}`}
            onClick={() => setActiveTab("matches")}
          >
            <i className="bi bi-stars me-1"></i> My Potential Matches ({myItemsWithMatches.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "claims" ? "active bg-info text-dark" : "text-secondary"}`}
            onClick={() => setActiveTab("claims")}
          >
            <i className="bi bi-shield-lock me-1"></i> My Claim Requests ({userClaims.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "notifications" ? "active bg-secondary text-light" : "text-secondary"}`}
            onClick={() => setActiveTab("notifications")}
          >
            <i className="bi bi-bell me-1"></i> My Notifications ({userNotifs.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "returned" ? "active bg-success" : "text-secondary"}`}
            onClick={() => setActiveTab("returned")}
          >
            <i className="bi bi-check2-circle me-1"></i> Returned Items ({stats.returned})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === "preferences" ? "active bg-secondary text-light" : "text-secondary"}`}
            onClick={() => setActiveTab("preferences")}
          >
            <i className="bi bi-gear-fill me-1"></i> Notification Settings
          </button>
        </li>
      </ul>

      {/* Tab 1: My Lost Reports */}
      {activeTab === "lost" && (
        <div>
          {myLostItems.length === 0 ? (
            <div className="text-center py-5 text-muted p-4 rounded bg-dark border border-secondary">
              <i className="bi bi-search fs-2 mb-2 d-block opacity-50"></i>
              <h5>No Active Lost Reports</h5>
              <p className="small text-secondary mb-0">
                You haven&apos;t reported any lost belongings currently missing.
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {myLostItems.map((item) => (
                <div key={item._id} className="col-12 col-md-6 col-lg-4">
                  <div className="card bg-dark text-light h-100 border-secondary">
                    <div className="card-body p-3 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="badge bg-danger">Lost</span>
                          <span className="badge bg-secondary">{item.status}</span>
                        </div>
                        <h6 className="fw-bold mb-1">{item.itemName}</h6>
                        <div className="text-muted small mb-2">
                          <i className="bi bi-geo-alt me-1 text-danger"></i> {item.location} • {item.category}
                        </div>
                        <p className="text-light-emphasis small mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 border-top border-dark d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info py-0 px-2"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => onOpenItem && onOpenItem(item)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-light py-0 px-2"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => handleDeleteOwnItem(item._id)}
                          >
                            Delete
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success py-0 px-2 d-flex align-items-center gap-1"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() => onMatches && onMatches(item)}
                        >
                          <i className="bi bi-stars"></i> Matches
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Found Reports */}
      {activeTab === "found" && (
        <div>
          {myFoundItems.length === 0 ? (
            <div className="text-center py-5 text-muted p-4 rounded bg-dark border border-secondary">
              <i className="bi bi-box-seam fs-2 mb-2 d-block opacity-50"></i>
              <h5>No Active Found Reports</h5>
              <p className="small text-secondary mb-0">
                You haven&apos;t submitted any found belongings currently awaiting collection.
              </p>
            </div>
          ) : (
            <div className="row g-3">
              {myFoundItems.map((item) => (
                <div key={item._id} className="col-12 col-md-6 col-lg-4">
                  <div className="card bg-dark text-light h-100 border-secondary">
                    <div className="card-body p-3 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="badge bg-success">Found</span>
                          <span className="badge bg-secondary">{item.status}</span>
                        </div>
                        <h6 className="fw-bold mb-1">{item.itemName}</h6>
                        <div className="text-muted small mb-2">
                          <i className="bi bi-geo-alt me-1 text-danger"></i> {item.location} • {item.category}
                        </div>
                        <p className="text-light-emphasis small mb-2 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 border-top border-dark d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info py-0 px-2"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => onOpenItem && onOpenItem(item)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-light py-0 px-2"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => handleDeleteOwnItem(item._id)}
                          >
                            Delete
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success py-0 px-2 d-flex align-items-center gap-1"
                          style={{ fontSize: "0.75rem" }}
                          onClick={() => onMatches && onMatches(item)}
                        >
                          <i className="bi bi-stars"></i> Matches
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Potential Matches */}
      {activeTab === "matches" && (
        <div>
          {myItemsWithMatches.length === 0 ? (
            <div className="text-center py-5 text-muted p-4 rounded bg-dark border border-secondary">
              <i className="bi bi-stars fs-2 mb-2 d-block opacity-50"></i>
              <h5>No Active Reports for Matching</h5>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {myItemsWithMatches.map((item) => (
                <div key={item._id} className="p-3 rounded bg-black border border-secondary d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className={`badge ${item.type === "Lost" ? "bg-danger" : "bg-success"}`}>{item.type}</span>
                      <h6 className="fw-bold text-light mb-0">{item.itemName}</h6>
                    </div>
                    <div className="text-muted small">
                      Location: {item.location} • Category: {item.category} • Date: {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                    onClick={() => onMatches && onMatches(item)}
                  >
                    <i className="bi bi-stars"></i> View Intelligent Matches
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: My Claim Requests */}
      {activeTab === "claims" && (
        <div>
          {userClaims.length === 0 ? (
            <div className="text-center py-5 text-muted p-4 rounded bg-dark border border-secondary">
              <i className="bi bi-shield-lock fs-2 mb-2 d-block opacity-50"></i>
              <h5>No Claim Requests</h5>
              <p className="small text-secondary mb-0">
                You haven&apos;t submitted any ownership claims for found items yet.
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {userClaims.map((claim) => {
                const isApproved = claim.status === "approved";
                const isRejected = claim.status === "rejected";
                const isHandedOver = claim.handoverStatus === "handed_over";

                return (
                  <div
                    key={claim._id}
                    className="p-3 rounded bg-black border border-secondary d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
                    style={{ borderLeft: `5px solid ${isApproved ? "#46d369" : isRejected ? "#e50914" : "#f59e0b"}` }}
                  >
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className={`badge ${isApproved ? "bg-success" : isRejected ? "bg-danger" : "bg-warning text-dark"}`}>
                          {claim.status.toUpperCase()}
                        </span>
                        {claim.claimReference && (
                          <span className="badge bg-secondary font-monospace">
                            Ref: {claim.claimReference}
                          </span>
                        )}
                        {isHandedOver && (
                          <span className="badge bg-success">
                            <i className="bi bi-check-circle-fill me-1"></i> Handover Complete
                          </span>
                        )}
                      </div>
                      <div className="text-muted small">
                        Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                      </div>
                      {claim.reviewNotes && (
                        <div className="text-light-emphasis small mt-1">
                          <strong>Admin Notes:</strong> {claim.reviewNotes}
                        </div>
                      )}
                    </div>

                    <div className="d-flex gap-2">
                      {isApproved && claim.claimReference && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
                          onClick={() => onOpenQR && onOpenQR(claim)}
                        >
                          <i className="bi bi-qr-code"></i> Show Handover QR
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: My Notifications */}
      {activeTab === "notifications" && (
        <div>
          {userNotifs.length === 0 ? (
            <div className="text-center py-5 text-muted p-4 rounded bg-dark border border-secondary">
              <i className="bi bi-bell-slash fs-2 mb-2 d-block opacity-50"></i>
              <h5>No Notifications</h5>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {userNotifs.map((n) => (
                <div
                  key={n._id}
                  className={`p-3 rounded bg-black border ${n.isRead ? "border-dark" : "border-danger"} d-flex align-items-start gap-3`}
                >
                  <i className="bi bi-bell-fill text-danger fs-5 mt-1"></i>
                  <div>
                    <div className="fw-semibold text-light">{n.title}</div>
                    <p className="text-light-emphasis small mb-1">{n.message}</p>
                    <span className="text-muted small" style={{ fontSize: "0.72rem" }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Successfully Returned Items */}
      {activeTab === "returned" && (
        <div>
          {myReturnedItems.length === 0 ? (
            <div className="text-center py-5 text-muted p-4 rounded bg-dark border border-secondary">
              <i className="bi bi-check2-circle fs-2 mb-2 d-block opacity-50"></i>
              <h5>No Returned Belongings Yet</h5>
            </div>
          ) : (
            <div className="row g-3">
              {myReturnedItems.map((item) => (
                <div key={item._id} className="col-12 col-md-6 col-lg-4">
                  <div className="card bg-dark text-light border-success">
                    <div className="card-body p-3">
                      <span className="badge bg-success mb-2">Returned</span>
                      <h6 className="fw-bold">{item.itemName}</h6>
                      <div className="small text-muted mb-2">{item.location} • {item.category}</div>
                      <p className="small text-secondary mb-0">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Notification Preferences (Phase 8) */}
      {activeTab === "preferences" && (
        <div className="p-4 rounded bg-black border border-secondary" style={{ maxWidth: "700px" }}>
          <h5 className="fw-bold text-light mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-sliders text-danger"></i> Notification Settings
          </h5>
          <p className="text-secondary small mb-4">
            Configure which optional campus alerts you wish to receive. Mandatory security and claim alerts remain enabled for campus safety.
          </p>

          <form onSubmit={handleSavePreferences}>
            {/* Optional Preferences */}
            <div className="mb-3 p-3 rounded bg-dark border border-secondary border-opacity-50">
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="pref-matches"
                  checked={preferences.potentialMatches}
                  onChange={(e) => setPreferences({ ...preferences, potentialMatches: e.target.checked })}
                />
                <label className="form-check-label text-light fw-semibold" htmlFor="pref-matches">
                  Potential Match Notifications (Optional)
                </label>
                <div className="text-muted small">
                  Receive automated alerts whenever someone reports an item matching your lost or found post.
                </div>
              </div>

              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="pref-reminders"
                  checked={preferences.unresolvedReminders}
                  onChange={(e) => setPreferences({ ...preferences, unresolvedReminders: e.target.checked })}
                />
                <label className="form-check-label text-light fw-semibold" htmlFor="pref-reminders">
                  Unresolved Lost Item Reminders (Optional)
                </label>
                <div className="text-muted small">
                  Receive Day 1, 3, 7, and 14 status check-ins for active missing belongings.
                </div>
              </div>

              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="pref-announcements"
                  checked={preferences.adminAnnouncements}
                  onChange={(e) => setPreferences({ ...preferences, adminAnnouncements: e.target.checked })}
                />
                <label className="form-check-label text-light fw-semibold" htmlFor="pref-announcements">
                  Administrative Announcements (Optional)
                </label>
                <div className="text-muted small">
                  Receive general campus security announcements and administrative follow-up alerts.
                </div>
              </div>
            </div>

            {/* Mandatory Alerts (Locked) */}
            <div className="mb-4 p-3 rounded bg-dark border border-secondary border-opacity-50">
              <h6 className="fw-bold text-light mb-2 small text-uppercase" style={{ letterSpacing: "1px" }}>
                Mandatory Security Alerts (Always Enabled)
              </h6>

              <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                <div>
                  <div className="text-light fw-semibold small">Claim Status & Verification Updates</div>
                  <div className="text-muted small" style={{ fontSize: "0.74rem" }}>
                    Critical notifications when your claim is approved or rejected by campus security.
                  </div>
                </div>
                <span className="badge bg-secondary">Locked</span>
              </div>

              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-light fw-semibold small">Physical Item Handover Confirmations</div>
                  <div className="text-muted small" style={{ fontSize: "0.74rem" }}>
                    Security verification receipts when an item is officially returned and case closed.
                  </div>
                </div>
                <span className="badge bg-secondary">Locked</span>
              </div>
            </div>

            {prefMessage && (
              <div className="alert alert-info py-2 small mb-3">
                {prefMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-danger d-flex align-items-center gap-2"
              disabled={savingPrefs}
            >
              {savingPrefs ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Saving Preferences...
                </>
              ) : (
                <>
                  <i className="bi bi-check2"></i> Save Notification Settings
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 1260 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">Edit Report: {editingItem.itemName}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingItem(null)}
                ></button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  {editError && (
                    <div className="alert alert-danger py-2 small mb-3">
                      {editError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small text-light fw-semibold">Item Title *</label>
                    <input
                      type="text"
                      className="form-control bg-black text-light border-secondary"
                      value={editForm.itemName}
                      onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-light fw-semibold">Description *</label>
                    <textarea
                      rows="3"
                      className="form-control bg-black text-light border-secondary"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-light fw-semibold">Campus Location *</label>
                    <input
                      type="text"
                      className="form-control bg-black text-light border-secondary"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-light fw-semibold">Contact Email / Phone *</label>
                    <input
                      type="text"
                      className="form-control bg-black text-light border-secondary"
                      value={editForm.contact}
                      onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-secondary">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingItem(null)}
                    disabled={savingEdit}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={savingEdit}
                  >
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
