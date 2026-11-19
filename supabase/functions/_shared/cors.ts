// Utilitas CORS bersama untuk Edge Functions.
// Origin yang diizinkan diatur lewat secret ALLOWED_ORIGINS (pisahkan dengan koma),
// contoh: https://erenos.sch.id,https://www.erenos.sch.id,http://localhost:3000

export function allowedOrigins(): string[] {
  return (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Header CORS untuk origin yang diizinkan; null bila origin ditolak. */
export function corsFor(req: Request): Record<string, string> | null {
  const origin = req.headers.get("origin");
  // Request tanpa Origin (curl/server-to-server) tidak membutuhkan header CORS
  if (!origin) return {};
  if (!allowedOrigins().includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
