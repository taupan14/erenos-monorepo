"use client";

import { useState } from "react";
import { BTN_OUTLINE, CARD, INPUT } from "@/components/ui/form";
import type { ListSpec, Row } from "@/lib/content-config";

/** Daftar butir yang bisa ditambah, diurutkan, dan dihapus. Nilainya dikirim sebagai JSON di <input hidden>. */
export function ListEditor({ spec, initial, error }: { spec: ListSpec; initial: Row[]; error?: string }) {
  const [rows, setRows] = useState<Row[]>(initial);

  const set = (i: number, k: string, v: string) =>
    setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const move = (i: number, d: number) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const c = [...r];
      [c[i], c[j]] = [c[j] as Row, c[i] as Row];
      return c;
    });

  return (
    <section className={CARD} aria-label={spec.label}>
      <input type="hidden" name={`list__${spec.key}`} value={JSON.stringify(rows)} />
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">{spec.label}</h2>
        <span className="text-xs text-muted">
          {rows.length} / {spec.max}
        </span>
      </div>
      {spec.hint && <p className="mb-3 text-sm text-muted">{spec.hint}</p>}
      {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

      <ol className="space-y-3">
        {rows.map((row, i) => (
          <li key={i} className="rounded-xl border border-line p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">
                {spec.itemLabel} {i + 1}
              </span>
              <div className="flex gap-1.5">
                <button type="button" className={`${BTN_OUTLINE} !h-8 !px-2.5`} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Naikkan ${spec.itemLabel} ${i + 1}`}>
                  ↑
                </button>
                <button type="button" className={`${BTN_OUTLINE} !h-8 !px-2.5`} disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Turunkan ${spec.itemLabel} ${i + 1}`}>
                  ↓
                </button>
                <button type="button" className="px-2 text-sm font-semibold text-red-700 underline" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}>
                  Hapus
                </button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {spec.fields.map((f) => {
                const id = `${spec.key}-${i}-${f.key}`;
                const val = row[f.key] ?? "";
                return (
                  <div key={f.key}>
                    <label htmlFor={id} className="text-xs font-medium text-muted">
                      {f.label}
                    </label>
                    {f.kind === "textarea" ? (
                      <textarea id={id} rows={3} maxLength={f.max} value={val} onChange={(e) => set(i, f.key, e.target.value)} className={`${INPUT} mt-1 h-auto py-2`} />
                    ) : f.kind === "select" ? (
                      <select id={id} value={val} onChange={(e) => set(i, f.key, e.target.value)} className={`${INPUT} mt-1`}>
                        <option value="">(tanpa ikon)</option>
                        {(f.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input id={id} maxLength={f.max} value={val} onChange={(e) => set(i, f.key, e.target.value)} className={`${INPUT} mt-1`} />
                    )}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <button type="button" disabled={rows.length >= spec.max} className={`${BTN_OUTLINE} mt-3`} onClick={() => setRows((r) => [...r, {}])}>
        + Tambah {spec.itemLabel.toLowerCase()}
      </button>
    </section>
  );
}
