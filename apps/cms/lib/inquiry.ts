import {
  ACADEMIC_LEVELS,
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABEL,
  type InquiryStatus,
} from "@erenos/shared";

export { INQUIRY_STATUSES, INQUIRY_STATUS_LABEL };
export type { InquiryStatus };

export const SOURCE_LABEL: Record<string, string> = {
  admission: "Formulir Admisi",
  contact: "Formulir Kontak",
};

export const STATUS_PILL: Record<InquiryStatus, string> = {
  new: "bg-amber-100 text-amber-900",
  in_progress: "bg-soft text-primary",
  resolved: "bg-green-100 text-green-800",
  spam: "bg-slate-200 text-slate-700",
};

export const levelShort = (code: string | null) =>
  ACADEMIC_LEVELS.find((l) => l.code === code)?.shortName ?? "–";

export function formatDateTime(iso: string | null): string {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/** Nomor apa adanya → tautan wa.me (awalan 0 dianggap nomor Indonesia); null bila tidak valid. */
export function whatsappLink(phone: string | null): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `62${d.slice(1)}`;
  return d.length >= 9 && d.length <= 15 ? `https://wa.me/${d}` : null;
}

/** Kata kunci pencarian yang aman dipakai di filter PostgREST .or(). */
export function cleanTerm(raw: string | undefined): string {
  return (raw ?? "")
    .replace(/[%,()*\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}
