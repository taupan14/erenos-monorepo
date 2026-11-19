// Konstanta bersama web + CMS. Nilai harus sama dengan enum di database
// (supabase/migrations/*_core_schema.sql).

export const ACADEMIC_LEVELS = [
  { code: "kb_tk", slug: "kb-tk", name: "Kelompok Bermain & TK", shortName: "KB–TK" },
  { code: "sd", slug: "sd", name: "Sekolah Dasar", shortName: "SD" },
  { code: "smp", slug: "smp", name: "Sekolah Menengah Pertama", shortName: "SMP" },
  { code: "sma", slug: "sma", name: "Sekolah Menengah Atas", shortName: "SMA" },
] as const;

export type AcademicLevelCode = (typeof ACADEMIC_LEVELS)[number]["code"];

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draf",
  published: "Terbit",
  archived: "Diarsipkan",
};

export const USER_ROLES = ["super_admin", "editor"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const USER_ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super Admin",
  editor: "Editor",
};

export const INQUIRY_STATUSES = ["new", "in_progress", "resolved", "spam"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];
export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "Baru",
  in_progress: "Diproses",
  resolved: "Selesai",
  spam: "Spam",
};

export const ADMISSION_SECTIONS = ["step", "requirement", "faq", "note"] as const;
export type AdmissionSection = (typeof ADMISSION_SECTIONS)[number];
export const ADMISSION_SECTION_LABEL: Record<AdmissionSection, string> = {
  step: "Tahap pendaftaran",
  requirement: "Persyaratan",
  faq: "Pertanyaan umum",
  note: "Catatan",
};

export const STORAGE_BUCKET = "media";
