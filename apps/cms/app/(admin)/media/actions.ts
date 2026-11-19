"use server";

import { STORAGE_BUCKET } from "@erenos/shared";
import { getCurrentStaff } from "@/lib/auth";
import { MAX_MEDIA_BYTES, MEDIA_MIME, MEDIA_PATH_RE, UUID_RE } from "@/lib/media";
import { revalidateWeb } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };

const NO_SESSION: Result = { ok: false, error: "Sesi berakhir. Muat ulang halaman dan masuk kembali." };

type RegisterInput = {
  path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
};

/** Mencatat berkas yang sudah terunggah ke Storage ke tabel media. */
export async function registerMedia(input: RegisterInput): Promise<Result> {
  if (!(await getCurrentStaff())) return NO_SESSION;

  if (!MEDIA_PATH_RE.test(input.path)) return { ok: false, error: "Path berkas tidak valid." };
  if (!(MEDIA_MIME as readonly string[]).includes(input.mime_type)) {
    return { ok: false, error: "Tipe berkas tidak didukung." };
  }
  if (!Number.isInteger(input.size_bytes) || input.size_bytes <= 0 || input.size_bytes > MAX_MEDIA_BYTES) {
    return { ok: false, error: "Ukuran berkas tidak valid (maks. 10 MB)." };
  }
  const dim = (n: number | null) =>
    n === null ? null : Number.isInteger(n) && n > 0 && n <= 20000 ? n : null;

  const supabase = await createClient();
  const { error } = await supabase.from("media").insert({
    path: input.path,
    file_name: input.file_name.slice(0, 200),
    mime_type: input.mime_type,
    size_bytes: input.size_bytes,
    width: dim(input.width),
    height: dim(input.height),
  });
  if (error) return { ok: false, error: `Gagal mencatat media: ${error.message}` };
  return { ok: true };
}

export async function updateMediaAlt(id: string, alt: string, altEn: string): Promise<Result> {
  if (!(await getCurrentStaff())) return NO_SESSION;
  if (!UUID_RE.test(id)) return { ok: false, error: "ID media tidak valid." };
  const a = alt.trim();
  const e = altEn.trim();
  if (a.length > 300 || e.length > 300) return { ok: false, error: "Teks alternatif maksimal 300 karakter." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media")
    .update({ alt_text: a, alt_text_en: e })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: `Gagal menyimpan: ${error.message}` };
  if (!data?.length) return { ok: false, error: "Media tidak ditemukan atau tidak ada hak akses." };

  await revalidateWeb();
  return { ok: true };
}

export async function deleteMedia(id: string): Promise<Result> {
  if (!(await getCurrentStaff())) return NO_SESSION;
  if (!UUID_RE.test(id)) return { ok: false, error: "ID media tidak valid." };

  const supabase = await createClient();
  const { data: row } = await supabase.from("media").select("path").eq("id", id).maybeSingle();
  if (!row) return { ok: false, error: "Media tidak ditemukan." };

  const { data, error } = await supabase.from("media").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: `Gagal menghapus: ${error.message}` };
  if (!data?.length) return { ok: false, error: "Tidak ada hak akses untuk menghapus media ini." };

  // Baris sudah hilang; berkas di Storage dihapus sebisanya
  await supabase.storage.from(STORAGE_BUCKET).remove([String(row.path)]);
  await revalidateWeb();
  return { ok: true };
}
