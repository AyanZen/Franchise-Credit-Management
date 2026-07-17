import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        tokenVersion: true,
      },
    });

    if (!user || user.tokenVersion !== (payload.tokenVersion ?? 0)) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user.role = user.role;
    next();
  } catch (err) {
    console.error("[auth] requireAdmin failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );
}

export function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}
