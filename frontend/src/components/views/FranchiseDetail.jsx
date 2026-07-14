import { useState } from "react";
import {
  Plus, ChevronDown, AlertTriangle, Send, ArrowLeft, MapPin,
} from "lucide-react";
import { fmtDate, fmtMoney } from "../../utils/format";
import EmptyState from "../common/EmptyState";
import PageHeader from "../common/PageHeader";
import Stamp from "../common/Stamp";
import StatCard from "../common/StatCard";

export default function FranchiseDetail({
  franchise, orders, onBack, onEdit, onAddOrder, onAddPayment, onSendReminder,
  lastReminderFor, reminderCountFor,
}) {
  const [openOrderId, setOpenOrderId] = useState(orders[0]?.id || null);

  return (
    <div>
      <button className="link-btn back-link" onClick={onBack}><ArrowLeft size={15} /> Franchises</button>
      <PageHeader
        title={franchise.name}
        subtitle={[franchise.contact, franchise.phone, franchise.email].filter(Boolean).join("  ·  ") || "No contact details on file"}
        action={
          <div className="row-gap">
            <button className="btn btn-ghost" onClick={onEdit}>Edit details</button>
            <button className="btn btn-primary" onClick={onAddOrder}><Plus size={16} /> New delivery</button>
          </div>
        }
      />

      <div className="card-grid">
        <StatCard label="Total taken" value={fmtMoney(franchise.totalTaken)} tone="ink" />
        <StatCard label="Total paid" value={fmtMoney(franchise.totalPaid)} tone="ink" />
        <StatCard label="Total due" value={fmtMoney(franchise.totalDue)} tone={franchise.totalDue > 0 ? "warn" : "ok"} />
        <StatCard label="Standing" value={<Stamp status={franchise.status} />} tone="ink" />
      </div>

      {franchise.address && (
        <div className="panel address-panel"><MapPin size={14} /> {franchise.address}</div>
      )}

      <div className="panel">
        <div className="panel-head"><h3>Deliveries &amp; payments</h3></div>
        {orders.length === 0 ? (
          <EmptyState text="No deliveries recorded yet." />
        ) : (
          <div className="order-list">
            {orders.map((o) => {
              const open = openOrderId === o.id;
              const last = lastReminderFor(o.id);
              const remCount = reminderCountFor(o.id);
              return (
                <div key={o.id} className={`order-card status-${o.status}`}>
                  <div className="order-row" onClick={() => setOpenOrderId(open ? null : o.id)}>
                    <ChevronDown size={16} className={`chev ${open ? "open" : ""}`} />
                    <div className="cell-title">{o.materials || "Materials dispatch"}</div>
                    <div className="cell-sub">Dispatched {fmtDate(o.date)} · Due {fmtDate(o.dueDate)}</div>
                    <div className="num">{fmtMoney(o.amount)}</div>
                    <div className="num muted">Paid {fmtMoney(o.totalPaid)}</div>
                    <div className="num strong">{fmtMoney(o.due)} due</div>
                    <Stamp status={o.status} />
                  </div>
                  {open && (
                    <div className="order-expand">
                      {o.notes && <div className="order-note">Note: {o.notes}</div>}
                      {(o.status === "overdue" || o.status === "critical") && (
                        <div className="reminder-strip">
                          <AlertTriangle size={14} />
                          <span>{o.daysOverdue} day{o.daysOverdue === 1 ? "" : "s"} past the due date.</span>
                          {last && <span className="muted"> Last reminded {fmtDate(last.date)} by {last.by} ({remCount} total).</span>}
                          <button className="btn btn-warn btn-sm" onClick={() => onSendReminder(o)}>
                            <Send size={13} /> Mark reminder sent
                          </button>
                        </div>
                      )}
                      <div className="payments-head">
                        <span>Payments against this delivery</span>
                        {o.due > 0 && (
                          <button className="btn btn-primary btn-sm" onClick={() => onAddPayment(o.id)}>
                            <Plus size={13} /> Add payment
                          </button>
                        )}
                      </div>
                      {o.payments.length === 0 ? (
                        <div className="cell-sub" style={{ padding: "4px 0 2px" }}>No payments received yet.</div>
                      ) : (
                        <table className="ledger payments-table">
                          <tbody>
                            {o.payments.map((p) => (
                              <tr key={p.id}>
                                <td className="cell-sub">{fmtDate(p.date)}</td>
                                <td className="cell-sub">{p.method}</td>
                                <td className="num">{fmtMoney(p.amount)}</td>
                                <td className="cell-sub">{p.notes}</td>
                                <td className="cell-sub">{p.createdBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
