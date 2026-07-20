import { useEffect, useRef, useState } from "react";
import { Banknote, CreditCard, FileText } from "lucide-react";
import { todayStr } from "@/utils/date";
import { fmtMoney, fmtDate } from "@/utils/format";
import { PAYMENT_METHODS } from "@/lib/payment";
import { normalizeBillNo } from "@/lib/billNo";
import { ordersApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Modal from "../common/Modal";

const METHOD_ICONS = {
  Cash: Banknote,
  Cheque: FileText,
  Online: CreditCard,
};

export default function PaymentForm({
  franchise,
  order,
  accountOnly = false,
  initial,
  onClose,
  onSubmit,
  onError,
}) {
  const [billNo, setBillNo] = useState(initial ? "" : (order?.billNo || ""));
  const [resolvedOrder, setResolvedOrder] = useState(order || null);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date || todayStr());
  const [method, setMethod] = useState(initial?.method || "Cash");
  const [reference, setReference] = useState(initial?.reference || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [billChecking, setBillChecking] = useState(false);
  const billValidateSeq = useRef(0);

  const activeOrder = resolvedOrder || order;
  const showBillField = !initial;

  const balanceDue = activeOrder
    ? (activeOrder.due ?? 0) + (initial?.orderId === activeOrder.id ? Number(initial.amount) || 0 : 0)
    : (franchise?.totalDue ?? 0);

  useEffect(() => {
    if (!initial && balanceDue > 0 && activeOrder) setAmount(String(balanceDue));
  }, [balanceDue, initial, activeOrder?.id]);

  useEffect(() => {
    if (order?.billNo) {
      setBillNo(order.billNo);
      setResolvedOrder(order);
    }
  }, [order]);

  const paymentAmount = Number(amount) || 0;
  const balanceAfter = Math.max(balanceDue - paymentAmount, 0);
  const isOverpay = paymentAmount > balanceDue + 0.01;
  const billLocked = Boolean(order?.billNo);

  async function validateBillNo(value = billNo) {
    const normalized = normalizeBillNo(value);
    if (!normalized) {
      setResolvedOrder(null);
      return { ok: false, message: accountOnly ? "Enter a bill ID." : "Enter a bill number." };
    }

    const seq = ++billValidateSeq.current;
    setBillChecking(true);
    try {
      const { order: found } = await ordersApi.lookup(franchise.id, normalized);
      if (seq !== billValidateSeq.current) return { ok: false, stale: true };

      setResolvedOrder(found);
      setErr("");
      if (!initial && found.due != null && found.due > 0) {
        setAmount(String(found.due));
      }
      return { ok: true, order: found };
    } catch (error) {
      if (seq !== billValidateSeq.current) return { ok: false, stale: true };

      setResolvedOrder(null);
      return { ok: false, message: error.message };
    } finally {
      if (seq === billValidateSeq.current) {
        setBillChecking(false);
      }
    }
  }

  async function handleBillBlur() {
    if (!showBillField || billLocked || !billNo.trim()) return;
    const result = await validateBillNo();
    if (result.stale) return;
    if (!result.ok) {
      setErr(result.message);
      onError?.(result.message);
      return;
    }
    setErr("");
  }

  function handleMethodChange(next) {
    setMethod(next);
    setReference("");
    setErr("");
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (showBillField) {
      const normalized = normalizeBillNo(billNo);
      if (!normalized) {
        const msg = "Bill ID is required.";
        setErr(msg);
        onError?.(msg);
        return;
      }

      let targetOrder = activeOrder;
      if (!targetOrder || normalizeBillNo(targetOrder.billNo) !== normalized) {
        const result = await validateBillNo(normalized);
        if (result.stale) return;
        if (!result.ok) {
          setErr(result.message);
          onError?.(result.message);
          return;
        }
        targetOrder = result.order;
      }

      if ((targetOrder.due ?? 0) <= 0) {
        const msg = `Bill ${normalized} is already fully paid.`;
        setErr(msg);
        onError?.(msg);
        return;
      }

      if (paymentAmount > (targetOrder.due ?? 0) + 0.01) {
        const msg = "Amount exceeds this delivery's balance due.";
        setErr(msg);
        onError?.(msg);
        return;
      }
    } else if (activeOrder && paymentAmount > balanceDue + 0.01) {
      const msg = "Amount exceeds this delivery's balance due.";
      setErr(msg);
      onError?.(msg);
      return;
    }

    if (!amount || Number(amount) <= 0) { setErr("Enter a valid amount."); return; }
    if (method === "Cheque" && !reference.trim()) { setErr("Cheque number is required."); return; }
    if (method === "Online" && !reference.trim()) { setErr("Transaction ID is required."); return; }

    setBusy(true);
    try {
      await onSubmit({
        amount: Number(amount),
        date,
        method,
        reference: reference.trim(),
        billNo: showBillField ? normalizeBillNo(billNo) : undefined,
      });
    } catch (error) {
      const msg = error.message || "Failed to save payment.";
      setErr(msg);
      onError?.(msg);
      setBusy(false);
    }
  }

  if (!initial && !accountOnly && balanceDue <= 0 && activeOrder) {
    return (
      <Modal title="Record payment for delivery" onClose={onClose}>
        <p className="text-sm text-muted-foreground py-4">This delivery is fully paid.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </Modal>
    );
  }

  if (!initial && accountOnly && (franchise?.totalDue ?? 0) <= 0) {
    return (
      <Modal title="Record account payment" onClose={onClose}>
        <p className="text-sm text-muted-foreground py-4">No outstanding balance.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </Modal>
    );
  }

  const title = initial
    ? "Edit payment"
    : accountOnly
      ? "Record account payment"
      : "Record payment received";

  return (
    <Modal title={title} onClose={onClose} wide>
      <form onSubmit={submit}>
        {showBillField && (
          <div className="mb-4">
            <label className="field-label">{accountOnly ? "Bill ID *" : "Bill number *"}</label>
            <input
              className="input font-mono uppercase"
              value={billNo}
              onChange={(e) => {
                billValidateSeq.current += 1;
                setBillNo(e.target.value.toUpperCase());
                setErr("");
                if (!billLocked) setResolvedOrder(null);
              }}
              onBlur={handleBillBlur}
              placeholder="Enter bill number"
              readOnly={billLocked}
              autoFocus={!billLocked}
            />
            {billChecking && (
              <p className="hint-text mt-1">Checking bill ID…</p>
            )}
            {activeOrder && !billChecking && (
              <p className="hint-text mt-1">
                {activeOrder.materials || "Materials dispatch"} · {fmtDate(activeOrder.date)} · {fmtMoney(activeOrder.amount)}
                {activeOrder.due != null && activeOrder.due > 0 && (
                  <> · Balance due {fmtMoney(activeOrder.due)}</>
                )}
              </p>
            )}
          </div>
        )}

        {activeOrder && !showBillField && (
          <div className="mb-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <p className="font-medium">{activeOrder.materials || "Materials dispatch"}</p>
            <p className="text-muted-foreground">
              Bill <span className="font-mono">{activeOrder.billNo}</span> · {fmtDate(activeOrder.date)} · {fmtMoney(activeOrder.amount)}
            </p>
          </div>
        )}

        <div className="mb-4 rounded-md bg-muted/60 px-3 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {activeOrder ? "Balance due on this bill" : "Account balance due"}
            </span>
            <span className="font-mono font-medium">{fmtMoney(balanceDue)}</span>
          </div>
          {paymentAmount > 0 && (
            <div className="mt-1 flex justify-between border-t border-border/60 pt-1">
              <span className="text-muted-foreground">Balance after payment</span>
              <span className={`font-mono font-medium ${balanceAfter === 0 ? "text-[var(--ok)]" : ""}`}>
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
              {activeOrder
                ? "Payment is recorded against this bill."
                : accountOnly
                  ? "Enter a bill ID above to link this payment to a delivery."
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
            {!initial && balanceDue > 0 && activeOrder && (
              <button
                type="button"
                className="mt-1 text-xs text-primary hover:underline"
                onClick={() => setAmount(String(balanceDue))}
              >
                Use full bill balance ({fmtMoney(balanceDue)})
              </button>
            )}
          </div>
          <div>
            <label className="field-label">Date received</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {isOverpay && !activeOrder && (
          <p className="text-sm text-[var(--gold)]">
            Payment exceeds the outstanding balance. Extra amount will be recorded as credit.
          </p>
        )}
        {isOverpay && activeOrder && (
          <p className="text-sm text-[var(--gold)]">
            Amount exceeds this bill&apos;s balance due.
          </p>
        )}

        {err && <div className="form-error">{err}</div>}

        <div className="modal-actions">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy || billChecking}>
            {busy ? "Saving…" : initial ? "Save changes" : "Save payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
