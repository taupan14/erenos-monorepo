import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import NavigationProgress from "@/components/NavigationProgress";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TopBar } from "@/components/layout/TopBar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { getLevels, getSiteSettings } from "@/lib/data";
import { LOCALES, isLocale } from "@/lib/i18n";
import { resolveLevels } from "@/lib/levels";
import { mediaUrl } from "@/lib/media";
import { getMessages } from "@/lib/messages";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// Halaman statis per bahasa; diperbarui tiap 5 menit, atau seketika lewat POST /api/revalidate
export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
      default: "Erenos Christian School",
      template: "%s | Erenos Christian School",
    },
    description: getMessages(locale).meta.description,
    openGraph: {
      siteName: "Erenos Christian School",
      type: "website",
      locale: locale === "en" ? "en_US" : "id_ID",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#2F55A4",
  colorScheme: "light",
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const m = getMessages(locale);
  const [settings, levelRows] = await Promise.all([
    getSiteSettings(),
    getLevels(),
  ]);
  const logoUrl = mediaUrl(settings?.logo);
  const levels = resolveLevels(levelRows, locale, m);
  const schoolName = settings?.school_name ?? "Erenos Christian School";

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${playfair.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Tanpa JavaScript, jangan sembunyikan konten yang menunggu animasi muncul */}
        <noscript>
          <style>
            {".reveal{opacity:1!important;transform:none!important}"}
          </style>
        </noscript>
      </head>
      <body>
        <I18nProvider locale={locale} messages={m}>
          <NavigationProgress />
          <PageViewTracker />
          <a
            href="#konten"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:bg-white focus:px-4 focus:py-2 focus:text-deep"
          >
            {m.a11y.skip}
          </a>
          <TopBar settings={settings} locale={locale} m={m} />
          <SiteHeader
            logoUrl={logoUrl}
            schoolName={schoolName}
            levels={levels}
          />
          <main id="konten">{children}</main>
          <SiteFooter
            settings={settings}
            logoUrl={logoUrl}
            locale={locale}
            m={m}
            levels={levels}
          />
          <WhatsAppButton
            phone={settings?.whatsapp}
            label={m.whatsapp.label}
            text={m.whatsapp.text}
          />
        </I18nProvider>
      </body>
    </html>
  );
}
