/** Pakistan CNIC: 12345-1234567-1 */
const CNIC_DIGITS = /^\d{13}$/;

export function normalizeCnicInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 13) {
    throw new Error("CNIC must contain 13 digits");
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function isValidCnicInput(raw: string): boolean {
  try {
    normalizeCnicInput(raw);
    return true;
  } catch {
    return false;
  }
}

export function formatCnicWhileTyping(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function cnicDigitsOnly(raw: string): boolean {
  return CNIC_DIGITS.test(raw.replace(/\D/g, ""));
}
