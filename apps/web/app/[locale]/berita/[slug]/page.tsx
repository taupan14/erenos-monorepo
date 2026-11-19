import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsCard } from "@/components/news/NewsCard";
import { ShareButtons } from "@/components/news/ShareButtons";
import { PageBanner } from "@/components/ui/PageBanner";
import { Photo } from "@/components/ui/Photo";
import { Prose } from "@/components/ui/Prose";
import { Reveal } from "@/components/ui/Reveal";
import { getNewsBySlug, getRelatedNews } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { alternatesFor, fmt, localeHref } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import { getMessages } from "@/lib/messages";
import { jsonLd, resolveLocale, siteUrl } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const news = await getNewsBySlug(slug);
  if (!news) return {};
  const cover = mediaUrl(news.cover);
  return {
    title: news.seo_title ?? news.title,
    description: news.seo_description ?? news.excerpt ?? undefined,
    alternates: alternatesFor(locale, `/berita/${slug}`),
    openGraph: {
      type: "article",
      publishedTime: news.published_at ?? undefined,
      images: cover ? [{ url: cover }] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const m = getMessages(locale);

  const news = await getNewsBySlug(slug);
  if (!news) notFound();
  const related = await getRelatedNews(slug);
  const cover = mediaUrl(news.cover);
  const url = `${siteUrl()}${localeHref(locale, `/berita/${slug}`)}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    datePublished: news.published_at ?? undefined,
    image: cover ?? undefined,
    author: news.author_name
      ? { "@type": "Person", name: news.author_name }
      : undefined,
    inLanguage: "id",
    mainEntityOfPage: url,
  };

  return (
    <>
      <PageBanner
        title={m.pages.news.title}
        highlight={m.pages.news.highlight}
        titleAs="p"
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: m.nav.news, href: localeHref(locale, "/berita") },
          ...(news.category
            ? [{ label: loc(news.category, "name", locale) ?? "" }]
            : []),
        ]}
        m={m}
      />

      {/* Isi berita selalu berbahasa Indonesia, apa pun bahasa antarmukanya */}
      <article lang="id" className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
          {news.category ? `${loc(news.category, "name", locale)} · ` : ""}
          {formatDate(news.published_at, locale)}
          {news.author_name
            ? ` · ${fmt(m.newsPage.by, { name: news.author_name })}`
            : ""}
        </p>
        <h1 className="mb-7 font-serif text-[clamp(1.875rem,4.5vw,2.625rem)] font-bold leading-tight text-deep">
          {news.title}
        </h1>

        <div className="relative mb-8 h-[240px] overflow-hidden rounded-2xl bg-[#dce5f5] sm:h-[400px]">
          <Photo
            src={cover}
            alt={altText(news.cover, locale, news.title)}
            label={m.news.photo}
            icon="book"
            sizes="(min-width: 768px) 768px, 100vw"
            priority
          />
        </div>

        <Prose html={news.content} />

        <div className="mt-10 border-t border-line pt-6">
          <ShareButtons title={news.title} url={url} />
        </div>
        <Link
          href={localeHref(locale, "/berita")}
          className="mt-6 inline-block text-sm font-bold text-primary"
        >
          ← {m.newsPage.back}
        </Link>
      </article>

      {related.length > 0 && (
        <section className="bg-soft py-14">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <Reveal>
              <h2 className="mb-6 font-serif text-[clamp(1.625rem,3.5vw,2.125rem)] font-bold text-deep">
                {m.newsPage.related}
              </h2>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((n, i) => (
                <li key={n.id}>
                  <Reveal delay={i * 80} className="h-full">
                    <NewsCard n={n} locale={locale} m={m} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
