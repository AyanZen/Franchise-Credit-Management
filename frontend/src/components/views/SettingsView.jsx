import { useState } from "react";
import PageHeader from "../common/PageHeader";

export default function SettingsView({ settings, onSave }) {
  const [termDays, setTermDays] = useState(settings.termDays);
  const [graceDays, setGraceDays] = useState(settings.graceDays);
  const [reminderIntervalDays, setReminderIntervalDays] = useState(settings.reminderIntervalDays ?? 2);
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(
    settings.emailRemindersEnabled !== false
  );

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="App configuration for payment terms and reminders."
      />

      <div className="panel form-panel">
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
      </div>
    </div>
  );
}
