import { ACADEMIC_LEVELS, type AcademicLevelCode } from "@erenos/shared";
import type { Locale } from "./i18n";
import { loc, altText } from "./localize";
import type { Messages } from "./messages";
import { mediaUrl } from "./media";
import type { LevelRow } from "./types";

/** Jenjang siap tampil (sudah dipilih bahasanya). Dipakai mega menu, footer, dan section Akademik. */
export type LevelView = {
  key: string;
  slug: string;
  short: string;
  name: string;
  summary: string;
  chips: string[];
  coverUrl: string | null;
  coverAlt: string;
};

const isCode = (c: string): c is AcademicLevelCode =>
  ACADEMIC_LEVELS.some((l) => l.code === c);

/**
 * Bila belum ada jenjang terbit di database, dipakai daftar bawaan dari kamus
 * agar menu dan halaman tetap utuh.
 */
export function resolveLevels(
  rows: LevelRow[],
  locale: Locale,
  m: Messages,
): LevelView[] {
  if (rows.length === 0) {
    return ACADEMIC_LEVELS.map((l) => {
      const d = m.levels.items[l.code];
      return {
        key: l.code,
        slug: l.slug,
        short: d.short,
        name: d.name,
        summary: d.summary,
        chips: [...d.chips],
        coverUrl: null,
        coverAlt: d.name,
      };
    });
  }

  return rows.map((r) => {
    const d = isCode(r.code) ? m.levels.items[r.code] : null;
    const name = loc(r, "name", locale) ?? d?.name ?? r.name;
    const chips = (r.programs ?? [])
      .map((p) => loc(p, "title", locale))
      .filter((t): t is string => !!t)
      .slice(0, 3);
    return {
      key: r.id,
      slug: r.slug,
      // Singkatan di database berbahasa Indonesia; untuk Inggris pakai singkatan dari kamus
      short:
        locale === "en" && d ? d.short : (r.short_name ?? d?.short ?? name),
      name,
      summary: loc(r, "summary", locale) ?? d?.summary ?? "",
      chips: chips.length > 0 ? chips : d ? [...d.chips] : [],
      coverUrl: mediaUrl(r.cover),
      coverAlt: altText(r.cover, locale, name),
    };
  });
}
