import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n";

/**
 * Semua halaman berada di bawah /id atau /en. Path tanpa prefix bahasa dialihkan ke
 * bahasa pilihan terakhir pengunjung (cookie NEXT_LOCALE), atau Indonesia bila belum ada.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isLocale(pathname.split("/")[1])) return NextResponse.next();

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookie) ? cookie : DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Lewati API, aset Next.js, dan file statis (path yang mengandung titik)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
