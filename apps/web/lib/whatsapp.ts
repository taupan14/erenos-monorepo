/**
 * Nomor WhatsApp → tautan wa.me (membuka WhatsApp Web/aplikasi desktop di komputer, aplikasi di HP).
 * Menerima format bebas: "+62 812-3456-789", "0812 3456 789", atau "62812…".
 * Awalan "0" dianggap nomor nasional Indonesia dan diganti "62". Mengembalikan null bila tidak valid.
 */
export function whatsappHref(
  raw: string | null | undefined,
  text?: string,
): string | null {
  if (!raw) return null;
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = `62${n.slice(1)}`;
  if (n.length < 9 || n.length > 15) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
