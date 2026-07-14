import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { auth, signToken, sanitizeUser } from "../middleware/auth.js";
import { fetchBootstrap, logActivity } from "../utils/helpers.js";

const router = Router();

router.post("/login", async (req, res) => {
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

export default router;
