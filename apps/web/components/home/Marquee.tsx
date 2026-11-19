import { cn } from "@/lib/cn";

// Dua baris teks berjalan (dekoratif). Baris 1 kanan → kiri: kata besar berpasangan ID/EN dengan simbol tambah emas.
// Baris 2 kiri → kanan: huruf kapital berjarak dengan titik emas. Variasi ukuran dibuat halus.
const ROW1: { text: string; size: number; outline?: boolean }[] = [
  { text: "Iman", size: 70 },
  { text: "Faith", size: 62, outline: true },
  { text: "Ilmu", size: 74 },
  { text: "Knowledge", size: 58, outline: true },
  { text: "Damai Sejahtera", size: 68 },
  { text: "Peace", size: 64, outline: true },
];
const ROW2 = [
  { text: "Erenos Christian School", size: 28 },
  { text: "KB–TK", size: 24 },
  { text: "SD", size: 26 },
  { text: "SMP", size: 24 },
  { text: "SMA", size: 26 },
  { text: "Growing in Faith & Knowledge", size: 28 },
  { text: "Bertumbuh dalam Iman & Ilmu", size: 24 },
];

function Plus() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="40"
      height="40"
      aria-hidden
      className="shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
    >
      <path d="M12 3v18M3 12h18" />
    </svg>
  );
}

function Track1() {
  return (
    <div className="marquee-track">
      {ROW1.map((w) => (
        <span key={w.text} className="flex items-center gap-10">
          <span
            className={cn(
              "font-serif font-bold leading-[1.05] whitespace-nowrap",
              w.outline ? "text-transparent" : "text-deep",
            )}
            style={{
              fontSize: `clamp(${Math.round(w.size * 0.5)}px, ${w.size / 12}vw, ${w.size}px)`,
              ...(w.outline
                ? { WebkitTextStroke: "1.5px var(--primary)" }
                : {}),
            }}
          >
            {w.text}
          </span>
          <Plus />
        </span>
      ))}
    </div>
  );
}

function Track2() {
  return (
    <div className="marquee-track">
      {ROW2.map((w) => (
        <span key={w.text} className="flex items-center gap-10">
          <span
            className="whitespace-nowrap font-semibold uppercase tracking-[0.2em] text-primary"
            style={{ fontSize: w.size }}
          >
            {w.text}
          </span>
          <span className="text-lg text-accent">●</span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div
      aria-hidden="true"
      className="marquee grid gap-5 overflow-hidden bg-white py-12"
    >
      <div className="marquee-row marquee-rtl">
        <Track1 />
        <Track1 />
      </div>
      <div className="marquee-row marquee-ltr">
        <Track2 />
        <Track2 />
      </div>
    </div>
  );
}
