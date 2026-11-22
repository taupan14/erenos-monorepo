import Image from "next/image";
import type { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SocialIcon, type SocialIconName } from "@/components/ui/SocialIcon";
import { getVisitorStats } from "@/lib/data";
import { fmt, localeHref, type Locale } from "@/lib/i18n";
import type { LevelView } from "@/lib/levels";
import { loc } from "@/lib/localize";
import type { Messages } from "@/lib/messages";
import { LOGO } from "@/lib/site";
import type { SiteSettings } from "@/lib/types";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NewsletterForm } from "./NewsletterForm";
import { VisitorStats } from "./VisitorStats";

const headingCls = "mb-4 text-[15px] font-semibold text-white";
const linkCls =
  "block py-1 text-[13px] text-[#c9d7f2] transition-colors hover:text-white";

/** Satu baris data kontak dengan ikon emas di kiri. */
function ContactRow({
  icon,
  children,
}: {
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <p className="flex items-start gap-2.5 py-1 text-[13px]">
      <Icon name={icon} size={16} className="mt-0.5 shrink-0 text-accent" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

/** Footer biru tua dengan kartu berlangganan terangkat (ceruk) di tengah. */
export async function SiteFooter({
  settings,
  logoUrl,
  locale,
  m,
  levels,
}: {
  settings: SiteSettings | null;
  logoUrl: string | null;
  locale: Locale;
  m: Messages;
  levels: LevelView[];
}) {
  const h = (path: string) => localeHref(locale, path);
  const name = settings?.school_name ?? "Erenos Christian School";
  const socials = (
    [
      { label: "Facebook", icon: "facebook", url: settings?.facebook_url },
      { label: "YouTube", icon: "youtube", url: settings?.youtube_url },
      { label: "Instagram", icon: "instagram", url: settings?.instagram_url },
      { label: "TikTok", icon: "tiktok", url: settings?.tiktok_url },
    ] as {
      label: string;
      icon: SocialIconName;
      url: string | null | undefined;
    }[]
  ).filter(
    (s): s is { label: string; icon: SocialIconName; url: string } => !!s.url,
  );

  const stats = await getVisitorStats();

  return (
    <footer className="relative mt-24 bg-deep text-[#c9d7f2]">
      {/* Bahu ceruk di kiri-kanan kartu (hanya layar lebar) */}
      <span
        aria-hidden
        className="absolute -top-[22px] hidden size-[22px] lg:block"
        style={{
          left: "calc(50% - 192px)",
          background:
            "radial-gradient(circle at 0 0, transparent 21px, var(--deep) 22px)",
        }}
      />
      <span
        aria-hidden
        className="absolute -top-[22px] hidden size-[22px] lg:block"
        style={{
          left: "calc(50% + 170px)",
          background:
            "radial-gradient(circle at 100% 0, transparent 21px, var(--deep) 22px)",
        }}
      />

      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="relative lg:min-h-[300px]">
          {/* Kartu berlangganan */}
          <div className="mx-auto -mt-12 mb-10 w-full max-w-[340px] rounded-[22px] bg-[#dce5f5] p-7 text-center text-deep lg:absolute lg:left-1/2 lg:top-[-48px] lg:mb-0 lg:mt-0 lg:-translate-x-1/2">
            <Image
              src={logoUrl ?? LOGO.src}
              alt={name}
              width={LOGO.width}
              height={LOGO.height}
              className="mx-auto h-[54px] w-auto"
            />
            <h2 className="mb-2 mt-3.5 font-serif text-[22px] font-bold leading-snug text-deep">
              {m.footer.cardTitle}
            </h2>
            <p className="text-xs leading-relaxed text-[#3a4a6b]">
              {m.footer.cardText}
            </p>
            <NewsletterForm />
          </div>

          <div className="grid gap-10 pb-10 pt-0 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_340px_1fr_1fr] lg:gap-7 lg:pt-14">
            <div>
              <h2 className={headingCls}>{m.footer.links}</h2>
              <Link href={h("/")} className={linkCls}>
                {m.nav.home}
              </Link>
              <Link href={h("/tentang")} className={linkCls}>
                {m.nav.about}
              </Link>
              <Link href={h("/akademik")} className={linkCls}>
                {m.nav.academics}
              </Link>
              <Link href={h("/fasilitas")} className={linkCls}>
                {m.nav.facilities}
              </Link>
              <Link href={h("/berita")} className={linkCls}>
                {m.nav.news}
              </Link>
            </div>

            <div>
              <h2 className={headingCls}>{m.footer.academics}</h2>
              {levels.slice(0, 4).map((lv) => (
                <Link
                  key={lv.key}
                  href={h(`/akademik/${lv.slug}`)}
                  className={linkCls}
                >
                  {lv.short}
                </Link>
              ))}
              <Link href={h("/galeri")} className={linkCls}>
                {m.footer.gallery}
              </Link>
            </div>

            <div className="hidden lg:block" aria-hidden />

            <div>
              <h2 className={headingCls}>{m.footer.info}</h2>
              <Link href={h("/admisi")} className={linkCls}>
                {m.footer.admissionFlow}
              </Link>
              <Link href={h("/admisi#persyaratan")} className={linkCls}>
                {m.footer.requirements}
              </Link>
              <Link href={h("/faq")} className={linkCls}>
                {m.footer.faq}
              </Link>
              <Link href={h("/kontak")} className={linkCls}>
                {m.nav.contact}
              </Link>
              <Link href={h("/kebijakan-privasi")} className={linkCls}>
                {m.footer.privacy}
              </Link>
              <Link href={h("/syarat-ketentuan")} className={linkCls}>
                {m.footer.terms}
              </Link>
            </div>

            <div>
              <h2 className={headingCls}>{m.footer.contact}</h2>
              <ContactRow icon="pin">
                {settings?.address ?? m.placeholder.address}
              </ContactRow>
              <ContactRow icon="phone">
                {settings?.phone ?? settings?.whatsapp ?? m.placeholder.phone}
              </ContactRow>
              <ContactRow icon="mail">
                {settings?.email ?? m.placeholder.email}
              </ContactRow>
              <ContactRow icon="clock">
                {loc(settings, "office_hours", locale) ?? m.placeholder.hours}
              </ContactRow>
              {socials.length > 0 && (
                <div
                  role="group"
                  aria-label={m.footer.social}
                  className="mt-3 flex gap-2.5"
                >
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${s.label} ${m.footer.newTab}`}
                      className="flex size-[34px] items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 hover:text-accent"
                    >
                      <SocialIcon name={s.icon} size={17} />
                    </a>
                  ))}
                </div>
              )}
              {/* <div className="mt-4 flex items-center gap-2.5 text-[11px] leading-snug">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white">
                  ✚
                </span>
                <span>
                  {m.footer.sealLine1}
                  <br />
                  {m.footer.sealLine2}
                </span>
              </div> */}
            </div>
          </div>
        </div>

        <VisitorStats initial={stats} labels={m.footer.stats} locale={locale} />

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/15 py-4 text-xs sm:flex-row sm:items-center">
          <span>
            {fmt(m.footer.rights, { year: new Date().getFullYear(), name })}
          </span>
          <span className="flex flex-wrap items-center gap-4">
            {loc(settings, "motto", locale) ?? m.footer.motto}
            <LanguageSwitcher variant="dark" />
          </span>
        </div>
      </div>
    </footer>
  );
}
