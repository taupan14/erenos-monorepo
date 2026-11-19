"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@erenos/shared";

type Item = { href: string; label: string; ready: boolean; roles?: UserRole[] };

// ready=false → modul belum dibuat; tampil nonaktif. Ubah ke true saat modulnya selesai.
const NAV: Item[] = [
  { href: "/", label: "Dasbor", ready: true },
  { href: "/konten", label: "Konten", ready: true },
  { href: "/media", label: "Media", ready: true },
  { href: "/admisi", label: "Admisi", ready: false, roles: ["super_admin"] },
  { href: "/inquiry", label: "Inquiry", ready: false, roles: ["super_admin"] },
  { href: "/pelanggan", label: "Pelanggan", ready: false, roles: ["super_admin"] },
  { href: "/pengaturan", label: "Pengaturan", ready: true, roles: ["super_admin"] },
  { href: "/akun", label: "Akun", ready: false, roles: ["super_admin"] },
];

const BASE = "inline-flex h-16 items-center whitespace-nowrap border-b-[3px] px-3.5 text-sm font-medium";

export function NavLinks({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV.filter((i) => !i.roles || i.roles.includes(role));

  return (
    <nav aria-label="Navigasi utama" className="min-w-0 flex-1 overflow-x-auto">
      <ul className="flex items-center">
        {items.map((i) => {
          const active = i.href === "/" ? pathname === "/" : pathname.startsWith(i.href);
          return (
            <li key={i.href}>
              {i.ready ? (
                <Link
                  href={i.href}
                  aria-current={active ? "page" : undefined}
                  className={`${BASE} ${active ? "border-accent text-white" : "border-transparent text-white/80 hover:text-white"}`}
                >
                  {i.label}
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title="Segera hadir"
                  className={`${BASE} cursor-not-allowed border-transparent text-white/40`}
                >
                  {i.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
