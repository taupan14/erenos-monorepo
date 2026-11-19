"use server";

import { slugify } from "@erenos/shared";
import { getCurrentStaff } from "@/lib/auth";
import { UUID_RE } from "@/lib/media";
import { revalidateWeb } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };
const NO_SESSION: Result = { ok: false, error: "Sesi berakhir. Muat ulang halaman dan masuk kembali." };

function checkNames(name: string, nameEn: string): string | null {
  if (!name.trim()) return "Nama kategori wajib diisi.";
  if (name.trim().length > 60 || nameEn.trim().length > 60) return "Nama maksimal 60 karakter.";
  return null;
}

export async function createCategory(name: string, nameEn: string): Promise<Result> {
  if (!(await getCurrentStaff())) return NO_SESSION;
  const bad = checkNames(name, nameEn);
  if (bad) return { ok: false, error: bad };
  const slug = slugify(name, 60);
  if (!slug) return { ok: false, error: "Nama harus memuat huruf atau angka." };

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("news_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("news_categories").insert({
    name: name.trim(),
    name_en: nameEn.trim() || null,
    slug,
    sort_order: (Number(last?.sort_order) || 0) + 10,
  });
  if (error) {
    return { ok: false, error: error.code === "23505" ? "Kategori dengan nama serupa sudah ada." : `Gagal menambah: ${error.message}` };
  }
  await revalidateWeb();
  return { ok: true };
}

export async function updateCategory(id: string, name: string, nameEn: string): Promise<Result> {
  if (!(await getCurrentStaff())) return NO_SESSION;
  if (!UUID_RE.test(id)) return { ok: false, error: "ID tidak valid." };
  const bad = checkNames(name, nameEn);
  if (bad) return { ok: false, error: bad };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_categories")
    .update({ name: name.trim(), name_en: nameEn.trim() || null })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: `Gagal menyimpan: ${error.message}` };
  if (!data?.length) return { ok: false, error: "Kategori tidak ditemukan atau tidak ada hak akses." };
  await revalidateWeb();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<Result> {
  if (!(await getCurrentStaff())) return NO_SESSION;
  if (!UUID_RE.test(id)) return { ok: false, error: "ID tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("news_categories").delete().eq("id", id).select("id");
  if (error) return { ok: false, error: `Gagal menghapus: ${error.message}` };
  if (!data?.length) return { ok: false, error: "Kategori tidak ditemukan atau tidak ada hak akses." };
  await revalidateWeb();
  return { ok: true };
}
