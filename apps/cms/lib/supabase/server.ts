import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase untuk Server Components, Server Actions, dan Route Handlers.
 * Membawa sesi login staf dari cookie, jadi RLS berjalan sebagai pengguna tersebut.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Dipanggil dari Server Component (cookie read-only): aman diabaikan
            // selama sesi disegarkan di proxy (ditambahkan pada tahap autentikasi CMS).
          }
        },
      },
    },
  );
}
