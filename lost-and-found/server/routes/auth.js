import express from "express";

const router = express.Router();

// Mock in-memory user registry for campus auth
const users = [
  {
    id: "admin-1",
    name: "Campus Administrator",
    email: "admin@mitaoe.ac.in",
    password: "admin",
    role: "admin",
    department: "Student Affairs & Security",
  },
  {
    id: "student-1",
    name: "Rahul Patil",
    email: "student@mitaoe.ac.in",
    password: "password123",
    role: "student",
    department: "Computer Engineering",
  },
];

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Find user or allow demo logins
  let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // If user signs in with any admin email, grant admin
    const isAdmin = cleanEmail.includes("admin");
    user = {
      id: "user-" + Date.now(),
      name: cleanEmail.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email: cleanEmail,
      role: isAdmin ? "admin" : "student",
      department: isAdmin ? "Campus Administration" : "MITAOE Campus",
    };
    users.push({ ...user, password });
  }

  res.json({
    success: true,
    message: "Login successful",
    token: `token-${user.role}-${Date.now()}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

router.post("/register", (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ success: false, message: "An account with this email already exists" });
  }

  const newUser = {
    id: "user-" + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    password,
    role: role || (cleanEmail.includes("admin") ? "admin" : "student"),
    department: "MITAOE Campus",
  };
  users.push(newUser);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    token: `token-${newUser.role}-${Date.now()}`,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
    },
  });
});

export default router;

