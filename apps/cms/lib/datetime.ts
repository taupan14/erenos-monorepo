const TZ = "Asia/Jakarta";

/** ISO (UTC) → nilai <input type="datetime-local"> dalam waktu Jakarta. */
export function toJakartaInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
  return s.replace(" ", "T");
}

/** Nilai datetime-local (dianggap waktu Jakarta, WIB) → ISO dengan offset; null bila tidak valid. */
export function fromJakartaInput(v: string): string | null {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? `${v}:00+07:00` : null;
}
