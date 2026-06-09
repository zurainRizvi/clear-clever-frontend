/** Pakistan mobile: 03XXXXXXXXX or +923XXXXXXXXX */
const PK_PHONE_REGEX = /^(?:\+92|0)?3[0-9]{9}$/;

export function normalizePkPhone(raw: string): string {
  const digits = raw.replace(/[\s-]/g, "");
  if (digits.startsWith("+92")) return digits;
  if (digits.startsWith("92") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0")) return `+92${digits.slice(1)}`;
  return digits;
}

export function isValidPkPhone(raw: string): boolean {
  return PK_PHONE_REGEX.test(normalizePkPhone(raw));
}

/** Display stored +92 numbers as local 03… format for forms. */
export function toLocalPkPhoneDisplay(normalized: string): string {
  if (normalized.startsWith("+92") && normalized.length === 13) {
    return `0${normalized.slice(3)}`;
  }
  return normalized;
}

export function formatPkPhoneInput(raw: string): string {
  return normalizePkPhone(raw);
}
