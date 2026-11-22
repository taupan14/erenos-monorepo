import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/hit — mencatat satu kunjungan halaman (dipanggil PageViewTracker).
 * Tidak menyimpan IP mentah: hanya hash harian. Kota/negara dari header geo Vercel.
 * Selalu menjawab 204 agar pengunjung tidak terganggu; hasilnya ada di header `x-track`
 * (lihat tab Network): ok | skip-origin | skip-bot | skip-path | error-env | error-insert.
 * Nama rute sengaja netral: kata "track" sering diblokir ekstensi pemblokir iklan.
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

const done = (outcome: string, status = 204) =>
  new Response(null, {
    status,
    headers: { "x-track": outcome, "Cache-Control": "no-store" },
  });

export async function POST(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return done("skip-origin");

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return done("skip-bot");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "[hit] NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diatur; kunjungan tidak dicatat.",
    );
    return done("error-env");
  }

  let body: { path?: unknown };
  try {
    body = (await req.json()) as { path?: unknown };
  } catch {
    return done("bad-json", 400);
  }

  const path =
    typeof body.path === "string" ? (body.path.split(/[?#]/)[0] ?? "") : "";
  if (!path.startsWith("/") || path.length > 200 || path.startsWith("/api")) {
    return done("skip-path");
  }
  const first = path.split("/")[1];
  const locale = first === "id" || first === "en" ? first : null;

  const salt = process.env.IP_HASH_SALT;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "";
  const day = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });
  // Di localhost tidak ada header IP: tetap dihash (semua kunjungan lokal dianggap satu pengunjung)
  const visitor_hash = salt
    ? createHash("sha256")
        .update(`${salt}|${day}|${ip || "unknown"}|${ua}`)
        .digest("hex")
    : null;

  const country =
    geoHeader(req, "x-vercel-ip-country", 2)?.toUpperCase() ?? null;

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from("page_views").insert({
    path,
    locale,
    device: deviceFrom(ua),
    country,
    city: geoHeader(req, "x-vercel-ip-city", 100),
    visitor_hash,
  });
  if (error) {
    console.error("[hit] gagal menyimpan page_view:", error.message);
    return done("error-insert");
  }

  return done("ok");
}
