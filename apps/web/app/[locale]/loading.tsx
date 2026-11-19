"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

const block = "animate-pulse rounded-2xl bg-soft motion-reduce:animate-none";

/** Kerangka ringan saat halaman dinamis (mis. pencarian berita) sedang dimuat. */
export default function Loading() {
  const { m } = useI18n();
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{m.loading.label}</span>
      <div
        aria-hidden
        className="h-[200px] animate-pulse bg-soft motion-reduce:animate-none sm:h-[240px]"
      />
      <div aria-hidden className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8">
        <div className="h-3 w-28 animate-pulse rounded bg-[#dce5f5] motion-reduce:animate-none" />
        <div className="mt-4 h-9 w-full max-w-md animate-pulse rounded bg-[#dce5f5] motion-reduce:animate-none" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className={`${block} h-52`} />
          <div className={`${block} h-52`} />
          <div className={`${block} hidden h-52 sm:block`} />
        </div>
      </div>
    </div>
  );
}
