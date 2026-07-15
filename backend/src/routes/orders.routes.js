import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth, requireAdmin } from "../middleware/auth.js";
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

router.patch("/:id", auth, requireAdmin, async (req, res) => {
  const { materials, amount, date, termDays, notes } = req.body;
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: "Enter a valid amount." });
  if (!date) return res.status(400).json({ error: "Dispatch date is required." });

  const existing = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { franchise: true },
  });
  if (!existing) return res.status(404).json({ error: "Delivery not found." });

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      materials: materials?.trim() ?? existing.materials,
      amount: Number(amount),
      date,
      termDays: Number(termDays ?? existing.termDays),
      notes: notes?.trim() ?? existing.notes,
    },
  });

  await logActivity(
    req.user,
    "edit_order",
    `Updated delivery for "${existing.franchise.name}" — ₹${Number(amount).toLocaleString("en-IN")} on ${date}`
  );
  res.json(order);
});

router.delete("/:id", auth, requireAdmin, async (req, res) => {
  const existing = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { franchise: true },
  });
  if (!existing) return res.status(404).json({ error: "Delivery not found." });

  await prisma.order.delete({ where: { id: req.params.id } });
  await logActivity(
    req.user,
    "delete_order",
    `Deleted delivery of ₹${Number(existing.amount).toLocaleString("en-IN")} from "${existing.franchise.name}" (${existing.date})`
  );
  res.json({ ok: true });
});

export default router;
