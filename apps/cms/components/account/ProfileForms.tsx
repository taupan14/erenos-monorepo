"use client";

import { useActionState } from "react";
import {
  changeMyPassword,
  updateMyName,
  type FormState,
} from "@/app/(admin)/profil/actions";
import { BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";

const idle: FormState = { status: "idle", nonce: 0 };

function Msg({ state }: { state: FormState }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`min-h-5 text-sm ${state.status === "ok" ? "text-green-700" : "text-red-700"}`}
    >
      {state.message}
    </p>
  );
}

export function ProfileForms({
  name,
  email,
  roleLabel,
  minPassword,
}: {
  name: string;
  email: string;
  roleLabel: string;
  minPassword: number;
}) {
  const [nameState, nameAction, namePending] = useActionState<
    FormState,
    FormData
  >(updateMyName, idle);
  const [pwState, pwAction, pwPending] = useActionState<FormState, FormData>(
    changeMyPassword,
    idle,
  );

  return (
    <div className="grid max-w-3xl gap-4">
      <form action={nameAction} className={`${CARD} space-y-4`}>
        <h2 className="font-semibold">Profil</h2>
        <p className="text-sm text-muted">
          {email} · {roleLabel}
        </p>
        <div>
          <label htmlFor="pf-name" className="text-sm font-medium">
            Nama lengkap
          </label>
          <input
            key={`n-${nameState.nonce}`}
            id="pf-name"
            name="full_name"
            defaultValue={name}
            maxLength={100}
            required
            className={`${INPUT} mt-1`}
          />
        </div>
        <Msg state={nameState} />
        <button type="submit" disabled={namePending} className={BTN_PRIMARY}>
          {namePending ? "Menyimpan…" : "Simpan nama"}
        </button>
      </form>

      <form action={pwAction} className={`${CARD} space-y-4`}>
        <h2 className="font-semibold">Ganti kata sandi</h2>
        <div>
          <label htmlFor="pf-pw" className="text-sm font-medium">
            Kata sandi baru
          </label>
          <input
            key={`p-${pwState.nonce}`}
            id="pf-pw"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={minPassword}
            required
            className={`${INPUT} mt-1`}
          />
          <p className="mt-1 text-xs text-muted">
            Minimal {minPassword} karakter.
          </p>
        </div>
        <div>
          <label htmlFor="pf-pw2" className="text-sm font-medium">
            Ulangi kata sandi baru
          </label>
          <input
            key={`c-${pwState.nonce}`}
            id="pf-pw2"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={minPassword}
            required
            className={`${INPUT} mt-1`}
          />
        </div>
        <Msg state={pwState} />
        <button type="submit" disabled={pwPending} className={BTN_PRIMARY}>
          {pwPending ? "Menyimpan…" : "Ganti kata sandi"}
        </button>
      </form>
    </div>
  );
}
