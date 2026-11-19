"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";

const btn =
  "inline-flex min-h-10 items-center rounded-full border-[1.5px] border-deep px-4 text-xs font-bold text-deep hover:bg-soft";

export function ShareButtons({ title, url }: { title: string; url: string }) {
  const { m } = useI18n();
  const [copied, setCopied] = useState(false);
  const q = encodeURIComponent;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <b className="text-[13px] text-deep">{m.newsPage.share}:</b>
      <a
        className={btn}
        href={`https://wa.me/?text=${q(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
      <a
        className={btn}
        href={`https://www.facebook.com/sharer/sharer.php?u=${q(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Facebook
      </a>
      <button
        type="button"
        className={btn}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard tidak tersedia: abaikan */
          }
        }}
      >
        {copied ? m.newsPage.copied : m.newsPage.copyLink}
      </button>
    </div>
  );
}
