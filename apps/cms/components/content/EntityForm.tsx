"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { CONTENT_STATUSES, CONTENT_STATUS_LABEL } from "@erenos/shared";
import { deleteRecord, saveEntity, type EntityState } from "@/app/(admin)/konten/actions";
import { ListEditor } from "@/components/editor/ListEditor";
import { RichEditor } from "@/components/editor/RichEditor";
import { MediaPicker, type PickedMedia } from "@/components/media/MediaPicker";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";
import type { Col, ColKind, ListSpec, Row } from "@/lib/content-config";

export type EntityFormProps = {
  entity: "page" | "level" | "hero" | "facility" | "gallery";
  /** Kunci baris: slug (halaman/jenjang). Untuk konten berbasis id, pakai recordKey. */
  slug?: string;
  /** Kunci baris (id) saat mengubah; kosong saat membuat baru. */
  recordKey?: string;
  heading: string;
  backHref: string;
  backLabel: string;
  cols: Col[];
  metaCols: Col[];
  lists: ListSpec[];
  values: Record<string, string>;
  initialLists: Record<string, Row[]>;
  status: string;
  cover: PickedMedia | null;
  coverLabel: string;
  coverField?: string;
  gallery: { id: string; options: { id: string; title: string }[] } | null;
  enMissing: number;
  canDelete?: boolean;
  saved?: boolean;
};

type Item = { name: string; label: string; kind: ColKind; rows?: number; hint?: string; required?: boolean; group?: "seo" };

