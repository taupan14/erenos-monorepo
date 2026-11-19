import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** GET /pelanggan/export?status=active|all — unduh CSV pelanggan (hanya Super Admin). */
export async function GET(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "super_admin")
    return new Response("Forbidden", { status: 403 });

  const onlyActive = new URL(req.url).searchParams.get("status") !== "all";
  const base = (process.env.WEB_URL ?? "").replace(/\/$/, "");
  const supabase = await createClient();

  const rows: Record<string, unknown>[] = [];
  for (let from = 0; from < 20_000; from += 1000) {
    let q = supabase
      .from("subscribers")
      .select(
        "email, status, subscribed_at, unsubscribed_at, unsubscribe_token",
      )
      .order("subscribed_at", { ascending: true })
      .range(from, from + 999);
    if (onlyActive) q = q.eq("status", "active");
    const { data, error } = await q;
    if (error)
      return new Response(`Gagal mengekspor: ${error.message}`, {
        status: 500,
      });
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < 1000) break;
  }

  // Cegah injeksi rumus di Excel/Sheets; lalu kutip bila perlu
  const cell = (v: unknown) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = [
    "email",
    "status",
    "subscribed_at",
    "unsubscribed_at",
    "unsubscribe_url",
  ];
  const lines = rows.map((r) =>
    [
      r.email,
      r.status,
      r.subscribed_at,
      r.unsubscribed_at,
      base && r.unsubscribe_token
        ? `${base}/id/berhenti-berlangganan?token=${r.unsubscribe_token}`
        : "",
    ]
      .map(cell)
      .join(","),
  );

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return new Response("\uFEFF" + [header.join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pelanggan-${onlyActive ? "aktif" : "semua"}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
