/** Nomor WhatsApp apa adanya (0812…, +62 812…) → tautan wa.me; null bila tidak valid. */
export function whatsappUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  return digits.length >= 8 && digits.length <= 15
    ? `https://wa.me/${digits}`
    : null;
}

/**
 * URL embed peta. Menerima URL embed langsung atau kode <iframe> yang ditempel dari Google Maps.
 * Hanya domain Google Maps yang diizinkan; selain itu null (tampilkan placeholder).
 */
export function mapsEmbedSrc(input: string | null | undefined): string | null {
  if (!input) return null;
  const fromIframe = /src\s*=\s*["']([^"']+)["']/i.exec(input)?.[1];
  const url = (fromIframe ?? input).trim();
  return /^https:\/\/(www\.google\.com\/maps\/embed|maps\.google\.com\/maps)/i.test(
    url,
  )
    ? url
    : null;
}
