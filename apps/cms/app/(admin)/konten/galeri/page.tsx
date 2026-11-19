import type { Metadata } from "next";
import Link from "next/link";
import { CONTENT_STATUS_LABEL, type ContentStatus } from "@erenos/shared";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, PageHead } from "@/components/ui/form";
import { mediaPublicUrl } from "@/lib/media";
import { shortDate } from "@/lib/month";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Galeri" };

type Row = {
  id: string;
  title: string;
  status: ContentStatus;
  event_date: string | null;
  show_on_home: boolean;
  cover: { path: string } | null;
  items: { count: number }[];
};

export default async function GalleryListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("galleries")
    .select("id, title, status, event_date, show_on_home, cover:media!cover_media_id(path), items:gallery_items(count)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHead
        title="Galeri"
        subtitle="Album foto kegiatan sekolah."
        actions={
          <Link href="/konten/galeri/baru" className={BTN_PRIMARY}>
            + Tambah album
          </Link>
        }
      />
      {error ? (
        <p className="text-sm text-red-700">Gagal memuat album: {error.message}</p>
      ) : rows.length === 0 ? (
        <div className={`${CARD} text-sm text-muted`}>Belum ada album.</div>
      ) : (
        <ul className={`${CARD} divide-y divide-line py-1`}>
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-4 py-3 text-sm">
              {r.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaPublicUrl(r.cover.path)} alt="" loading="lazy" className="h-10 w-14 shrink-0 rounded object-cover" />
              ) : (
                <div className="h-10 w-14 shrink-0 rounded bg-soft" />
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/konten/galeri/${r.id}`} className="block truncate font-semibold hover:underline">
                  {r.title}
                </Link>
                <span className="text-xs text-muted">
                  {r.items[0]?.count ?? 0} foto{r.event_date ? ` · ${shortDate(r.event_date)}` : ""}
                  {r.show_on_home ? " · di Beranda" : ""}
                </span>
              </div>
              <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-primary">{CONTENT_STATUS_LABEL[r.status] ?? r.status}</span>
              <Link href={`/konten/galeri/${r.id}`} className={`${BTN_OUTLINE} !h-9 !px-3`}>
                Ubah
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
