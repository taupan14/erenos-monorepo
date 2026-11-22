"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { USER_ROLES, USER_ROLE_LABEL, type UserRole } from "@erenos/shared";
import {
  createStaff,
  resetStaffPassword,
  updateStaffAccess,
  type CreateState,
  type Result,
} from "@/app/(admin)/akun/actions";
import { BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";
import { AUDIT_LABEL } from "@/lib/accounts";
import { formatDateTime } from "@/lib/inquiry";

export type StaffRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_sign_in_at: string | null;
  isSelf: boolean;
};
export type AuditRow = {
  id: number;
  created_at: string;
  action: string;
  actor: string;
  target: string;
  detail: string;
};

function Credentials({
  email,
  password,
  onClose,
}: {
  email: string;
  password: string;
  onClose?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      role="status"
      className="rounded-xl border-2 border-accent bg-white p-4 text-sm"
    >
      <p className="font-semibold text-deep">
        Kata sandi sementara — tampil sekali saja
      </p>
      <p className="mt-1 text-muted">
        Sampaikan lewat saluran pribadi (mis. WhatsApp). Minta staf mengganti
        kata sandi di menu <b>Profil</b> setelah masuk pertama kali.
      </p>
      <dl className="mt-3 space-y-1">
        <div className="flex gap-2">
          <dt className="w-16 text-muted">Email</dt>
          <dd className="break-all font-medium">{email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 text-muted">Sandi</dt>
          <dd className="font-mono text-base font-bold tracking-wide">
            {password}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className={`${BTN_OUTLINE} !h-9 !px-3`}
          onClick={() => {
            void navigator.clipboard
              .writeText(password)
              .then(() => setCopied(true));
          }}
        >
          {copied ? "Tersalin ✓" : "Salin kata sandi"}
        </button>
        {onClose && (
          <button
            type="button"
            className={`${BTN_OUTLINE} !h-9 !px-3`}
            onClick={onClose}
          >
            Tutup
          </button>
        )}
      </div>
    </div>
  );
}

export function AccountsManager({
  staff,
  audit,
}: {
  staff: StaffRow[];
  audit: AuditRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [state, action, creating] = useActionState<CreateState, FormData>(
    createStaff,
    { status: "idle", nonce: 0 },
  );

  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? null : r.error);
      router.refresh();
    });

  return (
    <div className="space-y-2">
      <p
        role="status"
        aria-live="polite"
        className="min-h-5 text-sm text-red-700"
      >
        {msg}
      </p>
      {notice && (
        <Credentials
          email={notice.email}
          password={notice.password}
          onClose={() => setNotice(null)}
        />
      )}

      <section className={CARD} aria-label="Daftar staf">
        <h2 className="mb-2 font-semibold">Staf ({staff.length})</h2>
        <ul className="divide-y divide-line">
          {staff.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-3 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {s.full_name || s.email}
                  {s.isSelf && (
                    <span className="ml-2 rounded-full bg-soft px-2 py-0.5 text-xs text-primary">
                      Anda
                    </span>
                  )}
                </p>
                <p className="break-all text-xs text-muted">
                  {s.email} · Masuk terakhir:{" "}
                  {formatDateTime(s.last_sign_in_at)}
                </p>
              </div>
              <select
                aria-label={`Peran ${s.full_name || s.email}`}
                value={s.role}
                disabled={pending || s.isSelf}
                onChange={(e) =>
                  run(() => updateStaffAccess(s.id, { role: e.target.value }))
                }
                className={`${INPUT} !h-9 !w-auto`}
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {USER_ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.is_active ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-700"}`}
              >
                {s.is_active ? "Aktif" : "Nonaktif"}
              </span>
              {!s.isSelf && (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    className={`${BTN_OUTLINE} !h-9 !px-3`}
                    onClick={() => {
                      const verb = s.is_active ? "Nonaktifkan" : "Aktifkan";
                      if (window.confirm(`${verb} akun ${s.email}?`))
                        run(() =>
                          updateStaffAccess(s.id, { isActive: !s.is_active }),
                        );
                    }}
                  >
                    {s.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="text-sm font-semibold text-primary underline disabled:opacity-60"
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Atur ulang kata sandi ${s.email}? Kata sandi lama langsung tidak berlaku.`,
                        )
                      )
                        return;
                      start(async () => {
                        const r = await resetStaffPassword(s.id);
                        if (r.ok) {
                          setMsg(null);
                          setNotice({ email: r.email, password: r.password });
                        } else setMsg(r.error);
                      });
                    }}
                  >
                    Atur ulang sandi
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD} aria-label="Tambah staf">
        <h2 className="mb-1 font-semibold">Tambah staf</h2>
        <p className="mb-4 text-sm text-muted">
          Akun dibuat langsung dengan kata sandi sementara yang ditampilkan
          sekali di sini. Peran bisa diubah kapan saja.
        </p>
        <form
          action={action}
          className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end"
        >
          <div>
            <label
              htmlFor="st-email"
              className="text-xs font-medium text-muted"
            >
              Email
            </label>
            <input
              id="st-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              className={`${INPUT} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="st-name" className="text-xs font-medium text-muted">
              Nama lengkap
            </label>
            <input
              id="st-name"
              name="full_name"
              required
              maxLength={100}
              className={`${INPUT} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="st-role" className="text-xs font-medium text-muted">
              Peran
            </label>
            <select
              id="st-role"
              name="role"
              defaultValue="editor"
              className={`${INPUT} mt-1`}
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {USER_ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={creating} className={BTN_PRIMARY}>
            {creating ? "Membuat…" : "Buat akun"}
          </button>
        </form>
        <p
          role="status"
          aria-live="polite"
          className="mt-3 min-h-5 text-sm text-red-700"
        >
          {state.status === "error" ? state.message : ""}
        </p>
        {state.status === "ok" && state.credentials && (
          <div className="mt-2">
            <Credentials
              email={state.credentials.email}
              password={state.credentials.password}
            />
          </div>
        )}
      </section>

      <section className={CARD} aria-label="Riwayat perubahan akun">
        <h2 className="mb-2 font-semibold">Riwayat perubahan terbaru</h2>
        {audit.length === 0 ? (
          <p className="text-sm text-muted">Belum ada riwayat.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {audit.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2"
              >
                <span className="w-40 shrink-0 text-xs text-muted">
                  {formatDateTime(a.created_at)}
                </span>
                <span>
                  <b>{a.actor}</b> · {AUDIT_LABEL[a.action] ?? a.action} ·{" "}
                  {a.target}
                  {a.detail && (
                    <span className="text-muted"> ({a.detail})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
