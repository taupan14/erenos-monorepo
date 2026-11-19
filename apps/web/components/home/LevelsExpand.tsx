"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { LevelView } from "@/lib/levels";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Photo } from "@/components/ui/Photo";

const TINTS = ["#4f7bda", "#2f55a4", "#27468f", "#1b3a78"];

/**
 * Panel jenjang yang melebar saat di-hover/fokus (desktop). Di layar kecil semua kartu
 * tampil bertumpuk dengan info terbuka. Pada perangkat sentuh, ketukan pertama membuka panel
 * dan ketukan kedua membuka halaman jenjang.
 */
export function LevelsExpand({ items }: { items: LevelView[] }) {
  const { m, href } = useI18n();
  const [active, setActive] = useState(0);

  return (
    <ul
      className="flex flex-col gap-3.5 lg:h-[470px] lg:flex-row"
      onMouseLeave={() => setActive(0)}
    >
      {items.map((it, i) => {
        const on = i === active;
        return (
          <li
            key={it.key}
            onMouseEnter={() => setActive(i)}
            className={cn(
              "relative min-h-[380px] overflow-hidden rounded-[22px] transition-[flex] duration-[800ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none lg:min-h-0",
              on ? "lg:flex-[3.6_1_0%]" : "lg:flex-[1_1_0%]",
            )}
            style={{ backgroundColor: TINTS[i % TINTS.length] }}
          >
            <Link
              href={href(`/akademik/${it.slug}`)}
              className="absolute inset-0 block text-white"
              onFocus={() => setActive(i)}
              onClick={(e) => {
                if (
                  !on &&
                  window.matchMedia("(hover: none) and (min-width: 1024px)")
                    .matches
                ) {
                  e.preventDefault();
                  setActive(i);
                }
              }}
            >
              <div
                className={cn(
                  "absolute inset-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
                  on ? "lg:scale-[1.06]" : "",
                )}
              >
                <Photo
                  src={it.coverUrl}
                  alt={it.coverAlt}
                  label={m.levels.photo.replace("{name}", it.short)}
                  icon="book"
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className={
                    it.coverUrl ? undefined : "bg-transparent text-[#c9d7f2]"
                  }
                />
              </div>
              <div className="absolute inset-0 bg-[rgba(8,20,50,0.5)]" />

              {/* Label vertikal saat panel menyempit */}
              <span
                aria-hidden
                className={cn(
                  "absolute bottom-7 left-6 hidden font-serif text-[30px] font-bold transition-opacity duration-300 lg:block",
                  on ? "opacity-0" : "opacity-100",
                )}
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                {it.short}
              </span>

              <div
                className={cn(
                  "absolute inset-x-6 bottom-6 transition duration-700 sm:inset-x-8 sm:bottom-8 lg:min-w-[380px] motion-reduce:transition-none",
                  on
                    ? "lg:translate-y-0 lg:opacity-100 lg:delay-200"
                    : "lg:pointer-events-none lg:translate-y-5 lg:opacity-0",
                )}
              >
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                  {m.levels.tag}
                </span>
                <h3 className="mb-2.5 mt-2 font-serif text-[clamp(1.5rem,3vw,2.375rem)] font-bold leading-tight text-white">
                  {it.name}
                </h3>
                <p className="max-w-[420px] text-[15px] leading-relaxed text-[#e3ebfa]">
                  {it.summary}
                </p>
                {it.chips.length > 0 && (
                  <ul className="my-4 flex flex-wrap gap-2">
                    {it.chips.map((c) => (
                      <li
                        key={c}
                        className="rounded-full border border-white/50 px-3.5 py-1.5 text-xs"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
                <span className="inline-flex min-h-11 items-center bg-accent px-[22px] text-xs font-bold uppercase tracking-[0.06em] text-deep">
                  {m.levels.cta} →
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
