import { STORAGE_BUCKET } from "@erenos/shared";

/** Hasil embed PostgREST dari tabel `media`. */
export type MediaRef = {
  path: string;
  alt_text: string | null;
  alt_text_en?: string | null;
  width?: number | null;
  height?: number | null;
} | null;

/** URL publik file di Supabase Storage; null bila tidak ada gambar (tampilkan placeholder). */
export function mediaUrl(media: MediaRef | undefined): string | null {
  if (!media?.path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${media.path}`;
}
