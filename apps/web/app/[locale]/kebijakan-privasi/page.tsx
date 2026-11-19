import { LegalPage } from "@/components/legal/LegalPage";
import { pageMetadata, resolveLocale } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMetadata(
    await resolveLocale(params),
    "privacy",
    "/kebijakan-privasi",
  );
}

export default async function PrivacyPage({ params }: Props) {
  return (
    <LegalPage
      locale={await resolveLocale(params)}
      slug="kebijakan-privasi"
      pageKey="privacy"
    />
  );
}
