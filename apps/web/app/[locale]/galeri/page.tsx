import Image from "next/image";
import Link from "next/link";
import { PageBanner } from "@/components/ui/PageBanner";
import { Reveal } from "@/components/ui/Reveal";
import { getAlbums } from "@/lib/data";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { fmt, localeHref } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import { getMessages } from "@/lib/messages";
import { pageMetadata, resolveLocale } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await resolveLocale(params), "gallery", "/galeri");
}

const RATIOS = [
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-[1/1]",
  "aspect-[16/10]",
  "aspect-[4/5]",
  "aspect-[5/4]",
];

export default async function GalleryPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const albums = await getAlbums();

  return (
    <>
      <PageBanner
        title={m.pages.gallery.title}
        highlight={m.pages.gallery.highlight}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: m.footer.gallery },
        ]}
        m={m}
      />
      <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8">
        {albums.length === 0 ? (
          <>
            <p className="mb-6 rounded-xl bg-soft px-5 py-3 text-sm text-muted">
              {m.gallery.empty}
            </p>
            <ul
              aria-hidden
              className="columns-1 gap-3.5 sm:columns-2 lg:columns-3"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="mb-3.5 break-inside-avoid">
                  <Reveal delay={(i % 3) * 80}>
                    <div className="relative overflow-hidden rounded-2xl bg-[#dce5f5]">
                      <div
                        className={cn(
                          "flex w-full items-center justify-center text-xs text-[#3a4a6b]",
                          RATIOS[i % RATIOS.length],
                        )}
                      >
                        {fmt(m.gallery.samplePhoto, { n: i + 1 })}
                      </div>
                      <span className="absolute inset-x-0 bottom-0 bg-deep/85 px-4 py-3 text-white">
                        <b className="block font-serif text-base">
                          {fmt(m.gallery.sampleTitle, { n: i + 1 })}
                        </b>
                        <span className="text-xs text-[#c9d7f2]">
                          {fmt(m.gallery.photoCount, { n: 12 })}
                        </span>
                      </span>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <ul className="columns-1 gap-3.5 sm:columns-2 lg:columns-3">
            {albums.map((a, i) => {
              const title = loc(a, "title", locale) ?? a.title;
              const cover = mediaUrl(a.cover);
              const count = a.items?.[0]?.count ?? 0;
              return (
                <li key={a.id} className="mb-3.5 break-inside-avoid">
                  <Reveal delay={(i % 3) * 80}>
                    <Link
                      href={localeHref(locale, `/galeri/${a.slug}`)}
                      className="group relative block overflow-hidden rounded-2xl bg-[#dce5f5]"
                    >
                      {cover && a.cover?.width && a.cover?.height ? (
                        <Image
                          src={cover}
                          alt={altText(a.cover, locale, title)}
                          width={a.cover.width}
                          height={a.cover.height}
                          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                          className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.05] motion-reduce:transition-none"
                        />
                      ) : (
                        <div
                          className={cn(
                            "relative flex w-full items-center justify-center text-xs text-[#3a4a6b]",
                            RATIOS[i % RATIOS.length],
                          )}
                        >
                          {cover ? (
                            <Image
                              src={cover}
                              alt={altText(a.cover, locale, title)}
                              fill
                              sizes="380px"
                              className="object-cover"
                            />
                          ) : (
                            <span>{title}</span>
                          )}
                        </div>
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-deep/85 px-4 py-3 text-white">
                        <b className="block font-serif text-base">{title}</b>
                        <span className="text-xs text-[#c9d7f2]">
                          {[
                            formatDate(a.event_date, locale),
                            count > 0
                              ? fmt(m.gallery.photoCount, { n: count })
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
