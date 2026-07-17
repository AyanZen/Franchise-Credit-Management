/** Bill prefix: 2–10 uppercase letters/numbers, must start with a letter. */
export function normalizeBillPrefix(raw) {
  const value = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (!value || value.length < 2 || value.length > 10) return null;
  if (!/^[A-Z]/.test(value)) return null;
  return value;
}

export function validateBillPrefix(raw) {
  const prefix = normalizeBillPrefix(raw);
  if (!prefix) {
    return "Bill prefix must be 2–10 characters, start with a letter (e.g. XYZ).";
  }
  return null;
}

/** XYZ01, XYZ02, … XYZ99, XYZ100 */
export function formatBillNo(prefix, sequence) {
  const seq = Math.max(1, Number(sequence) || 1);
  const digits = seq < 100 ? 2 : String(seq).length;
  return `${prefix}${String(seq).padStart(digits, "0")}`;
}

export function normalizeBillNo(raw) {
  return String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export function parseBillSequence(billNo, prefix) {
  const normalized = normalizeBillNo(billNo);
  if (!normalized.startsWith(prefix)) return null;
  const numPart = normalized.slice(prefix.length);
  if (!/^\d+$/.test(numPart)) return null;
  const seq = Number(numPart);
  return seq >= 1 ? seq : null;
}

export function billNoMatchesPrefix(billNo, prefix) {
  return parseBillSequence(billNo, prefix) != null;
}

export function suggestBillPrefix(franchiseName) {
  const words = String(franchiseName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    const fromWords = words
      .slice(0, 3)
      .map((w) => w[0])
      .join("");
    const prefix = normalizeBillPrefix(fromWords);
    if (prefix) return prefix;
  }

  const compact = String(franchiseName ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3);
  return normalizeBillPrefix(compact) || "BL";
}
