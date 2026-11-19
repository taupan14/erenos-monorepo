import { cache } from "react";
import { supabase } from "./supabase";
import type {
  AboutPage,
  AdmissionRow,
  AlbumDetail,
  AlbumRow,
  LevelDetail,
  NewsCategory,
  NewsDetail,
  PageRow,
  FacilityRow,
  GalleryPhoto,
  HeroSlideRow,
  LevelRow,
  NewsRow,
  SiteSettings,
} from "./types";

// Semua query memakai client anon: RLS hanya mengembalikan konten berstatus 'published'.
// Baris dikembalikan lengkap dengan kolom `_en`; pemilihan bahasa dilakukan di komponen (lib/localize.ts).
// Kegagalan dicatat lalu diganti nilai kosong agar halaman tetap tampil (fallback di komponen).

const MEDIA = "path, alt_text, alt_text_en, width, height";

function logError(scope: string, error: { message: string } | null) {
  if (error) console.error(`[data:${scope}]`, error.message);
}

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      `*, logo:media!logo_media_id(${MEDIA}), model:media!admission_model_media_id(${MEDIA})`,
    )
    .eq("id", 1)
    .maybeSingle();
  logError("site_settings", error);
  return (data as unknown as SiteSettings | null) ?? null;
});

export const getLevels = cache(async (): Promise<LevelRow[]> => {
  const { data, error } = await supabase
    .from("academic_levels")
    .select(
      `id, code, slug, name, name_en, short_name, summary, summary_en, programs, cover:media!cover_media_id(${MEDIA})`,
    )
    .eq("status", "published")
    .order("sort_order");
  logError("academic_levels", error);
  return (data as unknown as LevelRow[]) ?? [];
});

async function getHeroSlides(): Promise<HeroSlideRow[]> {
  const { data, error } = await supabase
    .from("hero_slides")
    .select(
      `id, title, title_en, highlight, highlight_en, description, description_en, primary_label, primary_label_en, primary_href, secondary_label, secondary_label_en, secondary_href, media:media!media_id(${MEDIA})`,
    )
    .eq("status", "published")
    .order("sort_order");
  logError("hero_slides", error);
  return (data as unknown as HeroSlideRow[]) ?? [];
}

async function getFacilities(limit: number): Promise<FacilityRow[]> {
  const { data, error } = await supabase
    .from("facilities")
    .select(
      `id, slug, name, name_en, summary, summary_en, icon, media:media!media_id(${MEDIA})`,
    )
    .eq("status", "published")
    .order("sort_order")
    .limit(limit);
  logError("facilities", error);
  return (data as unknown as FacilityRow[]) ?? [];
}

async function getLatestNews(limit: number): Promise<NewsRow[]> {
  const { data, error } = await supabase
    .from("news")
    .select(
      `id, slug, title, excerpt, published_at, category:news_categories(name, name_en, slug), cover:media!cover_media_id(${MEDIA})`,
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  logError("news", error);
  return (data as unknown as NewsRow[]) ?? [];
}

/**
 * Foto untuk strip "Kehidupan Siswa": item dari album terbit bertanda show_on_home.
 * Bila ada beberapa album bertanda, dipakai yang pertama menurut sort_order lalu tanggal kegiatan
 * terbaru, DAN yang benar-benar berisi foto (album kosong dilewati).
 */
async function getHomeGalleryPhotos(limit: number): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from("galleries")
    .select(
      `id, items:gallery_items(sort_order, caption, caption_en, media:media!media_id(${MEDIA}))`,
    )
    .eq("status", "published")
    .eq("show_on_home", true)
    .order("sort_order")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("sort_order", { referencedTable: "gallery_items" });
  logError("galleries", error);
  const rows = (data as unknown as { items: GalleryPhoto[] }[] | null) ?? [];
  const withPhotos = rows
    .map((r) => r.items.filter((i) => i.media))
    .find((items) => items.length > 0);
  return withPhotos?.slice(0, limit) ?? [];
}

async function getAboutPage(): Promise<AboutPage | null> {
  const { data, error } = await supabase
    .from("pages")
    .select(
      `title, title_en, excerpt, excerpt_en, meta, cover:media!cover_media_id(${MEDIA})`,
    )
    .eq("slug", "tentang-kami")
    .eq("status", "published")
    .maybeSingle();
  logError("pages", error);
  return (data as unknown as AboutPage | null) ?? null;
}

