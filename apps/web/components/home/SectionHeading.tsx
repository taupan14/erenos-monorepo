import Link from "next/link";
import { btnOutlineDark } from "@/lib/ui";

export function SectionHeading({
  kicker,
  title,
  action,
}: {
  kicker: string;
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a6200]">
          {kicker}
        </p>
        <h2 className="font-serif text-[clamp(1.625rem,3.5vw,2.125rem)] font-bold text-deep">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className={btnOutlineDark}>
          {action.label} →
        </Link>
      )}
    </div>
  );
}
