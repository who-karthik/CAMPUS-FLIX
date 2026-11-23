import { useState } from "react";
import { submitClaim } from "../api";

export default function ClaimModal({
  item,
  user,
  onClose,
  onSuccess
}) {
  const [verificationDetails, setVerificationDetails] = useState("");
  const [claimantName, setClaimantName] = useState(user?.name || "");
  const [claimantEmail, setClaimantEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!verificationDetails.trim() || verificationDetails.trim().length < 5) {
      setError("Please describe unique identifying details (at least 5 characters).");
      return;
    }
    if (!claimantEmail.trim()) {
      setError("Please provide your contact email address.");
      return;
    }

    try {
      setSubmitting(true);
      await submitClaim({
        foundItemId: item._id,
        claimantName: claimantName.trim(),
        claimantEmail: claimantEmail.trim(),
        verificationDetails: verificationDetails.trim()
      });
      setSubmitting(false);
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setSubmitting(false);
      setError(err.message || "Failed to submit claim request.");
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 1250 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-light border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <i className="bi bi-shield-lock-fill text-warning"></i> Request Item Claim & Ownership Verification
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={submitting}
            ></button>
          </div>

          {submitted ? (
            <div className="modal-body p-4 text-center">
              <div className="rounded-circle bg-success bg-opacity-25 d-inline-flex p-3 mb-3 text-success">
                <i className="bi bi-check2-circle fs-1"></i>
              </div>
              <h4 className="fw-bold mb-2">Claim Submitted!</h4>
              <p className="text-light-emphasis small mb-3">
                Your ownership verification details have been securely forwarded to the person who reported finding this item and the Campus Administration.
              </p>
              <div className="p-3 rounded bg-black small text-muted text-start mb-3">
                <i className="bi bi-shield-check text-info me-2"></i>
                For security reasons, your verification answers remain completely private and will be reviewed against the actual item.
              </div>
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-body p-4">
                {/* Item Summary Card */}
                <div className="p-3 rounded mb-3 bg-black border border-secondary border-opacity-50 d-flex gap-3 align-items-center">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.itemName}
                      className="rounded"
                      style={{ width: "60px", height: "60px", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="rounded bg-secondary bg-opacity-25 p-3">
                      <i className="bi bi-box-seam fs-3"></i>
                    </div>
                  )}
                  <div>
                    <span className="badge bg-success mb-1">Found Item</span>
                    <h6 className="mb-0 fw-bold">{item.itemName}</h6>
                    <small className="text-muted">
                      Found at: {item.location} • {item.category}
                    </small>
                  </div>
                </div>

                {/* Secure Notice */}
                <div
                  className="p-2 rounded mb-3 small"
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.12)",
                    border: "1px solid rgba(245, 158, 11, 0.35)",
                    color: "#fde68a",
                    fontSize: "0.8rem"
                  }}
                >
                  <i className="bi bi-info-circle-fill me-1"></i>
                  <strong>Verification Required:</strong> To prevent false claims, please describe private identifying details that are not displayed in public photographs.
                </div>

                {/* Form Inputs */}
                <div className="mb-3">
                  <label className="form-label small text-light fw-semibold">
                    Secret Identifying Characteristics *
                  </label>
                  <textarea
                    className="form-control bg-black text-light border-secondary"
                    rows="4"
                    placeholder="E.g., unique marks, stickers on back, scratches, case contents, specific keychain tag, or lock combination."
                    value={verificationDetails}
                    onChange={(e) => setVerificationDetails(e.target.value)}
                    required
                  ></textarea>
                  <div className="form-text text-muted" style={{ fontSize: "0.72rem" }}>
                    Minimum 5 characters. Only authorized reviewers can inspect this response.
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <label className="form-label small text-light fw-semibold">Your Name</label>
                    <input
                      type="text"
                      className="form-control bg-black text-light border-secondary"
                      value={claimantName}
                      onChange={(e) => setClaimantName(e.target.value)}
                      placeholder="Student Name"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small text-light fw-semibold">Contact Email *</label>
                    <input
                      type="email"
                      className="form-control bg-black text-light border-secondary"
                      value={claimantEmail}
                      onChange={(e) => setClaimantEmail(e.target.value)}
                      placeholder="student@mitaoe.ac.in"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger py-2 small mt-2 mb-0" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
                  </div>
                )}
              </div>

              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger d-flex align-items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-check"></i> Submit Claim for Review
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
