import { ACADEMIC_LEVELS } from "@erenos/shared";

// Definisi bidang untuk editor konten (pages, academic_levels, hero_slides, facilities, galleries).
// Dipakai formulir (client) dan validasi (server). Nama bidang = nama kolom; kolom `_en` = terjemahan Inggris.

export type EntityName = "page" | "level" | "hero" | "facility" | "gallery";
export type ColKind = "text" | "textarea" | "rich" | "date" | "toggle";
export type Col = {
  name: string;
  en?: string;
  label: string;
  kind: ColKind;
  required?: boolean;
  max?: number;
  rows?: number;
  hint?: string;
  group?: "seo";
  validate?: "href";
};
export type ListField = {
  key: string;
  label: string;
  kind?: "text" | "textarea" | "select";
  options?: string[];
  max: number;
};
export type ListSpec = {
  key: string;
  target: "meta" | "column";
  label: string;
  itemLabel: string;
  max: number;
  hint?: string;
  fields: ListField[];
};
export type EntityDef = {
  table:
    | "pages"
    | "academic_levels"
    | "hero_slides"
    | "facilities"
    | "galleries";
  keyCol: "slug" | "id";
  coverCol: string;
  base: string;
  cols: Col[];
  metaCols: Col[];
  lists: ListSpec[];
  hasGallery: boolean;
  creatable?: boolean;
  sortable?: boolean;
  slugFrom?: string;
};
export type Row = Record<string, string>;

const SEO: Col[] = [
  {
    name: "seo_title",
    en: "seo_title_en",
    label: "Judul SEO",
    kind: "text",
    max: 70,
    group: "seo",
  },
  {
    name: "seo_description",
    en: "seo_description_en",
    label: "Deskripsi SEO",
    kind: "textarea",
    max: 160,
    group: "seo",
  },
];

export const PAGE_ORDER = [
  { slug: "tentang-kami", title: "Tentang Kami" },
  { slug: "visi-misi", title: "Visi & Misi" },
  { slug: "nilai-kristiani", title: "Nilai Kristiani" },
  { slug: "sambutan-kepala-sekolah", title: "Sambutan Kepala Sekolah" },
  { slug: "sejarah", title: "Sejarah" },
  { slug: "kebijakan-privasi", title: "Kebijakan Privasi" },
  { slug: "syarat-ketentuan", title: "Syarat & Ketentuan" },
];

const PAGE_COLS: Col[] = [
  {
    name: "title",
    en: "title_en",
    label: "Judul",
    kind: "text",
    required: true,
    max: 200,
  },
  {
    name: "subtitle",
    en: "subtitle_en",
    label: "Subjudul",
    kind: "text",
    max: 200,
  },
  {
    name: "excerpt",
    en: "excerpt_en",
    label: "Ringkasan",
    kind: "textarea",
    max: 500,
  },
  { name: "content", en: "content_en", label: "Isi", kind: "rich" },
  ...SEO,
];

