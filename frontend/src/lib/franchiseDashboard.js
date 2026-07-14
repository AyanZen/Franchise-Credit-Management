import { STATUS_LABEL } from "@/constants/orderStatus";

export function statusBadgeVariant(status) {
  if (status === "paid") return "secondary";
  if (status === "pending") return "outline";
  if (status === "overdue") return "default";
  if (status === "critical") return "destructive";
  return "outline";
}

export function getFranchiseStats(franchise, orders, payments) {
  const paidPercent = franchise.totalTaken > 0
    ? Math.round((franchise.totalPaid / franchise.totalTaken) * 100)
    : 0;

  return {
    paidPercent,
    overdueCount: franchise.status === "overdue" || franchise.status === "critical" ? 1 : 0,
    pendingCount: franchise.status === "pending" ? 1 : 0,
    paidCount: franchise.status === "paid" ? 1 : 0,
    isOverdue: franchise.status === "overdue" || franchise.status === "critical",
    allPayments: [...payments].sort((a, b) => (a.date < b.date ? 1 : -1)),
    deliveryCount: orders.length,
  };
}

export function getChartData(orders, payments) {
  const byMonth = {};

  orders.forEach((o) => {
    const month = o.date?.slice(0, 7) || "unknown";
    if (!byMonth[month]) byMonth[month] = { month, dispatched: 0, paid: 0 };
    byMonth[month].dispatched += Number(o.amount) || 0;
  });

  payments.forEach((p) => {
    const month = p.date?.slice(0, 7) || "unknown";
    if (!byMonth[month]) byMonth[month] = { month, dispatched: 0, paid: 0 };
    byMonth[month].paid += Number(p.amount) || 0;
  });

  return Object.values(byMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)
    .map((row) => ({
      ...row,
      label: row.month,
    }));
}

export function getFranchiseActivity(activityLog, franchiseName) {
  if (!franchiseName) return [];
  return activityLog.filter((a) =>
    a.details?.toLowerCase().includes(franchiseName.toLowerCase())
  ).slice(0, 12);
}

export { STATUS_LABEL };
