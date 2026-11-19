import type { Metadata } from "next";
import Link from "next/link";
import { CategoryManager } from "@/components/news/CategoryManager";
import { PageHead } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kategori berita" };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_categories")
    .select("id, slug, name, name_en")
    .order("sort_order");

  return (
    <>
      <PageHead
        title="Kategori berita"
        subtitle="Slug dibuat dari nama saat kategori ditambah dan tidak berubah setelahnya."
        actions={
          <Link href="/konten/berita" className="text-sm font-semibold text-primary underline">
            ← Kembali ke berita
          </Link>
        }
      />
      {error ? (
        <p className="text-sm text-red-700">Gagal memuat kategori: {error.message}</p>
      ) : (
        <CategoryManager
          categories={(data ?? []).map((c) => ({
            id: String(c.id),
            slug: String(c.slug),
            name: String(c.name),
            name_en: c.name_en ? String(c.name_en) : null,
          }))}
        />
      )}
    </>
  );
}
