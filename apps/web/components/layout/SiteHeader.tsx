"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/i18n";
import type { LevelView } from "@/lib/levels";
import { LOGO, NAV_ITEMS } from "@/lib/site";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { LanguageSwitcher } from "./LanguageSwitcher";

const TILE_STYLE = [
  "bg-[#eef3fb]",
  "bg-[#eef3fb]",
  "bg-primary text-white",
  "bg-deep text-white",
];

/**
 * Header: navbar berbentuk pil melayang; saat kursor/fokus di "Akademik", wadah pil
 * memanjang menampilkan mega menu jenjang (kartu besar + empat kartu jenjang).
 */
export function SiteHeader({
  logoUrl,
  schoolName,
  levels,
}: {
  logoUrl: string | null;
  schoolName: string;
  levels: LevelView[];
}) {
  const { m, href } = useI18n();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const openMega = () => {
    clearTimeout(closeTimer.current);
    setMega(true);
  };
  const closeMega = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(false), 120);
  };

  // Header menyembunyikan diri saat scroll ke bawah dan muncul lagi saat scroll ke atas.
  // Tetap tampil bila mega menu/menu seluler terbuka, fokus keyboard ada di dalamnya,
  // atau pengguna memilih prefers-reduced-motion.
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const locked = useRef(false);
  useEffect(() => {
    locked.current = mega || mobileOpen;
    if (locked.current) setHidden(false);
  }, [mega, mobileOpen]);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const dy = y - lastY.current;
      if (reduce || locked.current || y < 120) {
        setHidden(false);
        lastY.current = y;
        return;
      }
      if (Math.abs(dy) > 8) {
        setHidden(dy > 0);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(closeTimer.current);
    };
  }, []);

  // Tutup menu setiap pindah halaman
  useEffect(() => {
    setMobileOpen(false);
    setMega(false);
  }, [pathname]);

  const isActive = (path: string) => {
    const full = href(path);
    return path === "/"
      ? pathname === full
      : pathname === full || pathname.startsWith(`${full}/`);
  };

  const tiles = levels.slice(0, 4);

  return (
    <header
      className={cn(
        "sticky top-3 z-30 px-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:px-5",
        hidden ? "-translate-y-[140%]" : "translate-y-0",
      )}
      onFocusCapture={() => setHidden(false)}
      onMouseLeave={closeMega}
      onKeyDown={(e) => e.key === "Escape" && setMega(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setMega(false);
      }}
    >
      <div
        className={cn(
          "mx-auto max-w-[1100px] rounded-[30px] bg-white p-2.5 transition-shadow duration-300",
          scrolled || mega
            ? "shadow-[0_10px_40px_rgba(20,41,90,0.22)]"
            : "shadow-[0_6px_24px_rgba(20,41,90,0.12)]",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-1.5">
          <Link
            href={href("/")}
            className="flex items-center gap-3"
            aria-label={fmt(m.a11y.homeLink, { name: schoolName })}
          >
            <Image
              src={logoUrl ?? LOGO.src}
              alt=""
              width={LOGO.width}
              height={LOGO.height}
              priority
              className={cn(
                "w-auto transition-[height] duration-300",
                scrolled ? "h-8" : "h-9",
              )}
            />
            <span className="font-serif text-[16px] font-bold text-deep">
              {m.nav.title}
            </span>
          </Link>

          <nav
            aria-label={m.a11y.mainMenu}
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              const cls = cn(
                "inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-[13px] font-semibold text-deep transition-colors",
                active || ("mega" in item && mega)
                  ? "bg-[#e6eaf2]"
                  : "hover:bg-[#f0f3f9]",
              );
              if ("mega" in item) {
                return (
                  <Link
                    key={item.key}
                    href={href(item.path)}
                    className={cls}
                    aria-haspopup="true"
                    aria-expanded={mega}
                    aria-controls="mega-akademik"
                    aria-current={active ? "page" : undefined}
                    onMouseEnter={openMega}
                    onFocus={openMega}
                  >
                    {m.nav[item.key]}
                    <Icon
                      name="chevron"
                      size={14}
                      className={cn(
                        "transition-transform",
                        mega && "rotate-180",
                      )}
                    />
                  </Link>
                );
              }
              return (
                <Link
                  key={item.key}
                  href={href(item.path)}
                  className={cls}
                  aria-current={active ? "page" : undefined}
                  onMouseEnter={closeMega}
                >
                  {m.nav[item.key]}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            <Link
              href={href("/admisi")}
              className="hidden items-center rounded-full bg-deep px-5 py-3 text-[13px] font-bold text-white sm:inline-flex"
            >
              {m.nav.register}
            </Link>
            <button
              type="button"
              className="flex size-11 items-center justify-center rounded-full text-deep lg:hidden"
              aria-label={mobileOpen ? m.a11y.closeMenu : m.a11y.openMenu}
              aria-expanded={mobileOpen}
              aria-controls="menu-mobile"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <Icon name={mobileOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>

        {/* Mega menu (desktop): tinggi wadah dianimasikan lewat grid-template-rows */}
        <div
          className={cn(
            "hidden transition-[grid-template-rows] duration-300 ease-out lg:grid",
            mega ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div
              id="mega-akademik"
              aria-hidden={!mega}
              className={cn(
                "grid grid-flow-col grid-cols-[1.1fr_1fr_1fr] grid-rows-[150px_150px] gap-2.5 pt-3 transition-opacity duration-300",
                mega ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              onMouseEnter={openMega}
            >
              <Link
                href={href("/akademik")}
                tabIndex={mega ? 0 : -1}
                className="group relative row-span-2 overflow-hidden rounded-2xl bg-[#eef3fb] p-[18px]"
              >
                <b className="mb-1.5 block text-[15px] text-deep">
                  {m.mega.title}
                </b>
                <p className="max-w-[75%] text-[13px] leading-relaxed text-muted">
                  {m.mega.text}
                </p>
                <div className="absolute inset-x-[18px] bottom-[18px] h-[130px] overflow-hidden rounded-[14px]">
                  <Photo
                    src={null}
                    alt={m.mega.photo}
                    label={m.mega.photo}
                    icon="users"
                  />
                </div>
              </Link>
              {tiles.map((lv, i) => (
                <Link
                  key={lv.key}
                  href={href(`/akademik/${lv.slug}`)}
                  tabIndex={mega ? 0 : -1}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl p-[18px] transition-transform duration-300 hover:-translate-y-0.5",
                    TILE_STYLE[i % TILE_STYLE.length],
                  )}
                >
                  <b
                    className={cn(
                      "mb-1.5 block text-[15px]",
                      i < 2 ? "text-deep" : "text-white",
                    )}
                  >
                    {lv.short}
                  </b>
                  <p
                    className={cn(
                      "line-clamp-3 max-w-[58%] text-[13px] leading-relaxed",
                      i < 2 ? "text-muted" : "text-[#dce5f5]",
                    )}
                  >
                    {lv.summary}
                  </p>
                  <div className="absolute bottom-3 right-3 h-[72px] w-[112px] overflow-hidden rounded-xl">
                    <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                      <Photo
                        src={lv.coverUrl}
                        alt={lv.coverAlt}
                        label={lv.short}
                        icon="book"
                        sizes="112px"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Menu seluler */}
        <div
          id="menu-mobile"
          hidden={!mobileOpen}
          className="mt-2 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-2xl border-t border-line lg:hidden"
        >
          <nav aria-label={m.a11y.mobileMenu}>
            {NAV_ITEMS.map((item) => (
              <div key={item.key}>
                <Link
                  href={href(item.path)}
                  className={cn(
                    "block border-b border-line px-4 py-3.5 text-sm font-semibold text-deep",
                    isActive(item.path) && "bg-soft",
                  )}
                >
                  {m.nav[item.key]}
                </Link>
                {"mega" in item &&
                  tiles.map((lv) => (
                    <Link
                      key={lv.key}
                      href={href(`/akademik/${lv.slug}`)}
                      className="block border-b border-line bg-soft/60 py-3 pl-8 pr-4 text-sm text-ink"
                    >
                      {lv.name}
                    </Link>
                  ))}
              </div>
            ))}
            <Link
              href={href("/admisi")}
              className="m-3 flex justify-center rounded-full bg-deep px-5 py-3 text-sm font-bold text-white sm:hidden"
            >
              {m.nav.register}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
