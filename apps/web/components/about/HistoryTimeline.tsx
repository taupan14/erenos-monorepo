import { TimelineDot } from "@/components/about/TimelineDot";
import { Reveal } from "@/components/ui/Reveal";
import type { Locale } from "@/lib/i18n";
import { loc } from "@/lib/localize";

/** Satu peristiwa dari pages.meta.timeline (slug sejarah). Kolom `_en` = terjemahan Inggris. */
export type TimelineItem = {
  year?: string;
  title?: string;
  title_en?: string;
  text?: string;
  text_en?: string;
};

/**
 * Segmen "Perjalanan kami" (Opsi A): garis waktu vertikal zig-zag.
 * Layar lebar: kartu bergantian kiri/kanan di sepanjang garis emas tengah.
 * HP: satu kolom dengan garis di kiri. Muat jumlah peristiwa berapa pun.
 * Titik peristiwa beranimasi (lihat TimelineDot).
 */
export function HistoryTimeline({
  items,
  locale,
  kicker,
  title,
}: {
  items: TimelineItem[];
  locale: Locale;
  kicker: string;
  title: string;
}) {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-8">
      <Reveal>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
          {kicker}
        </p>
        <h2 className="mb-9 font-serif text-[clamp(1.625rem,3.5vw,2.125rem)] font-bold text-deep">
          {title}
        </h2>
      </Reveal>

      <ol className="relative flex flex-col gap-6">
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-[13px] top-2 w-0.5 bg-[#c5d1e8] md:left-1/2 md:-ml-px"
        />
        {items.map((t, i) => {
          const left = i % 2 === 0;
          const name = loc(t, "title", locale);
          const text = loc(t, "text", locale);
          return (
            <li key={i}>
              <Reveal
                delay={left ? 0 : 100}
                className="group/tl grid grid-cols-[28px_1fr] md:grid-cols-[1fr_56px_1fr]"
              >
                <TimelineDot
                  delay={left ? 0 : 100}
                  className="col-start-1 row-start-1 mt-6 size-5 self-start justify-self-center md:col-start-2"
                />
                <div
                  className={`col-start-2 row-start-1 rounded-[18px] bg-soft px-6 py-5 transition duration-500 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(20,41,90,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                    left ? "md:col-start-1 md:text-right" : "md:col-start-3"
                  }`}
                >
                  {t.year && (
                    <p className="mb-2 font-serif text-[1.875rem] font-bold leading-none text-deep">
                      {t.year}
                    </p>
                  )}
                  {name && (
                    <h3 className="mb-1.5 font-serif text-xl font-bold leading-snug text-deep">
                      {name}
                    </h3>
                  )}
                  {text && (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                      {text}
                    </p>
                  )}
                </div>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
