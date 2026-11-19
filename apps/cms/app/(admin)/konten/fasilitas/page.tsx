import type { Metadata } from "next";
import Link from "next/link";
import { SortableList, type SortItem } from "@/components/content/SortableList";
import { BTN_PRIMARY, PageHead } from "@/components/ui/form";
import { mediaPublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Fasilitas" };

type Row = { id: string; name: string; status: string; cover: { path: string } | null };

export default async function ListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("facilities")
    .select("id, name, status, cover:media!media_id(path)")
    .order("sort_order");
  const items: SortItem[] = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    title: r.name,
    status: r.status,
    thumb: r.cover ? mediaPublicUrl(r.cover.path) : null,
  }));

  return (
    <>
      <PageHead
        title="Fasilitas"
        subtitle="Ruang dan sarana sekolah. Urutan tampil mengikuti daftar ini."
        actions={
          <Link href="/konten/fasilitas/baru" className={BTN_PRIMARY}>
            + Tambah fasilitas
          </Link>
        }
      />
      {error ? (
        <p className="text-sm text-red-700">Gagal memuat data: {error.message}</p>
      ) : (
        <SortableList entity="facility" items={items} editBase="/konten/fasilitas" />
      )}
    </>
  );
}