export async function getHomeData() {
  const [slides, levels, facilities, news, photos, about] = await Promise.all([
    getHeroSlides(),
    getLevels(),
    getFacilities(4),
    getLatestNews(3),
    getHomeGalleryPhotos(5),
    getAboutPage(),
  ]);
  return { slides, levels, facilities, news, photos, about };
}

// ---------------------------------------------------------------------------
// Tahap 3: halaman publik
// ---------------------------------------------------------------------------

const getPagesCached = cache(
  async (key: string): Promise<Record<string, PageRow>> => {
    const slugs = key.split(",");
    const { data, error } = await supabase
      .from("pages")
      .select(
        `slug, title, title_en, excerpt, excerpt_en, content, content_en, meta, cover:media!cover_media_id(${MEDIA})`,
      )
      .in("slug", slugs)
      .eq("status", "published");
    logError("pages", error);
    const rows = (data as unknown as PageRow[]) ?? [];
    return Object.fromEntries(rows.map((r) => [r.slug, r]));
  },
);

/** Halaman statis terbit berdasarkan slug, mis. getPages(["tentang-kami", "sejarah"]). */
export function getPages(slugs: string[]) {
  return getPagesCached([...slugs].sort().join(","));
}

export const getLevelBySlug = cache(
  async (slug: string): Promise<LevelDetail | null> => {
    const { data, error } = await supabase
      .from("academic_levels")
      .select(
        `id, code, slug, name, name_en, short_name, summary, summary_en, programs, facts, content, content_en, cover:media!cover_media_id(${MEDIA}), gallery:galleries!gallery_id(items:gallery_items(sort_order, caption, caption_en, media:media!media_id(${MEDIA})))`,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    logError("academic_levels:detail", error);
    const row = data as unknown as LevelDetail | null;
    if (row?.gallery)
      row.gallery.items.sort((a, b) => a.sort_order - b.sort_order);
    return row ?? null;
  },
);

export const getAllFacilities = cache(async (): Promise<FacilityRow[]> => {
  const { data, error } = await supabase
    .from("facilities")
    .select(
      `id, slug, name, name_en, summary, summary_en, icon, media:media!media_id(${MEDIA})`,
    )
    .eq("status", "published")
    .order("sort_order");
  logError("facilities:all", error);
  return (data as unknown as FacilityRow[]) ?? [];
});

export const getNewsCategories = cache(async (): Promise<NewsCategory[]> => {
  const { data, error } = await supabase
    .from("news_categories")
    .select("id, slug, name, name_en")
    .order("sort_order");
  logError("news_categories", error);
  return (data as unknown as NewsCategory[]) ?? [];
});

export const NEWS_PAGE_SIZE = 9;

/**
 * Daftar berita berhalaman. Tanpa filter, halaman 1 memuat 1 berita utama + 9 kartu (10 baris);
 * halaman berikutnya 9 baris. Dengan filter (kategori/pencarian) selalu 9 baris per halaman.
 */
export async function getNewsPage(opts: {
  page: number;
  category?: string;
  q?: string;
}) {
  const { page, category, q } = opts;
  const filtered = !!category || !!q;
  const withFeatured = !filtered && page === 1;
  const from = filtered
    ? (page - 1) * NEWS_PAGE_SIZE
    : page === 1
      ? 0
      : 1 + NEWS_PAGE_SIZE + (page - 2) * NEWS_PAGE_SIZE;
  const size = withFeatured ? NEWS_PAGE_SIZE + 1 : NEWS_PAGE_SIZE;

  let query = supabase
    .from("news")
    .select(
      `id, slug, title, excerpt, published_at, category:news_categories${category ? "!inner" : ""}(name, name_en, slug), cover:media!cover_media_id(${MEDIA})`,
      { count: "exact" },
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, from + size - 1);
  if (category) query = query.eq("category.slug", category);
  if (q)
    query = query.textSearch("search", q, {
      type: "websearch",
      config: "simple",
    });

  const { data, error, count } = await query;
  // PGRST103 = halaman di luar jangkauan (bukan kegagalan sistem): beri tahu pemanggil agar mengalihkan
  const outOfRange = error?.code === "PGRST103";
  if (!outOfRange) logError("news:list", error);
  const total = count ?? 0;
  const totalPages = filtered
    ? Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE))
    : total <= NEWS_PAGE_SIZE + 1
      ? 1
      : 1 + Math.ceil((total - (NEWS_PAGE_SIZE + 1)) / NEWS_PAGE_SIZE);
  return {
    items: (data as unknown as NewsRow[]) ?? [],
    total,
    totalPages,
    withFeatured,
    outOfRange,
  };
}

