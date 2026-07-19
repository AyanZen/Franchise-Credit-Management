import { fmtMoney } from "../../utils/format";
import PageHeader from "../common/PageHeader";
import StatCard from "../common/StatCard";
import DashboardBusinessChart from "./DashboardBusinessChart";
import DashboardPeriodReport from "./DashboardPeriodReport";

export default function Dashboard({ totals, orders, payments, franchises, onOpenCritical }) {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Where every franchise stands, right now." />
      <div className="card-grid card-grid--dashboard">
        <StatCard label="Total payments" value={fmtMoney(totals.totalDispatched)} tone="ink" />
        <StatCard label="Received payment" value={fmtMoney(totals.totalReceived)} tone="ink" />
        <StatCard label="Outstanding" value={fmtMoney(totals.totalOutstanding)} tone="ink" />
        <StatCard label="Franchises" value={totals.franchiseCount} tone="ink" />
        <StatCard
          label="Critical"
          value={totals.criticalCount}
          tone="danger"
          onClick={totals.criticalCount > 0 ? onOpenCritical : undefined}
        />
      </div>

      <DashboardBusinessChart orders={orders} payments={payments} />

      <DashboardPeriodReport orders={orders} payments={payments} franchises={franchises} />
    </div>
  );
}
