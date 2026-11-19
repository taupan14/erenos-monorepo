"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CONTENT_STATUS_LABEL, type ContentStatus } from "@erenos/shared";
import { reorderAdmissionItems } from "@/app/(admin)/admisi/actions";
import { BTN_OUTLINE, CARD } from "@/components/ui/form";

export type AdmissionRow = {
  id: string;
  title: string;
  body: string;
  status: string;
};

/** Daftar berurutan (tahap, FAQ, catatan): tombol ↑↓ mengubah urutan tampil di website. */
export function AdmissionList({
  section,
  rows,
}: {
  section: string;
  rows: AdmissionRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const move = (i: number, d: number) => {
    const ids = rows.map((r) => r.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j] as string, ids[i] as string];
    start(async () => {
      const r = await reorderAdmissionItems(section, ids);
      if (r.ok) {
        setErr(null);
        router.refresh();
      } else setErr(r.error);
    });
  };

  if (rows.length === 0)
    return (
      <div className={`${CARD} text-sm text-muted`}>
        Belum ada data. Tambahkan yang pertama.
      </div>
    );

  return (
    <>
      {err && <p className="mb-3 text-sm text-red-700">{err}</p>}
      <ol className={`${CARD} divide-y divide-line py-1`}>
        {rows.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 py-3 text-sm">
            <span className="w-6 text-center text-muted">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/admisi/${r.id}`}
                className="block truncate font-semibold hover:underline"
              >
                {r.title}
              </Link>
              {r.body && (
                <span className="block truncate text-xs text-muted">
                  {r.body}
                </span>
              )}
            </div>
            <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-primary">
              {CONTENT_STATUS_LABEL[r.status as ContentStatus] ?? r.status}
            </span>
            <button
              type="button"
              disabled={pending || i === 0}
              className={`${BTN_OUTLINE} !h-9 !px-2.5`}
              onClick={() => move(i, -1)}
              aria-label={`Naikkan ${r.title}`}
            >
              ↑
            </button>
            <button
              type="button"
              disabled={pending || i === rows.length - 1}
              className={`${BTN_OUTLINE} !h-9 !px-2.5`}
              onClick={() => move(i, 1)}
              aria-label={`Turunkan ${r.title}`}
            >
              ↓
            </button>
            <Link
              href={`/admisi/${r.id}`}
              className={`${BTN_OUTLINE} !h-9 !px-3`}
            >
              Ubah
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
