"use server";

import { revalidatePath } from "next/cache";
import { USER_ROLES } from "@erenos/shared";
import { EMAIL_RE, tempPassword } from "@/lib/accounts";
import { getCurrentStaff } from "@/lib/auth";
import { UUID_RE } from "@/lib/media";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateState = {
  status: "idle" | "ok" | "error";
  message?: string;
  credentials?: { email: string; password: string };
  nonce: number;
};
export type Result = { ok: true } | { ok: false; error: string };
export type PasswordResult =
  | { ok: true; email: string; password: string }
  | { ok: false; error: string };

const FORBIDDEN = "Hanya Super Admin yang dapat mengelola akun staf.";
const NO_KEY = "SUPABASE_SERVICE_ROLE_KEY belum diatur di environment CMS.";

async function requireSuper() {
  const staff = await getCurrentStaff();
  return staff?.role === "super_admin" ? staff : null;
}

async function audit(
  actorId: string,
  action: string,
  targetId: string | null,
  detail: Record<string, unknown>,
) {
  try {
    await createAdminClient()
      .from("staff_audit_log")
      .insert({ actor_id: actorId, action, target_id: targetId, detail });
  } catch (e) {
    console.error("[audit]", e instanceof Error ? e.message : e);
  }
}

export async function createStaff(
  prev: CreateState,
  fd: FormData,
): Promise<CreateState> {
  const nonce = prev.nonce + 1;
  const staff = await requireSuper();
  if (!staff) return { status: "error", message: FORBIDDEN, nonce };

  const email = String(fd.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(fd.get("full_name") ?? "").trim();
  const role = String(fd.get("role") ?? "");
  if (!EMAIL_RE.test(email) || email.length > 200)
    return { status: "error", message: "Alamat email tidak valid.", nonce };
  if (!name || name.length > 100)
    return {
      status: "error",
      message: "Nama lengkap wajib diisi (maks. 100 karakter).",
      nonce,
    };
  if (!(USER_ROLES as readonly string[]).includes(role))
    return { status: "error", message: "Peran tidak valid.", nonce };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { status: "error", message: NO_KEY, nonce };
  }

  const password = tempPassword();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error || !data.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? "");
    return {
      status: "error",
      message: taken
        ? "Email ini sudah terdaftar."
        : `Gagal membuat akun: ${error?.message ?? "tidak diketahui"}`,
      nonce,
    };
  }

  // Trigger database membuat profil 'editor'; sesuaikan nama dan peran (service role dipercaya oleh penjaga peran)
  const { error: pe } = await admin
    .from("profiles")
    .update({ full_name: name, role })
    .eq("id", data.user.id);
  if (pe) {
    await admin.auth.admin.deleteUser(data.user.id);
    return {
      status: "error",
      message: `Gagal menyiapkan profil: ${pe.message}`,
      nonce,
    };
  }

  await audit(staff.id, "staff.create", data.user.id, { email, role });
  revalidatePath("/akun");
  return {
    status: "ok",
    message: "Akun dibuat.",
    credentials: { email, password },
    nonce,
  };
}

export async function updateStaffAccess(
  id: string,
  input: { role?: string; isActive?: boolean },
): Promise<Result> {
  const staff = await requireSuper();
  if (!staff) return { ok: false, error: FORBIDDEN };
  if (!UUID_RE.test(id)) return { ok: false, error: "ID tidak valid." };
  if (id === staff.id)
    return {
      ok: false,
      error: "Anda tidak dapat mengubah peran atau status akun Anda sendiri.",
    };

  const patch: Record<string, unknown> = {};
  if (input.role !== undefined) {
    if (!(USER_ROLES as readonly string[]).includes(input.role))
      return { ok: false, error: "Peran tidak valid." };
    patch.role = input.role;
  }
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (Object.keys(patch).length === 0)
    return { ok: false, error: "Tidak ada perubahan." };

  // Memakai sesi Super Admin: RLS dan penjaga "minimal satu Super Admin aktif" di database tetap berlaku
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: `Gagal menyimpan: ${error.message}` };
  if (!data?.length)
    return {
      ok: false,
      error: "Akun tidak ditemukan atau tidak ada hak akses.",
    };

  if (input.isActive !== undefined) {
    try {
      const { error: be } = await createAdminClient().auth.admin.updateUserById(
        id,
        {
          ban_duration: input.isActive ? "none" : "876000h",
        },
      );
      if (be)
        return {
          ok: false,
          error: `Status tersimpan, tetapi pemblokiran login gagal: ${be.message}`,
        };
    } catch {
      return { ok: false, error: `Status tersimpan, tetapi ${NO_KEY}` };
    }
  }

  if (input.role !== undefined)
    await audit(staff.id, "staff.role", id, { role: input.role });
  if (input.isActive !== undefined)
    await audit(
      staff.id,
      input.isActive ? "staff.activate" : "staff.deactivate",
      id,
      {},
    );
  revalidatePath("/akun");
  return { ok: true };
}

export async function resetStaffPassword(id: string): Promise<PasswordResult> {
  const staff = await requireSuper();
  if (!staff) return { ok: false, error: FORBIDDEN };
  if (!UUID_RE.test(id)) return { ok: false, error: "ID tidak valid." };
  if (id === staff.id)
    return { ok: false, error: "Ubah kata sandi Anda sendiri di menu Profil." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { ok: false, error: NO_KEY };
  }
  const password = tempPassword();
  const { data, error } = await admin.auth.admin.updateUserById(id, {
    password,
  });
  if (error || !data.user)
    return {
      ok: false,
      error: `Gagal mengatur ulang: ${error?.message ?? "tidak diketahui"}`,
    };

  await audit(staff.id, "staff.reset_password", id, {});
  return { ok: true, email: data.user.email ?? "", password };
}
