import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";
import { buildPaymentNotes, validatePaymentInput } from "../utils/payment.js";
import { safeErrorMessage } from "../utils/errors.js";
import { normalizeBillNo } from "../utils/billNo.js";

const router = Router();

async function resolveOrderForPayment({ franchiseId, orderId, billNo }) {
  if (billNo) {
    const order = await prisma.order.findFirst({
      where: { franchiseId, billNo: normalizeBillNo(billNo) },
    });
    if (!order) {
      return {
        error: `Bill number "${normalizeBillNo(billNo)}" was not found for this franchise. Check for typos.`,
      };
    }
    if (orderId && order.id !== orderId) {
      return { error: "Bill number does not match the selected delivery." };
    }
    return { order };
  }

  if (orderId) {
    const order = await prisma.order.findFirst({ where: { id: orderId, franchiseId } });
    if (!order) return { error: "Delivery not found for this franchise." };
    return { order };
  }

  return { order: null };
}

router.post("/", auth, async (req, res) => {
  try {
    const { franchiseId, orderId, billNo, amount, date, method, reference } = req.body;

    if (!franchiseId) return res.status(400).json({ error: "Franchise is required." });

    const validationError = validatePaymentInput({ amount, method, reference });
    if (validationError) return res.status(400).json({ error: validationError });

    const franchise = await prisma.franchise.findUnique({ where: { id: franchiseId } });
    if (!franchise) return res.status(404).json({ error: "Franchise not found." });

    const requiresBill = Boolean(billNo || orderId);
    if (requiresBill && !billNo && !orderId) {
      return res.status(400).json({ error: "Bill number is required to link this payment to a delivery." });
    }

    const resolved = await resolveOrderForPayment({ franchiseId, orderId, billNo });
    if (resolved.error) return res.status(404).json({ error: resolved.error });

    const order = resolved.order;

    if (order) {
      const paidOnOrder = await prisma.payment.aggregate({
        where: { orderId: order.id },
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
        orderId: order?.id || null,
        amount: Number(amount),
        date: date || new Date().toISOString().slice(0, 10),
        method,
        reference: ref,
        notes,
        createdBy: req.user.name,
      },
    });

    const deliveryNote = order
      ? ` for bill ${order.billNo} (₹${Number(order.amount).toLocaleString("en-IN")})`
      : "";

    await logActivity(
      req.user,
      "add_payment",
      `Logged ${method} payment of ₹${Number(amount).toLocaleString("en-IN")} from "${franchise.name}"${deliveryNote} — ${notes}`
    );
    res.status(201).json(payment);
  } catch (err) {
    console.error("[payments] create failed:", err);
    res.status(500).json({ error: safeErrorMessage(err) });
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
    res.status(500).json({ error: safeErrorMessage(err) });
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
    res.status(500).json({ error: safeErrorMessage(err) });
  }
});

export default router;
