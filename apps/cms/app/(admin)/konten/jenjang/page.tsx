import type { Metadata } from "next";
import Link from "next/link";
import { ACADEMIC_LEVELS, CONTENT_STATUS_LABEL, type ContentStatus } from "@erenos/shared";
import { BTN_OUTLINE, CARD, PageHead } from "@/components/ui/form";
import { shortDate } from "@/lib/month";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Jenjang" };

export default async function LevelsListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("academic_levels").select("slug, name, status, updated_at");
  const bySlug = new Map((data ?? []).map((r) => [String(r.slug), r]));

  return (
    <>
      <PageHead title="Jenjang" subtitle="KB–TK, SD, SMP, dan SMA. Keempat jenjang bersifat tetap." />
      {error && <p className="mb-4 text-sm text-red-700">Gagal memuat jenjang: {error.message}</p>}
      <ul className={`${CARD} divide-y divide-line py-1`}>
        {ACADEMIC_LEVELS.map((l) => {
          const row = bySlug.get(l.slug);
          return (
            <li key={l.slug} className="flex items-center gap-4 py-3 text-sm">
              <span className="min-w-0 flex-1 truncate font-semibold">{row ? String(row.name) : l.name}</span>
              {row ? (
                <>
                  <span className="rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-primary">
                    {CONTENT_STATUS_LABEL[row.status as ContentStatus] ?? String(row.status)}
                  </span>
                  <span className="hidden w-16 text-right text-muted sm:block">{shortDate(String(row.updated_at))}</span>
                  <Link href={`/konten/jenjang/${l.slug}`} className={`${BTN_OUTLINE} !h-9 !px-3`}>
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
