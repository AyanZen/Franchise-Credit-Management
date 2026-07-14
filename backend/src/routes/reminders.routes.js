import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";

const router = Router();

router.post("/", auth, async (req, res) => {
  const { franchiseId, date, due, daysOverdue } = req.body;
  if (!franchiseId) return res.status(400).json({ error: "Franchise is required." });

  const franchise = await prisma.franchise.findUnique({ where: { id: franchiseId } });

  const reminder = await prisma.reminder.create({
    data: {
      franchiseId,
      date: date || new Date().toISOString().slice(0, 10),
      by: req.user.name,
    },
  });

  await logActivity(
    req.user,
    "send_reminder",
    `Marked reminder sent to "${franchise?.name || "franchise"}" for ₹${Number(due || 0).toLocaleString("en-IN")} due (${daysOverdue || 0}d overdue)`
  );
  res.status(201).json(reminder);
});

export default router;
