import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ACADEMIC_LEVELS } from "@erenos/shared";
import { EntityForm } from "@/components/content/EntityForm";
import { PageHead } from "@/components/ui/form";
import { countEnMissing, initialLists, initialValues, levelDef } from "@/lib/content-config";
import { getPickedMedia } from "@/lib/media-server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ubah jenjang" };

export default async function EditLevelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const level = ACADEMIC_LEVELS.find((l) => l.slug === slug);
  if (!level) notFound();

  const def = levelDef();
  const supabase = await createClient();
  const [{ data: row, error }, { data: galleries }] = await Promise.all([
    supabase.from("academic_levels").select("*").eq("slug", slug).maybeSingle(),
    supabase.from("galleries").select("id, title").order("created_at", { ascending: false }),
  ]);
  if (error || !row) {
    return (
      <>
        <PageHead title="Ubah jenjang" />
        <p className="text-sm text-red-700">
          {error ? `Gagal memuat: ${error.message}` : "Jenjang belum ada di database. Jalankan supabase/seed.sql di SQL Editor."}
        </p>
      </>
    );
  }

  const values = initialValues(def, row);

  return (
    <EntityForm
      entity="level"
      slug={slug}
      heading={`Ubah jenjang: ${level.shortName}`}
      backHref="/konten/jenjang"
      backLabel="← Jenjang"
      cols={def.cols}
      metaCols={def.metaCols}
      lists={def.lists}
      values={values}
      initialLists={initialLists(def, row)}
      status={String(row.status ?? "draft")}
      cover={await getPickedMedia(supabase, row.cover_media_id)}
      coverLabel="Foto sampul"
      gallery={{
        id: typeof row.gallery_id === "string" ? row.gallery_id : "",
        options: (galleries ?? []).map((g) => ({ id: String(g.id), title: String(g.title) })),
      }}
      enMissing={countEnMissing(def, (n) => values[n] ?? "")}
    />
  );
}
