"use client";

import Link from "next/link";
import { useActionState, useState, useTransition, type ReactNode } from "react";
import { CONTENT_STATUSES, CONTENT_STATUS_LABEL, slugify } from "@erenos/shared";
import { deleteNews, saveNews, type NewsState } from "@/app/(admin)/konten/berita/actions";
import { RichEditor } from "@/components/editor/RichEditor";
import { MediaPicker, type PickedMedia } from "@/components/media/MediaPicker";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";

export type NewsInitial = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: PickedMedia | null;
  category_id: string;
  is_featured: boolean;
  author_name: string;
  status: string;
  published_at: string; // nilai datetime-local (WIB)
  seo_title: string;
  seo_description: string;
};

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-err`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function NewsForm({
  initial,
  categories,
  defaultAuthor,
  saved,
}: {
  initial: NewsInitial | null;
  categories: { id: string; name: string }[];
  defaultAuthor: string;
  saved?: boolean;
}) {
  const [state, action, pending] = useActionState<NewsState, FormData>(saveNews, { status: "idle", nonce: 0 });
  const [deleting, startDelete] = useTransition();
  const [delError, setDelError] = useState<string | null>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));

  const v = (n: string, fb: string) => state.values?.[n] ?? fb;
  const err = (n: string) => state.fieldErrors?.[n];
  const k = (n: string) => `${n}-${state.nonce}`;
  const busy = pending || deleting;

  return (
    <form action={action}>
      <input type="hidden" name="id" value={initial?.id ?? ""} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <Link href="/konten/berita" className="underline">
              Berita
            </Link>{" "}
            / {initial ? "Ubah" : "Baru"}
          </p>
          <h1 className="font-serif text-3xl font-semibold text-deep">{initial ? "Ubah berita" : "Tulis berita"}</h1>
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

      <p
        role="status"
        aria-live="polite"
        className={`mb-4 min-h-5 text-sm ${state.status === "ok" || (saved && state.status === "idle") ? "text-green-700" : "text-red-700"}`}
      >
        {state.message ?? (saved ? "Berita dibuat." : "")}
        {delError}
      </p>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <div className={`${CARD} w-full min-w-0 space-y-5 lg:flex-[2]`}>
          <Field label="Judul" htmlFor="title" error={err("title")}>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              maxLength={200}
              className={INPUT}
              aria-invalid={err("title") ? true : undefined}
              aria-describedby={err("title") ? "title-err" : undefined}
            />
          </Field>
          <Field label="Slug (alamat URL)" htmlFor="slug" error={err("slug")} hint="Dibuat otomatis dari judul; bisa diubah.">
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              maxLength={80}
              className={INPUT}
              aria-invalid={err("slug") ? true : undefined}
              aria-describedby={err("slug") ? "slug-err" : undefined}
            />
          </Field>
          <Field label="Ringkasan" htmlFor="excerpt" error={err("excerpt")} hint="Tampil di daftar berita dan hasil pencarian.">
            <textarea
              key={k("excerpt")}
              id="excerpt"
              name="excerpt"
              rows={3}
              defaultValue={v("excerpt", initial?.excerpt ?? "")}
              className={`${INPUT} h-auto py-2`}
            />
          </Field>
          <div>
            <p className="mb-1 text-sm font-medium">Isi</p>
            <RichEditor name="content" initialHtml={initial?.content ?? ""} />
            {err("content") && <p className="mt-1 text-sm text-red-700">{err("content")}</p>}
          </div>
        </div>

        <div className="w-full space-y-4 lg:flex-1">
          <div className={`${CARD} space-y-4`}>
            <Field label="Status" htmlFor="status" error={err("status")}>
              <select key={k("status")} id="status" name="status" defaultValue={v("status", initial?.status ?? "draft")} className={INPUT}>
                {CONTENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {CONTENT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Tanggal terbit (WIB)"
              htmlFor="published_at"
              error={err("published_at")}
              hint="Kosong = saat diterbitkan. Tanggal di masa depan = terjadwal; baru tampil di website setelah waktunya."
            >
              <input
                key={k("published_at")}
                id="published_at"
                name="published_at"
                type="datetime-local"
                defaultValue={v("published_at", initial?.published_at ?? "")}
                className={INPUT}
              />
            </Field>
            <Field label="Kategori" htmlFor="category_id" error={err("category_id")}>
              <select key={k("category_id")} id="category_id" name="category_id" defaultValue={v("category_id", initial?.category_id ?? "")} className={INPUT}>
                <option value="">Tanpa kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nama penulis" htmlFor="author_name" error={err("author_name")}>
              <input
                key={k("author_name")}
                id="author_name"
                name="author_name"
                defaultValue={v("author_name", initial?.author_name ?? defaultAuthor)}
                className={INPUT}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                key={k("is_featured")}
                type="checkbox"
                name="is_featured"
                defaultChecked={state.values ? state.values.is_featured === "on" : (initial?.is_featured ?? false)}
                className="h-5 w-5 accent-primary"
              />
              Berita utama
            </label>
          </div>

          <div className={CARD}>
            <p className="mb-2 text-sm font-medium">Foto sampul</p>
            <MediaPicker name="cover_media_id" initial={initial?.cover ?? null} />
            {err("cover_media_id") && <p className="mt-1 text-sm text-red-700">{err("cover_media_id")}</p>}
          </div>

          <div className={`${CARD} space-y-4`}>
            <p className="text-sm font-semibold">SEO</p>
            <Field label="Judul SEO" htmlFor="seo_title" error={err("seo_title")} hint="Kosong = memakai judul berita.">
              <input key={k("seo_title")} id="seo_title" name="seo_title" defaultValue={v("seo_title", initial?.seo_title ?? "")} className={INPUT} />
            </Field>
            <Field label="Deskripsi SEO" htmlFor="seo_description" error={err("seo_description")} hint="Maks. 160 karakter.">
              <textarea
                key={k("seo_description")}
                id="seo_description"
                name="seo_description"
                rows={3}
                defaultValue={v("seo_description", initial?.seo_description ?? "")}
                className={`${INPUT} h-auto py-2`}
              />
            </Field>
          </div>

          {initial && (
            <button
              type="button"
              disabled={busy}
              className="text-sm font-semibold text-red-700 underline disabled:opacity-60"
              onClick={() => {
                if (!window.confirm("Hapus berita ini secara permanen?")) return;
                startDelete(async () => {
                  const r = await deleteNews(initial.id);
                  if (r?.error) setDelError(r.error);
                });
              }}
            >
              Hapus berita
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
