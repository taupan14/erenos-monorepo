"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  unsubscribeAction,
  type UnsubscribeState,
} from "@/app/[locale]/berhenti-berlangganan/actions";

export type UnsubscribeLabels = {
  title: string;
  text: string;
  button: string;
  working: string;
  done: string;
  doneText: string;
  already: string;
  invalid: string;
  invalidText: string;
  error: string;
  home: string;
};

const btn =
  "inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep disabled:opacity-60";

/** Halaman konfirmasi: aksi baru dijalankan saat tombol ditekan (bukan saat tautan dibuka). */
export function UnsubscribeForm({
  token,
  labels,
  homeHref,
}: {
  token: string;
  labels: UnsubscribeLabels;
  homeHref: string;
}) {
  const [state, action, pending] = useActionState<UnsubscribeState, FormData>(
    unsubscribeAction,
    { status: "idle" },
  );

  if (state.status === "done" || state.status === "already") {
    return (
      <div role="status">
        <h2 className="font-serif text-2xl font-bold text-deep">
          {state.status === "done" ? labels.done : labels.already}
        </h2>
        {state.status === "done" && (
          <p className="mt-3 leading-relaxed text-muted">{labels.doneText}</p>
        )}
        <Link href={homeHref} className={`${btn} mt-6`}>
          {labels.home}
        </Link>
      </div>
    );
  }

  if (state.status === "invalid") {
    return (
      <div role="alert">
        <h2 className="font-serif text-2xl font-bold text-deep">
          {labels.invalid}
        </h2>
        <p className="mt-3 leading-relaxed text-muted">{labels.invalidText}</p>
        <Link href={homeHref} className={`${btn} mt-6`}>
          {labels.home}
        </Link>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <h2 className="font-serif text-2xl font-bold text-deep">
        {labels.title}
      </h2>
      <p className="mt-3 leading-relaxed text-muted">{labels.text}</p>
      <p role="alert" className="mt-4 min-h-5 text-sm text-red-700">
        {state.status === "error" ? labels.error : ""}
      </p>
      <button type="submit" disabled={pending} className={`${btn} mt-2`}>
        {pending ? labels.working : labels.button}
      </button>
    </form>
  );
}
