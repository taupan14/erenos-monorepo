// Definisi bidang pengaturan situs per bagian. Dipakai formulir (client) dan validasi (server).
// Nama bidang = nama kolom di tabel site_settings. `en` = kolom terjemahan Inggris.

export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "tel"
  | "int"
  | "toggle"
  | "media";

export type Field = {
  name: string;
  en?: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  max?: number;
  maxValue?: number;
  hint?: string;
};

export type Section = {
  id: string;
  label: string;
  description: string;
  fields: Field[];
};

export const SECTIONS: Section[] = [
  {
    id: "identitas",
    label: "Identitas",
    description: "Nama, tagline, motto, dan logo sekolah.",
    fields: [
      {
        name: "school_name",
        label: "Nama sekolah",
        kind: "text",
        required: true,
        max: 120,
      },
      { name: "tagline", en: "tagline_en", label: "Tagline", kind: "text" },
      { name: "motto", en: "motto_en", label: "Motto", kind: "text" },
      {
        name: "logo_media_id",
        label: "Logo",
        kind: "media",
        hint: "Dipakai di header dan footer website.",
      },
    ],
  },
  {
    id: "topbar",
    label: "Top bar",
    description:
      "Teks berjalan di bilah atas website, di antara kontak dan tombol pendaftaran.",
    fields: [
      {
        name: "topbar_text",
        en: "topbar_text_en",
        label: "Teks berjalan",
        kind: "textarea",
        max: 1000,
        hint: "Satu pengumuman per baris (maksimal 10 baris, 200 karakter per baris; selebihnya diabaikan website). Kosongkan untuk menyembunyikan teks berjalan.",
      },
    ],
  },
  {
    id: "kontak",
    label: "Kontak",
    description: "Alamat, telepon, email, jam layanan, dan peta.",
    fields: [
      { name: "address", label: "Alamat", kind: "textarea", max: 500 },
      { name: "phone", label: "Telepon", kind: "tel" },
      {
        name: "whatsapp",
        label: "WhatsApp",
        kind: "tel",
        hint: "Format internasional, mis. 62812…",
      },
      { name: "email", label: "Email", kind: "email" },
      {
        name: "office_hours",
        en: "office_hours_en",
        label: "Jam layanan",
        kind: "text",
      },
      {
        name: "maps_embed_url",
        label: "Peta (Google Maps)",
        kind: "textarea",
        max: 1000,
        hint: "Tempel URL embed atau kode iframe dari Google Maps.",
      },
    ],
  },
  {
    id: "sosial",
    label: "Media sosial",
    description: "Tautan akun resmi sekolah.",
    fields: [
      { name: "facebook_url", label: "Facebook", kind: "url" },
      { name: "instagram_url", label: "Instagram", kind: "url" },
      { name: "youtube_url", label: "YouTube", kind: "url" },
      { name: "tiktok_url", label: "TikTok", kind: "url" },
    ],
  },
  {
    id: "ppdb",
    label: "Pendaftaran (PPDB)",
    description: "Lencana, ajakan, dan foto model pada banner pendaftaran.",
    fields: [
      {
        name: "admission_open",
        label: "Pendaftaran dibuka",
        kind: "toggle",
        hint: "Mengatur lencana, teks ajakan, dan tombol di website.",
      },
      {
        name: "admission_badge_text",
        en: "admission_badge_text_en",
        label: "Teks lencana",
        kind: "text",
        required: true,
        max: 60,
      },
      {
        name: "admission_cta_title",
        en: "admission_cta_title_en",
        label: "Judul ajakan",
        kind: "text",
      },
      {
        name: "admission_cta_text",
        en: "admission_cta_text_en",
        label: "Teks ajakan",
        kind: "textarea",
      },
      {
        name: "admission_model_media_id",
        label: "Foto model",
        kind: "media",
        hint: "PNG tanpa latar belakang untuk banner pendaftaran.",
      },
    ],
  },
  {
    id: "seo",
    label: "SEO",
    description:
      "Judul, deskripsi, dan gambar pratinjau saat tautan dibagikan.",
    fields: [
      {
        name: "seo_title",
        en: "seo_title_en",
        label: "Judul SEO",
        kind: "text",
        max: 70,
      },
      {
        name: "seo_description",
        en: "seo_description_en",
        label: "Deskripsi SEO",
        kind: "textarea",
        max: 160,
        hint: "Disarankan maksimal 160 karakter.",
      },
      {
        name: "og_media_id",
        label: "Gambar pratinjau",
        kind: "media",
        hint: "Disarankan 1200 × 630 piksel.",
      },
    ],
  },
  {
    id: "statistik",
    label: "Statistik beranda",
    description:
      "Angka yang tampil di Beranda. Kosongkan untuk memakai angka contoh.",
    fields: [
      {
        name: "stat_students",
        label: "Murid aktif",
        kind: "int",
        maxValue: 100000,
      },
      {
        name: "stat_certified_teachers",
        label: "Guru bersertifikat",
        kind: "int",
        maxValue: 100000,
      },
      {
        name: "stat_graduation_rate",
        label: "Tingkat kelulusan (%)",
        kind: "int",
        maxValue: 100,
        hint: "Isi dengan angka asli sebelum website dirilis.",
      },
    ],
  },
];
