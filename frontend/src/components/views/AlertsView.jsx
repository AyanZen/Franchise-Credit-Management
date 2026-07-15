import { Send } from "lucide-react";
import { fmtDate, fmtMoney } from "../../utils/format";
import EmptyState from "../common/EmptyState";
import PageHeader from "../common/PageHeader";
import Stamp from "../common/Stamp";

export default function AlertsView({ alertFranchises, onOpenFranchise, onSendReminder, lastReminderFor }) {
  return (
    <div>
      <PageHeader title="Alerts" subtitle="Franchises past their payment term, worst first." />
      <div className="panel">
        {alertFranchises.length === 0 ? (
          <EmptyState text="Nothing to flag. All franchises are within terms." />
        ) : (
          <>
            <table className="ledger ledger--desktop">
              <thead>
                <tr>
                  <th>Franchise</th>
                  <th className="num">Outstanding</th>
                  <th className="num">Days late</th>
                  <th>Last reminder</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {alertFranchises.map((f) => {
                  const last = lastReminderFor(f.id);
                  return (
                    <tr key={f.id}>
                      <td className="clickable" onClick={() => onOpenFranchise(f.id)}>
                        <div className="cell-title">{f.name}</div>
                        <div className="cell-sub">{f.orderCount} deliveries</div>
                      </td>
                      <td className="num strong">{fmtMoney(f.totalDue)}</td>
                      <td className="num">{f.daysOverdue}d</td>
                      <td className="cell-sub">{last ? `${fmtDate(last.date)} · ${last.by}` : "Never"}</td>
                      <td><Stamp status={f.status} /></td>
                      <td><button className="btn btn-warn btn-sm" onClick={() => onSendReminder(f)}><Send size={13} /> Remind</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mobile-card-list">
              {alertFranchises.map((f) => {
                const last = lastReminderFor(f.id);
                return (
                  <article key={f.id} className="mobile-card">
                    <div
                      className="mobile-card-head clickable"
                      onClick={() => onOpenFranchise(f.id)}
                    >
                      <div>
                        <div className="cell-title">{f.name}</div>
                        <div className="cell-sub">{f.orderCount} deliveries</div>
                      </div>
                      <Stamp status={f.status} />
                    </div>
                    <div className="mobile-card-stats">
                      <div className="mobile-stat">
                        <span className="mobile-stat-label">Outstanding</span>
                        <span className="mobile-stat-value strong">{fmtMoney(f.totalDue)}</span>
                      </div>
                      <div className="mobile-stat">
                        <span className="mobile-stat-label">Days late</span>
                        <span className="mobile-stat-value">{f.daysOverdue}d</span>
                      </div>
                      <div className="mobile-stat mobile-stat--wide">
                        <span className="mobile-stat-label">Last reminder</span>
                        <span className="mobile-stat-value cell-sub">
                          {last ? `${fmtDate(last.date)} · ${last.by}` : "Never"}
                        </span>
                      </div>
                    </div>
                    <div className="mobile-card-foot">
                      <button className="btn btn-warn btn-sm" onClick={() => onSendReminder(f)}>
                        <Send size={13} /> Remind
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
