import Link from "next/link";
import { Icon, isIconName } from "@/components/ui/Icon";
import { PageBanner } from "@/components/ui/PageBanner";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { getAllFacilities } from "@/lib/data";
import { fmt, localeHref } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import { getMessages } from "@/lib/messages";
import { pageMetadata, resolveLocale } from "@/lib/seo";
import { btnDark } from "@/lib/ui";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await resolveLocale(params), "facilities", "/fasilitas");
}

// Pola ukuran bento (layar lebar): kartu pertama besar, kartu keempat lebar
const SPANS = ["lg:col-span-2 lg:row-span-2", "", "", "lg:col-span-2", "", ""];

export default async function FacilitiesPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const facilities = await getAllFacilities();

  return (
    <>
      <PageBanner
        title={m.pages.facilities.title}
        highlight={m.pages.facilities.highlight}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: m.nav.facilities },
        ]}
        m={m}
      />
      <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8">
        <Reveal>
          <p className="mb-8 max-w-2xl text-lg leading-relaxed text-muted">
            {m.facilitiesPage.intro}
          </p>
        </Reveal>

        {facilities.length === 0 ? (
          <div className="rounded-2xl bg-soft p-10 text-center">
            <p className="mb-5 text-muted">{m.facilitiesPage.empty}</p>
            <Link href={localeHref(locale, "/kontak")} className={btnDark}>
              {m.facilitiesPage.emptyCta} →
            </Link>
          </div>
        ) : (
          <ul className="grid auto-rows-[220px] gap-3.5 sm:grid-cols-2 lg:auto-rows-[165px] lg:grid-cols-4">
            {facilities.map((f, i) => {
              const name = loc(f, "name", locale) ?? f.name;
              const summary = loc(f, "summary", locale);
              const icon = isIconName(f.icon) ? f.icon : "screen";
              return (
                <li key={f.id} className={`${SPANS[i % SPANS.length] ?? ""}`}>
                  <Reveal delay={(i % 4) * 70} className="h-full">
                    <article className="group relative h-full overflow-hidden rounded-[18px] bg-[#dce5f5]">
                      <div className="absolute inset-0 transition-transform duration-[800ms] group-hover:scale-[1.06] motion-reduce:transition-none">
                        <Photo
                          src={mediaUrl(f.media)}
                          alt={altText(f.media, locale, name)}
                          label={fmt(m.facilities.photo, { name })}
                          icon={icon}
                          sizes="(min-width: 1024px) 50vw, 100vw"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-deep/85 p-4 text-white">
                        <h2 className="flex items-center gap-2.5 font-serif text-base font-bold text-white">
                          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-accent text-deep">
                            <Icon name={icon} size={18} />
                          </span>
                          {name}
                        </h2>
                        {summary && (
                          <p className="mt-2 text-[13px] leading-relaxed text-[#dce5f5] transition-all duration-500 lg:mt-0 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:group-hover:mt-2 lg:group-hover:max-h-[72px] lg:group-hover:opacity-100 lg:group-focus-within:mt-2 lg:group-focus-within:max-h-[72px] lg:group-focus-within:opacity-100">
                            {summary}
                          </p>
                        )}
                      </div>
                    </article>
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
