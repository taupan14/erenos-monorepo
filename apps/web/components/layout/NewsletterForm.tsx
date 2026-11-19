"use client";

import { useId, useState, type FormEvent } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";

type State = { status: "idle" | "loading" | "ok" | "error"; message?: string };

const ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/subscribe`;

/** Form berlangganan → Edge Function `subscribe`. Panggilan ini ikut terlacak NavigationProgress. */
export function NewsletterForm() {
  const id = useId();
  const { locale, m } = useI18n();
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setState({ status: "loading" });

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
        },
        body: JSON.stringify({
          email: String(data.get("email") ?? ""),
          website: String(data.get("website") ?? ""), // honeypot
          locale,
        }),
      });

      if (res.ok) {
        form.reset();
        setState({ status: "ok", message: m.newsletter.ok });
      } else if (res.status === 422) {
        setState({ status: "error", message: m.newsletter.invalid });
      } else if (res.status === 429) {
        setState({ status: "error", message: m.newsletter.tooMany });
      } else {
        setState({ status: "error", message: m.newsletter.error });
      }
    } catch {
      setState({ status: "error", message: m.newsletter.network });
    }
  }

  const loading = state.status === "loading";

  return (
    <form onSubmit={onSubmit}>
      <div className="mt-4 flex overflow-hidden rounded-md">
        <label htmlFor={`${id}-email`} className="sr-only">
          {m.newsletter.label}
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={m.newsletter.placeholder}
          className="min-h-11 min-w-0 flex-1 border-0 bg-white px-3 text-left text-sm text-ink placeholder:text-[#6b7794]"
        />
        {/* Honeypot: disembunyikan dari pengguna; bot biasanya mengisinya */}
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] size-0 opacity-0"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-deep px-4 text-[11px] font-bold tracking-wide text-white disabled:opacity-60"
        >
          {m.newsletter.submit}
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "mt-2 min-h-5 text-xs",
          state.status === "error" ? "text-[#a3271a]" : "text-[#3a4a6b]",
        )}
      >
        {loading ? m.newsletter.sending : state.message}
      </p>
    </form>
  );
}
