"use client";

import { useState } from "react";
import { BTN_OUTLINE } from "@/components/ui/form";
import { mediaPublicUrl } from "@/lib/media";
import { MediaPickDialog, type PickedMedia } from "./MediaPickDialog";

export type { PickedMedia } from "./MediaPickDialog";

/** Memilih satu gambar dari pustaka Media. Nilainya dikirim lewat <input type="hidden" name={name}>. */
export function MediaPicker({ name, initial }: { name: string; initial: PickedMedia | null }) {
  const [sel, setSel] = useState<PickedMedia | null>(initial);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <input type="hidden" name={name} value={sel?.id ?? ""} />
      <div className="flex items-center gap-4">
        {sel ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaPublicUrl(sel.path)}
            alt=""
            className="h-24 w-24 rounded-lg border border-line bg-soft object-contain"
          />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-lg border border-dashed border-line bg-soft text-xs text-muted">
            Belum dipilih
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BTN_OUTLINE} onClick={() => setOpen(true)}>
            {sel ? "Ganti" : "Pilih gambar"}
          </button>
          {sel && (
            <button type="button" className={BTN_OUTLINE} onClick={() => setSel(null)}>
              Hapus pilihan
            </button>
          )}
        </div>
      </div>
      <MediaPickDialog
        open={open}
        onClose={() => setOpen(false)}
        onPick={(m) => {
          setSel(m);
          setOpen(false);
        }}
      />
    </div>
  );
}
