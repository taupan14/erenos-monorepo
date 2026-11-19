import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlbumViewer,
  type ViewerPhoto,
} from "@/components/gallery/AlbumViewer";
import { PageBanner } from "@/components/ui/PageBanner";
import { getAlbumBySlug } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { alternatesFor, fmt, localeHref } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import { getMessages } from "@/lib/messages";
import { resolveLocale } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const album = await getAlbumBySlug(slug);
  if (!album) return {};
  return {
    title: loc(album, "title", locale) ?? album.title,
    description: loc(album, "description", locale) ?? undefined,
    alternates: alternatesFor(locale, `/galeri/${slug}`),
  };
}

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const album = await getAlbumBySlug(slug);
  if (!album) notFound();

  const title = loc(album, "title", locale) ?? album.title;
  const description = loc(album, "description", locale);
  const photos: ViewerPhoto[] = album.items.map((it, i) => ({
    src: mediaUrl(it.media),
    alt:
      loc(it, "caption", locale) ??
      altText(it.media, locale, `${title} ${i + 1}`),
    caption: loc(it, "caption", locale),
    width: it.media?.width ?? null,
    height: it.media?.height ?? null,
  }));

  const samplePhotos: ViewerPhoto[] = Array.from({ length: 9 }, (_, i) => ({
    src: null,
    alt: fmt(m.gallery.samplePhoto, { n: i + 1 }),
    caption: null,
    width: null,
    height: null,
  }));

  return (
    <>
      <PageBanner
        title={title}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: m.footer.gallery, href: localeHref(locale, "/galeri") },
          { label: title },
        ]}
        imageUrl={mediaUrl(album.cover)}
        imageAlt={altText(album.cover, locale, title)}
        m={m}
      />
      <section className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8">
        {(description || album.event_date) && (
          <p className="mb-8 max-w-3xl leading-relaxed text-muted">
            {album.event_date && (
              <b className="mr-2 text-deep">
                {formatDate(album.event_date, locale)}
              </b>
            )}
            {description}
          </p>
        )}
        {photos.length === 0 && (
          <p className="mb-6 rounded-xl bg-soft px-5 py-3 text-sm text-muted">
            {m.gallery.emptyAlbum}
          </p>
        )}
        {/* Album kosong: 9 foto contoh agar tata letak grid dan lightbox tetap terlihat */}
        <AlbumViewer photos={photos.length > 0 ? photos : samplePhotos} />
        <Link
          href={localeHref(locale, "/galeri")}
          className="mt-8 inline-block text-sm font-bold text-primary"
        >
          ← {m.gallery.back}
        </Link>
      </section>
    </>
  );
}
