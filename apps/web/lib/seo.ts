import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { alternatesFor, isLocale, type Locale } from "./i18n";
import { getMessages } from "./messages";

/** Ambil locale dari params rute; 404 bila tidak dikenal. */
export async function resolveLocale(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export type PageKey =
  | "about"
  | "academics"
  | "facilities"
  | "news"
  | "gallery"
  | "admission"
  | "contact"
  | "privacy"
  | "terms"
  | "faq";

/** Metadata standar halaman dalam: judul dari kamus, deskripsi SEO, canonical + hreflang. */
export function pageMetadata(
  locale: Locale,
  key: PageKey,
  path: string,
): Metadata {
  const m = getMessages(locale);
  return {
    title: `${m.pages[key].title} ${m.pages[key].highlight}`,
    description: m.seo[key],
    alternates: alternatesFor(locale, path),
  };
}

/** Serialisasi JSON-LD yang aman ditanam di <script> (mencegah penutupan tag lewat "<"). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
