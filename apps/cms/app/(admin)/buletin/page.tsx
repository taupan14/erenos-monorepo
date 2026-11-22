import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, PageHead } from "@/components/ui/form";
import { getCurrentStaff } from "@/lib/auth";
import { formatDateTime } from "@/lib/inquiry";
import {
  STATUS_LABEL,
  STATUS_PILL,
  syncScheduled,
  type NewsletterRow,
} from "@/lib/newsletters";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Buletin" };

export default async function NewslettersPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");
  if (staff.role !== "super_admin") redirect("/");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletters")
    .select(
      "id, subject, status, scheduled_at, sent_at, recipient_count, brevo_campaign_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as unknown as NewsletterRow[];
  await syncScheduled(supabase, rows);

  return (
    <>
      <PageHead
        title="Buletin"
        subtitle="Email untuk pelanggan buletin: tulis, uji, lalu kirim sekarang atau jadwalkan."
        actions={
          <Link href="/buletin/baru" className={BTN_PRIMARY}>
            + Buat buletin
          </Link>
        }
      />
      {error ? (
        <p className="text-sm text-red-700">
          Gagal memuat buletin: {error.message} (sudah menjalankan migrasi
          newsletters?)
        </p>
      ) : rows.length === 0 ? (
        <div className={`${CARD} text-sm text-muted`}>Belum ada buletin.</div>
      ) : (
        <ul className={`${CARD} divide-y divide-line py-1`}>
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-3 py-3 text-sm"
            >
              <Link
                href={`/buletin/${r.id}`}
                className="min-w-0 flex-1 truncate font-semibold hover:underline"
              >
                {r.subject}
              </Link>
              <span className="hidden text-xs text-muted sm:block">
                {r.status === "scheduled"
                  ? `Dijadwalkan ${formatDateTime(r.scheduled_at)}`
                  : r.sent_at
                    ? `Terkirim ${formatDateTime(r.sent_at)}`
                    : `Dibuat ${formatDateTime(r.created_at)}`}
              </span>
              {r.recipient_count !== null && (
                <span className="hidden text-xs text-muted md:block">
                  {r.recipient_count} penerima
                </span>
              )}
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[r.status] ?? ""}`}
              >
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
              <Link
                href={`/buletin/${r.id}`}
                className={`${BTN_OUTLINE} !h-9 !px-3`}
              >
                {r.status === "draft" ? "Ubah" : "Lihat"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
