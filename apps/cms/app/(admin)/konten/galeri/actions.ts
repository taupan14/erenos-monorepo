"use server";

import { getCurrentStaff } from "@/lib/auth";
import { UUID_RE } from "@/lib/media";
import { revalidateWeb } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import type { Result } from "../actions";

const NO_SESSION: Result = { ok: false, error: "Sesi berakhir. Muat ulang halaman dan masuk kembali." };

export async function addGalleryItems(galleryId: string, mediaIds: string[]): Promise<Result> {
  if (!(await getCurrentStaff())) return NO_SESSION;
  const ids = [...new Set(mediaIds)];
  if (!UUID_RE.test(galleryId) || ids.length === 0 || ids.length > 100 || ids.some((i) => !UUID_RE.test(i))) {
    return { ok: false, error: "Pilihan foto tidak valid." };
  }
  const supabase = await createClient();
  const { data: last } = await supabase
    .from("gallery_items")
    .select("sort_order")
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  let next = Number(last?.sort_order) || 0;
  const rows = ids.map((media_id) => ({ gallery_id: galleryId, media_id, sort_order: (next += 10) }));

  const { error } = await supabase.from("gallery_items").upsert(rows, { onConflict: "gallery_id,media_id", ignoreDuplicates: true });
  if (error) return { ok: false, error: `Gagal menambah foto: ${error.message}` };
  await revalidateWeb();
  return { ok: true };
}

export async function updateGalleryItem(id: string, caption: string, captionEn: string): Promise<Result> {
  if (!(await getCurrentStaff())) return NO_SESSION;
  if (!UUID_RE.test(id)) return { ok: false, error: "ID tidak valid." };
  if (caption.length > 300 || captionEn.length > 300) return { ok: false, error: "Keterangan maksimal 300 karakter." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_items")
    .update({ caption: caption.trim() || null, caption_en: captionEn.trim() || null })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: `Gagal menyimpan: ${error.message}` };
  if (!data?.length) return { ok: false, error: "Foto tidak ditemukan atau tidak ada hak akses." };
  await revalidateWeb();
  return { ok: true };
}

export async function removeGalleryItem(id: string): Promise<Result> {
  if (!(await getCurrentStaff())) return NO_SESSION;
  if (!UUID_RE.test(id)) return { ok: false, error: "ID tidak valid." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("gallery_items").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: `Gagal menghapus: ${error.message}` };
  if (!data?.length) return { ok: false, error: "Foto tidak ditemukan atau tidak ada hak akses." };
  await revalidateWeb();
  return { ok: true };
}

export async function reorderGalleryItems(galleryId: string, ids: string[]): Promise<Result> {
  if (!(await getCurrentStaff())) return NO_SESSION;
  if (!UUID_RE.test(galleryId) || ids.length > 500 || ids.some((i) => !UUID_RE.test(i))) {
    return { ok: false, error: "Daftar urutan tidak valid." };
  }
  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, i) =>
      supabase.from("gallery_items").update({ sort_order: (i + 1) * 10 }).eq("id", id).eq("gallery_id", galleryId).select("id"),
    ),
  );
  const bad = results.find((r) => r.error);
  if (bad?.error) return { ok: false, error: `Gagal mengurutkan: ${bad.error.message}` };
  await revalidateWeb();
  return { ok: true };
}
