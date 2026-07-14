import { useState } from "react";
import { Search } from "lucide-react";
import EmptyState from "../common/EmptyState";
import PageHeader from "../common/PageHeader";

export default function ActivityLogView({ log, users }) {
  const [who, setWho] = useState("all");
  const [q, setQ] = useState("");
  const filtered = log.filter((a) => (who === "all" || a.username === who) && (a.details.toLowerCase().includes(q.toLowerCase()) || a.action.includes(q.toLowerCase())));
  return (
    <div>
      <PageHeader title="Activity Log" subtitle="Every action, by whom, and when." />
      <div className="search-row">
        <Search size={16} />
        <input className="search-input" placeholder="Search activity…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input select-inline" value={who} onChange={(e) => setWho(e.target.value)}>
          <option value="all">All employees</option>
          {users.map((u) => <option key={u.id} value={u.username}>{u.name}</option>)}
        </select>
      </div>
      <div className="panel">
        {filtered.length === 0 ? (
          <EmptyState text="No matching activity." />
        ) : (
          <table className="ledger">
            <thead><tr><th>When</th><th>Employee</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="cell-sub">{new Date(a.timestamp).toLocaleString("en-IN")}</td>
                  <td>{a.user}</td>
                  <td>{a.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
