export default function MatchSuggestionPanel({
  type = "Found",
  matches = [],
  suggestions = [],
  onSelectSuggestion,
  onViewMatch,
  onDismiss
}) {
  if ((!matches || matches.length === 0) && (!suggestions || suggestions.length === 0)) {
    return null;
  }

  const isReportingFound = type === "Found";
  const counterpartName = isReportingFound ? "Lost Item" : "Found Item";

  return (
    <div className="match-suggestion-panel p-3 rounded mb-3"
         style={{
           backgroundColor: "#181818",
           border: "1px solid #46d369",
           boxShadow: "0 4px 20px rgba(70, 211, 105, 0.15)"
         }}>
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
                <span>Potential {counterpartName} Matches Found!</span>
                <span className="badge bg-success-subtle text-success border border-success" style={{ fontSize: "0.7rem" }}>
                  {matches.length} Detected
                </span>
              </div>
              <div className="text-light-emphasis small" style={{ fontSize: "0.8rem" }}>
                {isReportingFound
                  ? "You may have found an item that someone on campus is looking for."
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

          {/* Cards of matches */}
          <div className="match-cards-container d-flex flex-column gap-2 mt-2">
            {matches.map((m) => {
              const item = m.item;
              const isHigh = m.confidenceScore >= 80;

              return (
                <div
                  key={item._id}
                  className="match-card p-2 rounded d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2"
                  style={{
                    backgroundColor: "#202020",
                    borderLeft: `4px solid ${isHigh ? "#46d369" : "#f59e0b"}`
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl.startsWith("http") ? item.imageUrl : item.imageUrl}
                        alt={item.itemName}
                        className="rounded"
                        style={{ width: "50px", height: "50px", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="rounded d-flex align-items-center justify-content-center bg-dark"
                        style={{ width: "50px", height: "50px" }}
                      >
                        <i className="bi bi-box-seam text-secondary fs-4"></i>
                      </div>
                    )}
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold text-light small">{item.itemName}</span>
                        <span
                          className={`badge ${isHigh ? "bg-success" : "bg-warning text-dark"}`}
                          style={{ fontSize: "0.68rem" }}
                        >
                          {m.confidenceScore}% Match
                        </span>
                        <span className="badge bg-dark border border-secondary text-light-emphasis" style={{ fontSize: "0.65rem" }}>
                          {item.category}
                        </span>
                      </div>
                      <div className="text-muted small" style={{ fontSize: "0.72rem" }}>
                        <i className="bi bi-geo-alt me-1"></i>
                        {item.location} • Reported on {new Date(item.date).toLocaleDateString()}
                      </div>
                      <p className="text-light-emphasis mb-0 small text-truncate" style={{ maxWidth: "340px", fontSize: "0.75rem" }}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-2 align-items-center justify-content-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success px-2 py-1 d-flex align-items-center gap-1"
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => onViewMatch && onViewMatch(item, m)}
                    >
                      <i className="bi bi-eye"></i> View Possible Match
                    </button>
                    {onDismiss && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary px-2 py-1"
                        style={{ fontSize: "0.75rem" }}
                        onClick={onDismiss}
                      >
                        Report {type} Item Anyway
                      </button>
                    )}
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
