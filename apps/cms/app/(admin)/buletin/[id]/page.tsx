import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NewsletterEditor } from "@/components/newsletter/NewsletterEditor";
import { PageHead } from "@/components/ui/form";
import { getCurrentStaff } from "@/lib/auth";
import { brevoConfig, getCampaign, type CampaignStats } from "@/lib/brevo";
import { toJakartaInput } from "@/lib/datetime";
import { formatDateTime } from "@/lib/inquiry";
import { UUID_RE } from "@/lib/media";
import { syncScheduled, type NewsletterRow } from "@/lib/newsletters";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Buletin" };
export const maxDuration = 60;

export default async function NewsletterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");
  if (staff.role !== "super_admin") redirect("/");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const [{ data }, { count }] = await Promise.all([
    supabase.from("newsletters").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);
  if (!data) notFound();

  const row = data as unknown as NewsletterRow;
  await syncScheduled(supabase, [row]);

  const cfg = brevoConfig();
  let stats: CampaignStats | null = null;
  if (
    cfg &&
    row.brevo_campaign_id &&
    (row.status === "sent" || row.status === "sending")
  ) {
    try {
      stats = (await getCampaign(cfg, Number(row.brevo_campaign_id))).stats;
    } catch {
      stats = null; // statistik bersifat tambahan
    }
  }

  return (
    <>
      <PageHead
        title={row.status === "draft" ? "Ubah buletin" : "Buletin"}
        actions={
          <Link
            href="/buletin"
            className="text-sm font-semibold text-primary underline"
          >
            ← Semua buletin
          </Link>
        }
      />
      <NewsletterEditor
        key={`${row.id}-${row.status}`}
        data={{
          id: row.id,
          subject: row.subject,
          preheader: row.preheader ?? "",
          body_html: row.body_html,
          status: row.status,
          scheduled_local: toJakartaInput(row.scheduled_at),
          scheduled_label: formatDateTime(row.scheduled_at),
          sent_label: formatDateTime(row.sent_at),
          recipient_count: row.recipient_count,
          last_error: row.last_error,
        }}
        activeCount={count ?? 0}
        staffEmail={staff.email}
        brevoReady={Boolean(cfg)}
        stats={stats}
      />
    </>
  );
}
