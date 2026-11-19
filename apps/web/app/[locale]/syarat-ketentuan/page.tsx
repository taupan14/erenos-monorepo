import { LegalPage } from "@/components/legal/LegalPage";
import { pageMetadata, resolveLocale } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return pageMetadata(
    await resolveLocale(params),
    "terms",
    "/syarat-ketentuan",
  );
}

export default async function TermsPage({ params }: Props) {
  return (
    <LegalPage
      locale={await resolveLocale(params)}
      slug="syarat-ketentuan"
      pageKey="terms"
    />
  );
}
