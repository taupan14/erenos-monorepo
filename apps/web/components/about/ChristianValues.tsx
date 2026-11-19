import { Icon, isIconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import type { Locale } from "@/lib/i18n";
import { loc } from "@/lib/localize";

/** Satu nilai dari pages.meta.values (slug nilai-kristiani). Kolom `_en` = terjemahan Inggris. */
export type ValueItem = {
  title?: string;
  title_en?: string;
  text?: string;
  text_en?: string;
  icon?: string;
  verse?: string;
  verse_en?: string;
};

/**
 * Segmen "Nilai Kristiani" (Opsi A): kartu bernomor dengan ikon emas.
 * Semua isi selalu terlihat; hover hanya menambah efek (kartu terangkat dan berubah biru tua).
 */
export function ChristianValues({
  items,
  locale,
  kicker,
  title,
}: {
  items: ValueItem[];
  locale: Locale;
  kicker: string;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
      <Reveal>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
          {kicker}
        </p>
        <h2 className="mb-8 font-serif text-[clamp(1.625rem,3.5vw,2.125rem)] font-bold text-deep">
          {title}
        </h2>
      </Reveal>
      <ul className="grid gap-[18px] md:grid-cols-3">
        {items.map((v, i) => {
          const name = loc(v, "title", locale);
          const text = loc(v, "text", locale);
          const verse = loc(v, "verse", locale);
          return (
            <li key={i}>
              <Reveal delay={i * 80} className="h-full">
                <article className="group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-[26px] bg-soft px-7 pb-7 pt-[34px] transition duration-500 hover:-translate-y-2 hover:bg-deep hover:shadow-[0_26px_50px_rgba(20,41,90,0.28)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-[22px] top-2.5 font-serif text-[88px] font-bold leading-none text-transparent transition-[-webkit-text-stroke-color] duration-500 [-webkit-text-stroke:1.5px_#c5d1e8] group-hover:[-webkit-text-stroke-color:rgba(224,174,46,0.75)] motion-reduce:transition-none"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="mb-[70px] grid size-[58px] place-items-center rounded-full bg-accent text-deep transition-colors duration-500 group-hover:bg-white motion-reduce:transition-none">
                    {isIconName(v.icon) && <Icon name={v.icon} size={26} />}
                  </div>
                  <h3 className="mb-2.5 font-serif text-[1.875rem] font-bold leading-tight text-deep transition-colors duration-500 group-hover:text-white motion-reduce:transition-none">
                    {name}
                  </h3>
                  {text && (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted transition-colors duration-500 group-hover:text-[#c9d7f2] motion-reduce:transition-none">
                      {text}
                    </p>
                  )}
                  {verse && (
                    <div className="mt-auto pt-5">
                      <p className="border-t border-[#c5d1e8] pt-4 font-serif text-[15px] font-medium italic leading-snug text-deep transition-colors duration-500 group-hover:border-white/25 group-hover:text-white motion-reduce:transition-none">
                        “{verse}”
                      </p>
                    </div>
                  )}
                </article>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
