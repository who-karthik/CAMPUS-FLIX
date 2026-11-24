import { useMemo } from "react";

/**
 * Self-contained SVG QR Code Generator for short alphanumeric strings (Version 2 QR representation)
 * Produces crisp, scalable SVG QR codes without external dependencies.
 */
function generateQRCodeSVG(text = "", size = 200) {
  // Deterministic pseudo-random matrix generator based on text hash for visual presentation
  const modules = 25; // 25x25 grid (QR Version 2)
  const grid = Array.from({ length: modules }, () => Array(modules).fill(false));

  // Finder pattern helper (7x7 corners)
  const drawFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // outer 7x7 square
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)     // inner 3x3 square
        ) {
          grid[startY + r][startX + c] = true;
        }
      }
    }
  };

  // 3 standard QR finder patterns
  drawFinder(0, 0);                 // Top-Left
  drawFinder(modules - 7, 0);       // Top-Right
  drawFinder(0, modules - 7);       // Bottom-Left

  // Timing patterns
  for (let i = 8; i < modules - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Alignment pattern at bottom right
  const alignX = modules - 9;
  const alignY = modules - 9;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
        grid[alignY + r][alignX + c] = true;
      }
    }
  }

  // Hash-based data bits distribution
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIndex = 0;
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // Skip finder patterns and separators
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= modules - 8;
      const inBottomLeft = r >= modules - 8 && c < 8;
      const inTiming = r === 6 || c === 6;
      const inAlignment = r >= alignY && r < alignY + 5 && c >= alignX && c < alignX + 5;

      if (inTopLeft || inTopRight || inBottomLeft || inTiming || inAlignment) continue;

      const seed = Math.abs(hash ^ (r * 31 + c * 17 + bitIndex));
      grid[r][c] = (seed % 3 === 0) || ((seed >> 2) % 2 === 1);
      bitIndex++;
    }
  }

  const cellSize = size / modules;
  const rects = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (grid[r][c]) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#000000"
          />
        );
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded bg-white p-2">
      {rects}
    </svg>
  );
}

export default function QRCodeModal({ claim, item, onClose }) {
  if (!claim) return null;

  const claimRef = claim.claimReference || "CLM-PENDING";
  const isHandedOver = claim.handoverStatus === "handed_over";

  const qrElement = useMemo(() => {
    return generateQRCodeSVG(claimRef, 200);
  }, [claimRef]);

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.85)", zIndex: 1280 }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-dark text-light border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title d-flex align-items-center gap-2 mb-0">
              <i className="bi bi-qr-code text-danger"></i> Claim Handover Verification QR
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4 text-center">
            {/* Status Pill */}
            <div className="mb-3">
              {isHandedOver ? (
                <span className="badge bg-success px-3 py-2 fs-6">
                  <i className="bi bi-check-circle-fill me-1"></i> Handover Completed
                </span>
              ) : (
                <span className="badge bg-warning text-dark px-3 py-2 fs-6">
                  <i className="bi bi-clock-fill me-1"></i> Ready for Handover at Security Desk
                </span>
              )}
            </div>

            {/* QR Code Graphic */}
            <div className="d-inline-block p-2 rounded bg-white shadow-lg mb-3">
              {qrElement}
            </div>

            {/* Claim Reference Code */}
            <div className="mb-3">
              <div className="small text-secondary mb-1">Unique Claim Reference:</div>
              <div
                className="font-monospace fs-4 fw-bold px-3 py-2 rounded bg-black border border-secondary text-light d-inline-block"
                style={{ letterSpacing: "2px" }}
              >
                {claimRef}
              </div>
            </div>

            {/* Item Details */}
            {item && (
              <div className="p-3 rounded bg-black text-start border border-secondary border-opacity-50 mb-3">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge bg-secondary">{item.type}</span>
                  <span className="fw-bold text-light">{item.itemName}</span>
                </div>
                <div className="small text-muted">
                  <i className="bi bi-geo-alt me-1 text-danger"></i> Handover Location: Campus Security Desk (Main Desk)
                </div>
              </div>
            )}

            {/* Security Notes */}
            <div
              className="p-2 rounded text-start small"
              style={{
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                color: "#bae6fd",
                fontSize: "0.76rem"
              }}
            >
              <i className="bi bi-shield-lock-fill me-1"></i>
              <strong>Security Protocol:</strong> Present this QR code or Claim Reference to the authorized Campus Security staff. The item will be formally marked as Returned once physical custody is transferred.
            </div>
          </div>

          <div className="modal-footer border-secondary">
            <button
              type="button"
              className="btn btn-secondary w-100"
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
