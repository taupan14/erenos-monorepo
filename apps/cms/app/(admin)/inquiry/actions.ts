"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { INQUIRY_STATUSES } from "@/lib/inquiry";
import { UUID_RE } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export type InquiryState = {
  status: "idle" | "ok" | "error";
  message?: string;
  values?: { status: string; internal_notes: string };
  nonce: number;
};

const FORBIDDEN = "Hanya Super Admin yang dapat mengelola inquiry.";

export async function updateInquiry(
  prev: InquiryState,
  fd: FormData,
): Promise<InquiryState> {
  const nonce = prev.nonce + 1;
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "super_admin")
    return { status: "error", message: FORBIDDEN, nonce };

  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  const notes = String(fd.get("internal_notes") ?? "").trim();
  const values = { status, internal_notes: notes };

  if (!UUID_RE.test(id))
    return { status: "error", message: "ID tidak valid.", nonce };
  if (!(INQUIRY_STATUSES as readonly string[]).includes(status)) {
    return { status: "error", message: "Status tidak valid.", values, nonce };
  }
  if (notes.length > 2000)
    return {
      status: "error",
      message: "Catatan maksimal 2.000 karakter.",
      values,
      nonce,
    };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .update({
      status,
      internal_notes: notes || null,
      // status "baru" = belum ditangani; selain itu catat penanganan terakhir
      handled_by: status === "new" ? null : staff.id,
      handled_at: status === "new" ? null : new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");
  if (error)
    return {
      status: "error",
      message: `Gagal menyimpan: ${error.message}`,
      values,
      nonce,
    };
  if (!data?.length)
    return {
      status: "error",
      message: "Inquiry tidak ditemukan atau tidak ada hak akses.",
      values,
      nonce,
    };

  revalidatePath("/inquiry");
  revalidatePath("/");
  return { status: "ok", message: "Tersimpan.", values, nonce };
}

export async function deleteInquiry(
  id: string,
): Promise<{ error: string } | void> {
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "super_admin") return { error: FORBIDDEN };
  if (!UUID_RE.test(id)) return { error: "ID tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { error: `Gagal menghapus: ${error.message}` };
  if (!data?.length)
    return { error: "Inquiry tidak ditemukan atau tidak ada hak akses." };

  revalidatePath("/inquiry");
  revalidatePath("/");
  redirect("/inquiry");
}
