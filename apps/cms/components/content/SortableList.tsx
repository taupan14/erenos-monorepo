"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CONTENT_STATUS_LABEL, type ContentStatus } from "@erenos/shared";
import { reorderRecords } from "@/app/(admin)/konten/actions";
import { BTN_OUTLINE, CARD } from "@/components/ui/form";

export type SortItem = { id: string; title: string; sub?: string; status: string; thumb: string | null };

/** Daftar berurutan: tombol ↑↓ mengubah urutan tampil di website. */
export function SortableList({ entity, items, editBase }: { entity: string; items: SortItem[]; editBase: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const move = (i: number, d: number) => {
    const ids = items.map((x) => x.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j] as string, ids[i] as string];
    start(async () => {
      const r = await reorderRecords(entity, ids);
      if (r.ok) {
        setErr(null);
        router.refresh();
      } else setErr(r.error);
    });
  };

  if (items.length === 0) return <div className={`${CARD} text-sm text-muted`}>Belum ada data. Tambahkan yang pertama.</div>;

  return (
    <>
      {err && <p className="mb-3 text-sm text-red-700">{err}</p>}
      <ol className={`${CARD} divide-y divide-line py-1`}>
        {items.map((it, i) => (
          <li key={it.id} className="flex items-center gap-3 py-3 text-sm">
            <span className="w-6 text-center text-muted">{i + 1}</span>
            {it.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.thumb} alt="" loading="lazy" className="h-10 w-14 shrink-0 rounded object-cover" />
            ) : (
              <div className="h-10 w-14 shrink-0 rounded bg-soft" />
            )}
            <div className="min-w-0 flex-1">
              <Link href={`${editBase}/${it.id}`} className="block truncate font-semibold hover:underline">
                {it.title}
              </Link>
              {it.sub && <span className="block truncate text-xs text-muted">{it.sub}</span>}
            </div>
            <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-primary">
              {CONTENT_STATUS_LABEL[it.status as ContentStatus] ?? it.status}
            </span>
            <button type="button" disabled={pending || i === 0} className={`${BTN_OUTLINE} !h-9 !px-2.5`} onClick={() => move(i, -1)} aria-label={`Naikkan ${it.title}`}>
              ↑
            </button>
            <button type="button" disabled={pending || i === items.length - 1} className={`${BTN_OUTLINE} !h-9 !px-2.5`} onClick={() => move(i, 1)} aria-label={`Turunkan ${it.title}`}>
              ↓
            </button>
            <Link href={`${editBase}/${it.id}`} className={`${BTN_OUTLINE} !h-9 !px-3`}>
              Ubah
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
