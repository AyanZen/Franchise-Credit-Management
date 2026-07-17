import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { auth, requireAdmin, sanitizeUser } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";
import { validatePassword } from "../utils/password.js";
import { sanitizeRole, sanitizeUsername, trimString } from "../utils/sanitize.js";
import { BCRYPT_ROUNDS } from "../config/security.js";

const router = Router();

router.get("/", auth, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json(users.map(sanitizeUser));
});

router.post("/", auth, requireAdmin, async (req, res) => {
  const name = trimString(req.body?.name, 120);
  const username = sanitizeUsername(req.body?.username);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name || !username || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const roleValue = sanitizeRole(req.body?.role);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return res.status(409).json({ error: "Username already exists" });

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name,
      username,
      password: hashed,
      role: roleValue,
    },
  });

  await logActivity(req.user, "add_user", `Added employee "${user.name}" (${user.role})`);
  res.status(201).json(sanitizeUser(user));
});

router.delete("/:id", auth, requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: "Employee not found." });

  if (user.role === "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return res.status(400).json({ error: "Cannot delete the only admin account." });
    }
  }

  await prisma.user.delete({ where: { id: req.params.id } });
  await logActivity(req.user, "delete_user", `Removed employee "${user.name}" (${user.username})`);
  res.json({ ok: true });
});

export default router;
