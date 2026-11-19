"use server";

import { redirect } from "next/navigation";
import { loadStaff, safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email dan kata sandi wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email atau kata sandi salah." };

  // Akun auth valid belum tentu staf CMS aktif
  const staff = await loadStaff(supabase);
  if (!staff) {
    await supabase.auth.signOut();
    return { error: "Akun ini tidak memiliki akses CMS atau sedang dinonaktifkan." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
