import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/home/CtaBand";
import { Facilities } from "@/components/home/Facilities";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { HeroSlider, type HeroSlideView } from "@/components/home/HeroSlider";
import { LatestNews } from "@/components/home/LatestNews";
import { Levels } from "@/components/home/Levels";
import { Marquee } from "@/components/home/Marquee";
import { Stats } from "@/components/home/Stats";
import { StudentLife } from "@/components/home/StudentLife";
import { Welcome } from "@/components/home/Welcome";
import { getHomeData, getSiteSettings } from "@/lib/data";
import { alternatesFor, isLocale, withLocale } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import { resolveLevels } from "@/lib/levels";
import { getMessages } from "@/lib/messages";
import { jsonLd, siteUrl } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const [s, m] = [await getSiteSettings(), getMessages(locale)];
  return {
    title: { absolute: loc(s, "seo_title", locale) ?? m.meta.homeTitle },
    description: loc(s, "seo_description", locale) ?? m.meta.description,
    alternates: alternatesFor(locale),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const m = getMessages(locale);
  const [settings, home] = await Promise.all([
    getSiteSettings(),
    getHomeData(),
  ]);

  const slides: HeroSlideView[] =
    home.slides.length > 0
      ? home.slides.map((s) => ({
          id: s.id,
          title: loc(s, "title", locale) ?? s.title,
          highlight: loc(s, "highlight", locale),
          description: loc(s, "description", locale),
          primaryLabel: loc(s, "primary_label", locale),
          primaryHref: s.primary_href
            ? withLocale(locale, s.primary_href)
            : null,
          secondaryLabel: loc(s, "secondary_label", locale),
          secondaryHref: s.secondary_href
            ? withLocale(locale, s.secondary_href)
            : null,
          imageUrl: mediaUrl(s.media),
          imageAlt: altText(s.media, locale, ""),
        }))
      : m.hero.defaults.map((s, i) => ({
          id: `default-${i}`,
          title: s.title,
          highlight: s.highlight,
          description: s.description,
          primaryLabel: s.primaryLabel,
          primaryHref: withLocale(locale, s.primaryHref),
          secondaryLabel: s.secondaryLabel,
          secondaryHref: withLocale(locale, s.secondaryHref),
        }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "School",
    name: settings?.school_name ?? "Erenos Christian School",
    url: `${siteUrl()}/${locale}`,
    logo: mediaUrl(settings?.logo) ?? undefined,
    telephone: settings?.phone ?? undefined,
    email: settings?.email ?? undefined,
    address: settings?.address
      ? { "@type": "PostalAddress", streetAddress: settings.address }
      : undefined,
    sameAs: [
      settings?.facebook_url,
      settings?.instagram_url,
      settings?.youtube_url,
      settings?.tiktok_url,
    ].filter(Boolean),
    inLanguage: locale,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <HeroSlider slides={slides} />
      <FeatureStrip m={m} />
      <Welcome
        about={home.about}
        schoolName={settings?.school_name ?? "Erenos Christian School"}
        locale={locale}
        m={m}
      />
      <Stats settings={settings} locale={locale} m={m} />
      <Levels levels={home.levels} locale={locale} m={m} />
      <Facilities facilities={home.facilities} locale={locale} m={m} />
      <StudentLife photos={home.photos} locale={locale} m={m} />
      <LatestNews news={home.news} locale={locale} m={m} />
      <CtaBand
        settings={settings}
        locale={locale}
        m={m}
        levels={resolveLevels(home.levels, locale, m)}
      />
      <Marquee />
    </>
  );
}
