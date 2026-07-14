import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth } from "../middleware/auth.js";
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

export default router;
