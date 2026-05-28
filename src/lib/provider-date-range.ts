import { format } from "date-fns";

export interface DateRangeValue {
  from: Date;
  to: Date;
}

export function defaultProviderRange(): DateRangeValue {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function formatProviderRangeLabel(range: DateRangeValue): string {
  return `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`;
}

export function toRangeQuery(range: DateRangeValue): { from: string; to: string } {
  return {
    from: format(range.from, "yyyy-MM-dd"),
    to: format(range.to, "yyyy-MM-dd"),
  };
}

function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date(value);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function parseRangeFromApi(from?: string, to?: string): DateRangeValue {
  if (!from || !to) return defaultProviderRange();
  const fromDate = parseDateOnly(from);
  const toDate = parseDateOnly(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return defaultProviderRange();
  }
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);
  return { from: fromDate, to: toDate };
}