export function pageDef(slug: string): EntityDef | null {
  if (!PAGE_ORDER.some((p) => p.slug === slug)) return null;
  const cols = PAGE_COLS.map((c) => {
    if (slug === "sambutan-kepala-sekolah" && c.name === "excerpt")
      return { ...c, label: "Kutipan pembuka" };
    if (slug === "nilai-kristiani" && c.name === "content") {
      return {
        ...c,
        hint: "Cadangan: dipakai website hanya bila daftar nilai di bawah masih kosong.",
      };
    }
    return c;
  });
  const metaCols: Col[] = [];
  const lists: ListSpec[] = [];
  if (slug === "tentang-kami") {
    metaCols.push(
      {
        name: "years_serving",
        label: "Lama berdiri (opsional)",
        kind: "text",
        max: 40,
      },
      {
        name: "teacher_ratio",
        label: "Rasio guru (opsional)",
        kind: "text",
        max: 40,
      },
    );
  }
  if (slug === "visi-misi") {
    metaCols.push(
      {
        name: "vision",
        en: "vision_en",
        label: "Visi",
        kind: "textarea",
        rows: 4,
        max: 2000,
        hint: "Baris baru dipertahankan di website.",
      },
      {
        name: "mission",
        en: "mission_en",
        label: "Misi",
        kind: "textarea",
        rows: 6,
        max: 4000,
        hint: "Baris baru dipertahankan di website.",
      },
    );
  }
  if (slug === "sambutan-kepala-sekolah") {
    metaCols.push({
      name: "principal_name",
      label: "Nama kepala sekolah",
      kind: "text",
      max: 120,
    });
  }
  if (slug === "sejarah") {
    lists.push({
      key: "timeline",
      target: "meta",
      label: "Garis waktu",
      itemLabel: "Peristiwa",
      max: 30,
      fields: [
        { key: "year", label: "Tahun", max: 20 },
        { key: "title", label: "Judul (Indonesia)", max: 150 },
        { key: "title_en", label: "Title (English)", max: 150 },
        {
          key: "text",
          label: "Keterangan (Indonesia)",
          kind: "textarea",
          max: 600,
        },
        {
          key: "text_en",
          label: "Description (English)",
          kind: "textarea",
          max: 600,
        },
      ],
    });
  }
  if (slug === "nilai-kristiani") {
    lists.push({
      key: "values",
      target: "meta",
      label: "Nilai-nilai",
      itemLabel: "Nilai",
      max: 6,
      hint: "Tampil sebagai kartu bernomor di halaman Tentang (tiga kolom). Tulis sumber ayat di dalam teks ayat.",
      fields: [
        { key: "title", label: "Nama nilai (Indonesia)", max: 60 },
        { key: "title_en", label: "Value name (English)", max: 60 },
        {
          key: "text",
          label: "Penjelasan (Indonesia)",
          kind: "textarea",
          max: 400,
        },
        {
          key: "text_en",
          label: "Explanation (English)",
          kind: "textarea",
          max: 400,
        },
        {
          key: "icon",
          label: "Ikon",
          kind: "select",
          options: LEVEL_ICONS,
          max: 20,
        },
        {
          key: "verse",
          label: "Ayat / kutipan (Indonesia)",
          kind: "textarea",
          max: 300,
        },
        {
          key: "verse_en",
          label: "Verse / quote (English)",
          kind: "textarea",
          max: 300,
        },
      ],
    });
  }
  return {
    table: "pages",
    keyCol: "slug",
    coverCol: "cover_media_id",
    base: "/konten/halaman",
    cols,
    metaCols,
    lists,
    hasGallery: false,
  };
}

export const LEVEL_ICONS = [
  "book",
  "users",
  "cross",
  "heart",
  "flask",
  "screen",
  "ball",
  "cap",
];

export function levelDef(): EntityDef {
  return {
    table: "academic_levels",
    keyCol: "slug",
    coverCol: "cover_media_id",
    base: "/konten/jenjang",
    hasGallery: true,
    metaCols: [],
    cols: [
      {
        name: "name",
        en: "name_en",
        label: "Nama jenjang",
        kind: "text",
        required: true,
        max: 120,
      },
      {
        name: "short_name",
        label: "Nama singkat",
        kind: "text",
        max: 20,
        hint: "Versi Inggris diambil dari kamus website.",
      },
      {
        name: "tagline",
        en: "tagline_en",
        label: "Tagline",
        kind: "text",
        max: 200,
      },
      {
        name: "summary",
        en: "summary_en",
        label: "Ringkasan",
        kind: "textarea",
        max: 500,
      },
      { name: "content", en: "content_en", label: "Isi", kind: "rich" },
      ...SEO,
    ],
    lists: [
      {
        key: "programs",
        target: "column",
        label: "Program unggulan",
        itemLabel: "Program",
        max: 12,
        fields: [
          { key: "title", label: "Judul (Indonesia)", max: 120 },
          { key: "title_en", label: "Title (English)", max: 120 },
          {
            key: "description",
            label: "Deskripsi (Indonesia)",
            kind: "textarea",
            max: 400,
          },
          {
            key: "description_en",
            label: "Description (English)",
            kind: "textarea",
            max: 400,
          },
          {
            key: "icon",
            label: "Ikon",
            kind: "select",
            options: LEVEL_ICONS,
            max: 20,
          },
        ],
      },
      {
        key: "facts",
        target: "column",
        label: "Fakta singkat",
        itemLabel: "Fakta",
        max: 3,
        hint: "Maksimal 3 fakta yang tampil di halaman jenjang.",
        fields: [
          { key: "label", label: "Label (Indonesia)", max: 60 },
          { key: "label_en", label: "Label (English)", max: 60 },
          { key: "value", label: "Nilai", max: 60 },
        ],
      },
    ],
  };
}

