import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  SubscriberList,
  type SubscriberRow,
} from "@/components/subscribers/SubscriberList";
import {
  BTN_OUTLINE,
  BTN_PRIMARY,
  CARD,
  INPUT,
  PageHead,
} from "@/components/ui/form";
import { getCurrentStaff } from "@/lib/auth";
import { cleanTerm } from "@/lib/inquiry";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pelanggan" };

const PAGE_SIZE = 50;
const TABS = [
  { id: "", label: "Semua" },
  { id: "active", label: "Aktif" },
  { id: "unsubscribed", label: "Berhenti" },
];

type Props = {
  searchParams: Promise<{ status?: string; q?: string; halaman?: string }>;
};

export default async function SubscribersPage({ searchParams }: Props) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");
  if (staff.role !== "super_admin") redirect("/");

  const sp = await searchParams;
  const status = TABS.some((t) => t.id === sp.status) ? (sp.status ?? "") : "";
  const term = cleanTerm(sp.q);
  const page = Math.max(1, Math.floor(Number(sp.halaman)) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("subscribers")
    .select("id, email, status, subscribed_at, unsubscribed_at", {
      count: "exact",
    })
    .order("subscribed_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (term) query = query.ilike("email", `%${term}%`);

  const [{ data, count, error }, active, total] = await Promise.all([
    query,
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("subscribers").select("id", { count: "exact", head: true }),
  ]);

  const rows = (data ?? []) as unknown as SubscriberRow[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const all = { status, q: term, halaman: "", ...over };
    Object.entries(all).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return `/pelanggan${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHead
        title="Pelanggan"
        subtitle={`Pelanggan buletin dari footer website · ${(active.count ?? 0).toLocaleString("id-ID")} aktif dari ${(total.count ?? 0).toLocaleString("id-ID")} total`}
        actions={
          <>
            <a href="/pelanggan/export?status=all" className={BTN_OUTLINE}>
              Ekspor semua (CSV)
            </a>
            <a href="/pelanggan/export?status=active" className={BTN_PRIMARY}>
              Ekspor aktif (CSV)
            </a>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter status" className="flex gap-1">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={href({ status: t.id, halaman: "" })}
              aria-current={status === t.id ? "page" : undefined}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${status === t.id ? "bg-white text-primary shadow-sm" : "text-muted hover:bg-white/60"}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <form action="/pelanggan" className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={term}
            placeholder="Cari email…"
            aria-label="Cari email"
            className={`${INPUT} w-64`}
          />
          <button className={BTN_OUTLINE}>Cari</button>
        </form>
      </div>

      {error ? (
        <p className="text-sm text-red-700">
          Gagal memuat pelanggan: {error.message}
        </p>
      ) : (
        <SubscriberList rows={rows} />
      )}

      {pages > 1 && (
        <nav
          aria-label="Halaman"
          className="mt-5 flex items-center justify-center gap-3 text-sm"
        >
          {page > 1 && (
            <Link
              href={href({ halaman: String(page - 1) })}
              className={BTN_OUTLINE}
            >
              ← Sebelumnya
            </Link>
          )}
          <span className="text-muted">
            Halaman {page} dari {pages}
          </span>
          {page < pages && (
            <Link
              href={href({ halaman: String(page + 1) })}
              className={BTN_OUTLINE}
            >
              Berikutnya →
            </Link>
          )}
        </nav>
      )}

      <div className={`${CARD} mt-6 text-sm text-muted`}>
        File ekspor memuat kolom <b>email</b>, <b>status</b>,{" "}
        <b>subscribed_at</b>, <b>unsubscribed_at</b>, dan <b>unsubscribe_url</b>{" "}
        (tautan berhenti berlangganan per pelanggan, untuk disisipkan di setiap
        buletin). Tautan memakai alamat dari variabel <code>WEB_URL</code> dan
        bahasa Indonesia.
      </div>
    </>
  );
}
