"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addGalleryItems,
  removeGalleryItem,
  reorderGalleryItems,
  updateGalleryItem,
} from "@/app/(admin)/konten/galeri/actions";
import type { Result } from "@/app/(admin)/konten/actions";
import { MediaPickDialog } from "@/components/media/MediaPickDialog";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";
import { mediaPublicUrl } from "@/lib/media";

export type GalleryItem = { id: string; path: string; alt: string; caption: string; caption_en: string };

function ItemCard({
  item,
  index,
  total,
  busy,
  run,
  move,
}: {
  item: GalleryItem;
  index: number;
  total: number;
  busy: boolean;
  run: (fn: () => Promise<Result>) => void;
  move: (i: number, d: number) => void;
}) {
  const [cap, setCap] = useState(item.caption);
  const [capEn, setCapEn] = useState(item.caption_en);
  return (
    <li className="rounded-xl border border-line p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaPublicUrl(item.path)} alt={item.alt} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />
      <label htmlFor={`cap-${item.id}`} className="mt-2 block text-xs font-medium text-muted">
        Keterangan (Indonesia)
      </label>
      <input id={`cap-${item.id}`} value={cap} maxLength={300} onChange={(e) => setCap(e.target.value)} className={`${INPUT} mt-1`} />
      <label htmlFor={`cape-${item.id}`} className="mt-2 block text-xs font-medium text-muted">
        Caption (English)
      </label>
      <input id={`cape-${item.id}`} value={capEn} maxLength={300} onChange={(e) => setCapEn(e.target.value)} className={`${INPUT} mt-1`} />
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button type="button" disabled={busy || index === 0} className={`${BTN_OUTLINE} !h-9 !px-2.5`} onClick={() => move(index, -1)} aria-label="Geser ke depan">
          ←
        </button>
        <button type="button" disabled={busy || index === total - 1} className={`${BTN_OUTLINE} !h-9 !px-2.5`} onClick={() => move(index, 1)} aria-label="Geser ke belakang">
          →
        </button>
        <button type="button" disabled={busy} className={`${BTN_OUTLINE} !h-9 !px-3`} onClick={() => run(() => updateGalleryItem(item.id, cap, capEn))}>
          Simpan
        </button>
        <button
          type="button"
          disabled={busy}
          className="ml-auto px-1 text-sm font-semibold text-red-700 underline disabled:opacity-60"
          onClick={() => {
            if (window.confirm("Keluarkan foto ini dari album? Berkasnya tetap ada di Media.")) run(() => removeGalleryItem(item.id));
          }}
        >
          Keluarkan
        </button>
      </div>
    </li>
  );
}

/** Pengelola foto dalam satu album. Perubahan langsung tersimpan (tidak ikut tombol Simpan formulir album). */
export function GalleryItems({ galleryId, items }: { galleryId: string; items: GalleryItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? null : r.error);
      if (r.ok) router.refresh();
    });

  const move = (i: number, d: number) => {
    const ids = items.map((x) => x.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j] as string, ids[i] as string];
    run(() => reorderGalleryItems(galleryId, ids));
  };

  return (
    <section className={`${CARD} mt-4`} aria-label="Foto dalam album">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Foto dalam album ({items.length})</h2>
        <button type="button" className={BTN_PRIMARY} onClick={() => setOpen(true)}>
          + Tambah foto
        </button>
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-red-700">
        {msg}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Belum ada foto. Pilih dari pustaka Media; satu berkas hanya bisa masuk satu kali per album.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <ItemCard key={it.id} item={it} index={i} total={items.length} busy={pending} run={run} move={move} />
          ))}
        </ul>
      )}
      <MediaPickDialog
        open={open}
        multiple
        onClose={() => setOpen(false)}
        onPickMany={(ms) => {
          setOpen(false);
          run(() => addGalleryItems(galleryId, ms.map((m) => m.id)));
        }}
      />
    </section>
  );
}
