"use server";

import { getCurrentStaff } from "@/lib/auth";
import { UUID_RE } from "@/lib/media";
import { revalidateWeb } from "@/lib/revalidate";
import { SECTIONS, type Field } from "@/lib/settings-fields";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = {
  status: "idle" | "ok" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  nonce: number;
};

type Parsed = { value: string | number | boolean | null } | { error: string };

function parseValue(f: Field, raw: string, isEn: boolean): Parsed {
  if (f.kind === "toggle") return { value: raw === "on" };
  if (raw === "") {
    return f.required && !isEn ? { error: "Wajib diisi." } : { value: null };
  }
  const max = f.max ?? (f.kind === "textarea" ? 2000 : 200);
  switch (f.kind) {
    case "int": {
      if (!/^\d+$/.test(raw)) return { error: "Isi dengan angka bulat." };
      const n = Number(raw);
      return n > (f.maxValue ?? 100000) ? { error: `Maksimal ${f.maxValue ?? 100000}.` } : { value: n };
    }
    case "url":
      return /^https?:\/\/\S+$/i.test(raw) && raw.length <= 500
        ? { value: raw }
        : { error: "Isi dengan URL lengkap (https://…)." };
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) && raw.length <= 200
        ? { value: raw }
        : { error: "Alamat email tidak valid." };
    case "tel":
      return /^[0-9+()\-\s]{5,30}$/.test(raw) ? { value: raw } : { error: "Nomor telepon tidak valid." };
    case "media":
      return UUID_RE.test(raw) ? { value: raw } : { error: "Pilihan gambar tidak valid." };
    default:
      return raw.length > max ? { error: `Maksimal ${max} karakter.` } : { value: raw };
  }
}

export async function saveSettings(prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const nonce = prev.nonce + 1;
  const fail = (message: string, extra: Partial<SettingsState> = {}): SettingsState => ({
    status: "error",
    message,
    nonce,
    ...extra,
  });

  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "super_admin") return fail("Hanya Super Admin yang dapat mengubah pengaturan.");

  const section = SECTIONS.find((s) => s.id === formData.get("section"));
  if (!section) return fail("Bagian pengaturan tidak dikenal.");

  const payload: Record<string, string | number | boolean | null> = {};
  const values: Record<string, string> = {};
  const fieldErrors: Record<string, string> = {};

  for (const f of section.fields) {
    for (const [name, isEn] of [[f.name, false], [f.en, true]] as const) {
      if (!name) continue;
      const raw = f.kind === "toggle" ? (formData.get(name) === "on" ? "on" : "") : String(formData.get(name) ?? "").trim();
      values[name] = raw;
      const r = parseValue(f, raw, isEn);
      if ("error" in r) fieldErrors[name] = r.error;
      else payload[name] = r.value;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return fail("Periksa kembali isian yang ditandai.", { fieldErrors, values });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("site_settings").update(payload).eq("id", 1).select("id");
  if (error) return fail(`Gagal menyimpan: ${error.message}`, { values });
  if (!data?.length) {
    return fail("Tidak ada baris yang diperbarui. Pastikan baris site_settings (id = 1) ada dan akun Anda Super Admin.", { values });
  }

  const rv = await revalidateWeb();
  return {
    status: "ok",
    message: rv.ok
      ? "Tersimpan. Website sudah diperbarui."
      : "Tersimpan. Website akan ikut berubah dalam sekitar 5 menit (pembaruan otomatis belum terhubung).",
    values,
    nonce,
  };
}
