import type { Metadata } from "next";
import Link from "next/link";
import { SortableList, type SortItem } from "@/components/content/SortableList";
import { BTN_PRIMARY, PageHead } from "@/components/ui/form";
import { mediaPublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Hero Beranda" };

type Row = { id: string; title: string; status: string; cover: { path: string } | null };

export default async function ListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hero_slides")
    .select("id, title, status, cover:media!media_id(path)")
    .order("sort_order");
  const items: SortItem[] = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    thumb: r.cover ? mediaPublicUrl(r.cover.path) : null,
  }));

  return (
    <>
      <PageHead
        title="Hero Beranda"
        subtitle="Slide utama di beranda. Urutan tampil mengikuti daftar ini."
        actions={
          <Link href="/konten/hero/baru" className={BTN_PRIMARY}>
            + Tambah slide
          </Link>
        }
      />
      {error ? (
        <p className="text-sm text-red-700">Gagal memuat data: {error.message}</p>
      ) : (
        <SortableList entity="hero" items={items} editBase="/konten/hero" />
      )}
    </>
  );
}
