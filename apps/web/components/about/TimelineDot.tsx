"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Titik peristiwa pada garis waktu. Saat masuk layar: titik "membal" muncul (membesar lalu
 * menyusut ke ukuran normal), disusul riak emas yang memudar. Saat baris di-hover, titik membesar.
 * Mati otomatis untuk prefers-reduced-motion. Induk baris perlu kelas `group/tl`.
 */
export function TimelineDot({
  delay = 0,
  className,
}: {
  delay?: number;
  className?: string;
}) {
  const wrap = useRef<HTMLSpanElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.6, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // useLayoutEffect: animasi dimulai sebelum frame pertama dilukis, jadi titik tidak sempat berkedip penuh
  useLayoutEffect(() => {
    if (!shown) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    dot.current?.animate(
      [
        { transform: "scale(0)" },
        { transform: "scale(1.35)", offset: 0.6 },
        { transform: "scale(1)" },
      ],
      {
        duration: 650,
        delay: delay + 150,
        easing: "ease-out",
        fill: "backwards",
      },
    );
    ring.current?.animate(
      [
        { transform: "scale(1)", opacity: 0.55 },
        { transform: "scale(3.4)", opacity: 0 },
      ],
      {
        duration: 1500,
        delay: delay + 500,
        easing: "ease-out",
        fill: "forwards",
      },
    );
  }, [shown, delay]);

  return (
    <span
      ref={wrap}
      aria-hidden="true"
      className={cn("relative block", className)}
    >
      <span
        ref={ring}
        className="absolute inset-0 rounded-full bg-accent opacity-0"
      />
      <span
        ref={dot}
        className={cn(
          "relative block size-full rounded-full border-4 border-white bg-accent shadow-[0_0_0_1.5px_var(--accent)] transition-transform duration-300 group-hover/tl:scale-125 motion-reduce:transition-none motion-reduce:group-hover/tl:scale-100",
          shown ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}
