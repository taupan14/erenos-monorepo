const META: Record<string, { label: string; color: string }> = {
  mobile: { label: "Mobile", color: "#2F55A4" },
  desktop: { label: "Desktop", color: "#14295A" },
  tablet: { label: "Tablet", color: "#E0AE2E" },
};

export type DeviceRow = { device: string; views: number };

export function DevicePie({ rows }: { rows: DeviceRow[] }) {
  const total = rows.reduce((s, r) => s + r.views, 0);
  if (total === 0) {
    return <p className="text-sm text-muted">Belum ada data kunjungan pada bulan ini.</p>;
  }

  let acc = 0;
  const slices = rows.map((r) => {
    const meta = META[r.device] ?? { label: r.device, color: "#4F7BDA" };
    const from = acc;
    acc += (r.views / total) * 100;
    return { ...r, ...meta, from, to: acc, pct: (r.views / total) * 100 };
  });
  const gradient = slices.map((s) => `${s.color} ${s.from}% ${s.to}%`).join(", ");
  const summary = slices.map((s) => `${s.label} ${s.pct.toFixed(0)}%`).join(", ");

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        role="img"
        aria-label={`Platform kunjungan: ${summary}`}
        className="h-40 w-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}
      />
      <ul className="space-y-2 text-sm">
        {slices.map((s) => (
          <li key={s.device} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-sm" style={{ background: s.color }} />
            <span className="font-medium">{s.label}</span>
            <span className="text-muted">
              {s.views.toLocaleString("id-ID")} ({s.pct.toFixed(0)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
