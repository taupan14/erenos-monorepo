import { PageBanner } from "@/components/ui/PageBanner";
import { Prose } from "@/components/ui/Prose";
import { getPages } from "@/lib/data";
import { localeHref, type Locale } from "@/lib/i18n";
import { loc } from "@/lib/localize";
import { getMessages } from "@/lib/messages";
import type { PageKey } from "@/lib/seo";

/**
 * Halaman hukum (Kebijakan Privasi, Syarat & Ketentuan). Isi diedit di CMS
 * (Konten → Halaman statis). Bila belum terbit, tampil placeholder.
 */
export async function LegalPage({
  locale,
  slug,
  pageKey,
}: {
  locale: Locale;
  slug: string;
  pageKey: Extract<PageKey, "privacy" | "terms">;
}) {
  const m = getMessages(locale);
  const page = (await getPages([slug]))[slug];
  const html = loc(page, "content", locale);

  return (
    <>
      <PageBanner
        title={m.pages[pageKey].title}
        highlight={m.pages[pageKey].highlight}
        crumbs={[
          { label: m.nav.home, href: localeHref(locale, "/") },
          { label: `${m.pages[pageKey].title} ${m.pages[pageKey].highlight}` },
        ]}
        m={m}
      />
      <div className="mx-auto max-w-[820px] px-5 py-14 sm:px-8">
        {html ? (
          <Prose html={html} />
        ) : (
          <p className="text-muted">{m.legal.placeholder}</p>
        )}
      </div>
    </>
  );
}
