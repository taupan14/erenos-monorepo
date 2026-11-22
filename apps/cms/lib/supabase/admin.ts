import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase berhak penuh (service role) — HANYA untuk Server Actions/Route Handlers CMS
 * setelah memastikan pemanggilnya Super Admin. Jangan pernah diimpor ke Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diatur di environment CMS.",
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
