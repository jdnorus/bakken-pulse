import { isSupabaseConfigured } from "@/lib/data/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export function getDataClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  return createServerSupabaseClient();
}
