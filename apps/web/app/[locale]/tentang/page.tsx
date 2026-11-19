import { getPages, getSiteSettings } from "@/lib/data";
import { localeHref } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import { getMessages } from "@/lib/messages";
import { pageMetadata, resolveLocale } from "@/lib/seo";
import {
  ChristianValues,
  type ValueItem,
} from "@/components/about/ChristianValues";
import {
  HistoryTimeline,
  type TimelineItem,
} from "@/components/about/HistoryTimeline";
import { PageBanner } from "@/components/ui/PageBanner";
import { Parallax } from "@/components/ui/Parallax";
import { Photo } from "@/components/ui/Photo";
import { Prose } from "@/components/ui/Prose";
import { Reveal } from "@/components/ui/Reveal";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await resolveLocale(params), "about", "/tentang");
}

const kicker =
  "mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]";

export default async function AboutPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const [pages, settings] = await Promise.all([
    getPages([
      "tentang-kami",
      "visi-misi",
      "nilai-kristiani",
      "sambutan-kepala-sekolah",
      "sejarah",
    ]),
    getSiteSettings(),
  ]);

  const about = pages["tentang-kami"];
  const vm = pages["visi-misi"];
  const values = pages["nilai-kristiani"];
  const message = pages["sambutan-kepala-sekolah"];
  const history = pages["sejarah"];

  const vision = loc(vm?.meta, "vision", locale);
  const mission = loc(vm?.meta, "mission", locale);
  const principal =
    typeof message?.meta?.principal_name === "string"
      ? message.meta.principal_name
      : null;
  const timeline = (
    Array.isArray(history?.meta?.timeline)
      ? (history?.meta?.timeline as TimelineItem[])
      : []
  ).filter((t) => t && typeof t === "object");
  const aboutHtml = loc(about, "content", locale);
  const valueItems = (
    Array.isArray(values?.meta?.values)
      ? (values?.meta?.values as ValueItem[])
      : []
  ).filter((v) => v && typeof v === "object" && loc(v, "title", locale));

  return (
    <>
      <PageBanner
        title={m.pages.about.title}
        highlight={m.pages.about.highlight}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: m.nav.about },
        ]}
        imageUrl={mediaUrl(about?.cover)}
        imageAlt={altText(about?.cover, locale, "")}
        m={m}
      />

      {/* Profil */}
      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <div className="relative h-[300px] overflow-hidden rounded-t-[150px] bg-[#dce5f5] sm:h-[340px]">
            <Parallax
              speed={0.06}
              className="absolute inset-x-0 -inset-y-[12%]"
            >
              <Photo
                src={mediaUrl(about?.cover)}
                alt={m.about.photoSchool}
                label={m.about.photoSchool}
                icon="users"
                sizes="(min-width: 1024px) 560px, 100vw"
              />
            </Parallax>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className={kicker}>{m.about.profile}</p>
          <h2 className="mb-4 font-serif text-[clamp(1.75rem,4vw,2.25rem)] font-bold text-deep">
            {settings?.school_name ?? "Erenos Christian School"}
          </h2>
          {aboutHtml ? (
            <Prose html={aboutHtml} />
          ) : (
            <p className="leading-relaxed text-muted">
              {loc(about, "excerpt", locale) ?? m.about.profilePlaceholder}
            </p>
          )}
        </Reveal>
      </section>

      {/* Visi dan Misi */}
      <section className="mx-auto grid max-w-[1200px] gap-4 px-5 pb-16 sm:px-8 md:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-[18px] bg-deep p-7 text-white sm:p-9">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
              {m.about.vision}
            </p>
            <h3 className="mb-3 font-serif text-[1.625rem] font-bold text-white">
              {m.about.visionTitle}
            </h3>
            <p className="whitespace-pre-line leading-relaxed text-[#c9d7f2]">
              {vision ?? m.about.visionPlaceholder}
            </p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="h-full rounded-[18px] bg-soft p-7 sm:p-9">
            <p className={kicker}>{m.about.mission}</p>
            <h3 className="mb-3 font-serif text-[1.625rem] font-bold text-deep">
              {m.about.missionTitle}
            </h3>
            <p className="whitespace-pre-line leading-relaxed text-muted">
              {mission ?? m.about.missionPlaceholder}
            </p>
          </div>
        </Reveal>
      </section>

      {/* Nilai Kristiani: kartu bernomor dari meta.values; cadangan: isi bebas halaman */}
      {valueItems.length > 0 ? (
        <ChristianValues
          items={valueItems}
          locale={locale}
          kicker={m.about.values}
          title={m.about.valuesTitle}
        />
      ) : (
        values &&
        loc(values, "content", locale) && (
          <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
            <Reveal>
              <p className={kicker}>{m.about.values}</p>
              <h2 className="mb-5 font-serif text-[clamp(1.625rem,3.5vw,2.125rem)] font-bold text-deep">
                {m.about.valuesTitle}
              </h2>
              <Prose
                html={loc(values, "content", locale) ?? ""}
                className="max-w-3xl"
              />
            </Reveal>
          </section>
        )
      )}

      {/* Sambutan kepala sekolah */}
      <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
        <Reveal>
          <div className="grid items-center gap-8 rounded-[20px] bg-soft p-7 md:grid-cols-[220px_1fr] md:gap-10 md:p-10">
            <div className="relative mx-auto size-[200px] overflow-hidden rounded-full border-4 border-accent bg-[#dce5f5] md:size-[210px]">
              <Photo
                src={mediaUrl(message?.cover)}
                alt={altText(message?.cover, locale, m.about.photoPrincipal)}
                label={m.about.photoPrincipal}
                icon="users"
                sizes="210px"
              />
            </div>
            <div>
              <p className={kicker}>{m.about.message}</p>
              <blockquote className="mb-4 font-serif text-[clamp(1.375rem,2.6vw,1.875rem)] font-semibold italic leading-snug text-deep">
                “{loc(message, "excerpt", locale) ?? m.about.messagePlaceholder}
                ”
              </blockquote>
              {loc(message, "content", locale) && (
                <Prose html={loc(message, "content", locale) ?? ""} />
              )}
              <p className="mt-4 font-serif text-lg font-bold text-deep">
                {principal ?? m.about.principal}
                {principal && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    · {m.about.principal}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Sejarah: garis waktu vertikal zig-zag (Opsi A) */}
      {timeline.length > 0 && (
        <HistoryTimeline
          items={timeline}
          locale={locale}
          kicker={m.about.history}
          title={m.about.historyTitle}
        />
      )}
    </>
  );
}
