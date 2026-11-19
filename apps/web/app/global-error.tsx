"use client";

import { useEffect, useState } from "react";
import en from "@/messages/en.json";
import id from "@/messages/id.json";
import "./globals.css";

const T = { id: id.errorPage, en: en.errorPage };

/**
 * Cadangan terakhir bila layout itu sendiri gagal (header/footer/kamus tidak tersedia).
 * Mandiri: tidak memakai I18nProvider; bahasa ditebak dari awalan URL (/en atau /id).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [lang, setLang] = useState<"id" | "en">("id");

  useEffect(() => {
    setLang(window.location.pathname.startsWith("/en") ? "en" : "id");
    console.error(error);
  }, [error]);

  const t = T[lang];

  return (
    <html lang={lang}>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6200]">
            {t.code}
          </p>
          <h1 className="font-serif text-4xl font-bold text-deep">{t.title}</h1>
          <p className="max-w-md text-muted">{t.text}</p>
          {error.digest && (
            <p className="text-xs text-muted">
              {t.reference}: {error.digest}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
            >
              {t.retry}
            </button>
            <a
              href={`/${lang}`}
              className="text-sm font-bold text-primary underline underline-offset-4"
            >
              {t.back}
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
