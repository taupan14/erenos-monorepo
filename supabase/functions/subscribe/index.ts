// Edge Function: subscribe
// Pendaftaran buletin dari footer website. Validasi, honeypot, batas laju per IP,
// lalu simpan ke tabel `subscribers` (service role).
// Respons selalu { ok: true } bila email valid — baik email baru, sudah terdaftar,
// atau berlangganan ulang — agar tidak membocorkan siapa saja yang sudah terdaftar.
//
// Secret: ALLOWED_ORIGINS, IP_HASH_SALT (SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY otomatis).

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsFor } from "../_shared/cors.ts";
import {
  hashedIp,
  json,
  localeOf,
  parseObject,
  str,
} from "../_shared/utils.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 2_000;
const RATE_LIMIT_PER_HOUR = 5;

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

  // Honeypot: bot mengisi field tersembunyi "website"
  if (str(input.website)) return json({ ok: true }, 200, cors);

  const email = str(input.email).toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    const msg =
      localeOf(input.locale) === "en"
        ? "Invalid email format."
        : "Format email tidak valid.";
    return json({ error: "validation", fields: { email: msg } }, 422, cors);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const ip_hash = await hashedIp(req);

  if (ip_hash) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("subscribers")
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

  const { data: existing, error: findError } = await supabase
    .from("subscribers")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();
  if (findError) {
    console.error("Cari pelanggan gagal:", findError.message);
    return json({ error: "server_error" }, 500, cors);
  }

  if (!existing) {
    const { error } = await supabase
      .from("subscribers")
      .insert({ email, ip_hash });
    // 23505 = balapan dengan permintaan lain untuk email yang sama: anggap sukses
    if (error && error.code !== "23505") {
      console.error("Simpan pelanggan gagal:", error.message);
      return json({ error: "server_error" }, 500, cors);
    }
  } else if (existing.status === "unsubscribed") {
    const { error } = await supabase
      .from("subscribers")
      .update({
        status: "active",
        unsubscribed_at: null,
        subscribed_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) {
      console.error("Aktifkan ulang pelanggan gagal:", error.message);
      return json({ error: "server_error" }, 500, cors);
    }
  }

  return json({ ok: true }, 200, cors);
});
