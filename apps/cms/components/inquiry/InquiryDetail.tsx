"use client";

import { useActionState, useState, useTransition } from "react";
import {
  deleteInquiry,
  updateInquiry,
  type InquiryState,
} from "@/app/(admin)/inquiry/actions";
import { BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABEL,
  SOURCE_LABEL,
  formatDateTime,
  levelShort,
  whatsappLink,
} from "@/lib/inquiry";

export type InquiryFull = {
  id: string;
  source: string;
  parent_name: string;
  student_name: string | null;
  email: string | null;
  phone: string | null;
  interested_level: string | null;
  message: string;
  status: string;
  internal_notes: string | null;
  handled_at: string | null;
  created_at: string;
};

const link = "font-semibold text-primary underline underline-offset-2";

export function InquiryDetail({ item }: { item: InquiryFull }) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(
    updateInquiry,
    {
      status: "idle",
      nonce: 0,
    },
  );
  const [deleting, startDelete] = useTransition();
  const [delError, setDelError] = useState<string | null>(null);
  const wa = whatsappLink(item.phone);
  const v = state.values ?? {
    status: item.status,
    internal_notes: item.internal_notes ?? "",
  };

  return (
    <div id="detail" className={`${CARD} scroll-mt-24`}>
      <p className="text-xs text-muted">
        {SOURCE_LABEL[item.source] ?? item.source} ·{" "}
        {formatDateTime(item.created_at)}
      </p>
      <h2 className="mt-1 font-serif text-2xl font-semibold text-deep">
        {item.parent_name}
      </h2>

      <dl className="mt-3 space-y-1.5 text-sm">
        {item.student_name && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted">Calon siswa</dt>
            <dd>{item.student_name}</dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-muted">Jenjang</dt>
          <dd>{levelShort(item.interested_level)}</dd>
        </div>
        {item.email && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted">Email</dt>
            <dd className="min-w-0 break-words">
              <a href={`mailto:${item.email}`} className={link}>
                {item.email}
              </a>
            </dd>
          </div>
        )}
        {item.phone && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted">Telepon</dt>
            <dd className="flex flex-wrap gap-x-3">
              <a href={`tel:${item.phone}`} className={link}>
                {item.phone}
              </a>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  WhatsApp
                </a>
              )}
            </dd>
          </div>
        )}
      </dl>

      <p className="mt-4 text-sm font-medium">Pesan</p>
      <p className="mt-1 whitespace-pre-line rounded-lg bg-soft p-3 text-sm leading-relaxed">
        {item.message}
      </p>

      <form
        action={action}
        className="mt-5 space-y-4 border-t border-line pt-5"
      >
        <input type="hidden" name="id" value={item.id} />
        <div>
          <label htmlFor="inq-status" className="text-sm font-medium">
            Status
          </label>
          <select
            key={`s-${state.nonce}`}
            id="inq-status"
            name="status"
            defaultValue={v.status}
            className={`${INPUT} mt-1`}
          >
            {INQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {INQUIRY_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="inq-notes" className="text-sm font-medium">
            Catatan internal
          </label>
          <textarea
            key={`n-${state.nonce}`}
            id="inq-notes"
            name="internal_notes"
            rows={4}
            defaultValue={v.internal_notes}
            className={`${INPUT} mt-1 h-auto py-2`}
          />
          <p className="mt-1 text-xs text-muted">
            Hanya terlihat oleh Super Admin.
          </p>
        </div>
        <p
          role="status"
          aria-live="polite"
          className={`min-h-5 text-sm ${state.status === "error" || delError ? "text-red-700" : "text-green-700"}`}
        >
          {state.message ?? delError}
        </p>
        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            disabled={pending || deleting}
            className={BTN_PRIMARY}
          >
            {pending ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            type="button"
            disabled={pending || deleting}
            className="text-sm font-semibold text-red-700 underline disabled:opacity-60"
            onClick={() => {
              if (!window.confirm("Hapus inquiry ini secara permanen?")) return;
              startDelete(async () => {
                const r = await deleteInquiry(item.id);
                if (r?.error) setDelError(r.error);
              });
            }}
          >
            Hapus
          </button>
        </div>
        {item.handled_at && (
          <p className="text-xs text-muted">
            Terakhir ditangani: {formatDateTime(item.handled_at)}
          </p>
        )}
      </form>
    </div>
  );
}