export function heroDef(): EntityDef {
  return {
    table: "hero_slides",
    keyCol: "id",
    coverCol: "media_id",
    base: "/konten/hero",
    creatable: true,
    sortable: true,
    hasGallery: false,
    metaCols: [],
    lists: [],
    cols: [
      {
        name: "title",
        en: "title_en",
        label: "Judul",
        kind: "text",
        required: true,
        max: 150,
      },
      {
        name: "highlight",
        en: "highlight_en",
        label: "Kata emas",
        kind: "text",
        max: 60,
        hint: "Kata atau frasa yang disorot dengan warna emas pada judul.",
      },
      {
        name: "description",
        en: "description_en",
        label: "Deskripsi",
        kind: "textarea",
        max: 400,
      },
      {
        name: "primary_label",
        en: "primary_label_en",
        label: "Tombol utama: teks",
        kind: "text",
        max: 60,
      },
      {
        name: "primary_href",
        label: "Tombol utama: tautan",
        kind: "text",
        max: 300,
        validate: "href",
        hint: "Contoh: /admisi atau https://…",
      },
      {
        name: "secondary_label",
        en: "secondary_label_en",
        label: "Tombol kedua: teks",
        kind: "text",
        max: 60,
      },
      {
        name: "secondary_href",
        label: "Tombol kedua: tautan",
        kind: "text",
        max: 300,
        validate: "href",
      },
    ],
  };
}

export function facilityDef(): EntityDef {
  return {
    table: "facilities",
    keyCol: "id",
    coverCol: "media_id",
    base: "/konten/fasilitas",
    creatable: true,
    sortable: true,
    slugFrom: "name",
    hasGallery: false,
    metaCols: [],
    lists: [],
    cols: [
      {
        name: "name",
        en: "name_en",
        label: "Nama fasilitas",
        kind: "text",
        required: true,
        max: 120,
      },
      {
        name: "summary",
        en: "summary_en",
        label: "Ringkasan",
        kind: "textarea",
        max: 400,
      },
      { name: "content", en: "content_en", label: "Isi", kind: "rich" },
      {
        name: "icon",
        label: "Ikon",
        kind: "text",
        max: 30,
        hint: "Nama ikon yang dikenali komponen Icon di website (mis. book, users, cross, heart, flask, screen, ball, cap).",
      },
    ],
  };
}

export function galleryDef(): EntityDef {
  return {
    table: "galleries",
    keyCol: "id",
    coverCol: "cover_media_id",
    base: "/konten/galeri",
    creatable: true,
    slugFrom: "title",
    hasGallery: false,
    metaCols: [],
    lists: [],
    cols: [
      {
        name: "title",
        en: "title_en",
        label: "Judul album",
        kind: "text",
        required: true,
        max: 150,
      },
      {
        name: "description",
        en: "description_en",
        label: "Deskripsi",
        kind: "textarea",
        max: 600,
      },
      { name: "event_date", label: "Tanggal kegiatan", kind: "date" },
      { name: "show_on_home", label: "Tampilkan di Beranda", kind: "toggle" },
    ],
  };
}

export function entityDef(entity: string, key: string): EntityDef | null {
  switch (entity) {
    case "page":
      return pageDef(key);
    case "level":
      return ACADEMIC_LEVELS.some((l) => l.slug === key) ? levelDef() : null;
    case "hero":
      return heroDef();
    case "facility":
      return facilityDef();
    case "gallery":
      return galleryDef();
    default:
      return null;
  }
}

const s = (v: unknown) =>
  typeof v === "string" ? v : v == null ? "" : String(v);
const metaOf = (row: Record<string, unknown>) =>
  (row.meta && typeof row.meta === "object" ? row.meta : {}) as Record<
    string,
    unknown
  >;

export function initialValues(
  def: EntityDef,
  row: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of def.cols) {
    out[c.name] =
      c.kind === "toggle" ? (row[c.name] ? "on" : "") : s(row[c.name]);
    if (c.en) out[c.en] = s(row[c.en]);
  }
  const meta = metaOf(row);
  for (const m of def.metaCols) {
    out[`meta__${m.name}`] = s(meta[m.name]);
    if (m.en) out[`meta__${m.en}`] = s(meta[m.en]);
  }
  return out;
}

export function initialLists(
  def: EntityDef,
  row: Record<string, unknown>,
): Record<string, Row[]> {
  const out: Record<string, Row[]> = {};
  for (const spec of def.lists) {
    const raw = spec.target === "meta" ? metaOf(row)[spec.key] : row[spec.key];
    out[spec.key] = Array.isArray(raw)
      ? raw
          .filter(
            (i): i is Record<string, unknown> => !!i && typeof i === "object",
          )
          .map((i) =>
            Object.fromEntries(spec.fields.map((f) => [f.key, s(i[f.key])])),
          )
      : [];
  }
  return out;
}

/** Jumlah kolom Inggris yang masih kosong padahal versi Indonesianya sudah terisi. */
export function countEnMissing(
  def: EntityDef,
  get: (name: string) => string,
): number {
  const pairs: [string, string][] = [];
  for (const c of def.cols) if (c.en) pairs.push([c.name, c.en]);
  for (const m of def.metaCols)
    if (m.en) pairs.push([`meta__${m.name}`, `meta__${m.en}`]);
  return pairs.filter(
    ([id, en]) => get(id).trim() !== "" && get(en).trim() === "",
  ).length;
}
