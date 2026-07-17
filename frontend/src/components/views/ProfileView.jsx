import { useState } from "react";
import { ShieldCheck, User } from "lucide-react";
import PageHeader from "../common/PageHeader";
import { validatePassword } from "@/lib/password";

export default function ProfileView({ currentUser, onChangePassword }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordErr("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordErr("Fill in all password fields.");
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setPasswordErr(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErr("New passwords do not match.");
      return;
    }

    setPasswordBusy(true);
    const err = await onChangePassword(currentPassword, newPassword);
    setPasswordBusy(false);

    if (err) {
      setPasswordErr(err);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  const joined = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div>
      <PageHeader
        title="Profile"
        subtitle="Your account details and security."
      />

      <div className="panel form-panel profile-panel">
        <h4 className="settings-section-title">Account</h4>
        <div className="profile-account">
          <div className="profile-avatar" aria-hidden>
            <User size={22} />
          </div>
          <div className="profile-details">
            <p className="profile-name">{currentUser?.name}</p>
            <p className="profile-meta">@{currentUser?.username}</p>
            <div className="profile-badges">
              <span className="profile-tag">{currentUser?.username}</span>
              <span className="profile-role-badge">
                <ShieldCheck size={14} />
                {currentUser?.role}
              </span>
              {joined && <span className="profile-tag profile-tag--muted">Joined {joined}</span>}
            </div>
          </div>
        </div>

        <h4 className="settings-section-title">Change password</h4>
        <p className="hint-text" style={{ marginTop: 0 }}>
          Update the password you use to sign in.
        </p>

        <form onSubmit={handlePasswordSubmit}>
          <label className="field-label">Current password</label>
          <input
            className="input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />

          <label className="field-label">New password</label>
          <input
            className="input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
          />
          <p className="hint-text">At least 8 characters with a letter and a number.</p>

          <label className="field-label">Confirm new password</label>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
          />

          {passwordErr && <div className="form-error">{passwordErr}</div>}

          <button type="submit" className="btn btn-primary" disabled={passwordBusy}>
            {passwordBusy ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
