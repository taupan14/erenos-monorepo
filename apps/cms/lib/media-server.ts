import type { PickedMedia } from "@/components/media/MediaPicker";
import type { createClient } from "@/lib/supabase/server";

/** Mengambil satu baris media (untuk nilai awal MediaPicker). */
export async function getPickedMedia(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: unknown,
): Promise<PickedMedia | null> {
  if (typeof id !== "string" || !id) return null;
  const { data } = await supabase.from("media").select("id, path, alt_text").eq("id", id).maybeSingle();
  return data ? { id: String(data.id), path: String(data.path), alt_text: data.alt_text ?? null } : null;
}
