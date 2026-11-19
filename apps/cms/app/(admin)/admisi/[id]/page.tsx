import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdmissionForm } from "@/components/admission/AdmissionForm";
import { tabBySection } from "@/lib/admission";
import { getCurrentStaff } from "@/lib/auth";
import { UUID_RE } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ubah data admisi" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tersimpan?: string }>;
};

export default async function EditAdmissionPage({
  params,
  searchParams,
}: Props) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");
  if (staff.role !== "super_admin") redirect("/");

  const { id } = await params;
  const { tersimpan } = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("admission_info")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

  const tab = tabBySection(String(row.section));
  if (!tab || tab.section === "requirement")
    redirect("/admisi?bagian=persyaratan");

  return (
    <AdmissionForm
      tab={tab}
      saved={tersimpan === "1"}
      item={{
        id,
        title: row.title ?? "",
        title_en: row.title_en ?? "",
        body: row.body ?? "",
        body_en: row.body_en ?? "",
        status: row.status ?? "draft",
      }}
    />
  );
}
