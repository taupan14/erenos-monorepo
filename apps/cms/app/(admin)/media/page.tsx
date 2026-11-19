import type { Metadata } from "next";
import Link from "next/link";
import { MediaLibrary } from "@/components/media/MediaLibrary";
import { BTN_OUTLINE, PageHead } from "@/components/ui/form";
import type { MediaItem } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Media" };

const PAGE_SIZE = 40;

type Props = { searchParams: Promise<{ halaman?: string }> };

export default async function MediaPage({ searchParams }: Props) {
  const { halaman } = await searchParams;
  const page = Math.max(1, Math.floor(Number(halaman)) || 1);
  const supabase = await createClient();

  const { data, count, error } = await supabase
    .from("media")
    .select("id, path, file_name, mime_type, size_bytes, width, height, alt_text, alt_text_en, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHead title="Media" subtitle={`Foto dan berkas untuk seluruh situs · ${total.toLocaleString("id-ID")} berkas`} />
      {error ? (
        <p className="text-sm text-red-700">Gagal memuat media: {error.message}</p>
      ) : (
        <MediaLibrary items={(data ?? []) as MediaItem[]} />
      )}
      {pages > 1 && (
        <nav aria-label="Halaman media" className="mt-6 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link href={`/media?halaman=${page - 1}`} className={BTN_OUTLINE}>
              ← Sebelumnya
            </Link>
          )}
          <span className="text-muted">
            Halaman {page} dari {pages}
          </span>
          {page < pages && (
            <Link href={`/media?halaman=${page + 1}`} className={BTN_OUTLINE}>
              Berikutnya →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
