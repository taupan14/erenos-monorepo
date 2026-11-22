"use server";

import { revalidatePath } from "next/cache";
import { MIN_PASSWORD } from "@/lib/accounts";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = {
  status: "idle" | "ok" | "error";
  message?: string;
  nonce: number;
};

export async function updateMyName(
  prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const nonce = prev.nonce + 1;
  const staff = await getCurrentStaff();
  if (!staff)
    return { status: "error", message: "Sesi berakhir. Masuk kembali.", nonce };
  const name = String(fd.get("full_name") ?? "").trim();
  if (!name || name.length > 100)
    return {
      status: "error",
      message: "Nama wajib diisi (maks. 100 karakter).",
      nonce,
    };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: name })
    .eq("id", staff.id)
    .select("id");
  if (error)
    return {
      status: "error",
      message: `Gagal menyimpan: ${error.message}`,
      nonce,
    };
  if (!data?.length)
    return { status: "error", message: "Profil tidak ditemukan.", nonce };
  revalidatePath("/", "layout");
  return { status: "ok", message: "Nama tersimpan.", nonce };
}

export async function changeMyPassword(
  prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const nonce = prev.nonce + 1;
  const staff = await getCurrentStaff();
  if (!staff)
    return { status: "error", message: "Sesi berakhir. Masuk kembali.", nonce };

  const next = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (next.length < MIN_PASSWORD)
    return {
      status: "error",
      message: `Kata sandi minimal ${MIN_PASSWORD} karakter.`,
      nonce,
    };
  if (next !== confirm)
    return {
      status: "error",
      message: "Konfirmasi kata sandi tidak sama.",
      nonce,
    };
  if (next.toLowerCase() === staff.email.toLowerCase())
    return {
      status: "error",
      message: "Kata sandi tidak boleh sama dengan email.",
      nonce,
    };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error)
    return {
      status: "error",
      message: `Gagal mengganti kata sandi: ${error.message}`,
      nonce,
    };
  return {
    status: "ok",
    message: "Kata sandi diganti. Gunakan yang baru saat masuk berikutnya.",
    nonce,
  };
}
