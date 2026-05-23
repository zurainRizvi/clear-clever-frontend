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

export function formatPkPhoneInput(raw: string): string {
  return normalizePkPhone(raw);
}
