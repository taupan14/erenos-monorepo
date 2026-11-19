"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/login/actions";

const FIELD =
  "mt-1.5 block h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {
    error: null,
  });

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={FIELD} />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={FIELD}
        />
      </div>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-700">
        {state.error}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-lg bg-accent text-sm font-semibold text-deep transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
