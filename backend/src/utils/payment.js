const PAYMENT_METHODS = ["Cash", "Cheque", "Online"];

export function buildPaymentNotes(method, reference) {
  if (method === "Cheque") return `Cheque no. ${reference}`;
  if (method === "Online") return `Transaction ID: ${reference}`;
  return "Cash payment received";
}

export function validatePaymentInput({ amount, method, reference }) {
  if (!amount || Number(amount) <= 0) return "Enter a valid amount.";
  if (!PAYMENT_METHODS.includes(method)) return "Invalid payment method.";
  if (method === "Cheque" && !reference?.trim()) return "Cheque number is required.";
  if (method === "Online" && !reference?.trim()) return "Transaction ID is required.";
  return null;
}
