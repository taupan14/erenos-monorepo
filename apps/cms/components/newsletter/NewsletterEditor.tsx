"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  cancelSchedule,
  deleteNewsletter,
  renderPreview,
  saveNewsletter,
  scheduleNewsletter,
  sendNow,
  sendTest,
} from "@/app/(admin)/buletin/actions";
import { RichEditor } from "@/components/editor/RichEditor";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";
import type { CampaignStats } from "@/lib/brevo";
import { STATUS_LABEL, STATUS_PILL } from "@/lib/newsletters";

export type NewsletterData = {
  id: string | null;
  subject: string;
  preheader: string;
  body_html: string;
  status: string;
  scheduled_local: string; // nilai datetime-local (WIB)
  scheduled_label: string;
  sent_label: string;
  recipient_count: number | null;
  last_error: string | null;
};

type Props = {
  data: NewsletterData;
  activeCount: number;
  staffEmail: string;
  brevoReady: boolean;
  stats: CampaignStats | null;
};

export function NewsletterEditor({
  data,
  activeCount,
  staffEmail,
  brevoReady,
  stats,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [subject, setSubject] = useState(data.subject);
  const [preheader, setPreheader] = useState(data.preheader);
  const [html, setHtml] = useState(data.body_html);
  const [testTo, setTestTo] = useState(staffEmail);
  const [when, setWhen] = useState(data.scheduled_local);
  const [preview, setPreview] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(
    data.last_error ? { ok: false, text: data.last_error } : null,
  );
  const editable = data.status === "draft";
  const say = (ok: boolean, text: string) => setMsg({ ok, text });

  // Pratinjau diperbarui 0,7 detik setelah Anda berhenti mengetik
  useEffect(() => {
    const t = setTimeout(async () => {
      const r = await renderPreview({ subject, preheader, bodyHtml: html });
      if (r.ok) {
        setPreview(r.html);
        setPreviewError(null);
      } else setPreviewError(r.error);
    }, 700);
    return () => clearTimeout(t);
  }, [subject, preheader, html]);

  const draft = { subject, preheader, bodyHtml: html };
  const save = async (): Promise<string | null> => {
    const r = await saveNewsletter(data.id, draft);
    if (!r.ok) {
      say(false, r.error);
      return null;
    }
    return r.id;
  };
  const goTo = (id: string) => {
    if (!data.id) router.replace(`/buletin/${id}`);
    else router.refresh();
  };

  const onSave = () =>
    start(async () => {
      const id = await save();
      if (!id) return;
      say(true, "Draf tersimpan.");
      goTo(id);
    });

  const onTest = () =>
    start(async () => {
      const r = await sendTest(draft, testTo);
      say(
        r.ok,
        r.ok
          ? `Email uji dikirim ke ${testTo}. (Tombol berhenti berlangganan hanya aktif pada pengiriman sebenarnya.)`
          : r.error,
      );
    });

  const onSendNow = () => {
    if (
      !window.confirm(
        `Kirim buletin ini ke ${activeCount} pelanggan aktif sekarang? Pengiriman tidak dapat dibatalkan.`,
      )
    )
      return;
    start(async () => {
      const id = await save();
      if (!id) return;
      const r = await sendNow(id);
      if (!r.ok) return say(false, r.error);
      say(true, "Buletin diserahkan ke Brevo untuk dikirim.");
      goTo(id);
      router.refresh();
    });
  };

  const onSchedule = () => {
    if (!when) return say(false, "Pilih tanggal dan jam pengiriman.");
    if (
      !window.confirm(
        `Jadwalkan pengiriman ke ${activeCount} pelanggan aktif pada ${when.replace("T", " ")} WIB?`,
      )
    )
      return;
    start(async () => {
      const id = await save();
      if (!id) return;
      const r = await scheduleNewsletter(id, when);
      if (!r.ok) return say(false, r.error);
      say(true, "Buletin dijadwalkan.");
      goTo(id);
      router.refresh();
    });
  };

  const onCancel = () => {
    if (
      !data.id ||
      !window.confirm(
        "Batalkan jadwal pengiriman? Buletin kembali menjadi draf.",
      )
    )
      return;
    start(async () => {
      const r = await cancelSchedule(data.id as string);
      say(r.ok, r.ok ? "Jadwal dibatalkan." : r.error);
      if (r.ok) router.refresh();
    });
  };

  const onDelete = () => {
    if (!data.id || !window.confirm("Hapus buletin ini secara permanen?"))
      return;
    start(async () => {
      const r = await deleteNewsletter(data.id as string);
      if (r?.error) say(false, r.error);
    });
  };

  const statItems: [string, number | undefined][] = stats
    ? [
        ["Terkirim", stats.sent],
        ["Sampai", stats.delivered],
        ["Dibuka", stats.opened],
        ["Klik", stats.clicks],
        ["Berhenti", stats.unsubscribed],
        ["Gagal sampai", stats.bounced],
      ]
    : [];

  return (
    <div>
      {!brevoReady && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-accent bg-white p-4 text-sm"
        >
          Brevo belum dikonfigurasi. Isi <code>BREVO_API_KEY</code> dan{" "}
          <code>BREVO_SENDER_EMAIL</code> di environment CMS agar email uji,
          pengiriman, dan penjadwalan aktif. Anda tetap dapat menulis dan
          melihat pratinjau.
        </p>
      )}

      <p
        role="status"
        aria-live="polite"
        className={`mb-4 min-h-5 text-sm ${msg?.ok ? "text-green-700" : "text-red-700"}`}
      >
        {msg?.text}
      </p>

      <div className="flex flex-col items-start gap-4 xl:flex-row">
        <div className="w-full space-y-4 xl:flex-1">
          {editable ? (
            <div className={`${CARD} space-y-5`}>
              <div>
                <label htmlFor="nl-subject" className="text-sm font-medium">
                  Subjek email <span className="text-red-700">*</span>
                </label>
                <input
                  id="nl-subject"
                  value={subject}
                  maxLength={150}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`${INPUT} mt-1`}
                />
                <p className="mt-1 text-xs text-muted">{subject.length}/150</p>
              </div>
              <div>
                <label htmlFor="nl-pre" className="text-sm font-medium">
                  Teks pratinjau (opsional)
                </label>
                <input
                  id="nl-pre"
                  value={preheader}
                  maxLength={200}
                  onChange={(e) => setPreheader(e.target.value)}
                  className={`${INPUT} mt-1`}
                />
                <p className="mt-1 text-xs text-muted">
                  Kalimat singkat yang tampil di samping subjek di kotak masuk.
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">Isi email</p>
                <RichEditor
                  name="body_html"
                  initialHtml={data.body_html}
                  onChange={setHtml}
                />
                <p className="mt-1 text-xs text-muted">
                  Header sekolah (logo, nama, alamat, telepon) dan tombol{" "}
                  <b>Berhenti berlangganan</b> ditambahkan otomatis di template;
                  tidak perlu ditulis di sini.
                </p>
              </div>
            </div>
          ) : (
            <div className={`${CARD} space-y-2 text-sm`}>
              <p className="font-serif text-xl font-semibold text-deep">
                {data.subject}
              </p>
              <p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[data.status] ?? ""}`}
                >
                  {STATUS_LABEL[data.status] ?? data.status}
                </span>
              </p>
              {data.status === "scheduled" && (
                <p>
                  Dikirim pada <b>{data.scheduled_label}</b> ke{" "}
                  {data.recipient_count ?? "–"} pelanggan.
                </p>
              )}
              {data.status !== "scheduled" && (
                <p>
                  Dikirim pada <b>{data.sent_label}</b> ke{" "}
                  {data.recipient_count ?? "–"} pelanggan.
                </p>
              )}
              {data.status === "scheduled" && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={onCancel}
                  className={BTN_OUTLINE}
                >
                  Batalkan jadwal
                </button>
              )}
              {statItems.length > 0 && (
                <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3 sm:grid-cols-6">
                  {statItems.map(([l, v]) => (
                    <div key={l} className="flex flex-col-reverse">
                      <dt className="text-xs text-muted">{l}</dt>
                      <dd className="font-serif text-xl font-semibold text-deep">
                        {v ?? "–"}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          )}

          {editable && (
            <div className={`${CARD} space-y-5`}>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={pending}
                  onClick={onSave}
                  className={BTN_OUTLINE}
                >
                  {pending ? "Memproses…" : "Simpan draf"}
                </button>
                {data.id && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={onDelete}
                    className="px-2 text-sm font-semibold text-red-700 underline disabled:opacity-60"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className="border-t border-line pt-4">
                <label htmlFor="nl-test" className="text-sm font-medium">
                  Kirim email uji
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  <input
                    id="nl-test"
                    type="email"
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    className={`${INPUT} min-w-60 flex-1`}
                  />
                  <button
                    type="button"
                    disabled={pending || !brevoReady}
                    onClick={onTest}
                    className={BTN_OUTLINE}
                  >
                    Kirim uji
                  </button>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <p className="text-sm font-medium">Kirim ke pelanggan</p>
                <p className="mt-1 text-xs text-muted">
                  Penerima: {activeCount.toLocaleString("id-ID")} pelanggan
                  aktif.
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <button
                    type="button"
                    disabled={pending || !brevoReady || activeCount === 0}
                    onClick={onSendNow}
                    className={BTN_PRIMARY}
                  >
                    Kirim sekarang
                  </button>
                  <div>
                    <label
                      htmlFor="nl-when"
                      className="text-xs font-medium text-muted"
                    >
                      Atau jadwalkan (WIB)
                    </label>
                    <input
                      id="nl-when"
                      type="datetime-local"
                      value={when}
                      onChange={(e) => setWhen(e.target.value)}
                      className={`${INPUT} mt-1 !w-auto`}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={pending || !brevoReady || activeCount === 0}
                    onClick={onSchedule}
                    className={BTN_OUTLINE}
                  >
                    Jadwalkan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full xl:sticky xl:top-24 xl:w-[560px] xl:shrink-0">
          <div className={CARD}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Pratinjau</h2>
              <div
                className="flex gap-1"
                role="group"
                aria-label="Lebar pratinjau"
              >
                <button
                  type="button"
                  aria-pressed={!mobile}
                  onClick={() => setMobile(false)}
                  className={`${BTN_OUTLINE} !h-8 !px-3 ${!mobile ? "!border-primary !text-primary" : ""}`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  aria-pressed={mobile}
                  onClick={() => setMobile(true)}
                  className={`${BTN_OUTLINE} !h-8 !px-3 ${mobile ? "!border-primary !text-primary" : ""}`}
                >
                  HP
                </button>
              </div>
            </div>
            {previewError && (
              <p className="mb-2 text-sm text-red-700">{previewError}</p>
            )}
            <iframe
              title="Pratinjau email"
              srcDoc={preview}
              sandbox=""
              className="mx-auto block h-[720px] w-full rounded-xl border border-line bg-white"
              style={{ maxWidth: mobile ? 375 : "100%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
