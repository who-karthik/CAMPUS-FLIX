import { useState, useRef } from "react";
import { uploadItemImage } from "../api";

export default function ImageUpload({
  type = "Lost",
  imageUrl = "",
  onChange,
  disabled = false
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const isFound = type === "Found";
  const MAX_SIZE_MB = 5;
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const validateAndUpload = async (file) => {
    setError("");
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError("Supported formats: JPG, JPEG, PNG, and WEBP only.");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_SIZE_MB} MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(25);
      const timer = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 20 : prev));
      }, 150);

      const res = await uploadItemImage(file);
      clearInterval(timer);
      setUploadProgress(100);

      const resolvedUrl = res.imageUrl.startsWith("http")
        ? res.imageUrl
        : `http://localhost:5000${res.imageUrl}`;

      onChange(resolvedUrl);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 300);
    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      setError(err.message || "Failed to upload image. Please try again.");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="image-upload-wrapper my-2">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <label className="form-label fw-semibold text-light mb-0 small">
          Item Photograph {isFound ? (
            <span className="badge bg-danger ms-1 text-uppercase" style={{ fontSize: "0.68rem" }}>
              * Mandatory for Found Items
            </span>
          ) : (
            <span className="badge bg-secondary ms-1" style={{ fontSize: "0.68rem" }}>
              Optional
            </span>
          )}
        </label>
      </div>

      {/* Upload Guidance Banner */}
      <div
        className={`p-2 rounded mb-2 small d-flex align-items-center gap-2 ${
          isFound ? "alert-found-guide" : "alert-lost-guide"
        }`}
        style={{
          backgroundColor: isFound ? "rgba(229, 9, 20, 0.12)" : "rgba(255, 255, 255, 0.05)",
          border: isFound ? "1px solid rgba(229, 9, 20, 0.35)" : "1px solid rgba(255, 255, 255, 0.1)",
          color: isFound ? "#fca5a5" : "#a1a1aa",
          fontSize: "0.8rem",
          lineHeight: "1.3"
        }}
      >
        <i className={`bi ${isFound ? "bi-exclamation-triangle-fill text-danger" : "bi-info-circle text-info"} fs-6`}></i>
        <span>
          {isFound
            ? "Uploading a photograph is mandatory when reporting a found item. This helps the rightful owner identify their belongings."
            : "Adding an image can help others identify your missing item faster, but it is not mandatory."}
        </span>
      </div>

      {/* Active Preview Mode */}
      {imageUrl ? (
        <div className="image-preview-container position-relative rounded overflow-hidden p-2 text-center"
             style={{ background: "#1c1c1c", border: "1px solid #333" }}>
          <img
            src={imageUrl}
            alt="Uploaded Item Preview"
            className="img-fluid rounded"
            style={{ maxHeight: "200px", objectFit: "contain", width: "100%" }}
          />
          <div className="mt-2 d-flex justify-content-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              style={{ fontSize: "0.8rem" }}
            >
              <i className="bi bi-arrow-repeat"></i> Replace Image
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
              onClick={handleRemove}
              disabled={disabled || uploading}
              style={{ fontSize: "0.8rem" }}
            >
              <i className="bi bi-trash"></i> Remove
            </button>
          </div>
        </div>
      ) : (
        /* Drag and Drop Zone */
        <div
          className={`dropzone-box rounded text-center p-3 cursor-pointer transition-all ${
            dragActive ? "drag-over" : ""
          } ${isFound && !imageUrl ? "required-found-border" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            background: dragActive ? "rgba(229, 9, 20, 0.15)" : "#181818",
            border: dragActive
              ? "2px dashed #e50914"
              : isFound
              ? "2px dashed rgba(229, 9, 20, 0.5)"
              : "2px dashed rgba(255, 255, 255, 0.2)",
            cursor: "pointer",
            borderRadius: "8px",
            minHeight: "130px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {uploading ? (
            <div className="w-100 px-3">
              <div className="spinner-border text-danger spinner-border-sm mb-2" role="status"></div>
              <p className="small text-light mb-1">Uploading photograph... {uploadProgress}%</p>
              <div className="progress" style={{ height: "6px", backgroundColor: "#333" }}>
                <div
                  className="progress-bar bg-danger progress-bar-striped progress-bar-animated"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              <i
                className={`bi bi-cloud-arrow-up fs-2 ${isFound ? "text-danger" : "text-light"} mb-1`}
              ></i>
              <div className="small fw-semibold text-light mb-1">
                Drag and drop your image here, or{" "}
                <span className="text-danger text-decoration-underline">Browse Files</span>
              </div>
              <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                Supports JPG, JPEG, PNG, WEBP (Max 5 MB)
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleChange}
        disabled={disabled || uploading}
      />

      {/* Validation Error */}
      {error && (
        <div className="text-danger small mt-1 d-flex align-items-center gap-1" style={{ fontSize: "0.78rem" }}>
          <i className="bi bi-x-circle-fill"></i> {error}
        </div>
      )}
    </div>
  );
}
