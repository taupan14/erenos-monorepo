const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Bulan berjalan (YYYY-MM) menurut zona waktu Jakarta. */
export function currentMonth(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }).slice(0, 7);
}

/** Validasi ?bulan=YYYY-MM; tidak valid atau di masa depan → bulan berjalan. */
export function resolveMonth(raw?: string): string {
  const cur = currentMonth();
  if (!raw || !MONTH_RE.test(raw)) return cur;
  return raw > cur ? cur : raw;
}

export function shiftMonth(ym: string, delta: number): string {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(ym: string): string {
  const d = new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1));
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
}

export function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}
