import { addDays, todayStr, daysBetween } from "../utils/date";

export function computeOrderStatus(order, paymentsForOrder, settings) {
  const totalPaid = paymentsForOrder.reduce((s, p) => s + Number(p.amount), 0);
  const due = Math.max(Number(order.amount) - totalPaid, 0);
  const termDays = order.termDays ?? settings.termDays;
  const graceDays = settings.graceDays;
  const dueDate = addDays(order.date, termDays);
  const criticalDate = addDays(dueDate, graceDays);
  const today = todayStr();

  let status = "paid";
  let daysOverdue = 0;
  if (due > 0.5) {
    if (today <= dueDate) status = "pending";
    else if (today <= criticalDate) status = "overdue";
    else status = "critical";
    if (today > dueDate) daysOverdue = daysBetween(dueDate, today);
  }
  return { totalPaid, due, status, daysOverdue, dueDate };
}
