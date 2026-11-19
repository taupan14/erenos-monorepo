import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdmissionForm } from "@/components/admission/AdmissionForm";
import { tabById } from "@/lib/admission";
import { getCurrentStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Tambah data admisi" };

export default async function NewAdmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ bagian?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");
  if (staff.role !== "super_admin") redirect("/");

  const { bagian } = await searchParams;
  const tab = tabById(bagian);
  if (tab.section === "requirement") redirect("/admisi?bagian=persyaratan");

  return <AdmissionForm tab={tab} item={null} />;
}
