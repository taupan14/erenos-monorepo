"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/components/i18n/I18nProvider";
import { btnGold, btnOutlineLight } from "@/lib/ui";

export type HeroSlideView = {
  id: string;
  title: string;
  highlight?: string | null;
  description?: string | null;
  primaryLabel?: string | null;
  primaryHref?: string | null;
  secondaryLabel?: string | null;
  secondaryHref?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
};

const PLACEHOLDER_BG = ["#27468f", "#1f3a78", "#33569e"];
const AUTOPLAY_MS = 6000;

export function HeroSlider({ slides }: { slides: HeroSlideView[] }) {
  const { m } = useI18n();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const count = slides.length;

  const go = useCallback((i: number) => setIndex((i + count) % count), [count]);

  // Autoplay (berhenti saat hover/fokus, atau prefers-reduced-motion)
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [count, paused]);

  // Parallax: foto bergerak lebih lambat dari scroll, teks naik dan memudar
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (y > 900) return;
      if (bgRef.current)
        bgRef.current.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
      if (contentRef.current) {
        contentRef.current.style.transform = `translate3d(0, ${-y * 0.12}px, 0)`;
        contentRef.current.style.opacity = String(Math.max(0, 1 - y / 520));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={m.a11y.carousel}
      className="relative h-[520px] overflow-hidden bg-[#27468f] text-white md:h-[720px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Lapisan foto (diperpanjang ke atas agar parallax tidak menyingkap celah) */}
      <div
        ref={bgRef}
        className="absolute inset-x-0 bottom-0 -top-1/3 will-change-transform"
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            aria-hidden="true"
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none",
              i === index ? "opacity-100" : "opacity-0",
            )}
            style={{
              backgroundColor: PLACEHOLDER_BG[i % PLACEHOLDER_BG.length],
            }}
          >
            {s.imageUrl && (
              <Image
                src={s.imageUrl}
                alt=""
                fill
                sizes="100vw"
                priority={i === 0}
                className="object-cover"
              />
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-[rgba(8,20,50,0.45)]" />

      <div ref={contentRef} className="absolute inset-0">
        {slides.map((s, i) => {
          const active = i === index;
          const Heading = i === 0 ? "h1" : "h2"; // hanya satu <h1> per halaman
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={fmt(m.a11y.slideOf, { n: i + 1, total: count })}
              aria-hidden={!active}
              className={cn(
                "absolute inset-0 flex flex-col justify-center pb-16 transition-opacity duration-700 motion-reduce:transition-none",
                active ? "visible opacity-100" : "invisible opacity-0",
              )}
            >
              <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
                <Heading
                  className={cn(
                    "max-w-[640px] font-serif text-[clamp(2.25rem,5.5vw,3.75rem)] font-bold leading-[1.1] text-white transition duration-700 motion-reduce:transition-none",
                    active
                      ? "translate-y-0 opacity-100"
                      : "translate-y-6 opacity-0",
                  )}
                >
                  {s.title}
                  {s.highlight && (
                    <>
                      {" "}
                      <span className="text-accent">{s.highlight}</span>
                    </>
                  )}
                </Heading>
                {s.description && (
                  <p
                    className={cn(
                      "my-5 max-w-[480px] text-[17px] leading-relaxed text-[#e3ebfa] transition delay-150 duration-700 motion-reduce:transition-none",
                      active
                        ? "translate-y-0 opacity-100"
                        : "translate-y-6 opacity-0",
                    )}
                  >
                    {s.description}
                  </p>
                )}
                <div
                  className={cn(
                    "flex flex-wrap gap-3.5 pt-3 transition delay-300 duration-700 motion-reduce:transition-none",
                    active
                      ? "translate-y-0 opacity-100"
                      : "translate-y-6 opacity-0",
                  )}
                >
                  {s.primaryLabel && s.primaryHref && (
                    <Link
                      href={s.primaryHref}
                      className={btnGold}
                      tabIndex={active ? 0 : -1}
                    >
                      {s.primaryLabel} →
                    </Link>
                  )}
                  {s.secondaryLabel && s.secondaryHref && (
                    <Link
                      href={s.secondaryHref}
                      className={btnOutlineLight}
                      tabIndex={active ? 0 : -1}
                    >
                      {s.secondaryLabel} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label={m.a11y.prevSlide}
            onClick={() => go(index - 1)}
            className="absolute left-6 top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-white bg-[rgba(8,20,50,0.25)] text-2xl text-white md:flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label={m.a11y.nextSlide}
            onClick={() => go(index + 1)}
            className="absolute right-6 top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-white bg-[rgba(8,20,50,0.25)] text-2xl text-white md:flex"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-20 z-10 flex justify-center">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={fmt(m.a11y.goToSlide, { n: i + 1 })}
                aria-current={i === index}
                onClick={() => go(i)}
                className="relative size-6"
              >
                <span
                  className={cn(
                    "absolute inset-[7px] rounded-full transition-colors",
                    i === index ? "bg-accent" : "bg-white/50",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
