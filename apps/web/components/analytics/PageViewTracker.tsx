"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Aktif di produksi. Untuk mencoba di komputer sendiri, set NEXT_PUBLIC_TRACK_IN_DEV=1 di .env.local.
const ENABLED =
  process.env.NODE_ENV === "production" ||
  process.env.NEXT_PUBLIC_TRACK_IN_DEV === "1";

/** Mengirim satu kunjungan per perubahan halaman ke /api/hit. Menghormati Do Not Track. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!ENABLED) return;
    if (navigator.doNotTrack === "1") return;

    const body = JSON.stringify({ path: pathname });
    // sendBeacon tidak melewati window.fetch yang di-patch NavigationProgress
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/hit",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch("/api/hit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  }, [pathname]);

  return null;
}
