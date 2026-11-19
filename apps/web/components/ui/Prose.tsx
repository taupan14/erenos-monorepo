import { cleanHtml } from "@/lib/sanitize";
import { cn } from "@/lib/cn";

/** Merender HTML dari CMS secara aman (disanitasi). Gaya ada di .prose-erenos (globals.css). */
export function Prose({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const safe = cleanHtml(html);
  if (!safe.trim()) return null;
  return (
    <div
      className={cn("prose-erenos", className)}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
