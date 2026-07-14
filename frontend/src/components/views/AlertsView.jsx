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
          <table className="ledger">
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
        )}
      </div>
    </div>
  );
}
