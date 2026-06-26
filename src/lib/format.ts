/** Formatting helpers shared across features. */

export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  }).format(d);
}

export function formatMonthYear(iso: string): string {
  return formatDate(iso, { month: "long", year: "numeric", day: undefined });
}

/** "2.4k", "1.2M" style compact counts. */
export function compact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
}
