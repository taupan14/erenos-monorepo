import { notFound } from "next/navigation";
import { EntityForm } from "@/components/content/EntityForm";
import { GalleryItems, type GalleryItem } from "@/components/gallery/GalleryItems";
import { CARD } from "@/components/ui/form";
import { entityDef, initialLists, initialValues } from "@/lib/content-config";
import { UUID_RE } from "@/lib/media";
import { getPickedMedia } from "@/lib/media-server";
import { createClient } from "@/lib/supabase/server";

type Entity = "hero" | "facility" | "gallery";

const TEXT: Record<Entity, { back: string; add: string; edit: string; cover: string }> = {
  hero: { back: "← Hero Beranda", add: "Tambah slide", edit: "Ubah slide", cover: "Foto latar" },
  facility: { back: "← Fasilitas", add: "Tambah fasilitas", edit: "Ubah fasilitas", cover: "Foto fasilitas" },
  gallery: { back: "← Galeri", add: "Tambah album", edit: "Ubah album", cover: "Foto sampul" },
};

/** Halaman tambah/ubah untuk Hero, Fasilitas, dan Galeri (berbasis id). */
export async function RecordEditorPage({ entity, id, saved }: { entity: Entity; id?: string; saved?: boolean }) {
  const def = entityDef(entity, "");
  if (!def) notFound();
  const t = TEXT[entity];

  let row: Record<string, unknown> = {};
  const supabase = await createClient();
  if (id) {
    if (!UUID_RE.test(id)) notFound();
    const { data } = await supabase.from(def.table).select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    row = data;
  }

  let items: GalleryItem[] = [];
  if (entity === "gallery" && id) {
    const { data } = await supabase
      .from("gallery_items")
      .select("id, caption, caption_en, sort_order, media:media!media_id(path, alt_text)")
      .eq("gallery_id", id)
      .order("sort_order");
    items = ((data ?? []) as unknown as {
      id: string;
      caption: string | null;
      caption_en: string | null;
      media: { path: string; alt_text: string | null } | null;
    }[])
      .filter((r) => r.media)
      .map((r) => ({
        id: r.id,
        path: r.media?.path ?? "",
        alt: r.media?.alt_text ?? "",
        caption: r.caption ?? "",
        caption_en: r.caption_en ?? "",
      }));
  }

  return (
    <>
      <EntityForm
        entity={entity}
        recordKey={id ?? ""}
        heading={id ? t.edit : t.add}
        backHref={def.base}
        backLabel={t.back}
        cols={def.cols}
        metaCols={def.metaCols}
        lists={def.lists}
        values={id ? initialValues(def, row) : {}}
        initialLists={id ? initialLists(def, row) : {}}
        status={String(row.status ?? "draft")}
        cover={await getPickedMedia(supabase, row[def.coverCol])}
        coverLabel={t.cover}
        coverField={def.coverCol}
        gallery={null}
        enMissing={0}
        canDelete={Boolean(id)}
        saved={saved}
      />
      {entity === "gallery" &&
        (id ? (
          <GalleryItems galleryId={id} items={items} />
        ) : (
          <div className={`${CARD} mt-4 text-sm text-muted`}>Simpan album dulu, lalu tambahkan foto di sini.</div>
        ))}
    </>
  );
}
