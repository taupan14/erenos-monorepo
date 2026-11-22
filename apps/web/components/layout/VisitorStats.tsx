"use client";

import { useEffect, useState } from "react";

export type VisitorStatsData = {
  todayViews: number;
  todayVisitors: number;
  totalViews: number;
  totalVisitors: number;
};

type Labels = {
  todayVisitors: string;
  todayViews: string;
  totalVisitors: string;
  totalViews: string;
};

/**
 * Statistik kunjungan di footer. Angka awal berasal dari render server (ikut ISR 5 menit),
 * lalu disegarkan langsung dari database saat halaman dibuka supaya tidak ketinggalan.
 */
export function VisitorStats({
  initial,
  labels,
  locale,
}: {
  initial: VisitorStatsData | null;
  labels: Labels;
  locale: string;
}) {
  const [stats, setStats] = useState<VisitorStatsData | null>(initial);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;
    const ctrl = new AbortController();
    fetch(`${url}/rest/v1/rpc/visitor_stats`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        const row = (Array.isArray(data) ? data[0] : data) as
          | Record<string, number | string>
          | null
          | undefined;
        if (!row) return;
        setStats({
          todayViews: Number(row.today_views) || 0,
          todayVisitors: Number(row.today_visitors) || 0,
          totalViews: Number(row.total_views) || 0,
          totalVisitors: Number(row.total_visitors) || 0,
        });
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, []);

  if (!stats) return null;
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID");
  const items: [string, number][] = [
    [labels.todayVisitors, stats.todayVisitors],
    [labels.todayViews, stats.todayViews],
    [labels.totalVisitors, stats.totalVisitors],
    [labels.totalViews, stats.totalViews],
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-white/15 py-6 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="flex flex-col-reverse">
          <dt className="text-[11px] uppercase tracking-[0.12em]">{label}</dt>
          <dd className="font-serif text-2xl font-bold text-white">
            {nf.format(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
