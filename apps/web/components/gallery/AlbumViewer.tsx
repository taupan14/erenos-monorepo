"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Icon } from "@/components/ui/Icon";

export type ViewerPhoto = {
  src: string | null;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
};

const PLACEHOLDER_RATIOS = [
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[16/10]",
  "aspect-[4/5]",
];

/**
 * Grid foto bergaya masonry + lightbox gelap (elemen <dialog> bawaan: fokus terkunci, Esc menutup).
 * Navigasi: tombol panah, tombol keyboard ← →, dan strip thumbnail.
 */
export function AlbumViewer({ photos }: { photos: ViewerPhoto[] }) {
  const { m } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const count = photos.length;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) {
      d.showModal();
      document.body.style.overflow = "hidden";
    }
    if (index === null && d.open) d.close();
    return () => {
      document.body.style.overflow = "";
    };
  }, [index]);

  const go = useCallback(
    (delta: number) =>
      setIndex((i) => (i === null ? i : (i + delta + count) % count)),
    [count],
  );

  const current = index === null ? null : photos[index];

  return (
    <>
      <ul className="columns-1 gap-3.5 sm:columns-2 lg:columns-3">
        {photos.map((p, i) => (
          <li
            key={`${p.src ?? "ph"}-${i}`}
            className="mb-3.5 break-inside-avoid"
          >
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={fmt(m.gallery.open, { n: i + 1 })}
              className="group relative block w-full overflow-hidden rounded-2xl bg-[#dce5f5]"
            >
              {p.src && p.width && p.height ? (
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.width}
                  height={p.height}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                  className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.05] motion-reduce:transition-none"
                />
              ) : (
                <div
                  className={cn(
                    "flex w-full items-center justify-center text-xs text-[#3a4a6b]",
                    PLACEHOLDER_RATIOS[i % PLACEHOLDER_RATIOS.length],
                  )}
                >
                  {p.src ? (
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      sizes="380px"
                      className="object-cover"
                    />
                  ) : (
                    <span>{p.alt}</span>
                  )}
                </div>
              )}
              {p.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-deep/85 px-3.5 py-2.5 text-left text-[13px] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {p.caption}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={m.gallery.dialog}
        onClose={() => setIndex(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        className="m-0 h-dvh max-h-none w-dvw max-w-none bg-[#0b1530] p-0 text-white open:flex open:flex-col backdrop:bg-black"
      >
        {current && index !== null && (
          <>
            <div className="flex items-center justify-between px-5 py-4 text-sm text-[#c9d7f2]">
              <span aria-live="polite">
                {fmt(m.gallery.counter, { n: index + 1, total: count })}
              </span>
              <button
                type="button"
                autoFocus
                onClick={() => setIndex(null)}
                aria-label={m.gallery.close}
                className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <Icon name="close" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1">
              {current.src ? (
                <Image
                  key={current.src}
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-[#1b3a78] text-[#9fb6e8]">
                  {current.alt}
                </div>
              )}
              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label={m.gallery.prev}
                    className="absolute left-3 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-white/80 bg-black/30 text-2xl hover:bg-black/50"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label={m.gallery.next}
                    className="absolute right-3 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-white/80 bg-black/30 text-2xl hover:bg-black/50"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div className="px-5 pb-4 pt-3">
              {current.caption && (
                <p className="mb-3 text-center text-sm text-[#e3ebfa]">
                  {current.caption}
                </p>
              )}
              <ul
                aria-label={m.gallery.thumbs}
                className="flex justify-start gap-2 overflow-x-auto pb-1 sm:justify-center"
              >
                {photos.map((p, i) => (
                  <li key={`t-${i}`} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={fmt(m.gallery.open, { n: i + 1 })}
                      aria-current={i === index}
                      className={cn(
                        "relative block h-[50px] w-[76px] overflow-hidden rounded-lg bg-[#27468f] transition-opacity",
                        i === index
                          ? "opacity-100 outline outline-2 outline-accent"
                          : "opacity-60 hover:opacity-100",
                      )}
                    >
                      {p.src && (
                        <Image
                          src={p.src}
                          alt=""
                          fill
                          sizes="76px"
                          className="object-cover"
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
