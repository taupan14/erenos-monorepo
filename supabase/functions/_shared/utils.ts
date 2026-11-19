// Helper bersama untuk Edge Functions publik.

export type Cors = Record<string, string>;

export type Lang = "id" | "en";
/** Bahasa pesan galat dari field `locale` di body; default Indonesia. */
export const localeOf = (v: unknown): Lang => (v === "en" ? "en" : "id");

export function json(body: unknown, status: number, cors: Cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Ambil string ter-trim dari nilai tak dikenal; selain string menjadi "". */
export const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function clientIp(req: Request) {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ""
  );
}

/** Hash IP + salt; null bila IP tidak diketahui. IP mentah tidak pernah disimpan. */
export async function hashedIp(req: Request) {
  const ip = clientIp(req);
  return ip
    ? await sha256(`${Deno.env.get("IP_HASH_SALT") ?? ""}:${ip}`)
    : null;
}

/** Parse body JSON berbentuk objek; null bila tidak valid. */
export function parseObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}
