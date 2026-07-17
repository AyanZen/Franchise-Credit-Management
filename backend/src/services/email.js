import nodemailer from "nodemailer";
import { escapeHtml } from "../utils/sanitize.js";

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function createTransport() {
  if (!smtpConfigured()) return null;

  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" }
      : undefined,
  });
}

export function formatInr(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function buildReminderEmail({ franchiseName, totalDue, totalTaken, totalPaid }) {
  const safeName = escapeHtml(franchiseName);
  const due = formatInr(totalDue);
  const taken = formatInr(totalTaken);
  const paid = formatInr(totalPaid);

  const subject = `Payment reminder — ${due} outstanding`;
  const text = [
    `Dear ${franchiseName},`,
    "",
    "This is an automated reminder from Dispatch Ledger.",
    "",
    `Your current outstanding balance is ${due}.`,
    `Total dispatched: ${taken}`,
    `Total paid: ${paid}`,
    "",
    "Please arrange payment at your earliest convenience.",
    "",
    "Thank you.",
  ].join("\n");

  const html = `
    <p>Dear <strong>${safeName}</strong>,</p>
    <p>This is an automated reminder from <strong>Dispatch Ledger</strong>.</p>
    <p>Your current <strong>outstanding balance is ${due}</strong>.</p>
    <table cellpadding="6" style="border-collapse:collapse;margin:12px 0">
      <tr><td>Total dispatched</td><td><strong>${taken}</strong></td></tr>
      <tr><td>Total paid</td><td><strong>${paid}</strong></td></tr>
      <tr><td>Outstanding</td><td><strong style="color:#b45309">${due}</strong></td></tr>
    </table>
    <p>Please arrange payment at your earliest convenience.</p>
    <p>Thank you.</p>
  `;

  return { subject, text, html };
}

export async function sendReminderEmail({ to, franchiseName, totalDue, totalTaken, totalPaid }) {
  const transport = createTransport();
  if (!transport) {
    throw new Error("SMTP is not configured. Set SMTP_HOST and SMTP_FROM in backend .env");
  }

  const { subject, text, html } = buildReminderEmail({
    franchiseName,
    totalDue,
    totalTaken,
    totalPaid,
  });

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

export function isEmailConfigured() {
  return smtpConfigured();
}
