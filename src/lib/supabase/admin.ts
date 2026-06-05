import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import { getSupabaseServerKey, getSupabaseUrl } from "@/lib/supabase/env";

/** Service-role client for ingest / cron (server-only). */
export function createAdminSupabaseClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServerKey();

  if (!url || !key) {
    return null;
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