export const getNewsBySlug = cache(
  async (slug: string): Promise<NewsDetail | null> => {
    const { data, error } = await supabase
      .from("news")
      .select(
        `id, slug, title, excerpt, content, published_at, author_name, seo_title, seo_description, category:news_categories(name, name_en, slug), cover:media!cover_media_id(${MEDIA})`,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    logError("news:detail", error);
    return (data as unknown as NewsDetail | null) ?? null;
  },
);

export async function getRelatedNews(
  excludeSlug: string,
  limit = 3,
): Promise<NewsRow[]> {
  const { data, error } = await supabase
    .from("news")
    .select(
      `id, slug, title, excerpt, published_at, category:news_categories(name, name_en, slug), cover:media!cover_media_id(${MEDIA})`,
    )
    .eq("status", "published")
    .neq("slug", excludeSlug)
    .order("published_at", { ascending: false })
    .limit(limit);
  logError("news:related", error);
  return (data as unknown as NewsRow[]) ?? [];
}

export const getAlbums = cache(async (): Promise<AlbumRow[]> => {
  const { data, error } = await supabase
    .from("galleries")
    .select(
      `id, slug, title, title_en, description, description_en, event_date, cover:media!cover_media_id(${MEDIA}), items:gallery_items(count)`,
    )
    .eq("status", "published")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("sort_order");
  logError("galleries:list", error);
  return (data as unknown as AlbumRow[]) ?? [];
});

export const getAlbumBySlug = cache(
  async (slug: string): Promise<AlbumDetail | null> => {
    const { data, error } = await supabase
      .from("galleries")
      .select(
        `id, slug, title, title_en, description, description_en, event_date, cover:media!cover_media_id(${MEDIA}), items:gallery_items(sort_order, caption, caption_en, media:media!media_id(${MEDIA}))`,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .order("sort_order", { referencedTable: "gallery_items" })
      .maybeSingle();
    logError("galleries:detail", error);
    return (data as unknown as AlbumDetail | null) ?? null;
  },
);

export const getAdmission = cache(async (): Promise<AdmissionRow[]> => {
  const { data, error } = await supabase
    .from("admission_info")
    .select("id, section, title, title_en, body, body_en, level, sort_order")
    .eq("status", "published")
    .order("sort_order");
  logError("admission_info", error);
  return (data as unknown as AdmissionRow[]) ?? [];
});

/** Data untuk sitemap.xml. */
export async function getSitemapData() {
  const [levels, news, albums] = await Promise.all([
    supabase.from("academic_levels").select("slug").eq("status", "published"),
    supabase
      .from("news")
      .select("slug, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500),
    supabase.from("galleries").select("slug").eq("status", "published"),
  ]);
  return {
    levels: ((levels.data as { slug: string }[] | null) ?? []).map(
      (r) => r.slug,
    ),
    news:
      (news.data as { slug: string; published_at: string | null }[] | null) ??
      [],
    albums: ((albums.data as { slug: string }[] | null) ?? []).map(
      (r) => r.slug,
    ),
  };
}

export type VisitorStats = {
  todayViews: number;
  todayVisitors: number;
  totalViews: number;
  totalVisitors: number;
};

/**
 * Statistik kunjungan untuk footer (fungsi SQL visitor_stats; hanya angka agregat).
 * "Pengunjung total" = pengunjung unik per hari yang dijumlahkan, karena penanda pengunjung berganti tiap hari.
 */
export const getVisitorStats = cache(async (): Promise<VisitorStats | null> => {
  const { data, error } = await supabase.rpc("visitor_stats");
  logError("visitor_stats", error);
  const row = (Array.isArray(data) ? data[0] : data) as
    | Record<string, number | string>
    | null
    | undefined;
  if (!row) return null;
  return {
    todayViews: Number(row.today_views) || 0,
    todayVisitors: Number(row.today_visitors) || 0,
    totalViews: Number(row.total_views) || 0,
    totalVisitors: Number(row.total_visitors) || 0,
  };
});
