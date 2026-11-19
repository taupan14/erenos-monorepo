"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CONTENT_STATUSES, CONTENT_STATUS_LABEL } from "@erenos/shared";
import {
  deleteRequirement,
  reorderRequirements,
  saveRequirement,
} from "@/app/(admin)/admisi/actions";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";
import { LEVELS, type Result } from "@/lib/admission";

export type RequirementItem = {
  /** Judul Indonesia lama; null untuk baris baru. */
  key: string | null;
  title: string;
  title_en: string;
  levels: string[];
  status: string;
};

const BLANK: RequirementItem = {
  key: null,
  title: "",
  title_en: "",
  levels: LEVELS.map((l) => l.code),
  status: "published",
};

function Row({
  item,
  index,
  total,
  busy,
  run,
  move,
}: {
  item: RequirementItem;
  index: number;
  total: number;
  busy: boolean;
  run: (fn: () => Promise<Result>, ok?: () => void) => void;
  move: (i: number, d: number) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [titleEn, setTitleEn] = useState(item.title_en);
  const [levels, setLevels] = useState<string[]>(item.levels);
  const [status, setStatus] = useState(item.status);
  const isNew = item.key === null;
  const toggle = (code: string) =>
    setLevels((l) =>
      l.includes(code) ? l.filter((x) => x !== code) : [...l, code],
    );

  return (
    <li className="rounded-xl border border-line p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor={`rt-${index}-${isNew ? "n" : "e"}`}
            className="text-xs font-medium text-muted"
          >
            Persyaratan (Indonesia)
          </label>
          <input
            id={`rt-${index}-${isNew ? "n" : "e"}`}
            className={`${INPUT} mt-1`}
            value={title}
            maxLength={150}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor={`rte-${index}-${isNew ? "n" : "e"}`}
            className="text-xs font-medium text-muted"
          >
            Requirement (English)
          </label>
          <input
            id={`rte-${index}-${isNew ? "n" : "e"}`}
            className={`${INPUT} mt-1`}
            value={titleEn}
            maxLength={150}
            onChange={(e) => setTitleEn(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <fieldset className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <legend className="sr-only">Berlaku untuk jenjang</legend>
          {LEVELS.map((l) => (
            <label
              key={l.code}
              className="flex items-center gap-2 text-sm font-medium"
            >
              <input
                type="checkbox"
                checked={levels.includes(l.code)}
                onChange={() => toggle(l.code)}
                className="h-5 w-5 accent-primary"
              />
              {l.short}
            </label>
          ))}
        </fieldset>
        <select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`${INPUT} !h-9 !w-auto`}
        >
          {CONTENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CONTENT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {!isNew && (
            <>
              <button
                type="button"
                disabled={busy || index === 0}
                className={`${BTN_OUTLINE} !h-9 !px-2.5`}
                onClick={() => move(index, -1)}
                aria-label={`Naikkan ${item.title}`}
              >
                ↑
              </button>
              <button
                type="button"
                disabled={busy || index === total - 1}
                className={`${BTN_OUTLINE} !h-9 !px-2.5`}
                onClick={() => move(index, 1)}
                aria-label={`Turunkan ${item.title}`}
              >
                ↓
              </button>
            </>
          )}
          <button
            type="button"
            disabled={busy}
            className={`${BTN_PRIMARY} !h-9 !px-4`}
            onClick={() =>
              run(
                () =>
                  saveRequirement({
                    oldTitle: item.key,
                    title,
                    titleEn,
                    levels,
                    status,
                  }),
                isNew
                  ? () => (
                      setTitle(""),
                      setTitleEn(""),
                      setLevels(BLANK.levels)
                    )
                  : undefined,
              )
            }
          >
            {isNew ? "Tambah" : "Simpan"}
          </button>
          {!isNew && (
            <button
              type="button"
              disabled={busy}
              className="px-1 text-sm font-semibold text-red-700 underline disabled:opacity-60"
              onClick={() => {
                if (window.confirm(`Hapus persyaratan "${item.title}"?`))
                  run(() => deleteRequirement(item.key as string));
              }}
            >
              Hapus
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/** Matriks persyaratan: satu baris per dokumen; centang jenjang yang mewajibkannya. */
export function RequirementEditor({ items }: { items: RequirementItem[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = (fn: () => Promise<Result>, ok?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? null : r.error);
      if (r.ok) {
        ok?.();
        router.refresh();
      }
    });

  const move = (i: number, d: number) => {
    const titles = items.map((x) => x.key as string);
    const j = i + d;
    if (j < 0 || j >= titles.length) return;
    [titles[i], titles[j]] = [titles[j] as string, titles[i] as string];
    run(() => reorderRequirements(titles));
  };

  return (
    <section className={CARD} aria-label="Persyaratan">
      <p className="mb-4 text-sm text-muted">
        Jika keempat jenjang dicentang, persyaratan berlaku untuk semua jenjang.
        Judul tidak boleh sama dengan persyaratan lain.
      </p>
      <p
        role="status"
        aria-live="polite"
        className="mb-3 min-h-5 text-sm text-red-700"
      >
        {msg}
      </p>
      <ul className="space-y-3">
        {items.map((it, i) => (
          <Row
            key={it.key}
            item={it}
            index={i}
            total={items.length}
            busy={pending}
            run={run}
            move={move}
          />
        ))}
      </ul>
      <h2 className="mb-3 mt-6 text-sm font-semibold">Tambah persyaratan</h2>
      <ul>
        <Row
          item={BLANK}
          index={items.length}
          total={items.length}
          busy={pending}
          run={run}
          move={move}
        />
      </ul>
    </section>
  );
}
