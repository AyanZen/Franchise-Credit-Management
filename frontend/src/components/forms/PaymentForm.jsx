import { useEffect, useState } from "react";
import { Banknote, CreditCard, FileText } from "lucide-react";
import { todayStr } from "@/utils/date";
import { fmtMoney, fmtDate } from "@/utils/format";
import { PAYMENT_METHODS } from "@/lib/payment";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Modal from "../common/Modal";

const METHOD_ICONS = {
  Cash: Banknote,
  Cheque: FileText,
  Online: CreditCard,
};

export default function PaymentForm({ franchise, order, initial, onClose, onSubmit }) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date || todayStr());
  const [method, setMethod] = useState(initial?.method || "Cash");
  const [reference, setReference] = useState(initial?.reference || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const balanceDue = order
    ? (order.due ?? 0) + (initial?.orderId === order.id ? Number(initial.amount) || 0 : 0)
    : (franchise?.totalDue ?? 0);

  useEffect(() => {
    if (!initial && balanceDue > 0) setAmount(String(balanceDue));
  }, [balanceDue, initial]);

  const paymentAmount = Number(amount) || 0;
  const balanceAfter = Math.max(balanceDue - paymentAmount, 0);
  const isOverpay = paymentAmount > balanceDue + 0.01;

  function handleMethodChange(next) {
    setMethod(next);
    setReference("");
    setErr("");
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!amount || Number(amount) <= 0) { setErr("Enter a valid amount."); return; }
    if (method === "Cheque" && !reference.trim()) { setErr("Cheque number is required."); return; }
    if (method === "Online" && !reference.trim()) { setErr("Transaction ID is required."); return; }
    if (order && paymentAmount > balanceDue + 0.01) {
      setErr("Amount exceeds this delivery's balance due.");
      return;
    }

    setBusy(true);
    try {
      await onSubmit({
        amount: Number(amount),
        date,
        method,
        reference: reference.trim(),
      });
    } catch (error) {
      setErr(error.message || "Failed to save payment.");
      setBusy(false);
    }
  }

  if (!initial && balanceDue <= 0) {
    return (
      <Modal title={order ? "Record delivery payment" : "Record payment received"} onClose={onClose}>
        <p className="text-sm text-muted-foreground py-4">
          {order
            ? "This delivery is fully paid."
            : "No outstanding balance. All deliveries are fully paid."}
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </Modal>
    );
  }

  const title = initial
    ? "Edit payment"
    : order
      ? "Record payment for delivery"
      : "Record account payment";

  return (
    <Modal title={title} onClose={onClose} wide>
      <form onSubmit={submit}>
        {order && (
          <div className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <p className="font-medium">{order.materials || "Materials dispatch"}</p>
            <p className="text-muted-foreground">
              Dispatched {fmtDate(order.date)} · Delivery amount {fmtMoney(order.amount)}
            </p>
          </div>
        )}

        <div className="mb-4 rounded-md bg-muted/60 px-3 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {order ? "Balance due on this delivery" : "Account balance due"}
            </span>
            <span className="font-mono font-medium">{fmtMoney(balanceDue)}</span>
          </div>
          {paymentAmount > 0 && (
            <div className="mt-1 flex justify-between border-t border-border/60 pt-1">
              <span className="text-muted-foreground">Balance after payment</span>
              <span className={`font-mono font-medium ${balanceAfter === 0 ? "text-emerald-600" : ""}`}>
                {fmtMoney(balanceAfter)}
              </span>
            </div>
          )}
        </div>

        <label className="field-label">Payment method *</label>
        <Tabs value={method} onValueChange={handleMethodChange}>
          <TabsList className="w-full">
            {PAYMENT_METHODS.map((m) => {
              const Icon = METHOD_ICONS[m];
              return (
                <TabsTrigger key={m} value={m} className="flex-1 gap-1.5">
                  <Icon className="size-3.5" /> {m}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="Cash" className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground">
              {order
                ? "Payment is recorded against this delivery."
                : "Payment reduces the combined franchise balance."}
            </p>
          </TabsContent>

          <TabsContent value="Cheque" className="space-y-3 pt-4">
            <label className="field-label">Cheque number *</label>
            <input
              className="input"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. 123456"
            />
          </TabsContent>

          <TabsContent value="Online" className="space-y-3 pt-4">
            <label className="field-label">Transaction ID *</label>
            <input
              className="input"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UTR / UPI ref / bank txn ID"
            />
          </TabsContent>
        </Tabs>

        <div className="input-pair mt-4">
          <div>
            <label className="field-label">Amount received *</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
            {!initial && balanceDue > 0 && (
              <button
                type="button"
                className="mt-1 text-xs text-primary hover:underline"
                onClick={() => setAmount(String(balanceDue))}
              >
                Use full {order ? "delivery" : "account"} balance ({fmtMoney(balanceDue)})
              </button>
            )}
          </div>
          <div>
            <label className="field-label">Date received</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {isOverpay && !order && (
          <p className="text-sm text-amber-600">
            Payment exceeds the outstanding balance. Extra amount will be recorded as credit.
          </p>
        )}
        {isOverpay && order && (
          <p className="text-sm text-amber-600">
            Amount exceeds this delivery&apos;s balance due.
          </p>
        )}

        {err && <div className="form-error">{err}</div>}

        <div className="modal-actions">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : initial ? "Save changes" : "Save payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
