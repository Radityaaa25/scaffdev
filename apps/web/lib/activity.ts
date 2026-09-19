import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Mencatat aktivitas admin ke activity_log via SECURITY DEFINER.
 * Kegagalan logging TIDAK BOLEH menggagalkan operasi utama.
 */
export async function logActivity(
  supabase: SupabaseClient,
  actorEmail: string | undefined,
  action: string,
  entity: "template" | "integrasi" | "referensi" | "admin",
  entityRef: string,
  detail?: string
): Promise<void> {
  try {
    await supabase.rpc("log_activity", {
      p_actor_email: actorEmail ?? "unknown",
      p_action: action,
      p_entity: entity,
      p_entity_ref: entityRef,
      p_detail: detail ?? null,
    });
  } catch {
    /* abaikan — log tidak boleh merusak response utama */
  }
}
