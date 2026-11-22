"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EMAIL_RE } from "@/lib/accounts";
import { getCurrentStaff } from "@/lib/auth";
import {
  BrevoError,
  brevoConfig,
  createCampaign,
  createList,
  deleteCampaign,
  importContacts,
  sendCampaignNow,
  sendTransactional,
} from "@/lib/brevo";
import { fromJakartaInput } from "@/lib/datetime";
import { renderNewsletter } from "@/lib/email-template";
import { UUID_RE } from "@/lib/media";
import { activeEmails, loadSchool } from "@/lib/newsletters";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };
export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };
export type PreviewResult =
  | { ok: true; html: string }
  | { ok: false; error: string };
export type Draft = { subject: string; preheader: string; bodyHtml: string };

const FORBIDDEN = "Hanya Super Admin yang dapat mengelola buletin.";
const NO_BREVO =
  "Brevo belum dikonfigurasi: isi BREVO_API_KEY dan BREVO_SENDER_EMAIL di environment CMS.";
const fail = (error: string): { ok: false; error: string } => ({
  ok: false,
  error,
});

async function requireSuper() {
  const staff = await getCurrentStaff();
  return staff?.role === "super_admin" ? staff : null;
}

function draftError(d: Draft): string | null {
  if (!d.subject.trim()) return "Subjek wajib diisi.";
  if (d.subject.trim().length > 150) return "Subjek maksimal 150 karakter.";
  if (d.preheader.length > 200) return "Teks pratinjau maksimal 200 karakter.";
  if (d.bodyHtml.length > 300_000) return "Isi terlalu panjang.";
  return null;
}

const hasContent = (html: string) =>
  html.replace(/<[^>]*>/g, "").trim().length > 0 || /<img\b/i.test(html);

export async function saveNewsletter(
  id: string | null,
  d: Draft,
): Promise<SaveResult> {
  if (!(await requireSuper())) return fail(FORBIDDEN);
  const bad = draftError(d);
  if (bad) return fail(bad);
  if (id && !UUID_RE.test(id)) return fail("ID tidak valid.");

  const supabase = await createClient();
  const payload = {
    subject: d.subject.trim(),
    preheader: d.preheader.trim() || null,
    body_html: d.bodyHtml,
    last_error: null,
  };

  if (!id) {
    const { data, error } = await supabase
      .from("newsletters")
      .insert(payload)
      .select("id")
      .single();
    if (error) return fail(`Gagal menyimpan: ${error.message}`);
    revalidatePath("/buletin");
    return { ok: true, id: String(data.id) };
  }

  const { data: row } = await supabase
    .from("newsletters")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!row) return fail("Buletin tidak ditemukan.");
  if (row.status !== "draft")
    return fail(
      "Buletin yang sudah dijadwalkan atau terkirim tidak dapat diubah.",
    );
  const { error } = await supabase
    .from("newsletters")
    .update(payload)
    .eq("id", id);
  if (error) return fail(`Gagal menyimpan: ${error.message}`);
  revalidatePath("/buletin");
  return { ok: true, id };
}

/** HTML pratinjau (tombol berhenti berlangganan dinonaktifkan di pratinjau). */
export async function renderPreview(d: Draft): Promise<PreviewResult> {
  if (!(await requireSuper())) return fail(FORBIDDEN);
  try {
    const school = await loadSchool(await createClient());
    return {
      ok: true,
      html: renderNewsletter({
        subject: d.subject.trim() || "(Tanpa subjek)",
        preheader: d.preheader,
        bodyHtml: d.bodyHtml,
        school,
        unsubscribeHref: "#",
      }),
    };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Pratinjau gagal dibuat.");
  }
}

export async function sendTest(d: Draft, to: string): Promise<Result> {
  if (!(await requireSuper())) return fail(FORBIDDEN);
  const cfg = brevoConfig();
  if (!cfg) return fail(NO_BREVO);
  const email = to.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return fail("Alamat email uji tidak valid.");
  const bad = draftError(d);
  if (bad) return fail(bad);

  try {
    const school = await loadSchool(await createClient());
    const html = renderNewsletter({
      subject: d.subject,
      preheader: d.preheader,
      bodyHtml: d.bodyHtml,
      school,
      unsubscribeHref: "#",
    });
    await sendTransactional(cfg, {
      to: email,
      subject: `[UJI] ${d.subject.trim()}`,
      html,
    });
    return { ok: true };
  } catch (e) {
    return fail(
      e instanceof BrevoError
        ? e.message
        : `Gagal mengirim email uji: ${e instanceof Error ? e.message : "kesalahan tidak diketahui"}`,
    );
  }
}

/**
 * Mengirim sekarang (scheduledLocal = null) atau menjadwalkan (waktu WIB, mis. "2026-11-25T08:00").
 * Alur: daftar Brevo baru → impor pelanggan aktif → buat campaign → kirim/jadwalkan.
 */
