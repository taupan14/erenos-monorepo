"use client";

import {
  Suspense,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { useSearchParams } from "next/navigation";
import { ACADEMIC_LEVELS } from "@erenos/shared";
import { cn } from "@/lib/cn";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Icon } from "@/components/ui/Icon";

type Variant = "admission" | "contact";
type Status = "idle" | "loading" | "ok" | "error";

const ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-inquiry`;

function LevelOptions() {
  const { m } = useI18n();
  return (
    <>
      <option value="">{m.forms.levelPlaceholder}</option>
      {ACADEMIC_LEVELS.map((l) => (
        <option key={l.code} value={l.code}>
          {m.levels.items[l.code].short}
        </option>
      ))}
    </>
  );
}

/** Pilihan jenjang yang terisi otomatis dari ?jenjang=<slug> (mis. /admisi?jenjang=sd). */
function PresetLevelSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const params = useSearchParams();
  const preset =
    ACADEMIC_LEVELS.find((l) => l.slug === params.get("jenjang"))?.code ?? "";
  return (
    <select {...props} defaultValue={preset}>
      <LevelOptions />
    </select>
  );
}

/**
 * Formulir → Edge Function `submit-inquiry`.
 * variant "admission": kartu putih (nama orang tua, kontak, nama calon siswa, jenjang, pesan).
 * variant "contact": gaya referensi (kolom abu-abu membulat, tombol pil dengan lingkaran panah).
 * Panggilan ikut terlacak NavigationProgress (URL /functions/v1/).
 */
export function InquiryForm({ variant }: { variant: Variant }) {
  const uid = useId();
  const { locale, m } = useI18n();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const contact = variant === "contact";

  const input = cn(
    "w-full min-h-12 px-4 text-[15px] text-ink placeholder:text-[#8791a8] focus:outline-2 focus:outline-primary",
    contact
      ? "rounded-xl border-0 bg-[#f1f3f7]"
      : "rounded-md border border-[#c5d1e8] bg-white",
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const get = (k: string) => String(fd.get(k) ?? "").trim();

    const email = get("email");
    const phone = get("phone");
    if (!email && !phone) {
      setErrors({ contact: m.forms.needContact });
      return;
    }

    const subject = get("subject");
    const message =
      contact && subject ? `${subject}\n\n${get("message")}` : get("message");

    setErrors({});
    setFormError("");
    setStatus("loading");
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
        },
        body: JSON.stringify({
          source: variant,
          parent_name: get("parent_name"),
          email: email || undefined,
          phone: phone || undefined,
          student_name: get("student_name") || undefined,
          interested_level: get("interested_level") || undefined,
          message,
          website: get("website"), // honeypot
          locale,
        }),
      });

      if (res.ok) {
        form.reset();
        setStatus("ok");
        return;
      }
      if (res.status === 422) {
        const body = (await res.json().catch(() => null)) as {
          fields?: Record<string, string>;
        } | null;
        setErrors(body?.fields ?? {});
        setStatus("error");
        return;
      }
      setFormError(
        res.status === 429 ? m.forms.errorTooMany : m.forms.errorGeneric,
      );
      setStatus("error");
    } catch {
      setFormError(m.forms.errorNetwork);
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div role="status" className="rounded-2xl bg-soft p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary text-white">
          <Icon name="send" size={26} />
        </div>
        <h3 className="font-serif text-2xl font-bold text-deep">
          {m.forms.successTitle}
        </h3>
        <p className="mt-2 text-muted">{m.forms.successText}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-bold text-primary underline underline-offset-4"
        >
          {m.forms.sendAnother}
        </button>
      </div>
    );
  }

  const Field = ({
    name,
    label,
    required,
    error,
    children,
  }: {
    name: string;
    label: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
  }) => (
    <div>
      <label
        htmlFor={`${uid}-${name}`}
        className="mb-1.5 block text-sm font-bold text-deep"
      >
        {label}
        {required && (
          <span aria-hidden className="text-[#a3271a]">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${uid}-${name}-err`} className="mt-1 text-xs text-[#a3271a]">
          {error}
        </p>
      )}
    </div>
  );
  const common = (name: string) => ({
    id: `${uid}-${name}`,
    name,
    className: input,
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? `${uid}-${name}-err` : undefined,
  });

  const SelectWrapper = ({ children }: { children: ReactNode }) => (
    <div className="relative">
      {children}
      {/* Ikon panah kustom - atur jarak kanan lewat class right-* */}
      <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-gray-500">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </span>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className={cn("grid gap-4", contact && "sm:grid-cols-2")}>
        <Field
          name="parent_name"
          label={contact ? m.forms.name : m.forms.parentName}
          required
          error={errors.parent_name}
        >
          <input
            {...common("parent_name")}
            type="text"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder={contact ? m.contact.namePlaceholder : undefined}
          />
        </Field>
        <Field
          name="email"
          label={m.forms.email}
          required={contact}
          error={errors.email ?? errors.contact}
        >
          <input
            {...common("email")}
            type="email"
            required={contact}
            autoComplete="email"
            placeholder={contact ? m.contact.emailPlaceholder : undefined}
          />
        </Field>
      </div>

      {contact ? (
        <Field name="subject" label={m.forms.subject}>
          <input
            {...common("subject")}
            type="text"
            maxLength={150}
            placeholder={m.contact.subjectPlaceholder}
          />
        </Field>
      ) : (
        <>
          <Field name="phone" label={m.forms.phone} error={errors.phone}>
            <input
              {...common("phone")}
              type="tel"
              autoComplete="tel"
              placeholder={m.contact.phonePlaceholder}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="student_name"
              label={m.forms.studentName}
              error={errors.student_name}
            >
              <input {...common("student_name")} type="text" maxLength={120} />
            </Field>
            <Field
              name="interested_level"
              label={m.forms.level}
              error={errors.interested_level}
            >
              <SelectWrapper>
                {/* useSearchParams butuh Suspense agar halaman Admisi tetap statis */}
                <Suspense
                  fallback={
                    <select
                      {...common("interested_level")}
                      className={`${common("interested_level").className} appearance-none bg-none pr-10`}
                      defaultValue=""
                    >
                      <LevelOptions />
                    </select>
                  }
                >
                  <PresetLevelSelect
                    {...common("interested_level")}
                    className={`${common("interested_level").className} appearance-none bg-none pr-10`}
                  />
                </Suspense>
              </SelectWrapper>
            </Field>
          </div>
        </>
      )}

      <Field
        name="message"
        label={m.forms.message}
        required
        error={errors.message}
      >
        <textarea
          {...common("message")}
          required
          minLength={5}
          maxLength={3800}
          rows={contact ? 5 : 4}
          placeholder={contact ? m.contact.messagePlaceholder : undefined}
          className={cn(input, "py-3")}
        />
      </Field>

      {/* Honeypot: disembunyikan dari pengguna; bot biasanya mengisinya */}
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] size-0 opacity-0"
      />

      <div aria-live="polite" className="min-h-5 text-sm text-[#a3271a]">
        {formError}
      </div>

      {contact ? (
        <button
          type="submit"
          disabled={status === "loading"}
          className="group inline-flex h-14 w-fit items-center gap-3 rounded-[14px] bg-accent pl-6 pr-2.5 text-sm font-bold text-deep transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60 motion-reduce:transition-none motion-reduce:hover:transform-none"
        >
          {status === "loading" ? m.forms.sending : m.forms.submitContact}
          <span className="flex size-[38px] items-center justify-center rounded-[10px] bg-deep text-accent transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none">
            <Icon name="arrow" size={20} />
          </span>
        </button>
      ) : (
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-accent px-6 text-xs font-bold uppercase tracking-[0.06em] text-deep disabled:opacity-60"
        >
          {status === "loading"
            ? m.forms.sending
            : `${m.forms.submitAdmission} →`}
        </button>
      )}
    </form>
  );
}
