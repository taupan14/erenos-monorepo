import { fmt, localeHref, type Locale } from "@/lib/i18n";
import { altText, loc } from "@/lib/localize";
import { mediaUrl } from "@/lib/media";
import type { Messages } from "@/lib/messages";
import type { GalleryPhoto } from "@/lib/types";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

const PLACEHOLDER_COUNT = 5;

export function StudentLife({
  photos,
  locale,
  m,
}: {
  photos: GalleryPhoto[];
  locale: Locale;
  m: Messages;
}) {
  // Tanpa foto di CMS: tampilkan placeholder bertema agar tata letak tetap terlihat
  const cells =
    photos.length > 0
      ? photos.map((p, i) => ({
          key: `${i}-${p.media?.path ?? ""}`,
          src: mediaUrl(p.media),
          alt:
            loc(p, "caption", locale) ??
            altText(p.media, locale, m.studentLife.alt),
        }))
      : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => ({
          key: `ph-${i}`,
          src: null,
          alt: fmt(m.studentLife.photo, { n: i + 1 }),
        }));

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8">
      <Reveal>
        <SectionHeading
          kicker={m.studentLife.kicker}
          title={m.studentLife.title}
          action={{
            href: localeHref(locale, "/galeri"),
            label: m.studentLife.all,
          }}
        />
      </Reveal>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {cells.map((c, i) => (
          <li key={c.key}>
            <Reveal delay={i * 70}>
              <div className="group relative h-[150px] overflow-hidden rounded-md bg-[#dce5f5]">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.07] motion-reduce:transition-none motion-reduce:group-hover:transform-none">
                  <Photo
                    src={c.src}
                    alt={c.alt}
                    label={`${i + 1}`}
                    icon="users"
                    sizes="(min-width: 1024px) 230px, (min-width: 640px) 33vw, 50vw"
                  />
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
