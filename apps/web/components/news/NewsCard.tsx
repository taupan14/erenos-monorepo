import Link from "next/link";
import { formatDate } from "@/lib/format";
import { localeHref, type Locale } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import type { Messages } from "@/lib/messages";
import type { NewsRow } from "@/lib/types";
import { Photo } from "@/components/ui/Photo";

/** Kartu berita. Judul dan ringkasan satu bahasa; nama kategori dan tanggal mengikuti bahasa halaman. */
export function NewsCard({
  n,
  locale,
  m,
  featured = false,
}: {
  n: NewsRow;
  locale: Locale;
  m: Messages;
  featured?: boolean;
}) {
  const href = localeHref(locale, `/berita/${n.slug}`);
  const photo = (
    <Photo
      src={mediaUrl(n.cover)}
      alt={altText(n.cover, locale, n.title)}
      label={m.news.photo}
      icon="book"
      sizes={
        featured
          ? "(min-width: 1024px) 700px, 100vw"
          : "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
      }
    />
  );
  const meta = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
        {n.category ? `${loc(n.category, "name", locale)} · ` : ""}
        {formatDate(n.published_at, locale)}
      </p>
      <h3
        className={`mt-2 font-serif font-bold leading-snug text-deep ${featured ? "text-[clamp(1.5rem,3vw,2rem)]" : "text-lg"}`}
      >
        {n.title}
      </h3>
      {n.excerpt && (
        <p
          className={`mt-2 text-muted ${featured ? "" : "line-clamp-2 text-[13px]"}`}
        >
          {n.excerpt}
        </p>
      )}
    </>
  );

  if (featured) {
    return (
      <Link
        href={href}
        className="group grid overflow-hidden rounded-2xl bg-white shadow-[0_6px_24px_rgba(20,41,90,0.12)] lg:grid-cols-[1.25fr_1fr]"
      >
        <div className="relative h-64 overflow-hidden bg-[#dce5f5] lg:h-full lg:min-h-[300px]">
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none">
            {photo}
          </div>
        </div>
        <div className="self-center p-7 lg:p-9">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            {m.newsPage.featured}
          </p>
          {meta}
          <span className="mt-4 inline-block text-[13px] font-bold text-primary">
            {m.newsPage.readMore} →
          </span>
        </div>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="group block h-full overflow-hidden rounded-2xl bg-white shadow-[0_6px_24px_rgba(20,41,90,0.12)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none"
    >
      <div className="relative h-[170px] overflow-hidden bg-[#dce5f5]">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.06] motion-reduce:transition-none">
          {photo}
        </div>
      </div>
      <div className="p-5">{meta}</div>
    </Link>
  );
}
