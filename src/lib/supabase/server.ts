import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import { getSupabaseServerKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Server-side client for data fetching in Server Components.
 * Use service role for ETL; anon/publishable key is sufficient for public read policies.
 */
export function createServerSupabaseClient(): SupabaseClient<Database> | null {
  const url = getSupabaseUrl();
  const key = getSupabaseServerKey();
  if (!url || !key) {
    return null;
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
