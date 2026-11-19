"use client";

import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useI18n } from "@/components/i18n/I18nProvider";

/** Pengalih bahasa ID | EN. Memuat ulang halaman yang sama di bahasa lain dan mengingat pilihan di cookie. */
export function LanguageSwitcher({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { locale, m } = useI18n();
  const pathname = usePathname();

  const target = (l: Locale) => pathname.replace(/^\/(id|en)(?=\/|$)/, `/${l}`);

  return (
    <div
      role="group"
      aria-label={m.a11y.language}
      className={cn(
        "inline-flex overflow-hidden rounded-full border-[1.5px] text-[11px] font-bold",
        variant === "light" ? "border-deep" : "border-[#c9d7f2]",
      )}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <a
            key={l}
            href={target(l)}
            lang={l}
            hrefLang={l}
            aria-current={active ? "true" : undefined}
            onClick={(e) => {
              document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
              // pertahankan query string dan hash saat pindah bahasa
              e.currentTarget.href =
                target(l) + window.location.search + window.location.hash;
            }}
            className={cn(
              "flex min-h-8 items-center px-3 uppercase",
              variant === "light"
                ? active
                  ? "bg-deep text-white"
                  : "text-deep hover:bg-soft"
                : active
                  ? "bg-[#c9d7f2] text-deep"
                  : "text-[#c9d7f2] hover:bg-white/10",
            )}
          >
            {l}
          </a>
        );
      })}
    </div>
  );
}
