import { useState } from "react";
import { Plus, Search, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/utils/format";
import ConfirmDeleteDialog from "../common/ConfirmDeleteDialog";
import EmptyState from "../common/EmptyState";
import PageHeader from "../common/PageHeader";
import Stamp from "../common/Stamp";

export default function FranchisesList({
  franchises, search, setSearch, onAdd, onOpen, isAdmin, onDelete,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = franchises.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    (f.contact || "").toLowerCase().includes(search.toLowerCase())
  );

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      /* toast handled in hook */
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Franchises"
        subtitle={`${franchises.length} franchise${franchises.length === 1 ? "" : "s"} on record`}
        action={isAdmin ? <button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> Add franchise</button> : null}
      />
      <div className="search-row">
        <Search size={16} />
        <input className="search-input" placeholder="Search by name or contact…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="panel">
        {filtered.length === 0 ? (
          <EmptyState text={franchises.length === 0 ? "No franchises yet. Add your first one." : "No matches."} />
        ) : (
          <table className="ledger">
            <thead>
              <tr>
                <th>Franchise</th>
                <th className="num">Taken</th>
                <th className="num">Paid</th>
                <th className="num">Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="clickable" onClick={() => onOpen(f.id)}>
                  <td>
                    <div className="cell-title">{f.name}</div>
                    <div className="cell-sub">{f.contact || "—"}</div>
                  </td>
                  <td className="num">{fmtMoney(f.totalTaken)}</td>
                  <td className="num">{fmtMoney(f.totalPaid)}</td>
                  <td className="num strong">{fmtMoney(f.totalDue)}</td>
                  <td><Stamp status={f.status} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(f);
                          }}
                          title="Delete franchise"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                      <ChevronRight size={16} className="chev" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This permanently removes the franchise and all its deliveries, payments, and reminders. This cannot be undone."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
