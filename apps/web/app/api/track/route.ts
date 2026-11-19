import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/track — mencatat satu kunjungan halaman (dipanggil PageViewTracker).
 * Tidak menyimpan IP mentah: hanya hash harian. Kota/negara dari header geo Vercel.
 * Kegagalan apa pun dijawab 204 supaya tidak mengganggu pengunjung.
 */
const BOT =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|curl|wget|python-requests|axios|node-fetch|go-http/i;

function deviceFrom(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

function geoHeader(req: Request, name: string, max: number): string | null {
  const raw = req.headers.get(name);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).slice(0, max) || null;
  } catch {
    return raw.slice(0, max) || null;
  }
}

const done = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return done();

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return done();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return done();

  let body: { path?: unknown };
  try {
    body = (await req.json()) as { path?: unknown };
  } catch {
    return new Response(null, { status: 400 });
  }

  const path =
    typeof body.path === "string" ? (body.path.split(/[?#]/)[0] ?? "") : "";
  if (!path.startsWith("/") || path.length > 200 || path.startsWith("/api")) {
    return done();
  }
  const first = path.split("/")[1];
  const locale = first === "id" || first === "en" ? first : null;

  const salt = process.env.IP_HASH_SALT;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "";
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const visitor_hash =
    salt && ip
      ? createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("hex")
      : null;

  const country = geoHeader(req, "x-vercel-ip-country", 2)?.toUpperCase() ?? null;

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("page_views").insert({
    path,
    locale,
    device: deviceFrom(ua),
    country,
    city: geoHeader(req, "x-vercel-ip-city", 100),
    visitor_hash,
  });
  if (error) console.error("track: gagal menyimpan page_view", error.message);

  return done();
}
