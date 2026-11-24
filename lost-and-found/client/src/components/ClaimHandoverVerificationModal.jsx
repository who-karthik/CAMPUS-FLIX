import { useState } from "react";
import { verifyClaimReference, completeClaimHandover } from "../api";

export default function ClaimHandoverVerificationModal({ onClose, onHandoverCompleted }) {
  const [claimRefInput, setClaimRefInput] = useState("");
  const [verifiedData, setVerifiedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleVerify = async (e) => {
    e?.preventDefault();
    setError("");
    setSuccessMessage("");
    setVerifiedData(null);

    const clean = claimRefInput.trim().toUpperCase();
    if (!clean) {
      setError("Please enter a valid Claim Reference code (e.g. CLM-XXXX).");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyClaimReference(clean);
      if (res.success && res.data) {
        setVerifiedData(res.data);
      } else {
        setError("Invalid or unrecognized claim reference.");
      }
    } catch (err) {
      setError(err.message || "Failed to verify claim reference.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmHandover = async () => {
    if (!verifiedData?.claim?.claimReference) return;
    setError("");

    try {
      setCompleting(true);
      const res = await completeClaimHandover(verifiedData.claim.claimReference);
      if (res.success) {
        setSuccessMessage("Physical handover verified successfully! Item marked as Returned.");
        setVerifiedData((prev) => ({
          ...prev,
          claim: {
            ...prev.claim,
            handoverStatus: "handed_over",
            handoverBy: res.data.handoverBy,
            handoverAt: res.data.handoverAt
          },
          isHandoverCompleted: true
        }));
        if (onHandoverCompleted) onHandoverCompleted();
      }
    } catch (err) {
      setError(err.message || "Failed to complete handover.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 1290 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content bg-dark text-light border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
              <i className="bi bi-shield-check text-success"></i> Campus Security – Claim Handover Verification
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={completing}
            ></button>
          </div>

          <div className="modal-body p-4">
            {/* Input Form */}
            <form onSubmit={handleVerify} className="mb-3">
              <label className="form-label small text-light fw-semibold">
                Scan or Enter Claim Reference Code *
              </label>
              <div className="input-group">
                <span className="input-group-text bg-black text-secondary border-secondary">
                  <i className="bi bi-upc-scan"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-black text-light border-secondary font-monospace text-uppercase"
                  placeholder="e.g. CLM-9F2B8D4A"
                  value={claimRefInput}
                  onChange={(e) => setClaimRefInput(e.target.value)}
                  disabled={loading || completing}
                />
                <button
                  type="submit"
                  className="btn btn-danger d-flex align-items-center gap-1"
                  disabled={loading || completing || !claimRefInput.trim()}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : (
                    <>
                      <i className="bi bi-search"></i> Verify Code
                    </>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="alert alert-danger py-2 small d-flex align-items-center gap-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success py-2 small d-flex align-items-center gap-2" role="alert">
                <i className="bi bi-check2-circle fs-5"></i>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Verified Claim Data Card */}
            {verifiedData && (
              <div className="p-3 rounded bg-black border border-secondary mt-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="badge bg-secondary mb-1">
                      Ref: {verifiedData.claim.claimReference}
                    </span>
                    <h5 className="fw-bold text-light mb-0">
                      {verifiedData.item?.itemName || "Item"}
                    </h5>
                    <div className="text-muted small">
                      Location: {verifiedData.item?.location} • Category: {verifiedData.item?.category}
                    </div>
                  </div>

                  <div>
                    {verifiedData.isHandoverCompleted ? (
                      <span className="badge bg-success px-2 py-1">
                        <i className="bi bi-check-circle-fill me-1"></i> Already Handed Over
                      </span>
                    ) : (
                      <span className="badge bg-warning text-dark px-2 py-1">
                        <i className="bi bi-hourglass-split me-1"></i> Pending Handover
                      </span>
                    )}
                  </div>
                </div>

                <div className="row g-2 border-top border-dark pt-2 mt-2 small">
                  <div className="col-sm-6">
                    <span className="text-secondary">Claimant Name:</span>{" "}
                    <span className="text-light fw-semibold">{verifiedData.claim.claimantName}</span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-secondary">Claimant Email:</span>{" "}
                    <span className="text-light fw-semibold">{verifiedData.claim.claimantEmail}</span>
                  </div>
                  {verifiedData.claim.handoverBy && (
                    <div className="col-12 mt-2 p-2 rounded bg-dark border border-secondary border-opacity-50">
                      <div className="text-success fw-semibold">
                        <i className="bi bi-shield-check me-1"></i> Handover Record:
                      </div>
                      <div className="text-light-emphasis small">
                        Verified by: {verifiedData.claim.handoverBy} on{" "}
                        {new Date(verifiedData.claim.handoverAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Handover Action */}
                {!verifiedData.isHandoverCompleted && (
                  <div className="mt-3 pt-3 border-top border-dark">
                    <p className="text-warning small mb-2">
                      <i className="bi bi-info-circle-fill me-1"></i>
                      Confirm student identity using their physical college ID card before completing handover.
                    </p>
                    <button
                      type="button"
                      className="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                      onClick={handleConfirmHandover}
                      disabled={completing}
                    >
                      {completing ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          Processing Handover Confirmation...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-hand-thumbs-up-fill"></i>
                          Confirm Physical Handover & Mark Returned
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer border-secondary">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={completing}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
