"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_BUCKET, slugify } from "@erenos/shared";
import { deleteMedia, registerMedia, updateMediaAlt } from "@/app/(admin)/media/actions";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";
import {
  MAX_MEDIA_BYTES,
  MEDIA_EXT,
  MEDIA_MIME,
  formatBytes,
  mediaPublicUrl,
  type MediaItem,
} from "@/lib/media";
import { createClient } from "@/lib/supabase/client";

type Up = { key: string; name: string; state: "proses" | "selesai" | "gagal"; error?: string };

/** Mengunggah satu berkas: validasi → Storage → catat di tabel media. Mengembalikan pesan galat, atau null. */
async function uploadFile(file: File): Promise<string | null> {
  if (!(MEDIA_MIME as readonly string[]).includes(file.type)) {
    return "Tipe berkas tidak didukung (JPEG, PNG, WebP, AVIF, GIF, PDF).";
  }
  if (file.size > MAX_MEDIA_BYTES) return "Ukuran melebihi 10 MB.";

  let width: number | null = null;
  let height: number | null = null;
  if (file.type.startsWith("image/")) {
    try {
      const bmp = await createImageBitmap(file);
      width = bmp.width;
      height = bmp.height;
      bmp.close();
    } catch {
      // dimensi opsional
    }
  }

  const now = new Date();
  const dot = file.name.lastIndexOf(".");
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name, 60) || "berkas";
  const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}-${base}.${MEDIA_EXT[file.type]}`;

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) return `Gagal mengunggah: ${error.message}`;

  const res = await registerMedia({
    path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    width,
    height,
  });
  if (!res.ok) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    return res.error;
  }
  return null;
}

function MediaDetail({ item, onGone }: { item: MediaItem; onGone: () => void }) {
  const router = useRouter();
  const [alt, setAlt] = useState(item.alt_text);
  const [altEn, setAltEn] = useState(item.alt_text_en);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const isImage = item.mime_type.startsWith("image/");

  return (
    <div className={CARD}>
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaPublicUrl(item.path)}
          alt={item.alt_text}
          className="h-40 w-full rounded-lg bg-soft object-contain"
        />
      ) : (
        <div className="grid h-40 place-items-center rounded-lg bg-soft font-semibold text-primary">PDF</div>
      )}
      <p className="mt-3 break-all font-semibold">{item.file_name}</p>
      <p className="mb-4 text-sm text-muted">
        {item.width && item.height ? `${item.width} × ${item.height} · ` : ""}
        {formatBytes(item.size_bytes)}
      </p>
      <label htmlFor="alt-id" className="text-sm font-medium">
        Teks alternatif (Indonesia)
      </label>
      <input id="alt-id" className={`${INPUT} mb-3 mt-1`} value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} />
      <label htmlFor="alt-en" className="text-sm font-medium">
        Alt text (English)
      </label>
      <input id="alt-en" className={`${INPUT} mb-4 mt-1`} value={altEn} maxLength={300} onChange={(e) => setAltEn(e.target.value)} />
      <p role="status" aria-live="polite" className={`min-h-5 text-sm ${msg?.ok ? "text-green-700" : "text-red-700"}`}>
        {msg?.text}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={pending}
          className={BTN_PRIMARY}
          onClick={() =>
            start(async () => {
              const r = await updateMediaAlt(item.id, alt, altEn);
              setMsg(r.ok ? { ok: true, text: "Tersimpan." } : { ok: false, text: r.error });
              if (r.ok) router.refresh();
            })
          }
        >
          Simpan
        </button>
        <button
          type="button"
          disabled={pending}
          className={BTN_OUTLINE}
          onClick={() => {
            if (!window.confirm("Hapus berkas ini? Foto yang memakainya di website akan kembali ke placeholder.")) return;
            start(async () => {
              const r = await deleteMedia(item.id);
              if (!r.ok) return setMsg({ ok: false, text: r.error });
              onGone();
              router.refresh();
            });
          }}
        >
          Hapus
        </button>
      </div>
    </div>
  );
}

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ups, setUps] = useState<Up[]>([]);
  const [drag, setDrag] = useState(false);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  async function handleFiles(files: File[]) {
    const batch: Up[] = files.map((f) => ({ key: crypto.randomUUID(), name: f.name, state: "proses" }));
    setUps((prev) => [...batch, ...prev].slice(0, 20));
    for (const [i, file] of files.entries()) {
      const key = batch[i]?.key;
      const err = await uploadFile(file);
      setUps((prev) =>
        prev.map((u): Up =>
          u.key !== key ? u : err ? { ...u, state: "gagal", error: err } : { ...u, state: "selesai" },
        ),
      );
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-[3]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void handleFiles(Array.from(e.dataTransfer.files));
          }}
          className={`mb-4 rounded-2xl border-2 border-dashed p-6 text-center text-sm text-muted ${drag ? "border-primary bg-white" : "border-line"}`}
        >
          Seret berkas ke sini · JPEG, PNG, WebP, AVIF, GIF, PDF · maks. 10 MB
          <div className="mt-3">
            <button type="button" className={BTN_PRIMARY} onClick={() => inputRef.current?.click()}>
              Pilih berkas
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={MEDIA_MIME.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              void handleFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>

        {ups.length > 0 && (
          <ul aria-live="polite" className={`${CARD} mb-4 space-y-1.5 text-sm`}>
            {ups.map((u) => (
              <li key={u.key} className="flex justify-between gap-3">
                <span className="truncate">{u.name}</span>
                <span className={u.state === "gagal" ? "text-red-700" : u.state === "selesai" ? "text-green-700" : "text-muted"}>
                  {u.state === "proses" ? "Mengunggah…" : u.state === "selesai" ? "Selesai" : u.error}
                </span>
              </li>
            ))}
          </ul>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted">Belum ada berkas.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  aria-pressed={it.id === selectedId}
                  onClick={() => setSelectedId(it.id)}
                  className={`block w-full overflow-hidden rounded-xl border bg-white text-left ${it.id === selectedId ? "border-accent ring-2 ring-accent" : "border-line hover:border-primary"}`}
                >
                  {it.mime_type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaPublicUrl(it.path)} alt={it.alt_text} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <div className="grid aspect-[4/3] place-items-center bg-soft font-semibold text-primary">PDF</div>
                  )}
                  <span className="block truncate px-3 py-2 text-xs text-muted">{it.file_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-full lg:sticky lg:top-24 lg:w-80 lg:shrink-0">
        {selected ? (
          <MediaDetail key={selected.id} item={selected} onGone={() => setSelectedId(null)} />
        ) : (
          <div className={`${CARD} text-sm text-muted`}>Pilih satu berkas untuk melihat detail dan mengubah teks alternatif.</div>
        )}
      </div>
    </div>
  );
}
