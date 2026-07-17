import { useEffect, useMemo, useRef, useState } from "react";
import { todayStr } from "../../utils/date";
import { formatBillNoPreview, normalizeBillNo, suggestBillPrefix } from "@/lib/billNo";
import { ordersApi } from "@/services/api";
import Modal from "../common/Modal";

export default function OrderForm({ settings, franchise, initial, onClose, onSubmit, onError }) {
  const [materials, setMaterials] = useState(initial?.materials || "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial?.date || todayStr());
  const [termDays, setTermDays] = useState(initial?.termDays ?? settings.termDays);
  const [notes, setNotes] = useState(initial?.notes || "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [billChecking, setBillChecking] = useState(false);
  const [billValid, setBillValid] = useState(false);
  const billValidateSeq = useRef(0);

  const billPrefix = useMemo(
    () => franchise?.billPrefix || suggestBillPrefix(franchise?.name || ""),
    [franchise]
  );

  const defaultBillNo = useMemo(
    () => formatBillNoPreview(billPrefix, franchise?.nextBillSeq ?? 1),
    [billPrefix, franchise?.nextBillSeq]
  );

  const [billNo, setBillNo] = useState(initial?.billNo || defaultBillNo);

  useEffect(() => {
    if (!initial && defaultBillNo) {
      setBillNo(defaultBillNo);
      setBillValid(false);
    }
  }, [defaultBillNo, initial]);

  async function validateBillNo(value = billNo) {
    const normalized = normalizeBillNo(value);
    if (!normalized) {
      setBillValid(false);
      return { ok: false, message: "Bill number is required." };
    }

    if (!franchise?.id) {
      return { ok: false, message: "Franchise not loaded." };
    }

    setBillChecking(true);
    const seq = ++billValidateSeq.current;
    try {
      await ordersApi.check(franchise.id, normalized);
      if (seq !== billValidateSeq.current) return { ok: false, stale: true };

      setBillValid(true);
      setErr("");
      return { ok: true };
    } catch (error) {
      if (seq !== billValidateSeq.current) return { ok: false, stale: true };

      setBillValid(false);
      return { ok: false, message: error.message };
    } finally {
      if (seq === billValidateSeq.current) {
        setBillChecking(false);
      }
    }
  }

  async function handleBillBlur() {
    if (initial) return;
    const result = await validateBillNo();
    if (result.stale) return;
    if (!result.ok) {
      setErr(result.message);
      onError?.(result.message);
      return;
    }
    setErr("");
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!initial) {
      const billResult = await validateBillNo();
      if (billResult.stale) return;
      if (!billResult.ok) {
        setErr(billResult.message);
        onError?.(billResult.message);
        return;
      }
    }

    if (!amount || Number(amount) <= 0) { setErr("Enter a valid amount."); return; }
    if (!date) { setErr("Dispatch date is required."); return; }

    setBusy(true);
    try {
      await onSubmit({
        materials: materials.trim(),
        amount: Number(amount),
        date,
        termDays: Number(termDays),
        notes: notes.trim(),
        billNo: initial ? undefined : normalizeBillNo(billNo),
      });
    } catch (error) {
      const msg = error.message || "Failed to save delivery.";
      setErr(msg);
      onError?.(msg);
      setBusy(false);
    }
  }

  return (
    <Modal title={initial ? "Edit delivery" : "Record new delivery"} onClose={onClose}>
      <form onSubmit={submit}>
        {franchise?.name && !initial && (
          <p className="hint-text" style={{ marginTop: 0, marginBottom: 12 }}>
            Franchise: <strong>{franchise.name}</strong> · Bill prefix <span className="font-mono">{billPrefix}</span>
          </p>
        )}

        <label className="field-label">Bill number *</label>
        <input
          className="input font-mono uppercase"
          value={billNo}
          onChange={(e) => {
            billValidateSeq.current += 1;
            setBillNo(e.target.value.toUpperCase().replace(/\s+/g, ""));
            setBillValid(false);
            setErr("");
          }}
          onBlur={handleBillBlur}
          placeholder={defaultBillNo || `${billPrefix}01`}
          readOnly={Boolean(initial?.billNo)}
          autoFocus={!initial}
        />
        {!initial && (
          <p className="hint-text" style={{ marginTop: 6 }}>
            {billChecking && "Checking bill number…"}
            {!billChecking && billValid && (
              <span className="text-[var(--ok)]">Bill number is available.</span>
            )}
            {!billChecking && !billValid && (
              <>Auto-suggested next number is <span className="font-mono font-medium">{defaultBillNo}</span>. Must use prefix {billPrefix}.</>
            )}
          </p>
        )}

        <label className="field-label">Materials / description</label>
        <input className="input" value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="e.g. Tiles, adhesive, fittings" />
        <div className="input-pair">
          <div>
            <label className="field-label">Amount *</label>
            <input className="input" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Dispatch date *</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <label className="field-label">Payment term (days)</label>
        <input className="input" type="number" min="0" value={termDays} onChange={(e) => setTermDays(e.target.value)} />
        <label className="field-label">Notes</label>
        <textarea className="input textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional" />
        {err && <div className="form-error">{err}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || billChecking}>
            {busy ? "Saving…" : initial ? "Save changes" : "Save delivery"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
