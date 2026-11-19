import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AdmissionList,
  type AdmissionRow,
} from "@/components/admission/AdmissionList";
import {
  RequirementEditor,
  type RequirementItem,
} from "@/components/admission/RequirementEditor";
import { BTN_PRIMARY, PageHead } from "@/components/ui/form";
import { LEVEL_CODES, TABS, tabById } from "@/lib/admission";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admisi" };

type Props = { searchParams: Promise<{ bagian?: string }> };

type DbRow = {
  id: string;
  title: string;
  title_en: string | null;
  body: string;
  level: string | null;
  status: string;
};

export default async function AdmissionPage({ searchParams }: Props) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");
  if (staff.role !== "super_admin") redirect("/");

  const { bagian } = await searchParams;
  const tab = tabById(bagian);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admission_info")
    .select("id, title, title_en, body, level, status")
    .eq("section", tab.section)
    .order("sort_order");
  const rows = (data ?? []) as unknown as DbRow[];

  // Persyaratan: gabungkan baris berjudul sama menjadi satu baris matriks
  const groups = new Map<string, RequirementItem>();
  if (tab.section === "requirement") {
    for (const r of rows) {
      const g = groups.get(r.title) ?? {
        key: r.title,
        title: r.title,
        title_en: r.title_en ?? "",
        levels: [],
        status: r.status,
      };
      if (r.level === null) g.levels = [...LEVEL_CODES];
      else if (!g.levels.includes(r.level)) g.levels.push(r.level);
      groups.set(r.title, g);
    }
  }
  const reqItems = [...groups.values()];

  return (
    <>
      <PageHead
        title="Admisi"
        subtitle="Alur, persyaratan, pertanyaan umum, dan catatan penerimaan siswa baru."
        actions={
          tab.section !== "requirement" ? (
            <Link
              href={`/admisi/baru?bagian=${tab.id}`}
              className={BTN_PRIMARY}
            >
              + Tambah {tab.label.toLowerCase()}
            </Link>
          ) : undefined
        }
      />

      <nav aria-label="Bagian admisi" className="mb-5 flex gap-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admisi?bagian=${t.id}`}
            aria-current={t.id === tab.id ? "page" : undefined}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${t.id === tab.id ? "bg-white text-primary shadow-sm" : "text-muted hover:bg-white/60"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {error ? (
        <p className="text-sm text-red-700">
          Gagal memuat data: {error.message}
        </p>
      ) : tab.section === "requirement" ? (
        <RequirementEditor
          key={reqItems
            .map(
              (i) => `${i.key}|${i.status}|${i.levels.join(",")}|${i.title_en}`,
            )
            .join(";")}
          items={reqItems}
        />
      ) : (
        <AdmissionList
          section={tab.section}
          rows={rows.map(
            (r): AdmissionRow => ({
              id: r.id,
              title: r.title,
              body: r.body,
              status: r.status,
            }),
          )}
        />
      )}

      <p className="mt-6 text-sm text-muted">
        Status pendaftaran dibuka atau ditutup diatur di{" "}
        <Link
          href="/pengaturan?bagian=ppdb"
          className="font-semibold text-primary underline"
        >
          Pengaturan → Pendaftaran (PPDB)
        </Link>
        . FAQ yang terbit juga tampil di halaman /faq website.
      </p>
    </>
  );
}
