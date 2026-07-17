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

  if (filtered.length === 0) {
    return (
      <div>
        <PageHeader
          title="Franchises"
          subtitle={`${franchises.length} franchise${franchises.length === 1 ? "" : "s"} on record`}
          action={isAdmin ? <button className="btn btn-primary page-head-action" onClick={onAdd}><Plus size={16} /> Add franchise</button> : null}
        />
        <div className="search-row">
          <Search size={16} />
          <input className="search-input" placeholder="Search by name or contact…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="panel">
          <EmptyState text={franchises.length === 0 ? "No franchises yet. Add your first one." : "No matches."} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Franchises"
        subtitle={`${franchises.length} franchise${franchises.length === 1 ? "" : "s"} on record`}
        action={isAdmin ? <button className="btn btn-primary page-head-action" onClick={onAdd}><Plus size={16} /> Add franchise</button> : null}
      />
      <div className="search-row">
        <Search size={16} />
        <input className="search-input" placeholder="Search by name or contact…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Desktop table */}
      <div className="panel hidden md:block">
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
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-5 md:hidden">
        {filtered.map((f) => (
          <article
            key={f.id}
            className="clickable rounded-2xl border border-border bg-card p-5 shadow-sm"
            onClick={() => onOpen(f.id)}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="cell-title text-base">{f.name}</div>
                <div className="cell-sub mt-1">{f.contact || "—"}</div>
              </div>
              <Stamp status={f.status} />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Taken</span>
                <span className="font-mono text-sm font-medium">{fmtMoney(f.totalTaken)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Paid</span>
                <span className="font-mono text-sm font-medium text-[var(--ok)]">{fmtMoney(f.totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Due</span>
                <span className="font-mono text-sm font-semibold">{fmtMoney(f.totalDue)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
              {isAdmin ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(f);
                  }}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              ) : (
                <span />
              )}
              <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                View details <ChevronRight size={14} />
              </span>
            </div>
          </article>
        ))}
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
