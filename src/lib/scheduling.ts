export const PREFERRED_TIME_SLOTS = [
  "9:00 AM – 12:00 PM",
  "12:00 PM – 1:00 PM",
  "1:00 PM – 5:00 PM",
  "5:00 PM – 8:00 PM",
] as const;

export type PreferredTimeSlot = (typeof PREFERRED_TIME_SLOTS)[number];

export const REGISTRATION_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad / Rawalpindi",
  "Other",
] as const;

export function nextBusinessDayIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

export function isValidRegistrationNumber(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 20) return false;
  return /^[a-zA-Z0-9-]+$/.test(trimmed);
}

const SLOT_TO_TIME: Record<PreferredTimeSlot, string> = {
  "9:00 AM – 12:00 PM": "09:00",
  "12:00 PM – 1:00 PM": "12:00",
  "1:00 PM – 5:00 PM": "13:00",
  "5:00 PM – 8:00 PM": "17:00",
};

export function preferredSlotToScheduledTime(slot: string): string {
  if ((PREFERRED_TIME_SLOTS as readonly string[]).includes(slot)) {
    return SLOT_TO_TIME[slot as PreferredTimeSlot];
  }
  return "10:00";
}
