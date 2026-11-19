// Edge Function: submit-inquiry
// Menerima form pertanyaan admisi/kontak dari website publik, memvalidasi,
// membatasi spam (honeypot + batas per IP), menyimpan ke tabel `inquiries`
// (service role), lalu mengirim notifikasi email lewat Resend (opsional).
//
// Secret yang dibutuhkan (supabase secrets set ...):
//   ALLOWED_ORIGINS      daftar origin website, dipisah koma
//   IP_HASH_SALT         string acak untuk meng-hash IP (jangan menyimpan IP mentah)
//   RESEND_API_KEY       (opsional) kunci API Resend
//   INQUIRY_FROM_EMAIL   (opsional) pengirim, mis. "Erenos <info@erenos.sch.id>"
//   INQUIRY_NOTIFY_TO    (opsional) penerima notifikasi, dipisah koma
// SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY tersedia otomatis di runtime.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsFor } from "../_shared/cors.ts";
import {
  hashedIp,
  json,
  localeOf,
  parseObject,
  str,
  type Lang,
} from "../_shared/utils.ts";

const LEVELS = ["kb_tk", "sd", "smp", "sma"] as const;
const SOURCES = ["admission", "contact"] as const;
const MAX_BODY_BYTES = 10_000;
const RATE_LIMIT_PER_HOUR = 5;

const MSG: Record<Lang, Record<string, string>> = {
  id: {
    parent_name: "Nama wajib diisi (2–120 karakter).",
    email: "Format email tidak valid.",
    phone: "Nomor telepon tidak valid.",
    contact: "Isi email atau nomor telepon/WhatsApp.",
    student_name: "Nama siswa terlalu panjang.",
    message: "Pesan wajib diisi (5–4000 karakter).",
    interested_level: "Jenjang tidak dikenal.",
    source: "Sumber tidak valid.",
  },
  en: {
    parent_name: "Please enter your name (2–120 characters).",
    email: "Invalid email format.",
    phone: "Invalid phone number.",
    contact: "Please provide an email or phone/WhatsApp number.",
    student_name: "The student's name is too long.",
    message: "Please enter a message (5–4000 characters).",
    interested_level: "Unknown level.",
    source: "Invalid source.",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d\s-]{8,20}$/;

type Fields = Record<string, string>;

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function validate(input: Record<string, unknown>, lang: Lang) {
  const M = MSG[lang];
  const errors: Fields = {};
  const parent_name = str(input.parent_name);
  const email = str(input.email);
  const phone = str(input.phone);
  const student_name = str(input.student_name);
  const message = str(input.message);
  const level = str(input.interested_level);
  const source = str(input.source) || "admission";

  if (parent_name.length < 2 || parent_name.length > 120) {
    errors.parent_name = M.parent_name;
  }
  if (email && (email.length > 254 || !EMAIL_RE.test(email))) {
    errors.email = M.email;
  }
  if (phone && !PHONE_RE.test(phone)) {
    errors.phone = M.phone;
  }
  if (!email && !phone) {
    errors.contact = M.contact;
  }
  if (student_name.length > 120) errors.student_name = M.student_name;
  if (message.length < 5 || message.length > 4000) {
    errors.message = M.message;
  }
  if (level && !(LEVELS as readonly string[]).includes(level)) {
    errors.interested_level = M.interested_level;
  }
  if (!(SOURCES as readonly string[]).includes(source))
    errors.source = M.source;

  return {
    errors,
    row: {
      source,
      parent_name,
      email: email || null,
      phone: phone || null,
      student_name: student_name || null,
      interested_level: level || null,
      message,
    },
  };
}

async function notify(row: ReturnType<typeof validate>["row"]) {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("INQUIRY_FROM_EMAIL");
  const to = (Deno.env.get("INQUIRY_NOTIFY_TO") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!key || !from || to.length === 0) return;

  const line = (label: string, value: string | null) =>
    value ? `<p><b>${label}:</b> ${escapeHtml(value)}</p>` : "";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(5000),
    body: JSON.stringify({
      from,
      to,
      reply_to: row.email ?? undefined,
      subject: `Pertanyaan baru (${row.source === "admission" ? "Admisi" : "Kontak"}) dari ${row.parent_name}`,
      html:
        line("Nama", row.parent_name) +
        line("Email", row.email) +
        line("Telepon/WA", row.phone) +
        line("Nama siswa", row.student_name) +
        line("Jenjang", row.interested_level) +
        `<p><b>Pesan:</b></p><p style="white-space:pre-wrap">${escapeHtml(row.message)}</p>`,
    }),
  });
  if (!res.ok) console.error("Resend gagal:", res.status, await res.text());
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (cors === null)
    return new Response("Origin tidak diizinkan", { status: 403 });
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST")
    return json({ error: "method_not_allowed" }, 405, cors);

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES)
    return json({ error: "payload_too_large" }, 413, cors);

  const input = parseObject(raw);
  if (!input) return json({ error: "invalid_json" }, 400, cors);

  // Honeypot: field "website" disembunyikan di form; bot biasanya mengisinya.
  // Balas sukses agar bot tidak tahu, tapi jangan simpan apa pun.
  if (str(input.website)) return json({ ok: true }, 200, cors);

  const { errors, row } = validate(input, localeOf(input.locale));
  if (Object.keys(errors).length > 0)
    return json({ error: "validation", fields: errors }, 422, cors);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // IP di-hash dengan salt; dipakai hanya untuk pembatasan laju
  const ip_hash = await hashedIp(req);

  if (ip_hash) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ip_hash)
      .gte("created_at", since);
    if (error) console.error("Cek batas laju gagal:", error.message);
    if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return json({ error: "rate_limited" }, 429, {
        ...cors,
        "Retry-After": "3600",
      });
    }
  }

  const { error: insertError } = await supabase
    .from("inquiries")
    .insert({ ...row, ip_hash });
  if (insertError) {
    console.error("Simpan inquiry gagal:", insertError.message);
    return json({ error: "server_error" }, 500, cors);
  }

  // Kegagalan email tidak boleh membatalkan inquiry yang sudah tersimpan
  try {
    await notify(row);
  } catch (e) {
    console.error("Notifikasi email gagal:", e);
  }

  return json({ ok: true }, 200, cors);
});
