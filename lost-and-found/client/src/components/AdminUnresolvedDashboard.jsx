import { useState, useEffect } from "react";
import {
  getAdminReminders,
  sendAdminManualReminder,
  updateStatus,
  getReminderHistory
} from "../api";
import { openGmailCompose } from "../App";
import AdminAnalyticsDashboard from "./AdminAnalyticsDashboard.jsx";
import ClaimHandoverVerificationModal from "./ClaimHandoverVerificationModal.jsx";

export default function AdminUnresolvedDashboard({
  onViewItem,
  onViewMatches,
  onStatusUpdated
}) {
  const [unresolvedItems, setUnresolvedItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, critical: 0, high: 0, attention: 0, normal: 0 });
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [reminderHistoryOpen, setReminderHistoryOpen] = useState(false);
  const [reminderHistoryLogs, setReminderHistoryLogs] = useState([]);
  const [adminViewTab, setAdminViewTab] = useState("cases"); // cases or analytics
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);

  const loadUnresolvedData = async () => {
    try {
      setLoading(true);
      const res = await getAdminReminders(activeFilter);
      if (res.success) {
        setUnresolvedItems(res.data || []);
        if (res.summary) setSummary(res.summary);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnresolvedData();
  }, [activeFilter]);

  const handleSendReminder = async (item) => {
    try {
      const res = await sendAdminManualReminder(item._id);
      setActionMessage(`Reminder sent to ${item.contact}!`);
      setTimeout(() => setActionMessage(""), 4000);
      loadUnresolvedData();
    } catch (err) {
      alert(err.message || "Failed to send manual reminder.");
    }
  };

  const handleMarkReturned = async (itemId) => {
    if (!window.confirm("Confirm marking this lost item as Returned? This resolves the case and stops reminders.")) return;
    try {
      await updateStatus(itemId, "Returned");
      setActionMessage("Item marked as Returned. Case closed.");
      setTimeout(() => setActionMessage(""), 4000);
      loadUnresolvedData();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      alert(err.message || "Failed to update item status.");
    }
  };

  const openHistoryModal = async () => {
    try {
      const res = await getReminderHistory();
      if (res.success) setReminderHistoryLogs(res.data || []);
      setReminderHistoryOpen(true);
    } catch (err) {
      alert(err.message || "Failed to load reminder history.");
    }
  };

  const getPriorityBadge = (priority, level) => {
    switch (level) {
      case 4:
        return (
          <span className="badge bg-danger text-uppercase px-2 py-1 pulse-badge" style={{ fontSize: "0.72rem" }}>
            <i className="bi bi-exclamation-octagon-fill me-1"></i> Critical Follow-up
          </span>
        );
      case 3:
        return (
          <span className="badge bg-warning text-dark text-uppercase px-2 py-1" style={{ fontSize: "0.72rem" }}>
            <i className="bi bi-exclamation-triangle-fill me-1"></i> High Priority
          </span>
        );
      case 2:
        return (
          <span className="badge bg-info text-dark text-uppercase px-2 py-1" style={{ fontSize: "0.72rem" }}>
            <i className="bi bi-info-circle-fill me-1"></i> Needs Attention
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary text-uppercase px-2 py-1" style={{ fontSize: "0.72rem" }}>
            <i className="bi bi-clock me-1"></i> Normal
          </span>
        );
    }
  };

  return (
    <div className="admin-unresolved-dashboard mt-4">
      {/* Section Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 pb-2 border-bottom border-dark">
        <div>
          <h4 className="fw-bold text-light mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-shield-exclamation text-danger"></i>
            Campus Case Administration & Oversight
          </h4>
          <p className="text-muted small mb-0">
            Monitor open lost reports, verify physical claim handovers, and review real-time database intelligence.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-sm btn-success d-flex align-items-center gap-1"
            onClick={() => setHandoverModalOpen(true)}
          >
            <i className="bi bi-qr-code-scan"></i> Verify Claim Handover (QR)
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
            onClick={openHistoryModal}
          >
            <i className="bi bi-clock-history"></i> Reminder History
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
            onClick={loadUnresolvedData}
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="d-flex gap-2 mb-3">
        <button
          type="button"
          className={`btn btn-sm ${adminViewTab === "cases" ? "btn-danger fw-semibold" : "btn-dark text-secondary border-secondary"}`}
          onClick={() => setAdminViewTab("cases")}
        >
          <i className="bi bi-list-check me-1"></i> Unresolved Lost Cases ({summary.total})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${adminViewTab === "analytics" ? "btn-danger fw-semibold" : "btn-dark text-secondary border-secondary"}`}
          onClick={() => setAdminViewTab("analytics")}
        >
          <i className="bi bi-graph-up-arrow me-1"></i> Database Analytics & Trends
        </button>
      </div>

      {adminViewTab === "analytics" ? (
        <AdminAnalyticsDashboard />
      ) : (
        <>
          {actionMessage && (
            <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2" role="alert">
              <i className="bi bi-check-circle-fill"></i> {actionMessage}
            </div>
          )}

      {/* KPI Priority Summary Counters */}
      <div className="row g-2 mb-3">
        <div className="col-6 col-md-3">
          <div
            className={`p-3 rounded text-center cursor-pointer transition-all ${activeFilter === "critical" ? "border-danger border-2" : "border-secondary"}`}
            style={{ backgroundColor: "#1c1415", border: "1px solid rgba(229, 9, 20, 0.4)", cursor: "pointer" }}
            onClick={() => setActiveFilter("critical")}
          >
            <div className="fs-3 fw-bold text-danger">{summary.critical}</div>
            <div className="small text-danger fw-semibold">Critical (Day 14+)</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className={`p-3 rounded text-center cursor-pointer transition-all ${activeFilter === "high" ? "border-warning border-2" : "border-secondary"}`}
            style={{ backgroundColor: "#1e1a14", border: "1px solid rgba(245, 158, 11, 0.4)", cursor: "pointer" }}
            onClick={() => setActiveFilter("high")}
          >
            <div className="fs-3 fw-bold text-warning">{summary.high}</div>
            <div className="small text-warning fw-semibold">High Priority (Day 7-13)</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className={`p-3 rounded text-center cursor-pointer transition-all ${activeFilter === "attention" ? "border-info border-2" : "border-secondary"}`}
            style={{ backgroundColor: "#141c22", border: "1px solid rgba(56, 189, 248, 0.4)", cursor: "pointer" }}
            onClick={() => setActiveFilter("attention")}
          >
            <div className="fs-3 fw-bold text-info">{summary.attention}</div>
            <div className="small text-info fw-semibold">Needs Attention (Day 3-6)</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className={`p-3 rounded text-center cursor-pointer transition-all ${activeFilter === "all" ? "border-light border-2" : "border-secondary"}`}
            style={{ backgroundColor: "#181818", border: "1px solid rgba(255, 255, 255, 0.15)", cursor: "pointer" }}
            onClick={() => setActiveFilter("all")}
          >
            <div className="fs-3 fw-bold text-light">{summary.total}</div>
            <div className="small text-muted fw-semibold">All Unresolved Cases</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {[
          { id: "all", label: "All Unresolved" },
          { id: "critical", label: "Critical Follow-up (14d+)" },
          { id: "high", label: "High Priority (7-13d)" },
          { id: "attention", label: "Needs Attention (3-6d)" },
          { id: "recent", label: "Recently Reported (0-2d)" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn btn-sm ${activeFilter === tab.id ? "btn-danger" : "btn-dark border-secondary text-secondary"}`}
            onClick={() => setActiveFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table of Unresolved Items */}
      <div className="table-responsive rounded border border-dark bg-dark bg-opacity-50">
        <table className="table table-dark table-hover mb-0 align-middle">
          <thead className="table-black border-bottom border-dark text-secondary small text-uppercase">
            <tr>
              <th scope="col" style={{ width: "24%" }}>Item & Reporter</th>
              <th scope="col">Category</th>
              <th scope="col">Lost Location</th>
              <th scope="col">Days Unresolved</th>
              <th scope="col">Priority</th>
              <th scope="col">Possible Matches</th>
              <th scope="col">Last Reminder</th>
              <th scope="col" className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  <div className="spinner-border spinner-border-sm text-danger me-2" role="status"></div>
                  Loading unresolved campus cases...
                </td>
              </tr>
            ) : unresolvedItems.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  <i className="bi bi-shield-check fs-2 d-block text-success mb-2"></i>
                  No unresolved items matching this priority filter.
                </td>
              </tr>
            ) : (
              unresolvedItems.map((item) => (
                <tr key={item._id} className={item.priorityLevel === 4 ? "table-danger-row" : ""}>
                  {/* Item & Reporter */}
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.itemName}
                          className="rounded flex-shrink-0"
                          style={{ width: "42px", height: "42px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="rounded flex-shrink-0 d-flex align-items-center justify-content-center bg-black border border-secondary"
                          style={{ width: "42px", height: "42px" }}
                        >
                          <i className="bi bi-box-seam text-secondary"></i>
                        </div>
                      )}
                      <div>
                        <div className="fw-bold text-light small text-truncate" style={{ maxWidth: "180px" }}>
                          {item.itemName}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                          Owner: {item.contact}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="badge bg-black border border-secondary text-light-emphasis" style={{ fontSize: "0.7rem" }}>
                      {item.category}
                    </span>
                  </td>

                  {/* Lost Location */}
                  <td>
                    <div className="small text-light text-truncate" style={{ maxWidth: "140px" }}>
                      <i className="bi bi-geo-alt me-1 text-danger"></i>
                      {item.location}
                    </div>
                  </td>

                  {/* Days Unresolved */}
                  <td>
                    <span className="fw-bold fs-6 text-light">
                      {item.daysUnresolved} <small className="text-muted fw-normal" style={{ fontSize: "0.7rem" }}>days</small>
                    </span>
                  </td>

                  {/* Priority */}
                  <td>
                    {getPriorityBadge(item.priority, item.priorityLevel)}
                  </td>

                  {/* Matches Count */}
                  <td>
                    {item.matchCount > 0 ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success py-0 px-2 rounded-pill"
                        style={{ fontSize: "0.72rem" }}
                        onClick={() => onViewMatches && onViewMatches(item)}
                      >
                        <i className="bi bi-stars me-1"></i> {item.matchCount} Matches
                      </button>
                    ) : (
                      <span className="text-muted small" style={{ fontSize: "0.75rem" }}>0 matches</span>
                    )}
                  </td>

                  {/* Last Reminder */}
                  <td>
                    <div className="small text-muted" style={{ fontSize: "0.72rem" }}>
                      {item.lastReminderAt ? (
                        <>
                          <i className="bi bi-check2 text-success me-1"></i>
                          {new Date(item.lastReminderAt).toLocaleDateString()}
                        </>
                      ) : (
                        <span className="text-secondary">Pending milestone</span>
                      )}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      {/* View Report */}
                      <button
                        type="button"
                        className="btn btn-outline-light"
                        title="View Report Details"
                        onClick={() => onViewItem && onViewItem(item)}
                      >
                        <i className="bi bi-eye"></i>
                      </button>

                      {/* Contact Owner */}
                      <button
                        type="button"
                        className="btn btn-outline-info"
                        title="Contact Reporter via Gmail"
                        onClick={() => openGmailCompose(item.contact, item.itemName, item.location)}
                      >
                        <i className="bi bi-envelope"></i>
                      </button>

                      {/* Send Manual Reminder */}
                      <button
                        type="button"
                        className="btn btn-outline-warning"
                        title="Send Immediate Administrator Reminder"
                        onClick={() => handleSendReminder(item)}
                      >
                        <i className="bi bi-bell-fill"></i>
                      </button>

                      {/* Mark as Returned */}
                      <button
                        type="button"
                        className="btn btn-outline-success"
                        title="Mark Item as Returned (Resolves Case)"
                        onClick={() => handleMarkReturned(item._id)}
                      >
                        <i className="bi bi-check2-circle"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reminder History Log Modal */}
      {reminderHistoryOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 1300 }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content bg-dark text-light border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i className="bi bi-clock-history text-danger"></i> Automated Reminder & Alert Log History
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setReminderHistoryOpen(false)}
                ></button>
              </div>

              <div className="modal-body p-3">
                {reminderHistoryLogs.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    No reminder logs recorded yet.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-sm table-striped">
                      <thead>
                        <tr className="text-secondary small">
                          <th>Sent At</th>
                          <th>Recipient</th>
                          <th>Milestone Day</th>
                          <th>Reminder Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reminderHistoryLogs.map((log, idx) => (
                          <tr key={idx}>
                            <td className="small">{new Date(log.sentAt).toLocaleString()}</td>
                            <td className="small">{log.userEmail || log.userId}</td>
                            <td>
                              <span className="badge bg-secondary">
                                {log.scheduledDay === 0 ? "Manual" : `Day ${log.scheduledDay}`}
                              </span>
                            </td>
                            <td className="small text-light-emphasis">{log.reminderType}</td>
                            <td>
                              <span className="badge bg-success">{log.deliveryStatus || "sent"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setReminderHistoryOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Claim Handover Verification Modal (Phase 7) */}
      {handoverModalOpen && (
        <ClaimHandoverVerificationModal
          onClose={() => setHandoverModalOpen(false)}
          onHandoverCompleted={() => {
            loadUnresolvedData();
            if (onStatusUpdated) onStatusUpdated();
          }}
        />
      )}
    </div>
  );
}
