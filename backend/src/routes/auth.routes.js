import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { auth, signToken, sanitizeUser } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimit.js";
import { fetchBootstrap, logActivity } from "../utils/helpers.js";
import { validatePassword } from "../utils/password.js";

const router = Router();

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const safeUser = sanitizeUser(user);
    const token = signToken(user);
    const data = await fetchBootstrap(user.role);

    await logActivity(safeUser, "login", `${user.name} logged in`);

    res.json({ token, user: safeUser, ...data });
  } catch (err) {
    console.error("[auth] login failed:", err);
    res.status(500).json({
      error: err.message?.includes("postgresql://")
        ? "Database not configured. Set DATABASE_URL in backend/.env"
        : "Login failed. Check server logs.",
    });
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(401).json({ error: "User not found" });
  res.json({ user: sanitizeUser(user) });
});

router.get("/bootstrap", auth, async (req, res) => {
  const data = await fetchBootstrap(req.user.role);
  res.json(data);
});

router.post("/logout", auth, async (req, res) => {
  await logActivity(req.user, "logout", `${req.user.name} logged out`);
  res.json({ ok: true });
});

router.patch("/password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password are required." });
  }
  const passwordError = validatePassword(newPassword);
  if (passwordError) return res.status(400).json({ error: passwordError });
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: "New password must be different from the current password." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(401).json({ error: "User not found." });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(400).json({ error: "Current password is incorrect." });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  await logActivity(req.user, "change_password", `${user.name} changed their login password`);
  res.json({ ok: true });
});

export default router;
