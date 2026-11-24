import { useState, useEffect } from "react";
import { getItems } from "../api";

export default function CampusLiveActivityFeed({ onOpenItem }) {
  const [feedItems, setFeedItems] = useState([]);
  const [filter, setFilter] = useState("all"); // all, lost, found, reported, resolved
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchFeed = async (showSpin = false) => {
    try {
      if (showSpin) setIsRefreshing(true);
      const res = await getItems();
      if (res.success) {
        setFeedItems(res.data || []);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.warn("Live activity feed refresh error:", err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    // Auto-refresh feed without full page reload every 25 seconds
    const interval = setInterval(() => fetchFeed(false), 25000);
    return () => clearInterval(interval);
  }, []);

  // Filter items based on active feed filter
  const displayedItems = feedItems
    .filter((item) => {
      if (filter === "lost") return item.type === "Lost" && item.status !== "Returned";
      if (filter === "found") return item.type === "Found" && item.status !== "Returned";
      if (filter === "reported") return true; // sorted by newest
      if (filter === "resolved") return item.status === "Returned";
      return true; // "all"
    })
    .sort((a, b) => {
      if (filter === "resolved") {
        return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
      }
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    })
    .slice(0, 10);

  const formatRelativeTime = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="campus-live-activity-feed my-5 px-3 px-md-4">
      {/* Feed Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span
              className="badge rounded-pill bg-danger d-flex align-items-center gap-1 px-2 py-1"
              style={{ fontSize: "0.72rem" }}
            >
              <span className="live-dot-pulse"></span> LIVE FEED
            </span>
            <h2 className="netflix-row-title mb-0" style={{ fontSize: "1.4rem" }}>
              What&apos;s Happening Around Campus?
            </h2>
          </div>
          <p className="text-secondary small mb-0 mt-1">
            Real-time campus stream of newly reported lost and found belongings and successful resolutions.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small d-none d-sm-inline" style={{ fontSize: "0.75rem" }}>
            Updated {formatRelativeTime(lastRefreshed)}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => fetchFeed(true)}
            disabled={isRefreshing}
            style={{ fontSize: "0.8rem", borderRadius: "4px" }}
          >
            <i className={`bi bi-arrow-clockwise ${isRefreshing ? "spin-icon" : ""}`}></i>
            {isRefreshing ? "Updating..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        {[
          { key: "all", label: "All Activity", icon: "bi-activity" },
          { key: "lost", label: "Lost Items", icon: "bi-search" },
          { key: "found", label: "Found Items", icon: "bi-box-seam" },
          { key: "reported", label: "Recently Reported", icon: "bi-clock-history" },
          { key: "resolved", label: "Recently Resolved", icon: "bi-check2-circle" }
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            className={`btn btn-sm ${
              filter === f.key
                ? "btn-light text-dark fw-bold"
                : "btn-dark text-secondary border-secondary"
            } d-flex align-items-center gap-1 rounded-pill px-3 py-1`}
            style={{ fontSize: "0.78rem" }}
            onClick={() => setFilter(f.key)}
          >
            <i className={`bi ${f.icon}`}></i> {f.label}
          </button>
        ))}
      </div>

      {/* Feed Content Cards */}
      {loading ? (
        <div className="text-center py-4 text-muted">
          <div className="spinner-border spinner-border-sm text-danger me-2" role="status"></div>
          <span className="small">Loading campus live activity feed...</span>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="p-4 rounded text-center text-muted border border-secondary" style={{ backgroundColor: "#181818" }}>
          <i className="bi bi-inbox fs-3 mb-2 d-block opacity-50"></i>
          <p className="small mb-0">No activity matching this filter at this moment.</p>
        </div>
      ) : (
        <div className="row g-3">
          {displayedItems.map((item) => {
            const isReturned = item.status === "Returned";
            const isFound = item.type === "Found";

            return (
              <div key={item._id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                <div
                  className="card bg-dark text-light h-100 border-secondary activity-card"
                  style={{
                    backgroundColor: "#181818",
                    transition: "transform 0.2s ease, border-color 0.2s ease",
                    cursor: "pointer",
                    borderRadius: "8px",
                    overflow: "hidden"
                  }}
                  onClick={() => onOpenItem && onOpenItem(item)}
                >
                  <div className="position-relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.itemName}
                        className="card-img-top"
                        style={{ height: "140px", objectFit: "cover", width: "100%" }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-black"
                        style={{ height: "140px" }}
                      >
                        <i className="bi bi-box-seam fs-1 text-secondary opacity-50"></i>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="position-absolute top-0 start-0 m-2">
                      {isReturned ? (
                        <span className="badge bg-success px-2 py-1 shadow" style={{ fontSize: "0.7rem" }}>
                          <i className="bi bi-check-circle-fill me-1"></i> Returned
                        </span>
                      ) : isFound ? (
                        <span className="badge bg-success px-2 py-1 shadow" style={{ fontSize: "0.7rem" }}>
                          <i className="bi bi-box-seam me-1"></i> Found Item
                        </span>
                      ) : (
                        <span className="badge bg-danger px-2 py-1 shadow" style={{ fontSize: "0.7rem" }}>
                          <i className="bi bi-search me-1"></i> Lost Item
                        </span>
                      )}
                    </div>

                    <div className="position-absolute bottom-0 end-0 m-2">
                      <span className="badge bg-black bg-opacity-75 text-light px-2 py-1" style={{ fontSize: "0.68rem" }}>
                        {formatRelativeTime(item.createdAt || item.date)}
                      </span>
                    </div>
                  </div>

                  <div className="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="card-title fw-bold text-light mb-0 text-truncate" title={item.itemName}>
                          {item.itemName}
                        </h6>
                      </div>

                      <div className="text-secondary small mb-2 d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                        <i className="bi bi-tag-fill text-muted"></i>
                        <span>{item.category}</span>
                        <span>•</span>
                        <i className="bi bi-geo-alt-fill text-danger"></i>
                        <span className="text-truncate">{item.location}</span>
                      </div>

                      <p className="card-text text-light-emphasis small mb-2 line-clamp-2" style={{ fontSize: "0.78rem" }}>
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
                      <span className="text-muted small" style={{ fontSize: "0.7rem" }}>
                        <i className="bi bi-calendar3 me-1"></i>
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                      <span className="text-info small fw-semibold d-flex align-items-center gap-1" style={{ fontSize: "0.72rem" }}>
                        View <i className="bi bi-chevron-right"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
