/**
 * Memicu website publik membuang cache (POST {WEB_URL}/api/revalidate).
 * Tanpa `paths`, seluruh situs direvalidasi. Tidak pernah melempar galat:
 * kegagalan hanya berarti website baru berubah setelah ISR 5 menit.
 */
export async function revalidateWeb(paths?: string[]): Promise<{ ok: boolean }> {
  const base = process.env.WEB_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return { ok: false };
  try {
    const res = await fetch(new URL("/api/revalidate", base), {
      method: "POST",
      headers: { "content-type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify(paths?.length ? { paths } : {}),
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
