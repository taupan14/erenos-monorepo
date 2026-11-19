import type { IconName } from "@/components/ui/Icon";

export const LOGO = {
  src: "/logo-erenos.png",
  width: 191,
  height: 240,
} as const;

/** Menu utama. Label diambil dari kamus (`nav.<key>`). */
export const NAV_ITEMS = [
  { key: "home", path: "/" },
  { key: "about", path: "/tentang" },
  { key: "academics", path: "/akademik", mega: true },
  { key: "facilities", path: "/fasilitas" },
  { key: "news", path: "/berita" },
  { key: "admission", path: "/admisi" },
  { key: "contact", path: "/kontak" },
] as const;

export type NavKey = (typeof NAV_ITEMS)[number]["key"];

/** Ikon strip fitur; judul dan teks ada di kamus (`features[i]`). */
export const FEATURE_ICONS: IconName[] = [
  "book",
  "users",
  "cross",
  "heart",
  "flask",
];

/**
 * Angka CONTOH untuk statistik Beranda. Dipakai hanya bila kolom stat_* di site_settings
 * masih kosong. WAJIB diganti dengan data asli lewat CMS sebelum website dipublikasikan.
 */
export const SAMPLE_STATS = {
  students: 1250,
  teachers: 86,
  graduation: 100,
} as const;
