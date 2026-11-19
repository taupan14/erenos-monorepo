import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Messages } from "@/lib/messages";
import { Parallax } from "@/components/ui/Parallax";
import { Photo } from "@/components/ui/Photo";

export type Crumb = { label: string; href?: string };
export type BannerTab = { label: string; href: string; active?: boolean };

/**
 * Banner halaman dalam: foto penuh dengan parallax, breadcrumb, judul (kata kedua emas),
 * dan kapsul sub-navigasi opsional (mis. pilihan jenjang) yang menimpa tepi bawah.
 */
export function PageBanner({
  title,
  highlight,
  crumbs,
  imageUrl,
  imageAlt = "",
  tabs,
  titleAs = "h1",
  m,
}: {
  title: string;
  highlight?: string;
  crumbs: Crumb[];
  imageUrl?: string | null;
  imageAlt?: string;
  tabs?: BannerTab[];
  /** "p" bila judul artikel sudah memakai <h1> sendiri (mis. detail berita). */
  titleAs?: "h1" | "p";
  m: Messages;
}) {
  const Title = titleAs;
  return (
    <section className="mx-auto max-w-[1280px] px-3 sm:px-5">
      <div className="relative h-[270px] overflow-hidden rounded-[20px] bg-[#27468f] text-white md:h-[300px]">
        <Parallax speed={0.1} className="absolute inset-x-0 -inset-y-[14%]">
          {imageUrl ? (
            <Photo src={imageUrl} alt={imageAlt} sizes="100vw" priority />
          ) : (
            <div aria-hidden className="absolute inset-0 bg-[#27468f]" />
          )}
        </Parallax>
        <div aria-hidden className="absolute inset-0 bg-[rgba(8,20,50,0.45)]" />

        <div className="absolute inset-x-6 bottom-9 sm:inset-x-14 sm:bottom-11">
          <nav
            aria-label={m.a11y.breadcrumb}
            className="mb-3 text-[13px] text-[#c9d7f2]"
          >
            <ol className="flex flex-wrap items-center gap-x-2">
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex items-center gap-2">
                  {c.href ? (
                    <Link href={c.href} className="hover:text-white">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="text-white">
                      {c.label}
                    </span>
                  )}
                  {i < crumbs.length - 1 && <span aria-hidden>/</span>}
                </li>
              ))}
            </ol>
          </nav>
          <Title className="font-serif text-[clamp(2.25rem,5vw,3.375rem)] font-bold leading-[1.05] text-white">
            {title}
            {highlight && (
              <>
                {" "}
                <span className="text-accent">{highlight}</span>
              </>
            )}
          </Title>
        </div>
      </div>

      {tabs && tabs.length > 0 && (
        <ul className="relative z-10 -mt-5 flex flex-wrap gap-2.5 px-6 sm:px-14">
          {tabs.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={t.active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border-[1.5px] px-6 text-[13px] font-bold shadow-[0_6px_18px_rgba(20,41,90,0.12)] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none",
                  t.active
                    ? "border-primary bg-primary text-white"
                    : "border-deep bg-white text-deep",
                )}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
