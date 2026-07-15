import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";
import { buildPaymentNotes, validatePaymentInput } from "../utils/payment.js";

const router = Router();

router.post("/", auth, async (req, res) => {
  try {
    const { franchiseId, amount, date, method, reference } = req.body;

    if (!franchiseId) return res.status(400).json({ error: "Franchise is required." });

    const validationError = validatePaymentInput({ amount, method, reference });
    if (validationError) return res.status(400).json({ error: validationError });

    const franchise = await prisma.franchise.findUnique({ where: { id: franchiseId } });
    if (!franchise) return res.status(404).json({ error: "Franchise not found." });

    const ref = (reference || "").trim();
    const notes = buildPaymentNotes(method, ref);

    const payment = await prisma.payment.create({
      data: {
        franchiseId,
        amount: Number(amount),
        date: date || new Date().toISOString().slice(0, 10),
        method,
        reference: ref,
        notes,
        createdBy: req.user.name,
      },
    });

    await logActivity(
      req.user,
      "add_payment",
      `Logged ${method} payment of ₹${Number(amount).toLocaleString("en-IN")} from "${franchise.name}" — ${notes}`
    );
    res.status(201).json(payment);
  } catch (err) {
    console.error("[payments] create failed:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

router.patch("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const { amount, date, method, reference } = req.body;

    const validationError = validatePaymentInput({ amount, method, reference });
    if (validationError) return res.status(400).json({ error: validationError });

    const existing = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { franchise: true },
    });
    if (!existing) return res.status(404).json({ error: "Payment not found." });

    const ref = (reference || "").trim();
    const notes = buildPaymentNotes(method, ref);

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        amount: Number(amount),
        date: date || existing.date,
        method,
        reference: ref,
        notes,
      },
    });

    await logActivity(
      req.user,
      "edit_payment",
      `Updated ${method} payment of ₹${Number(amount).toLocaleString("en-IN")} from "${existing.franchise.name}" — ${notes}`
    );
    res.json(payment);
  } catch (err) {
    console.error("[payments] update failed:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { franchise: true },
    });
    if (!existing) return res.status(404).json({ error: "Payment not found." });

    await prisma.payment.delete({ where: { id: req.params.id } });
    await logActivity(
      req.user,
      "delete_payment",
      `Deleted ${existing.method} payment of ₹${Number(existing.amount).toLocaleString("en-IN")} from "${existing.franchise.name}" (${existing.date})`
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[payments] delete failed:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;
