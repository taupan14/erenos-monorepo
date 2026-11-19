import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NewsCard } from "@/components/news/NewsCard";
import { PageBanner } from "@/components/ui/PageBanner";
import { Reveal } from "@/components/ui/Reveal";
import { getNewsCategories, getNewsPage } from "@/lib/data";
import { cn } from "@/lib/cn";
import { fmt, localeHref } from "@/lib/i18n";
import { loc } from "@/lib/localize";
import { getMessages } from "@/lib/messages";
import { pageMetadata, resolveLocale } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const meta = pageMetadata(await resolveLocale(params), "news", "/berita");
  const sp = await searchParams;
  // Hasil pencarian/halaman lanjutan tidak perlu diindeks
  return one(sp.q) || (one(sp.page) && one(sp.page) !== "1")
    ? { ...meta, robots: { index: false, follow: true } }
    : meta;
}

export default async function NewsPage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const sp = await searchParams;

  const page = Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1);
  const rawCategory = one(sp.kategori);
  const category =
    rawCategory && /^[a-z0-9-]{1,60}$/.test(rawCategory)
      ? rawCategory
      : undefined;
  const q = one(sp.q)?.trim().slice(0, 80) || undefined;

  const [categories, result] = await Promise.all([
    getNewsCategories(),
    getNewsPage({ page, category, q }),
  ]);
  const { items, totalPages, withFeatured, outOfRange } = result;
  const featured = withFeatured ? items[0] : undefined;
  const rest = withFeatured ? items.slice(1) : items;

  const href = (p: number, cat = category) => {
    const u = new URLSearchParams();
    if (cat) u.set("kategori", cat);
    if (q) u.set("q", q);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return localeHref(locale, "/berita") + (s ? `?${s}` : "");
  };

  // Halaman melebihi jumlah yang ada → kembali ke halaman 1 (filter dipertahankan)
  if (outOfRange && page > 1) redirect(href(1));

  // Nomor halaman yang ditampilkan: jendela 5 halaman di sekitar halaman aktif
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const numbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => start + i,
  );

  const chip =
    "inline-flex min-h-11 items-center rounded-full border-[1.5px] px-5 text-xs font-bold transition-colors";

  return (
    <>
      <PageBanner
        title={m.pages.news.title}
        highlight={m.pages.news.highlight}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: m.nav.news },
        ]}
        m={m}
      />

      <section className="mx-auto max-w-[1200px] px-5 py-12 sm:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={localeHref(locale, "/berita")}
                aria-current={!category ? "true" : undefined}
                className={cn(
                  chip,
                  !category
                    ? "border-primary bg-primary text-white"
                    : "border-deep text-deep hover:bg-soft",
                )}
              >
                {m.newsPage.all}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={href(1, c.slug)}
                  aria-current={category === c.slug ? "true" : undefined}
                  className={cn(
                    chip,
                    category === c.slug
                      ? "border-primary bg-primary text-white"
                      : "border-deep text-deep hover:bg-soft",
                  )}
                >
                  {loc(c, "name", locale)}
                </Link>
              </li>
            ))}
          </ul>

          <form
            role="search"
            method="get"
            action={localeHref(locale, "/berita")}
            className="flex w-full max-w-sm"
          >
            {category && (
              <input type="hidden" name="kategori" value={category} />
            )}
            <label htmlFor="q" className="sr-only">
              {m.newsPage.searchLabel}
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              maxLength={80}
              placeholder={m.newsPage.searchPlaceholder}
              className="min-h-11 min-w-0 flex-1 rounded-l-lg border border-[#c5d1e8] bg-white px-4 text-sm text-ink placeholder:text-[#6b7794]"
            />
            <button
              type="submit"
              className="rounded-r-lg bg-deep px-5 text-xs font-bold uppercase tracking-wide text-white"
            >
              {m.newsPage.searchButton}
            </button>
          </form>
        </div>

        {locale === "en" && (
          <p className="mb-6 text-xs text-muted">{m.newsPage.languageNote}</p>
        )}

        {items.length === 0 ? (
          <div className="rounded-2xl bg-soft p-10 text-center">
            <p className="font-serif text-xl font-bold text-deep">
              {m.newsPage.empty}
            </p>
            <p className="mt-2 text-muted">{m.newsPage.emptyHint}</p>
          </div>
        ) : (
          <>
            {featured && (
              <Reveal className="mb-5">
                <NewsCard n={featured} locale={locale} m={m} featured />
              </Reveal>
            )}
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((n, i) => (
                <li key={n.id}>
                  <Reveal delay={(i % 3) * 80} className="h-full">
                    <NewsCard n={n} locale={locale} m={m} />
                  </Reveal>
                </li>
              ))}
            </ul>
          </>
        )}

        {totalPages > 1 && (
          <nav
            aria-label={m.newsPage.pagination}
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
          >
            {page > 1 && (
              <Link
                href={href(page - 1)}
                rel="prev"
                className={cn(chip, "border-deep text-deep hover:bg-soft")}
              >
                ← {m.newsPage.prev}
              </Link>
            )}
            {numbers.map((n) => (
              <Link
                key={n}
                href={href(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={fmt(m.newsPage.pageOf, { n, total: totalPages })}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border-[1.5px] text-[13px] font-bold",
                  n === page
                    ? "border-primary bg-primary text-white"
                    : "border-deep text-deep hover:bg-soft",
                )}
              >
                {n}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={href(page + 1)}
                rel="next"
                className={cn(chip, "border-deep text-deep hover:bg-soft")}
              >
                {m.newsPage.next} →
              </Link>
            )}
          </nav>
        )}
      </section>
    </>
  );
}
