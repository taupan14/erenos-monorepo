"use server";

import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { LEVEL_CODES, TABS, type Result } from "@/lib/admission";
import { UUID_RE } from "@/lib/media";
import { revalidateWeb } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

export type AdmissionState = {
  status: "idle" | "ok" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  nonce: number;
};

const STATUSES = ["draft", "published", "archived"];
const LIST_SECTIONS = ["step", "faq", "note"];
const FORBIDDEN = "Hanya Super Admin yang dapat mengelola Admisi.";

async function isSuper() {
  return (await getCurrentStaff())?.role === "super_admin";
}

function rpcMessage(msg: string): string {
  if (msg.includes("forbidden")) return FORBIDDEN;
  if (msg.includes("duplicate_title"))
    return "Sudah ada persyaratan dengan judul yang sama.";
  if (msg.includes("title_required")) return "Judul persyaratan wajib diisi.";
  if (msg.includes("levels_required")) return "Pilih minimal satu jenjang.";
  return `Gagal menyimpan: ${msg}`;
}

// ------------------------------------------------------------ tahap, FAQ, catatan

export async function saveAdmissionItem(
  prev: AdmissionState,
  fd: FormData,
): Promise<AdmissionState> {
  const nonce = prev.nonce + 1;
  if (!(await isSuper())) return { status: "error", message: FORBIDDEN, nonce };

  const get = (n: string) => String(fd.get(n) ?? "").trim();
  const id = get("id");
  const section = get("section");
  const values: Record<string, string> = {};
  for (const n of ["title", "title_en", "body", "body_en", "status"])
    values[n] = get(n);
  if (get("intent") === "publish") values.status = "published";

  const errors: Record<string, string> = {};
  if (!values.title) errors.title = "Wajib diisi.";
  if ((values.title ?? "").length > 200)
    errors.title = "Maksimal 200 karakter.";
  if ((values.title_en ?? "").length > 200)
    errors.title_en = "Maksimal 200 karakter.";
  if ((values.body ?? "").length > 4000)
    errors.body = "Maksimal 4.000 karakter.";
  if ((values.body_en ?? "").length > 4000)
    errors.body_en = "Maksimal 4.000 karakter.";
  if (!STATUSES.includes(values.status ?? ""))
    errors.status = "Status tidak valid.";
  if (!id && !LIST_SECTIONS.includes(section))
    return { status: "error", message: "Bagian tidak dikenal.", nonce };
  if (id && !UUID_RE.test(id))
    return { status: "error", message: "ID tidak valid.", nonce };
  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali isian yang ditandai.",
      fieldErrors: errors,
      values,
      nonce,
    };
  }

  const payload = {
    title: values.title,
    title_en: values.title_en || null,
    body: values.body ?? "",
    body_en: values.body_en || null,
    status: values.status,
  };
  const supabase = await createClient();

  if (!id) {
    const { data: last } = await supabase
      .from("admission_info")
      .select("sort_order")
      .eq("section", section)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from("admission_info")
      .insert({
        ...payload,
        section,
        sort_order: (Number(last?.sort_order) || 0) + 10,
      })
      .select("id")
      .single();
    if (error)
      return {
        status: "error",
        message: `Gagal menyimpan: ${error.message}`,
        values,
        nonce,
      };
    await revalidateWeb();
    redirect(`/admisi/${data.id}?tersimpan=1`);
  }

  const { data, error } = await supabase
    .from("admission_info")
    .update(payload)
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
      message: "Data tidak ditemukan atau tidak ada hak akses.",
      values,
      nonce,
    };

  const rv = await revalidateWeb();
  return {
    status: "ok",
    message: rv.ok
      ? "Tersimpan. Website sudah diperbarui."
      : "Tersimpan. Website akan ikut berubah dalam sekitar 5 menit.",
    values,
    nonce,
  };
}

export async function deleteAdmissionItem(
  id: string,
  section: string,
): Promise<{ error: string } | void> {
  if (!(await isSuper())) return { error: FORBIDDEN };
  if (!UUID_RE.test(id)) return { error: "ID tidak valid." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admission_info")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { error: `Gagal menghapus: ${error.message}` };
  if (!data?.length)
    return { error: "Data tidak ditemukan atau tidak ada hak akses." };
  await revalidateWeb();
  redirect(
    `/admisi?bagian=${TABS.find((t) => t.section === section)?.id ?? "tahap"}`,
  );
}

export async function reorderAdmissionItems(
  section: string,
  ids: string[],
): Promise<Result> {
  if (!(await isSuper())) return { ok: false, error: FORBIDDEN };
  if (
    !LIST_SECTIONS.includes(section) ||
    ids.length > 200 ||
    ids.some((i) => !UUID_RE.test(i))
  ) {
    return { ok: false, error: "Daftar urutan tidak valid." };
  }
  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, i) =>
      supabase
        .from("admission_info")
        .update({ sort_order: (i + 1) * 10 })
        .eq("id", id)
        .eq("section", section)
        .select("id"),
    ),
  );
  const bad = results.find((r) => r.error);
  if (bad?.error)
    return { ok: false, error: `Gagal mengurutkan: ${bad.error.message}` };
  await revalidateWeb();
  return { ok: true };
}

// ------------------------------------------------------------ persyaratan (matriks)

export async function saveRequirement(input: {
  oldTitle: string | null;
  title: string;
  titleEn: string;
  levels: string[];
  status: string;
}): Promise<Result> {
  if (!(await isSuper())) return { ok: false, error: FORBIDDEN };
  const title = input.title.trim();
  const titleEn = input.titleEn.trim();
  if (!title) return { ok: false, error: "Judul persyaratan wajib diisi." };
  if (title.length > 150 || titleEn.length > 150)
    return { ok: false, error: "Judul maksimal 150 karakter." };
  if (
    input.levels.length === 0 ||
    input.levels.some((l) => !LEVEL_CODES.includes(l))
  ) {
    return { ok: false, error: "Pilih minimal satu jenjang." };
  }
  if (!STATUSES.includes(input.status))
    return { ok: false, error: "Status tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_requirement", {
    p_old_title: input.oldTitle,
    p_title: title,
    p_title_en: titleEn,
    p_levels: input.levels,
    p_status: input.status,
  });
  if (error) return { ok: false, error: rpcMessage(error.message) };
  await revalidateWeb();
  return { ok: true };
}

export async function deleteRequirement(title: string): Promise<Result> {
  if (!(await isSuper())) return { ok: false, error: FORBIDDEN };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admission_info")
    .delete()
    .eq("section", "requirement")
    .eq("title", title)
    .select("id");
  if (error) return { ok: false, error: `Gagal menghapus: ${error.message}` };
  if (!data?.length)
    return {
      ok: false,
      error: "Persyaratan tidak ditemukan atau tidak ada hak akses.",
    };
  await revalidateWeb();
  return { ok: true };
}

export async function reorderRequirements(titles: string[]): Promise<Result> {
  if (!(await isSuper())) return { ok: false, error: FORBIDDEN };
  if (titles.length > 100)
    return { ok: false, error: "Daftar urutan tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_requirements", {
    p_titles: titles,
  });
  if (error) return { ok: false, error: rpcMessage(error.message) };
  await revalidateWeb();
  return { ok: true };
}
