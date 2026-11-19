import Link from "next/link";
import { localeHref, type Locale } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import type { Messages } from "@/lib/messages";
import type { AboutPage } from "@/lib/types";
import { btnDark } from "@/lib/ui";
import { Parallax } from "@/components/ui/Parallax";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

export function Welcome({
  about,
  schoolName,
  locale,
  m,
}: {
  about: AboutPage | null;
  schoolName: string;
  locale: Locale;
  m: Messages;
}) {
  return (
    <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:gap-14">
      <Reveal>
        <div className="relative h-80 overflow-hidden rounded-lg bg-[#dce5f5]">
          <Parallax speed={0.06} className="absolute inset-x-0 -inset-y-[12%]">
            <Photo
              src={mediaUrl(about?.cover)}
              alt={altText(about?.cover, locale, m.welcome.photoAlt)}
              label={m.welcome.photoLabel}
              icon="users"
              sizes="(min-width: 1024px) 560px, 100vw"
            />
          </Parallax>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
          {m.welcome.kicker}
        </p>
        <h2 className="mb-4 font-serif text-[clamp(1.75rem,4vw,2.375rem)] font-bold text-deep">
          {schoolName}
        </h2>
        <p className="mb-7 leading-relaxed text-muted">
          {loc(about, "excerpt", locale) ?? m.welcome.excerpt}
        </p>
        <Link href={localeHref(locale, "/tentang")} className={btnDark}>
          {m.welcome.button} →
        </Link>
      </Reveal>
    </section>
  );
}
