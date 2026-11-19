import type { Locale } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";
import { SAMPLE_STATS } from "@/lib/site";
import type { SiteSettings } from "@/lib/types";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";

/** Statistik seluruh jenjang. Angka dari CMS (site_settings); bila kosong, angka CONTOH dipakai. */
export function Stats({
  settings,
  locale,
  m,
}: {
  settings: SiteSettings | null;
  locale: Locale;
  m: Messages;
}) {
  const real = [
    settings?.stat_students,
    settings?.stat_certified_teachers,
    settings?.stat_graduation_rate,
  ];
  const values = [
    real[0] ?? SAMPLE_STATS.students,
    real[1] ?? SAMPLE_STATS.teachers,
    real[2] ?? SAMPLE_STATS.graduation,
  ];
  const suffix = ["+", "", "%"];
  const usingSample = real.some((v) => v == null);

  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-14 sm:px-8">
      <Reveal>
        <div className="rounded-[20px] bg-soft px-6 py-12 sm:px-12 sm:py-14">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
            {m.stats.kicker}
          </p>
          <h2 className="font-serif text-[clamp(1.625rem,3.5vw,2.375rem)] font-bold text-deep">
            {m.stats.title}
          </h2>

          <dl className="mt-9 grid gap-10 md:grid-cols-3 md:gap-12">
            {m.stats.items.map((item, i) => (
              <Reveal key={item.label} delay={i * 120}>
                <div className="border-t-2 border-accent pt-5">
                  <dd className="font-serif text-[clamp(3rem,6vw,4.75rem)] font-bold leading-none text-primary">
                    <CountUp to={values[i] ?? 0} locale={locale} />
                    <span className="text-accent">{suffix[i]}</span>
                  </dd>
                  <dt className="mb-1.5 mt-3.5 text-[17px] font-bold text-deep">
                    {item.label}
                  </dt>
                  <dd className="text-sm leading-relaxed text-muted">
                    {item.text}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>

          {usingSample && process.env.NODE_ENV !== "production" && (
            <p className="mt-8 text-xs text-[#8a6200]">⚠ {m.stats.sample}</p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
