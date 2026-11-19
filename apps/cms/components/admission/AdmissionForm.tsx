"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { CONTENT_STATUSES, CONTENT_STATUS_LABEL } from "@erenos/shared";
import {
  deleteAdmissionItem,
  saveAdmissionItem,
  type AdmissionState,
} from "@/app/(admin)/admisi/actions";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";
import type { AdmissionTab } from "@/lib/admission";

export type AdmissionItem = {
  id: string;
  title: string;
  title_en: string;
  body: string;
  body_en: string;
  status: string;
};

export function AdmissionForm({
  tab,
  item,
  saved,
}: {
  tab: AdmissionTab;
  item: AdmissionItem | null;
  saved?: boolean;
}) {
  const [state, action, pending] = useActionState<AdmissionState, FormData>(
    saveAdmissionItem,
    {
      status: "idle",
      nonce: 0,
    },
  );
  const [deleting, startDelete] = useTransition();
  const [delError, setDelError] = useState<string | null>(null);
  const busy = pending || deleting;
  const v = (n: keyof AdmissionItem, fb = "") =>
    state.values?.[n] ?? item?.[n] ?? fb;
  const err = (n: string) => state.fieldErrors?.[n];
  const k = (n: string) => `${n}-${state.nonce}`;
  const message =
    state.message ?? (saved ? "Berhasil dibuat." : (delError ?? ""));

  const field = (
    name: "title" | "title_en" | "body" | "body_en",
    label: string,
    area: boolean,
  ) => (
    <div>
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {name === "title" && <span className="text-red-700"> *</span>}
      </label>
      <div className="mt-1">
        {area ? (
          <textarea
            key={k(name)}
            id={name}
            name={name}
            rows={6}
            defaultValue={v(name)}
            aria-invalid={err(name) ? true : undefined}
            className={`${INPUT} h-auto py-2`}
          />
        ) : (
          <input
            key={k(name)}
            id={name}
            name={name}
            defaultValue={v(name)}
            aria-invalid={err(name) ? true : undefined}
            className={INPUT}
          />
        )}
      </div>
      {err(name) && <p className="mt-1 text-sm text-red-700">{err(name)}</p>}
    </div>
  );

  return (
    <form action={action}>
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="section" value={tab.section} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">
            <Link href={`/admisi?bagian=${tab.id}`} className="underline">
              ← Admisi · {tab.label}
            </Link>
          </p>
          <h1 className="font-serif text-3xl font-semibold text-deep">
            {item ? "Ubah" : "Tambah"} {tab.label.toLowerCase()}
          </h1>
        </div>
        <div className="flex gap-2.5">
          <button
            type="submit"
            name="intent"
            value="save"
            disabled={busy}
            className={BTN_OUTLINE}
          >
            {pending ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            type="submit"
            name="intent"
            value="publish"
            disabled={busy}
            className={BTN_PRIMARY}
          >
            Terbitkan
          </button>
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`mb-4 min-h-5 text-sm ${state.status === "error" || delError ? "text-red-700" : "text-green-700"}`}
      >
        {message}
      </p>

      <div className={`${CARD} grid gap-5 md:grid-cols-2`}>
        <div className="space-y-5">
          {field("title", `${tab.titleLabel} (Indonesia)`, false)}
          {field("body", `${tab.bodyLabel} (Indonesia)`, true)}
        </div>
        <div className="space-y-5">
          {field("title_en", `${tab.titleLabel} (English)`, false)}
          {field("body_en", `${tab.bodyLabel} (English)`, true)}
        </div>
      </div>

      <div
        className={`${CARD} mt-4 flex flex-wrap items-end justify-between gap-4`}
      >
        <div className="w-full max-w-xs">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            key={k("status")}
            id="status"
            name="status"
            defaultValue={v("status", "draft")}
            className={`${INPUT} mt-1`}
          >
            {CONTENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CONTENT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        {item && (
          <button
            type="button"
            disabled={busy}
            className="text-sm font-semibold text-red-700 underline disabled:opacity-60"
            onClick={() => {
              if (!window.confirm("Hapus data ini secara permanen?")) return;
              startDelete(async () => {
                const r = await deleteAdmissionItem(item.id, tab.section);
                if (r?.error) setDelError(r.error);
              });
            }}
          >
            Hapus
          </button>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">
        Teks ditampilkan apa adanya di website; baris baru dipertahankan.
      </p>
    </form>
  );
}
