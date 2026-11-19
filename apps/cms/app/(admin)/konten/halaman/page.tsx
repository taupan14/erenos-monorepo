import type { Metadata } from "next";
import Link from "next/link";
import { CONTENT_STATUS_LABEL, type ContentStatus } from "@erenos/shared";
import { BTN_OUTLINE, CARD, PageHead } from "@/components/ui/form";
import { PAGE_ORDER } from "@/lib/content-config";
import { shortDate } from "@/lib/month";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Halaman statis" };

export default async function PagesListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("slug, title, status, updated_at")
    .in("slug", PAGE_ORDER.map((p) => p.slug));
  const bySlug = new Map((data ?? []).map((r) => [String(r.slug), r]));

  return (
    <>
      <PageHead title="Halaman statis" subtitle="Halaman tetap di menu Tentang. Alamat (slug) halaman tidak dapat diubah." />
      {error && <p className="mb-4 text-sm text-red-700">Gagal memuat halaman: {error.message}</p>}
      <ul className={`${CARD} divide-y divide-line py-1`}>
        {PAGE_ORDER.map((p) => {
          const row = bySlug.get(p.slug);
          return (
            <li key={p.slug} className="flex items-center gap-4 py-3 text-sm">
              <span className="min-w-0 flex-1 truncate font-semibold">{row ? String(row.title) : p.title}</span>
              {row ? (
                <>
                  <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-primary">
                    {CONTENT_STATUS_LABEL[row.status as ContentStatus] ?? String(row.status)}
                  </span>
                  <span className="hidden w-16 text-right text-muted sm:block">{shortDate(String(row.updated_at))}</span>
                  <Link href={`/konten/halaman/${p.slug}`} className={`${BTN_OUTLINE} !h-9 !px-3`}>
                    Ubah
                  </Link>
                </>
              ) : (
                <span className="text-xs text-muted">Belum ada di database (jalankan seed.sql)</span>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
