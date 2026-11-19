export type DayRow = { day: string; views: number; visitors: number };

export function TrafficBars({ days }: { days: DayRow[] }) {
  const max = Math.max(1, ...days.map((d) => d.views));
  const dayNo = (d: DayRow) => Number(d.day.slice(8, 10));

  return (
    <div>
      <ol aria-label="Kunjungan per hari" className="flex h-48 items-end gap-[3px] border-b border-line">
        {days.map((d) => (
          <li
            key={d.day}
            title={`Tgl ${dayNo(d)}: ${d.views} kunjungan halaman, ${d.visitors} pengunjung unik`}
            className="group flex h-full flex-1 items-end"
          >
            <div
              className="w-full rounded-t bg-primary group-hover:bg-deep"
              style={{ height: d.views > 0 ? `${Math.max(2, (d.views / max) * 100)}%` : 0 }}
            />
            <span className="sr-only">
              Tanggal {dayNo(d)}: {d.views} kunjungan halaman, {d.visitors} pengunjung unik
            </span>
          </li>
        ))}
      </ol>
      <ol aria-hidden="true" className="mt-2 flex gap-[3px] text-[11px] text-muted">
        {days.map((d) => (
          <li key={d.day} className="flex-1 text-center">
            {dayNo(d) === 1 || dayNo(d) % 5 === 0 ? dayNo(d) : ""}
          </li>
        ))}
      </ol>
    </div>
  );
}
