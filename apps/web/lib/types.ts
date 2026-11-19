import type { MediaRef } from "./media";

// Kolom `*_en` = terjemahan Inggris (boleh kosong → website memakai teks Indonesia).

export type SiteSettings = {
  school_name: string;
  tagline: string | null;
  tagline_en: string | null;
  motto: string | null;
  motto_en: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  office_hours: string | null;
  office_hours_en: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  admission_open: boolean;
  admission_badge_text: string;
  admission_badge_text_en: string | null;
  admission_cta_title: string | null;
  admission_cta_title_en: string | null;
  admission_cta_text: string | null;
  admission_cta_text_en: string | null;
  seo_title: string | null;
  seo_title_en: string | null;
  seo_description: string | null;
  seo_description_en: string | null;
  maps_embed_url: string | null;
  topbar_text?: string | null;
  topbar_text_en?: string | null;
  stat_students: number | null;
  stat_certified_teachers: number | null;
  stat_graduation_rate: number | null;
  logo: MediaRef;
  model: MediaRef;
};

export type HeroSlideRow = {
  id: string;
  title: string;
  title_en: string | null;
  highlight: string | null;
  highlight_en: string | null;
  description: string | null;
  description_en: string | null;
  primary_label: string | null;
  primary_label_en: string | null;
  primary_href: string | null;
  secondary_label: string | null;
  secondary_label_en: string | null;
  secondary_href: string | null;
  media: MediaRef;
};

export type LevelProgram = {
  title?: string;
  title_en?: string;
  description?: string;
  description_en?: string;
  icon?: string;
};

export type LevelRow = {
  id: string;
  code: string;
  slug: string;
  name: string;
  name_en: string | null;
  short_name: string | null;
  summary: string | null;
  summary_en: string | null;
  programs: LevelProgram[] | null;
  cover: MediaRef;
};

export type FacilityRow = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  summary: string | null;
  summary_en: string | null;
  icon: string | null;
  media: MediaRef;
};

export type NewsRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  category: { name: string; name_en: string | null; slug: string } | null;
  cover: MediaRef;
};

export type GalleryPhoto = {
  sort_order: number;
  caption: string | null;
  caption_en: string | null;
  media: MediaRef;
};

export type AboutPage = {
  title: string;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  meta: { years_serving?: string; teacher_ratio?: string } | null;
  cover: MediaRef;
};

export type PageRow = {
  slug: string;
  title: string;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  content: string;
  content_en: string | null;
  meta: Record<string, unknown> | null;
  cover: MediaRef;
};

export type LevelFact = { label?: string; label_en?: string; value?: string };

export type LevelDetail = LevelRow & {
  content: string;
  content_en: string | null;
  facts: LevelFact[] | null;
  gallery: { items: GalleryPhoto[] } | null;
};

export type NewsCategory = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
};

export type NewsDetail = NewsRow & {
  content: string;
  author_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

export type AlbumRow = {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
  event_date: string | null;
  cover: MediaRef;
  items: { count: number }[];
};

export type AlbumDetail = Omit<AlbumRow, "items"> & { items: GalleryPhoto[] };

export type AdmissionRow = {
  id: string;
  section: "step" | "requirement" | "faq" | "note";
  title: string;
  title_en: string | null;
  body: string;
  body_en: string | null;
  level: string | null;
  sort_order: number;
};
