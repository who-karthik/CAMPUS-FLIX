import { useState } from "react";
import { updateClaimStatus } from "../api";

export default function ClaimReviewModal({
  claim,
  onClose,
  onUpdated
}) {
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!claim) return null;

  const handleDecision = async (status) => {
    setError("");
    try {
      setSubmitting(true);
      await updateClaimStatus(claim._id, status, reviewNotes.trim());
      setSubmitting(false);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      setSubmitting(false);
      setError(err.message || "Failed to update claim.");
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 1260 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-light border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <i className="bi bi-shield-shaded text-info"></i> Review Item Claim Verification
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={submitting}
            ></button>
          </div>

          <div className="modal-body p-4">
            {/* Claimant Info */}
            <div className="p-3 rounded mb-3 bg-black border border-secondary border-opacity-50">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold">{claim.claimantName || "Student Claimant"}</span>
                <span className={`badge ${
                  claim.status === "approved"
                    ? "bg-success"
                    : claim.status === "rejected"
                    ? "bg-danger"
                    : "bg-warning text-dark"
                }`}>
                  {claim.status.toUpperCase()}
                </span>
              </div>
              <div className="small text-muted mb-2">
                Email: <span className="text-light">{claim.claimantEmail}</span> • Submitted: {new Date(claim.createdAt).toLocaleString()}
              </div>

              {/* Private Verification Answer */}
              <div className="mt-2 pt-2 border-top border-secondary border-opacity-50">
                <label className="small fw-semibold text-warning d-block mb-1">
                  <i className="bi bi-lock-fill me-1"></i> Private Verification Evidence:
                </label>
                <div className="p-2 rounded bg-dark border border-secondary small text-light-emphasis" style={{ whiteSpace: "pre-wrap" }}>
                  {claim.verificationDetails}
                </div>
              </div>
            </div>

            {/* Review Notes Input */}
            <div className="mb-3">
              <label className="form-label small text-light fw-semibold">
                Review Notes / Instructions for Student
              </label>
              <textarea
                className="form-control bg-black text-light border-secondary"
                rows="2"
                placeholder="E.g., Verified against Casio serial number. Collect at Security Desk Block A."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              ></textarea>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                <i className="bi bi-x-circle-fill me-1"></i> {error}
              </div>
            )}
          </div>

          <div className="modal-footer border-secondary justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Close
            </button>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => handleDecision("rejected")}
                disabled={submitting || claim.status === "rejected"}
              >
                <i className="bi bi-x-circle"></i> Reject Claim
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => handleDecision("approved")}
                disabled={submitting || claim.status === "approved"}
              >
                <i className="bi bi-check2-circle"></i> Approve Claim
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
