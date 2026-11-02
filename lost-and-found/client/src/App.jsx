import { useEffect, useMemo, useRef, useState } from "react";
import {
  createItem,
  deleteItem,
  getItems,
  loginUser,
  registerUser,
  updateStatus,
} from "./api.js";

const initialForm = {
  itemName: "",
  type: "Lost",
  category: "Electronics",
  description: "",
  location: "",
  date: new Date().toISOString().slice(0, 10),
  contact: "",
  imageUrl: "",
};

const CATEGORIES = [
  "All",
  "Electronics",
  "Accessories",
  "Documents",
  "Clothing",
  "Bags",
  "Books",
  "Keys",
  "Other",
];

const CATEGORY_DEFAULT_IMAGES = {
  Electronics: "/images/calculator.jpg",
  Accessories: "/images/wallet.jpg",
  Other: "/images/bottle.jpg",
  Keys: "/images/keys.jpg",
  Bags: "/images/backpack.jpg",
  Books: "/images/book.jpg",
  Documents: "/images/book.jpg",
  Clothing: "/images/backpack.jpg",
};

const getItemImage = (item) => {
  if (item && item.imageUrl && item.imageUrl.trim()) {
    return item.imageUrl.trim();
  }
  return CATEGORY_DEFAULT_IMAGES[item?.category] || "/images/calculator.jpg";
};

