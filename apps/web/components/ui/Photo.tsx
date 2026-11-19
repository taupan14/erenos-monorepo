import Image from "next/image";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

/**
 * Foto dari CMS (Supabase Storage). Bila belum ada gambar, tampil placeholder
 * bertema biru dengan ikon dan label. Induk HARUS `relative` dan punya ukuran
 * (placeholder dan gambar mengisi seluruh induk).
 */
export function Photo({
  src,
  alt,
  label,
  icon = "book",
  sizes = "100vw",
  priority = false,
  className,
}: {
  src?: string | null;
  alt: string;
  label?: string;
  icon?: IconName;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#dce5f5] px-3 text-center text-xs text-[#3a4a6b]",
        className,
      )}
    >
      <Icon name={icon} size={32} className="text-primary/60" />
      <span>{label ?? alt}</span>
    </div>
  );
}
