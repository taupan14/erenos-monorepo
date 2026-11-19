import { LevelsExpand } from "@/components/home/LevelsExpand";
import { PageBanner } from "@/components/ui/PageBanner";
import { Reveal } from "@/components/ui/Reveal";
import { getLevels } from "@/lib/data";
import { localeHref } from "@/lib/i18n";
import { resolveLevels } from "@/lib/levels";
import { getMessages } from "@/lib/messages";
import { pageMetadata, resolveLocale } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await resolveLocale(params), "academics", "/akademik");
}

export default async function AcademicsPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const levels = resolveLevels(await getLevels(), locale, m);

  return (
    <>
      <PageBanner
        title={m.pages.academics.title}
        highlight={m.pages.academics.highlight}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: m.nav.academics },
        ]}
        m={m}
      />
      <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8">
        <Reveal>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-muted">
            {m.level.listIntro}
          </p>
        </Reveal>
        <Reveal delay={100}>
          <LevelsExpand items={levels} />
        </Reveal>
      </section>
    </>
  );
}
