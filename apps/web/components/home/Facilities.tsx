import { fmt, localeHref, type Locale } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import type { Messages } from "@/lib/messages";
import type { FacilityRow } from "@/lib/types";
import { Icon, isIconName } from "@/components/ui/Icon";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

export function Facilities({
  facilities,
  locale,
  m,
}: {
  facilities: FacilityRow[];
  locale: Locale;
  m: Messages;
}) {
  if (facilities.length === 0) return null;

  return (
    <section className="bg-soft py-14">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            kicker={m.facilities.kicker}
            title={m.facilities.title}
            action={{
              href: localeHref(locale, "/fasilitas"),
              label: m.facilities.all,
            }}
          />
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((f, i) => {
            const name = loc(f, "name", locale) ?? f.name;
            const summary = loc(f, "summary", locale);
            const icon = isIconName(f.icon) ? f.icon : "screen";
            return (
              <li key={f.id}>
                <Reveal delay={i * 80} className="h-full">
                  <article className="group h-full overflow-hidden rounded-lg bg-white shadow-[0_6px_24px_rgba(20,41,90,0.12)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none">
                    <div className="relative h-[150px] overflow-hidden">
                      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.07] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                        <Photo
                          src={mediaUrl(f.media)}
                          alt={altText(f.media, locale, name)}
                          label={fmt(m.facilities.photo, { name })}
                          icon={icon}
                          sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
                        />
                      </div>
                    </div>
                    <div className="relative -mt-[26px] px-[18px] pb-5">
                      <div className="flex size-[52px] items-center justify-center rounded-full bg-primary text-white">
                        <Icon name={icon} />
                      </div>
                      <h3 className="mb-1.5 mt-2.5 font-serif text-lg font-bold text-deep">
                        {name}
                      </h3>
                      {summary && (
                        <p className="text-[13px] leading-relaxed text-muted">
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
      </div>
    </section>
  );
}
