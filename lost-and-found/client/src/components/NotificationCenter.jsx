import { useState, useEffect, useRef } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences
} from "../api";

export default function NotificationCenter({
  user,
  onNavigateToItem,
  onOpenClaimReview
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullModalOpen, setFullModalOpen] = useState(false);
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    potentialMatches: true,
    unresolvedReminders: true,
    adminAnnouncements: true,
    claimUpdates: true,
    securityAlerts: true
  });
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefAlert, setPrefAlert] = useState("");
  const dropdownRef = useRef(null);

  const loadPreferences = async () => {
    try {
      const res = await getNotificationPreferences();
      if (res.success && res.data) setPreferences(res.data);
    } catch {
      // silent
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setPrefSaving(true);
      setPrefAlert("");
      const res = await updateNotificationPreferences(preferences);
      if (res.success) {
        setPrefAlert("Preferences saved successfully!");
        setTimeout(() => {
          setPrefAlert("");
          setPrefsModalOpen(false);
        }, 1500);
      }
    } catch (err) {
      setPrefAlert(err.message || "Failed to save preferences");
    } finally {
      setPrefSaving(false);
    }
  };

  const fetchNotificationData = async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        getUnreadNotificationCount(),
        getNotifications(false)
      ]);
      if (countRes.success) setUnreadCount(countRes.unreadCount);
      if (listRes.success) setNotifications(listRes.data || []);
    } catch {
      // background polling fail silent
    }
  };

  useEffect(() => {
    fetchNotificationData();

    // Auto-refresh interval (polling every 10 seconds)
    const interval = setInterval(fetchNotificationData, 10000);

    // Refresh when user returns to window tab
    const handleFocus = () => fetchNotificationData();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await deleteNotification(id);
      const target = notifications.find((n) => n._id === id);
      if (target && !target.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }

    if (notif.claimId && onOpenClaimReview) {
      onOpenClaimReview(notif.claimId, notif);
      setIsOpen(false);
      setFullModalOpen(false);
      return;
    }

    if (notif.relatedItemId && onNavigateToItem) {
      onNavigateToItem(notif.relatedItemId);
      setIsOpen(false);
      setFullModalOpen(false);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case "possible_match":
      case "matching_lost_report":
        return { icon: "bi-stars", color: "#46d369" };
      case "claim_request":
        return { icon: "bi-patch-question-fill", color: "#f59e0b" };
      case "claim_status":
        return { icon: "bi-shield-check", color: "#38bdf8" };
      case "item_returned":
        return { icon: "bi-check-circle-fill", color: "#46d369" };
      case "unresolved_reminder":
        return { icon: "bi-clock-history", color: "#fbbf24" };
      case "admin_alert":
        return { icon: "bi-shield-exclamation", color: "#e50914" };
      default:
        return { icon: "bi-bell-fill", color: "#a1a1aa" };
    }
  };

  return (
    <div className="position-relative notification-center-wrapper" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        className="btn btn-dark position-relative rounded-circle p-2 d-flex align-items-center justify-content-center"
        onClick={() => setIsOpen(!isOpen)}
        title="Campus Notifications"
        style={{
          width: "40px",
          height: "40px",
          backgroundColor: isOpen ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.15)"
        }}
      >
        <i className="bi bi-bell fs-5 text-light"></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.68rem", padding: "0.3em 0.55em", boxShadow: "0 0 10px rgba(229, 9, 20, 0.7)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="position-absolute end-0 mt-2 rounded shadow-lg notification-dropdown"
          style={{
            width: "380px",
            maxWidth: "90vw",
            backgroundColor: "#181818",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            zIndex: 1100,
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div className="p-3 border-bottom border-dark d-flex justify-content-between align-items-center bg-dark bg-opacity-50">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-light">Notifications</span>
              {unreadCount > 0 && (
                <span className="badge bg-danger rounded-pill" style={{ fontSize: "0.7rem" }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-link text-secondary p-0"
                title="Notification Settings"
                onClick={() => {
                  loadPreferences();
                  setIsOpen(false);
                  setPrefsModalOpen(true);
                }}
              >
                <i className="bi bi-gear-fill"></i>
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none text-muted p-0"
                  style={{ fontSize: "0.78rem" }}
                  onClick={handleMarkAllRead}
                  disabled={loading}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted">
                <i className="bi bi-bell-slash fs-2 d-block mb-2 opacity-50"></i>
                <div className="small">No notifications yet</div>
                <div className="text-secondary" style={{ fontSize: "0.72rem" }}>
                  You will be notified when matching items, claim requests, or reminders occur.
                </div>
              </div>
            ) : (
              notifications.slice(0, 15).map((notif) => {
                const { icon, color } = getIconForType(notif.type);
                return (
                  <div
                    key={notif._id}
                    className={`notification-item p-3 border-bottom border-dark position-relative transition-all ${
                      !notif.isRead ? "unread-notif" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: !notif.isRead ? "rgba(229, 9, 20, 0.06)" : "transparent"
                    }}
                  >
                    <div className="d-flex gap-3 align-items-start">
                      <div
                        className="rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{
                          width: "36px",
                          height: "36px",
                          backgroundColor: `${color}22`,
                          color
                        }}
                      >
                        <i className={`bi ${icon} fs-5`}></i>
                      </div>

                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="d-flex justify-content-between align-items-start gap-1">
                          <span
                            className={`small ${!notif.isRead ? "fw-bold text-light" : "text-light-emphasis"}`}
                            style={{ fontSize: "0.82rem" }}
                          >
                            {notif.title}
                          </span>
                          {!notif.isRead && (
                            <span
                              className="rounded-circle bg-danger flex-shrink-0"
                              style={{ width: "8px", height: "8px", marginTop: "5px" }}
                            ></span>
                          )}
                        </div>

                        <p
                          className="text-muted mb-1 small"
                          style={{
                            fontSize: "0.75rem",
                            lineHeight: "1.35",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden"
                          }}
                        >
                          {notif.message}
                        </p>

                        <div className="d-flex justify-content-between align-items-center pt-1">
                          <span className="text-secondary" style={{ fontSize: "0.68rem" }}>
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })} • {new Date(notif.createdAt).toLocaleDateString()}
                          </span>

                          <div className="d-flex gap-2">
                            {!notif.isRead && (
                              <button
                                type="button"
                                className="btn btn-link btn-sm text-secondary p-0"
                                style={{ fontSize: "0.68rem" }}
                                onClick={(e) => handleMarkAsRead(notif._id, e)}
                                title="Mark read"
                              >
                                Mark read
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-link btn-sm text-danger p-0 opacity-75"
                              style={{ fontSize: "0.68rem" }}
                              onClick={(e) => handleDelete(notif._id, e)}
                              title="Delete notification"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 text-center bg-dark bg-opacity-75 border-top border-dark">
              <button
                type="button"
                className="btn btn-sm btn-link text-light text-decoration-none"
                style={{ fontSize: "0.78rem" }}
                onClick={() => {
                  setIsOpen(false);
                  setFullModalOpen(true);
                }}
              >
                View all notifications ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Full Notification Center Modal */}
      {fullModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)", zIndex: 1200 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content bg-dark text-light border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i className="bi bi-bell text-danger"></i> CampusFlix Notification Center
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setFullModalOpen(false)}
                ></button>
              </div>

              <div className="modal-body p-0">
                <div className="p-3 bg-black bg-opacity-25 border-bottom border-secondary d-flex justify-content-between align-items-center">
                  <span className="small text-muted">
                    Total: {notifications.length} notifications ({unreadCount} unread)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light"
                      onClick={handleMarkAllRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="p-3">
                  {notifications.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 mb-2 d-block"></i>
                      No notifications recorded.
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const { icon, color } = getIconForType(notif.type);
                      return (
                        <div
                          key={notif._id}
                          className={`p-3 rounded mb-2 border ${
                            !notif.isRead
                              ? "border-danger border-opacity-50 bg-black"
                              : "border-secondary border-opacity-25"
                          }`}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div className="d-flex align-items-center gap-2">
                              <i className={`bi ${icon}`} style={{ color }}></i>
                              <span className="fw-bold">{notif.title}</span>
                              {!notif.isRead && (
                                <span className="badge bg-danger">New</span>
                              )}
                            </div>
                            <span className="small text-muted">
                              {new Date(notif.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <p className="text-light-emphasis small mb-2">{notif.message}</p>

                          <div className="d-flex justify-content-between align-items-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-0 px-2"
                              style={{ fontSize: "0.78rem" }}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-link text-muted py-0 px-1"
                              onClick={(e) => handleDelete(notif._id, e)}
                            >
                              <i className="bi bi-trash"></i> Dismiss
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-outline-light me-auto"
                  onClick={() => {
                    loadPreferences();
                    setPrefsModalOpen(true);
                  }}
                >
                  <i className="bi bi-gear-fill me-1"></i> Notification Preferences
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFullModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Preferences Modal (Phase 8) */}
      {prefsModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 1250 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
                  <i className="bi bi-sliders text-danger"></i> Notification Settings
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setPrefsModalOpen(false)}
                ></button>
              </div>

              <form onSubmit={handleSavePreferences}>
                <div className="modal-body p-4">
                  <p className="small text-secondary mb-3">
                    Customize your notification preferences. Mandatory security alerts remain active for campus integrity.
                  </p>

                  <div className="p-3 rounded bg-black border border-secondary mb-3">
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="nc-pref-matches"
                        checked={preferences.potentialMatches}
                        onChange={(e) => setPreferences({ ...preferences, potentialMatches: e.target.checked })}
                      />
                      <label className="form-check-label text-light fw-semibold small" htmlFor="nc-pref-matches">
                        Potential Match Notifications (Optional)
                      </label>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                        Alerts when reported lost or found items match your posts.
                      </div>
                    </div>

                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="nc-pref-reminders"
                        checked={preferences.unresolvedReminders}
                        onChange={(e) => setPreferences({ ...preferences, unresolvedReminders: e.target.checked })}
                      />
                      <label className="form-check-label text-light fw-semibold small" htmlFor="nc-pref-reminders">
                        Unresolved Reminders (Day 1, 3, 7, 14) (Optional)
                      </label>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                        Periodic automated follow-up check-ins for active missing items.
                      </div>
                    </div>

                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="nc-pref-admin"
                        checked={preferences.adminAnnouncements}
                        onChange={(e) => setPreferences({ ...preferences, adminAnnouncements: e.target.checked })}
                      />
                      <label className="form-check-label text-light fw-semibold small" htmlFor="nc-pref-admin">
                        Administrative Announcements (Optional)
                      </label>
                      <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                        Broadcasts and manual security desk case messages.
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-black border border-secondary small text-muted">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span>Claim & Verification Updates:</span>
                      <span className="badge bg-secondary">Mandatory / Locked</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Physical Handover Confirmations:</span>
                      <span className="badge bg-secondary">Mandatory / Locked</span>
                    </div>
                  </div>

                  {prefAlert && (
                    <div className="alert alert-info py-2 small mt-3 mb-0">
                      {prefAlert}
                    </div>
                  )}
                </div>

                <div className="modal-footer border-secondary">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPrefsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={prefSaving}
                  >
                    {prefSaving ? "Saving..." : "Save Preferences"}
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
