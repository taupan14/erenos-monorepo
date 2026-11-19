"use client";

import { useEffect, useRef, useState } from "react";
import { intlLocale, type Locale } from "@/lib/i18n";

/** Angka yang dihitung naik dari 0 sekali saat masuk layar, diformat sesuai bahasa (1.250 / 1,250). */
export function CountUp({
  to,
  locale,
  suffix = "",
  duration = 1800,
}: {
  to: number;
  locale: Locale;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(to);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    let raf = 0;
    setValue(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const k = Math.min(1, (now - start) / duration);
          setValue(Math.round(to * (1 - Math.pow(1 - k, 3))));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {new Intl.NumberFormat(intlLocale(locale)).format(value)}
      {suffix}
    </span>
  );
}
