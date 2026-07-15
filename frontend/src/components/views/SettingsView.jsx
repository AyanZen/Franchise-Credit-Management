import { useState } from "react";
import PageHeader from "../common/PageHeader";

export default function SettingsView({ settings, isAdmin, currentUser, onSave, onChangePassword }) {
  const [termDays, setTermDays] = useState(settings.termDays);
  const [graceDays, setGraceDays] = useState(settings.graceDays);
  const [reminderIntervalDays, setReminderIntervalDays] = useState(settings.reminderIntervalDays ?? 2);
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(
    settings.emailRemindersEnabled !== false
  );

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
    if (newPassword.length < 6) {
      setPasswordErr("New password must be at least 6 characters.");
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

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle={isAdmin ? "Account security and app configuration." : "Update your login password."}
      />

      <div className="panel form-panel">
        <h4 className="settings-section-title">Change password</h4>
        <p className="hint-text" style={{ marginTop: 0 }}>
          Signed in as <b>{currentUser?.name}</b> ({currentUser?.username})
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
            minLength={6}
          />

          <label className="field-label">Confirm new password</label>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
          />

          {passwordErr && <div className="form-error">{passwordErr}</div>}

          <button type="submit" className="btn btn-primary" disabled={passwordBusy}>
            {passwordBusy ? "Updating…" : "Update password"}
          </button>
        </form>

        {isAdmin && (
          <>
            <h4 className="settings-section-title">Payment terms</h4>
            <label className="field-label">Standard payment term (days after dispatch)</label>
            <input className="input" type="number" min="0" value={termDays} onChange={(e) => setTermDays(Number(e.target.value))} />
            <label className="field-label">Extended grace period before marked "Critical" (days)</label>
            <input className="input" type="number" min="0" value={graceDays} onChange={(e) => setGraceDays(Number(e.target.value))} />
            <p className="hint-text">Example: with {termDays}-day terms and a {graceDays}-day grace period, a delivery becomes <b>Overdue</b> after {termDays} days unpaid, and <b>Critical</b> after {termDays + graceDays} days.</p>

            <h4 className="settings-section-title">Email reminders</h4>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={emailRemindersEnabled}
                onChange={(e) => setEmailRemindersEnabled(e.target.checked)}
              />
              <span>Send automated payment reminder emails to franchises</span>
            </label>
            <label className="field-label">Reminder interval (days)</label>
            <input
              className="input"
              type="number"
              min="1"
              value={reminderIntervalDays}
              onChange={(e) => setReminderIntervalDays(Number(e.target.value))}
            />
            <p className="hint-text">
              Franchises with an outstanding balance and a valid email receive a reminder every {reminderIntervalDays} day{reminderIntervalDays === 1 ? "" : "s"}.
              Configure SMTP settings in <code>backend/.env</code> (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM).
            </p>

            <button
              className="btn btn-primary"
              onClick={() => onSave({
                termDays: Number(termDays),
                graceDays: Number(graceDays),
                reminderIntervalDays: Number(reminderIntervalDays),
                emailRemindersEnabled,
              })}
            >
              Save app settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
