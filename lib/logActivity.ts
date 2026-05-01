import { supabase } from "@/lib/supabaseClient";

/**
 * Logs an activity to the activity_log table in Supabase.
 */
export async function logActivity({
  workspace_id,
  user_id,
  user_name,
  action,
  element_name,
  element_type,
}: {
  workspace_id: string;
  user_id: string;
  user_name: string;
  action: string;
  element_name?: string | null;
  element_type?: string | null;
}) {
  if (!supabase) return { data: null, error: new Error("Supabase client not configured") };

  const { data, error } = await supabase.from("activity_log").insert([
    {
      workspace_id,
      user_id,
      user_name,
      action,
      element_name,
      element_type,
    },
  ]);

  return { data, error };
}
