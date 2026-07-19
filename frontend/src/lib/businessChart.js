import { monthKey, monthLabel, todayStr } from "../utils/date";

export const CHART_PERIODS = ["weekly", "monthly", "yearly"];

function weekStartKey(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function bucketKey(dateStr, period) {
  if (!dateStr) return null;
  if (period === "yearly") return dateStr.slice(0, 4);
  if (period === "monthly") return monthKey(dateStr);
  return weekStartKey(dateStr);
}

function buildBucketKeys(period) {
  const today = new Date(`${todayStr()}T00:00:00`);

  if (period === "weekly") {
    const thisWeekStart = new Date(`${weekStartKey(todayStr())}T00:00:00`);
    return Array.from({ length: 12 }, (_, index) => {
      const d = new Date(thisWeekStart);
      d.setDate(d.getDate() - 7 * (11 - index));
      return d.toISOString().slice(0, 10);
    });
  }

  if (period === "monthly") {
    return Array.from({ length: 12 }, (_, index) => {
      const d = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }

  const currentYear = today.getFullYear();
  return Array.from({ length: 5 }, (_, index) => String(currentYear - 4 + index));
}

function bucketLabel(key, period) {
  if (period === "weekly") {
    const d = new Date(`${key}T00:00:00`);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }
  if (period === "monthly") return monthLabel(key);
  return key;
}

export function getBusinessChartData(orders = [], payments = [], period = "monthly") {
  const keys = buildBucketKeys(period);
  const map = Object.fromEntries(
    keys.map((key) => [
      key,
      { key, label: bucketLabel(key, period), dispatched: 0, received: 0 },
    ])
  );

  orders.forEach((order) => {
    const key = bucketKey(order.date, period);
    if (key && map[key]) {
      map[key].dispatched += Number(order.amount) || 0;
    }
  });

  payments.forEach((payment) => {
    const key = bucketKey(payment.date, period);
    if (key && map[key]) {
      map[key].received += Number(payment.amount) || 0;
    }
  });

  return keys.map((key) => map[key]);
}

export function getChartPeriodDescription(period) {
  if (period === "weekly") return "Last 12 weeks";
  if (period === "monthly") return "Last 12 months";
  return "Last 5 years";
}
