// Authentication & Authorization middleware

export function authenticate(req, res, next) {
  // Support Authorization header: "Bearer <token>" or "token-role-timestamp"
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : (authHeader || "").trim();

  // Also support custom user email/role headers passed by frontend client state
  const clientUserHeader = req.headers["x-user-data"];
  let parsedUser = null;

  if (clientUserHeader) {
    try {
      parsedUser = JSON.parse(clientUserHeader);
    } catch {
      // ignore
    }
  }

  if (parsedUser && parsedUser.email) {
    req.user = {
      id: parsedUser.id || `user-${parsedUser.email}`,
      email: parsedUser.email.toLowerCase().trim(),
      name: parsedUser.name || parsedUser.email.split("@")[0],
      role: parsedUser.role || (parsedUser.email.includes("admin") ? "admin" : "student"),
      department: parsedUser.department || "MITAOE Campus"
    };
    return next();
  }

  if (token) {
    // Demo token format: token-admin-12345 or token-student-12345
    const parts = token.split("-");
    const role = parts[1] === "admin" ? "admin" : "student";
    req.user = {
      id: `user-${parts[2] || Date.now()}`,
      email: role === "admin" ? "admin@mitaoe.ac.in" : "student@mitaoe.ac.in",
      name: role === "admin" ? "Campus Administrator" : "Campus Student",
      role,
      department: role === "admin" ? "Student Affairs & Security" : "MITAOE Campus"
    };
    return next();
  }

  // If no auth credentials provided, set default guest user or return 401 on protected routes
  req.user = null;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user || !req.user.email) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in to continue."
    });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access forbidden: Campus Administrator privileges required."
    });
  }
  next();
}
