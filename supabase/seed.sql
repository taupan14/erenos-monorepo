-- Data awal (idempotent). Lokal: otomatis lewat `supabase db reset`.
-- Produksi: jalankan manual di SQL Editor (db push tidak menjalankan seed).

insert into public.site_settings (id, tagline, motto)
values (1, 'Sekolah Kristen KB–TK, SD, SMP, dan SMA', 'Iman, Ilmu dan Damai Sejahtera')
on conflict (id) do nothing;

insert into public.news_categories (slug, name, sort_order) values
  ('pengumuman', 'Pengumuman', 1),
  ('kegiatan',   'Kegiatan',   2),
  ('prestasi',   'Prestasi',   3),
  ('artikel',    'Artikel',    4)
on conflict (slug) do nothing;

-- Jenjang dibuat berstatus draft; terbit setelah konten diisi lewat CMS
insert into public.academic_levels (code, slug, name, short_name, sort_order) values
  ('kb_tk', 'kb-tk', 'Kelompok Bermain & Taman Kanak-kanak', 'KB–TK', 1),
  ('sd',    'sd',    'Sekolah Dasar',                         'SD',    2),
  ('smp',   'smp',   'Sekolah Menengah Pertama',              'SMP',   3),
  ('sma',   'sma',   'Sekolah Menengah Atas',                 'SMA',   4)
on conflict (code) do nothing;

insert into public.pages (slug, title) values
  ('tentang-kami',            'Tentang Kami'),
  ('visi-misi',               'Visi & Misi'),
  ('nilai-kristiani',         'Nilai Kristiani'),
  ('sambutan-kepala-sekolah', 'Sambutan Kepala Sekolah'),
  ('sejarah',                 'Sejarah Sekolah')
on conflict (slug) do nothing;

-- Super admin pertama (lakukan setelah membuat akun lewat Dashboard > Authentication > Users):
-- update public.profiles set role = 'super_admin', full_name = 'Nama Anda'
-- where id = (select id from auth.users where email = 'email-anda@contoh.com');
