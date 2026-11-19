"use server";

import { redirect } from "next/navigation";
import { slugify } from "@erenos/shared";
import { getCurrentStaff } from "@/lib/auth";
import { countEnMissing, entityDef, type ListSpec, type Row } from "@/lib/content-config";
import { UUID_RE } from "@/lib/media";
import { revalidateWeb } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

export type Result = { ok: true } | { ok: false; error: string };
export type EntityState = {
  status: "idle" | "ok" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  nonce: number;
  enMissing: number;
};

const STATUSES = ["draft", "published", "archived"];
const NO_SESSION = "Sesi berakhir. Muat ulang halaman dan masuk kembali.";
const HREF_RE = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;

function parseList(spec: ListSpec, raw: string): { rows: Row[] } | { error: string } {
  if (!raw) return { rows: [] };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { error: "Data daftar tidak valid." };
  }
  if (!Array.isArray(data) || data.length > spec.max) return { error: `Maksimal ${spec.max} butir.` };
  const rows: Row[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const row: Row = {};
    for (const f of spec.fields) {
      const v = typeof o[f.key] === "string" ? (o[f.key] as string).trim() : "";
      if (v.length > f.max) return { error: `${f.label} maksimal ${f.max} karakter.` };
      if (f.kind === "select" && v && !f.options?.includes(v)) return { error: `${f.label} tidak valid.` };
      if (v) row[f.key] = v;
    }
    if (Object.keys(row).length > 0) rows.push(row);
  }
  return { rows };
}

type Db = Awaited<ReturnType<typeof createClient>>;

