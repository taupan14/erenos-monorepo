import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EntityForm } from "@/components/content/EntityForm";
import { PageHead } from "@/components/ui/form";
import { countEnMissing, initialLists, initialValues, pageDef, PAGE_ORDER } from "@/lib/content-config";
import { getPickedMedia } from "@/lib/media-server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ubah halaman" };

export default async function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = pageDef(slug);
  if (!def) notFound();

  const supabase = await createClient();
  const { data: row, error } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
  if (error || !row) {
    return (
      <>
        <PageHead title="Ubah halaman" />
        <p className="text-sm text-red-700">
          {error ? `Gagal memuat: ${error.message}` : "Halaman belum ada di database. Jalankan supabase/seed.sql di SQL Editor."}
        </p>
      </>
    );
  }

  const values = initialValues(def, row);
  const title = PAGE_ORDER.find((p) => p.slug === slug)?.title ?? slug;

  return (
    <EntityForm
      entity="page"
      slug={slug}
      heading={`Ubah halaman: ${title}`}
      backHref="/konten/halaman"
      backLabel="← Halaman statis"
      cols={def.cols}
      metaCols={def.metaCols}
      lists={def.lists}
      values={values}
      initialLists={initialLists(def, row)}
      status={String(row.status ?? "draft")}
      cover={await getPickedMedia(supabase, row.cover_media_id)}
      coverLabel={slug === "sambutan-kepala-sekolah" ? "Foto kepala sekolah" : "Foto sampul"}
      gallery={null}
      enMissing={countEnMissing(def, (n) => values[n] ?? "")}
    />
  );
}
