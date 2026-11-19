import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";

/**
 * POST /api/revalidate — dipanggil CMS setelah konten diterbitkan/diubah.
 * Header: x-revalidate-secret: <REVALIDATE_SECRET>
 * Body (opsional): { "paths": ["/", "/berita"] }. Tanpa body, seluruh situs direvalidasi.
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "not_configured" }, { status: 503 });
  }

  const given = Buffer.from(req.headers.get("x-revalidate-secret") ?? "");
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let paths: string[] = [];
  try {
    const body = (await req.json()) as { paths?: unknown };
    if (Array.isArray(body.paths)) {
      paths = body.paths
        .filter(
          (p): p is string =>
            typeof p === "string" && p.startsWith("/") && p.length <= 200,
        )
        .slice(0, 20);
    }
  } catch {
    // tanpa body = revalidasi seluruh situs
  }

  if (paths.length === 0) {
    revalidatePath("/", "layout");
    return Response.json({ revalidated: ["/ (seluruh situs)"] });
  }
  paths.forEach((p) => revalidatePath(p));
  return Response.json({ revalidated: paths });
}
