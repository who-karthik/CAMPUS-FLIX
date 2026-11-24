import { useState, useMemo } from "react";

const CAMPUS_ZONES = [
  {
    id: "library",
    name: "Central Library",
    shortName: "Library",
    icon: "bi-book",
    coords: { x: 50, y: 35 },
    keywords: ["library", "reading", "central library", "books"]
  },
  {
    id: "cafeteria",
    name: "Cafeteria Courtyard",
    shortName: "Cafeteria",
    icon: "bi-cup-hot",
    coords: { x: 42, y: 70 },
    keywords: ["cafeteria", "canteen", "courtyard", "food", "bench"]
  },
  {
    id: "labs",
    name: "Computer Labs 301–304",
    shortName: "Comp Labs",
    icon: "bi-laptop",
    coords: { x: 74, y: 32 },
    keywords: ["lab", "computer lab", "304", "301", "302", "303", "practical"]
  },
  {
    id: "auditorium",
    name: "Auditorium",
    shortName: "Audi",
    icon: "bi-film",
    coords: { x: 26, y: 42 },
    keywords: ["audi", "auditorium", "lecture hall", "audi-2"]
  },
  {
    id: "hostel",
    name: "Hostel Blocks",
    shortName: "Hostels",
    icon: "bi-buildings",
    coords: { x: 82, y: 74 },
    keywords: ["hostel", "block b", "block a", "boys hostel", "girls hostel", "room"]
  },
  {
    id: "ground",
    name: "Sports Ground",
    shortName: "Sports Ground",
    icon: "bi-dribbble",
    coords: { x: 22, y: 18 },
    keywords: ["ground", "sports", "bleachers", "field"]
  },
  {
    id: "gym",
    name: "Gymnasium",
    shortName: "Gym",
    icon: "bi-heart-pulse",
    coords: { x: 44, y: 15 },
    keywords: ["gym", "gymnasium", "workout", "fitness"]
  },
  {
    id: "gate",
    name: "Main Gate",
    shortName: "Main Gate",
    icon: "bi-door-open",
    coords: { x: 12, y: 84 },
    keywords: ["gate", "main gate", "entrance", "security gate", "bus"]
  },
  {
    id: "security",
    name: "Campus Security Desk",
    shortName: "Security Desk",
    icon: "bi-shield-check",
    coords: { x: 24, y: 72 },
    keywords: ["security", "security desk", "guard", "lost & found office"]
  }
];

