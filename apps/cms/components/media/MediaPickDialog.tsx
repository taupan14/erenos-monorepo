"use client";

import { useEffect, useRef, useState } from "react";
import { BTN_OUTLINE, BTN_PRIMARY } from "@/components/ui/form";
import { mediaPublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

export type PickedMedia = { id: string; path: string; alt_text: string | null };

/**
 * Dialog pemilih gambar dari pustaka Media.
 * Satu gambar: onPick. Beberapa gambar (multiple): onPickMany.
 */
export function MediaPickDialog({
  open,
  onClose,
  onPick,
  onPickMany,
  multiple = false,
}: {
  open: boolean;
  onClose: () => void;
  onPick?: (m: PickedMedia) => void;
  onPickMany?: (m: PickedMedia[]) => void;
  multiple?: boolean;
}) {
  const [items, setItems] = useState<PickedMedia[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    if (!open) setChosen([]);
  }, [open]);

  useEffect(() => {
    if (!open || items) return;
    void createClient()
      .from("media")
      .select("id, path, alt_text")
      .like("mime_type", "image/%")
      .order("created_at", { ascending: false })
      .limit(80)
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setItems((data ?? []) as PickedMedia[]);
      });
  }, [open, items]);

  const toggle = (id: string) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <dialog
      ref={dlg}
      onClose={onClose}
      aria-label="Pilih gambar"
      className="m-auto w-[min(900px,92vw)] rounded-2xl border border-line p-0 backdrop:bg-deep/50"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line p-4">
        <h2 className="font-semibold">{multiple ? "Pilih beberapa gambar" : "Pilih gambar"}</h2>
        <div className="flex gap-2">
          {multiple && (
            <button
              type="button"
              disabled={chosen.length === 0}
              className={BTN_PRIMARY}
              onClick={() => onPickMany?.((items ?? []).filter((i) => chosen.includes(i.id)))}
            >
              Tambahkan {chosen.length || ""} foto
            </button>
          )}
          <button type="button" className={BTN_OUTLINE} onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-4">
        {error && <p className="text-sm text-red-700">Gagal memuat media: {error}</p>}
        {!error && !items && <p className="text-sm text-muted">Memuat…</p>}
        {items && items.length === 0 && <p className="text-sm text-muted">Belum ada gambar. Unggah dulu di menu Media.</p>}
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {(items ?? []).map((it) => {
            const on = chosen.includes(it.id);
            return (
              <li key={it.id}>
                <button
                  type="button"
                  aria-pressed={multiple ? on : undefined}
                  onClick={() => (multiple ? toggle(it.id) : onPick?.(it))}
                  className={`block w-full overflow-hidden rounded-lg border hover:ring-2 hover:ring-primary ${on ? "border-accent ring-2 ring-accent" : "border-line"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaPublicUrl(it.path)} alt={it.alt_text ?? ""} loading="lazy" className="aspect-square w-full object-cover" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}
