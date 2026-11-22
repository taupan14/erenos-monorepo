import { mediaPublicUrl } from "@/lib/media";
import { BrevoError, brevoConfig, getCampaign } from "@/lib/brevo";
import type { EmailSchool } from "@/lib/email-template";
import type { createClient } from "@/lib/supabase/server";

type Db = Awaited<ReturnType<typeof createClient>>;

export const STATUS_LABEL: Record<string, string> = {
  draft: "Draf",
  scheduled: "Terjadwal",
  sending: "Dikirim",
  sent: "Terkirim",
};
export const STATUS_PILL: Record<string, string> = {
  draft: "bg-amber-100 text-amber-900",
  scheduled: "bg-soft text-primary",
  sending: "bg-soft text-primary",
  sent: "bg-green-100 text-green-800",
};

export type NewsletterRow = {
  id: string;
  subject: string;
  preheader: string | null;
  body_html: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  brevo_list_id: number | null;
  brevo_campaign_id: number | null;
  last_error: string | null;
  created_at: string;
};

/** Data sekolah untuk header/footer email, diambil dari Pengaturan CMS. */
export async function loadSchool(supabase: Db): Promise<EmailSchool> {
  const { data: s } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  let logoUrl: string | null = null;
  if (s?.logo_media_id) {
    const { data: m } = await supabase
      .from("media")
      .select("path")
      .eq("id", s.logo_media_id)
      .maybeSingle();
    if (m?.path) logoUrl = mediaPublicUrl(String(m.path));
  }
  const socials = (
    [
      ["Facebook", s?.facebook_url],
      ["Instagram", s?.instagram_url],
      ["YouTube", s?.youtube_url],
      ["TikTok", s?.tiktok_url],
    ] as [string, unknown][]
  )
    .filter(([, u]) => typeof u === "string" && u)
    .map(([label, u]) => ({ label, url: String(u) }));
  return {
    name: s?.school_name ? String(s.school_name) : "Erenos Christian School",
    address: s?.address ?? null,
    phone: s?.phone ?? s?.whatsapp ?? null,
    email: s?.email ?? null,
    hours: s?.office_hours ?? null,
    logoUrl,
    websiteUrl: (process.env.WEB_URL ?? "").replace(/\/$/, "") || null,
    socials,
  };
}

/** Semua alamat email pelanggan aktif. */
export async function activeEmails(supabase: Db): Promise<string[]> {
  const out: string[] = [];
  for (let from = 0; from < 50_000; from += 1000) {
    const { data, error } = await supabase
      .from("subscribers")
      .select("email")
      .eq("status", "active")
      .order("subscribed_at")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []).map((r) => String(r.email).trim().toLowerCase()));
    if ((data?.length ?? 0) < 1000) break;
  }
  return [...new Set(out)];
}

/** Memperbarui status buletin terjadwal yang waktunya sudah lewat, sesuai kondisi di Brevo. Tidak pernah melempar galat. */
export async function syncScheduled(
  supabase: Db,
  rows: NewsletterRow[],
): Promise<void> {
  const cfg = brevoConfig();
  if (!cfg) return;
  for (const r of rows) {
    if (r.status !== "scheduled" || !r.brevo_campaign_id || !r.scheduled_at)
      continue;
    if (new Date(r.scheduled_at).getTime() > Date.now()) continue;
    try {
      const { status } = await getCampaign(cfg, Number(r.brevo_campaign_id));
      if (["sent", "archive", "queued", "in_process"].includes(status)) {
        await supabase
          .from("newsletters")
          .update({ status: "sent", sent_at: r.scheduled_at })
          .eq("id", r.id);
        r.status = "sent";
        r.sent_at = r.scheduled_at;
      } else if (["draft", "suspended"].includes(status)) {
        await supabase
          .from("newsletters")
          .update({
            status: "draft",
            scheduled_at: null,
            last_error: "Jadwal dibatalkan atau dihentikan di Brevo.",
          })
          .eq("id", r.id);
        r.status = "draft";
        r.scheduled_at = null;
      }
    } catch (e) {
      if (!(e instanceof BrevoError))
        console.error("[newsletter] syncScheduled", e);
    }
  }
}
