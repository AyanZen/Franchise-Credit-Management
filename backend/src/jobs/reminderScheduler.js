import prisma from "../lib/prisma.js";
import { logActivity } from "../utils/helpers.js";
import { getFranchisesWithOutstanding } from "../utils/franchiseBalance.js";
import { formatInr, isEmailConfigured, sendReminderEmail } from "../services/email.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

function daysSince(date) {
  if (!date) return Infinity;
  return (Date.now() - new Date(date).getTime()) / MS_PER_DAY;
}

async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { termDays: 15, graceDays: 5, reminderIntervalDays: 2, emailRemindersEnabled: true },
    });
  }
  return settings;
}

export async function runEmailReminders() {
  const settings = await getSettings();
  if (!settings.emailRemindersEnabled) {
    return { skipped: true, reason: "disabled" };
  }

  if (!isEmailConfigured()) {
    console.warn("[reminders] SMTP not configured — set SMTP_HOST and SMTP_FROM in .env");
    return { skipped: true, reason: "smtp_not_configured" };
  }

  const intervalDays = settings.reminderIntervalDays || 2;
  const candidates = await getFranchisesWithOutstanding();
  let sent = 0;

  for (const { franchise, totalDue, totalTaken, totalPaid } of candidates) {
    const elapsed = daysSince(franchise.lastEmailReminderAt);
    if (elapsed < intervalDays) continue;

    try {
      await sendReminderEmail({
        to: franchise.email,
        franchiseName: franchise.name,
        totalDue,
        totalTaken,
        totalPaid,
      });

      await prisma.franchise.update({
        where: { id: franchise.id },
        data: { lastEmailReminderAt: new Date() },
      });

      await logActivity(
        { name: "system", username: "system" },
        "email_reminder",
        `Sent payment reminder email to "${franchise.name}" (${franchise.email}) for ${formatInr(totalDue)} outstanding`
      );

      sent += 1;
      console.log(`[reminders] Email sent to ${franchise.name} <${franchise.email}> — ${formatInr(totalDue)} due`);
    } catch (err) {
      console.error(`[reminders] Failed for ${franchise.name}:`, err.message);
    }
  }

  return { sent, checked: candidates.length, intervalDays };
}

export function startReminderScheduler() {
  const tick = async () => {
    try {
      const result = await runEmailReminders();
      if (result.sent > 0) {
        console.log(`[reminders] Sent ${result.sent} email reminder(s)`);
      }
    } catch (err) {
      console.error("[reminders] Scheduler error:", err);
    }
  };

  setTimeout(tick, 15_000);
  setInterval(tick, CHECK_INTERVAL_MS);
  console.log("[reminders] Email scheduler started (checks hourly, sends every 2 days by default)");
}
