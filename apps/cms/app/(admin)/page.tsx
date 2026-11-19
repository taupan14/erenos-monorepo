import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ACADEMIC_LEVELS,
  CONTENT_STATUS_LABEL,
  INQUIRY_STATUS_LABEL,
  type ContentStatus,
  type InquiryStatus,
} from "@erenos/shared";
import { CityList, type CityRow } from "@/components/dashboard/CityList";
import { DevicePie, type DeviceRow } from "@/components/dashboard/DevicePie";
import { MonthNav } from "@/components/dashboard/MonthNav";
import { TrafficBars, type DayRow } from "@/components/dashboard/TrafficBars";
import { getCurrentStaff } from "@/lib/auth";
import { resolveMonth, shortDate } from "@/lib/month";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dasbor" };

type Props = { searchParams: Promise<{ bulan?: string }> };

const CARD = "rounded-2xl border border-line bg-white p-5";
const PILL = "rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-primary";

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className={`${CARD} flex-1 basis-40`}>
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1.5 font-serif text-4xl font-semibold tabular-nums text-deep">
        {value === null ? "–" : value.toLocaleString("id-ID")}
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: Props) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");

  const { bulan } = await searchParams;
  const month = resolveMonth(bulan);
  const p_month = `${month}-01`;
  const isSuper = staff.role === "super_admin";
  const supabase = await createClient();
  const head = { count: "exact", head: true } as const;

  const [published, drafts, newInq, subs, daily, devices, cities, latestInq, latestNews] =
    await Promise.all([
      supabase.from("news").select("id", head).eq("status", "published"),
      supabase.from("news").select("id", head).eq("status", "draft"),
      isSuper ? supabase.from("inquiries").select("id", head).eq("status", "new") : null,
      isSuper ? supabase.from("subscribers").select("id", head).eq("status", "active") : null,
      supabase.rpc("traffic_daily", { p_month }),
      supabase.rpc("traffic_devices", { p_month }),
      supabase.rpc("traffic_cities", { p_month }),
      isSuper
        ? supabase
            .from("inquiries")
            .select("id, parent_name, interested_level, status, created_at")
            .order("created_at", { ascending: false })
            .limit(5)
        : null,
      supabase
        .from("news")
        .select("id, title, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

  const days: DayRow[] = ((daily.data ?? []) as DayRow[]).map((d) => ({
    day: d.day,
    views: Number(d.views),
    visitors: Number(d.visitors),
  }));
  const deviceRows: DeviceRow[] = ((devices.data ?? []) as DeviceRow[]).map((d) => ({
    device: d.device,
    views: Number(d.views),
  }));
  const cityRows: CityRow[] = ((cities.data ?? []) as CityRow[]).map((c) => ({
    city: c.city,
    views: Number(c.views),
  }));
  const totalViews = days.reduce((s, d) => s + d.views, 0);
  const firstName = staff.fullName.split(" ")[0];

  return (
    <div className="space-y-4">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-deep">
            Selamat datang kembali{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted">Ringkasan konten dan kunjungan website.</p>
        </div>
        <MonthNav month={month} />
      </div>

      <div className="flex flex-wrap gap-4">
        <StatCard label="Berita terbit" value={published.error ? null : (published.count ?? 0)} />
        <StatCard label="Draf berita" value={drafts.error ? null : (drafts.count ?? 0)} />
        {newInq && <StatCard label="Inquiry baru" value={newInq.error ? null : (newInq.count ?? 0)} />}
        {subs && <StatCard label="Pelanggan aktif" value={subs.error ? null : (subs.count ?? 0)} />}
      </div>

      <section className={CARD} aria-labelledby="h-traffic">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="h-traffic" className="font-semibold">
            Kunjungan website per hari
          </h2>
          {!daily.error && (
            <span className="text-sm text-muted">
              Total {totalViews.toLocaleString("id-ID")} kunjungan halaman
            </span>
          )}
        </div>
        {daily.error ? (
          <p className="text-sm text-red-700">
            Data trafik belum bisa dimuat. Pastikan migrasi page_views sudah dijalankan.
          </p>
        ) : (
          <TrafficBars days={days} />
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={CARD} aria-labelledby="h-device">
          <h2 id="h-device" className="mb-4 font-semibold">
            Platform kunjungan
          </h2>
          <DevicePie rows={deviceRows} />
        </section>
        <section className={CARD} aria-labelledby="h-city">
          <h2 id="h-city" className="mb-4 font-semibold">
            Kota asal kunjungan (maks. 10)
          </h2>
          <CityList rows={cityRows} />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {latestInq && (
          <section className={`${CARD} lg:col-span-2`} aria-labelledby="h-inq">
            <h2 id="h-inq" className="mb-2 font-semibold">
              Inquiry terbaru
            </h2>
            {(latestInq.data ?? []).length === 0 ? (
              <p className="text-sm text-muted">Belum ada inquiry.</p>
            ) : (
              <ul>
                {(latestInq.data ?? []).map((q) => (
                  <li
                    key={q.id}
                    className="flex items-center justify-between gap-3 border-t border-line py-3 text-sm"
                  >
                    <span className="font-medium">{q.parent_name}</span>
                    <span className="text-muted">
                      {ACADEMIC_LEVELS.find((l) => l.code === q.interested_level)?.shortName ?? "–"}
                      {" · "}
                      {shortDate(q.created_at)}
                    </span>
                    <span className={PILL}>
                      {INQUIRY_STATUS_LABEL[q.status as InquiryStatus] ?? q.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        <section className={`${CARD} ${latestInq ? "" : "lg:col-span-3"}`} aria-labelledby="h-news">
          <h2 id="h-news" className="mb-2 font-semibold">
            Konten terbaru
          </h2>
          {(latestNews.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">Belum ada berita.</p>
          ) : (
            <ul>
              {(latestNews.data ?? []).map((n) => (
                <li
                  key={n.id}
                  className="flex items-center justify-between gap-3 border-t border-line py-3 text-sm"
                >
                  <span className="min-w-0 truncate font-medium">{n.title}</span>
                  <span className={PILL}>
                    {CONTENT_STATUS_LABEL[n.status as ContentStatus] ?? n.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
