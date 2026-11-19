import { ACADEMIC_LEVELS } from "@erenos/shared";

export type AdmissionSection = "step" | "requirement" | "faq" | "note";
export type AdmissionTab = {
  id: string;
  section: AdmissionSection;
  label: string;
  titleLabel: string;
  bodyLabel: string;
};

export const TABS: AdmissionTab[] = [
  {
    id: "tahap",
    section: "step",
    label: "Tahap",
    titleLabel: "Judul tahap",
    bodyLabel: "Penjelasan",
  },
  {
    id: "persyaratan",
    section: "requirement",
    label: "Persyaratan",
    titleLabel: "Persyaratan",
    bodyLabel: "",
  },
  {
    id: "faq",
    section: "faq",
    label: "FAQ",
    titleLabel: "Pertanyaan",
    bodyLabel: "Jawaban",
  },
  {
    id: "catatan",
    section: "note",
    label: "Catatan",
    titleLabel: "Judul catatan",
    bodyLabel: "Isi catatan",
  },
];

export const tabById = (id: string | undefined) =>
  TABS.find((t) => t.id === id) ?? TABS[0]!;
export const tabBySection = (s: string) => TABS.find((t) => t.section === s);

export const LEVELS = ACADEMIC_LEVELS.map((l) => ({
  code: l.code as string,
  short: l.shortName,
}));
export const LEVEL_CODES = LEVELS.map((l) => l.code);

export type Result = { ok: true } | { ok: false; error: string };
