import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";

const router = Router();

router.post("/", auth, async (req, res) => {
  const { name, contact, phone, email, address } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Franchise name is required." });

  const franchise = await prisma.franchise.create({
    data: {
      name: name.trim(),
      contact: contact?.trim() || "",
      phone: phone?.trim() || "",
      email: email?.trim() || "",
      address: address?.trim() || "",
      createdBy: req.user.name,
    },
  });

  await logActivity(req.user, "add_franchise", `Added franchise "${franchise.name}"`);
  res.status(201).json(franchise);
});

router.patch("/:id", auth, async (req, res) => {
  const { name, contact, phone, email, address } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Franchise name is required." });

  const franchise = await prisma.franchise.update({
    where: { id: req.params.id },
    data: {
      name: name.trim(),
      contact: contact?.trim() || "",
      phone: phone?.trim() || "",
      email: email?.trim() || "",
      address: address?.trim() || "",
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
