import type { Messages } from "@/lib/messages";
import { FEATURE_ICONS } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

export function FeatureStrip({ m }: { m: Messages }) {
  return (
    <div className="relative z-10 mx-auto -mt-16 max-w-[1200px] px-5 sm:px-8">
      <Reveal>
        <ul className="grid gap-y-5 rounded-lg bg-white py-7 shadow-[0_6px_24px_rgba(20,41,90,0.12)] sm:grid-cols-2 lg:grid-cols-5">
          {m.features.map((f, i) => (
            <li
              key={f.title}
              className={`flex gap-3 px-5 text-primary ${i > 0 ? "lg:border-l lg:border-line" : ""}`}
            >
              <Icon
                name={FEATURE_ICONS[i] ?? "book"}
                size={34}
                className="shrink-0"
              />
              <div className="text-xs leading-normal text-muted">
                <b className="block text-[13px] text-deep">{f.title}</b>
                {f.text}
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
