import type { Metadata } from "next";
import Link from "next/link";
import {
  UnsubscribeForm,
  type UnsubscribeLabels,
} from "@/components/forms/UnsubscribeForm";
import { PageBanner } from "@/components/ui/PageBanner";
import { localeHref } from "@/lib/i18n";
import { getMessages } from "@/lib/messages";
import { pageMetadata, resolveLocale } from "@/lib/seo";
import { UUID_RE } from "@/lib/uuid";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  return {
    ...pageMetadata(
      await resolveLocale(params),
      "unsubscribe",
      "/berhenti-berlangganan",
    ),
    // Halaman bertoken: jangan diindeks, dan jangan bocorkan token lewat Referer
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function UnsubscribePage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params);
  const m = getMessages(locale);
  const { token } = await searchParams;
  const valid = typeof token === "string" && UUID_RE.test(token);
  const homeHref = localeHref(locale, "/");
  const labels: UnsubscribeLabels = { ...m.unsubscribe };

  return (
    <>
      <PageBanner
        title={m.pages.unsubscribe.title}
        highlight={m.pages.unsubscribe.highlight}
        crumbs={[
          { label: m.nav.home, href: homeHref },
          {
            label: `${m.pages.unsubscribe.title} ${m.pages.unsubscribe.highlight}`,
          },
        ]}
        m={m}
      />
      <section className="mx-auto max-w-[560px] px-5 py-14 sm:px-8">
        <div className="rounded-2xl bg-white p-7 text-center shadow-[0_6px_24px_rgba(20,41,90,0.14)] sm:p-9">
          {valid ? (
            <UnsubscribeForm
              token={token}
              labels={labels}
              homeHref={homeHref}
            />
          ) : (
            <div role="alert">
              <h2 className="font-serif text-2xl font-bold text-deep">
                {m.unsubscribe.invalid}
              </h2>
              <p className="mt-3 leading-relaxed text-muted">
                {m.unsubscribe.invalidText}
              </p>
              <Link
                href={homeHref}
                className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep"
              >
                {m.unsubscribe.home}
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
