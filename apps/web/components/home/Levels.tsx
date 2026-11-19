import type { Locale } from "@/lib/i18n";
import { resolveLevels } from "@/lib/levels";
import type { Messages } from "@/lib/messages";
import type { LevelRow } from "@/lib/types";
import { Reveal } from "@/components/ui/Reveal";
import { LevelsExpand } from "./LevelsExpand";

export function Levels({
  levels,
  locale,
  m,
}: {
  levels: LevelRow[];
  locale: Locale;
  m: Messages;
}) {
  const items = resolveLevels(levels, locale, m);

  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-14 sm:px-8">
      <Reveal>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
          {m.levels.kicker}
        </p>
        <h2 className="mb-6 font-serif text-[clamp(1.625rem,3.5vw,2.125rem)] font-bold text-deep">
          {m.levels.title}
        </h2>
      </Reveal>
      <Reveal delay={100}>
        <LevelsExpand items={items} />
      </Reveal>
    </section>
  );
}
