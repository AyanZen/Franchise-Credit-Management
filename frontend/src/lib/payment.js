export const PAYMENT_METHODS = ["Cash", "Cheque", "Online"];

export function formatPaymentReference(payment) {
  if (payment.reference) {
    if (payment.method === "Cheque") return `Cheque #${payment.reference}`;
    if (payment.method === "Online") return `Txn: ${payment.reference}`;
  }
  return payment.notes || "—";
}
