import Link from "next/link";
import { PageBanner } from "@/components/ui/PageBanner";
import { getAdmission } from "@/lib/data";
import { localeHref } from "@/lib/i18n";
import { loc } from "@/lib/localize";
import { getMessages } from "@/lib/messages";
import { pageMetadata, resolveLocale } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await resolveLocale(params), "faq", "/faq");
}

/** Pertanyaan umum: memakai FAQ yang sama dengan halaman Admisi (CMS → Admisi → FAQ). */
export default async function FaqPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const faqs = (await getAdmission()).filter((r) => r.section === "faq");

  return (
    <>
      <PageBanner
        title={m.pages.faq.title}
        highlight={m.pages.faq.highlight}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: `${m.pages.faq.title} ${m.pages.faq.highlight}` },
        ]}
        m={m}
      />

      <section className="mx-auto max-w-[820px] px-5 py-14 sm:px-8">
        <p className="mb-8 text-muted">{m.faqPage.intro}</p>

        {faqs.length === 0 ? (
          <p className="text-muted">{m.faqPage.empty}</p>
        ) : (
          <div className="border-b border-line">
            {faqs.map((f) => (
              <details key={f.id} className="group border-t border-line py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-deep [&::-webkit-details-marker]:hidden">
                  {loc(f, "title", locale) ?? f.title}
                  <span
                    aria-hidden
                    className="text-xl text-primary transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">
                  {loc(f, "body", locale)}
                </p>
              </details>
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-soft p-6 text-center sm:p-8">
          <p className="font-serif text-xl font-bold text-deep">
            {m.faqPage.contact}
          </p>
          <Link
            href={localeHref(locale, "/kontak")}
            className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep"
          >
            {m.faqPage.contactCta}
          </Link>
        </div>
      </section>
    </>
  );
}
