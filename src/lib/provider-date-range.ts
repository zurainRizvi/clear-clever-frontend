import { format } from "date-fns";

export interface DateRangeValue {
  from: Date;
  to: Date;
}

export function defaultProviderRange(): DateRangeValue {
  return providerRangeLastDays(7);
}

export function providerRangeLastDays(days: number): DateRangeValue {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function providerRangeAllTime(): DateRangeValue {
  const to = new Date();
  const from = new Date(2024, 0, 1);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function formatProviderRangeLabel(range: DateRangeValue): string {
  return `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`;
}

export function toRangeQuery(range: DateRangeValue): { from: string; to: string } {
  return {
    from: range.from.toISOString().slice(0, 10),
    to: range.to.toISOString().slice(0, 10),
  };
}

const PROVIDER_RANGE_STORAGE_KEY = "clearclever.providerAnalyticsRange";

export function loadStoredProviderRange(): DateRangeValue {
  if (typeof localStorage === "undefined") return defaultProviderRange();
  try {
    const raw = localStorage.getItem(PROVIDER_RANGE_STORAGE_KEY);
    if (!raw) return defaultProviderRange();
    const parsed = JSON.parse(raw) as { from?: string; to?: string };
    return parseRangeFromApi(parsed.from, parsed.to);
  } catch {
    return defaultProviderRange();
  }
}

export function saveStoredProviderRange(range: DateRangeValue): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PROVIDER_RANGE_STORAGE_KEY, JSON.stringify(toRangeQuery(range)));
}

export function parseRangeFromApi(from?: string, to?: string): DateRangeValue {
  if (!from || !to) return defaultProviderRange();
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return defaultProviderRange();
  }
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);
  return { from: fromDate, to: toDate };
}

export type ProviderRangePreset = "7d" | "30d" | "all";

function normalizeRangeBounds(range: DateRangeValue): DateRangeValue {
  const from = new Date(range.from);
  const to = new Date(range.to);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function matchesProviderPreset(range: DateRangeValue, preset: ProviderRangePreset): boolean {
  const normalized = normalizeRangeBounds(range);
  const expected = normalizeRangeBounds(
    preset === "7d"
      ? defaultProviderRange()
      : preset === "30d"
        ? providerRangeLastDays(30)
        : providerRangeAllTime()
  );
  return sameDay(normalized.from, expected.from) && sameDay(normalized.to, expected.to);
}
