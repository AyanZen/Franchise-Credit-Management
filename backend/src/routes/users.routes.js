import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { auth, requireAdmin, sanitizeUser } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";
import { validatePassword } from "../utils/password.js";

const router = Router();

router.get("/", auth, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json(users.map(sanitizeUser));
});

router.post("/", auth, requireAdmin, async (req, res) => {
  const { name, username, password, role } = req.body;
  if (!name?.trim() || !username?.trim() || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ error: passwordError });

  const roleValue = role === "admin" ? "admin" : "staff";

  const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
  if (existing) return res.status(409).json({ error: "Username already exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      username: username.trim(),
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
