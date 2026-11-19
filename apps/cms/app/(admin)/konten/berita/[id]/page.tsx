import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { NewsForm, type NewsInitial } from "@/components/news/NewsForm";
import { getCurrentStaff } from "@/lib/auth";
import { toJakartaInput } from "@/lib/datetime";
import { UUID_RE } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ubah berita" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tersimpan?: string }>;
};

export default async function EditNewsPage({ params, searchParams }: Props) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");

  const { id } = await params;
  const { tersimpan } = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: row }, { data: cats }] = await Promise.all([
    supabase.from("news").select("*").eq("id", id).maybeSingle(),
    supabase.from("news_categories").select("id, name").order("sort_order"),
  ]);
  if (!row) notFound();

  let cover: NewsInitial["cover"] = null;
  if (row.cover_media_id) {
    const { data } = await supabase.from("media").select("id, path, alt_text").eq("id", row.cover_media_id).maybeSingle();
    if (data) cover = { id: String(data.id), path: String(data.path), alt_text: data.alt_text ?? null };
  }

  const initial: NewsInitial = {
    id,
    title: row.title ?? "",
    slug: row.slug ?? "",
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    cover,
    category_id: row.category_id ?? "",
    is_featured: Boolean(row.is_featured),
    author_name: row.author_name ?? "",
    status: row.status ?? "draft",
    published_at: toJakartaInput(row.published_at),
    seo_title: row.seo_title ?? "",
    seo_description: row.seo_description ?? "",
  };

  return <NewsForm initial={initial} categories={cats ?? []} defaultAuthor={staff.fullName} saved={tersimpan === "1"} />;
}
