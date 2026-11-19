"use server";

import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { fromJakartaInput } from "@/lib/datetime";
import { UUID_RE } from "@/lib/media";
import { revalidateWeb } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

export type NewsState = {
  status: "idle" | "ok" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  nonce: number;
};

const STATUSES = ["draft", "published", "archived"];
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function saveNews(prev: NewsState, fd: FormData): Promise<NewsState> {
  const nonce = prev.nonce + 1;
  const staff = await getCurrentStaff();
  if (!staff) return { status: "error", message: "Sesi berakhir. Muat ulang halaman dan masuk kembali.", nonce };

  const get = (n: string) => String(fd.get(n) ?? "").trim();
  const id = get("id");
  const intent = get("intent");
  const values: Record<string, string> = {};
  for (const n of [
    "title", "slug", "excerpt", "cover_media_id", "category_id", "author_name",
    "status", "published_at", "seo_title", "seo_description",
  ]) values[n] = get(n);
  values.is_featured = fd.get("is_featured") === "on" ? "on" : "";
  const content = String(fd.get("content") ?? "");

  const errors: Record<string, string> = {};
  const tooLong = (n: string, max: number) => {
    if ((values[n] ?? "").length > max) errors[n] = `Maksimal ${max} karakter.`;
  };
  if (!values.title) errors.title = "Judul wajib diisi.";
  tooLong("title", 200);
  if (!values.slug) errors.slug = "Slug wajib diisi.";
  else if (!SLUG_RE.test(values.slug) || values.slug.length > 80) {
    errors.slug = "Slug hanya huruf kecil, angka, dan tanda hubung (maks. 80 karakter).";
  }
  tooLong("excerpt", 400);
  tooLong("author_name", 100);
  tooLong("seo_title", 70);
  tooLong("seo_description", 160);
  if (content.length > 200_000) errors.content = "Isi terlalu panjang.";
  for (const n of ["cover_media_id", "category_id"]) {
    if (values[n] && !UUID_RE.test(values[n] ?? "")) errors[n] = "Pilihan tidak valid.";
  }
  if (id && !UUID_RE.test(id)) return { status: "error", message: "ID berita tidak valid.", nonce };

  const status = intent === "publish" ? "published" : (values.status ?? "draft");
  if (!STATUSES.includes(status)) errors.status = "Status tidak valid.";
  values.status = status;

  let publishedAt: string | null = null;
  if (values.published_at) {
    publishedAt = fromJakartaInput(values.published_at);
    if (!publishedAt) errors.published_at = "Tanggal tidak valid.";
  }

  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Periksa kembali isian yang ditandai.", fieldErrors: errors, values, nonce };
  }

  const payload: Record<string, string | boolean | null> = {
    title: values.title ?? "",
    slug: values.slug ?? "",
    excerpt: values.excerpt || null,
    content,
    cover_media_id: values.cover_media_id || null,
    category_id: values.category_id || null,
    is_featured: values.is_featured === "on",
    author_name: values.author_name || null,
    status,
    published_at: publishedAt,
    seo_title: values.seo_title || null,
    seo_description: values.seo_description || null,
  };

  const supabase = await createClient();
  let newId = id;

  if (id) {
    const { data, error } = await supabase.from("news").update(payload).eq("id", id).select("id");
    if (error) {
      if (error.code === "23505") {
        return { status: "error", message: "Slug sudah dipakai berita lain.", fieldErrors: { slug: "Slug sudah dipakai." }, values, nonce };
      }
      return { status: "error", message: `Gagal menyimpan: ${error.message}`, values, nonce };
    }
    if (!data?.length) return { status: "error", message: "Berita tidak ditemukan atau tidak ada hak akses.", values, nonce };
  } else {
    const { data, error } = await supabase.from("news").insert(payload).select("id").single();
    if (error) {
      if (error.code === "23505") {
        return { status: "error", message: "Slug sudah dipakai berita lain.", fieldErrors: { slug: "Slug sudah dipakai." }, values, nonce };
      }
      return { status: "error", message: `Gagal menyimpan: ${error.message}`, values, nonce };
    }
    newId = String(data.id);
  }

  const rv = await revalidateWeb();
  if (!id) redirect(`/konten/berita/${newId}?tersimpan=1`);

  return {
    status: "ok",
    message: rv.ok
      ? "Tersimpan. Website sudah diperbarui."
      : "Tersimpan. Website akan ikut berubah dalam sekitar 5 menit.",
    values,
    nonce,
  };
}

export async function deleteNews(id: string): Promise<{ error: string } | void> {
  if (!(await getCurrentStaff())) return { error: "Sesi berakhir. Masuk kembali." };
  if (!UUID_RE.test(id)) return { error: "ID berita tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("news").delete().eq("id", id).select("id");
  if (error) return { error: `Gagal menghapus: ${error.message}` };
  if (!data?.length) return { error: "Berita tidak ditemukan atau tidak ada hak akses." };

  await revalidateWeb();
  redirect("/konten/berita");
}
