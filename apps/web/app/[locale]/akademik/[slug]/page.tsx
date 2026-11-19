import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ACADEMIC_LEVELS } from "@erenos/shared";
import { Icon, isIconName, type IconName } from "@/components/ui/Icon";
import { PageBanner } from "@/components/ui/PageBanner";
import { Photo } from "@/components/ui/Photo";
import { Prose } from "@/components/ui/Prose";
import { Reveal } from "@/components/ui/Reveal";
import { getLevelBySlug, getLevels } from "@/lib/data";
import { alternatesFor, fmt, localeHref } from "@/lib/i18n";
import { resolveLevels } from "@/lib/levels";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import { getMessages } from "@/lib/messages";
import { resolveLocale } from "@/lib/seo";
import { btnGold } from "@/lib/ui";

type Props = { params: Promise<{ locale: string; slug: string }> };

const PROGRAM_ICONS: IconName[] = ["book", "cross", "ball", "heart"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const level = await getLevelBySlug(slug);
  const known = ACADEMIC_LEVELS.find((l) => l.slug === slug);
  if (!level && !known) return {};
  const name =
    (level && loc(level, "name", locale)) ??
    (known ? m.levels.items[known.code].name : slug);
  return {
    title: name,
    description:
      (level && loc(level, "summary", locale)) ??
      (known ? m.levels.items[known.code].summary : undefined),
    alternates: alternatesFor(locale, `/akademik/${slug}`),
  };
}

export default async function LevelPage({ params }: Props) {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const m = getMessages(locale);

  const [level, levelRows] = await Promise.all([
    getLevelBySlug(slug),
    getLevels(),
  ]);
  const known = ACADEMIC_LEVELS.find((l) => l.slug === slug);
  if (!level && !known) notFound();

  // Tanpa data di database, jenjang bawaan tetap tampil dengan ringkasan dari kamus
  const defaults = known ? m.levels.items[known.code] : null;
  const name = (level && loc(level, "name", locale)) ?? defaults?.name ?? slug;
  const short =
    locale === "en" && defaults
      ? defaults.short
      : (level?.short_name ?? defaults?.short ?? name);
  const summary =
    (level && loc(level, "summary", locale)) ?? defaults?.summary ?? "";
  const contentHtml = level ? loc(level, "content", locale) : null;
  const cover = mediaUrl(level?.cover);

  const tabs = resolveLevels(levelRows, locale, m).map((l) => ({
    label: l.short,
    href: localeHref(locale, `/akademik/${l.slug}`),
    active: l.slug === slug,
  }));

  const facts = (level?.facts ?? []).slice(0, 3).filter((f) => f && f.value);
  const programs = (level?.programs ?? []).filter((p) =>
    loc(p, "title", locale),
  );
  const photos = (level?.gallery?.items ?? []).slice(0, 5);
  // Tanpa album di CMS: tampilkan placeholder bertema agar tata letak tetap terlihat
  const cells =
    photos.length > 0
      ? photos.map((p) => ({
          src: mediaUrl(p.media),
          alt: loc(p, "caption", locale) ?? altText(p.media, locale, name),
          label: "",
        }))
      : Array.from({ length: 5 }, (_, i) => ({
          src: null as string | null,
          alt: fmt(m.studentLife.photo, { n: i + 1 }),
          label: `${i + 1}`,
        }));

  return (
    <>
      <PageBanner
        title={name}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: m.nav.academics, href: localeHref(locale, "/akademik") },
          { label: short },
        ]}
        imageUrl={cover}
        imageAlt={altText(level?.cover ?? null, locale, name)}
        tabs={tabs.length > 1 ? tabs : undefined}
        m={m}
      />

      <section className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
        <Reveal>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
            {m.level.intro}
          </p>
          <h2 className="mb-4 font-serif text-[clamp(1.625rem,3.5vw,2.125rem)] font-bold leading-tight text-deep">
            {summary}
          </h2>
          {contentHtml ? (
            <Prose html={contentHtml} />
          ) : (
            <p className="leading-relaxed text-muted">
              {m.level.introPlaceholder}
            </p>
          )}
        </Reveal>
        {facts.length > 0 && (
          <Reveal delay={120}>
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {facts.map((f, i) => (
                <div key={i} className="rounded-2xl bg-soft p-4 text-center">
                  <dd className="font-serif text-[1.75rem] font-bold text-primary">
                    {f.value}
                  </dd>
                  <dt className="text-xs text-muted">
                    {loc(f, "label", locale)}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </section>

      {programs.length > 0 && (
        <section className="bg-soft py-14">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <Reveal>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
                {m.level.programs}
              </p>
              <h2 className="mb-7 font-serif text-[clamp(1.625rem,3.5vw,2.125rem)] font-bold text-deep">
                {m.level.programsTitle}
              </h2>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {programs.map((p, i) => {
                const icon = isIconName(p.icon)
                  ? p.icon
                  : (PROGRAM_ICONS[i % PROGRAM_ICONS.length] ?? "book");
                return (
                  <li key={i}>
                    <Reveal delay={i * 80} className="h-full">
                      <div className="h-full rounded-2xl bg-white p-6 shadow-[0_6px_24px_rgba(20,41,90,0.12)]">
                        <div className="flex size-12 items-center justify-center rounded-full bg-primary text-white">
                          <Icon name={icon} />
                        </div>
                        <h3 className="mb-1.5 mt-4 font-serif text-[1.0625rem] font-bold text-deep">
                          {loc(p, "title", locale)}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted">
                          {loc(p, "description", locale)}
                        </p>
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {cells.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
          <Reveal>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
              {m.level.activities}
            </p>
            <h2 className="mb-7 font-serif text-[clamp(1.625rem,3.5vw,2.125rem)] font-bold text-deep">
              {fmt(m.level.activitiesTitle, { name: short })}
            </h2>
          </Reveal>
          <ul className="grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:grid-cols-5">
            {cells.map((c, i) => (
              <li key={i}>
                <Reveal delay={i * 70}>
                  <div className="group relative h-[170px] overflow-hidden rounded-xl bg-[#dce5f5]">
                    <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.07] motion-reduce:transition-none">
                      <Photo
                        src={c.src}
                        alt={c.alt}
                        label={c.label}
                        icon="users"
                        sizes="(min-width: 1024px) 230px, 50vw"
                      />
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
        <Reveal>
          <div className="flex flex-col items-center justify-between gap-5 rounded-2xl bg-deep px-7 py-8 text-center sm:px-12 lg:flex-row lg:text-left">
            <h2 className="font-serif text-[clamp(1.375rem,2.6vw,1.75rem)] font-bold text-white">
              {m.level.ctaTitle}
            </h2>
            <Link href={localeHref(locale, "/admisi")} className={btnGold}>
              {m.level.ctaButton} {short} →
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
