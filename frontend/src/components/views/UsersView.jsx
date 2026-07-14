import { useState } from "react";
import { UserPlus, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmDeleteDialog from "../common/ConfirmDeleteDialog";
import PageHeader from "../common/PageHeader";

export default function UsersView({ users, currentUser, onAdd, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  function canDelete(user) {
    if (user.id === currentUser.id) return false;
    if (user.role === "admin") {
      const adminCount = users.filter((u) => u.role === "admin").length;
      return adminCount > 1;
    }
    return true;
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Everyone who can log in and manage franchises."
        action={<button className="btn btn-primary" onClick={onAdd}><UserPlus size={16} /> Add employee</button>}
      />
      <div className="panel">
        <table className="ledger">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td className="cell-sub">{u.username}</td>
                <td>
                  <span className={`role-pill ${u.role}`}>
                    {u.role === "admin" ? <ShieldCheck size={12} /> : null} {u.role}
                  </span>
                </td>
                <td className="text-right">
                  {canDelete(u) ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(u)}
                      title="Remove employee"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {u.id === currentUser.id ? "You" : "Protected"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="note-block">
        Admins can add or remove employees. You cannot delete yourself or the only admin account.
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Remove "${deleteTarget?.name}"?`}
        description={`This permanently removes the employee account "${deleteTarget?.username}". They will no longer be able to sign in.`}
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}
