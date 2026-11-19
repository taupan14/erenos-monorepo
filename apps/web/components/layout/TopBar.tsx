import { Fragment } from "react";
import Link from "next/link";
import { localeHref, type Locale } from "@/lib/i18n";
import { loc } from "@/lib/localize";
import type { Messages } from "@/lib/messages";
import type { SiteSettings } from "@/lib/types";

// Teks berjalan: satu pengumuman per baris di CMS (Pengaturan → Top bar)
const MAX_ITEMS = 10;
const MAX_LEN = 200;
const CHAR_PX = 6.8; // perkiraan lebar rata-rata karakter pada text-xs
const ITEM_GAP_PX = 96; // jarak antar-butir (2 × gap 2,5rem) + penanda
const FILL_PX = 1400; // lebar minimum satu trek agar loop tidak berlubang di layar lebar
const SPEED_PX_S = 45; // kecepatan gulir

function parseTicker(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim().slice(0, MAX_LEN))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

/** Dua trek identik bergeser selebar dirinya (gaya .marquee-* di globals.css); trek kedua hanya untuk loop mulus. */
function Ticker({ items }: { items: string[] }) {
  const unit = items.reduce((s, t) => s + t.length * CHAR_PX + ITEM_GAP_PX, 0);
  const reps = Math.max(1, Math.ceil(FILL_PX / unit));
  const seconds = Math.max(12, Math.round((unit * reps) / SPEED_PX_S));

  const track = (copy: boolean) => (
    <div
      aria-hidden={copy || undefined}
      className={`marquee-track${copy ? " motion-reduce:hidden" : ""}`}
      style={{ animationDuration: `${seconds}s` }}
    >
      {Array.from({ length: reps }).flatMap((_, r) =>
        items.map((text, i) => (
          <Fragment key={`${r}-${i}`}>
            <span aria-hidden={r > 0 || undefined}>{text}</span>
            <span aria-hidden="true" className="text-accent">
              ✦
            </span>
          </Fragment>
        )),
      )}
    </div>
  );

  return (
    <div className="marquee-row marquee-rtl min-w-0 flex-1 [-webkit-mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)] [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)] [&:hover_.marquee-track]:[animation-play-state:paused] motion-reduce:overflow-x-auto">
      {track(false)}
      {track(true)}
    </div>
  );
}

export function TopBar({
  settings,
  locale,
  m,
}: {
  settings: SiteSettings | null;
  locale: Locale;
  m: Messages;
}) {
  const phone = settings?.phone ?? settings?.whatsapp ?? m.placeholder.phone;
  const email = settings?.email ?? m.placeholder.email;
  const address = settings?.address ?? m.placeholder.address;
  const open = settings?.admission_open ?? true;
  const items = parseTicker(loc(settings, "topbar_text", locale));
  const hasTicker = items.length > 0;

  return (
    <div className="bg-deep text-xs text-white">
      <div className="mx-auto flex min-h-[42px] max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <p
          className={
            hasTicker
              ? "hidden max-w-[45%] shrink-0 truncate sm:block"
              : "hidden truncate sm:block"
          }
        >
          {/* {phone} &nbsp;·&nbsp; {email} &nbsp;·&nbsp; {address} */}
          {email} &nbsp;·&nbsp;
        </p>
        {hasTicker && (
          <>
            <span
              aria-hidden="true"
              className="hidden h-4 w-px shrink-0 bg-white/25 sm:block"
            />
            <Ticker items={items} />
          </>
        )}
        {open && (
          <Link
            href={localeHref(locale, "/admisi")}
            className="ml-auto shrink-0 bg-accent px-4 py-3.5 font-bold uppercase tracking-wide text-deep"
          >
            {loc(settings, "admission_badge_text", locale) ?? m.topbar.badge}
          </Link>
        )}
      </div>
    </div>
  );
}