async function dispatch(
  id: string,
  scheduledLocal: string | null,
): Promise<Result> {
  if (!(await requireSuper())) return fail(FORBIDDEN);
  if (!UUID_RE.test(id)) return fail("ID tidak valid.");
  const cfg = brevoConfig();
  if (!cfg) return fail(NO_BREVO);

  let scheduledAt: string | null = null;
  if (scheduledLocal !== null) {
    scheduledAt = fromJakartaInput(scheduledLocal);
    if (!scheduledAt) return fail("Tanggal dan jam jadwal tidak valid.");
    const t = new Date(scheduledAt).getTime();
    if (t < Date.now() + 10 * 60_000)
      return fail("Jadwal harus minimal 10 menit dari sekarang.");
    if (t > Date.now() + 365 * 24 * 3600_000)
      return fail("Jadwal maksimal satu tahun ke depan.");
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) return fail("Buletin tidak ditemukan.");
  if (row.status !== "draft")
    return fail(
      "Hanya buletin berstatus Draf yang bisa dikirim atau dijadwalkan.",
    );
  if (!hasContent(String(row.body_html ?? "")))
    return fail("Isi buletin masih kosong.");

  try {
    const emails = await activeEmails(supabase);
    if (emails.length === 0) return fail("Belum ada pelanggan aktif.");

    const school = await loadSchool(supabase);
    const html = renderNewsletter({
      subject: String(row.subject),
      preheader: row.preheader,
      bodyHtml: String(row.body_html),
      school,
      unsubscribeHref: "{{ unsubscribe }}",
    });

    let listId: number | null = row.brevo_list_id
      ? Number(row.brevo_list_id)
      : null;
    if (!listId) {
      listId = await createList(
        cfg,
        `Buletin ${new Date().toISOString().slice(0, 10)} ${id.slice(0, 8)}`,
      );
      await supabase
        .from("newsletters")
        .update({ brevo_list_id: listId })
        .eq("id", id);
    }
    await importContacts(cfg, listId, emails);

    if (row.brevo_campaign_id) {
      try {
        await deleteCampaign(cfg, Number(row.brevo_campaign_id)); // sisa percobaan sebelumnya
      } catch {
        // abaikan
      }
    }
    const campaignId = await createCampaign(cfg, {
      name: `Buletin: ${row.subject}`.slice(0, 120),
      subject: String(row.subject),
      html,
      listId,
      scheduledAt: scheduledAt ?? undefined,
    });
    await supabase
      .from("newsletters")
      .update({ brevo_campaign_id: campaignId })
      .eq("id", id);
    if (!scheduledAt) await sendCampaignNow(cfg, campaignId);

    const { error } = await supabase
      .from("newsletters")
      .update({
        status: scheduledAt ? "scheduled" : "sent",
        scheduled_at: scheduledAt,
        sent_at: scheduledAt ? null : new Date().toISOString(),
        recipient_count: emails.length,
        last_error: null,
      })
      .eq("id", id);
    if (error)
      return fail(
        `Sudah diserahkan ke Brevo, tetapi status gagal disimpan: ${error.message}`,
      );
  } catch (e) {
    const msg =
      e instanceof BrevoError
        ? e.message
        : `Gagal memproses: ${e instanceof Error ? e.message : "kesalahan tidak diketahui"}`;
    await supabase.from("newsletters").update({ last_error: msg }).eq("id", id);
    return fail(msg);
  }

  revalidatePath("/buletin");
  revalidatePath(`/buletin/${id}`);
  return { ok: true };
}

export const sendNow = async (id: string) => dispatch(id, null);
export const scheduleNewsletter = async (id: string, local: string) =>
  dispatch(id, local);

export async function cancelSchedule(id: string): Promise<Result> {
  if (!(await requireSuper())) return fail(FORBIDDEN);
  if (!UUID_RE.test(id)) return fail("ID tidak valid.");
  const cfg = brevoConfig();
  if (!cfg) return fail(NO_BREVO);

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("newsletters")
    .select("status, brevo_campaign_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) return fail("Buletin tidak ditemukan.");
  if (row.status !== "scheduled")
    return fail("Hanya buletin terjadwal yang bisa dibatalkan.");

  try {
    if (row.brevo_campaign_id)
      await deleteCampaign(cfg, Number(row.brevo_campaign_id));
  } catch (e) {
    return fail(
      e instanceof BrevoError ? e.message : "Gagal membatalkan di Brevo.",
    );
  }
  const { error } = await supabase
    .from("newsletters")
    .update({
      status: "draft",
      scheduled_at: null,
      brevo_campaign_id: null,
      last_error: null,
    })
    .eq("id", id);
  if (error) return fail(`Gagal menyimpan: ${error.message}`);
  revalidatePath("/buletin");
  revalidatePath(`/buletin/${id}`);
  return { ok: true };
}

export async function deleteNewsletter(
  id: string,
): Promise<{ error: string } | void> {
  if (!(await requireSuper())) return { error: FORBIDDEN };
  if (!UUID_RE.test(id)) return { error: "ID tidak valid." };
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("newsletters")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { error: "Buletin tidak ditemukan." };
  if (row.status === "scheduled")
    return { error: "Batalkan jadwal terlebih dulu sebelum menghapus." };

  const { error } = await supabase.from("newsletters").delete().eq("id", id);
  if (error) return { error: `Gagal menghapus: ${error.message}` };
  revalidatePath("/buletin");
  redirect("/buletin");
}
