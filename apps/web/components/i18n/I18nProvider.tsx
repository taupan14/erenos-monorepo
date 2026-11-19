"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { localeHref, type Locale } from "@/lib/i18n";
import type { Messages } from "@/lib/messages";

type I18n = {
  locale: Locale;
  m: Messages;
  /** Path internal dengan awalan bahasa aktif. */
  href: (path?: string) => string;
};

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo<I18n>(
    () => ({
      locale,
      m: messages,
      href: (path = "/") => localeHref(locale, path),
    }),
    [locale, messages],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n harus dipakai di dalam <I18nProvider>.");
  return v;
}
