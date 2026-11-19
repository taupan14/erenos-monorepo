import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase untuk Client Components (sesi login disimpan di cookie). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
