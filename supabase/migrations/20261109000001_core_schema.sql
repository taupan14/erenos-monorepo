-- Erenos Christian School — skema inti
-- Isi: enum, fungsi umum, akun staf (profiles), media, pengaturan situs.
-- Jalankan: `supabase db reset` (lokal) atau `supabase db push` (produksi).

-- ============================================================
-- ENUM
-- ============================================================
create type public.user_role as enum ('super_admin', 'editor');
create type public.content_status as enum ('draft', 'published', 'archived');
create type public.academic_level_code as enum ('kb_tk', 'sd', 'smp', 'sma');
create type public.inquiry_status as enum ('new', 'in_progress', 'resolved', 'spam');
create type public.admission_section as enum ('step', 'requirement', 'faq', 'note');

-- ============================================================
-- FUNGSI UMUM (trigger)
-- ============================================================
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Isi published_at otomatis saat status pertama kali menjadi 'published'
create function public.set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

-- ============================================================
-- PROFIL STAF (1:1 dengan auth.users)
-- Pendaftaran publik HARUS dimatikan di Supabase Auth (enable_signup = false);
-- akun staf dibuat oleh super admin.
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  role        public.user_role not null default 'editor',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Helper otorisasi — dipakai oleh kebijakan RLS
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active
  );
$$;

create function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active and role = 'super_admin'
  );
$$;

revoke all on function public.is_staff() from public, anon;
revoke all on function public.is_super_admin() from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

-- Buat profil otomatis (selalu role 'editor') setiap ada akun baru.
-- Role tidak pernah diambil dari metadata pengguna, agar tidak bisa dimanipulasi.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Penjaga: hanya super admin yang boleh ubah role/status akun,
-- dan tidak boleh ada kondisi tanpa super admin aktif.
create function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'ID profil tidak boleh diubah' using errcode = '42501';
  end if;

  -- auth.uid() null = service role / SQL editor (dipercaya)
  if (select auth.uid()) is not null and not public.is_super_admin() then
    if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
      raise exception 'Hanya super admin yang boleh mengubah peran atau status akun'
        using errcode = '42501';
    end if;
  end if;

  if old.role = 'super_admin' and old.is_active
     and (new.role <> 'super_admin' or not new.is_active)
     and not exists (
       select 1 from public.profiles
       where role = 'super_admin' and is_active and id <> old.id
     ) then
    raise exception 'Harus ada minimal satu super admin aktif' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_profile_update() from public, anon, authenticated;

create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ============================================================
-- MEDIA (metadata file di Supabase Storage, bucket 'media')
-- ============================================================
create table public.media (
  id          uuid primary key default gen_random_uuid(),
  bucket      text not null default 'media',
  path        text not null unique,
  file_name   text not null,
  mime_type   text not null,
  size_bytes  bigint not null check (size_bytes >= 0),
  width       integer check (width > 0),
  height      integer check (height > 0),
  alt_text    text not null default '' check (char_length(alt_text) <= 300),
  uploaded_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);

create index media_created_at_idx on public.media (created_at desc);

-- ============================================================
-- PENGATURAN SITUS (satu baris: id = 1)
-- ============================================================
create table public.site_settings (
  id                   smallint primary key default 1 check (id = 1),
  school_name          text not null default 'Erenos Christian School',
  tagline              text,
  motto                text,
  logo_media_id        uuid references public.media (id) on delete set null,
  -- kontak
  address              text,
  phone                text,
  whatsapp             text,
  email                text,
  office_hours         text,
  maps_embed_url       text,
  -- media sosial
  facebook_url         text,
  instagram_url        text,
  youtube_url          text,
  tiktok_url           text,
  -- penerimaan siswa baru
  admission_open       boolean not null default true,
  admission_badge_text text not null default 'Pendaftaran Dibuka',
  admission_cta_title  text,
  admission_cta_text   text,
  -- SEO bawaan
  seo_title            text,
  seo_description      text,
  og_media_id          uuid references public.media (id) on delete set null,
  updated_at           timestamptz not null default now()
);
