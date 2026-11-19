#!/usr/bin/env node
// Memeriksa apakah semua file rute website ada di tempat yang benar dan isinya sesuai.
// Jalankan dari root proyek:  pnpm check:routes
//
// Penyebab umum "404 Halaman tidak ditemukan": file page.tsx belum tertaruh, salah folder,
// atau tertimpa file page.tsx lain (semua halaman bernama sama: page.tsx).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const L = "apps/web/app/[locale]";

// [path relatif, kata penanda yang HARUS ada di dalam file, URL yang dilayani]
const EXPECTED = [
  [`${L}/layout.tsx`, "RootLayout", "(layout semua halaman)"],
  [`${L}/page.tsx`, "HomePage", "/id  /en"],
  [`${L}/not-found.tsx`, "NotFound", "(halaman 404 bermerek)"],
  [`${L}/[...rest]/page.tsx`, "CatchAll", "(URL tak dikenal → 404)"],
  [`${L}/tentang/page.tsx`, "AboutPage", "/id/tentang"],
  [`${L}/akademik/page.tsx`, "AcademicsPage", "/id/akademik"],
  [`${L}/akademik/[slug]/page.tsx`, "LevelPage", "/id/akademik/sd"],
  [`${L}/fasilitas/page.tsx`, "FacilitiesPage", "/id/fasilitas"],
  [`${L}/berita/page.tsx`, "NewsPage", "/id/berita"],
  [`${L}/berita/[slug]/page.tsx`, "NewsDetailPage", "/id/berita/judul-berita"],
  [`${L}/galeri/page.tsx`, "GalleryPage", "/id/galeri"],
  [`${L}/galeri/[slug]/page.tsx`, "AlbumPage", "/id/galeri/nama-album"],
  [`${L}/admisi/page.tsx`, "AdmissionPage", "/id/admisi"],
  [`${L}/kontak/page.tsx`, "ContactPage", "/id/kontak"],
  [`${L}/faq/page.tsx`, "FaqPage", "/id/faq"],
  [`${L}/kebijakan-privasi/page.tsx`, "PrivacyPage", "/id/kebijakan-privasi"],
  [`${L}/syarat-ketentuan/page.tsx`, "TermsPage", "/id/syarat-ketentuan"],
  [
    `${L}/berhenti-berlangganan/page.tsx`,
    "UnsubscribePage",
    "/id/berhenti-berlangganan",
  ],
  ["apps/web/proxy.ts", "export function proxy", "(pengalihan /  → /id)"],
  ["apps/web/app/sitemap.ts", "sitemap", "/sitemap.xml"],
  ["apps/web/app/robots.ts", "robots", "/robots.txt"],
  ["apps/web/app/api/revalidate/route.ts", "revalidatePath", "/api/revalidate"],
];

// File lama yang HARUS dihapus (digantikan app/[locale]/...); bila ada, rute bentrok
const STALE = [
  "apps/web/app/layout.tsx",
  "apps/web/app/page.tsx",
  "apps/web/app/not-found.tsx",
];

let problems = 0;
const pad = (s, n) => s + " ".repeat(Math.max(1, n - s.length));

console.log("\nPemeriksaan rute website Erenos\n");
for (const [rel, marker, url] of EXPECTED) {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    problems++;
    console.log(`  ✗ HILANG   ${pad(rel, 52)} → ${url}`);
    continue;
  }
  const text = readFileSync(abs, "utf8");
  if (!text.includes(marker)) {
    problems++;
    console.log(
      `  ⚠ SALAH ISI ${pad(rel, 51)} (tidak memuat "${marker}": kemungkinan tertimpa page.tsx lain)`,
    );
    continue;
  }
  console.log(`  ✓ ada      ${pad(rel, 52)} → ${url}`);
}

for (const rel of STALE) {
  if (existsSync(join(root, rel))) {
    problems++;
    console.log(
      `  ✗ HAPUS    ${rel}  (file lama, bentrok dengan app/[locale])`,
    );
  }
}

console.log(
  problems === 0
    ? "\nSemua rute lengkap. Bila masih 404: hentikan server, jalankan  rm -rf apps/web/.next  lalu  pnpm dev  lagi.\n"
    : `\n${problems} masalah ditemukan. Perbaiki sesuai tanda di atas, lalu hentikan server, hapus apps/web/.next, dan jalankan pnpm dev lagi.\n`,
);
process.exit(problems === 0 ? 0 : 1);
