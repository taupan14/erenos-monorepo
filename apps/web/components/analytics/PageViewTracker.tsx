"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Mengirim satu kunjungan per perubahan halaman ke /api/track. Hanya aktif di produksi. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (navigator.doNotTrack === "1") return;

    const body = JSON.stringify({ path: pathname });
    // sendBeacon tidak melewati window.fetch yang di-patch NavigationProgress
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([body], { type: "application/json" }),
      );
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  }, [pathname]);

  return null;
}
