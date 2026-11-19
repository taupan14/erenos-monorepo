import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewsForm } from "@/components/news/NewsForm";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tulis berita" };

export default async function NewNewsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");

  const supabase = await createClient();
  const { data } = await supabase.from("news_categories").select("id, name").order("sort_order");

  return <NewsForm initial={null} categories={data ?? []} defaultAuthor={staff.fullName} />;
}
