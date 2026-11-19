import id from "@/messages/id.json";
import en from "@/messages/en.json";
import type { Locale } from "./i18n";

/** Bentuk kamus mengikuti id.json; en.json wajib punya kunci yang sama (dicek TypeScript). */
export type Messages = typeof id;

const all: Record<Locale, Messages> = { id, en };

export function getMessages(locale: Locale): Messages {
  return all[locale];
}
