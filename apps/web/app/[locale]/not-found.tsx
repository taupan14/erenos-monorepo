"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import { btnDark } from "@/lib/ui";

export default function NotFound() {
  const { m, href } = useI18n();
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6200]">
        {m.notFound.code}
      </p>
      <h1 className="font-serif text-4xl font-bold text-deep">
        {m.notFound.title}
      </h1>
      <p className="text-muted">{m.notFound.text}</p>
      <Link href={href("/")} className={btnDark}>
        {m.notFound.back}
      </Link>
    </div>
  );
}
