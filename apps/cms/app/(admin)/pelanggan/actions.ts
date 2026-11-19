"use server";

import { revalidatePath } from "next/cache";
import { getCurrentStaff } from "@/lib/auth";
import { UUID_RE } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };
const FORBIDDEN: Result = {
  ok: false,
  error: "Hanya Super Admin yang dapat mengelola pelanggan.",
};

async function guard(id: string): Promise<Result | null> {
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "super_admin") return FORBIDDEN;
  if (!UUID_RE.test(id)) return { ok: false, error: "ID tidak valid." };
  return null;
}

/** Menonaktifkan pelanggan (mis. email bermasalah). Pelanggan tidak bisa diaktifkan kembali dari sini: hanya ia sendiri lewat footer website. */
export async function deactivateSubscriber(id: string): Promise<Result> {
  const denied = await guard(id);
  if (denied) return denied;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");
  if (error)
    return { ok: false, error: `Gagal menonaktifkan: ${error.message}` };
  if (!data?.length)
    return {
      ok: false,
      error: "Pelanggan tidak ditemukan atau tidak ada hak akses.",
    };
  revalidatePath("/pelanggan");
  return { ok: true };
}

export async function deleteSubscriber(id: string): Promise<Result> {
  const denied = await guard(id);
  if (denied) return denied;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscribers")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: `Gagal menghapus: ${error.message}` };
  if (!data?.length)
    return {
      ok: false,
      error: "Pelanggan tidak ditemukan atau tidak ada hak akses.",
    };
  revalidatePath("/pelanggan");
  return { ok: true };
}