export default function CampusMap({ items = [], onOpenItem }) {
  const [selectedZone, setSelectedZone] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all, Lost, Found

  // Associate items with each campus zone
  const zoneStats = useMemo(() => {
    const stats = {};
    CAMPUS_ZONES.forEach((zone) => {
      const matched = items.filter((item) => {
        const locLower = (item.location || "").toLowerCase();
        return zone.keywords.some((kw) => locLower.includes(kw));
      });

      const lostCount = matched.filter((i) => i.type === "Lost" && i.status !== "Returned").length;
      const foundCount = matched.filter((i) => i.type === "Found" && i.status !== "Returned").length;
      const totalActive = lostCount + foundCount;

      stats[zone.id] = {
        zone,
        items: matched,
        lostCount,
        foundCount,
        totalActive
      };
    });
    return stats;
  }, [items]);

  const activeZoneData = selectedZone ? zoneStats[selectedZone.id] : null;

  // Filter items in active zone by type
  const zoneFilteredItems = useMemo(() => {
    if (!activeZoneData) return [];
    if (filterType === "all") return activeZoneData.items;
    return activeZoneData.items.filter((i) => i.type === filterType);
  }, [activeZoneData, filterType]);

  return (
    <div className="campus-map-section my-5 px-3 px-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger px-2 py-1" style={{ fontSize: "0.72rem" }}>
              <i className="bi bi-geo-alt-fill me-1"></i> INTERACTIVE MAP
            </span>
            <h2 className="netflix-row-title mb-0" style={{ fontSize: "1.4rem" }}>
              Campus Schematic Locations & Hotspots
            </h2>
          </div>
          <p className="text-secondary small mb-0 mt-1">
            Click on any campus building or location pin to inspect active Lost and Found reports associated with that zone.
          </p>
        </div>

        {/* Legend */}
        <div className="d-flex align-items-center gap-3 text-light small" style={{ fontSize: "0.78rem" }}>
          <div className="d-flex align-items-center gap-1">
            <span className="badge bg-danger rounded-circle p-1"> </span>
            <span>Lost Items</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span className="badge bg-success rounded-circle p-1"> </span>
            <span>Found Items</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <span className="badge rounded-circle p-1" style={{ background: "rgba(229, 9, 20, 0.4)" }}> </span>
            <span>Hotspot Glow</span>
          </div>
        </div>
      </div>

      {/* Campus Map Container */}
      <div className="row g-3">
        {/* Schematic Visual Canvas */}
        <div className="col-12 col-lg-8">
          <div
            className="position-relative rounded p-3 overflow-hidden border border-secondary"
            style={{
              backgroundColor: "#161616",
              height: "460px",
              boxShadow: "inset 0 0 50px rgba(0, 0, 0, 0.8)",
              background: "radial-gradient(ellipse at center, #222222 0%, #121212 100%)"
            }}
          >
            {/* Grid Lines Pattern */}
            <div
              className="position-absolute top-0 start-0 w-100 h-100 opacity-25"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
                backgroundSize: "40px 40px"
              }}
            ></div>

            {/* Campus Pathways (Schematic SVG) */}
            <svg
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{ pointerEvents: "none" }}
            >
              <line x1="12%" y1="84%" x2="24%" y2="72%" stroke="#333" strokeWidth="3" strokeDasharray="4" />
              <line x1="24%" y1="72%" x2="42%" y2="70%" stroke="#333" strokeWidth="3" strokeDasharray="4" />
              <line x1="42%" y1="70%" x2="50%" y2="35%" stroke="#333" strokeWidth="4" />
              <line x1="50%" y1="35%" x2="74%" y2="32%" stroke="#333" strokeWidth="3" />
              <line x1="42%" y1="70%" x2="82%" y2="74%" stroke="#333" strokeWidth="3" />
              <line x1="50%" y1="35%" x2="26%" y2="42%" stroke="#333" strokeWidth="3" />
              <line x1="26%" y1="42%" x2="22%" y2="18%" stroke="#333" strokeWidth="3" strokeDasharray="4" />
              <line x1="50%" y1="35%" x2="44%" y2="15%" stroke="#333" strokeWidth="3" />
            </svg>

            {/* Location Zone Markers */}
            {CAMPUS_ZONES.map((zone) => {
              const data = zoneStats[zone.id] || { lostCount: 0, foundCount: 0, totalActive: 0 };
              const isSelected = selectedZone?.id === zone.id;
              const hasActivity = data.totalActive > 0;
              const isHotspot = data.totalActive >= 2;

              return (
                <div
                  key={zone.id}
                  className="position-absolute translate-middle cursor-pointer transition-all"
                  style={{
                    left: `${zone.coords.x}%`,
                    top: `${zone.coords.y}%`,
                    zIndex: isSelected ? 30 : 20,
                    cursor: "pointer"
                  }}
                  onClick={() => setSelectedZone(zone)}
                >
                  {/* Hotspot Visualization Radial Aura */}
                  {isHotspot && (
                    <div
                      className="position-absolute top-50 start-50 translate-middle rounded-circle pulse-hotspot"
                      style={{
                        width: `${Math.min(90, 45 + data.totalActive * 12)}px`,
                        height: `${Math.min(90, 45 + data.totalActive * 12)}px`,
                        background: "radial-gradient(circle, rgba(229, 9, 20, 0.45) 0%, rgba(229, 9, 20, 0) 70%)",
                        pointerEvents: "none"
                      }}
                    ></div>
                  )}

                  {/* Marker Pin Box */}
                  <div
                    className={`d-flex align-items-center gap-1 px-2 py-1 rounded shadow-lg border ${
                      isSelected
                        ? "border-danger bg-danger text-white scale-105"
                        : hasActivity
                        ? "border-light-subtle bg-dark text-light"
                        : "border-secondary bg-black text-secondary"
                    }`}
                    style={{
                      transform: isSelected ? "scale(1.12)" : "scale(1)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <i className={`bi ${zone.icon} ${isSelected ? "text-white" : "text-danger"}`}></i>
                    <span className="fw-semibold small" style={{ fontSize: "0.74rem", whiteSpace: "nowrap" }}>
                      {zone.shortName}
                    </span>

                    {/* Lost vs Found Marker Counts */}
                    {data.lostCount > 0 && (
                      <span className="badge bg-danger rounded-pill px-1" style={{ fontSize: "0.62rem" }} title="Lost items">
                        {data.lostCount}L
                      </span>
                    )}
                    {data.foundCount > 0 && (
                      <span className="badge bg-success rounded-pill px-1" style={{ fontSize: "0.62rem" }} title="Found items">
                        {data.foundCount}F
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Schematic Overlay Compass */}
            <div
              className="position-absolute bottom-0 start-0 m-3 p-2 rounded bg-black bg-opacity-75 border border-secondary small text-muted"
              style={{ fontSize: "0.68rem" }}
            >
              <i className="bi bi-compass me-1 text-danger"></i> Campus Orientation • MITAOE Schematic Map
            </div>
          </div>

          {/* Quick Zone Navigation Buttons */}
          <div className="d-flex flex-wrap gap-1 mt-2">
            {CAMPUS_ZONES.map((zone) => {
              const count = zoneStats[zone.id]?.totalActive || 0;
              const isSelected = selectedZone?.id === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  className={`btn btn-sm ${
                    isSelected ? "btn-danger" : "btn-dark text-secondary border-secondary"
                  } py-0 px-2 rounded-pill`}
                  style={{ fontSize: "0.72rem" }}
                  onClick={() => setSelectedZone(zone)}
                >
                  <i className={`bi ${zone.icon} me-1`}></i>
                  {zone.shortName} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Location Details Panel */}
        <div className="col-12 col-lg-4">
          <div
            className="rounded p-3 h-100 border border-secondary d-flex flex-column justify-content-between"
            style={{ backgroundColor: "#181818", minHeight: "460px" }}
          >
            {activeZoneData ? (
              <div>
                <div className="d-flex justify-content-between align-items-start border-bottom border-dark pb-2 mb-3">
                  <div>
                    <h5 className="fw-bold text-light mb-0 d-flex align-items-center gap-2">
                      <i className={`bi ${activeZoneData.zone.icon} text-danger`}></i>
                      {activeZoneData.zone.name}
                    </h5>
                    <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                      {activeZoneData.totalActive} active reports in this zone
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-close btn-close-white small"
                    onClick={() => setSelectedZone(null)}
                    title="Close selection"
                  ></button>
                </div>

                {/* Filter in Zone */}
                <div className="btn-group w-100 mb-3" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${filterType === "all" ? "btn-danger" : "btn-dark border-secondary"}`}
                    onClick={() => setFilterType("all")}
                    style={{ fontSize: "0.75rem" }}
                  >
                    All ({activeZoneData.items.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterType === "Lost" ? "btn-danger" : "btn-dark border-secondary"}`}
                    onClick={() => setFilterType("Lost")}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Lost ({activeZoneData.lostCount})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${filterType === "Found" ? "btn-danger" : "btn-dark border-secondary"}`}
                    onClick={() => setFilterType("Found")}
                    style={{ fontSize: "0.75rem" }}
                  >
                    Found ({activeZoneData.foundCount})
                  </button>
                </div>

                {/* Item List in Zone */}
                <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: "320px" }}>
                  {zoneFilteredItems.length === 0 ? (
                    <div className="text-center py-4 text-muted small">
                      <i className="bi bi-inbox fs-4 d-block mb-1 opacity-50"></i>
                      No {filterType !== "all" ? filterType : ""} reports in this location.
                    </div>
                  ) : (
                    zoneFilteredItems.map((item) => (
                      <div
                        key={item._id}
                        className="p-2 rounded bg-black border border-secondary border-opacity-50 d-flex align-items-center justify-content-between gap-2 cursor-pointer transition-all hover-card"
                        style={{ cursor: "pointer" }}
                        onClick={() => onOpenItem && onOpenItem(item)}
                      >
                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.itemName}
                              className="rounded"
                              style={{ width: "42px", height: "42px", objectFit: "cover" }}
                            />
                          ) : (
                            <div className="rounded bg-dark d-flex align-items-center justify-content-center" style={{ width: "42px", height: "42px" }}>
                              <i className="bi bi-box-seam text-secondary"></i>
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div className="d-flex align-items-center gap-1 mb-0">
                              <span className={`badge ${item.type === "Lost" ? "bg-danger" : "bg-success"} p-1`} style={{ fontSize: "0.62rem" }}>
                                {item.type}
                              </span>
                              <span className="fw-semibold text-light small text-truncate" style={{ fontSize: "0.8rem" }}>
                                {item.itemName}
                              </span>
                            </div>
                            <div className="text-muted small text-truncate" style={{ fontSize: "0.7rem" }}>
                              {item.category} • {new Date(item.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <i className="bi bi-chevron-right text-secondary small"></i>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-muted my-auto">
                <i className="bi bi-hand-index-thumb fs-2 text-secondary mb-2 d-block"></i>
                <h6 className="text-light fw-bold">Select a Campus Location</h6>
                <p className="small mb-0 text-secondary">
                  Click on any interactive pin on the campus schematic to inspect items lost or found there.
                </p>
              </div>
            )}

            <div className="mt-3 pt-2 border-top border-dark small text-muted" style={{ fontSize: "0.72rem" }}>
              <i className="bi bi-shield-check text-info me-1"></i>
              Schematic map reflects active campus database reports. No GPS coordinates fabricated.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
