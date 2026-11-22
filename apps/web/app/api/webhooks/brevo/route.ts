import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/webhooks/brevo?token=<BREVO_WEBHOOK_SECRET>
 * Dipanggil Brevo saat pelanggan berhenti berlangganan, melapor spam, atau email tidak dapat dikirim.
 * Pelanggan terkait ditandai "unsubscribed" di database agar tidak ikut buletin berikutnya.
 * Selalu menjawab 200 untuk event yang diabaikan (Brevo mengulang bila menerima galat).
 */
const STOP = new Set([
  "unsubscribe",
  "unsubscribed",
  "spam",
  "complaint",
  "hardbounce",
  "blocked",
  "invalidemail",
]);

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(req: Request) {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !key)
    return Response.json({ error: "not_configured" }, { status: 503 });

  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!safeEqual(token, secret))
    return Response.json({ error: "unauthorized" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const events = Array.isArray(payload) ? payload : [payload];
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  let updated = 0;

  for (const ev of events.slice(0, 100)) {
    if (!ev || typeof ev !== "object") continue;
    const o = ev as Record<string, unknown>;
    const event = String(o.event ?? "")
      .toLowerCase()
      .replace(/[_\-\s]/g, "");
    const email = typeof o.email === "string" ? o.email.trim() : "";
    if (!STOP.has(event) || !email || email.length > 254) continue;

    const { data, error } = await supabase.rpc("unsubscribe_by_email", {
      p_email: email,
    });
    if (error) {
      console.error("[brevo-webhook]", error.message);
      return Response.json({ error: "db_error" }, { status: 500 });
    }
    updated += Number(data) || 0;
  }

  return Response.json({ ok: true, updated });
}
