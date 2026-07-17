import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";
import { normalizeBillPrefix, suggestBillPrefix, validateBillPrefix } from "../utils/billNo.js";
import { trimString } from "../utils/sanitize.js";

const router = Router();

router.post("/", auth, requireAdmin, async (req, res) => {
  const name = trimString(req.body?.name, 120);
  if (!name) return res.status(400).json({ error: "Franchise name is required." });

  const rawPrefix = req.body?.billPrefix?.trim() ? req.body.billPrefix : suggestBillPrefix(name);
  const prefixError = validateBillPrefix(rawPrefix);
  if (prefixError) return res.status(400).json({ error: prefixError });
  const billPrefix = normalizeBillPrefix(rawPrefix);

  const taken = await prisma.franchise.findFirst({ where: { billPrefix } });
  if (taken) return res.status(409).json({ error: `Bill prefix "${billPrefix}" is already used by another franchise.` });

  const franchise = await prisma.franchise.create({
    data: {
      name,
      billPrefix,
      contact: trimString(req.body?.contact, 120),
      phone: trimString(req.body?.phone, 40),
      email: trimString(req.body?.email, 120),
      address: trimString(req.body?.address, 500),
      createdBy: req.user.name,
    },
  });

  await logActivity(req.user, "add_franchise", `Added franchise "${franchise.name}" (bill prefix ${franchise.billPrefix})`);
  res.status(201).json(franchise);
});

router.patch("/:id", auth, requireAdmin, async (req, res) => {
  const name = trimString(req.body?.name, 120);
  if (!name) return res.status(400).json({ error: "Franchise name is required." });

  const existing = await prisma.franchise.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Franchise not found." });

  let billPrefix = existing.billPrefix;
  if (req.body?.billPrefix != null && String(req.body.billPrefix).trim()) {
    const prefixError = validateBillPrefix(req.body.billPrefix);
    if (prefixError) return res.status(400).json({ error: prefixError });
    billPrefix = normalizeBillPrefix(req.body.billPrefix);

    if (billPrefix !== existing.billPrefix) {
      const orderCount = await prisma.order.count({ where: { franchiseId: existing.id } });
      if (orderCount > 0) {
        return res.status(400).json({
          error: "Bill prefix cannot be changed after deliveries exist. It would break existing bill numbers.",
        });
      }
      const taken = await prisma.franchise.findFirst({
        where: { billPrefix, NOT: { id: existing.id } },
      });
      if (taken) return res.status(409).json({ error: `Bill prefix "${billPrefix}" is already used.` });
    }
  }

  const franchise = await prisma.franchise.update({
    where: { id: req.params.id },
    data: {
      name,
      billPrefix,
      contact: trimString(req.body?.contact, 120),
      phone: trimString(req.body?.phone, 40),
      email: trimString(req.body?.email, 120),
      address: trimString(req.body?.address, 500),
    },
  });

  await logActivity(req.user, "edit_franchise", `Updated details for "${franchise.name}"`);
  res.json(franchise);
});

router.delete("/:id", auth, requireAdmin, async (req, res) => {
  const franchise = await prisma.franchise.findUnique({ where: { id: req.params.id } });
  if (!franchise) return res.status(404).json({ error: "Franchise not found." });

  await prisma.franchise.delete({ where: { id: req.params.id } });
  await logActivity(req.user, "delete_franchise", `Deleted franchise "${franchise.name}" and all related records`);
  res.json({ ok: true });
});

export default router;
