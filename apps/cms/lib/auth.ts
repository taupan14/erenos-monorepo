import { cache } from "react";
import { USER_ROLES, type UserRole } from "@erenos/shared";
import { createClient } from "@/lib/supabase/server";

type Db = Awaited<ReturnType<typeof createClient>>;

export type Staff = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

/** Staf yang sedang login, atau null bila belum login / tidak punya profil aktif. */
export async function loadStaff(supabase: Db): Promise<Staff | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !profile.is_active) return null;

  const role = USER_ROLES.find((r) => r === profile.role);
  if (!role) return null;

  const email = user.email ?? "";
  const name = typeof profile.full_name === "string" ? profile.full_name.trim() : "";
  return { id: user.id, email, fullName: name || email, role };
}

/** Dipakai di Server Components; hasilnya di-cache per request. */
export const getCurrentStaff = cache(async () => loadStaff(await createClient()));

/** Hanya terima path internal untuk redirect setelah login. */
export function safeNext(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/login")) return "/";
  return raw;
}

export function initialsOf(name: string): string {
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (letters || "?").toUpperCase();
}
