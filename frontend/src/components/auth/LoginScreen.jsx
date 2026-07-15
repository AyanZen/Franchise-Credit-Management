import { LogIn } from "lucide-react";
import { useState } from "react";

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const error = await onLogin(username.trim(), password);
    setBusy(false);
    if (error) setErr(error);
  }

  return (
    <div className="login-wrap">
      <div className="login-hero">
        <h1>Track every franchise,<br />every payment.</h1>
        <p>Material dispatch, payment terms, and overdue alerts — all in one simple ledger.</p>
      </div>

      <div className="login-card">
        <div className="login-brand">
          <div className="login-mark">DL</div>
          <div>
            <div className="login-title">Dispatch Ledger</div>
            <div className="login-sub">Sign in to your account</div>
          </div>
        </div>
        <form onSubmit={submit}>
          <label className="field-label">Username</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" autoFocus />
          <label className="field-label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" />
          {err && <div className="form-error">{err}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Signing in…" : (<><LogIn size={16} /> Sign in</>)}
          </button>
        </form>
      </div>

      <p className="login-trust">Built for franchise material &amp; payment management</p>
    </div>
  );
}
