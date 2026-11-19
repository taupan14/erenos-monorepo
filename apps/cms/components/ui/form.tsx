import type { ReactNode } from "react";

export const INPUT =
  "block w-full h-11 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-red-600";
export const BTN_PRIMARY =
  "inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-deep transition hover:brightness-95 disabled:opacity-60";
export const BTN_OUTLINE =
  "inline-flex h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink hover:bg-soft disabled:opacity-60";
export const CARD = "rounded-2xl border border-line bg-white p-5";

export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-deep">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2.5">{actions}</div>}
    </div>
  );
}
