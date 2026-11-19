import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY belum diatur (lihat apps/web/.env.example).",
  );
}

/**
 * Client publik (peran anon, tanpa sesi login).
 * Dipakai di Server Components untuk membaca konten terbit; RLS memastikan
 * hanya baris berstatus 'published' yang terbaca. Tidak memakai cookies,
 * sehingga halaman tetap bisa statis + revalidate.
 */
export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
