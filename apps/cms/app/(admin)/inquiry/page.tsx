import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  InquiryDetail,
  type InquiryFull,
} from "@/components/inquiry/InquiryDetail";
import { BTN_OUTLINE, CARD, INPUT, PageHead } from "@/components/ui/form";
import { getCurrentStaff } from "@/lib/auth";
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABEL,
  STATUS_PILL,
  cleanTerm,
  levelShort,
  type InquiryStatus,
} from "@/lib/inquiry";
import { UUID_RE } from "@/lib/media";
import { shortDate } from "@/lib/month";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inquiry" };

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    halaman?: string;
    id?: string;
  }>;
};

type Row = {
  id: string;
  source: string;
  parent_name: string;
  interested_level: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
};

export default async function InquiryPage({ searchParams }: Props) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");
  if (staff.role !== "super_admin") redirect("/");

  const sp = await searchParams;
  const status = (INQUIRY_STATUSES as readonly string[]).includes(
    sp.status ?? "",
  )
    ? (sp.status as string)
    : "";
  const term = cleanTerm(sp.q);
  const page = Math.max(1, Math.floor(Number(sp.halaman)) || 1);
  const selectedId = sp.id && UUID_RE.test(sp.id) ? sp.id : "";

  const supabase = await createClient();
  let query = supabase
    .from("inquiries")
    .select(
      "id, source, parent_name, interested_level, message, status, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status) query = query.eq("status", status);
  if (term)
    query = query.or(
      `parent_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
    );

  const [{ data, count, error }, newCount, selected] = await Promise.all([
    query,
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    selectedId
      ? supabase
          .from("inquiries")
          .select("*")
          .eq("id", selectedId)
          .maybeSingle()
      : null,
  ]);

  const rows = (data ?? []) as unknown as Row[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (over: Record<string, string>, hash = "") => {
    const p = new URLSearchParams();
    const all = { status, q: term, halaman: "", id: selectedId, ...over };
    Object.entries(all).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return `/inquiry${s ? `?${s}` : ""}${hash}`;
  };
  const tabs: { id: string; label: string }[] = [
    { id: "", label: "Semua" },
    ...INQUIRY_STATUSES.map((s) => ({ id: s, label: INQUIRY_STATUS_LABEL[s] })),
  ];

  return (
    <>
      <PageHead
        title="Inquiry"
        subtitle="Pertanyaan dari formulir admisi dan kontak."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter status" className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={href({ status: t.id, halaman: "", id: "" })}
              aria-current={status === t.id ? "page" : undefined}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${status === t.id ? "bg-white text-primary shadow-sm" : "text-muted hover:bg-white/60"}`}
            >
              {t.label}
              {t.id === "new" && (newCount.count ?? 0) > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                  {newCount.count}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <form action="/inquiry" className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={term}
            placeholder="Cari nama, email, telepon…"
            aria-label="Cari inquiry"
            className={`${INPUT} w-64`}
          />
          <button className={BTN_OUTLINE}>Cari</button>
        </form>
      </div>

      <div className="flex flex-col items-start gap-4 lg:flex-row">
        <div className="w-full min-w-0 lg:flex-[2]">
          {error ? (
            <p className="text-sm text-red-700">
              Gagal memuat inquiry: {error.message}
            </p>
          ) : rows.length === 0 ? (
            <div className={`${CARD} text-sm text-muted`}>
              Belum ada inquiry yang cocok.
            </div>
          ) : (
            <ul className={`${CARD} divide-y divide-line py-1`}>
              {rows.map((r) => (
                <li key={r.id}>
                  <Link
                    href={href({ id: r.id }, "#detail")}
                    aria-current={r.id === selectedId ? "true" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-2 py-3 text-sm hover:bg-soft ${r.id === selectedId ? "bg-soft" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <span
                        className={`block truncate ${r.status === "new" ? "font-bold" : "font-semibold"}`}
                      >
                        {r.parent_name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {r.message}
                      </span>
                    </div>
                    <span className="hidden w-14 text-xs text-muted sm:block">
                      {levelShort(r.interested_level)}
                    </span>
                    <span className="hidden w-14 text-right text-xs text-muted sm:block">
                      {shortDate(r.created_at)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[r.status] ?? ""}`}
                    >
                      {INQUIRY_STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <nav
              aria-label="Halaman"
              className="mt-5 flex items-center justify-center gap-3 text-sm"
            >
              {page > 1 && (
                <Link
                  href={href({ halaman: String(page - 1) })}
                  className={BTN_OUTLINE}
                >
                  ← Sebelumnya
                </Link>
              )}
              <span className="text-muted">
                Halaman {page} dari {pages}
              </span>
              {page < pages && (
                <Link
                  href={href({ halaman: String(page + 1) })}
                  className={BTN_OUTLINE}
                >
                  Berikutnya →
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="w-full lg:sticky lg:top-24 lg:flex-1 lg:min-w-[340px]">
          {selected?.data ? (
            <InquiryDetail
              key={String(selected.data.id)}
              item={selected.data as unknown as InquiryFull}
            />
          ) : (
            <div id="detail" className={`${CARD} text-sm text-muted`}>
              {selectedId
                ? "Inquiry tidak ditemukan."
                : "Pilih satu inquiry untuk melihat detail, mengubah status, dan menulis catatan internal."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
