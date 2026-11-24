import { useState, useEffect } from "react";
import { getAdminAnalytics } from "../api";

export default function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAdminAnalytics();
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load database analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-5 text-center text-muted">
        <div className="spinner-border text-danger mb-2" role="status"></div>
        <div>Aggregating real-time database records & analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger py-3 my-3">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        <span>{error}</span>
      </div>
    );
  }

  const summary = analytics?.summary || {
    totalReports: 0,
    totalLost: 0,
    totalFound: 0,
    totalReturned: 0,
    activeUnresolved: 0,
    pendingClaims: 0,
    avgResolutionDays: 0,
    monthlyRecoveryRate: 0,
    matchToClaimConversionRate: 0
  };

  const monthly = analytics?.monthlyComparison || [];
  const categories = analytics?.categoryDistribution || [];
  const recoveryTrend = analytics?.recoveryTrend || [];
  const hotspots = analytics?.campusHotspots || [];
  const unresolvedPriority = analytics?.unresolvedByPriority || { critical: 0, high: 0, attention: 0, normal: 0 };

  const maxMonthlyVal = Math.max(1, ...monthly.map((m) => Math.max(m.lost, m.found, m.returned)));
  const maxHotspotVal = Math.max(1, ...hotspots.map((h) => h.total));

  return (
    <div className="admin-analytics-dashboard mt-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2 border-bottom border-dark">
        <div>
          <h4 className="fw-bold text-light mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-bar-chart-line-fill text-danger"></i>
            CampusFlix Advanced Analytics & Intelligence
          </h4>
          <p className="text-secondary small mb-0">
            Real-time metric computations and historical distributions derived directly from MongoDB records.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
          onClick={fetchAnalytics}
        >
          <i className="bi bi-arrow-clockwise"></i> Refresh Analytics
        </button>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="row g-2 mb-4">
        <div className="col-6 col-md-3">
          <div className="p-3 rounded bg-black border border-secondary text-center h-100">
            <div className="text-secondary small mb-1">Total Reports</div>
            <div className="fs-3 fw-bold text-light">{summary.totalReports}</div>
            <div className="text-muted small" style={{ fontSize: "0.72rem" }}>
              {summary.totalLost} Lost • {summary.totalFound} Found
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 rounded bg-black border border-success text-center h-100">
            <div className="text-success small mb-1">Successfully Returned</div>
            <div className="fs-3 fw-bold text-success">{summary.totalReturned}</div>
            <div className="text-muted small" style={{ fontSize: "0.72rem" }}>
              Recovery Rate: {summary.monthlyRecoveryRate}%
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 rounded bg-black border border-warning text-center h-100">
            <div className="text-warning small mb-1">Active Unresolved Cases</div>
            <div className="fs-3 fw-bold text-warning">{summary.activeUnresolved}</div>
            <div className="text-muted small" style={{ fontSize: "0.72rem" }}>
              Pending Claims: {summary.pendingClaims}
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="p-3 rounded bg-black border border-info text-center h-100">
            <div className="text-info small mb-1">Avg Resolution Time</div>
            <div className="fs-3 fw-bold text-info">
              {summary.avgResolutionDays > 0 ? `${summary.avgResolutionDays}d` : "N/A"}
            </div>
            <div className="text-muted small" style={{ fontSize: "0.72rem" }}>
              Match-to-Claim: {summary.matchToClaimConversionRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="row g-3 mb-4">
        {/* Chart 1: Lost vs Found Monthly Comparison */}
        <div className="col-12 col-lg-6">
          <div className="p-3 rounded bg-dark border border-secondary h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-light mb-0">
                <i className="bi bi-graph-up me-2 text-danger"></i>
                Lost vs Found Monthly Comparison
              </h6>
              <div className="d-flex gap-2 small text-muted" style={{ fontSize: "0.72rem" }}>
                <span><i className="bi bi-square-fill text-danger me-1"></i>Lost</span>
                <span><i className="bi bi-square-fill text-success me-1"></i>Found</span>
              </div>
            </div>

            {monthly.length === 0 ? (
              <div className="text-center py-4 text-muted small">No monthly data available.</div>
            ) : (
              <div className="d-flex align-items-end justify-content-between pt-4" style={{ height: "180px" }}>
                {monthly.map((m, idx) => {
                  const lostH = Math.max(8, Math.round((m.lost / maxMonthlyVal) * 130));
                  const foundH = Math.max(8, Math.round((m.found / maxMonthlyVal) * 130));

                  return (
                    <div key={idx} className="d-flex flex-column align-items-center gap-1 flex-grow-1">
                      <div className="d-flex gap-1 align-items-end" style={{ height: "135px" }}>
                        <div
                          className="bg-danger rounded-top transition-all"
                          style={{ width: "16px", height: `${lostH}px` }}
                          title={`Lost: ${m.lost}`}
                        ></div>
                        <div
                          className="bg-success rounded-top transition-all"
                          style={{ width: "16px", height: `${foundH}px` }}
                          title={`Found: ${m.found}`}
                        ></div>
                      </div>
                      <span className="text-secondary small" style={{ fontSize: "0.72rem" }}>
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Item Category Distribution */}
        <div className="col-12 col-lg-6">
          <div className="p-3 rounded bg-dark border border-secondary h-100">
            <h6 className="fw-bold text-light mb-3">
              <i className="bi bi-pie-chart-fill me-2 text-warning"></i>
              Item Category Distribution
            </h6>

            {categories.length === 0 ? (
              <div className="text-center py-4 text-muted small">No categories recorded.</div>
            ) : (
              <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: "190px" }}>
                {categories.map((cat, idx) => (
                  <div key={idx}>
                    <div className="d-flex justify-content-between small text-light-emphasis mb-1" style={{ fontSize: "0.76rem" }}>
                      <span>{cat.category}</span>
                      <span>{cat.count} ({cat.percentage}%)</span>
                    </div>
                    <div className="progress" style={{ height: "6px", backgroundColor: "#181818" }}>
                      <div
                        className="progress-bar bg-danger"
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Recovery Trend */}
        <div className="col-12 col-lg-6">
          <div className="p-3 rounded bg-dark border border-secondary h-100">
            <h6 className="fw-bold text-light mb-3">
              <i className="bi bi-arrow-up-right-circle-fill me-2 text-success"></i>
              Campus Recovery Trend
            </h6>

            {recoveryTrend.length === 0 ? (
              <div className="text-center py-4 text-muted small">No recovery trend available.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {recoveryTrend.map((t, idx) => (
                  <div key={idx}>
                    <div className="d-flex justify-content-between small text-light-emphasis mb-1" style={{ fontSize: "0.76rem" }}>
                      <span>{t.month}</span>
                      <span className="text-success">{t.returned} items returned ({t.rate}% rate)</span>
                    </div>
                    <div className="progress" style={{ height: "6px", backgroundColor: "#181818" }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${Math.min(100, t.rate)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Campus Hotspot Distribution */}
        <div className="col-12 col-lg-6">
          <div className="p-3 rounded bg-dark border border-secondary h-100">
            <h6 className="fw-bold text-light mb-3">
              <i className="bi bi-geo-alt-fill me-2 text-danger"></i>
              Most Frequently Reported Campus Locations
            </h6>

            {hotspots.length === 0 ? (
              <div className="text-center py-4 text-muted small">No locations recorded.</div>
            ) : (
              <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: "190px" }}>
                {hotspots.map((h, idx) => {
                  const pct = Math.round((h.total / maxHotspotVal) * 100);
                  return (
                    <div key={idx}>
                      <div className="d-flex justify-content-between small text-light-emphasis mb-1" style={{ fontSize: "0.76rem" }}>
                        <span className="text-truncate">{h.location}</span>
                        <span className="text-secondary">
                          {h.total} reports ({h.lostCount}L / {h.foundCount}F)
                        </span>
                      </div>
                      <div className="progress" style={{ height: "6px", backgroundColor: "#181818" }}>
                        <div
                          className="progress-bar bg-warning"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chart 5: Unresolved Cases by Priority */}
        <div className="col-12">
          <div className="p-3 rounded bg-dark border border-secondary">
            <h6 className="fw-bold text-light mb-3">
              <i className="bi bi-shield-exclamation me-2 text-danger"></i>
              Unresolved Cases by Priority Tier
            </h6>

            <div className="row g-2">
              <div className="col-6 col-md-3">
                <div className="p-2 rounded bg-black border border-danger text-center">
                  <div className="badge bg-danger mb-1">Critical (Day 14+)</div>
                  <div className="fs-4 fw-bold text-danger">{unresolvedPriority.critical}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 rounded bg-black border border-warning text-center">
                  <div className="badge bg-warning text-dark mb-1">High (Day 7–13)</div>
                  <div className="fs-4 fw-bold text-warning">{unresolvedPriority.high}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 rounded bg-black border border-info text-center">
                  <div className="badge bg-info text-dark mb-1">Attention (Day 3–6)</div>
                  <div className="fs-4 fw-bold text-info">{unresolvedPriority.attention}</div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="p-2 rounded bg-black border border-secondary text-center">
                  <div className="badge bg-secondary mb-1">Normal (Day 0–2)</div>
                  <div className="fs-4 fw-bold text-secondary">{unresolvedPriority.normal}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
