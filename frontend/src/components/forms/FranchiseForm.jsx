import { useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import Modal from "../common/Modal";

export default function FranchiseForm({ initial, onClose, onSubmit }) {
  const [name, setName] = useState(initial?.name || "");
  const [contact, setContact] = useState(initial?.contact || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setErr("Franchise name is required."); return; }
    onSubmit({ name: name.trim(), contact: contact.trim(), phone: phone.trim(), email: email.trim(), address: address.trim() });
  }

  return (
    <Modal title={initial ? "Edit franchise" : "Add franchise"} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field-label">Franchise name *</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <label className="field-label">Contact person</label>
        <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} />
        <div className="input-pair">
          <div>
            <label className="field-label"><Phone size={12} /> Phone</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="field-label"><Mail size={12} /> Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <label className="field-label"><MapPin size={12} /> Address</label>
        <textarea className="input textarea" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
        {err && <div className="form-error">{err}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">{initial ? "Save changes" : "Add franchise"}</button>
        </div>
      </form>
    </Modal>
  );
}
