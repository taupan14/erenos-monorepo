import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/data";
import { LOCALES } from "@/lib/i18n";
import { siteUrl } from "@/lib/seo";

export const revalidate = 3600;

const STATIC_PATHS = [
  "",
  "/tentang",
  "/akademik",
  "/fasilitas",
  "/berita",
  "/galeri",
  "/admisi",
  "/kontak",
  "/faq",
  "/kebijakan-privasi",
  "/syarat-ketentuan",
];

/** Sitemap dwibahasa: tiap halaman muncul untuk /id dan /en lengkap dengan hreflang (alternates). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { levels, news, albums } = await getSitemapData();

  const entries: { path: string; lastModified?: Date }[] = [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...levels.map((s) => ({ path: `/akademik/${s}` })),
    ...albums.map((s) => ({ path: `/galeri/${s}` })),
    ...news.map((n) => ({
      path: `/berita/${n.slug}`,
      lastModified: n.published_at ? new Date(n.published_at) : undefined,
    })),
  ];

  return entries.flatMap(({ path, lastModified }) =>
    LOCALES.map((locale) => ({
      url: `${base}/${locale}${path}`,
      lastModified,
      alternates: {
        languages: { id: `${base}/id${path}`, en: `${base}/en${path}` },
      },
    })),
  );
}
