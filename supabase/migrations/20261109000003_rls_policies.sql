-- Erenos Christian School — Row Level Security
-- Peran:
--   anon          : hanya membaca konten berstatus 'published'
--   editor        : kelola halaman, jenjang, fasilitas, berita, galeri, hero, media
--   super_admin   : semua modul (termasuk admisi, pengaturan situs, inquiry, akun)
--   service_role  : Edge Function (menulis inquiry) — melewati RLS

alter table public.profiles        enable row level security;
alter table public.media           enable row level security;
alter table public.site_settings   enable row level security;
alter table public.pages           enable row level security;
alter table public.hero_slides     enable row level security;
alter table public.academic_levels enable row level security;
alter table public.facilities      enable row level security;
alter table public.news_categories enable row level security;
alter table public.news            enable row level security;
alter table public.galleries       enable row level security;
alter table public.gallery_items   enable row level security;
alter table public.admission_info  enable row level security;
alter table public.inquiries       enable row level security;

-- ============================================================
-- Pengunjung publik: baca konten terbit
-- ============================================================
create policy pages_public_read on public.pages
  for select to anon, authenticated using (status = 'published');

create policy hero_slides_public_read on public.hero_slides
  for select to anon, authenticated using (status = 'published');

create policy academic_levels_public_read on public.academic_levels
  for select to anon, authenticated using (status = 'published');

create policy facilities_public_read on public.facilities
  for select to anon, authenticated using (status = 'published');

create policy news_public_read on public.news
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy news_categories_public_read on public.news_categories
  for select to anon, authenticated using (true);

create policy galleries_public_read on public.galleries
  for select to anon, authenticated using (status = 'published');

create policy gallery_items_public_read on public.gallery_items
  for select to anon, authenticated
  using (exists (
    select 1 from public.galleries g
    where g.id = gallery_items.gallery_id and g.status = 'published'
  ));

create policy admission_info_public_read on public.admission_info
  for select to anon, authenticated using (status = 'published');

create policy media_public_read on public.media
  for select to anon, authenticated using (true);

create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);

-- ============================================================
-- Staf (editor + super admin): kelola konten
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'pages', 'hero_slides', 'academic_levels', 'facilities',
    'news', 'news_categories', 'galleries', 'gallery_items', 'media'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select public.is_staff()))
         with check ((select public.is_staff()))',
      t || '_staff_all', t);
  end loop;
end;
$$;

-- ============================================================
-- Hanya super admin
-- ============================================================
create policy admission_info_admin_all on public.admission_info
  for all to authenticated
  using ((select public.is_super_admin()))
  with check ((select public.is_super_admin()));

create policy site_settings_admin_write on public.site_settings
  for all to authenticated
  using ((select public.is_super_admin()))
  with check ((select public.is_super_admin()));

create policy inquiries_admin_select on public.inquiries
  for select to authenticated using ((select public.is_super_admin()));

create policy inquiries_admin_update on public.inquiries
  for update to authenticated
  using ((select public.is_super_admin()))
  with check ((select public.is_super_admin()));

create policy inquiries_admin_delete on public.inquiries
  for delete to authenticated using ((select public.is_super_admin()));
-- Tidak ada policy INSERT untuk inquiries: penulisan hanya lewat Edge Function.

-- ============================================================
-- Profil
-- ============================================================
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_super_admin()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- (role/is_active dijaga oleh trigger guard_profile_update)

create policy profiles_admin_all on public.profiles
  for all to authenticated
  using ((select public.is_super_admin()))
  with check ((select public.is_super_admin()));

-- ============================================================
-- Hak akses tabel (lapisan kedua di bawah RLS)
-- ============================================================
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke truncate on all tables in schema public from authenticated;
revoke all on public.inquiries from anon;
