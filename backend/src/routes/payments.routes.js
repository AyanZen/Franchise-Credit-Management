import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";
import { buildPaymentNotes, validatePaymentInput } from "../utils/payment.js";

const router = Router();

router.post("/", auth, async (req, res) => {
  try {
    const { franchiseId, orderId, amount, date, method, reference } = req.body;

    if (!franchiseId) return res.status(400).json({ error: "Franchise is required." });

    const validationError = validatePaymentInput({ amount, method, reference });
    if (validationError) return res.status(400).json({ error: validationError });

    const franchise = await prisma.franchise.findUnique({ where: { id: franchiseId } });
    if (!franchise) return res.status(404).json({ error: "Franchise not found." });

    let order = null;
    if (orderId) {
      order = await prisma.order.findFirst({ where: { id: orderId, franchiseId } });
      if (!order) return res.status(404).json({ error: "Delivery not found for this franchise." });

      const paidOnOrder = await prisma.payment.aggregate({
        where: { orderId },
        _sum: { amount: true },
      });
      const orderDue = Math.max(Number(order.amount) - (paidOnOrder._sum.amount || 0), 0);
      if (Number(amount) > orderDue + 0.01) {
        return res.status(400).json({
          error: `Payment exceeds this delivery's balance due (₹${orderDue.toLocaleString("en-IN")}).`,
        });
      }
    }

    const ref = (reference || "").trim();
    const notes = buildPaymentNotes(method, ref);

    const payment = await prisma.payment.create({
      data: {
        franchiseId,
        orderId: orderId || null,
        amount: Number(amount),
        date: date || new Date().toISOString().slice(0, 10),
        method,
        reference: ref,
        notes,
        createdBy: req.user.name,
      },
    });

    const deliveryNote = order
      ? ` for delivery on ${order.date} (₹${Number(order.amount).toLocaleString("en-IN")})`
      : "";

    await logActivity(
      req.user,
      "add_payment",
      `Logged ${method} payment of ₹${Number(amount).toLocaleString("en-IN")} from "${franchise.name}"${deliveryNote} — ${notes}`
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

    if (existing.orderId) {
      const order = await prisma.order.findFirst({
        where: { id: existing.orderId, franchiseId: existing.franchiseId },
      });
      if (!order) return res.status(404).json({ error: "Linked delivery not found." });

      const paidOnOrder = await prisma.payment.aggregate({
        where: { orderId: existing.orderId },
        _sum: { amount: true },
      });
      const otherPaid = (paidOnOrder._sum.amount || 0) - Number(existing.amount);
      const orderDue = Math.max(Number(order.amount) - otherPaid, 0);
      if (Number(amount) > orderDue + 0.01) {
        return res.status(400).json({
          error: `Payment exceeds this delivery's balance due (₹${orderDue.toLocaleString("en-IN")}).`,
        });
      }
    }

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
