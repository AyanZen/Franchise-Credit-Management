import { monthKey, monthLabel } from "../utils/date";
import { downloadCsv, csvLine } from "../utils/exportCsv";

export function getAvailableMonths(orders = [], payments = []) {
  const keys = new Set();
  orders.forEach((o) => {
    const key = monthKey(o.date);
    if (key) keys.add(key);
  });
  payments.forEach((p) => {
    const key = monthKey(p.date);
    if (key) keys.add(key);
  });
  return [...keys].sort((a, b) => b.localeCompare(a));
}

function inSelectedPeriod(dateStr, allMonths, selectedMonths) {
  const key = monthKey(dateStr);
  if (!key) return false;
  if (allMonths) return true;
  return selectedMonths.includes(key);
}

export function buildDashboardReport({ orders = [], payments = [], franchises = [], allMonths, selectedMonths = [] }) {
  const filteredOrders = orders.filter((o) => inSelectedPeriod(o.date, allMonths, selectedMonths));
  const filteredPayments = payments.filter((p) => inSelectedPeriod(p.date, allMonths, selectedMonths));

  const summary = {
    dispatched: filteredOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0),
    received: filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    deliveryCount: filteredOrders.length,
    paymentCount: filteredPayments.length,
  };

  const monthKeys = allMonths
    ? getAvailableMonths(orders, payments)
    : [...selectedMonths].sort((a, b) => b.localeCompare(a));

  const byMonth = monthKeys.map((key) => {
    const monthOrders = orders.filter((o) => monthKey(o.date) === key);
    const monthPayments = payments.filter((p) => monthKey(p.date) === key);
    return {
      month: key,
      label: monthLabel(key),
      dispatched: monthOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0),
      received: monthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      deliveryCount: monthOrders.length,
      paymentCount: monthPayments.length,
    };
  });

  const franchiseNameById = Object.fromEntries(franchises.map((f) => [f.id, f.name]));

  const byFranchise = franchises
    .map((f) => {
      const franchiseOrders = filteredOrders.filter((o) => o.franchiseId === f.id);
      const franchisePayments = filteredPayments.filter((p) => p.franchiseId === f.id);
      return {
        franchiseId: f.id,
        franchiseName: franchiseNameById[f.id] || f.name,
        dispatched: franchiseOrders.reduce((sum, o) => sum + Number(o.amount || 0), 0),
        received: franchisePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
        deliveryCount: franchiseOrders.length,
        paymentCount: franchisePayments.length,
      };
    })
    .filter((row) => row.deliveryCount > 0 || row.paymentCount > 0)
    .sort((a, b) => b.dispatched - a.dispatched || a.franchiseName.localeCompare(b.franchiseName));

  const periodLabel = allMonths
    ? "All months"
    : selectedMonths.length === 1
      ? monthLabel(selectedMonths[0])
      : selectedMonths.map(monthLabel).join(", ");

  return { summary, byMonth, byFranchise, periodLabel, allMonths, selectedMonths };
}

export function exportDashboardReport(report) {
  const { summary, byMonth, byFranchise, periodLabel } = report;
  const stamp = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const fileStamp = new Date().toISOString().slice(0, 10);
  const slug = report.allMonths
    ? "all-months"
    : report.selectedMonths.join("-") || "custom";

  const lines = [
    csvLine(["Dispatch Ledger Dashboard Export"]),
    csvLine(["Generated", stamp]),
    csvLine(["Period", periodLabel]),
    "",
    csvLine(["SUMMARY"]),
    csvLine(["Metric", "Value"]),
    csvLine(["Total Dispatched (INR)", summary.dispatched]),
    csvLine(["Total Received (INR)", summary.received]),
    csvLine(["Deliveries", summary.deliveryCount]),
    csvLine(["Payments", summary.paymentCount]),
    "",
    csvLine(["BY MONTH"]),
    csvLine(["Month", "Dispatched (INR)", "Received (INR)", "Deliveries", "Payments"]),
    ...byMonth.map((row) =>
      csvLine([row.label, row.dispatched, row.received, row.deliveryCount, row.paymentCount])
    ),
    "",
    csvLine(["BY FRANCHISE"]),
    csvLine(["Franchise", "Dispatched (INR)", "Received (INR)", "Deliveries", "Payments"]),
    ...byFranchise.map((row) =>
      csvLine([row.franchiseName, row.dispatched, row.received, row.deliveryCount, row.paymentCount])
    ),
  ];

  downloadCsv(`dashboard-${slug}-${fileStamp}.csv`, lines.join("\r\n"));
}
