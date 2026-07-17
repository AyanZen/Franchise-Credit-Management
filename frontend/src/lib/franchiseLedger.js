import { addDays, todayStr, daysBetween } from "../utils/date";
import { computeOrderStatus } from "./orderStatus";

function statusFromDueAndDates(due, orderDate, settings, termDaysOverride) {
  const termDays = termDaysOverride ?? settings.termDays;
  const graceDays = settings.graceDays;
  const dueDate = addDays(orderDate, termDays);
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
  return { status, daysOverdue, dueDate };
}

const STATUS_RANK = { paid: 0, pending: 1, overdue: 2, critical: 3 };

/**
 * Franchise running account: all deliveries add up, all payments reduce one balance.
 * FIFO allocation used only to determine overdue status (oldest unpaid portion).
 */
export function computeFranchiseLedger(orders, payments, settings) {
  const sortedOrders = [...orders].sort((a, b) => a.date.localeCompare(b.date));
  const totalTaken = sortedOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalDue = Math.max(totalTaken - totalPaid, 0);

  let paidPool = totalPaid;
  let worstRank = 0;
  let daysOverdue = 0;
  let statusDueDate = null;

  for (const order of sortedOrders) {
    const orderAmount = Number(order.amount) || 0;
    const allocated = Math.min(paidPool, orderAmount);
    paidPool -= allocated;
    const orderDue = Math.max(orderAmount - allocated, 0);

    if (orderDue > 0.5) {
      const { status, daysOverdue: d, dueDate } = statusFromDueAndDates(
        orderDue,
        order.date,
        settings,
        order.termDays
      );
      const rank = STATUS_RANK[status] ?? 0;
      if (rank > worstRank) {
        worstRank = rank;
        daysOverdue = d;
        statusDueDate = dueDate;
      } else if (rank === worstRank && d > daysOverdue) {
        daysOverdue = d;
        statusDueDate = dueDate;
      }
    }
  }

  const status = Object.keys(STATUS_RANK).find((k) => STATUS_RANK[k] === worstRank) || "paid";

  return { totalTaken, totalPaid, totalDue, status, daysOverdue, dueDate: statusDueDate };
}

export function enrichOrders(orders, settings) {
  return orders.map((o) => ({
    ...o,
    dueDate: addDays(o.date, o.termDays ?? settings.termDays),
  }));
}

/** Attach per-delivery payments, paid amount, balance due, and status. */
export function enrichOrdersWithPayments(orders, payments, settings) {
  return enrichOrders(orders, settings).map((order) => {
    const orderPayments = payments
      .filter((p) => p.orderId === order.id)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    const { totalPaid, due, status, daysOverdue } = computeOrderStatus(order, orderPayments, settings);
    return {
      ...order,
      payments: orderPayments,
      totalPaid,
      due,
      status,
      daysOverdue,
    };
  });
}

export function orderLabel(order) {
  if (!order) return "Account payment";
  const bill = order.billNo ? `${order.billNo} · ` : "";
  const name = order.materials?.trim() || "Materials dispatch";
  return `${bill}${name} (${order.date})`;
}