export const openGmailCompose = (email, itemName, location) => {
  if (!email) {
    window.alert("No reporter contact information provided.");
    return;
  }
  if (!email.includes("@")) {
    const cleanPhone = email.replace(/[^0-9+]/g, "");
    if (cleanPhone) {
      window.open(
        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi, contacting you regarding your campus Lost & Found report: ${itemName || "item"}`)}`,
        "_blank"
      );
    } else {
      window.alert(`Reporter Contact: ${email}`);
    }
    return;
  }
  const cleanEmail = email.trim();
  const subject = encodeURIComponent(
    `Regarding MITAOE Lost & Found: ${itemName || "Campus Item"}`
  );
  const body = encodeURIComponent(
    `Hello,\n\nI am contacting you regarding your Lost & Found report on the campus portal:\n• Item: ${itemName || "N/A"}\n• Location: ${location || "Campus"}\n\nPlease let me know if this item is still available or when we can coordinate on campus.\n\nThank you!`
  );
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(cleanEmail)}&su=${subject}&body=${body}`;
  window.open(gmailUrl, "_blank", "noopener,noreferrer");
};

export default function App() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("All"); // All, Lost, Found
  const [selectedCat, setSelectedCat] = useState("All");
  const [page, setPage] = useState("home"); // home, lost, found, report, admin, login
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // User Authentication State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("campus_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login"); // login or register
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Admin table filter state
  const [adminStatusFilter, setAdminStatusFilter] = useState("All");
  const [adminTypeFilter, setAdminTypeFilter] = useState("All");
  const [adminSearch, setAdminSearch] = useState("");

  // Modal Detail State
  const [activeModalItem, setActiveModalItem] = useState(null);

  // Video State
  const [isMuted, setIsMuted] = useState(true);
  const [navScrolled, setNavScrolled] = useState(false);
  const videoRef = useRef(null);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const result = await getItems();
      setItems(result.data || []);
    } catch (error) {
      setMessage({
        type: "danger",
        text: `${error.message}. Make sure server is running.`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Filtered Items for browse/search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      let matchesType = true;
      if (page === "lost") matchesType = item.type === "Lost";
      else if (page === "found") matchesType = item.type === "Found";
      else if (filterType !== "All") matchesType = item.type === filterType;

      const matchesCat = selectedCat === "All" || item.category === selectedCat;
      const text = `${item.itemName} ${item.category} ${item.location} ${item.description} ${item.contact}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());

      return matchesType && matchesCat && matchesQuery;
    });
  }, [items, page, filterType, selectedCat, query]);

  // Admin filtered items
  const adminFilteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus =
        adminStatusFilter === "All" || item.status === adminStatusFilter;
      const matchesType =
        adminTypeFilter === "All" || item.type === adminTypeFilter;
      const text = `${item.itemName} ${item.category} ${item.location} ${item.contact}`.toLowerCase();
      const matchesSearch = text.includes(adminSearch.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [items, adminStatusFilter, adminTypeFilter, adminSearch]);

  // Statistics & KPI
  const stats = useMemo(() => {
    const total = items.length;
    const lost = items.filter((i) => i.type === "Lost").length;
    const found = items.filter((i) => i.type === "Found").length;
    const open = items.filter((i) => i.status === "Open").length;
    const claimed = items.filter((i) => i.status === "Claimed").length;
    const returned = items.filter((i) => i.status === "Returned").length;
    const resolutionRate = total > 0 ? Math.round((returned / total) * 100) : 0;

    // Category distribution
    const catCounts = {};
    items.forEach((item) => {
      catCounts[item.category] = (catCounts[item.category] || 0) + 1;
    });

    return { total, lost, found, open, claimed, returned, resolutionRate, catCounts };
  }, [items]);

  const isAdmin = Boolean(user && user.role === "admin");

  // Authentication Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (authMode === "login") {
        res = await loginUser({ email: authEmail, password: authPassword });
      } else {
        res = await registerUser({
          name: authName,
          email: authEmail,
          password: authPassword,
        });
      }

      if (res && res.success) {
        setUser(res.user);
        localStorage.setItem("campus_user", JSON.stringify(res.user));
        setMessage({
          type: "success",
          text: `Welcome, ${res.user.name}! Successfully signed in.`,
        });
        setPage(res.user.role === "admin" ? "admin" : "home");
      }
    } catch (err) {
      setMessage({ type: "danger", text: err.message || "Authentication failed" });
    }
  };

  const handleDemoLogin = async (role) => {
    const creds =
      role === "admin"
        ? { email: "admin@mitaoe.ac.in", password: "admin" }
        : { email: "student@mitaoe.ac.in", password: "password123" };
    try {
      const res = await loginUser(creds);
      if (res && res.success) {
        setUser(res.user);
        localStorage.setItem("campus_user", JSON.stringify(res.user));
        setMessage({
          type: "success",
          text: `Logged in as ${res.user.name} (${res.user.role.toUpperCase()})`,
        });
        setPage(role === "admin" ? "admin" : "home");
      }
    } catch (err) {
      setMessage({ type: "danger", text: err.message });
    }
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("campus_user");
    setShowProfileMenu(false);
    setMessage({ type: "success", text: "You have signed out successfully." });
    setPage("home");
  };

  // Submit new report
  const submitReport = async (e) => {
    e.preventDefault();
    if (
      !form.itemName.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.contact.trim()
    ) {
      setMessage({
        type: "danger",
        text: "Please complete all required fields.",
      });
      return;
    }
    try {
      await createItem(form);
      setForm(initialForm);
      setMessage({
        type: "success",
        text: "Your report has been published to the campus board!",
      });
      setPage("home");
      await loadItems();
    } catch (err) {
      setMessage({ type: "danger", text: err.message });
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus(id, status);
      await loadItems();
      if (activeModalItem && activeModalItem._id === id) {
        setActiveModalItem((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      setMessage({ type: "danger", text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report permanently?")) return;
    try {
      await deleteItem(id);
      if (activeModalItem && activeModalItem._id === id) {
        setActiveModalItem(null);
      }
      await loadItems();
      setMessage({ type: "success", text: "Report deleted." });
    } catch (err) {
      setMessage({ type: "danger", text: err.message });
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (!items.length) {
      window.alert("No reports to export.");
      return;
    }
    const headers = ["ID", "Item Name", "Type", "Category", "Location", "Date", "Contact", "Status"];
    const rows = items.map((i) => [
      `"${i._id}"`,
      `"${i.itemName.replace(/"/g, '""')}"`,
      `"${i.type}"`,
      `"${i.category}"`,
      `"${i.location.replace(/"/g, '""')}"`,
      `"${new Date(i.date).toLocaleDateString()}"`,
      `"${i.contact}"`,
      `"${i.status}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mitaoe_lost_found_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navTo = (target) => {
    setPage(target);
    setMessage({ type: "", text: "" });
    setShowProfileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="netflix-app">
      {/* ---------------- Netflix Navigation Bar ---------------- */}
      <nav className={`netflix-nav ${navScrolled ? "scrolled" : ""}`}>
        <button className="netflix-logo" onClick={() => navTo("home")}>
          CAMPUS<span>FLIX</span>
        </button>

        <ul className="netflix-nav-links">
          <li>
            <button
              className={`netflix-nav-link ${page === "home" ? "active" : ""}`}
              onClick={() => navTo("home")}
            >
              Home
            </button>
          </li>
          <li>
            <button
              className={`netflix-nav-link ${page === "lost" ? "active" : ""}`}
              onClick={() => navTo("lost")}
            >
              Lost Items ({stats.lost})
            </button>
          </li>
          <li>
            <button
              className={`netflix-nav-link ${page === "found" ? "active" : ""}`}
              onClick={() => navTo("found")}
            >
              Found Items ({stats.found})
            </button>
          </li>
          {user && user.role === "admin" && (
            <li>
              <button
                className={`netflix-nav-link ${page === "admin" ? "active" : ""}`}
                onClick={() => navTo("admin")}
              >
                Admin Dashboard
              </button>
            </li>
          )}
        </ul>

        <div className="netflix-nav-right">
          {/* Netflix Search Box */}
          <div className="netflix-search-wrap">
            <i className="bi bi-search netflix-search-icon" />
            <input
              type="text"
              className="netflix-search-input"
              placeholder="Titles, people, campus spots..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="netflix-search-clear"
                onClick={() => setQuery("")}
              >
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          <button
            className="netflix-btn-report-nav"
            onClick={() => {
              setForm(initialForm);
              navTo("report");
            }}
          >
            <i className="bi bi-plus-lg" /> Report
          </button>

          {/* User Profile / Login Button */}
          {user ? (
            <div className="position-relative">
              <button
                className="netflix-user-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="netflix-avatar-circle">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="netflix-user-name">{user.name}</span>
                <span className={`netflix-user-role-tag ${user.role}`}>
                  {user.role}
                </span>
                <i className="bi bi-caret-down-fill text-muted" style={{ fontSize: "10px" }} />
              </button>

              {showProfileMenu && (
                <div className="netflix-profile-dropdown">
                  <div className="netflix-profile-info">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                    <small className="text-secondary">{user.department}</small>
                  </div>

                  {user.role === "admin" && (
                    <button
                      className="netflix-dropdown-item"
                      onClick={() => navTo("admin")}
                    >
                      <i className="bi bi-speedometer2 text-danger" /> Admin Dashboard
                    </button>
                  )}
                  <button
                    className="netflix-dropdown-item"
                    onClick={() => {
                      setForm(initialForm);
                      navTo("report");
                    }}
                  >
                    <i className="bi bi-plus-circle text-success" /> Make a Report
                  </button>
                  <button
                    className="netflix-dropdown-item text-danger"
                    onClick={handleSignOut}
                  >
                    <i className="bi bi-box-arrow-right" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn btn-sm btn-outline-light px-3"
              style={{ borderRadius: "4px", fontWeight: "600" }}
              onClick={() => navTo("login")}
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* ---------------- Netflix Billboard Hero (with Video) ---------------- */}
      {page === "home" && !query && selectedCat === "All" && (
        <header className="netflix-hero">
          <video
            ref={videoRef}
            className="netflix-hero-video"
            autoPlay
            loop
            muted={isMuted}
            playsInline
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>

          <div className="netflix-hero-vignette" />
          <div className="netflix-hero-bottom-fade" />

          <div className="netflix-hero-content">
            <div className="netflix-series-badge">
              <span /> CAMPUS RECOVERY PORTAL
            </div>
            <h1 className="netflix-hero-title">
              Lost Something?
              <br />
              Let's Bring It Home.
            </h1>
            <p className="netflix-hero-desc">
              Browse recently lost items, claim belongings discovered across
              campus, or publish a report in seconds. Join hundreds of students
              helping each other daily.
            </p>

            <div className="netflix-hero-actions">
              <button
                className="btn-netflix-white"
                onClick={() => {
                  setForm({ ...initialForm, type: "Lost" });
                  navTo("report");
                }}
              >
                <i className="bi bi-search" /> Report Lost Item
              </button>

              <button
                className="btn-netflix-gray"
                onClick={() => {
                  setForm({ ...initialForm, type: "Found" });
                  navTo("report");
                }}
              >
                <i className="bi bi-plus-lg" /> I Found Something
              </button>

              {user && user.role === "admin" && (
                <button
                  className="btn btn-outline-light"
                  style={{ borderRadius: "4px", padding: "10px 18px", fontWeight: "600" }}
                  onClick={() => navTo("admin")}
                >
                  <i className="bi bi-speedometer2 me-1" /> Admin Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Bottom Right Trailer Controls */}
          <div className="netflix-hero-audio">
            <button
              className="netflix-audio-btn"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute Video" : "Mute Video"}
            >
              <i
                className={`bi ${isMuted ? "bi-volume-mute-fill" : "bi-volume-up-fill"}`}
              />
            </button>
            <div className="netflix-rating-pill">MITAOE 2026</div>
          </div>
        </header>
      )}

      {/* ---------------- Main Content Body ---------------- */}
      <main
        className="netflix-body"
        style={{
          marginTop:
            page !== "home" || query || selectedCat !== "All"
              ? "90px"
              : "-40px",
        }}
      >
        {/* Flash Message */}
        {message.text && (
          <div
            className={`alert alert-${message.type} alert-dismissible`}
            style={{
              backgroundColor:
                message.type === "success" ? "#1b4d2b" : "#661717",
              borderColor: "rgba(255,255,255,0.2)",
              color: "#fff",
              borderRadius: "4px",
              marginBottom: "30px",
            }}
          >
            {message.text}
            <button
              className="btn-close btn-close-white"
              onClick={() => setMessage({ type: "", text: "" })}
            />
          </div>
        )}

        {/* ---------------- 1. HOME VIEW ---------------- */}
        {page === "home" && (
          <>
            {/* Soft Category Filter Pills */}
            <div className="netflix-genres-bar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`genre-pill ${selectedCat === cat ? "active" : ""}`}
                  onClick={() => setSelectedCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* If searching or filtering by category, show a clean unified grid */}
            {query || selectedCat !== "All" ? (
              <div className="netflix-row">
                <div className="netflix-row-header">
                  <h2 className="netflix-row-title">
                    {query
                      ? `Search Results for "${query}"`
                      : `${selectedCat} Items`}
                  </h2>
                  <span className="netflix-row-count">
                    {filteredItems.length} titles
                  </span>
                </div>

                {filteredItems.length ? (
                  <div className="netflix-grid">
                    {filteredItems.map((item) => (
                      <NetflixCard
                        key={item._id}
                        item={item}
                        onOpen={() => setActiveModalItem(item)}
                        onStatus={handleStatusChange}
                        onDelete={handleDelete}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <p style={{ color: "#888", fontSize: "16px" }}>
                      No items matched your search criteria.
                    </p>
                    <button
                      className="btn-netflix-white"
                      onClick={() => {
                        setQuery("");
                        setSelectedCat("All");
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Row 1: Lost on Campus */}
                <div className="netflix-row">
                  <div className="netflix-row-header">
                    <h2 className="netflix-row-title">
                      <span
                        style={{
                          width: "4px",
                          height: "18px",
                          background: "#e50914",
                          display: "inline-block",
                          borderRadius: "2px",
                        }}
                      />
                      Lost on Campus
                    </h2>
                    <span className="netflix-row-count">
                      {stats.lost} items reported
                    </span>
                  </div>

                  <div className="netflix-grid">
                    {items
                      .filter((i) => i.type === "Lost")
                      .map((item) => (
                        <NetflixCard
                          key={item._id}
                          item={item}
                          onOpen={() => setActiveModalItem(item)}
                          onStatus={handleStatusChange}
                          onDelete={handleDelete}
                          isAdmin={isAdmin}
                        />
                      ))}
                  </div>
                </div>

                {/* Row 2: Found Belongings */}
                <div className="netflix-row">
                  <div className="netflix-row-header">
                    <h2 className="netflix-row-title">
                      <span
                        style={{
                          width: "4px",
                          height: "18px",
                          background: "#46d369",
                          display: "inline-block",
                          borderRadius: "2px",
                        }}
                      />
                      Found & Waiting to be Claimed
                    </h2>
                    <span className="netflix-row-count">
                      {stats.found} items safe
                    </span>
                  </div>

                  <div className="netflix-grid">
                    {items
                      .filter((i) => i.type === "Found")
                      .map((item) => (
                        <NetflixCard
                          key={item._id}
                          item={item}
                          onOpen={() => setActiveModalItem(item)}
                          onStatus={handleStatusChange}
                          onDelete={handleDelete}
                          isAdmin={isAdmin}
                        />
                      ))}
                  </div>
                </div>

                {/* Row 3: Successfully Returned */}
                {stats.returned > 0 && (
                  <div className="netflix-row">
                    <div className="netflix-row-header">
                      <h2 className="netflix-row-title">
                        <i
                          className="bi bi-check-circle-fill"
                          style={{ color: "#46d369" }}
                        />
                        Successfully Returned
                      </h2>
                      <span className="netflix-row-count">
                        {stats.returned} reunited
                      </span>
                    </div>

                    <div className="netflix-grid">
                      {items
                        .filter((i) => i.status === "Returned")
                        .map((item) => (
                          <NetflixCard
                            key={item._id}
                            item={item}
                            onOpen={() => setActiveModalItem(item)}
                            onStatus={handleStatusChange}
                            onDelete={handleDelete}
                            isAdmin={isAdmin}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ---------------- 2. LOST OR FOUND VIEW ---------------- */}
        {(page === "lost" || page === "found") && (
          <div className="netflix-row">
            <div className="netflix-row-header">
              <h2 className="netflix-row-title">
                {page === "lost" ? "All Lost Items" : "All Found Belongings"}
              </h2>
              <span className="netflix-row-count">
                {filteredItems.length} items
              </span>
            </div>

            {/* Category Filter */}
            <div className="netflix-genres-bar mb-4">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`genre-pill ${selectedCat === cat ? "active" : ""}`}
                  onClick={() => setSelectedCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredItems.length ? (
              <div className="netflix-grid">
                {filteredItems.map((item) => (
                  <NetflixCard
                    key={item._id}
                    item={item}
                    onOpen={() => setActiveModalItem(item)}
                    onStatus={handleStatusChange}
                    onDelete={handleDelete}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <p style={{ color: "#888" }}>No items found in this section.</p>
              </div>
            )}
          </div>
        )}

        {/* ---------------- 3. REPORT AN ITEM (NETFLIX FORM) ---------------- */}
        {page === "report" && (
          <div className="netflix-form-container">
            <h2 className="netflix-form-title">Report an Item</h2>
            <p className="netflix-form-subtitle">
              Fill in the details below to broadcast your report across campus.
            </p>

            <form onSubmit={submitReport}>
              {/* Type Switcher */}
              <div className="netflix-input-group">
                <label className="netflix-input-label">Report Type</label>
                <div className="netflix-type-tabs">
                  <button
                    type="button"
                    className={`netflix-type-tab ${form.type === "Lost" ? "selected lost" : ""}`}
                    onClick={() => setForm({ ...form, type: "Lost" })}
                  >
                    <i className="bi bi-search" /> Lost Item
                  </button>
                  <button
                    type="button"
                    className={`netflix-type-tab ${form.type === "Found" ? "selected found" : ""}`}
                    onClick={() => setForm({ ...form, type: "Found" })}
                  >
                    <i className="bi bi-box-seam" /> Found Item
                  </button>
                </div>
              </div>

              {/* Item Name */}
              <div className="netflix-input-group">
                <label className="netflix-input-label">Item Title *</label>
                <input
                  className="netflix-input"
                  placeholder="e.g. Sony WH-1000XM4 Headphones"
                  value={form.itemName}
                  onChange={(e) =>
                    setForm({ ...form, itemName: e.target.value })
                  }
                  required
                />
              </div>

              {/* Category */}
              <div className="netflix-input-group">
                <label className="netflix-input-label">Category *</label>
                <select
                  className="netflix-select"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="netflix-input-group">
                <label className="netflix-input-label">Description *</label>
                <textarea
                  className="netflix-input"
                  rows="3"
                  placeholder="Color, brand markings, condition, or identifiers..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                />
              </div>

              {/* Location */}
              <div className="netflix-input-group">
                <label className="netflix-input-label">Campus Location *</label>
                <input
                  className="netflix-input"
                  placeholder="e.g. Central Library, 2nd Floor Reading Room"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  required
                />
              </div>

              {/* Date */}
              <div className="netflix-input-group">
                <label className="netflix-input-label">Date *</label>
                <input
                  type="date"
                  className="netflix-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              {/* Contact */}
              <div className="netflix-input-group">
                <label className="netflix-input-label">
                  Contact Information *
                </label>
                <input
                  className="netflix-input"
                  placeholder="student@mitaoe.ac.in or phone number"
                  value={form.contact}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value })
                  }
                  required
                />
              </div>

              {/* Optional Image */}
              <div className="netflix-input-group">
                <label className="netflix-input-label">
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  className="netflix-input"
                  placeholder="https://images.unsplash.com/..."
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                />
              </div>

              <div className="d-flex gap-3 mt-4">
                <button type="submit" className="btn-netflix-submit">
                  Publish Report
                </button>
                <button
                  type="button"
                  className="btn-netflix-gray"
                  onClick={() => navTo("home")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- 4. ADMIN DASHBOARD (ADMINS ONLY) ---------------- */}
        {page === "admin" && (
          user && user.role === "admin" ? (
            <div className="netflix-admin-wrap">
              {/* Admin Header */}
              <div className="admin-dashboard-header">
                <div>
                  <h1 className="admin-header-title">
                    <i className="bi bi-speedometer2 text-danger" /> Campus Administration Portal
                    <span className="admin-badge-pill">Admin Dashboard</span>
                  </h1>
                  <p className="text-secondary m-0">
                    Comprehensive overview of reports, claims, resolution analytics, and verification audit.
                  </p>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-light btn-sm"
                    style={{ borderRadius: "4px" }}
                    onClick={exportCSV}
                  >
                    <i className="bi bi-download me-1" /> Export CSV
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ borderRadius: "4px" }}
                    onClick={() => {
                      setForm(initialForm);
                      navTo("report");
                    }}
                  >
                    <i className="bi bi-plus-lg me-1" /> Add Report
                  </button>
                </div>
              </div>

              {/* KPI Metrics Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Total Reports</span>
                    <div className="admin-stat-icon total">
                      <i className="bi bi-collection" />
                    </div>
                  </div>
                  <div className="admin-stat-number">{stats.total}</div>
                  <div className="admin-stat-sub">
                    <span className="text-danger fw-bold">{stats.lost} Lost</span> ·{" "}
                    <span className="text-success fw-bold">{stats.found} Found</span>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Open Cases</span>
                    <div className="admin-stat-icon open">
                      <i className="bi bi-clock-history" />
                    </div>
                  </div>
                  <div className="admin-stat-number" style={{ color: "#f59e0b" }}>
                    {stats.open}
                  </div>
                  <div className="admin-stat-sub text-muted">Awaiting claim or match</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Items Claimed</span>
                    <div className="admin-stat-icon claimed">
                      <i className="bi bi-shield-check" />
                    </div>
                  </div>
                  <div className="admin-stat-number" style={{ color: "#60a5fa" }}>
                    {stats.claimed}
                  </div>
                  <div className="admin-stat-sub text-muted">Pending identity verification</div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-top">
                    <span className="admin-stat-label">Resolved & Returned</span>
                    <div className="admin-stat-icon returned">
                      <i className="bi bi-check2-circle" />
                    </div>
                  </div>
                  <div className="admin-stat-number" style={{ color: "#46d369" }}>
                    {stats.returned}
                  </div>
                  <div className="admin-stat-sub">
                    <div className="progress mt-1" style={{ height: "4px", background: "#333" }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${stats.resolutionRate}%` }}
                      />
                    </div>
                    <span className="text-success fw-bold">{stats.resolutionRate}%</span> resolution rate
                  </div>
                </div>
              </div>

              {/* Analytics Breakdown Row */}
              <div className="admin-analytics-grid">
                {/* Category Breakdown */}
                <div className="admin-sub-panel">
                  <div className="admin-panel-title">
                    <i className="bi bi-pie-chart-fill text-danger" /> Category Distribution
                  </div>
                  {Object.entries(stats.catCounts).map(([cat, count]) => {
                    const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    return (
                      <div className="category-bar-item" key={cat}>
                        <div className="category-bar-label">
                          <span>{cat}</span>
                          <span>
                            <strong>{count}</strong> ({percent}%)
                          </span>
                        </div>
                        <div className="category-progress-track">
                          <div
                            className="category-progress-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Campus Hotspots */}
                <div className="admin-sub-panel">
                  <div className="admin-panel-title">
                    <i className="bi bi-geo-alt-fill text-danger" /> Campus Lost & Found Hotspots
                  </div>
                  <p className="text-muted small mb-3">
                    Frequent recovery points tracked by campus security personnel:
                  </p>
                  <div className="hotspot-chip-wrap">
                    <div className="hotspot-chip">
                      <i className="bi bi-building" /> Central Library (Reading Hall)
                    </div>
                    <div className="hotspot-chip">
                      <i className="bi bi-cup-hot" /> Campus Cafeteria & Courtyard
                    </div>
                    <div className="hotspot-chip">
                      <i className="bi bi-laptop" /> Computer Science Labs (301-304)
                    </div>
                    <div className="hotspot-chip">
                      <i className="bi bi-dribbble" /> Sports Ground & Gymnasium
                    </div>
                    <div className="hotspot-chip">
                      <i className="bi bi-bus-front" /> Campus Main Gate / Bus Stop
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-top border-secondary border-opacity-25">
                    <div className="small text-muted mb-1">SECURITY DESK NOTICE</div>
                    <div className="small text-white">
                      Unclaimed electronics and official IDs are deposited at Security Booth #1 after 7 days.
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Filters & Search Toolbar */}
              <div className="admin-toolbar-row">
                <div className="admin-filter-tabs">
                  {["All", "Open", "Claimed", "Returned"].map((status) => (
                    <button
                      key={status}
                      className={`admin-tab-btn ${adminStatusFilter === status ? "active" : ""}`}
                      onClick={() => setAdminStatusFilter(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                <div className="d-flex gap-2">
                  <select
                    className="netflix-status-select"
                    value={adminTypeFilter}
                    onChange={(e) => setAdminTypeFilter(e.target.value)}
                  >
                    <option value="All">All Types</option>
                    <option value="Lost">Lost Only</option>
                    <option value="Found">Found Only</option>
                  </select>

                  <div className="netflix-search-wrap">
                    <i className="bi bi-search netflix-search-icon" />
                    <input
                      type="text"
                      className="netflix-search-input"
                      style={{ width: "200px" }}
                      placeholder="Filter records..."
                      value={adminSearch}
                      onChange={(e) => setAdminSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Management Table */}
              <div className="table-responsive">
                <table className="netflix-table">
                  <thead>
                    <tr>
                      <th>Item Details</th>
                      <th>Type</th>
                      <th>Campus Spot</th>
                      <th>Reported Date</th>
                      <th>Current Status</th>
                      <th>Reporter Contact</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminFilteredItems.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <strong style={{ color: "#fff" }}>
                            {item.itemName}
                          </strong>
                          <div style={{ color: "#888", fontSize: "12px" }}>
                            {item.category}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge-netflix-type ${item.type.toLowerCase()}`}
                            style={{ position: "static" }}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td>{item.location}</td>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td>
                          <select
                            className="netflix-status-select"
                            value={item.status}
                            onChange={(e) =>
                              handleStatusChange(item._id, e.target.value)
                            }
                          >
                            <option>Open</option>
                            <option>Claimed</option>
                            <option>Returned</option>
                          </select>
                        </td>
                        <td>
                          <span className="small text-light">{item.contact}</span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-light"
                              style={{ borderRadius: "4px" }}
                              title="Inspect Details"
                              onClick={() => setActiveModalItem(item)}
                            >
                              <i className="bi bi-eye" />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              style={{ borderRadius: "4px" }}
                              title="Delete permanently"
                              onClick={() => handleDelete(item._id)}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!adminFilteredItems.length && (
                  <p className="text-center text-muted py-4">
                    No reports match the current filter criteria.
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Student / Guest Restricted Screen */
            <div className="netflix-login-wrap" style={{ minHeight: "65vh" }}>
              <div className="netflix-login-card text-center" style={{ maxWidth: "520px" }}>
                <div
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "50%",
                    background: "rgba(229, 9, 20, 0.15)",
                    color: "#e50914",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "32px",
                    margin: "0 auto 16px auto",
                    border: "1px solid rgba(229, 9, 20, 0.35)",
                  }}
                >
                  <i className="bi bi-shield-lock-fill" />
                </div>
                <h2 className="netflix-login-title" style={{ fontSize: "24px" }}>
                  Admin Access Restricted
                </h2>
                <p className="netflix-login-sub mt-2">
                  The Campus Administration Dashboard is strictly reserved for authorized campus administration and security staff. Students do not have permission to view or manage administrative records.
                </p>

                <div className="d-flex flex-column gap-2 mt-4">
                  <button
                    className="btn-netflix-submit"
                    onClick={() => navTo("home")}
                  >
                    <i className="bi bi-arrow-left me-2" /> Return to Campus Home
                  </button>

                  <button
                    className="btn btn-outline-secondary text-light mt-2"
                    style={{ borderRadius: "4px", padding: "10px", fontSize: "13px" }}
                    onClick={() => handleDemoLogin("admin")}
                  >
                    <i className="bi bi-key-fill text-warning me-1" /> Sign In as Campus Administrator (Demo)
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {/* ---------------- 5. LOGIN / REGISTER VIEW ---------------- */}
        {page === "login" && (
          <div className="netflix-login-wrap">
            <div className="netflix-login-card">
              <div className="netflix-login-header">
                <h2 className="netflix-login-title">
                  {authMode === "login" ? "Sign In" : "Create Account"}
                </h2>
                <p className="netflix-login-sub">
                  Campus Connect · MITAOE Lost & Found Portal
                </p>
              </div>

              {/* 1-Click Demo Logins for Testing */}
              <div className="netflix-demo-login-box">
                <div className="netflix-demo-title">
                  <i className="bi bi-lightning-charge-fill text-warning" /> Instant Demo Access
                </div>
                <div className="netflix-demo-btns">
                  <button
                    type="button"
                    className="btn-demo-pill admin"
                    onClick={() => handleDemoLogin("admin")}
                  >
                    <i className="bi bi-shield-lock-fill" /> Campus Admin
                  </button>
                  <button
                    type="button"
                    className="btn-demo-pill student"
                    onClick={() => handleDemoLogin("student")}
                  >
                    <i className="bi bi-mortarboard-fill" /> Student
                  </button>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="netflix-login-auth-switch">
                <button
                  type="button"
                  className={`netflix-auth-tab ${authMode === "login" ? "active" : ""}`}
                  onClick={() => setAuthMode("login")}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`netflix-auth-tab ${authMode === "register" ? "active" : ""}`}
                  onClick={() => setAuthMode("register")}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuthSubmit}>
                {authMode === "register" && (
                  <div className="netflix-input-group">
                    <label className="netflix-input-label">Full Name</label>
                    <input
                      className="netflix-input"
                      placeholder="e.g. Rahul Patil"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="netflix-input-group">
                  <label className="netflix-input-label">Campus Email</label>
                  <input
                    type="email"
                    className="netflix-input"
                    placeholder="student@mitaoe.ac.in"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="netflix-input-group">
                  <label className="netflix-input-label">Password</label>
                  <input
                    type="password"
                    className="netflix-input"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-netflix-submit mt-3">
                  {authMode === "login" ? "Sign In to Campus" : "Register Account"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ---------------- Netflix "More Info" Detail Modal ---------------- */}
      {activeModalItem && (
        <div
          className="netflix-modal-backdrop"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="netflix-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="netflix-modal-close"
              onClick={() => setActiveModalItem(null)}
            >
              <i className="bi bi-x-lg" />
            </button>

            <div className="netflix-modal-hero">
              <img
                src={getItemImage(activeModalItem)}
                alt={activeModalItem.itemName}
                onError={(e) => {
                  e.currentTarget.src = "/images/calculator.jpg";
                }}
              />
              <div className="netflix-modal-gradient" />
              <div className="netflix-modal-hero-title">
                <h2>{activeModalItem.itemName}</h2>
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn-netflix-white"
                    onClick={() =>
                      openGmailCompose(
                        activeModalItem.contact,
                        activeModalItem.itemName,
                        activeModalItem.location
                      )
                    }
                  >
                    <i className="bi bi-google me-2 text-danger" />
                    Email on Gmail
                  </button>

                  {isAdmin ? (
                    <select
                      className="netflix-status-select"
                      style={{ padding: "10px 14px", fontSize: "14px" }}
                      value={activeModalItem.status}
                      onChange={(e) =>
                        handleStatusChange(activeModalItem._id, e.target.value)
                      }
                    >
                      <option>Open</option>
                      <option>Claimed</option>
                      <option>Returned</option>
                    </select>
                  ) : (
                    <span
                      className="netflix-status-tag"
                      style={{ position: "static", padding: "8px 14px", fontSize: "13px" }}
                    >
                      Status: {activeModalItem.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="netflix-modal-body">
              <div className="netflix-modal-meta-row">
                <span className="match-score">98% Match</span>
                <span className="age-badge">
                  {new Date(activeModalItem.date).toLocaleDateString()}
                </span>
                <span
                  className={`badge-netflix-type ${activeModalItem.type.toLowerCase()}`}
                  style={{ position: "static" }}
                >
                  {activeModalItem.type}
                </span>
                <span style={{ color: "#aaa" }}>
                  Status: <strong>{activeModalItem.status}</strong>
                </span>
              </div>

              <p className="netflix-modal-desc">
                {activeModalItem.description}
              </p>

              <div className="netflix-modal-info-grid">
                <div>
                  <span>Campus Spot</span>
                  <strong>{activeModalItem.location}</strong>
                </div>
                <div>
                  <span>Category</span>
                  <strong>{activeModalItem.category}</strong>
                </div>
                <div>
                  <span>Reporter Contact</span>
                  <strong>{activeModalItem.contact}</strong>
                </div>
                <div>
                  <span>Report ID</span>
                  <strong className="font-monospace">
                    #{String(activeModalItem._id).slice(-6).toUpperCase()}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Netflix Minimal Footer ---------------- */}
      <footer className="netflix-footer">
        <p>Questions? Contact Campus Administration or Security.</p>
        <div className="d-flex flex-wrap gap-4 my-3">
          <button
            className="netflix-nav-link"
            onClick={() => navTo("home")}
          >
            Home
          </button>
          <button
            className="netflix-nav-link"
            onClick={() => navTo("lost")}
          >
            Lost Reports
          </button>
          <button
            className="netflix-nav-link"
            onClick={() => navTo("found")}
          >
            Found Belongings
          </button>
          {user && user.role === "admin" && (
            <button
              className="netflix-nav-link"
              onClick={() => navTo("admin")}
            >
              Admin Dashboard
            </button>
          )}
          {!user && (
            <button
              className="netflix-nav-link text-white"
              onClick={() => navTo("login")}
            >
              Sign In
            </button>
          )}
        </div>
        <p style={{ fontSize: "11px", color: "#555" }}>
          © 2026 Campus Connect · Lost & Found Website
        </p>
      </footer>
    </div>
  );
}

// Netflix Item Card Subcomponent with Soft 3D Hover & 16:9 Aspect Ratio
function NetflixCard({ item, onOpen, onStatus, onDelete, isAdmin }) {
  const displayImg = getItemImage(item);

  return (
    <div className="netflix-card" onClick={onOpen}>
      <div className="netflix-card-thumb">
        <img
          src={displayImg}
          alt={item.itemName}
          onError={(e) => {
            e.currentTarget.src = "/images/calculator.jpg";
          }}
        />
        <span className={`badge-netflix-type ${item.type.toLowerCase()}`}>
          {item.type}
        </span>
        <span className="netflix-status-tag">{item.status}</span>
      </div>

      <div className="netflix-card-info">
        <div className="netflix-card-meta">
          <span className="match-score">98% Match</span>
          <span className="age-badge">NEW</span>
          <span style={{ color: "#888", fontSize: "11px" }}>
            {new Date(item.date).toLocaleDateString()}
          </span>
        </div>

        <h3 className="netflix-card-title">{item.itemName}</h3>
        <p className="netflix-card-desc">{item.description}</p>

        <div className="netflix-card-location">
          <i className="bi bi-geo-alt-fill" />
          <span>{item.location}</span>
        </div>

        <div
          className="netflix-card-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn-icon-circle btn-icon-play"
            title="Email Reporter on Gmail"
            onClick={() =>
              openGmailCompose(item.contact, item.itemName, item.location)
            }
          >
            <i className="bi bi-google text-danger" />
          </button>

          <button
            className="btn-icon-circle"
            title="More Info"
            onClick={onOpen}
          >
            <i className="bi bi-info-lg" />
          </button>

          {/* Admin only management controls */}
          {isAdmin && (
            <>
              <button
                className="btn-icon-circle"
                title={
                  item.status === "Returned"
                    ? "Mark as Open"
                    : "Mark as Returned"
                }
                onClick={() =>
                  onStatus(
                    item._id,
                    item.status === "Returned" ? "Open" : "Returned"
                  )
                }
              >
                <i
                  className={`bi ${item.status === "Returned" ? "bi-check-all" : "bi-check-lg"}`}
                  style={{
                    color: item.status === "Returned" ? "#46d369" : "#fff",
                  }}
                />
              </button>

              <button
                className="btn-icon-circle ms-auto"
                title="Delete"
                onClick={() => onDelete(item._id)}
              >
                <i className="bi bi-trash" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
