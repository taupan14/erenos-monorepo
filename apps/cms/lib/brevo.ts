/**
 * Klien tipis untuk Brevo API v3 (https://developers.brevo.com). Hanya dipakai di server CMS.
 * Env: BREVO_API_KEY, BREVO_SENDER_EMAIL (wajib); BREVO_SENDER_NAME, BREVO_FOLDER_ID (default 1), BREVO_REPLY_TO (opsional).
 */
const BASE = "https://api.brevo.com/v3";

export type BrevoConfig = {
  key: string;
  sender: { name: string; email: string };
  folderId: number;
  replyTo?: string;
};

export function brevoConfig(): BrevoConfig | null {
  const key = process.env.BREVO_API_KEY;
  const email = process.env.BREVO_SENDER_EMAIL;
  if (!key || !email) return null;
  return {
    key,
    sender: {
      name: process.env.BREVO_SENDER_NAME || "Erenos Christian School",
      email,
    },
    folderId: Number(process.env.BREVO_FOLDER_ID) || 1,
    replyTo: process.env.BREVO_REPLY_TO || undefined,
  };
}

export class BrevoError extends Error {}

async function call<T = unknown>(
  cfg: BrevoConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "api-key": cfg.key,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // bukan JSON
  }
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : text;
    throw new BrevoError(
      `Brevo ${res.status}: ${msg || res.statusText}`.slice(0, 300),
    );
  }
  return data as T;
}

/** Email tunggal (dipakai untuk email uji). */
export async function sendTransactional(
  cfg: BrevoConfig,
  p: { to: string; subject: string; html: string },
) {
  await call(cfg, "POST", "/smtp/email", {
    sender: cfg.sender,
    to: [{ email: p.to }],
    subject: p.subject,
    htmlContent: p.html,
    ...(cfg.replyTo ? { replyTo: { email: cfg.replyTo } } : {}),
  });
}

export async function createList(
  cfg: BrevoConfig,
  name: string,
): Promise<number> {
  const r = await call<{ id: number }>(cfg, "POST", "/contacts/lists", {
    name,
    folderId: cfg.folderId,
  });
  return r.id;
}

async function waitProcess(cfg: BrevoConfig, id: number, maxMs = 25_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const p = await call<{ status?: string }>(cfg, "GET", `/processes/${id}`);
    if (p?.status === "completed") return;
    if (p?.status === "failed")
      throw new BrevoError("Brevo gagal mengimpor daftar penerima.");
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new BrevoError(
    "Sinkronisasi penerima di Brevo belum selesai. Coba lagi sebentar lagi.",
  );
}

/** Mengisi daftar Brevo dengan alamat email (idempotent) dan menunggu proses impor selesai. */
export async function importContacts(
  cfg: BrevoConfig,
  listId: number,
  emails: string[],
) {
  for (let i = 0; i < emails.length; i += 5000) {
    const r = await call<{ processId?: number }>(
      cfg,
      "POST",
      "/contacts/import",
      {
        jsonBody: emails.slice(i, i + 5000).map((email) => ({ email })),
        listIds: [listId],
        updateExistingContacts: true,
        emptyContactsAttributes: false,
      },
    );
    if (r?.processId) await waitProcess(cfg, r.processId);
  }
}

export async function createCampaign(
  cfg: BrevoConfig,
  p: {
    name: string;
    subject: string;
    html: string;
    listId: number;
    scheduledAt?: string;
  },
): Promise<number> {
  const r = await call<{ id: number }>(cfg, "POST", "/emailCampaigns", {
    name: p.name,
    subject: p.subject,
    sender: cfg.sender,
    htmlContent: p.html,
    recipients: { listIds: [p.listId] },
    ...(cfg.replyTo ? { replyTo: cfg.replyTo } : {}),
    ...(p.scheduledAt ? { scheduledAt: p.scheduledAt } : {}),
  });
  return r.id;
}

export async function sendCampaignNow(cfg: BrevoConfig, id: number) {
  await call(cfg, "POST", `/emailCampaigns/${id}/sendNow`);
}

export async function deleteCampaign(cfg: BrevoConfig, id: number) {
  await call(cfg, "DELETE", `/emailCampaigns/${id}`);
}

export type CampaignStats = {
  sent?: number;
  delivered?: number;
  opened?: number;
  clicks?: number;
  unsubscribed?: number;
  bounced?: number;
};

export async function getCampaign(
  cfg: BrevoConfig,
  id: number,
): Promise<{ status: string; stats: CampaignStats | null }> {
  const r = await call<{
    status?: string;
    statistics?: { globalStats?: Record<string, number> };
  }>(cfg, "GET", `/emailCampaigns/${id}?statistics=globalStats`);
  const g = r.statistics?.globalStats;
  return {
    status: String(r.status ?? ""),
    stats: g
      ? {
          sent: g.sent,
          delivered: g.delivered,
          opened: g.uniqueViews,
          clicks: g.uniqueClicks,
          unsubscribed: g.unsubscriptions,
          bounced: (g.hardBounces ?? 0) + (g.softBounces ?? 0),
        }
      : null,
  };
}
