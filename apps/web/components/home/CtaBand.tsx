import Image from "next/image";
import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import { localeHref, type Locale } from "@/lib/i18n";
import type { LevelView } from "@/lib/levels";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import type { Messages } from "@/lib/messages";
import type { SiteSettings } from "@/lib/types";
import { btnGold, btnOutlineLight } from "@/lib/ui";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Banner pendaftaran: kartu biru tua berbingkai emas tipis; foto model (PNG tanpa latar dari CMS)
 * di kiri menembus keluar dari sisi atas kartu; dua tombol dan pilihan jenjang.
 * Tanpa foto, tampil siluet placeholder.
 */
export function CtaBand({
  settings,
  locale,
  m,
  levels,
}: {
  settings: SiteSettings | null;
  locale: Locale;
  m: Messages;
  levels: LevelView[];
}) {
  const open = settings?.admission_open ?? true;
  const eyebrow = open ? m.cta.eyebrow : m.cta.closedEyebrow;
  const title =
    (open ? loc(settings, "admission_cta_title", locale) : null) ??
    (open ? m.cta.title : m.cta.closedTitle);
  const text = loc(settings, "admission_cta_text", locale) ?? m.cta.text;
  const wa = whatsappUrl(settings?.whatsapp);
  const model = mediaUrl(settings?.model);

  return (
    <section className="relative mx-auto max-w-[1200px] px-5 pb-14 pt-12 sm:px-8 lg:pt-28">
      <Reveal>
        <div className="relative">
          {/* Bingkai emas tipis, bergeser ke kanan-bawah */}
          <div
            aria-hidden
            className="absolute -bottom-3.5 -right-3.5 -top-3.5 left-3.5 rounded-[34px] border-[1.5px] border-accent"
          />

          <div className="relative rounded-[28px] bg-deep px-7 py-12 text-white sm:px-12 lg:min-h-[380px] lg:py-14 lg:pl-[470px] lg:pr-[70px]">
            {/* Foto model di kiri (hanya layar lebar) */}
            <div className="pointer-events-none absolute bottom-0 left-[70px] hidden h-[470px] w-[320px] lg:block">
              {model ? (
                <Image
                  src={model}
                  alt={altText(settings?.model ?? null, locale, "")}
                  fill
                  sizes="320px"
                  className="object-contain object-bottom"
                />
              ) : (
                <Image
                  src={"/online-registration.webp"}
                  alt={altText(settings?.model ?? null, locale, "")}
                  fill
                  sizes="320px"
                  className="object-contain object-bottom"
                />
              )}
            </div>

            <p className="flex items-center gap-2.5 text-[13px] font-bold uppercase tracking-[0.06em] text-accent">
              <span aria-hidden className="size-2 rounded-full bg-accent" />
              {eyebrow}
            </p>
            <h2 className="mb-3.5 mt-4 font-serif text-[clamp(2rem,4.2vw,3rem)] font-bold leading-[1.1] text-white">
              {title}
            </h2>
            <p className="max-w-[520px] leading-relaxed text-[#c9d7f2]">
              {text}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={localeHref(locale, open ? "/admisi" : "/kontak")}
                className={btnGold}
              >
                {open ? m.cta.button : m.cta.closedButton} →
              </Link>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnOutlineLight}
                >
                  {m.cta.whatsapp}
                </a>
              ) : (
                open && (
                  <Link
                    href={localeHref(locale, "/kontak")}
                    className={btnOutlineLight}
                  >
                    {m.cta.closedButton}
                  </Link>
                )
              )}
            </div>

            {levels.length > 0 && (
              <nav aria-label={m.cta.chooseLevel} className="mt-6">
                <ul className="flex flex-wrap gap-2">
                  {levels.slice(0, 4).map((l) => (
                    <li key={l.key}>
                      <Link
                        href={localeHref(locale, `/akademik/${l.slug}`)}
                        className="inline-flex min-h-9 items-center rounded-full border border-white/35 px-3.5 text-xs transition-colors hover:bg-white/10"
                      >
                        {l.short}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
