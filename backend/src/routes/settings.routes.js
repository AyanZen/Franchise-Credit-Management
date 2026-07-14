import { Router } from "express";
import prisma from "../lib/prisma.js";
import { auth, requireAdmin } from "../middleware/auth.js";
import { logActivity } from "../utils/helpers.js";

const router = Router();

router.get("/", auth, async (req, res) => {
  let settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { termDays: 15, graceDays: 5, reminderIntervalDays: 2, emailRemindersEnabled: true },
    });
  }
  res.json(settings);
});

router.patch("/", auth, requireAdmin, async (req, res) => {
  const { termDays, graceDays, reminderIntervalDays, emailRemindersEnabled } = req.body;
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      termDays: Number(termDays),
      graceDays: Number(graceDays),
      reminderIntervalDays: Number(reminderIntervalDays ?? 2),
      emailRemindersEnabled: emailRemindersEnabled !== false,
    },
    create: {
      termDays: Number(termDays),
      graceDays: Number(graceDays),
      reminderIntervalDays: Number(reminderIntervalDays ?? 2),
      emailRemindersEnabled: emailRemindersEnabled !== false,
    },
  });

  await logActivity(
    req.user,
    "update_settings",
    `Updated payment term to ${settings.termDays}d, grace ${settings.graceDays}d, email reminders every ${settings.reminderIntervalDays}d`
  );
  res.json(settings);
});

export default router;
