import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";

const router = Router();

router.post("/", auth, async (req, res) => {
  const { franchiseId, materials, amount, date, termDays, notes } = req.body;
  if (!franchiseId) return res.status(400).json({ error: "Franchise is required." });
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: "Enter a valid amount." });
  if (!date) return res.status(400).json({ error: "Dispatch date is required." });

  const franchise = await prisma.franchise.findUnique({ where: { id: franchiseId } });
  if (!franchise) return res.status(404).json({ error: "Franchise not found." });

  const order = await prisma.order.create({
    data: {
      franchiseId,
      materials: materials?.trim() || "",
      amount: Number(amount),
      date,
      termDays: Number(termDays),
      notes: notes?.trim() || "",
      createdBy: req.user.name,
    },
  });

  await logActivity(
    req.user,
    "add_order",
    `Recorded dispatch of ₹${Number(amount).toLocaleString("en-IN")} to "${franchise.name}" on ${date}`
  );
  res.status(201).json(order);
});

export default router;
