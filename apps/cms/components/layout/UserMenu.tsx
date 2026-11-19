"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/login/actions";

type Props = { initials: string; name: string; email: string; roleLabel: string };

export function UserMenu({ initials, name, email, roleLabel }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="user-menu"
        aria-label="Menu akun"
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-white outline-none ring-accent focus-visible:ring-2"
      >
        {initials}
      </button>
      {open && (
        <div
          id="user-menu"
          className="absolute right-0 top-12 w-72 rounded-xl border border-line bg-white p-4 text-ink shadow-[0_12px_32px_rgba(20,41,90,0.14)]"
        >
          <p className="font-semibold">{name}</p>
          <p className="mt-0.5 break-all text-sm text-muted">{email}</p>
          <span className="mt-2 inline-block rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-primary">
            {roleLabel}
          </span>
          <form action={signOut} className="mt-4 border-t border-line pt-3">
            <button
              type="submit"
              className="h-11 w-full rounded-lg border border-line text-sm font-medium hover:bg-soft"
            >
              Keluar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
