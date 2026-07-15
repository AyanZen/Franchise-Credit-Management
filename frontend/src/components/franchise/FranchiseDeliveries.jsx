import { useState } from "react";
import { Plus, IndianRupee, AlertTriangle, Send, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import ConfirmDeleteDialog from "@/components/common/ConfirmDeleteDialog";
import { fmtDate, fmtMoney } from "@/utils/format";
import { formatPaymentReference } from "@/lib/payment";

export default function FranchiseDeliveries({
  franchise,
  orders,
  payments,
  isAdmin,
  onAddOrder,
  onAddPayment,
  onEditOrder,
  onDeleteOrder,
  onEditPayment,
  onDeletePayment,
  onSendReminder,
  lastReminderFor,
  reminderCountFor,
}) {
  const [deleteOrderTarget, setDeleteOrderTarget] = useState(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const last = lastReminderFor(franchise.id);
  const remCount = reminderCountFor(franchise.id);
  const isOverdue = franchise.status === "overdue" || franchise.status === "critical";

  async function confirmDeleteOrder() {
    if (!deleteOrderTarget) return;
    setDeleting(true);
    try {
      await onDeleteOrder(deleteOrderTarget.id);
      setDeleteOrderTarget(null);
    } catch {
      /* toast in hook */
    } finally {
      setDeleting(false);
    }
  }

  async function confirmDeletePayment() {
    if (!deletePaymentTarget) return;
    setDeleting(true);
    try {
      await onDeletePayment(deletePaymentTarget.id);
      setDeletePaymentTarget(null);
    } catch {
      /* toast in hook */
    } finally {
      setDeleting(false);
    }
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-muted-foreground">No deliveries recorded yet.</p>
          <Button onClick={onAddOrder}>
            <Plus /> Record first delivery
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Deliveries &amp; payments</CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onAddPayment}
            disabled={franchise.totalDue <= 0}
          >
            <IndianRupee /> Record payment
          </Button>
          <Button size="sm" onClick={onAddOrder}>
            <Plus /> New delivery
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Total taken</p>
            <p className="font-mono text-lg font-medium">{fmtMoney(franchise.totalTaken)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total paid</p>
            <p className="font-mono text-lg font-medium text-emerald-600">{fmtMoney(franchise.totalPaid)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance due</p>
            <p className={`font-mono text-lg font-semibold ${franchise.totalDue > 0 ? "text-amber-600" : ""}`}>
              {fmtMoney(franchise.totalDue)}
            </p>
          </div>
        </div>

        {isOverdue && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="size-4" />
            <span>{franchise.daysOverdue}d past due · {fmtMoney(franchise.totalDue)} outstanding</span>
            {last && (
              <span className="text-muted-foreground">
                · Last reminded {fmtDate(last.date)} ({remCount} total)
              </span>
            )}
            <Button size="sm" variant="outline" onClick={() => onSendReminder(franchise)}>
              <Send /> Remind
            </Button>
          </div>
        )}

        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Delivery history
          </h4>
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{o.materials || "Materials dispatch"}</p>
                  <p className="text-xs text-muted-foreground">
                    Dispatched {fmtDate(o.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-medium">{fmtMoney(o.amount)}</p>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onEditOrder(o)}
                        title="Edit delivery"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteOrderTarget(o)}
                        title="Delete delivery"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Payments received
          </h4>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments received yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>By</TableHead>
                  {isAdmin && <TableHead className="w-20" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{fmtDate(p.date)}</TableCell>
                    <TableCell>{p.method}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatPaymentReference(p)}
                    </TableCell>
                    <TableCell className="text-right font-mono">{fmtMoney(p.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.createdBy}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => onEditPayment(p)}
                            title="Edit payment"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletePaymentTarget(p)}
                            title="Delete payment"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>

      <ConfirmDeleteDialog
        open={!!deleteOrderTarget}
        onOpenChange={(open) => !open && setDeleteOrderTarget(null)}
        title="Delete this delivery?"
        description={`This removes the delivery of ${fmtMoney(deleteOrderTarget?.amount || 0)} from ${fmtDate(deleteOrderTarget?.date || "")}. This cannot be undone.`}
        onConfirm={confirmDeleteOrder}
        loading={deleting}
      />

      <ConfirmDeleteDialog
        open={!!deletePaymentTarget}
        onOpenChange={(open) => !open && setDeletePaymentTarget(null)}
        title="Delete this payment?"
        description={`This removes the ${deletePaymentTarget?.method || ""} payment of ${fmtMoney(deletePaymentTarget?.amount || 0)} from ${fmtDate(deletePaymentTarget?.date || "")}. This cannot be undone.`}
        onConfirm={confirmDeletePayment}
        loading={deleting}
      />
    </Card>
  );
}
