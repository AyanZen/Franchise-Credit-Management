import { useState } from "react";
import { todayStr } from "../../utils/date";
import Modal from "../common/Modal";

export default function OrderForm({ settings, onClose, onSubmit }) {
  const [materials, setMaterials] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [termDays, setTermDays] = useState(settings.termDays);
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { setErr("Enter a valid amount."); return; }
    if (!date) { setErr("Dispatch date is required."); return; }
    onSubmit({ materials: materials.trim(), amount: Number(amount), date, termDays: Number(termDays), notes: notes.trim() });
  }

  return (
    <Modal title="Record new delivery" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field-label">Materials / description</label>
        <input className="input" value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="e.g. Tiles, adhesive, fittings" autoFocus />
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
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Save delivery</button>
        </div>
      </form>
    </Modal>
  );
}
