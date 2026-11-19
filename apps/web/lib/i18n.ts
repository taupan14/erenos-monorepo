export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(v: string | null | undefined): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

/** Awali path internal dengan locale: localeHref("en", "/berita") → "/en/berita". */
export function localeHref(locale: Locale, path = "/"): string {
  if (path === "/" || path === "") return `/${locale}`;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Tautan internal ("/admisi") diberi locale; tautan eksternal dibiarkan. */
export function withLocale(locale: Locale, href: string): string {
  return href.startsWith("/") && !href.startsWith("//")
    ? localeHref(locale, href)
    : href;
}

export function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "id-ID";
}

/** Isi {placeholder} pada teks terjemahan. */
export function fmt(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    String(vars[k] ?? `{${k}}`),
  );
}

/** Metadata canonical + hreflang untuk halaman ini (`path` tanpa awalan bahasa, mis. "/berita"). */
export function alternatesFor(locale: Locale, path = "") {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      id: `/id${path}`,
      en: `/en${path}`,
      "x-default": `/id${path}`,
    },
  };
}
