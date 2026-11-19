import Link from "next/link";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PageBanner } from "@/components/ui/PageBanner";
import { Reveal } from "@/components/ui/Reveal";
import { mapsEmbedSrc, whatsappUrl } from "@/lib/contact";
import { getSiteSettings } from "@/lib/data";
import { localeHref } from "@/lib/i18n";
import { loc } from "@/lib/localize";
import { getMessages } from "@/lib/messages";
import { pageMetadata, resolveLocale } from "@/lib/seo";
import { SocialIcon, type SocialIconName } from "@/components/ui/SocialIcon";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await resolveLocale(params), "contact", "/kontak");
}

const BENEFIT_ICONS: IconName[] = ["book", "send", "users"];
const cardP = "text-[15px] leading-relaxed text-[#dce5f5]";

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: IconName;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 border-t border-white/[0.14] py-5 first:border-t-0 first:pt-1">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-deep">
        <Icon name={icon} size={20} />
      </span>
      <div className="min-w-0">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
          {label}
        </p>
        {children}
      </div>
    </li>
  );
}

export default async function ContactPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const s = await getSiteSettings();

  const phone = s?.phone ?? null;
  const wa = s?.whatsapp ?? null;
  const email = s?.email ?? null;
  const waUrl = whatsappUrl(wa);
  const map = mapsEmbedSrc(s?.maps_embed_url);
  const socials = (
    [
      { label: "Facebook", icon: "facebook", url: s?.facebook_url },
      { label: "YouTube", icon: "youtube", url: s?.youtube_url },
      { label: "Instagram", icon: "instagram", url: s?.instagram_url },
      { label: "TikTok", icon: "tiktok", url: s?.tiktok_url },
    ] as {
      label: string;
      icon: SocialIconName;
      url: string | null | undefined;
    }[]
  ).filter(
    (s): s is { label: string; icon: SocialIconName; url: string } => !!s.url,
  );
  // const socials = [
  //   { label: "Facebook", short: "fb", url: s?.facebook_url },
  //   { label: "Instagram", short: "ig", url: s?.instagram_url },
  //   { label: "YouTube", short: "yt", url: s?.youtube_url },
  //   { label: "TikTok", short: "tt", url: s?.tiktok_url },
  // ].filter((x): x is { label: string; short: string; url: string } => !!x.url);

  return (
    <>
      <PageBanner
        title={m.pages.contact.title}
        highlight={m.pages.contact.highlight}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: m.nav.contact },
        ]}
        m={m}
      />

      <section className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_0.82fr] lg:gap-12">
        {/* Formulir */}
        <Reveal>
          <p className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-muted">
            <span aria-hidden className="h-0.5 w-6 bg-accent" />
            {m.contact.eyebrow}
          </p>
          <h2 className="mb-8 text-[clamp(1.875rem,4vw,2.5rem)] font-extrabold leading-tight text-deep">
            {m.contact.headingA}
            <span className="font-serif font-medium italic text-[#b58500]">
              {m.contact.headingB}
            </span>
          </h2>
          <InquiryForm variant="contact" />
        </Reveal>

        {/* Kartu info biru tua membulat: baris berikon emas dipisah garis tipis */}
        <Reveal delay={120}>
          <div className="relative overflow-hidden rounded-[32px] bg-deep p-8 text-white sm:p-9">
            <span
              aria-hidden
              className="absolute -right-[90px] -top-[90px] size-[260px] rounded-full bg-white/[0.06]"
            />
            <span
              aria-hidden
              className="absolute right-[30px] top-[60px] hidden size-[240px] rounded-full border border-white/[0.18] sm:block"
            />

            <ul className="relative">
              <InfoRow icon="pin" label={m.contact.address}>
                <p className={cardP}>{s?.address ?? m.placeholder.address}</p>
              </InfoRow>
              <InfoRow icon="phone" label={m.contact.contactTitle}>
                <p className={cardP}>
                  {m.contact.phoneLabel}:{" "}
                  {phone ? (
                    <a
                      href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                      className="hover:underline"
                    >
                      {phone}
                    </a>
                  ) : (
                    m.placeholder.phone
                  )}
                </p>
                {(wa || waUrl) && (
                  <p className={cardP}>
                    {m.contact.whatsappLabel}:{" "}
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {wa}
                      </a>
                    ) : (
                      wa
                    )}
                  </p>
                )}
                <p className={cardP}>
                  {m.contact.emailLabel}:{" "}
                  {email ? (
                    <a href={`mailto:${email}`} className="hover:underline">
                      {email}
                    </a>
                  ) : (
                    m.placeholder.email
                  )}
                </p>
              </InfoRow>
              <InfoRow icon="clock" label={m.contact.hours}>
                <p className={`${cardP} whitespace-pre-line`}>
                  {loc(s, "office_hours", locale) ?? m.placeholder.hours}
                </p>
              </InfoRow>
              {socials.length > 0 && (
                <li className="border-t border-white/[0.14] pt-5">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                    {m.contact.connect}
                  </p>
                  <div className="flex gap-2.5">
                    {socials.map((x) => (
                      <a
                        key={x.label}
                        href={x.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={x.label}
                        className="flex size-10 items-center justify-center rounded-full border-[1.5px] border-accent text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-deep"
                      >
                        {/* {x.short} */}
                        <SocialIcon name={x.icon} size={17} />
                      </a>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Peta selebar layar */}
      <section aria-label={m.contact.mapTitle}>
        {map ? (
          <iframe
            src={map}
            title={m.contact.mapTitle}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="block h-[360px] w-full border-0"
          />
        ) : (
          <div className="flex h-[260px] flex-col items-center justify-center gap-2 bg-[#e6ecf7] px-5 text-center text-sm text-[#3a4a6b]">
            <Icon name="send" size={28} className="text-primary/60" />
            {m.contact.mapPlaceholder}
          </div>
        )}
      </section>

      {/* Strip keunggulan */}
      <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8">
        <ul className="grid gap-8 md:grid-cols-3">
          {m.contact.benefits.map((b, i) => (
            <li key={b.title}>
              <Reveal delay={i * 100} className="flex items-center gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-deep ring-1 ring-accent/50">
                  <Icon name={BENEFIT_ICONS[i] ?? "book"} size={26} />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-deep">
                    {b.title}
                  </h3>
                  <p className="text-sm text-muted">{b.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center text-sm text-muted">
          <Link
            href={localeHref(locale, "/admisi")}
            className="font-bold text-primary underline underline-offset-4"
          >
            {m.nav.admission}
          </Link>
        </p>
      </section>
    </>
  );
}
