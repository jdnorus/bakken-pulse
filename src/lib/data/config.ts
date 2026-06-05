import type { DataSource } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export { isSupabaseConfigured };

export function dataSourceLabel(source: DataSource): string {
  return source === "supabase" ? "North Dakota data (Supabase)" : "Preview data (mock)";
}
