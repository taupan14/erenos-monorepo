export type CityRow = { city: string; views: number };

export function CityList({ rows }: { rows: CityRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">
        Belum ada data kota. Data ini hanya terisi dari kunjungan ke website produksi di Vercel.
      </p>
    );
  }
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.city} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="font-medium">
              {i + 1}. {r.city}
            </span>
            <span className="text-muted">{r.views.toLocaleString("id-ID")}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-soft">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${(r.views / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
