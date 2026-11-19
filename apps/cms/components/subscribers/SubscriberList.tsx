"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deactivateSubscriber,
  deleteSubscriber,
  type Result,
} from "@/app/(admin)/pelanggan/actions";
import { BTN_OUTLINE, CARD } from "@/components/ui/form";
import { formatDateTime } from "@/lib/inquiry";

export type SubscriberRow = {
  id: string;
  email: string;
  status: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
};

export function SubscriberList({ rows }: { rows: SubscriberRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? null : r.error);
      if (r.ok) router.refresh();
    });

  if (rows.length === 0)
    return (
      <div className={`${CARD} text-sm text-muted`}>
        Belum ada pelanggan yang cocok.
      </div>
    );

  return (
    <>
      <p
        role="status"
        aria-live="polite"
        className="mb-3 min-h-5 text-sm text-red-700"
      >
        {msg}
      </p>
      <ul className={`${CARD} divide-y divide-line py-1`}>
        {rows.map((r) => {
          const active = r.status === "active";
          return (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 py-3 text-sm"
            >
              <span className="min-w-0 flex-1 break-all font-semibold">
                {r.email}
              </span>
              <span className="hidden text-xs text-muted sm:block">
                {active
                  ? `Sejak ${formatDateTime(r.subscribed_at)}`
                  : `Berhenti ${formatDateTime(r.unsubscribed_at)}`}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}
              >
                {active ? "Aktif" : "Berhenti"}
              </span>
              {active && (
                <button
                  type="button"
                  disabled={pending}
                  className={`${BTN_OUTLINE} !h-9 !px-3`}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Nonaktifkan ${r.email}? Ia tidak akan masuk ekspor aktif.`,
                      )
                    )
                      run(() => deactivateSubscriber(r.id));
                  }}
                >
                  Nonaktifkan
                </button>
              )}
              <button
                type="button"
                disabled={pending}
                className="text-sm font-semibold text-red-700 underline disabled:opacity-60"
                onClick={() => {
                  if (window.confirm(`Hapus ${r.email} secara permanen?`))
                    run(() => deleteSubscriber(r.id));
                }}
              >
                Hapus
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
