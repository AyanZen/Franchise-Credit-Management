import { fmtDate, fmtMoney } from "../../utils/format";
import EmptyState from "../common/EmptyState";
import PageHeader from "../common/PageHeader";
import Stamp from "../common/Stamp";
import StatCard from "../common/StatCard";

export default function Dashboard({ totals, alertFranchises, activityLog, onOpenFranchise, onGoAlerts }) {
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Where every franchise stands, right now." />
      <div className="card-grid">
        <StatCard label="Outstanding" value={fmtMoney(totals.totalOutstanding)} tone="ink" />
        <StatCard label="Franchises" value={totals.franchiseCount} tone="ink" />
        <StatCard label="Overdue" value={totals.overdueCount} tone="warn" />
        <StatCard label="Critical" value={totals.criticalCount} tone="danger" />
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <h3>Needs attention</h3>
            {alertFranchises.length > 0 && <button className="link-btn" onClick={onGoAlerts}>View all →</button>}
          </div>
          {alertFranchises.length === 0 ? (
            <EmptyState text="Nothing overdue. Every franchise is within terms." />
          ) : (
            <table className="ledger">
              <tbody>
                {alertFranchises.slice(0, 6).map((f) => (
                  <tr key={f.id} onClick={() => onOpenFranchise(f.id)} className="clickable">
                    <td>
                      <div className="cell-title">{f.name}</div>
                      <div className="cell-sub">{f.orderCount} deliveries</div>
                    </td>
                    <td className="num">{fmtMoney(f.totalDue)}</td>
                    <td className="num muted">{f.daysOverdue}d late</td>
                    <td><Stamp status={f.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Recent activity</h3></div>
          {activityLog.length === 0 ? (
            <EmptyState text="No activity logged yet." />
          ) : (
            <ul className="activity-feed">
              {activityLog.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <span className="act-user">{a.user}</span>
                  <span className="act-detail">{a.details}</span>
                  <span className="act-time">{new Date(a.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
