import prisma from "../lib/prisma.js";

export async function getFranchiseOutstanding(franchiseId) {
  const [orders, payments] = await Promise.all([
    prisma.order.findMany({ where: { franchiseId } }),
    prisma.payment.findMany({ where: { franchiseId } }),
  ]);

  const totalTaken = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalDue = Math.max(totalTaken - totalPaid, 0);

  return { totalDue, totalTaken, totalPaid, orderCount: orders.length };
}

export async function getFranchisesWithOutstanding() {
  const franchises = await prisma.franchise.findMany({
    where: { email: { not: "" } },
    orderBy: { name: "asc" },
  });

  const results = [];
  for (const franchise of franchises) {
    const balance = await getFranchiseOutstanding(franchise.id);
    if (balance.totalDue > 0.5) {
      results.push({ franchise, ...balance });
    }
  }
  return results;
}
