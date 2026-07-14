import { useState } from "react";
import Modal from "../common/Modal";

export default function UserForm({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [err, setErr] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password) { setErr("All fields are required."); return; }
    onSubmit({ name: name.trim(), username: username.trim(), password, role });
  }

  return (
    <Modal title="Add employee" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field-label">Full name *</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <label className="field-label">Username *</label>
        <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
        <label className="field-label">Password *</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="field-label">Role</label>
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        {err && <div className="form-error">{err}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary">Add employee</button>
        </div>
      </form>
    </Modal>
  );
}
