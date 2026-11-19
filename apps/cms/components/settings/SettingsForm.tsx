"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "@/app/(admin)/pengaturan/actions";
import { MediaPicker, type PickedMedia } from "@/components/media/MediaPicker";
import { BTN_PRIMARY, CARD, INPUT } from "@/components/ui/form";
import type { Field, Section } from "@/lib/settings-fields";

type Props = {
  section: Section;
  values: Record<string, unknown>;
  media: Record<string, PickedMedia>;
};

function Control({
  field,
  name,
  defaultValue,
  error,
}: {
  field: Field;
  name: string;
  defaultValue: string;
  error?: string;
}) {
  const aria = {
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${name}-err` : undefined,
  };
  if (field.kind === "textarea") {
    return <textarea id={name} name={name} rows={3} defaultValue={defaultValue} className={`${INPUT} h-auto py-2`} {...aria} />;
  }
  const type =
    field.kind === "int" ? "number" : field.kind === "url" ? "url" : field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : "text";
  return (
    <input
      id={name}
      name={name}
      type={type}
      inputMode={field.kind === "int" ? "numeric" : undefined}
      min={field.kind === "int" ? 0 : undefined}
      max={field.kind === "int" ? field.maxValue : undefined}
      defaultValue={defaultValue}
      className={INPUT}
      {...aria}
    />
  );
}

export function SettingsForm({ section, values, media }: Props) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {
    status: "idle",
    nonce: 0,
  });

  const val = (n: string) => state.values?.[n] ?? (values[n] == null ? "" : String(values[n]));
  const err = (n: string) => state.fieldErrors?.[n];

  return (
    <form action={action} className={`${CARD} min-w-0 flex-1`}>
      <input type="hidden" name="section" value={section.id} />
      <h2 className="font-serif text-xl font-semibold text-deep">{section.label}</h2>
      <p className="mb-6 mt-1 text-sm text-muted">{section.description}</p>

      <div className="space-y-5">
        {section.fields.map((f) => {
          if (f.kind === "toggle") {
            const checked = state.values ? state.values[f.name] === "on" : Boolean(values[f.name]);
            return (
              <div key={f.name}>
                <label className="flex items-center gap-3 font-medium">
                  <input
                    key={`${f.name}-${state.nonce}`}
                    type="checkbox"
                    name={f.name}
                    defaultChecked={checked}
                    className="h-5 w-5 accent-primary"
                  />
                  {f.label}
                </label>
                {f.hint && <p className="mt-1 text-sm text-muted">{f.hint}</p>}
              </div>
            );
          }

          if (f.kind === "media") {
            const cur = values[f.name];
            return (
              <div key={f.name}>
                <p className="mb-2 text-sm font-medium">{f.label}</p>
                <MediaPicker name={f.name} initial={typeof cur === "string" ? (media[cur] ?? null) : null} />
                {f.hint && <p className="mt-1.5 text-sm text-muted">{f.hint}</p>}
              </div>
            );
          }

          const cols = f.en ? ([[f.name, `${f.label} (Indonesia)`], [f.en, `${f.label} (English)`]] as const) : ([[f.name, f.label]] as const);
          return (
            <div key={f.name}>
              <div className={f.en ? "grid gap-4 md:grid-cols-2" : ""}>
                {cols.map(([n, label]) => (
                  <div key={n}>
                    <label htmlFor={n} className="text-sm font-medium">
                      {label}
                      {f.required && n === f.name && <span className="text-red-700"> *</span>}
                    </label>
                    <div className="mt-1">
                      <Control key={`${n}-${state.nonce}`} field={f} name={n} defaultValue={val(n)} error={err(n)} />
                    </div>
                    {err(n) && (
                      <p id={`${n}-err`} className="mt-1 text-sm text-red-700">
                        {err(n)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {f.hint && <p className="mt-1.5 text-sm text-muted">{f.hint}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-5">
        <button type="submit" disabled={pending} className={BTN_PRIMARY}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${state.status === "ok" ? "text-green-700" : "text-red-700"}`}
        >
          {state.message}
        </p>
      </div>
    </form>
  );
}
