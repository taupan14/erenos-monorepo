"use server";

import { supabase } from "@/lib/supabase";
import { UUID_RE } from "@/lib/uuid";

export type UnsubscribeState = {
  status: "idle" | "done" | "already" | "invalid" | "error";
};

/** Menjalankan fungsi SQL unsubscribe_by_token. Token adalah rahasia acak (UUID), jadi tidak bisa ditebak. */
export async function unsubscribeAction(
  _prev: UnsubscribeState,
  formData: FormData,
): Promise<UnsubscribeState> {
  const token = String(formData.get("token") ?? "");
  if (!UUID_RE.test(token)) return { status: "invalid" };

  const { data, error } = await supabase.rpc("unsubscribe_by_token", {
    p_token: token,
  });
  if (error) {
    console.error("[unsubscribe]", error.message);
    return { status: "error" };
  }
  if (data === "ok") return { status: "done" };
  if (data === "already") return { status: "already" };
  return { status: "invalid" };
}
