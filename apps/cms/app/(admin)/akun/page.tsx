import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { USER_ROLES, type UserRole } from "@erenos/shared";
import {
  AccountsManager,
  type AuditRow,
  type StaffRow,
} from "@/components/account/AccountsManager";
import { PageHead } from "@/components/ui/form";
import { getCurrentStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Akun" };

export default async function AccountsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");
  if (staff.role !== "super_admin") redirect("/");

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return (
      <>
        <PageHead title="Akun" />
        <p className="text-sm text-red-700">
          SUPABASE_SERVICE_ROLE_KEY belum diatur di environment CMS
          (apps/cms/.env.local dan Vercel erenos-cms). Tanpa itu, akun staf
          tidak dapat dikelola.
        </p>
      </>
    );
  }

  const supabase = await createClient();
  const [profilesRes, usersRes, logRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, is_active, created_at")
      .order("created_at"),
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    supabase
      .from("staff_audit_log")
      .select("id, created_at, actor_id, action, target_id, detail")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const users = new Map((usersRes.data?.users ?? []).map((u) => [u.id, u]));
  const profiles = profilesRes.data ?? [];
  const nameOf = (id: unknown) => {
    const p = profiles.find((x) => x.id === id);
    return p
      ? String(p.full_name || users.get(String(id))?.email || "—")
      : "(akun dihapus)";
  };

  const rows: StaffRow[] = profiles.map((p) => ({
    id: String(p.id),
    email: users.get(String(p.id))?.email ?? "",
    full_name: String(p.full_name ?? ""),
    role: ((USER_ROLES as readonly string[]).includes(String(p.role))
      ? p.role
      : "editor") as UserRole,
    is_active: Boolean(p.is_active),
    last_sign_in_at: users.get(String(p.id))?.last_sign_in_at ?? null,
    isSelf: p.id === staff.id,
  }));

  const audit: AuditRow[] = (logRes.data ?? []).map((l) => {
    const d = (l.detail ?? {}) as Record<string, unknown>;
    return {
      id: Number(l.id),
      created_at: String(l.created_at),
      action: String(l.action),
      actor: nameOf(l.actor_id),
      target: l.target_id ? nameOf(l.target_id) || String(d.email ?? "") : "",
      detail: [d.email && String(d.email), d.role && `peran: ${String(d.role)}`]
        .filter(Boolean)
        .join(", "),
    };
  });

  return (
    <>
      <PageHead title="Akun" subtitle="Staf yang dapat masuk ke CMS." />
      {(profilesRes.error || logRes.error) && (
        <p className="mb-4 text-sm text-red-700">
          {profilesRes.error?.message ??
            `Riwayat belum bisa dimuat: ${logRes.error?.message} (jalankan migrasi staff_audit).`}
        </p>
      )}
      <AccountsManager staff={rows} audit={audit} />
    </>
  );
}
