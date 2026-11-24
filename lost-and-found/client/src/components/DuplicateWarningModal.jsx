export default function DuplicateWarningModal({
  duplicates = [],
  onViewExisting,
  onContinue,
  onClose
}) {
  if (!duplicates || duplicates.length === 0) return null;

  const topDuplicate = duplicates[0];
  const item = topDuplicate.item || {};

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 1270 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content bg-dark text-light border-warning">
          <div className="modal-header border-warning bg-warning bg-opacity-10">
            <h5 className="modal-title d-flex align-items-center gap-2 text-warning fw-bold mb-0">
              <i className="bi bi-exclamation-triangle-fill fs-4"></i> Similar Item Report Already Exists!
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4">
            <p className="text-light-emphasis small mb-3">
              We found an existing active campus report with very similar details. Please check if this item has already been reported before proceeding.
            </p>

            {/* Existing Report Details Card */}
            <div
              className="p-3 rounded mb-3 border border-secondary"
              style={{ backgroundColor: "#191919", borderLeft: "5px solid #f59e0b" }}
            >
              <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.itemName}
                      className="rounded"
                      style={{ width: "65px", height: "65px", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="rounded bg-black p-3 border border-secondary">
                      <i className="bi bi-box-seam fs-3 text-secondary"></i>
                    </div>
                  )}

                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className={`badge ${item.type === "Lost" ? "bg-danger" : "bg-success"}`}>
                        {item.type} Item
                      </span>
                      <h6 className="mb-0 fw-bold text-light">{item.itemName}</h6>
                      <span className="badge bg-warning text-dark">
                        {topDuplicate.duplicateScore}% Similarity
                      </span>
                    </div>

                    <div className="text-muted small mb-1" style={{ fontSize: "0.78rem" }}>
                      <i className="bi bi-geo-alt me-1 text-danger"></i>
                      {item.location} • Category: {item.category} • Date: {item.date ? new Date(item.date).toLocaleDateString() : "N/A"}
                    </div>

                    <p className="text-light-emphasis small mb-0" style={{ fontSize: "0.82rem" }}>
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="d-flex flex-md-column gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
                    onClick={() => onViewExisting && onViewExisting(item)}
                  >
                    <i className="bi bi-eye"></i> View Existing Report
                  </button>
                </div>
              </div>

              {/* Privacy Notice: No contact information disclosed */}
              <div className="mt-3 pt-2 border-top border-dark small text-muted" style={{ fontSize: "0.72rem" }}>
                <i className="bi bi-shield-check text-success me-1"></i>
                Private reporter contact and claim verification data are strictly hidden to safeguard student privacy.
              </div>
            </div>

            <div className="alert alert-secondary py-2 small mb-0 text-light bg-black border-secondary">
              <i className="bi bi-info-circle me-1 text-info"></i>
              <strong>Note:</strong> Multiple campus members may independently lose or find similar items. If your item is distinct, you may continue publishing your new report.
            </div>
          </div>

          <div className="modal-footer border-secondary justify-content-between">
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => onViewExisting && onViewExisting(item)}
            >
              <i className="bi bi-search me-1"></i> View Existing Report
            </button>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Review My Input
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onContinue}
              >
                <i className="bi bi-send-check me-1"></i> Continue with New Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
