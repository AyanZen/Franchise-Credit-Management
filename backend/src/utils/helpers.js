import prisma from "../lib/prisma.js";

export async function logActivity(user, action, details) {
  await prisma.activityLog.create({
    data: {
      user: user?.name || "system",
      username: user?.username || "system",
      action,
      details,
    },
  });
}

export async function fetchBootstrap(role) {
  const [franchises, orders, payments, reminders, activityLog, settings, users] = await Promise.all([
    prisma.franchise.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.payment.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.reminder.findMany(),
    prisma.activityLog.findMany({ orderBy: { timestamp: "desc" }, take: 2000 }),
    prisma.settings.findUnique({ where: { id: 1 } }),
    role === "admin" ? prisma.user.findMany({ orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
  ]);

  return {
    franchises,
    orders,
    payments,
    reminders,
    activityLog: activityLog.map((a) => ({
      ...a,
      timestamp: a.timestamp.toISOString(),
    })),
    settings: settings || { termDays: 15, graceDays: 5 },
    users: users.map(({ password, ...u }) => u),
  };
}
