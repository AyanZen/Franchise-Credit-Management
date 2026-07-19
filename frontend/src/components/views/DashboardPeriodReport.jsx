import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { buildDashboardReport, exportDashboardReport, getAvailableMonths } from "@/lib/dashboardReport";
import { currentMonthKey, monthLabel } from "@/utils/date";
import { fmtMoney } from "@/utils/format";
import EmptyState from "../common/EmptyState";
import StatCard from "../common/StatCard";

export default function DashboardPeriodReport({ orders, payments, franchises }) {
  const availableMonths = useMemo(
    () => getAvailableMonths(orders, payments),
    [orders, payments]
  );

  const [allMonths, setAllMonths] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState([]);

  useEffect(() => {
    if (availableMonths.length === 0) {
      setSelectedMonths([]);
      return;
    }
    setSelectedMonths((current) => {
      if (current.length > 0) {
        return current.filter((month) => availableMonths.includes(month));
      }
      const preferred = availableMonths.includes(currentMonthKey())
        ? currentMonthKey()
        : availableMonths[0];
      return [preferred];
    });
  }, [availableMonths]);

  const report = useMemo(
    () => buildDashboardReport({ orders, payments, franchises, allMonths, selectedMonths }),
    [orders, payments, franchises, allMonths, selectedMonths]
  );

  function toggleMonth(month) {
    setAllMonths(false);
    setSelectedMonths((current) => {
      if (current.includes(month)) {
        const next = current.filter((item) => item !== month);
        return next.length > 0 ? next : [month];
      }
      return [...current, month].sort((a, b) => b.localeCompare(a));
    });
  }

  function selectAllMonthsMode() {
    setAllMonths(true);
  }

  function selectCustomMonthsMode() {
    setAllMonths(false);
    if (selectedMonths.length === 0 && availableMonths.length > 0) {
      setSelectedMonths([availableMonths.includes(currentMonthKey()) ? currentMonthKey() : availableMonths[0]]);
    }
  }

  const hasData = availableMonths.length > 0;

  return (
    <div className="panel dashboard-period">
      <div className="panel-head dashboard-period-head">
        <div>
          <h3>Month-wise report</h3>
          <p className="dashboard-period-sub">
            {report.periodLabel}
            {!allMonths && selectedMonths.length > 1 ? ` · ${selectedMonths.length} months selected` : ""}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm dashboard-export-btn"
          onClick={() => exportDashboardReport(report)}
          disabled={!hasData}
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {!hasData ? (
        <EmptyState text="No deliveries or payments yet. Record activity to build month-wise reports." />
      ) : (
        <>
          <div className="dashboard-period-controls">
            <div className="segmented-control" role="tablist" aria-label="Report period">
              <button
                type="button"
                className={`segmented-control-btn${allMonths ? " is-active" : ""}`}
                onClick={selectAllMonthsMode}
              >
                All months total
              </button>
              <button
                type="button"
                className={`segmented-control-btn${!allMonths ? " is-active" : ""}`}
                onClick={selectCustomMonthsMode}
              >
                Choose months
              </button>
            </div>

            {!allMonths && (
              <div className="month-chip-grid">
                {availableMonths.map((month) => {
                  const active = selectedMonths.includes(month);
                  return (
                    <button
                      key={month}
                      type="button"
                      className={`month-chip${active ? " is-active" : ""}`}
                      onClick={() => toggleMonth(month)}
                    >
                      {monthLabel(month)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card-grid card-grid--compact">
            <StatCard label="Dispatched" value={fmtMoney(report.summary.dispatched)} tone="ink" />
            <StatCard label="Received" value={fmtMoney(report.summary.received)} tone="ink" />
            <StatCard label="Deliveries" value={report.summary.deliveryCount} tone="ink" />
            <StatCard label="Payments" value={report.summary.paymentCount} tone="ink" />
          </div>

          <div className="dashboard-period-tables">
            {(allMonths || selectedMonths.length > 1) && (
              <div className="dashboard-period-table-wrap">
                <h4>By month</h4>
                <table className="ledger ledger--desktop">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="num">Dispatched</th>
                      <th className="num">Received</th>
                      <th className="num">Deliveries</th>
                      <th className="num">Payments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byMonth.map((row) => (
                      <tr key={row.month}>
                        <td>{row.label}</td>
                        <td className="num">{fmtMoney(row.dispatched)}</td>
                        <td className="num">{fmtMoney(row.received)}</td>
                        <td className="num">{row.deliveryCount}</td>
                        <td className="num">{row.paymentCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mobile-card-list mobile-card-list--compact">
                  {report.byMonth.map((row) => (
                    <article key={row.month} className="mobile-card mobile-card--flat">
                      <div className="mobile-card-head">
                        <div className="cell-title">{row.label}</div>
                      </div>
                      <div className="mobile-card-stats mobile-card-stats--2">
                        <div className="mobile-stat">
                          <span className="mobile-stat-label">Dispatched</span>
                          <span className="mobile-stat-value">{fmtMoney(row.dispatched)}</span>
                        </div>
                        <div className="mobile-stat">
                          <span className="mobile-stat-label">Received</span>
                          <span className="mobile-stat-value">{fmtMoney(row.received)}</span>
                        </div>
                        <div className="mobile-stat">
                          <span className="mobile-stat-label">Deliveries</span>
                          <span className="mobile-stat-value">{row.deliveryCount}</span>
                        </div>
                        <div className="mobile-stat">
                          <span className="mobile-stat-label">Payments</span>
                          <span className="mobile-stat-value">{row.paymentCount}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div className="dashboard-period-table-wrap">
              <h4>By franchise</h4>
              {report.byFranchise.length === 0 ? (
                <EmptyState text="No franchise activity in this period." />
              ) : (
                <>
                  <table className="ledger ledger--desktop">
                    <thead>
                      <tr>
                        <th>Franchise</th>
                        <th className="num">Dispatched</th>
                        <th className="num">Received</th>
                        <th className="num">Deliveries</th>
                        <th className="num">Payments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.byFranchise.map((row) => (
                        <tr key={row.franchiseId}>
                          <td>{row.franchiseName}</td>
                          <td className="num">{fmtMoney(row.dispatched)}</td>
                          <td className="num">{fmtMoney(row.received)}</td>
                          <td className="num">{row.deliveryCount}</td>
                          <td className="num">{row.paymentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mobile-card-list mobile-card-list--compact">
                    {report.byFranchise.map((row) => (
                      <article key={row.franchiseId} className="mobile-card mobile-card--flat">
                        <div className="mobile-card-head">
                          <div className="cell-title">{row.franchiseName}</div>
                        </div>
                        <div className="mobile-card-stats mobile-card-stats--2">
                          <div className="mobile-stat">
                            <span className="mobile-stat-label">Dispatched</span>
                            <span className="mobile-stat-value">{fmtMoney(row.dispatched)}</span>
                          </div>
                          <div className="mobile-stat">
                            <span className="mobile-stat-label">Received</span>
                            <span className="mobile-stat-value">{fmtMoney(row.received)}</span>
                          </div>
                          <div className="mobile-stat">
                            <span className="mobile-stat-label">Deliveries</span>
                            <span className="mobile-stat-value">{row.deliveryCount}</span>
                          </div>
                          <div className="mobile-stat">
                            <span className="mobile-stat-label">Payments</span>
                            <span className="mobile-stat-value">{row.paymentCount}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
