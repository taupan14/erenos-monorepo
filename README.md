# Erenos Christian School — Website + CMS

Monorepo (pnpm workspaces): website publik, CMS admin, paket bersama, dan backend Supabase.

```
apps/web          Website publik (Next.js)            → erenos.sch.id
apps/cms          CMS admin (Next.js, port 3001)      → cms.erenos.sch.id
packages/shared   Konstanta, tipe, utilitas bersama
supabase/         Migrasi SQL, seed, Edge Functions
```

## Prasyarat

Node.js ≥ 20.9, pnpm, [Supabase CLI](https://supabase.com/docs/guides/cli).
Docker hanya diperlukan untuk menjalankan Supabase di komputer sendiri (bagian "Setup lokal").
Tanpa Docker, ikuti bagian "Setup tanpa Docker" di bawah.

## Setup lokal

```bash
pnpm install

supabase init                 # sekali saja — membuat supabase/config.toml
# edit supabase/config.toml (lihat bagian "Konfigurasi Supabase")
supabase start                # tampilkan URL + kunci API
supabase db reset             # jalankan migrasi + seed.sql

cp apps/web/.env.example apps/web/.env.local   # isi kunci dari `supabase start`
cp apps/cms/.env.example apps/cms/.env.local

pnpm dev                      # web :3000, cms :3001
pnpm db:types                 # generate tipe TypeScript dari skema
```

### Super admin pertama

Buat akun di Studio lokal (Authentication → Users), lalu jalankan di SQL Editor:

```sql
update public.profiles set role = 'super_admin', full_name = 'Nama Anda'
where id = (select id from auth.users where email = 'email-anda@contoh.com');
```

Akun baru selalu berperan `editor`; peran tidak pernah diambil dari metadata pengguna.

## Setup tanpa Docker (project Supabase cloud)

Docker hanya dibutuhkan untuk `supabase start`, `supabase db reset`, dan `supabase functions serve`.
Dengan project di supabase.com, semua langkah berikut berjalan tanpa Docker.

1. **Buat project** di [supabase.com](https://supabase.com) (pilih region terdekat, mis. Singapore).
   Catat Project Ref (bagian `xxxx` pada `xxxx.supabase.co`), URL, dan kunci publishable
   (Project Settings → API).
2. **Install dan siapkan CLI:** `pnpm install`, lalu `supabase init` (membuat `supabase/config.toml`;
   tidak memakai Docker). Atur `config.toml` sesuai bagian "Konfigurasi Supabase" di bawah.
3. **Jalankan migrasi** dengan salah satu cara:
   - CLI:
     ```bash
     supabase login
     supabase link --project-ref <project-ref>
     supabase db push
     ```
   - Dashboard: buka **SQL Editor**, lalu tempel dan jalankan berurutan kedelapan file di
     `supabase/migrations/` (urut nama file: `…0001` sampai `…0006`, lalu `20261110000001_i18n_and_stats.sql` dan `20261111000001_level_facts_gallery.sql`), kemudian `supabase/seed.sql`.
     `db push` tidak menjalankan seed, jadi `seed.sql` selalu dijalankan manual di SQL Editor.
     Opsional, hanya untuk development: jalankan juga `supabase/seed_demo.sql` agar Beranda terisi
     data contoh (slide, fasilitas, berita) sebelum CMS jadi. **Jangan dijalankan di produksi.**
4. **Matikan pendaftaran publik:** Authentication → Sign In / Providers → matikan
   "Allow new users to sign up".
5. **Buat super admin pertama:** Authentication → Users → Add user, lalu jalankan SQL
   di bagian "Super admin pertama" di atas.
6. **Deploy Edge Function:**
   ```bash
   supabase secrets set ALLOWED_ORIGINS="http://localhost:3000,https://erenos.sch.id" \
     IP_HASH_SALT="$(openssl rand -hex 24)"
   supabase functions deploy submit-inquiry --use-api
   supabase functions deploy subscribe --use-api   # deploy ulang bila sudah pernah: pesan galat kini dwibahasa
   ```
   Pastikan "Verify JWT" untuk `submit-inquiry` dan `subscribe` nonaktif (lewat `config.toml` atau dashboard),
   karena endpoint ini publik. Flag `--use-api` membuat deploy tidak memerlukan Docker;
   cek `supabase functions deploy --help` karena perilaku bawaan CLI bisa berubah antarversi.
7. **Generate tipe TypeScript** dari project cloud (menggantikan `pnpm db:types` yang memakai `--local`):
   ```bash
   supabase gen types typescript --project-id <project-ref> > packages/shared/src/database.types.ts
   ```
8. **Isi `.env.local`** di `apps/web` dan `apps/cms` dengan URL dan kunci project cloud
   (lihat `.env.example`), lalu jalankan `pnpm dev`.

Perbedaan dibanding setup lokal:

- `supabase functions serve` tidak tersedia tanpa Docker. Uji fungsi dengan men-deploy ke project
  development, atau lewat penguji bawaan di dashboard (Edge Functions → pilih fungsi → Test).
- Bila menempelkan fungsi ke editor dashboard, isi `supabase/functions/_shared/cors.ts` harus
  digabung ke dalam `index.ts` (editor dashboard tidak mengimpor file lain). Lewat CLI tidak masalah.
- Gunakan **dua project Supabase**, satu untuk development dan satu untuk produksi, agar uji coba
  tidak mengotori data sekolah. Cek batas jumlah project pada paket Anda.

## Pemecahan masalah

**`permission denied for table ...` (kode 42501):** Supabase tidak lagi memberi hak akses otomatis
pada tabel baru di schema `public`; hak akses harus eksplisit lewat `GRANT`. Migrasi
`20261109000005_grants.sql` menanganinya. Jalankan `supabase db push`, atau tempel isi file itu di
SQL Editor. Setiap tabel baru di migrasi mendatang harus menyertakan `GRANT`-nya sendiri
(lihat contoh di file tersebut). Catatan: grant yang hilang juga menghasilkan error ini untuk
`service_role`, bukan hanya `anon`.

## Konfigurasi Supabase (`supabase/config.toml`)

```toml
[auth]
enable_signup = false          # akun staf dibuat oleh super admin, bukan pendaftaran publik

[functions.submit-inquiry]
verify_jwt = false             # endpoint publik; divalidasi sendiri (honeypot, batas laju, CORS)

[functions.subscribe]
verify_jwt = false             # idem (form berlangganan di footer)
```

Pengaturan yang sama berlaku di dashboard produksi (Authentication → Sign In / Providers → matikan "Allow new users to sign up").

## Edge Function `submit-inquiry` dan `subscribe`

Keduanya berbagi helper di `supabase/functions/_shared/` dan secret yang sama.

```bash
supabase secrets set ALLOWED_ORIGINS="https://erenos.sch.id,https://www.erenos.sch.id" \
  IP_HASH_SALT="$(openssl rand -hex 24)" \
  RESEND_API_KEY="..." INQUIRY_FROM_EMAIL="Erenos <info@erenos.sch.id>" \
  INQUIRY_NOTIFY_TO="admisi@erenos.sch.id"       # tiga terakhir opsional
supabase functions deploy submit-inquiry
supabase functions deploy subscribe
```

Lokal: `supabase functions serve submit-inquiry --env-file supabase/functions/.env`.
Endpoint: `POST {SUPABASE_URL}/functions/v1/submit-inquiry` dengan JSON
`{ parent_name, email?, phone?, student_name?, interested_level?, message, source?, website }`
(`website` = field honeypot, harus dikosongkan di form).

`POST {SUPABASE_URL}/functions/v1/subscribe` dengan JSON `{ email, website }` (honeypot sama). Respons selalu
`{ ok: true }` untuk email valid, baik baru, sudah terdaftar, maupun berlangganan ulang, agar daftar pelanggan
tidak bisa ditebak. Batas 5 pendaftaran baru per jam per IP. Data tersimpan di tabel `subscribers`
(hanya super admin yang bisa membaca).

## Hak akses

| Modul                                                    | Pengunjung    | Editor            | Super Admin          |
| -------------------------------------------------------- | ------------- | ----------------- | -------------------- |
| Halaman, hero, jenjang, fasilitas, berita, galeri, media | baca (terbit) | kelola            | kelola               |
| Informasi admisi (tahap, syarat, FAQ)                    | baca (terbit) | —                 | kelola               |
| Pengaturan situs                                         | baca          | —                 | ubah                 |
| Inquiry                                                  | —             | —                 | lihat, proses, hapus |
| Akun staf                                                | —             | ubah nama sendiri | kelola               |

Dikunci di database (RLS), bukan hanya di antarmuka CMS.

## Deploy ke Vercel (dua project dari satu repositori)

|                | `erenos-web`                                                                                                    | `erenos-cms`                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Root Directory | `apps/web`                                                                                                      | `apps/cms`                                                                                         |
| Framework      | Next.js                                                                                                         | Next.js                                                                                            |
| Domain         | `erenos.sch.id`                                                                                                 | `cms.erenos.sch.id`                                                                                |
| Env            | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `WEB_URL`, `REVALIDATE_SECRET` |

Aktifkan opsi "Include source files outside of the Root Directory in the Build Step" agar `packages/shared` ikut terbaca.

Produksi Supabase: `supabase link --project-ref <ref>` → `supabase db push` → jalankan `supabase/seed.sql` manual di SQL Editor (db push tidak menjalankan seed) → atur Site URL dan Redirect URLs di Authentication.

## Revalidasi konten (CMS → website)

Website bersifat statis dan diperbarui otomatis tiap 5 menit. Agar perubahan dari CMS tampil seketika,
CMS memanggil `POST {WEB_URL}/api/revalidate` dengan header `x-revalidate-secret: <REVALIDATE_SECRET>`
dan body opsional `{ "paths": ["/", "/berita"] }` (tanpa body = seluruh situs). Buat rahasia dengan
`openssl rand -hex 32`; nilainya **harus sama** di `apps/web` dan `apps/cms`, dan jangan pakai prefix `NEXT_PUBLIC_`.

## Data fallback di website

Bila CMS/database belum berisi konten, Beranda tetap tampil utuh: slide hero, daftar jenjang, dan strip foto
memakai konten bawaan atau placeholder bertema biru; bagian fasilitas dan berita disembunyikan.
Setelah foto diunggah lewat CMS (Supabase Storage), placeholder otomatis diganti foto.

## Dwibahasa (ID/EN)

- **Routing:** semua halaman ada di `/id/...` dan `/en/...`. Path tanpa awalan dialihkan (`proxy.ts`) ke bahasa pilihan terakhir
  (cookie `NEXT_LOCALE`) atau Indonesia. Pengalih **ID | EN** ada di header dan footer; slug sama untuk kedua bahasa.
- **Teks antarmuka:** `apps/web/messages/id.json` dan `en.json` (strukturnya harus identik; TypeScript yang memeriksanya).
  Untuk menambah bahasa, tambah file kamus dan daftarkan di `lib/i18n.ts` + `lib/messages.ts`.
- **Konten dari database:** kolom Indonesia tetap utama; terjemahan di kolom `<nama>_en` (mis. `title_en`, `summary_en`).
  Bila `_en` kosong, website menampilkan teks Indonesia. **Berita tidak dwibahasa**; hanya nama kategori (`name_en`),
  label bagian, dan format tanggal yang mengikuti bahasa. Item di `academic_levels.programs` memakai kunci `title`/`title_en`.
- **Edge Function** menerima field `locale` ("id"/"en") untuk bahasa pesan galat.
- **SEO:** tiap halaman menyertakan canonical dan hreflang (`alternatesFor` di `lib/i18n.ts`); gunakan di setiap halaman baru.
- Terjemahan bawaan (menu, tombol, teks seed) dibuat sebagai draf; mohon ditinjau pihak sekolah.

## Statistik Beranda dan foto model

Kolom `site_settings.stat_students`, `stat_certified_teachers`, `stat_graduation_rate` mengisi bagian "Erenos dalam angka".
Bila kosong, website memakai **angka contoh** (`SAMPLE_STATS` di `lib/site.ts`) dan menampilkan peringatan di mode development.
**Isi dengan data asli sebelum website dipublikasikan**, misalnya di SQL Editor:

```sql
update public.site_settings set stat_students = 1200, stat_certified_teachers = 80, stat_graduation_rate = 100 where id = 1;
```

Foto model banner pendaftaran: `site_settings.admission_model_media_id` (PNG tanpa latar dari tabel `media`). Tanpa foto, tampil siluet placeholder.

## Halaman publik dan struktur datanya

Semua halaman dwibahasa (`/id`, `/en`) kecuali isi berita. Konten diisi lewat CMS (sementara lewat SQL/Table Editor).
Bagian yang kosong memakai teks bawaan atau placeholder, atau disembunyikan (ditandai di bawah).

| Halaman                         | Sumber data                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/tentang`                      | Tabel `pages` slug `tentang-kami` (profil: `content`/`excerpt`, foto: `cover_media_id`), `visi-misi` (`meta`: `vision`, `mission`, `vision_en`, `mission_en`), `nilai-kristiani` (`content`; **disembunyikan bila kosong**), `sambutan-kepala-sekolah` (`excerpt` = kutipan, `content`, foto, `meta.principal_name`), `sejarah` (`meta.timeline`: `[{year,title,title_en,text,text_en}]`; **disembunyikan bila kosong**) |
| `/akademik`, `/akademik/[slug]` | `academic_levels`: `summary`, `content`, foto sampul (juga dipakai di banner), `programs` (`[{title,title_en,description,description_en,icon}]`), `facts` (maks. 3: `[{label,label_en,value}]`), `gallery_id` (album untuk strip "Kegiatan")                                                                                                                                                                             |
| `/fasilitas`                    | `facilities`: `name`, `summary`, `icon`, foto. Ukuran kartu bento mengikuti urutan                                                                                                                                                                                                                                                                                                                                       |
| `/berita`, `/berita/[slug]`     | `news` + `news_categories`. Pencarian memakai kolom `search`; 10 berita di halaman 1 (1 utama + 9), 9 per halaman berikutnya                                                                                                                                                                                                                                                                                             |
| `/galeri`, `/galeri/[slug]`     | `galleries` + `gallery_items` (lightbox: panah, keyboard ← →, Esc, thumbnail)                                                                                                                                                                                                                                                                                                                                            |
| `/admisi`                       | `admission_info`: seksi `step`, `requirement` (baris dengan `level` kosong berlaku untuk semua jenjang; dokumen bernama sama digabung menjadi satu baris matriks), `faq`, `note`                                                                                                                                                                                                                                         |
| `/kontak`                       | `site_settings`: alamat, telepon, WhatsApp, email, `office_hours`, media sosial, `maps_embed_url` (boleh menempel kode `<iframe>` dari Google Maps; hanya domain Google Maps yang diterima)                                                                                                                                                                                                                              |

- **Keamanan HTML:** isi `content` dari editor selalu disanitasi (`lib/sanitize.ts`): `<script>`, atribut `on*`, `javascript:`, dan `<iframe>` dibuang.
- **Formulir** admisi dan kontak memanggil Edge Function `submit-inquiry` (harus sudah di-deploy; `ALLOWED_ORIGINS` memuat domain website).
- **Header** menyembunyikan diri saat scroll ke bawah dan muncul saat scroll ke atas; tetap tampil bila menu terbuka, fokus keyboard di dalamnya, atau pengguna memakai prefers-reduced-motion.
- **SEO:** `sitemap.xml` dan `robots.txt` dibuat otomatis (dwibahasa + hreflang). **Isi `NEXT_PUBLIC_SITE_URL`** dengan domain final agar URL di sitemap benar. Hasil pencarian dan halaman berita lanjutan diberi `noindex`.
- Data contoh Tahap 3 ada di `supabase/seed_demo.sql` (hanya untuk development).
