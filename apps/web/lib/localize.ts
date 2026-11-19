import type { Locale } from "./i18n";
import type { MediaRef } from "./media";

/**
 * Ambil teks sesuai bahasa dari baris database dengan pola kolom `field` + `field_en`.
 * Locale "en" memakai `field_en` bila terisi; selain itu (atau bila kosong) memakai teks Indonesia.
 */
export function loc(
  row: object | null | undefined,
  field: string,
  locale: Locale,
): string | null {
  if (!row) return null;
  const r = row as Record<string, unknown>;
  if (locale === "en") {
    const en = r[`${field}_en`];
    if (typeof en === "string" && en.trim()) return en;
  }
  const base = r[field];
  return typeof base === "string" && base.trim() ? base : null;
}

/** Teks alternatif gambar sesuai bahasa. */
export function altText(
  media: MediaRef | undefined,
  locale: Locale,
  fallback: string,
): string {
  if (!media) return fallback;
  if (locale === "en" && media.alt_text_en?.trim()) return media.alt_text_en;
  return media.alt_text?.trim() || fallback;
}
