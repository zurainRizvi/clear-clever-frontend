export function formatPkr(amount: number, opts?: { perMonth?: boolean }): string {
  const formatted = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
  return opts?.perMonth ? `${formatted}/mo` : formatted;
}

export function formatPkrYearly(monthly: number, yearly: number): string {
  return `${formatPkr(yearly)}/yr · ${formatPkr(monthly, { perMonth: true })}`;
}
