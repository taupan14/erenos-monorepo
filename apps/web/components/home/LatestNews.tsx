import Link from "next/link";
import { formatDate } from "@/lib/format";
import { localeHref, type Locale } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import type { Messages } from "@/lib/messages";
import type { NewsRow } from "@/lib/types";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

/** Berita tidak dwibahasa (satu bahasa); hanya label bagian, nama kategori, dan format tanggal mengikuti bahasa. */
export function LatestNews({
  news,
  locale,
  m,
}: {
  news: NewsRow[];
  locale: Locale;
  m: Messages;
}) {
  if (news.length === 0) return null;

  return (
    <section className="bg-soft py-14">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            kicker={m.news.kicker}
            title={m.news.title}
            action={{ href: localeHref(locale, "/berita"), label: m.news.all }}
          />
        </Reveal>
        <ul className="grid gap-5 lg:grid-cols-3">
          {news.map((n, i) => (
            <li key={n.id}>
              <Reveal delay={i * 80} className="h-full">
                <Link
                  href={localeHref(locale, `/berita/${n.slug}`)}
                  className="group flex h-full gap-4 rounded-lg bg-white p-3.5 shadow-[0_6px_24px_rgba(20,41,90,0.12)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none"
                >
                  <div className="relative h-[100px] w-[120px] shrink-0 overflow-hidden rounded-md bg-[#dce5f5]">
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.07] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                      <Photo
                        src={mediaUrl(n.cover)}
                        alt={altText(n.cover, locale, n.title)}
                        label={m.news.photo}
                        icon="book"
                        sizes="120px"
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    {n.category && (
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
                        {loc(n.category, "name", locale)}
                      </p>
                    )}
                    <h3 className="font-serif text-[17px] font-bold leading-snug text-deep">
                      {n.title}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted">
                      {formatDate(n.published_at, locale)}
                    </p>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