async function uniqueSlug(supabase: Db, table: string, base: string): Promise<string> {
  const root = base || "item";
  const { data } = await supabase.from(table).select("slug").like("slug", `${root}%`);
  const taken = new Set((data ?? []).map((r) => String(r.slug)));
  if (!taken.has(root)) return root;
  for (let i = 2; i < 1000; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
  return `${root}-${Date.now()}`;
}

export async function saveEntity(prev: EntityState, fd: FormData): Promise<EntityState> {
  const nonce = prev.nonce + 1;
  const fail = (message: string, extra: Partial<EntityState> = {}): EntityState => ({
    status: "error",
    message,
    nonce,
    enMissing: prev.enMissing,
    ...extra,
  });

  if (!(await getCurrentStaff())) return fail(NO_SESSION);

  const get = (n: string) => String(fd.get(n) ?? "").trim();
  const key = get("key");
  const def = entityDef(get("entity"), key);
  if (!def) return fail("Konten tidak dikenal.");
  const isCreate = Boolean(def.creatable) && !key;
  if (!isCreate && (!key || (def.keyCol === "id" && !UUID_RE.test(key)))) return fail("Kunci konten tidak valid.");

  const all: Record<string, string> = {};
  const errors: Record<string, string> = {};
  const payload: Record<string, unknown> = {};
  const meta: Record<string, unknown> = {};
  const colName = (name: string) => name.replace(/^meta__/, "");

  const read = (c: { kind: string; required?: boolean; validate?: string; label: string }, name: string, label: string, max: number, target: "col" | "meta") => {
    const k = colName(name);
    if (c.kind === "toggle") {
      const on = fd.get(name) === "on";
      all[name] = on ? "on" : "";
      payload[k] = on;
      return;
    }
    const raw = c.kind === "rich" ? String(fd.get(name) ?? "") : get(name);
    all[name] = raw;
    if (c.required && !raw.trim()) errors[name] = `${label} wajib diisi.`;
    else if (raw.length > max) errors[name] = `Maksimal ${max.toLocaleString("id-ID")} karakter.`;
    else if (c.kind === "date" && raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) errors[name] = "Tanggal tidak valid.";
    else if (c.validate === "href" && raw && !HREF_RE.test(raw)) errors[name] = "Tautan harus diawali /, #, https://, mailto: atau tel:.";
    if (target === "meta") {
      if (raw) meta[k] = raw;
    } else {
      payload[k] = raw === "" ? (k === "content" ? "" : null) : raw;
    }
  };

  for (const c of def.cols) {
    const max = c.max ?? (c.kind === "rich" ? 200_000 : c.kind === "textarea" ? 2000 : 200);
    read(c, c.name, c.label, max, "col");
    if (c.en) read({ ...c, required: false }, c.en, `${c.label} (English)`, max, "col");
  }
  for (const m of def.metaCols) {
    const max = m.max ?? (m.kind === "textarea" ? 2000 : 200);
    read(m, `meta__${m.name}`, m.label, max, "meta");
    if (m.en) read(m, `meta__${m.en}`, `${m.label} (English)`, max, "meta");
  }

  const lists: Record<string, Row[]> = {};
  for (const spec of def.lists) {
    const r = parseList(spec, String(fd.get(`list__${spec.key}`) ?? ""));
    if ("error" in r) errors[`list__${spec.key}`] = r.error;
    else lists[spec.key] = r.rows;
  }

  for (const n of def.hasGallery ? [def.coverCol, "gallery_id"] : [def.coverCol]) {
    const v = get(n);
    all[n] = v;
    if (v && !UUID_RE.test(v)) errors[n] = "Pilihan tidak valid.";
    payload[n] = v || null;
  }

  const status = get("intent") === "publish" ? "published" : get("status") || "draft";
  if (!STATUSES.includes(status)) errors.status = "Status tidak valid.";
  all.status = status;
  payload.status = status;

  const rich = new Set(def.cols.filter((c) => c.kind === "rich").flatMap((c) => [c.name, c.en ?? ""]));
  const values = Object.fromEntries(Object.entries(all).filter(([k]) => !rich.has(k)));
  const enMissing = countEnMissing(def, (n) => all[n] ?? "");

  if (Object.keys(errors).length > 0) {
    return fail("Periksa kembali isian yang ditandai.", { fieldErrors: errors, values, enMissing });
  }

  const supabase = await createClient();

  if (def.table === "pages") {
    const { data: existing } = await supabase.from("pages").select("meta").eq("slug", key).maybeSingle();
    if (!existing) return fail("Halaman belum ada di database. Jalankan supabase/seed.sql.", { values, enMissing });
    const merged: Record<string, unknown> = { ...(existing.meta && typeof existing.meta === "object" ? existing.meta : {}) };
    for (const m of def.metaCols) for (const k of [m.name, m.en]) if (k) delete merged[k];
    for (const spec of def.lists) if (spec.target === "meta") delete merged[spec.key];
    Object.assign(merged, meta);
    for (const spec of def.lists) {
      if (spec.target === "meta" && (lists[spec.key]?.length ?? 0) > 0) merged[spec.key] = lists[spec.key];
    }
    payload.meta = merged;
  }
  for (const spec of def.lists) if (spec.target === "column") payload[spec.key] = lists[spec.key] ?? [];

  if (isCreate) {
    if (def.slugFrom) payload.slug = await uniqueSlug(supabase, def.table, slugify(all[def.slugFrom] ?? "", 70));
    if (def.sortable) {
      const { data: last } = await supabase.from(def.table).select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      payload.sort_order = (Number(last?.sort_order) || 0) + 10;
    }
    const { data, error } = await supabase.from(def.table).insert(payload).select("id").single();
    if (error) return fail(`Gagal menyimpan: ${error.message}`, { values, enMissing });
    await revalidateWeb();
    redirect(`${def.base}/${data.id}?tersimpan=1`);
  }

  const { data, error } = await supabase.from(def.table).update(payload).eq(def.keyCol, key).select("id");
  if (error) return fail(`Gagal menyimpan: ${error.message}`, { values, enMissing });
  if (!data?.length) return fail("Tidak ada baris yang diperbarui. Pastikan data sudah ada dan Anda punya hak akses.", { values, enMissing });

  const rv = await revalidateWeb();
  return {
    status: "ok",
    message: rv.ok ? "Tersimpan. Website sudah diperbarui." : "Tersimpan. Website akan ikut berubah dalam sekitar 5 menit.",
    values,
    nonce,
    enMissing,
  };
}

export async function deleteRecord(entity: string, id: string): Promise<{ error: string } | void> {
  if (!(await getCurrentStaff())) return { error: NO_SESSION };
  const def = entityDef(entity, "");
  if (!def?.creatable || !UUID_RE.test(id)) return { error: "Konten tidak dapat dihapus." };

  const supabase = await createClient();
  const { data, error } = await supabase.from(def.table).delete().eq("id", id).select("id");
  if (error) return { error: `Gagal menghapus: ${error.message}` };
  if (!data?.length) return { error: "Data tidak ditemukan atau tidak ada hak akses." };

  await revalidateWeb();
  redirect(def.base);
}

/** Mengatur urutan tampil: ids sesuai urutan baru (atas ke bawah). */
export async function reorderRecords(entity: string, ids: string[]): Promise<Result> {
  if (!(await getCurrentStaff())) return { ok: false, error: NO_SESSION };
  const def = entityDef(entity, "");
  if (!def?.sortable) return { ok: false, error: "Konten ini tidak dapat diurutkan." };
  if (ids.length > 200 || ids.some((i) => !UUID_RE.test(i))) return { ok: false, error: "Daftar urutan tidak valid." };

  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, i) => supabase.from(def.table).update({ sort_order: (i + 1) * 10 }).eq("id", id).select("id")),
  );
  const bad = results.find((r) => r.error);
  if (bad?.error) return { ok: false, error: `Gagal mengurutkan: ${bad.error.message}` };

  await revalidateWeb();
  return { ok: true };
}
