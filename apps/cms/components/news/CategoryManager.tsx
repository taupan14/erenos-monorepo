"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type Result,
} from "@/app/(admin)/konten/berita/kategori/actions";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";

type Cat = { id: string; slug: string; name: string; name_en: string | null };

function Row({ cat, run, busy }: { cat: Cat; run: (fn: () => Promise<Result>) => void; busy: boolean }) {
  const [name, setName] = useState(cat.name);
  const [nameEn, setNameEn] = useState(cat.name_en ?? "");
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <input aria-label={`Nama (Indonesia) ${cat.slug}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={`${INPUT} min-w-40 flex-1`} />
      <input aria-label={`Name (English) ${cat.slug}`} value={nameEn} onChange={(e) => setNameEn(e.target.value)} maxLength={60} placeholder="English" className={`${INPUT} min-w-40 flex-1`} />
      <code className="w-32 truncate text-xs text-muted">{cat.slug}</code>
      <button type="button" disabled={busy} className={`${BTN_OUTLINE} !h-9 !px-3`} onClick={() => run(() => updateCategory(cat.id, name, nameEn))}>
        Simpan
      </button>
      <button
        type="button"
        disabled={busy}
        className="text-sm font-semibold text-red-700 underline disabled:opacity-60"
        onClick={() => {
          if (window.confirm("Hapus kategori ini? Berita di dalamnya menjadi tanpa kategori.")) run(() => deleteCategory(cat.id));
        }}
      >
        Hapus
      </button>
    </li>
  );
}

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");

  function run(fn: () => Promise<Result>, after?: () => void) {
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? null : r.error);
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <p role="status" aria-live="polite" className="min-h-5 text-sm text-red-700">
        {msg}
      </p>
      <div className={CARD}>
        <h2 className="mb-3 font-semibold">Tambah kategori</h2>
        <div className="flex flex-wrap gap-3">
          <input aria-label="Nama (Indonesia)" placeholder="Nama (Indonesia)" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={`${INPUT} min-w-48 flex-1`} />
          <input aria-label="Name (English)" placeholder="Name (English)" value={nameEn} onChange={(e) => setNameEn(e.target.value)} maxLength={60} className={`${INPUT} min-w-48 flex-1`} />
          <button
            type="button"
            disabled={pending}
            className={BTN_PRIMARY}
            onClick={() =>
              run(() => createCategory(name, nameEn), () => {
                setName("");
                setNameEn("");
              })
            }
          >
            Tambah
          </button>
        </div>
      </div>
      <div className={CARD}>
        {categories.length === 0 ? (
          <p className="text-sm text-muted">Belum ada kategori.</p>
        ) : (
          <ul className="divide-y divide-line">
            {categories.map((c) => (
              <Row key={c.id} cat={c} run={run} busy={pending} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
