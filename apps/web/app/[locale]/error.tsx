"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import { btnDark } from "@/lib/ui";

/** Batas galat untuk halaman di bawah [locale]: header dan footer tetap tampil. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { m, href } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6200]">
        {m.errorPage.code}
      </p>
      <h1 className="font-serif text-4xl font-bold text-deep">
        {m.errorPage.title}
      </h1>
      <p className="text-muted">{m.errorPage.text}</p>
      {error.digest && (
        <p className="text-xs text-muted">
          {m.errorPage.reference}: {error.digest}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        <button type="button" onClick={reset} className={btnDark}>
          {m.errorPage.retry}
        </button>
        <Link
          href={href("/")}
          className="text-sm font-bold text-primary underline underline-offset-4"
        >
          {m.errorPage.back}
        </Link>
      </div>
    </div>
  );
}
