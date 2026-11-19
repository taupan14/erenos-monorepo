import type { Metadata } from "next";
import Link from "next/link";
import { CONTENT_STATUS_LABEL, type ContentStatus } from "@erenos/shared";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT, PageHead } from "@/components/ui/form";
import { mediaPublicUrl } from "@/lib/media";
import { shortDate } from "@/lib/month";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Berita" };

const PAGE_SIZE = 20;
const TABS: { id: string; label: string }[] = [
  { id: "", label: "Semua" },
  { id: "published", label: "Terbit" },
  { id: "draft", label: "Draf" },
  { id: "archived", label: "Diarsipkan" },
];

type Props = { searchParams: Promise<{ status?: string; q?: string; kategori?: string; halaman?: string }> };

type Row = {
  id: string;
  title: string;
  status: ContentStatus;
  published_at: string | null;
  updated_at: string;
  cover: { path: string } | null;
  category: { name: string } | null;
};

export default async function NewsListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const status = TABS.some((t) => t.id === sp.status) ? (sp.status ?? "") : "";
  const q = (sp.q ?? "").trim().slice(0, 100);
  const kategori = sp.kategori ?? "";
  const page = Math.max(1, Math.floor(Number(sp.halaman)) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("news")
    .select("id, title, status, published_at, updated_at, cover:media!cover_media_id(path), category:news_categories(name)", {
      count: "exact",
    })
    .order("updated_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("title", `%${q}%`);
  if (kategori) query = query.eq("category_id", kategori);

  const [{ data, count, error }, { data: cats }] = await Promise.all([
    query,
    supabase.from("news_categories").select("id, name").order("sort_order"),
  ]);

  const rows = (data ?? []) as unknown as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const all = { status, q, kategori, halaman: "", ...over };
    Object.entries(all).forEach(([key, val]) => val && p.set(key, val));
    const s = p.toString();
    return `/konten/berita${s ? `?${s}` : ""}`;
  };
  const now = new Date();

  return (
    <>
      <PageHead
        title="Berita"
        subtitle="Berita dan kegiatan sekolah."
        actions={
          <>
            <Link href="/konten/berita/kategori" className={BTN_OUTLINE}>
              Kategori
            </Link>
            <Link href="/konten/berita/baru" className={BTN_PRIMARY}>
              + Tulis berita
            </Link>
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
        <form action="/konten/berita" className="flex flex-wrap gap-2">
          <input type="hidden" name="status" value={status} />
          <input name="q" defaultValue={q} placeholder="Cari judul…" aria-label="Cari judul" className={`${INPUT} w-56`} />
          <select name="kategori" defaultValue={kategori} aria-label="Kategori" className={`${INPUT} w-44`}>
            <option value="">Semua kategori</option>
            {(cats ?? []).map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
          <button className={BTN_OUTLINE}>Cari</button>
        </form>
      </div>

      {error ? (
        <p className="text-sm text-red-700">Gagal memuat berita: {error.message}</p>
      ) : rows.length === 0 ? (
        <div className={`${CARD} text-sm text-muted`}>Belum ada berita yang cocok.</div>
      ) : (
        <ul className={`${CARD} divide-y divide-line py-1`}>
          {rows.map((r) => {
            const scheduled = r.status === "published" && r.published_at && new Date(r.published_at) > now;
            return (
              <li key={r.id} className="flex items-center gap-4 py-3 text-sm">
                {r.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaPublicUrl(r.cover.path)} alt="" loading="lazy" className="h-10 w-14 shrink-0 rounded object-cover" />
                ) : (
                  <div className="h-10 w-14 shrink-0 rounded bg-soft" />
                )}
                <Link href={`/konten/berita/${r.id}`} className="min-w-0 flex-1 truncate font-semibold hover:underline">
                  {r.title}
                </Link>
                <span className="hidden w-32 truncate text-muted md:block">{r.category?.name ?? "–"}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === "published" && !scheduled ? "bg-green-100 text-green-800" : r.status === "archived" ? "bg-soft text-muted" : "bg-amber-100 text-amber-900"}`}
                >
                  {scheduled ? "Terjadwal" : CONTENT_STATUS_LABEL[r.status]}
                </span>
                <span className="hidden w-16 text-right text-muted sm:block">{shortDate(r.published_at ?? r.updated_at)}</span>
                <Link href={`/konten/berita/${r.id}`} className={`${BTN_OUTLINE} !h-9 !px-3`}>
                  Ubah
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Halaman" className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={href({ halaman: String(page - 1) })} className={BTN_OUTLINE}>
              ← Sebelumnya
            </Link>
          )}
          <span className="text-muted">
            Halaman {page} dari {pages}
          </span>
          {page < pages && (
            <Link href={href({ halaman: String(page + 1) })} className={BTN_OUTLINE}>
              Berikutnya →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
