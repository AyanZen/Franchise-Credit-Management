import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";
import { formatBillNo, normalizeBillNo, parseBillSequence, suggestBillPrefix, billNoMatchesPrefix } from "../utils/billNo.js";
import { trimString } from "../utils/sanitize.js";
import { safeErrorMessage } from "../utils/errors.js";

const router = Router();

router.get("/lookup", auth, async (req, res) => {
  try {
    const franchiseId = req.query.franchiseId;
    const billNo = normalizeBillNo(req.query.billNo);

    if (!franchiseId || !billNo) {
      return res.status(400).json({ error: "Franchise and bill number are required." });
    }

    const order = await prisma.order.findFirst({
      where: { franchiseId, billNo },
      include: { franchise: { select: { name: true, billPrefix: true } } },
    });

    if (!order) {
      return res.status(404).json({
        error: `Bill number "${billNo}" was not found for this franchise. Check for typos.`,
      });
    }

    const paidOnOrder = await prisma.payment.aggregate({
      where: { orderId: order.id },
      _sum: { amount: true },
    });
    const totalPaid = paidOnOrder._sum.amount || 0;
    const due = Math.max(Number(order.amount) - totalPaid, 0);

    res.json({ order: { ...order, totalPaid, due } });
  } catch (err) {
    console.error("[orders] lookup failed:", err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.get("/check", auth, async (req, res) => {
  try {
    const franchiseId = req.query.franchiseId;
    const billNo = normalizeBillNo(req.query.billNo);

    if (!franchiseId || !billNo) {
      return res.status(400).json({ error: "Franchise and bill number are required." });
    }

    const franchise = await prisma.franchise.findUnique({ where: { id: franchiseId } });
    if (!franchise) return res.status(404).json({ error: "Franchise not found." });

    const prefix = franchise.billPrefix || suggestBillPrefix(franchise.name);
    if (!billNoMatchesPrefix(billNo, prefix)) {
      return res.status(400).json({
        valid: false,
        error: `Bill number must start with this franchise's prefix "${prefix}" (e.g. ${formatBillNo(prefix, franchise.nextBillSeq)}).`,
      });
    }

    const existing = await prisma.order.findFirst({ where: { franchiseId, billNo } });
    if (existing) {
      return res.status(409).json({
        valid: false,
        exists: true,
        error: `Bill number "${billNo}" already exists for this franchise.`,
      });
    }

    res.json({ valid: true, available: true, billNo, prefix });
  } catch (err) {
    console.error("[orders] check failed:", err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const { franchiseId, materials, amount, date, termDays, notes, billNo: rawBillNo } = req.body;
    if (!franchiseId) return res.status(400).json({ error: "Franchise is required." });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: "Enter a valid amount." });
    if (!date) return res.status(400).json({ error: "Dispatch date is required." });

    const order = await prisma.$transaction(async (tx) => {
      let franchise = await tx.franchise.findUnique({ where: { id: franchiseId } });
      if (!franchise) throw Object.assign(new Error("Franchise not found."), { status: 404 });

      if (!franchise.billPrefix) {
        const prefix = suggestBillPrefix(franchise.name);
        franchise = await tx.franchise.update({
          where: { id: franchiseId },
          data: { billPrefix: prefix },
        });
      }

      const prefix = franchise.billPrefix;
      const autoBillNo = formatBillNo(prefix, franchise.nextBillSeq);
      const billNo = rawBillNo ? normalizeBillNo(rawBillNo) : autoBillNo;

      if (!billNoMatchesPrefix(billNo, prefix)) {
        throw Object.assign(
          new Error(`Bill number must use prefix "${prefix}" (e.g. ${autoBillNo}).`),
          { status: 400 }
        );
      }

      const duplicate = await tx.order.findFirst({ where: { franchiseId, billNo } });
      if (duplicate) {
        throw Object.assign(
          new Error(`Bill number "${billNo}" already exists for this franchise.`),
          { status: 409 }
        );
      }

      const created = await tx.order.create({
        data: {
          franchiseId,
          billNo,
          materials: trimString(materials, 500),
          amount: Number(amount),
          date,
          termDays: Number(termDays),
          notes: trimString(notes, 1000),
          createdBy: req.user.name,
        },
      });

      const usedSeq = parseBillSequence(billNo, prefix) || franchise.nextBillSeq;
      await tx.franchise.update({
        where: { id: franchiseId },
        data: { nextBillSeq: Math.max(franchise.nextBillSeq, usedSeq + 1) },
      });

      return { created, franchise };
    });

    await logActivity(
      req.user,
      "add_order",
      `Recorded dispatch ${order.created.billNo} of ₹${Number(amount).toLocaleString("en-IN")} to "${order.franchise.name}" on ${date}`
    );
    res.status(201).json(order.created);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("[orders] create failed:", err);
    res.status(500).json({ error: safeErrorMessage(err) });
  }
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
      materials: trimString(materials, 500) || existing.materials,
      amount: Number(amount),
      date,
      termDays: Number(termDays ?? existing.termDays),
      notes: trimString(notes, 1000) ?? existing.notes,
    },
  });

  await logActivity(
    req.user,
    "edit_order",
    `Updated delivery ${existing.billNo} for "${existing.franchise.name}" — ₹${Number(amount).toLocaleString("en-IN")} on ${date}`
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
    `Deleted delivery ${existing.billNo} of ₹${Number(existing.amount).toLocaleString("en-IN")} from "${existing.franchise.name}" (${existing.date})`
  );
  res.json({ ok: true });
});

export default router;
