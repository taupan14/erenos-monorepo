// Gaya tombol bersama (lihat desain: emas, outline putih, outline biru tua, biru tua).
const base =
  "inline-flex min-h-11 items-center justify-center gap-2 border-[1.5px] border-transparent px-[22px] text-xs font-bold uppercase tracking-[0.06em] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none";

export const btnGold = `${base} bg-accent text-deep`;
export const btnOutlineLight = `${base} border-white text-white`;
export const btnOutlineDark = `${base} border-deep text-deep`;
export const btnDark = `${base} bg-deep text-white`;