export function EntityForm(p: EntityFormProps) {
  const [state, action, pending] = useActionState<EntityState, FormData>(saveEntity, {
    status: "idle",
    nonce: 0,
    enMissing: p.enMissing,
  });
  const [deleting, startDelete] = useTransition();
  const [delError, setDelError] = useState<string | null>(null);
  const [tab, setTab] = useState<"id" | "en">("id");
  const key = p.recordKey ?? p.slug ?? "";
  const hasEn = p.cols.some((c) => c.en) || p.metaCols.some((c) => c.en);
  const busy = pending || deleting;

  useEffect(() => {
    const names = Object.keys(state.fieldErrors ?? {});
    if (names.length === 0) return;
    setTab(names.some((n) => !n.endsWith("_en")) ? "id" : "en");
  }, [state]);

  const ordered: { c: Col; prefix: string }[] = [
    ...p.cols.filter((c) => c.group !== "seo").map((c) => ({ c, prefix: "" })),
    ...p.metaCols.map((c) => ({ c, prefix: "meta__" })),
    ...p.cols.filter((c) => c.group === "seo").map((c) => ({ c, prefix: "" })),
  ];
  const itemsFor = (lang: "id" | "en"): Item[] =>
    ordered.flatMap(({ c, prefix }) => {
      const base = { kind: c.kind, rows: c.rows, hint: c.hint, group: c.group };
      if (lang === "id") return [{ ...base, name: prefix + c.name, label: c.label, required: c.required }];
      return c.en ? [{ ...base, name: prefix + c.en, label: `${c.label} (English)` }] : [];
    });

  const control = (it: Item) => {
    const err = state.fieldErrors?.[it.name];
    const val = state.values?.[it.name] ?? p.values[it.name] ?? "";
    if (it.kind === "rich") return <RichEditor name={it.name} initialHtml={p.values[it.name] ?? ""} />;
    if (it.kind === "toggle") {
      return (
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            key={`${it.name}-${state.nonce}`}
            type="checkbox"
            name={it.name}
            defaultChecked={state.values ? state.values[it.name] === "on" : p.values[it.name] === "on"}
            className="h-5 w-5 accent-primary"
          />
          {it.label}
        </label>
      );
    }
    const common = {
      id: it.name,
      name: it.name,
      defaultValue: val,
      "aria-invalid": err ? (true as const) : undefined,
      "aria-describedby": err ? `${it.name}-err` : undefined,
    };
    return it.kind === "textarea" ? (
      <textarea key={`${it.name}-${state.nonce}`} rows={it.rows ?? 3} className={`${INPUT} h-auto py-2`} {...common} />
    ) : (
      <input key={`${it.name}-${state.nonce}`} type={it.kind === "date" ? "date" : "text"} className={INPUT} {...common} />
    );
  };

  const panel = (lang: "id" | "en") => {
    let seoShown = false;
    return (
      <div role="tabpanel" id={`panel-${lang}`} aria-labelledby={`tab-${lang}`} hidden={tab !== lang} className="space-y-5">
        {itemsFor(lang).map((it) => {
          const err = state.fieldErrors?.[it.name];
          const heading = it.group === "seo" && !seoShown ? ((seoShown = true), <p className="border-t border-line pt-4 text-sm font-semibold">SEO</p>) : null;
          return (
            <div key={it.name}>
              {heading}
              {it.kind !== "toggle" && (
                <label htmlFor={it.name} className="text-sm font-medium">
                  {it.label}
                  {it.required && <span className="text-red-700"> *</span>}
                </label>
              )}
              <div className={it.kind === "toggle" ? "" : "mt-1"}>{control(it)}</div>
              {it.hint && !err && <p className="mt-1 text-xs text-muted">{it.hint}</p>}
              {err && (
                <p id={`${it.name}-err`} className="mt-1 text-sm text-red-700">
                  {err}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const tabCls = (on: boolean) =>
    `border-b-[3px] px-4 py-2.5 text-sm font-semibold ${on ? "border-primary text-primary" : "border-transparent text-muted"}`;
  const coverField = p.coverField ?? "cover_media_id";
  const message = state.message ?? (p.saved ? "Berhasil dibuat." : delError ?? "");

  return (
    <form action={action}>
      <input type="hidden" name="entity" value={p.entity} />
      <input type="hidden" name="key" value={key} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <Link href={p.backHref} className="underline">
              {p.backLabel}
            </Link>
          </p>
          <h1 className="font-serif text-3xl font-semibold text-deep">{p.heading}</h1>
        </div>
        <div className="flex gap-2.5">
          <button type="submit" name="intent" value="save" disabled={busy} className={BTN_OUTLINE}>
            {pending ? "Menyimpan…" : "Simpan"}
          </button>
          <button type="submit" name="intent" value="publish" disabled={busy} className={BTN_PRIMARY}>
            Terbitkan
          </button>
        </div>
      </div>

      <p role="status" aria-live="polite" className={`mb-4 min-h-5 text-sm ${state.status === "error" || delError ? "text-red-700" : "text-green-700"}`}>
        {message}
      </p>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <div className="w-full min-w-0 space-y-4 lg:flex-[2]">
          <div className={CARD}>
            {hasEn ? (
              <div role="tablist" aria-label="Bahasa" className="mb-5 flex gap-1 border-b border-line">
                <button type="button" role="tab" id="tab-id" aria-selected={tab === "id"} aria-controls="panel-id" className={tabCls(tab === "id")} onClick={() => setTab("id")}>
                  Indonesia
                </button>
                <button type="button" role="tab" id="tab-en" aria-selected={tab === "en"} aria-controls="panel-en" className={tabCls(tab === "en")} onClick={() => setTab("en")}>
                  English
                  {state.enMissing > 0 && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">{state.enMissing} kosong</span>
                  )}
                </button>
              </div>
            ) : null}
            {panel("id")}
            {hasEn && panel("en")}
          </div>

          {p.lists.map((spec) => (
            <ListEditor key={spec.key} spec={spec} initial={p.initialLists[spec.key] ?? []} error={state.fieldErrors?.[`list__${spec.key}`]} />
          ))}
        </div>

        <div className="w-full space-y-4 lg:flex-1">
          <div className={CARD}>
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <select key={`status-${state.nonce}`} id="status" name="status" defaultValue={state.values?.status ?? p.status} className={`${INPUT} mt-1`}>
              {CONTENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CONTENT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className={CARD}>
            <p className="mb-2 text-sm font-medium">{p.coverLabel}</p>
            <MediaPicker name={coverField} initial={p.cover} />
          </div>
          {p.gallery && (
            <div className={CARD}>
              <label htmlFor="gallery_id" className="text-sm font-medium">
                Album kegiatan
              </label>
              <select key={`gallery-${state.nonce}`} id="gallery_id" name="gallery_id" defaultValue={state.values?.gallery_id ?? p.gallery.id} className={`${INPUT} mt-1`}>
                <option value="">Tanpa album</option>
                {p.gallery.options.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">Ditampilkan sebagai strip &quot;Kegiatan&quot; di halaman jenjang.</p>
            </div>
          )}
          {p.canDelete && key && (
            <button
              type="button"
              disabled={busy}
              className="text-sm font-semibold text-red-700 underline disabled:opacity-60"
              onClick={() => {
                if (!window.confirm("Hapus data ini secara permanen?")) return;
                startDelete(async () => {
                  const r = await deleteRecord(p.entity, key);
                  if (r?.error) setDelError(r.error);
                });
              }}
            >
              Hapus
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
