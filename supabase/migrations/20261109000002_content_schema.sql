-- Erenos Christian School — tabel konten dan inquiry

-- ============================================================
-- HALAMAN STATIS (tentang, visi-misi, nilai, sambutan, sejarah, ...)
-- content = HTML dari editor rich-text; SANITASI saat dirender di website.
-- meta = data terstruktur tambahan (mis. nama kepala sekolah).
-- ============================================================
create table public.pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (char_length(title) between 1 and 200),
  subtitle        text,
  excerpt         text,
  content         text not null default '',
  cover_media_id  uuid references public.media (id) on delete set null,
  meta            jsonb not null default '{}'::jsonb check (jsonb_typeof(meta) = 'object'),
  seo_title       text,
  seo_description text,
  status          public.content_status not null default 'draft',
  published_at    timestamptz,
  created_by      uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index pages_status_idx on public.pages (status);

-- ============================================================
-- SLIDE HERO BERANDA
-- ============================================================
create table public.hero_slides (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  highlight       text,          -- kata/frasa berwarna emas pada judul
  description     text,
  primary_label   text,
  primary_href    text,
  secondary_label text,
  secondary_href  text,
  media_id        uuid references public.media (id) on delete set null,
  sort_order      integer not null default 0,
  status          public.content_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index hero_slides_order_idx on public.hero_slides (status, sort_order);

-- ============================================================
-- JENJANG AKADEMIK (KB–TK, SD, SMP, SMA)
-- programs = array objek [{ "title": "...", "description": "...", "icon": "book" }]
-- ============================================================
create table public.academic_levels (
  id              uuid primary key default gen_random_uuid(),
  code            public.academic_level_code not null unique,
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name            text not null,
  short_name      text,
  tagline         text,
  summary         text,
  content         text not null default '',
  cover_media_id  uuid references public.media (id) on delete set null,
  programs        jsonb not null default '[]'::jsonb check (jsonb_typeof(programs) = 'array'),
  sort_order      integer not null default 0,
  status          public.content_status not null default 'draft',
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- FASILITAS
-- ============================================================
create table public.facilities (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  summary     text,
  content     text not null default '',
  icon        text,
  media_id    uuid references public.media (id) on delete set null,
  sort_order  integer not null default 0,
  status      public.content_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index facilities_order_idx on public.facilities (status, sort_order);

-- ============================================================
-- BERITA & KEGIATAN
-- ============================================================
create table public.news_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create table public.news (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (char_length(title) between 1 and 200),
  excerpt         text,
  content         text not null default '',
  cover_media_id  uuid references public.media (id) on delete set null,
  category_id     uuid references public.news_categories (id) on delete set null,
  is_featured     boolean not null default false,
  author_id       uuid references public.profiles (id) on delete set null default auth.uid(),
  author_name     text,            -- nama yang ditampilkan di website
  status          public.content_status not null default 'draft',
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  search          tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, ''))
  ) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index news_listing_idx  on public.news (status, published_at desc);
create index news_category_idx on public.news (category_id);
create index news_featured_idx on public.news (published_at desc) where is_featured;
create index news_search_idx   on public.news using gin (search);

-- ============================================================
-- GALERI (album + item foto)
-- ============================================================
create table public.galleries (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null,
  description     text,
  event_date      date,
  cover_media_id  uuid references public.media (id) on delete set null,
  show_on_home    boolean not null default false,
  sort_order      integer not null default 0,
  status          public.content_status not null default 'draft',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index galleries_listing_idx on public.galleries (status, published_at desc);

create table public.gallery_items (
  id          uuid primary key default gen_random_uuid(),
  gallery_id  uuid not null references public.galleries (id) on delete cascade,
  media_id    uuid not null references public.media (id) on delete cascade,
  caption     text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (gallery_id, media_id)
);
create index gallery_items_order_idx on public.gallery_items (gallery_id, sort_order);

-- ============================================================
-- INFORMASI PENERIMAAN SISWA BARU (tahap, persyaratan, FAQ, catatan)
-- level null = berlaku untuk semua jenjang
-- ============================================================
create table public.admission_info (
  id          uuid primary key default gen_random_uuid(),
  section     public.admission_section not null,
  title       text not null,
  body        text not null default '',
  level       public.academic_level_code,
  sort_order  integer not null default 0,
  status      public.content_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index admission_info_idx on public.admission_info (status, section, sort_order);

-- ============================================================
-- INQUIRY (pertanyaan dari form admisi/kontak)
-- Hanya Edge Function `submit-inquiry` (service role) yang menulis.
-- ============================================================
create table public.inquiries (
  id               uuid primary key default gen_random_uuid(),
  source           text not null default 'admission' check (source in ('admission', 'contact')),
  parent_name      text not null check (char_length(parent_name) between 2 and 120),
  email            text check (char_length(email) <= 254),
  phone            text check (char_length(phone) <= 20),
  student_name     text check (char_length(student_name) <= 120),
  interested_level public.academic_level_code,
  message          text not null check (char_length(message) between 5 and 4000),
  status           public.inquiry_status not null default 'new',
  internal_notes   text,
  handled_by       uuid references public.profiles (id) on delete set null,
  handled_at       timestamptz,
  ip_hash          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (email is not null or phone is not null)
);
create index inquiries_status_idx on public.inquiries (status, created_at desc);
create index inquiries_ip_idx     on public.inquiries (ip_hash, created_at desc);

-- ============================================================
-- TRIGGER: updated_at dan published_at
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'site_settings', 'pages', 'hero_slides', 'academic_levels',
    'facilities', 'news', 'galleries', 'admission_info', 'inquiries'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;

  foreach t in array array['pages', 'news', 'galleries'] loop
    execute format(
      'create trigger set_published_at before insert or update on public.%I
         for each row execute function public.set_published_at()', t);
  end loop;
end;
$$;
