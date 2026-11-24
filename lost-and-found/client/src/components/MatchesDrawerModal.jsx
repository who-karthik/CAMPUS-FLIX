import { useState, useEffect } from "react";
import { getItemMatches } from "../api";
import { openGmailCompose } from "../App";

export default function MatchesDrawerModal({
  item,
  onClose,
  onRequestClaim
}) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item) return;
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await getItemMatches(item._id);
        if (res.success) setMatches(res.data || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchMatches();
  }, [item]);

  if (!item) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 1240 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content bg-dark text-light border-secondary">
          <div className="modal-header border-secondary">
            <div>
              <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
                <i className="bi bi-stars text-success"></i> Intelligent Match Engine Results
              </h5>
              <div className="small text-muted">
                Target Item: <span className="text-light fw-bold">{item.itemName}</span> ({item.type} • {item.location})
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4">
            {loading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border text-danger mb-2" role="status"></div>
                <div>Scanning campus database with multi-factor similarity algorithm...</div>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-search fs-1 mb-2 d-block opacity-50"></i>
                <h5>No Potential Matches Found Yet</h5>
                <p className="small text-secondary mb-0">
                  CampusFlix continuously compares newly reported items against your report.
                  You will receive an automated notification as soon as a potential match appears.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                <div className="small text-success fw-semibold">
                  <i className="bi bi-check-circle-fill me-1"></i> Found {matches.length} counterpart reports with high similarity confidence.
                </div>

                {matches.map((match, idx) => {
                  const mItem = match.item;
                  const isHigh = match.confidenceScore >= 80;

                  return (
                    <div
                      key={mItem._id || idx}
                      className="p-3 rounded border border-secondary"
                      style={{
                        backgroundColor: "#191919",
                        borderLeft: `5px solid ${isHigh ? "#46d369" : "#f59e0b"}`
                      }}
                    >
                      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div className="d-flex align-items-center gap-3">
                          {mItem.imageUrl ? (
                            <img
                              src={mItem.imageUrl}
                              alt={mItem.itemName}
                              className="rounded"
                              style={{ width: "65px", height: "65px", objectFit: "cover" }}
                            />
                          ) : (
                            <div className="rounded bg-black p-3 border border-secondary">
                              <i className="bi bi-box-seam fs-3"></i>
                            </div>
                          )}

                          <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <span className="badge bg-secondary">{mItem.type}</span>
                              <h6 className="mb-0 fw-bold">{mItem.itemName}</h6>
                              <span
                                className={`badge ${isHigh ? "bg-success" : "bg-warning text-dark"}`}
                              >
                                {match.confidenceScore}% Confidence
                              </span>
                            </div>

                            <div className="text-muted small mb-1" style={{ fontSize: "0.78rem" }}>
                              <i className="bi bi-geo-alt me-1 text-danger"></i> {mItem.location} • Category: {mItem.category}
                            </div>
                            <p className="text-light-emphasis small mb-0" style={{ fontSize: "0.8rem" }}>
                              {mItem.description}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="d-flex flex-md-column gap-2 justify-content-end">
                          {mItem.type === "Found" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                              onClick={() => {
                                if (onRequestClaim) onRequestClaim(mItem);
                                onClose();
                              }}
                            >
                              <i className="bi bi-shield-check"></i> Request Claim
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
                            onClick={() => openGmailCompose(mItem.contact, mItem.itemName, mItem.location)}
                          >
                            <i className="bi bi-envelope"></i> Email Reporter
                          </button>
                        </div>
                      </div>

                      {/* Factor score bar breakdown */}
                      <div className="mt-3 pt-2 border-top border-dark">
                        <div className="d-flex justify-content-between small text-muted mb-1" style={{ fontSize: "0.72rem" }}>
                          <span>Name (35%): {match.matchingFactors?.nameScore || 0}%</span>
                          <span>Category (20%): {match.matchingFactors?.categoryScore || 0}%</span>
                          <span>Description (20%): {match.matchingFactors?.descriptionScore || 0}%</span>
                          <span>Location (15%): {match.matchingFactors?.locationScore || 0}%</span>
                          <span>Date (10%): {match.matchingFactors?.dateScore || 0}%</span>
                        </div>
                        <div className="progress" style={{ height: "4px", backgroundColor: "#262626" }}>
                          <div
                            className={`progress-bar ${isHigh ? "bg-success" : "bg-warning"}`}
                            style={{ width: `${match.confidenceScore}%` }}
                          ></div>
                        </div>

                        {/* Phase 2: Smart Match Explanation Reasons & Disclaimer */}
                        <div className="mt-2 p-2 rounded bg-black small border border-secondary border-opacity-25">
                          <div className="text-warning small fw-semibold mb-1" style={{ fontSize: "0.74rem" }}>
                            <i className="bi bi-lightbulb-fill me-1"></i> Match Explanation:
                          </div>
                          <ul className="mb-1 ps-3 text-light-emphasis small" style={{ fontSize: "0.74rem" }}>
                            {match.explanation?.reasons?.map((reason, rIdx) => (
                              <li key={rIdx}>{reason}</li>
                            )) || (
                              <>
                                {(match.matchingFactors?.nameScore || 0) >= 60 && <li>Similar item names detected</li>}
                                {(match.matchingFactors?.categoryScore || 0) >= 50 && <li>Category compatibility confirmed</li>}
                                {(match.matchingFactors?.descriptionScore || 0) >= 30 && <li>Matching descriptive details</li>}
                                {(match.matchingFactors?.locationScore || 0) >= 40 && <li>Reported in proximity or same campus zone</li>}
                                {(match.matchingFactors?.dateScore || 0) >= 60 && <li>Dates reported in close temporal proximity</li>}
                              </>
                            )}
                          </ul>
                          <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                            ⚠️ <em>Match similarity does not prove ownership. Formal claim verification required at Campus Security Desk.</em>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-footer border-secondary">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
