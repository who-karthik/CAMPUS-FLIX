export default function MatchSuggestionPanel({
  type = "Found",
  matches = [],
  suggestions = [],
  loading = false,
  hasSearched = false,
  onSelectSuggestion,
  onViewMatch,
  onDismiss
}) {
  if (loading) {
    return (
      <div
        className="match-suggestion-panel p-3 rounded mb-3 text-center"
        style={{
          backgroundColor: "#181818",
          border: "1px solid #38bdf8",
          boxShadow: "0 4px 20px rgba(56, 189, 248, 0.15)"
        }}
      >
        <div className="spinner-border spinner-border-sm text-info me-2" role="status"></div>
        <span className="text-light small">
          Executing intelligent multi-factor matching across campus database...
        </span>
      </div>
    );
  }

  // If user searched explicitly and 0 matches found
  if (hasSearched && (!matches || matches.length === 0)) {
    return (
      <div
        className="match-suggestion-panel p-3 rounded mb-3"
        style={{
          backgroundColor: "#181818",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-info-circle text-info fs-5"></i>
            <div>
              <div className="fw-semibold text-light small">No Potential Matches Detected</div>
              <div className="text-muted small" style={{ fontSize: "0.78rem" }}>
                No active counterpart reports currently match these specifications. You can proceed to submit your report.
              </div>
            </div>
          </div>
          {onDismiss && (
            <button
              type="button"
              className="btn-close btn-close-white small"
              onClick={onDismiss}
              title="Close"
            ></button>
          )}
        </div>
      </div>
    );
  }

  if ((!matches || matches.length === 0) && (!suggestions || suggestions.length === 0)) {
    return null;
  }

  const isReportingFound = type === "Found";
  const counterpartName = isReportingFound ? "Lost Item" : "Found Item";

  const getReasonBullets = (match) => {
    if (match.explanation?.reasons && match.explanation.reasons.length > 0) {
      return match.explanation.reasons;
    }
    const factors = match.matchingFactors || {};
    const bullets = [];
    if ((factors.nameScore || 0) >= 70) bullets.push("High item name similarity");
    else if ((factors.nameScore || 0) >= 50) bullets.push("Similar item names");

    if ((factors.categoryScore || 0) === 100) bullets.push("Same item category");
    else if ((factors.categoryScore || 0) >= 50) bullets.push("Related category family");

    if ((factors.descriptionScore || 0) >= 40) bullets.push("Similar description details");
    if ((factors.locationScore || 0) >= 75) bullets.push("Same campus location");
    else if ((factors.locationScore || 0) > 0) bullets.push("Nearby campus location");

    if ((factors.dateScore || 0) >= 80) bullets.push("Reported dates are close (within 2-5 days)");
    else if ((factors.dateScore || 0) >= 60) bullets.push("Dates within 10 days");

    if (bullets.length === 0) bullets.push("Matching category and general description");
    return bullets;
  };

  return (
    <div
      className="match-suggestion-panel p-3 rounded mb-3"
      style={{
        backgroundColor: "#181818",
        border: "1px solid #46d369",
        boxShadow: "0 4px 20px rgba(70, 211, 105, 0.15)"
      }}
    >
      {/* Autocomplete Suggestion Pills (if any) */}
      {suggestions && suggestions.length > 0 && (
        <div className="mb-2">
          <div className="text-muted small mb-1" style={{ fontSize: "0.75rem" }}>
            <i className="bi bi-magic me-1 text-warning"></i> Matching campus items reported recently:
          </div>
          <div className="d-flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="btn btn-sm btn-dark text-start py-0 px-2 rounded-pill d-flex align-items-center gap-1 border-secondary"
                style={{ fontSize: "0.75rem", background: "rgba(255, 255, 255, 0.08)" }}
                onClick={() => onSelectSuggestion && onSelectSuggestion(s)}
              >
                <span className="text-light">{s.itemName}</span>
                <span className={`badge ${s.type === "Lost" ? "bg-danger" : "bg-success"} p-1`} style={{ fontSize: "0.6rem" }}>
                  {s.type}
                </span>
                <span className="text-muted" style={{ fontSize: "0.68rem" }}>• {s.location}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prominent Match Alert Box */}
      {matches && matches.length > 0 && (
        <div className="mt-2">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <div className="fw-bold text-success d-flex align-items-center gap-2">
                <i className="bi bi-stars fs-5 animate-pulse"></i>
                <span>Potential {counterpartName} Matches Detected!</span>
                <span className="badge bg-success-subtle text-success border border-success" style={{ fontSize: "0.7rem" }}>
                  {matches.length} Matches Found
                </span>
              </div>
              <div className="text-light-emphasis small" style={{ fontSize: "0.8rem" }}>
                {isReportingFound
                  ? "We identified open lost reports on campus that closely match the item you found."
                  : "Someone may have already reported finding your lost item on campus."}
              </div>
            </div>
            {onDismiss && (
              <button
                type="button"
                className="btn-close btn-close-white small"
                onClick={onDismiss}
                title="Dismiss suggestions"
              ></button>
            )}
          </div>

          {/* Important Ownership Disclaimer (Phase 2 Requirement) */}
          <div
            className="p-2 rounded mb-2 d-flex align-items-center gap-2"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#fbbf24",
              fontSize: "0.75rem"
            }}
          >
            <i className="bi bi-shield-exclamation fs-6"></i>
            <span>
              <strong>Notice:</strong> High similarity does not prove ownership. The campus security claim verification process is required before handover.
            </span>
          </div>

          {/* Cards of matches */}
          <div className="match-cards-container d-flex flex-column gap-2 mt-2">
            {matches.map((m) => {
              const item = m.item;
              const isHigh = m.confidenceScore >= 80;
              const reasons = getReasonBullets(m);

              return (
                <div
                  key={item._id}
                  className="match-card p-3 rounded d-flex flex-column gap-2"
                  style={{
                    backgroundColor: "#202020",
                    borderLeft: `4px solid ${isHigh ? "#46d369" : "#f59e0b"}`
                  }}
                >
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                    <div className="d-flex align-items-center gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl.startsWith("http") ? item.imageUrl : item.imageUrl}
                          alt={item.itemName}
                          className="rounded"
                          style={{ width: "55px", height: "55px", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="rounded d-flex align-items-center justify-content-center bg-dark"
                          style={{ width: "55px", height: "55px" }}
                        >
                          <i className="bi bi-box-seam text-secondary fs-4"></i>
                        </div>
                      )}
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold text-light">{item.itemName}</span>
                          <span
                            className={`badge ${isHigh ? "bg-success" : "bg-warning text-dark"}`}
                            style={{ fontSize: "0.7rem" }}
                          >
                            {m.confidenceScore}% Match
                          </span>
                          <span className="badge bg-dark border border-secondary text-light-emphasis" style={{ fontSize: "0.65rem" }}>
                            {item.category}
                          </span>
                        </div>
                        <div className="text-muted small" style={{ fontSize: "0.75rem" }}>
                          <i className="bi bi-geo-alt me-1 text-danger"></i>
                          {item.location} • Reported on {new Date(item.date).toLocaleDateString()}
                        </div>
                        <p className="text-light-emphasis mb-0 small text-truncate" style={{ maxWidth: "420px", fontSize: "0.78rem" }}>
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="d-flex gap-2 align-items-center justify-content-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success px-2 py-1 d-flex align-items-center gap-1"
                        style={{ fontSize: "0.78rem" }}
                        onClick={() => onViewMatch && onViewMatch(item, m)}
                      >
                        <i className="bi bi-eye"></i> View Match Details
                      </button>
                    </div>
                  </div>

                  {/* Phase 2: Smart Match Explanation Reasons */}
                  <div className="mt-1 pt-2 border-top border-secondary border-opacity-25">
                    <div className="text-muted small fw-semibold mb-1" style={{ fontSize: "0.72rem" }}>
                      <i className="bi bi-lightbulb-fill text-warning me-1"></i> Why this report matched:
                    </div>
                    <ul className="list-unstyled mb-1 d-flex flex-wrap gap-2" style={{ fontSize: "0.75rem" }}>
                      {reasons.map((reason, rIdx) => (
                        <li
                          key={rIdx}
                          className="badge bg-black border border-secondary text-light-emphasis px-2 py-1 font-monospace"
                          style={{ fontWeight: "normal" }}
                        >
                          ✓ {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
